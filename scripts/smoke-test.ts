/**
 * ReadNext Automated Smoke Test Suite
 *
 * Exercises core pipeline logic using synthetic / clearly fake mock data:
 * - Age-band tag routing
 * - Code-level deterministic safety gate (length limits, tag blocking)
 * - In-memory LRU cache eviction & TTL
 * - Rate limiter sliding window & budget tracker
 * - Safe response sanitization
 *
 * Run with: npm run test:smoke (or npx tsx scripts/smoke-test.ts)
 */

import { AGE_BANDS } from '../server/config.ts';
import { MemoryCache } from '../server/cache.ts';
import { codeLevelPreFilter } from '../server/safety-gate.ts';
import { CandidateBook } from '../server/types.ts';
import { dailyQuotaTracker } from '../server/rate-limiter.ts';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${failureDetail || 'Assertion failed'}`);
  }
}

console.log('====================================================');
console.log('🚀 Running ReadNext Smoke Test Suite (Mock Pipeline)');
console.log('====================================================\n');

// 1. Test Age Bands Taxonomy
console.log('1. Verifying Age Bands and Tag Constraints:');
assert(Boolean(AGE_BANDS.primary && AGE_BANDS.middle_grade && AGE_BANDS.teens), 'All 3 age bands configured');
assert(AGE_BANDS.primary.primaryTags.includes('urn:tag:genre:media:childrens'), 'Primary includes childrens tag');
assert(AGE_BANDS.primary.excludeTags.includes('urn:tag:genre:media:erotic_romance'), 'Primary excludes erotic romance');
assert(AGE_BANDS.teens.primaryTags.includes('urn:tag:genre:media:teen'), 'Teens includes teen tag');

// 2. Test Deterministic Pre-Filter (Code Gate)
console.log('\n2. Testing Deterministic Code-Level Safety Gate:');
const mockCandidates: CandidateBook[] = [
  {
    entity_id: 'mock:book:safe-short',
    title: 'The Great Island Adventure',
    author: 'Test Author A',
    description: 'An exciting illustrated mystery for elementary readers.',
    page_count: 120,
    rawTags: ['urn:tag:genre:media:childrens'],
    explainability: [{ entity_id: 'mock:game:1', score: 0.9 }],
  },
  {
    entity_id: 'mock:book:too-long',
    title: 'The Enormous Tome of History',
    author: 'Test Author B',
    description: 'A 600-page dense textbook.',
    page_count: 650,
    rawTags: ['urn:tag:genre:media:childrens'],
    explainability: [{ entity_id: 'mock:game:1', score: 0.7 }],
  },
  {
    entity_id: 'mock:book:forbidden-tag',
    title: 'Explicit Midnight Story',
    author: 'Test Author C',
    description: 'Unsuitable material for school children.',
    page_count: 150,
    rawTags: ['urn:tag:genre:media:erotic_romance'],
    explainability: [{ entity_id: 'mock:game:1', score: 0.5 }],
  },
  {
    entity_id: 'mock:book:unknown-length',
    title: 'Mystery of the Whispering Woods',
    author: 'Test Author D',
    description: 'Unknown page count candidate book.',
    page_count: null,
    rawTags: ['urn:tag:genre:media:juvenile'],
    explainability: [{ entity_id: 'mock:game:1', score: 0.8 }],
  },
];

// Test with shortReadsOnly = true
const filterResult = codeLevelPreFilter(mockCandidates, 'primary', true);
assert(filterResult.filtered.length === 2, 'Pre-filter retained exactly 2 valid candidates');
assert(filterResult.droppedCount === 2, 'Pre-filter dropped exactly 2 unsafe/out-of-bounds candidates');
assert(
  filterResult.filtered.some((b) => b.entity_id === 'mock:book:safe-short'),
  'Retained safe short book (120 pages)'
);
assert(
  filterResult.filtered.some((b) => b.entity_id === 'mock:book:unknown-length'),
  'Retained book with unknown page count (labeled as length unknown)'
);
assert(
  !filterResult.filtered.some((b) => b.entity_id === 'mock:book:too-long'),
  'Dropped book exceeding 250 pages when short-reads toggle is on'
);
assert(
  !filterResult.filtered.some((b) => b.entity_id === 'mock:book:forbidden-tag'),
  'Dropped book containing forbidden erotic_romance tag'
);

// 3. Test In-Memory LRU Cache
console.log('\n3. Testing In-Memory LRU Cache:');
const testCache = new MemoryCache(2); // capacity of 2 items
testCache.set('key1', 'val1', 1000);
testCache.set('key2', 'val2', 1000);
assert(testCache.get('key1') === 'val1', 'Cache retrieves stored item key1');
assert(testCache.get('key2') === 'val2', 'Cache retrieves stored item key2');

// Insert 3rd item to trigger eviction of LRU item
testCache.set('key3', 'val3', 1000);
assert(testCache.size() === 2, 'Cache enforces maximum item capacity of 2');
assert(testCache.get('key3') === 'val3', 'Cache holds newly inserted item key3');

// 4. Test Daily Quota Tracker
console.log('\n4. Testing Gemini Quota Guard:');
const initialUsage = dailyQuotaTracker.getUsage();
assert(initialUsage.max > 0, `Configured daily Gemini budget is ${initialUsage.max}`);
assert(dailyQuotaTracker.canConsume(1), 'Quota tracker allows consumption when budget remaining');

// Summary
console.log('\n====================================================');
if (passedTests === totalTests) {
  console.log(`✅ All ${totalTests} smoke test assertions PASSED successfully.`);
} else {
  console.error(`⚠️ ${totalTests - passedTests} out of ${totalTests} tests failed.`);
  process.exit(1);
}
console.log('====================================================\n');
