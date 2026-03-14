import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Fact } from '../types/place';
import { getApiKey } from './keystore';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are a local lore guide — like a brilliant local friend who knows the hidden stories, drama, and surprising history behind nearby places.
Given Wikipedia articles, return ONLY a JSON array with one sub-array per article (same order), each with 2-3 facts.
Each fact must be a punchy talking point someone can say out loud to friends while walking past:
- Lead with the most dramatic or unexpected angle: battles, deaths, scandals, record-breaking feats, famous residents, pivotal discoveries, or bizarre coincidences
- Be specific: names, numbers, dates, outcomes, and why it matters
- Prefer the lesser-known story over the obvious summary
- Do NOT restate the place name — the card already shows it
- Do NOT open with "It is...", "Located in...", or generic description
- Correct capitalization and punctuation, no filler
- Never reference the source article, excerpt, or your own knowledge limits — do not say "the article doesn't mention", "based on the excerpt", or "I don't have information about". Write confidently with what's available.`;

const CATEGORY_LORE: Record<string, string> = {
  'History':            'For History: battles fought here, who won and lost, casualties, treaties signed, kingdoms that rose or fell.',
  'Science & Tech':     'For Science & Tech: discoveries or inventions made here, who made them, what changed as a result.',
  'Arts & Culture':     'For Arts & Culture: artists, writers, or architects who lived/worked here, masterpieces created, movements born.',
  'Music':              'For Music: musicians who lived, performed, or recorded here, famous concerts, cultural significance.',
  'Society & Politics': 'For Society & Politics: assassinations, protests, laws enacted, scandals, pivotal political events.',
  'Nature & Geography': 'For Nature & Geography: size, age, geological origin, records (highest, oldest, largest), ecological rarities.',
  'Trivia & Quirky':    'For Trivia & Quirky: bizarre coincidences, unexpected records, local legends, surprising historical connections.',
};

// Per-fact cache: key = `${pageId}|${interestKey}`
// synthesizedFacts = null means Claude confirmed this fact doesn't match the interest filter
const STORAGE_KEY = '@geolore_synthesis_v3';
const SYNTHESIS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const factCache = new Map<string, { synthesizedFacts: string[] | null; ts: number }>();
let cacheLoaded = false;

async function loadCacheFromStorage(): Promise<void> {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries: [string, { synthesizedFacts: string[] | null; ts: number }][] = JSON.parse(raw);
    const now = Date.now();
    for (const [k, v] of entries) {
      if (now - v.ts < SYNTHESIS_CACHE_TTL_MS) {
        factCache.set(k, v);
      }
    }
    console.log(`[synthesis] loaded ${factCache.size} cached fact(s) from storage`);
  } catch {}
}

async function persistCacheToStorage(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...factCache.entries()]));
  } catch {}
}

export async function synthesizeFacts(facts: Fact[], interests: string[] = ['All']): Promise<Fact[]> {
  await loadCacheFromStorage();
  const API_KEY =
    (await getApiKey()) ?? process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  if (!API_KEY) {
    console.log('[synthesis] No API key — skipping synthesis');
    return facts;
  }
  if (facts.length === 0) return facts;

  const interestKey = [...interests].sort().join(',');
  const result: Fact[] = [];
  const uncached: Fact[] = [];

  // Split into per-fact cache hits and misses
  for (const f of facts) {
    const hit = factCache.get(`${f.pageId}|${interestKey}`);
    if (hit && Date.now() - hit.ts < SYNTHESIS_CACHE_TTL_MS) {
      if (hit.synthesizedFacts !== null) {
        result.push({ ...f, synthesizedFacts: hit.synthesizedFacts });
        console.log(`[synthesis] "${f.title}" → cache hit`);
      } else {
        console.log(`[synthesis] "${f.title}" → cached as filtered`);
        // omit — confirmed not matching this interest
      }
    } else {
      uncached.push(f);
    }
  }

  if (uncached.length === 0) {
    console.log('[synthesis] all facts served from per-fact cache');
    return result;
  }

  console.log(`[synthesis] calling API for ${uncached.length} uncached fact(s)`);

  const hasInterestFilter = interests.length > 0 && !interests.includes('All');
  const interestClause = hasInterestFilter
    ? `\nFocus only on facts related to: ${interests.join(', ')}. If an article has no matching facts, return [] for that entry.\n` +
      interests.filter((i) => CATEGORY_LORE[i]).map((i) => CATEGORY_LORE[i]).join(' ')
    : '';
  const systemPrompt = SYSTEM_PROMPT + interestClause;

  const userContent = uncached
    .map((f, i) => `Article ${i + 1} title: ${f.title}\nArticle ${i + 1} excerpt:\n${f.extract.slice(0, 300)}`)
    .join('\n\n---\n\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!res.ok) {
      console.log(`[synthesis] API error ${res.status} — using extracts for uncached facts`);
      return [...result, ...uncached];
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '';
    console.log('[synthesis] raw response:', text.slice(0, 200));

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.log('[synthesis] No JSON array found — using extracts for uncached facts');
      return [...result, ...uncached];
    }
    const parsed: unknown = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) {
      console.log('[synthesis] Unexpected response shape — using extracts for uncached facts');
      return [...result, ...uncached];
    }

    uncached.forEach((fact, i) => {
      const entry = parsed[i];
      const key = `${fact.pageId}|${interestKey}`;
      if (Array.isArray(entry) && entry.length > 0) {
        const synthesizedFacts = (entry as unknown[])
          .filter((s): s is string => typeof s === 'string')
          .slice(0, 5);
        console.log(`[synthesis] "${fact.title}" → ${synthesizedFacts.length} facts`);
        result.push({ ...fact, synthesizedFacts });
        factCache.set(key, { synthesizedFacts, ts: Date.now() });
      } else if (hasInterestFilter && Array.isArray(entry) && entry.length === 0) {
        console.log(`[synthesis] "${fact.title}" → filtered (no matching interests)`);
        factCache.set(key, { synthesizedFacts: null, ts: Date.now() });
        // omit from result — confirmed not matching
      } else {
        // No synthesis produced (e.g. malformed entry) — include original, don't cache
        result.push(fact);
      }
    });

    void persistCacheToStorage();
    return result;
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[synthesis] ${isAbort ? 'timeout' : 'error'}: ${msg} — using extracts for uncached facts`);
    return [...result, ...uncached];
  } finally {
    clearTimeout(timeout);
  }
}
