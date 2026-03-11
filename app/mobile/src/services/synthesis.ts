import type { Fact } from '../types/place';
import { getApiKey } from './keystore';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are a local guide surfacing punchy, specific, conversation-ready facts about places.
Given multiple Wikipedia articles, return ONLY a JSON array with one sub-array per article (same order), each with 3 facts.
Rules:
- Do NOT restate the place name — the card title already shows it
- Concise but specific: numbers, dates, records, unusual history, or quirky details
- Correct capitalization, punctuation, no double spaces
- Avoid "It is..." or "Located in..."`;

export async function synthesizeFacts(facts: Fact[], interests: string[] = ['All']): Promise<Fact[]> {
  const API_KEY =
    (await getApiKey()) ?? process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  if (!API_KEY) {
    console.log('[synthesis] No API key — skipping synthesis');
    return facts;
  }
  if (facts.length === 0) return facts;

  const interestClause =
    interests.length > 0 && !interests.includes('All')
      ? `\nFocus on facts related to: ${interests.join(', ')}.\nIf an article has no facts matching these interests, return an empty array [] for that entry. Do NOT write placeholder text like "no X facts available".`
      : '';
  const systemPrompt = SYSTEM_PROMPT + interestClause;

  const userContent = facts
    .map((f, i) => `Article ${i + 1} title: ${f.title}\nArticle ${i + 1} excerpt:\n${f.extract.slice(0, 500)}`)
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
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!res.ok) {
      console.log(`[synthesis] API error ${res.status} — using extracts`);
      return facts;
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '';
    console.log('[synthesis] raw response:', text.slice(0, 200));

    // Claude sometimes wraps JSON in prose — extract the outermost array
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.log('[synthesis] No JSON array found in response — using extracts');
      return facts;
    }
    const parsed: unknown = JSON.parse(match[0]);

    if (!Array.isArray(parsed)) {
      console.log('[synthesis] Unexpected response shape — using extracts');
      return facts;
    }

    const hasInterestFilter = interests.length > 0 && !interests.includes('All');
    return facts.flatMap((fact, i) => {
      const entry = parsed[i];
      if (Array.isArray(entry) && entry.length === 0 && hasInterestFilter) {
        console.log(`[synthesis] "${fact.title}" → filtered (no matching interests)`);
        return [];
      }
      if (!Array.isArray(entry) || entry.length === 0) return [fact];
      const synthesizedFacts = (entry as unknown[])
        .filter((s): s is string => typeof s === 'string')
        .slice(0, 5);
      console.log(`[synthesis] "${fact.title}" → ${synthesizedFacts.length} facts`);
      return [{ ...fact, synthesizedFacts }];
    });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[synthesis] ${isAbort ? 'timeout' : 'error'}: ${msg} — using extracts`);
    return facts;
  } finally {
    clearTimeout(timeout);
  }
}
