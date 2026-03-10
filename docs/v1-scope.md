# V1 Scope

## What V1 Is
A single-screen prototype that proves the content loop: tap refresh → see relevant facts about nearby places.

## Included
- Personal use only
- iPhone first
- React Native + Expo (TypeScript)
- Local install from Xcode (free Apple Account)
- GitHub for docs, config, and source control
- Manual refresh button → fetch nearby facts → display in scrollable list
- Facts sourced from Wikipedia GeoSearch + TextExtracts API
- Reverse geocode fallback via Nominatim for sparse areas
- Basic ranking by distance + article length (notability proxy)
- Top 5 facts displayed per refresh
- React state only for prototype (no database yet)

## Excluded from V1
- App Store / TestFlight distribution
- Map view
- Navigation / multi-screen layout (added in Phase 4)
- Category filtering (Wikipedia doesn't return categories natively)
- Supabase persistence (added in Phase 2 after on-device install)
- Background location tracking (added in Phase 3)
- Notifications (added in Phase 3)
- Restaurant / business discovery
- Audio narration
- Offline caching
- Multi-user support

## Why this scope
The riskiest assumption is whether Wikipedia's free APIs return facts that feel interesting and relevant for a given location. Everything else — persistence, notifications, background tracking — is implementation work that only matters if the content is good. This scope isolates and tests that assumption first.
