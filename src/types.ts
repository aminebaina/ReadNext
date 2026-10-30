export type AgeBandKey = 'primary' | 'middle_grade' | 'teens';

export interface SelectedEntity {
  entity_id: string;
  name: string;
  types: string[];
}

export interface ExplainabilityItem {
  entity_id: string;
  score: number;
}

export interface SafetyEvaluation {
  suitable: boolean;
  concerns: string[];
  reading_effort: 'short' | 'medium' | 'long';
  teacher_note: string;
}

export interface RecommendedBook {
  entity_id: string;
  title: string;
  author?: string;
  description: string;
  page_count: number | null;
  publication_year?: number;
  isbn13?: string;
  image_url?: string;
  publisher?: string;
  language?: string;
  popularity?: number;
  safety: SafetyEvaluation;
  primaryInputScores: {
    entity_id: string;
    entity_name: string;
    entity_type: string;
    score: number;
  }[];
  whyRecommended: string;
}

export interface AgentStepLog {
  step: number;
  type: 'agent_call' | 'tool_call' | 'safety_gate' | 'retry_relaxation' | 'complete';
  toolName?: string;
  description: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface RecommendationResponse {
  success: boolean;
  books: RecommendedBook[];
  agentLogs: AgentStepLog[];
  meta: {
    ageBand: AgeBandKey;
    ageBandLabel: string;
    shortReadsOnly: boolean;
    totalCandidatesExamined: number;
    filteredOutByCodeGate: number;
    filteredOutBySafetyGate: number;
    relaxedRetryTriggered: boolean;
    toolCallCount: number;
    llmCallCount: number;
    executionTimeMs: number;
  };
  disclaimer: string;
}

export interface LLMOnlyBook {
  title: string;
  author: string;
  page_count: number | null;
  reading_effort: 'short' | 'medium' | 'long';
  teacher_note: string;
  whyRecommended: string;
}

export interface LLMComparisonResponse {
  success: boolean;
  books: LLMOnlyBook[];
  critique: {
    summary: string;
    qlooAdvantage: string;
  };
}
