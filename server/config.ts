import { AgeBandConfig, AgeBandKey } from './types.ts';

// Qloo hackathon base URL ONLY (staging/production reject hackathon keys)
export const QLOO_BASE_URL = 'https://hackathon.api.qloo.com';

// Fast, high-availability Flash-class Gemini model
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
export const GEMINI_FALLBACK_MODEL = 'gemini-3.8-flash';

// Agentic operational constraints
export const MAX_AGENT_TOOL_CALLS = 6;
export const MAX_AGENT_LLM_CALLS = 3;
export const TARGET_RECOMMENDATIONS_MIN = 3;
export const TARGET_RECOMMENDATIONS_MAX = 8;
export const MAX_INPUT_ENTITIES = 4;
export const MAX_QUERY_LENGTH = 60;

// Security & Quota limits
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS_PER_IP = 10; // 10 req / min
export const UPSTREAM_TIMEOUT_MS = 8000; // 8 seconds per request
export const UPSTREAM_MAX_RETRIES = 1;
export const DAILY_GEMINI_BUDGET = parseInt(process.env.DAILY_GEMINI_BUDGET || '500', 10);

// In-memory cache TTLs
export const CACHE_TTL_SEARCH_MS = 24 * 60 * 60 * 1000; // 24 hours for autocomplete search
export const CACHE_TTL_INSIGHTS_MS = 60 * 60 * 1000; // 1 hour for recommendations

// Age band mappings according to verified Qloo tag taxonomy
export const AGE_BANDS: Record<AgeBandKey, AgeBandConfig> = {
  primary: {
    id: 'primary',
    label: 'Primary / Elementary (Ages 6–10)',
    ageRange: '6–10',
    description: 'Early chapter books, illustrated fiction, engaging high-interest stories suitable for elementary readers.',
    primaryTags: [
      'urn:tag:genre:media:childrens',
      'urn:tag:genre:media:juvenile',
    ],
    relaxedTags: [
      'urn:tag:genre:media:childrens',
      'urn:tag:genre:media:juvenile',
      'urn:tag:genre:media:middle_grade',
    ],
    excludeTags: [
      'urn:tag:genre:media:erotic_romance',
      'urn:tag:genre:media:erotica',
      'urn:tag:genre:media:horror',
    ],
    maxAppropriateAge: 10,
  },
  middle_grade: {
    id: 'middle_grade',
    label: 'Middle School (Ages 11–14)',
    ageRange: '11–14',
    description: 'Middle-grade fiction, high-adventure, mystery, fantasy, and coming-of-age stories with age-appropriate themes.',
    primaryTags: [
      'urn:tag:genre:media:middle_grade',
      'urn:tag:genre:media:juvenile',
    ],
    relaxedTags: [
      'urn:tag:genre:media:middle_grade',
      'urn:tag:genre:media:juvenile',
      'urn:tag:genre:media:teen',
    ],
    excludeTags: [
      'urn:tag:genre:media:erotic_romance',
      'urn:tag:genre:media:erotica',
    ],
    maxAppropriateAge: 14,
  },
  teens: {
    id: 'teens',
    label: 'Young Adult / Teens (Ages 14–18)',
    ageRange: '14–18',
    description: 'Rich young adult literature, speculative fiction, contemporary realism, and complex narratives suitable for high school.',
    primaryTags: [
      'urn:tag:genre:media:teen',
      'urn:tag:genre:media:young_adult',
      'urn:tag:genre:media:young_adult_fantasy',
    ],
    relaxedTags: [
      'urn:tag:genre:media:teen',
      'urn:tag:genre:media:young_adult',
      'urn:tag:genre:media:young_adult_fantasy',
    ],
    excludeTags: [
      'urn:tag:genre:media:erotic_romance',
      'urn:tag:genre:media:erotica',
    ],
    maxAppropriateAge: 18,
  },
};

// Curated 1-click popular examples for judges with verified Qloo UUIDs
export const DEMO_PRESETS = [
  {
    id: 'minecraft',
    label: 'Minecraft (Solo)',
    ageBand: 'primary' as AgeBandKey,
    shortReads: true,
    entities: [
      {
        entity_id: 'CDBDE254-71F0-4640-8D04-5373BEAE5278',
        name: 'Minecraft',
        types: ['urn:entity:videogame'],
        category: 'videogame',
      },
    ],
    description: 'Elementary student obsessed with sandbox crafting and wilderness survival.',
  },
  {
    id: 'roblox-pokemon',
    label: 'Roblox + Pokémon',
    ageBand: 'middle_grade' as AgeBandKey,
    shortReads: false,
    entities: [
      {
        entity_id: '9B672F6C-FF11-4E1E-A00F-96B9EA0BC82D',
        name: 'Roblox',
        types: ['urn:entity:videogame'],
        category: 'videogame',
      },
      {
        entity_id: 'EE970D24-1E57-4F69-9FB0-BFE072D96918',
        name: 'Pokémon',
        types: ['urn:entity:tv_show'],
        category: 'tv_show',
      },
    ],
    description: 'Middle schooler who loves multiplayer adventure, pet collecting, and creature lore.',
  },
  {
    id: 'zelda-avatar',
    label: 'Zelda + Avatar: The Last Airbender',
    ageBand: 'teens' as AgeBandKey,
    shortReads: false,
    entities: [
      {
        entity_id: 'D21F5B40-10B4-48A8-830D-DD82EC3A6E77',
        name: 'The Legend of Zelda',
        types: ['urn:entity:videogame'],
        category: 'videogame',
      },
      {
        entity_id: '088692C7-5BF8-4663-BC58-60D03A1A2A5A',
        name: 'Avatar: The Last Airbender',
        types: ['urn:entity:tv_show'],
        category: 'tv_show',
      },
    ],
    description: 'High school student drawn to deep mythological world-building, elemental magic, and heroes journey.',
  },
];
