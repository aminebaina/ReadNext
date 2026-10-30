import { Router, Request, Response } from 'express';
import { MAX_INPUT_ENTITIES, MAX_QUERY_LENGTH, AGE_BANDS, DEMO_PRESETS } from './config.ts';
import { qlooClient } from './qloo-client.ts';
import { runReadNextAgent, generateLLMOnlyBaseline } from './agent.ts';
import { dailyQuotaTracker } from './rate-limiter.ts';
import { AgeBandKey } from './types.ts';

export const apiRouter = Router();

/**
 * Health check & status endpoint (checks keys without leaking them).
 */
apiRouter.get('/health', (req: Request, res: Response) => {
  const qlooKey =
    process.env.QLOO_API_KEY ||
    process.env.QLOO_AP_KEY ||
    process.env.QLOO_KEY ||
    process.env.VITE_QLOO_API_KEY ||
    '';
  const hasQlooKey = Boolean(qlooKey && qlooKey.trim().length > 0);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  const quota = dailyQuotaTracker.getUsage();

  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      qloo: { configured: hasQlooKey, target: 'hackathon.api.qloo.com' },
      gemini: { configured: hasGeminiKey, model: process.env.GEMINI_MODEL || 'gemini-3.8-flash' },
    },
    quota,
  });
});

/**
 * 1-click popular demo presets for judges.
 */
apiRouter.get('/presets', (req: Request, res: Response) => {
  res.json({ presets: DEMO_PRESETS });
});

/**
 * Autocomplete entity search (Video Games and TV Shows).
 * Verified Qloo: pass explicit types (urn:entity:videogame, urn:entity:tv_show)
 * to avoid brands and disambiguate upfront.
 */
apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q : '';
    const typeFilter = req.query.type === 'videogame' || req.query.type === 'tv_show'
      ? req.query.type
      : 'all';

    const cleanQuery = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
    if (!cleanQuery || cleanQuery.length < 2) {
      res.json({ results: [] });
      return;
    }

    const results = await qlooClient.searchEntities(cleanQuery, typeFilter);
    res.json({ results });
  } catch (err: any) {
    console.error('API /search error:', err.message || err);
    res.status(500).json({
      error: 'Search operation failed',
      message: 'Unable to retrieve search results at this moment. Please try again.',
    });
  }
});

/**
 * Main agent recommendation endpoint.
 * Validates inputs: max 4 entities, allowed age bands, shortReads toggle.
 */
apiRouter.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { entities, ageBand, shortReadsOnly } = req.body || {};

    // 1. Validate ageBand
    const validAgeBands: AgeBandKey[] = ['primary', 'middle_grade', 'teens'];
    if (!ageBand || !validAgeBands.includes(ageBand)) {
      res.status(400).json({
        error: 'Invalid input',
        message: 'A valid age band is required: "primary", "middle_grade", or "teens".',
      });
      return;
    }

    // 2. Validate entities
    if (!Array.isArray(entities) || entities.length === 0) {
      res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide at least 1 favorite video game or TV show.',
      });
      return;
    }

    if (entities.length > MAX_INPUT_ENTITIES) {
      res.status(400).json({
        error: 'Input limit exceeded',
        message: `Maximum of ${MAX_INPUT_ENTITIES} seed interests allowed per query.`,
      });
      return;
    }

    const cleanEntities = entities.map((e: any) => ({
      entity_id: typeof e.entity_id === 'string' ? e.entity_id.trim().slice(0, 100) : '',
      name: typeof e.name === 'string' ? e.name.trim().slice(0, 80) : 'Unknown',
      types: Array.isArray(e.types) ? e.types.map(String) : [],
    }));

    // 3. Run the ReadNext Agent
    const result = await runReadNextAgent(cleanEntities, ageBand, Boolean(shortReadsOnly));
    res.json(result);
  } catch (err: any) {
    console.error('API /recommend error:', err.message || err);
    res.status(500).json({
      error: 'Recommendation processing error',
      message: err.message || 'An error occurred while compiling recommendations. Please retry.',
    });
  }
});

/**
 * Baseline LLM-only comparison endpoint.
 * Demonstrates Qloo's empirical taste-graph advantage over generic LLMs.
 */
apiRouter.post('/compare-llm', async (req: Request, res: Response) => {
  try {
    const { entities, ageBand, shortReadsOnly } = req.body || {};

    const validAgeBands: AgeBandKey[] = ['primary', 'middle_grade', 'teens'];
    if (!ageBand || !validAgeBands.includes(ageBand) || !Array.isArray(entities) || entities.length === 0) {
      res.status(400).json({ error: 'Invalid input parameters.' });
      return;
    }

    const cleanEntities = entities.slice(0, 4).map((e: any) => ({
      name: typeof e.name === 'string' ? e.name.trim().slice(0, 80) : 'Game/Show',
    }));

    const comparison = await generateLLMOnlyBaseline(cleanEntities, ageBand, Boolean(shortReadsOnly));
    res.json(comparison);
  } catch (err: any) {
    console.error('API /compare-llm error:', err.message || err);
    res.status(500).json({
      error: 'Comparison generation error',
      message: 'Failed to generate LLM-only comparison baseline.',
    });
  }
});
