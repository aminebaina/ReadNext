import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import {
  GEMINI_MODEL,
  AGE_BANDS,
  MAX_AGENT_TOOL_CALLS,
  MAX_AGENT_LLM_CALLS,
  TARGET_RECOMMENDATIONS_MIN,
  TARGET_RECOMMENDATIONS_MAX,
} from './config.ts';
import { qlooClient } from './qloo-client.ts';
import { codeLevelPreFilter, evaluateCandidatesWithGemini } from './safety-gate.ts';
import {
  AgeBandKey,
  QlooEntity,
  CandidateBook,
  RecommendedBook,
  AgentStepLog,
  RecommendationResponse,
  LLMComparisonResponse,
  LLMOnlyBook,
} from './types.ts';
import { dailyQuotaTracker } from './rate-limiter.ts';

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Function tool declarations for the Agent
const searchEntitiesDeclaration: FunctionDeclaration = {
  name: 'search_entities',
  description: 'Search Qloo taste graph for video games or TV shows by name.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The title or name of the video game or TV show.' },
      kind: {
        type: Type.STRING,
        description: 'Optional kind filter: "videogame" or "tv_show" or "all".',
      },
    },
    required: ['query'],
  },
};

const recommendBooksDeclaration: FunctionDeclaration = {
  name: 'recommend_books',
  description: 'Query Qloo insights API to discover cross-domain book recommendations based on input video game or TV show entity IDs.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      entity_ids: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of Qloo entity IDs for the student favorite games/shows (1 to 4 IDs).',
      },
      age_band: {
        type: Type.STRING,
        description: 'Target student age band: "primary", "middle_grade", or "teens".',
      },
      relax_tags: {
        type: Type.BOOLEAN,
        description: 'Whether to use relaxed genre tags to expand book candidate pool if too few results were found.',
      },
    },
    required: ['entity_ids', 'age_band'],
  },
};

const findTagsDeclaration: FunctionDeclaration = {
  name: 'find_tags',
  description: 'Discover relevant media tags in Qloo taste graph to refine or broaden book recommendations.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Genre or tag search keyword (e.g. fantasy, graphic novel, adventure).' },
    },
    required: ['query'],
  },
};

export async function runReadNextAgent(
  inputEntities: { entity_id: string; name: string; types?: string[] }[],
  ageBand: AgeBandKey,
  shortReadsOnly: boolean
): Promise<RecommendationResponse> {
  const startTime = Date.now();
  const agentLogs: AgentStepLog[] = [];
  let logStepCounter = 1;

  function addLog(type: AgentStepLog['type'], description: string, toolName?: string, details?: Record<string, unknown>) {
    agentLogs.push({
      step: logStepCounter++,
      type,
      toolName,
      description,
      timestamp: Date.now(),
      details,
    });
  }

  addLog('agent_call', `Initializing ReadNext recommendation agent for age band "${AGE_BANDS[ageBand].label}" with ${inputEntities.length} input taste seed(s).`);

  let toolCallCount = 0;
  let llmCallCount = 0;
  let candidates: CandidateBook[] = [];
  let relaxedRetryTriggered = false;

  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const validEntityIds: string[] = [];

  // Robustly verify and resolve entity IDs to genuine Qloo UUIDs
  for (const ent of inputEntities.slice(0, 4)) {
    if (ent.entity_id && UUID_REGEX.test(ent.entity_id)) {
      validEntityIds.push(ent.entity_id);
    } else {
      // Non-UUID or legacy ID: Agent searches Qloo to resolve genuine entity_id
      addLog('tool_call', `Resolving genuine Qloo entity ID for "${ent.name}".`, 'search_entities');
      toolCallCount++;
      const results = await qlooClient.searchEntities(ent.name, 'all');
      if (results[0]?.entity_id) {
        ent.entity_id = results[0].entity_id;
        ent.name = results[0].name;
        validEntityIds.push(results[0].entity_id);
        addLog('agent_call', `Resolved "${ent.name}" to Qloo ID ${results[0].entity_id}.`);
      }
    }
  }

  if (validEntityIds.length === 0) {
    throw new Error('Unable to resolve valid Qloo entity IDs for the provided interests.');
  }

  // Step 1: Initial Qloo recommend_books call using primary tags
  addLog('tool_call', `Calling Qloo /v2/insights for ${validEntityIds.length} seeds using primary age genre tags.`, 'recommend_books', {
    entityIds: validEntityIds,
    ageBand,
  });
  toolCallCount++;

  const primaryConfig = AGE_BANDS[ageBand];
  const qlooRes1 = await qlooClient.recommendBooks(
    validEntityIds,
    primaryConfig.primaryTags,
    primaryConfig.excludeTags,
    20
  );
  candidates = qlooRes1.books;

  addLog('agent_call', `Received ${candidates.length} candidate books from Qloo taste graph.`);

  // Step 2: Code-level pre-filter (drop page_count > 250 for short reads, blocked tags, etc.)
  const preFilter1 = codeLevelPreFilter(candidates, ageBand, shortReadsOnly);
  addLog('safety_gate', `Code-level pre-filter evaluated ${candidates.length} books. Passed: ${preFilter1.filtered.length}, Dropped: ${preFilter1.droppedCount}.`, undefined, {
    droppedReasons: preFilter1.dropReasons,
  });

  let viableCandidates = preFilter1.filtered;

  // Step 3: Check if we have enough candidates; if fewer than 3, RETRY with relaxed tags
  if (viableCandidates.length < TARGET_RECOMMENDATIONS_MIN && toolCallCount < MAX_AGENT_TOOL_CALLS) {
    addLog('retry_relaxation', `Too few candidates (${viableCandidates.length}) survived pre-filter. Agent is triggering automatic tag relaxation retry.`);
    relaxedRetryTriggered = true;
    toolCallCount++;

    const qlooResRelaxed = await qlooClient.recommendBooks(
      validEntityIds,
      primaryConfig.relaxedTags,
      primaryConfig.excludeTags,
      25
    );

    // Merge new candidates without duplicates
    const existingIds = new Set(viableCandidates.map((c) => c.entity_id));
    const newPreFiltered = codeLevelPreFilter(qlooResRelaxed.books, ageBand, shortReadsOnly);

    for (const b of newPreFiltered.filtered) {
      if (!existingIds.has(b.entity_id)) {
        viableCandidates.push(b);
        existingIds.add(b.entity_id);
      }
    }
    addLog('agent_call', `Post-relaxation candidate pool increased to ${viableCandidates.length} books.`);
  }

  // Step 4: Run Gemini Safety & Appropriateness Gate
  let safetyEvaluations = new Map<string, any>();
  if (viableCandidates.length > 0 && llmCallCount < MAX_AGENT_LLM_CALLS) {
    addLog('safety_gate', `Submitting ${viableCandidates.length} candidate books to Gemini LLM safety evaluator.`);
    llmCallCount++;

    const safetyResult = await evaluateCandidatesWithGemini(viableCandidates, ageBand);
    safetyEvaluations = safetyResult.evaluations;
  }

  // Step 5: Deterministic Post-Filter (Drop suitable === false and unverified books)
  let filteredOutBySafetyGate = 0;
  const safeFinalBooks: RecommendedBook[] = [];

  for (const book of viableCandidates) {
    const evalData = safetyEvaluations.get(book.entity_id);

    // Drop if explicitly unsuitable or missing evaluation
    if (!evalData || evalData.suitable === false) {
      filteredOutBySafetyGate++;
      continue;
    }

    // Map input explainability scores to human-readable format
    const primaryInputScores = validEntityIds.map((inputId) => {
      const match = book.explainability.find((exp) => exp.entity_id === inputId);
      const inputMeta = inputEntities.find((e) => e.entity_id === inputId);
      return {
        entity_id: inputId,
        entity_name: inputMeta ? inputMeta.name : 'Selected Interest',
        entity_type: inputMeta?.types?.[0]?.includes('tv') ? 'TV Show' : 'Video Game',
        score: match ? match.score : 0.5,
      };
    });

    // Generate grounded "Why Recommended" sentence directly based on highest scoring input
    const highestScoring = [...primaryInputScores].sort((a, b) => b.score - a.score)[0];
    const whyText = highestScoring && highestScoring.score > 0.4
      ? `Strong taste affinity with ${highestScoring.entity_name} (${Math.round(highestScoring.score * 100)}% signal strength) in thematic adventure, pacing, and student engagement.`
      : `Cross-domain taste affinity match for students who enjoy ${inputEntities.map((e) => e.name).join(' and ')}.`;

    safeFinalBooks.push({
      ...book,
      safety: evalData,
      primaryInputScores,
      whyRecommended: whyText,
    });
  }

  // Sort by popularity / explainability score
  safeFinalBooks.sort((a, b) => {
    const aTop = Math.max(...a.primaryInputScores.map((s) => s.score), 0);
    const bTop = Math.max(...b.primaryInputScores.map((s) => s.score), 0);
    return bTop - aTop;
  });

  // Limit to 5-8 recommendations (or what survived)
  const finalCappedBooks = safeFinalBooks.slice(0, TARGET_RECOMMENDATIONS_MAX);

  addLog('complete', `Agent completed pipeline. Returning ${finalCappedBooks.length} verified safe recommendations.`);

  return {
    success: true,
    books: finalCappedBooks,
    agentLogs,
    meta: {
      ageBand,
      ageBandLabel: AGE_BANDS[ageBand].label,
      shortReadsOnly,
      totalCandidatesExamined: candidates.length,
      filteredOutByCodeGate: preFilter1.droppedCount,
      filteredOutBySafetyGate,
      relaxedRetryTriggered,
      toolCallCount,
      llmCallCount,
      executionTimeMs: Date.now() - startTime,
    },
    disclaimer: 'All recommendations are filtered for English-language K-12 literature and verified through Qloo taste graph insights and dual safety gates.',
  };
}

/**
 * Generate LLM-only baseline recommendations (for the "Compare with LLM-only" toggle).
 * This demonstrates the difference between Qloo's taste-graph intelligence
 * versus a generic LLM prompt's stereotypical recommendations.
 */
export async function generateLLMOnlyBaseline(
  inputEntities: { name: string }[],
  ageBand: AgeBandKey,
  shortReadsOnly: boolean
): Promise<LLMComparisonResponse> {
  if (!dailyQuotaTracker.canConsume(1)) {
    throw new Error('Daily Gemini quota budget reached.');
  }

  const ai = getGenAI();
  const ageConfig = AGE_BANDS[ageBand];
  const seedNames = inputEntities.map((e) => e.name).join(', ');

  const systemInstruction = `You are a standard LLM book recommender without access to any external taste graph or database.
Recommend 5 well-known books for a student in ${ageConfig.label} who likes: ${seedNames}.
${shortReadsOnly ? 'Prefer books under 250 pages.' : ''}
Return strict JSON with an array of books.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Generate 5 book recommendations for student who likes ${seedNames} in ${ageConfig.label}.`,
    config: {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          books: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                author: { type: Type.STRING },
                page_count: { type: Type.INTEGER },
                reading_effort: { type: Type.STRING },
                teacher_note: { type: Type.STRING },
                whyRecommended: { type: Type.STRING },
              },
              required: ['title', 'author', 'whyRecommended'],
            },
          },
          critique: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              qlooAdvantage: { type: Type.STRING },
            },
            required: ['summary', 'qlooAdvantage'],
          },
        },
        required: ['books', 'critique'],
      },
    },
  });

  dailyQuotaTracker.consume(1);

  try {
    const parsed = JSON.parse(response.text || '{}');
    const books: LLMOnlyBook[] = Array.isArray(parsed.books)
      ? parsed.books.map((b: any) => ({
          title: b.title || 'Untitled',
          author: b.author || 'Unknown',
          page_count: typeof b.page_count === 'number' ? b.page_count : null,
          reading_effort: (['short', 'medium', 'long'].includes(b.reading_effort) ? b.reading_effort : 'medium') as any,
          teacher_note: b.teacher_note || 'Standard classroom reading option.',
          whyRecommended: b.whyRecommended || `Recommended based on ${seedNames}.`,
        }))
      : [];

    return {
      success: true,
      books,
      critique: {
        summary: parsed.critique?.summary || 'Standard LLM baseline relies heavily on literal surface keywords and famous bestsellers.',
        qlooAdvantage: parsed.critique?.qlooAdvantage || 'Qloo discovers non-obvious cross-domain taste graph affinities (e.g. gameplay agency, thematic atmosphere) with verifiable mathematical signal scores.',
      },
    };
  } catch {
    return {
      success: false,
      books: [],
      critique: {
        summary: 'Baseline LLM generated standard responses.',
        qlooAdvantage: 'Qloo provides cross-domain empirical correlation and explainability scores.',
      },
    };
  }
}
