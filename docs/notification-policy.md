> **Implementation phase:** Phase 3. Do not implement notifications until Milestones 1 and 2 are complete. The manual refresh prototype must work first.

# Notification Policy

## Delivery Rules
- **First fact:** Delivered when entering a new location session.
- **Stationary facts:** One additional fact every ~1 minute while stationary.
- **Session limit:** Maximum 5 facts per session.
- **Early stop:** If remaining candidates are weak or user moves away.
- **Manual refresh:** Bypasses cooldown timer.

## Quiet Hours
- Configurable start/end time in settings.
- No notifications during quiet hours; facts still queue silently.

## Anti-Spam Principles
- Never deliver duplicate facts (dedupe by entity_key + location_hash).
- Decrease cadence if fact quality drops below threshold.
- Session ends on significant movement (configurable threshold).
