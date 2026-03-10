# Architecture

## High-Level Flow (Phase 1 — Manual Refresh Prototype)

```
User taps "Refresh"
  → expo-location: get current coordinates
  → Wikipedia GeoSearch API: find nearby article titles (radius 2000m, max 50)
  → If <3 results: Nominatim reverse geocode → Wikipedia search by area name
  → Wikipedia TextExtracts API: fetch first-paragraph summaries for top 10
  → Rank by distance + extract length (notability proxy)
  → Display top 5 in scrollable feed
```

## Wikipedia API Pipeline (Two Calls)

This is the most important technical detail in the app. Wikipedia GeoSearch does NOT return article content — only titles and coordinates. You need a second call to get the actual text.

### Call 1: GeoSearch
```
GET https://en.wikipedia.org/w/api.php
  ?action=query
  &list=geosearch
  &gscoord={lat}|{lon}
  &gsradius=2000
  &gslimit=50
  &format=json
```
Returns: array of `{ pageid, title, lat, lon, dist }`.

Max radius: 10,000m. Typical results: 10–50 in urban areas, 0–5 in rural areas.

### Call 2: TextExtracts (batch)
```
GET https://en.wikipedia.org/w/api.php
  ?action=query
  &pageids={id1}|{id2}|{id3}...
  &prop=extracts
  &exintro=true
  &explaintext=true
  &exsentences=3
  &format=json
```
Returns: extract text for each page. Batch up to 20 page IDs per request.

### Zero-Results Fallback
When GeoSearch returns fewer than 3 results (common in rural Hawaii, highways, remote areas):

1. Reverse geocode via Nominatim:
```
GET https://nominatim.openstreetmap.org/reverse
  ?lat={lat}&lon={lon}&format=json
```
Returns: area name, county, state, country.

2. Search Wikipedia for the area name:
```
GET https://en.wikipedia.org/w/api.php
  ?action=query
  &list=search
  &srsearch={area_name}
  &srlimit=10
  &format=json
```

3. Fetch extracts for those results using Call 2 above.

This provides broader geographic context like "You're in the Kohala Coast region of Hawaiʻi Island."

### Rate Limits
- Wikipedia API: no hard rate limit for reasonable use, but be respectful. Cache results per session.
- Nominatim: max 1 request/second, requires identifying User-Agent header. Do not call on every refresh — cache the reverse geocode per session.

## Data Storage Strategy

| Phase | Storage | What |
|-------|---------|------|
| Phase 1 (prototype) | React state only | Facts displayed during current session |
| Phase 2 (on-device) | Supabase | Persistent fact feed, delivery history, deduplication |
| Phase 3 (background) | Supabase | Location sessions, POI candidates, user settings |

### Supabase Tables (Created in Phase 2, not before)

**fact_feed** — id, title, fact_text, source_url, lat, lon, distance, delivered_at

**delivery_history** — entity_key, delivered_at, location_hash (for deduplication)

**location_sessions** — id, started_at, center_lat, center_lon, area_label, delivered_count, active (added Phase 3)

**poi_candidates** — id, session_id, title, source_type, lat, lon, distance, fact_text, relevance_score, delivered (added Phase 3)

**user_settings** — id, radius_meters, notification_interval_seconds, max_facts_per_session, quiet_hours_start, quiet_hours_end (added Phase 4)

## Key Expo Packages (install only when needed)

| Package | Phase | Purpose |
|---------|-------|---------|
| expo-location | Phase 1 | Foreground location fetch |
| @supabase/supabase-js | Phase 2 | Database persistence |
| expo-task-manager | Phase 3 | Background task registration |
| expo-notifications | Phase 3 | Local push notifications |
