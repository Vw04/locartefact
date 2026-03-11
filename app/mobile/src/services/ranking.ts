import type { Fact } from '../types/place';

export function rankFacts(facts: Fact[], maxResults = 10): Fact[] {
  const filtered = facts.filter(
    (f) => f.extract.length >= 50 && !f.title.includes('(disambiguation)')
  );

  const scored = filtered.map((f) => {
    const distanceScore = 1 / (1 + f.distance / 1000);
    const notabilityScore = Math.min(1, f.extract.length / 2000);
    const score = 0.7 * distanceScore + 0.3 * notabilityScore;
    console.log(`[ranking] ${f.title}: score=${score.toFixed(3)} (dist=${distanceScore.toFixed(3)}, notability=${notabilityScore.toFixed(3)})`);
    return { fact: f, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map((s) => s.fact);
}
