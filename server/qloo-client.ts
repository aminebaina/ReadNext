import {
  QLOO_BASE_URL,
  UPSTREAM_TIMEOUT_MS,
  UPSTREAM_MAX_RETRIES,
  CACHE_TTL_SEARCH_MS,
  CACHE_TTL_INSIGHTS_MS,
} from './config.ts';
import { searchCache, insightsCache } from './cache.ts';
import { QlooEntity, CandidateBook, ExplainabilityItem } from './types.ts';

export class QlooApiClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      process.env.QLOO_API_KEY ||
      process.env.QLOO_AP_KEY ||
      process.env.QLOO_KEY ||
      process.env.VITE_QLOO_API_KEY ||
      '';
  }

  private hasKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Internal HTTP GET helper with timeout, single retry, and secret scrubbing.
   */
  private async getWithRetry(url: string, retryCount = 0): Promise<any> {
    if (!this.hasKey()) {
      throw new Error('QLOO_API_KEY is not configured on the server. Please set it in your environment or Secrets panel.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
          'Accept': 'application/json',
          'User-Agent': 'ReadNext-App/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Qloo API authentication failed. Please verify your Qloo Hackathon API key.');
        }

        // Retry once on 5xx errors
        if (response.status >= 500 && retryCount < UPSTREAM_MAX_RETRIES) {
          await new Promise((res) => setTimeout(res, 400));
          return this.getWithRetry(url, retryCount + 1);
        }

        let errorDetails = '';
        try {
          const errText = await response.text();
          errorDetails = errText.slice(0, 300);
        } catch {
          // ignore
        }
        throw new Error(`Qloo API responded with HTTP status ${response.status}${errorDetails ? `: ${errorDetails}` : ''}`);
      }

      const json = await response.json();
      return json;
    } catch (err: any) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        if (retryCount < UPSTREAM_MAX_RETRIES) {
          return this.getWithRetry(url, retryCount + 1);
        }
        throw new Error('Qloo upstream service timed out after 8 seconds. Please try again.');
      }

      // If it is another network glitch and we haven't retried yet
      if (retryCount < UPSTREAM_MAX_RETRIES && !err.message?.includes('authentication')) {
        await new Promise((res) => setTimeout(res, 400));
        return this.getWithRetry(url, retryCount + 1);
      }

      // Scrub any sensitive URLs or traces
      const safeMessage = err.message || 'Failed to communicate with Qloo upstream API';
      throw new Error(safeMessage.replace(this.apiKey, '[REDACTED]'));
    }
  }

  /**
   * Search entities (Video Games or TV Shows).
   * Verified: Always pass explicit types (urn:entity:videogame or urn:entity:tv_show)
   * because untyped search resolves popular names as brands.
   */
  async searchEntities(
    query: string,
    typeFilter?: 'videogame' | 'tv_show' | 'all'
  ): Promise<QlooEntity[]> {
    const trimmed = query.trim().slice(0, 60);
    if (!trimmed) return [];

    const cacheKey = `search:${typeFilter || 'all'}:${trimmed.toLowerCase()}`;
    const cached = searchCache.get<QlooEntity[]>(cacheKey);
    if (cached) return cached;

    const typesToQuery: string[] = [];
    if (!typeFilter || typeFilter === 'all' || typeFilter === 'videogame') {
      typesToQuery.push('urn:entity:videogame');
    }
    if (!typeFilter || typeFilter === 'all' || typeFilter === 'tv_show') {
      typesToQuery.push('urn:entity:tv_show');
    }

    const aggregated: QlooEntity[] = [];

    // Query each type to ensure high relevance and avoid brand collisions
    for (const type of typesToQuery) {
      const url = `${QLOO_BASE_URL}/search?query=${encodeURIComponent(trimmed)}&types=${encodeURIComponent(type)}&take=5`;
      try {
        const data = await this.getWithRetry(url);
        if (Array.isArray(data?.results)) {
          for (const item of data.results) {
            if (item && item.entity_id && item.name) {
              aggregated.push({
                entity_id: item.entity_id,
                name: item.name,
                types: item.types || [type],
                popularity: item.popularity,
                properties: item.properties,
              });
            }
          }
        }
      } catch (err) {
        // If one type search fails, still proceed with whatever we have
        console.error('Qloo search partial error:', err instanceof Error ? err.message : String(err));
      }
    }

    // Deduplicate by entity_id
    const seen = new Set<string>();
    const deduplicated: QlooEntity[] = [];
    for (const ent of aggregated) {
      if (!seen.has(ent.entity_id)) {
        seen.add(ent.entity_id);
        deduplicated.push(ent);
      }
    }

    // Cache results for 24h
    searchCache.set(cacheKey, deduplicated, CACHE_TTL_SEARCH_MS);
    return deduplicated;
  }

  /**
   * Recommend Books using Qloo /v2/insights.
   * Verified parameters:
   * filter.type=urn:entity:book
   * signal.interests.entities=<id1>,<id2>
   * filter.tags=<tag ids, comma separated>
   * filter.exclude.tags=<tag ids>
   * take=20
   * feature.explainability=true
   */
  async recommendBooks(
    entityIds: string[],
    filterTags: string[],
    excludeTags: string[],
    take = 20
  ): Promise<{ books: CandidateBook[]; explainabilityRaw: Record<string, ExplainabilityItem[]> }> {
    if (!entityIds || entityIds.length === 0) {
      return { books: [], explainabilityRaw: {} };
    }

    const cleanIds = entityIds.slice(0, 4);
    const sortedTags = [...filterTags].sort().join(',');
    const sortedExcludes = [...excludeTags].sort().join(',');
    const cacheKey = `insights:${cleanIds.sort().join(',')}:${sortedTags}:${sortedExcludes}:${take}`;

    const cached = insightsCache.get<{ books: CandidateBook[]; explainabilityRaw: Record<string, ExplainabilityItem[]> }>(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    params.set('filter.type', 'urn:entity:book');
    params.set('signal.interests.entities', cleanIds.join(','));
    if (filterTags.length > 0) {
      params.set('filter.tags', filterTags.join(','));
    }
    if (excludeTags.length > 0) {
      params.set('filter.exclude.tags', excludeTags.join(','));
    }
    params.set('take', Math.min(take, 30).toString());
    params.set('feature.explainability', 'true');

    const url = `${QLOO_BASE_URL}/v2/insights?${params.toString()}`;
    const data = await this.getWithRetry(url);

    const candidates: CandidateBook[] = [];
    const explainabilityMap: Record<string, ExplainabilityItem[]> = {};

    // Parse explainability if present:
    // query.explainability["signal.interests.entities"] = [{entity_id, score 0-1}]
    // Or per-entity explainability in results.entities[].explainability
    const globalExplainability: ExplainabilityItem[] = [];
    if (Array.isArray(data?.query?.explainability?.['signal.interests.entities'])) {
      for (const item of data.query.explainability['signal.interests.entities']) {
        if (item && item.entity_id) {
          globalExplainability.push({
            entity_id: item.entity_id,
            score: typeof item.score === 'number' ? item.score : 0.5,
          });
        }
      }
    }

    const entities = data?.results?.entities || data?.results || [];

    if (Array.isArray(entities)) {
      for (const item of entities) {
        if (!item || !item.entity_id) continue;

        const props = item.properties || {};
        const title = props.title || item.name || 'Untitled Book';
        const description = props.description || '';
        const pageCount = typeof props.page_count === 'number' && props.page_count > 0 ? props.page_count : null;
        const pubYear = typeof props.publication_year === 'number' ? props.publication_year : undefined;
        const isbn = props.isbn13 || undefined;
        const imageUrl = props.image?.url || undefined;
        const publisher = props.publisher || undefined;
        const author = props.author || undefined;
        const language = props.language || 'en';

        // Check for entity-level explainability or fallback to global
        let itemScores: ExplainabilityItem[] = [];
        if (Array.isArray(item.explainability?.['signal.interests.entities'])) {
          itemScores = item.explainability['signal.interests.entities'];
        } else if (globalExplainability.length > 0) {
          itemScores = globalExplainability;
        } else {
          // Even split if explainability array was empty
          itemScores = cleanIds.map((id) => ({ entity_id: id, score: 1 / cleanIds.length }));
        }

        candidates.push({
          entity_id: item.entity_id,
          title,
          author,
          description,
          page_count: pageCount,
          publication_year: pubYear,
          isbn13: isbn,
          image_url: imageUrl,
          publisher,
          language,
          explainability: itemScores,
          popularity: item.popularity,
          rawTags: Array.isArray(props.genres) ? props.genres : [],
        });
      }
    }

    const result = { books: candidates, explainabilityRaw: explainabilityMap };
    insightsCache.set(cacheKey, result, CACHE_TTL_INSIGHTS_MS);
    return result;
  }

  /**
   * Search tags (for dynamic genre exploration or relaxation).
   */
  async findTags(query: string): Promise<{ tag_id: string; name: string }[]> {
    const trimmed = query.trim().slice(0, 40);
    if (!trimmed) return [];

    const url = `${QLOO_BASE_URL}/v2/tags?query=${encodeURIComponent(trimmed)}&take=10`;
    try {
      const data = await this.getWithRetry(url);
      const tags = data?.results?.tags || data?.results || [];
      if (Array.isArray(tags)) {
        return tags.map((t: any) => ({
          tag_id: t.tag_id || t.id || '',
          name: t.name || '',
        })).filter((t: any) => Boolean(t.tag_id && t.name));
      }
    } catch {
      // Non-fatal
    }
    return [];
  }
}

export const qlooClient = new QlooApiClient();
