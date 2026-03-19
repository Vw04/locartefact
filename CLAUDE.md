# CLAUDE.md — Geolore

Guidance for Claude Code when working in this repository.

---

## Project Overview

**Geolore** (formerly Locartefact) is an Expo/React Native iOS app that discovers nearby Wikipedia articles and synthesizes them into punchy, conversational lore facts using Claude AI. The core loop: GPS → Wikipedia GeoSearch → rank → synthesize with Claude Haiku → display as swipeable fact cards.

- GitHub: https://github.com/Vw04/geolore
- Stack: Expo SDK 54, React Native, TypeScript, AsyncStorage
- Claude model: `claude-haiku-4-5-20251001` via direct REST API (no SDK)
- App entry: `app/mobile/App.tsx`

---

## File Map

```
app/mobile/
  App.tsx                          # Root: state, JIT synthesis flow, auto-refresh, slider, settings
  src/
    services/
      synthesis.ts                 # Claude API call, per-fact cache, system prompt
      wikipedia.ts                 # GeoSearch, page details, diverseSample(), cleanExtract()
      ranking.ts                   # rankFacts() — scores and deduplicates candidates
      location.ts                  # getCurrentLocation() — Expo Location wrapper
      keystore.ts                  # AsyncStorage helpers: API key, interests, onboarding, settings
    components/
      FactCard.tsx                 # Card UI: thumbnail float, expand/collapse, article link in expanded
      BrandLogo.tsx                # Geolore wordmark, size variants
      SettingsScreen.tsx           # Modal: interests chips, sort order, max facts, notifications
      onboarding/
        WelcomeScreen.tsx
        ApiKeyScreen.tsx
        InterestsScreen.tsx
    types/
      place.ts                     # Fact type definition
    data/
      sample-locations.json        # Dev city presets: Tokyo, Paris, Moscow, LA, Miami, Hong Kong
```

---

## Architecture Decisions

### Just-in-Time Synthesis
Only call the Claude API for facts currently visible to the user at the current radius + maxFacts slice. Never synthesize the full ranked pool upfront.

- `runWithCoords` computes `initialVisible` (ranked facts filtered by radius → sorted → sliced to maxFacts) and passes only those to `synthesizeFacts`.
- A `useEffect` on `[synthRadius, displaySettings.sortOrder, displaySettings.maxFacts]` synthesizes newly exposed facts incrementally when the user adjusts the slider or settings.

### Per-Fact Cache
Cache key: `` `${pageId}|${interestKey}` `` where `interestKey = [...interests].sort().join(',')`.
Value: `{ synthesizedFacts: string[] | null; ts: number }`.
- `null` means Claude confirmed this fact doesn't match the interest filter → omit from results (don't show raw extract).
- TTL: 7 days. Storage key: `@geolore_synthesis_v3`. Loaded from AsyncStorage on first `synthesizeFacts` call.

### RANK_POOL
- `interests.includes('All')` → pool of 20
- Specific interest filter → pool of 28 (more candidates for Claude to match against, no extra Wikipedia calls since `diverseSample` already fetches up to 30)

### Slider Debounce
- `onValueChange={setRadius}` — updates display label and `displayedFacts` in real time during drag.
- `onSlidingComplete={setSynthRadius}` — triggers the JIT synthesis `useEffect` only on release. Avoids per-tick API calls.
- `radius` and `synthRadius` are separate state variables.

### Auto-Refresh on Launch
No manual "Refresh" button. The startup `useEffect` is async: awaits all stored settings with `Promise.all`, sets state, then immediately fires location + `runWithCoords` with the loaded interests passed as `interestsOverride` (not read from state, which may not have settled yet).

### Stale Closure Pattern
`runWithCoords` is defined inside the component and captures state via closure. To call it from the startup `useEffect` with the correct interests before state settles:
1. A `runWithCoordsRef = useRef(null)` is updated to `runWithCoords` on every render.
2. `runWithCoords` accepts an optional `interestsOverride` param; the startup effect passes `savedInterests` directly.

### Interest Filter + Merge Logic
When a specific interest is active (`hasInterestFilter = !interests.includes('All')`), facts not matched by Claude are cached as `null` and excluded. Merge after synthesis:
```typescript
const merged = ranked
  .map(f => synthesizedMap.get(f.pageId) ?? (hasInterestFilter ? null : f))
  .filter((f): f is Fact => f !== null);
```

---

## Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| Background | `#0D2218` | App background, onboarding screens |
| Card | `#374635` | FactCard background, active chip |
| Surface | `#1A3828` | Info bar, button backgrounds |
| Text | `#FFFFF0` | All primary text (cream, not white) |
| Muted text | `rgba(255,255,240,0.55–0.85)` | Subtitles, distances, stats |
| Accent | `rgba(255,251,188,0.6)` | Footer link buttons (warm yellow-cream) |

**Never use teal (`#2A9D8F`) for active/selected state** — that was replaced with forest green (`#374635`).

### Typography
- Font: `Helvetica` throughout (no custom fonts loaded)
- Card title: 18px, weight 700
- Fact text / extract: 15px, lineHeight 22
- Distance / stats: 13–14px
- Footer buttons: 13px, weight 500, letterSpacing 0.3

### Spacing
- Card padding: 16, borderRadius: 14, marginBottom: 12
- Card footer borderTop: `rgba(255,255,255,0.1)`

---

## UX Principles

### Auto-load, no manual refresh
The app should act on its own. Don't add explicit "Refresh" or "Reload" buttons to the main screen. Auto-refresh on launch; auto-synthesize on slider release.

### JIT — only what the user sees
Never pre-synthesize more facts than are currently displayed. API cost and latency are the primary constraint on how the app feels.

### Card expand hierarchy
1. Collapsed card: synthesized facts (punchy, shareable)
2. Expanded: full Wikipedia extract + "Read full article" link at the bottom of the expanded section
3. Article link does NOT appear in the collapsed footer — it belongs after the user has read the extract

### Minimal footer
Collapsed card footer: `[Map (if hasGeoData)] [▼/▲]`. Nothing else. Article link only in expanded section.

### No accent bars on list items
Left-border accent bars (`borderLeftWidth`) on fact list items were tried and removed. They add visual noise on the dark card without benefit. Use `marginBottom: 8` between items instead.

---

## Synthesis Prompt Rules

These are enforced in `SYSTEM_PROMPT` in `src/services/synthesis.ts`:

- Facts must be punchy talking points, not summaries — someone should be able to say them out loud while walking past
- Lead with dramatic/unexpected angles: battles, deaths, scandals, records, famous residents
- Be specific: names, numbers, dates, outcomes
- Do NOT restate the place name
- Do NOT open with "It is...", "Located in...", or generic description
- **Do NOT acknowledge source limitations**: never say "the article doesn't mention", "based on the excerpt", or "I don't have information about". Write confidently with what's available.
- Return ONLY a JSON array of arrays — no markdown, no prose wrapper

---

## Wikipedia Extract Cleaning

`cleanExtract()` in `src/services/wikipedia.ts` is applied to every extract at fetch time:
- Removes parenthetical groups with non-Basic-Latin characters: `(東京, Tōkyō, /ˈtoʊkioʊ/)`
- Removes standalone CJK/Cyrillic runs of 2+ characters
- Removes standalone IPA in slashes: `/ˈtoʊkioʊ/`
- Removes square-bracket annotations: `[note 1]`, `[1]`
- Cleans up orphaned punctuation and double spaces

No Claude API call needed for this — pure regex at fetch time.

---

## React Native Gotchas

### CSS float doesn't exist
True text-wrap-around-image is impossible in RN without a custom text engine. Best approximation used in `FactCard.tsx`:
- Measure title+distance header height with `onLayout`
- If `headerH < IMAGE_H (80px)`: render facts with `paddingRight: 100` (beside image)
- If `headerH >= IMAGE_H`: render facts full-width (image already cleared)
- Initialize `headerH = IMAGE_H` to avoid layout flash

### useRef TypeScript
`useRef<T>()` with no argument fails strict TypeScript. Always use:
```typescript
useRef<T | null>(null)
```

### State batching on async startup
Multiple `setState` calls inside an async IIFE do not guarantee the next async operation sees the updated state. Pass values directly as parameters to downstream functions instead of reading them from state.

### Slider — don't call APIs on every tick
`onValueChange` fires on every frame during drag. Reserve API calls for `onSlidingComplete`. Keep display updates (`setRadius`) on `onValueChange`, synthesis triggers (`setSynthRadius`) on `onSlidingComplete`.

---

## Dev Workflow

### Dev bar (visible only in `__DEV__`)
A horizontal scrollbar at the top of the main screen contains:
- `↩ Onboarding` — reset to welcome screen
- `📍 Location` — trigger GPS refresh
- City buttons: Tokyo, Paris, Moscow, Los Angeles, Miami, Hong Kong — each calls `runWithCoords` with preset coordinates

City colors are defined in `DEV_CITY_COLORS` in `App.tsx`.

### Sample locations
`src/data/sample-locations.json` — add new cities here with `{ label, lat, lon }` and a color entry in `DEV_CITY_COLORS`.

### Cache busting during dev
The synthesis cache key is `@geolore_synthesis_v3`. To bust the cache during testing, increment the version suffix in `synthesis.ts` (`STORAGE_KEY`).
