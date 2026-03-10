# Build Plan

## Milestone 1 — Content Loop (Phase 1)
**Done when:** You open the app, tap "Refresh", and see 3–5 relevant, interesting facts about your current location.

| Step | Task | Packages to Install |
|------|------|---------------------|
| 1.1 | Build single-screen UI: Refresh button + scrollable fact list | — |
| 1.2 | Add location permission request + current coordinates fetch | expo-location |
| 1.3 | Implement Wikipedia GeoSearch → TextExtracts pipeline | — |
| 1.4 | Add Nominatim reverse geocode fallback for sparse areas | — |
| 1.5 | Add basic ranking (distance + extract length) | — |
| 1.6 | Display top 5 ranked facts in the feed | — |

Test with sample-locations.json coordinates in simulator before moving on.

## Milestone 2 — On-Device Install (Phase 2)
**Done when:** Locartefact is on your iPhone, you tap Refresh anywhere, and see real facts. Facts persist between app sessions.

| Step | Task | Packages to Install |
|------|------|---------------------|
| 2.1 | Run `npx expo prebuild --platform ios`, open in Xcode, sign + build to device | — |
| 2.2 | Test location fetch on physical iPhone (indoors + outdoors) | — |
| 2.3 | Create Supabase project + fact_feed table | @supabase/supabase-js |
| 2.4 | Save delivered facts to Supabase on each refresh | — |
| 2.5 | Load fact feed from Supabase on app open | — |
| 2.6 | Add delivery_history table for deduplication | — |

## Milestone 3 — Background Fact Delivery (Phase 3)
**Done when:** You toggle tracking on, put the phone in your pocket, and receive a notification about a nearby place.

| Step | Task | Packages to Install |
|------|------|---------------------|
| 3.1 | Add tracking toggle to Home screen | expo-task-manager |
| 3.2 | Register background location task (trigger on ~200m movement) | — |
| 3.3 | Implement local notifications for background facts | expo-notifications |
| 3.4 | Build session engine (location_sessions table) | — |
| 3.5 | Add stationary cadence: 1 fact/min, max 5/session | — |
| 3.6 | Session ends on movement >500m from center | — |

## Milestone 4 — Navigation + Polish (Phase 4)
**Done when:** App has proper tabs, settings work, and notifications feel helpful (not spammy) during a real drive.

| Step | Task |
|------|------|
| 4.1 | Add tab navigation: Home / Feed / Settings |
| 4.2 | Build Settings screen (radius, cadence, quiet hours) |
| 4.3 | Add user_settings table in Supabase |
| 4.4 | Add saved/favorited facts feature |
| 4.5 | Improve ranking with Wikidata notability signals |
| 4.6 | Add geographic context fallback for sparse areas |
| 4.7 | Tune anti-spam thresholds in real scenarios |
