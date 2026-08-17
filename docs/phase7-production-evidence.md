# Phase 7 Production Evidence — Home Experience Optimization

**Project:** Personal Utility Hub  
**Production URL:** https://aodxx.github.io/Personal-Utility-Hub/  
**HEAD under verification:** `af70a90804a9b70a0884022dd51b1fa69b6ec437`  
**CI:** [31996233447](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31996233447)  
**Pages deploy:** [31996233427](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31996233427)

## Scope

Phase 7 changes only the Home experience. No new tools, backend, account system, analytics, cloud usage sync, remote usage tracking, or large carousel dependency was added. The existing `utility-hub:usage` LocalStorage key is reused, and usage counts remain part of the existing portable settings schema.

## Production smoke command

```bash
node scripts/phase7-production-smoke.mjs
```

The script uses Playwright against the real GitHub Pages URL and checks the Home at 360 × 740, Pixel 7-class 412 × 915, and desktop 1280 × 900 viewports. It clears test-local storage before fallback checks and seeds usage only for the ranking/reload check.

## Results

`SUMMARY | 38/38 passed`

| Area | Result |
|---|---|
| Home and 25-card catalog | Passed at all three viewports |
| Old large Trust Strip | Absent |
| Compact Trust Chips | 3 rendered, focus explanation passed |
| New-user fallback | 5 cards, curated order begins with Image Compressor |
| Native carousel | Horizontal scroll width and scroll-snap container passed |
| Compact card navigation | First card opened its tool route using keyboard Enter |
| Reset behavior | Usage reset returned to fallback |
| Localization | English `Your Most Used` rendered after locale switch |
| Usage ranking | Seeded Base64 count ranked first |
| Reload persistence | Seeded ranking survived reload |
| Page overflow | No horizontal page overflow at 360, 412, or 1280 widths |
| Phase 6 Privacy route | Passed |
| Phase 6 Guide | JSON guide opened and Escape closed it |

## Local quality evidence

The final CI workflow passed `npm ci`, typecheck, unit/integration tests, build, bundle budget, Playwright, npm audit, and Service Worker syntax validation. Local bundle metrics for this change were **33.7 KB entry gzip**, **366.1 KB largest lazy chunk**, and **977.3 KB JavaScript gzip across 36 chunks**. `npm audit --audit-level=high` reported **0 vulnerabilities**.

## Known limitations

The compact carousel relies on native horizontal scrolling rather than arrow controls. This keeps the implementation small and touch-friendly; the region itself is focusable and uses a visible scroll hint. Most Used is local personalization, not a global popularity or trending system. Clearing Most Used usage counts is separate from clearing Favorites, Recent, Locale, Theme, and GuideSeen state.
