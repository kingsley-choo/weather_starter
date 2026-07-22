• Following the prd-to-plan skill, I’ll use tracer-bullet vertical slices rather than
  splitting work into frontend/backend/test layers. The plan will be saved under plans/
  after you approve the breakdown. Skill instructions
  (https://raw.githubusercontent.com/mattpocock/skills/ab45d5e6e1733b7ae27a0795f2a86418c2d451a0/prd-to-plan/SKILL.md)

  Proposed phases:

  1. Find the nearest forecast area
      - Covers frontend nearest-area matching and coordinate handling.
      - Delivers a tested, deterministic nearest-area calculation using the existing
        forecast-area model.

  2. Add the happy-path location button
      - Covers successful browser geolocation.
      - Delivers: click button → obtain coordinates → find nearest area → add it →
        select it.

      - Includes duplicate prevention.

  3. Handle loading, errors, and button state
      - Covers waiting for forecast areas, disabled/loading state, geolocation
        failures, unsupported browsers, and toasts.

      - Ensures the button re-enables after every terminal outcome.