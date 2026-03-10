# Build Plan

## Milestones

### Milestone 1 — Content Loop (Manual Refresh)
Open Locartefact → tap "Refresh Nearby Facts" → see 3–5 relevant facts in the feed based on current location. No background tracking, no notifications.

### Milestone 2 — On-Device Install
Install Locartefact on iPhone from Xcode. Confirm manual location refresh works on the physical device.

### Milestone 3 — First Background Fact
Turn on tracking, background the app, and receive at least one valid location-based fact notification.

## Build Sequence

| Step | Task | Phase |
|------|------|-------|
| 1 | Scaffold Expo app (TypeScript) | Phase 0 |
| 2 | Create Home / Feed / Settings navigation | Phase 1 |
| 3 | Add location permission + current location fetch | Phase 1 |
| 4 | Add nearby fact discovery (Wikipedia GeoSearch) | Phase 1 |
| 5 | Add fact ranking logic | Phase 1 |
| 6 | Build feed UI | Phase 1 |
| 7 | Add Supabase persistence | Phase 1 |
| 8 | Install on iPhone from Xcode (dev build) | Phase 2 |
| 9 | Add local notifications | Phase 3 |
| 10 | Add tracking sessions + stationary cadence | Phase 3 |

## Development Phases

### Phase 0 — Project Setup ← CURRENT
- Create repo structure and docs
- Scaffold Expo app
- Set up Supabase project (tables only, no functions yet)

### Phase 1 — Nearby Facts Prototype
- Manual location fetch → Wikipedia GeoSearch → ranked facts → feed UI
- Prove that the content loop works before adding background behavior

### Phase 2 — iPhone Deployment
- Create Expo development build
- Install on physical iPhone via Xcode
- Test location permissions on-device

### Phase 3 — Background Fact Engine
- Background location tracking
- Local notifications
- Session logic + stationary cadence
- Deduplication

### Phase 4 — Quality Tuning
- Ranking weight adjustments
- POI filtering improvements
- Geographic context enrichment
- Notification copy polish
