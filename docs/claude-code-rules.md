# Claude Code Rules for Locartefact

## General Principles
- Build only what the current phase requires. Do not pre-build future phases.
- Use TypeScript everywhere.
- Prefer simple, flat file structure over deep nesting in V1.
- No unnecessary abstraction. One file per service is fine.
- Optimize for readability, not cleverness.

## Phase-Gating
- **Phase 1:** React state only. No Supabase. No navigation. One screen.
- **Phase 2:** Add Supabase for persistence. Add Xcode build path.
- **Phase 3:** Add background tracking, notifications, sessions.
- **Phase 4:** Add navigation, settings, polish.

Do NOT install packages from a later phase. Specifically:
- No `@supabase/supabase-js` until Phase 2
- No `expo-task-manager` until Phase 3
- No `expo-notifications` until Phase 3
- No `expo-router` or `react-navigation` until Phase 4

## API Rules
- Wikipedia API: always make two calls (GeoSearch for titles, TextExtracts for content). Never assume GeoSearch returns article text.
- Nominatim: include a descriptive User-Agent header (`Locartefact/1.0`). Max 1 request/second. Cache per session.
- Never invent facts. Every fact must trace to a Wikipedia source URL.

## Code Style
- Services go in `app/mobile/src/services/`
- Types go in `app/mobile/src/types/`
- Components go in `app/mobile/src/components/`
- Keep App.tsx under 100 lines — it should only orchestrate, not contain logic.

## Testing
- Use `data/sample-locations.json` coordinates for testing in the simulator.
- Always test the zero-results case (use coordinates in a remote area).
- Log ranking scores to console during development for debugging.
