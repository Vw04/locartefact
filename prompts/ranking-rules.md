# Fact Ranking Rules

## Phase 1 Ranking (Current)
Two factors only. Keep it simple until the content loop is proven.

| Factor | Weight | Description |
|--------|--------|-------------|
| Distance | 0.50 | Closer = higher score. Linear decay: score = 1 - (distance / radius). |
| Notability | 0.50 | Use Wikipedia extract length (character count) as proxy. Longer extract = more notable place. |

### Score Formula
```
score = (0.5 * distance_score) + (0.5 * notability_score)

distance_score = max(0, 1 - (distance_meters / radius_meters))
notability_score = min(1, extract_length / 2000)
```

### Filters (Exclude Before Ranking)
- Exclude if extract is empty or under 100 characters
- Exclude Wikipedia disambiguation pages (title contains "(disambiguation)")
- Exclude pages with no coordinates (GeoSearch already filters these)

## Phase 2+ Ranking (Future)
Add these dimensions when the basics work:

| Factor | Weight | Description |
|--------|--------|-------------|
| Distance | 0.25 | Same as above |
| Notability | 0.25 | Wikidata sitelinks count instead of extract length |
| Novelty | 0.25 | Penalize if entity_key appears in delivery_history |
| Source confidence | 0.15 | Wikipedia > Wikidata > OSM |
| Category relevance | 0.10 | Requires Wikidata classification — deferred |

## Tiebreakers
1. Closer distance wins
2. Longer extract wins
