# Fact Ranking Rules

## Scoring Dimensions

| Factor | Weight | Description |
|--------|--------|-------------|
| Distance | 0.25 | Closer = higher score. Decay beyond 2km. |
| Category relevance | 0.15 | Matches user's enabled categories. |
| Source confidence | 0.15 | Wikipedia > Wikidata > OSM for fact quality. |
| Notability | 0.25 | Wikipedia page length, inbound links, or Wikidata sitelinks as proxy. |
| Novelty | 0.20 | Penalize if entity_key was recently delivered. |

## Tiebreakers
1. Higher notability wins.
2. Closer distance wins.
3. More recent source update wins.

## Filters (Exclude Before Ranking)
- No Wikipedia disambiguation pages.
- No stubs (< 2KB page size).
- No entities already delivered in the current session.
- No entities delivered in the last 24 hours at the same location_hash.
