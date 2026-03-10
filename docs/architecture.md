# Architecture

## High-Level Flow

```
iPhone App (React Native / Expo)
  → Location Engine (expo-location, expo-task-manager)
  → POI Discovery Layer (Wikipedia GeoSearch, Wikidata, OSM/Nominatim)
  → Fact Ranking Engine
  → Notification Engine (expo-notifications)
  → Fact Feed Storage (Supabase)
```

## Key Expo Packages
- `expo-location` — foreground and background location tracking
- `expo-task-manager` — background task registration
- `expo-notifications` — local push notifications

## Data Storage

| Store | Purpose |
|-------|---------|
| Supabase (Postgres) | Fact feed history, session state, POI cache, delivery logs, user settings |
| GitHub | Project docs, prompt templates, category definitions, ranking rules, test locations, config |

## Data Sources (Free Tier)
- **Wikipedia GeoSearch** — nearby notable places by coordinates
- **Wikidata** — structured entity data for enrichment
- **OpenStreetMap / Nominatim** — reverse geocoding and geographic context

## Supabase Tables

### `user_settings`
id, radius_meters, notification_interval_seconds, max_facts_per_session, quiet_hours_start, quiet_hours_end, categories_enabled

### `location_sessions`
id, started_at, center_lat, center_lon, area_label, delivered_count, active

### `poi_candidates`
id, session_id, title, category, source_type, lat, lon, distance, fact_text, relevance_score, delivered

### `fact_feed`
id, session_id, title, fact_text, category, source_url, delivered_at, saved

### `delivery_history`
entity_key, delivered_at, location_hash (used for deduplication)
