# Phase 7.1 Production Evidence — Most Used Carousel Visual & Motion Polish

**Project:** Personal Utility Hub  
**Production URL:** https://aodxx.github.io/Personal-Utility-Hub/  
**Implementation HEAD:** `0475f82f9fba7dd05abb2297a561926bb6e63a7d`  
**CI:** [31998196555](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31998196555)  
**Pages deploy:** [31998196579](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31998196579)

## Scope and invariants

Phase 7.1 changes only the visual and interaction layer of the existing Most Used carousel. The ranking algorithm, Top 5 limit, LocalStorage usage key, fallback order, route definitions, backend policy, analytics policy, and tool catalog metadata remain unchanged. No heavy slider library or new icon system was added.

The cards reuse the existing `ToolMetadata.icon` and `toolAssetIcon()` path used by the main catalog. Existing category assets remain the fallback path for metadata that does not have a dedicated tool sprite, so the carousel does not render an empty visual area.

## Automated production visual command

```bash
node scripts/phase71-production-visual.mjs
```

The command runs against the real GitHub Pages URL and captures the Home at 360 × 740, 412 × 915, and 1280 × 900. It captures initial Most Used sections, after-swipe mobile states, and after-next/after-previous desktop states.

**Result:** `SUMMARY | 13/13 passed`

| Production check | Result |
|---|---|
| Initial mobile 360 capture | Passed |
| Initial mobile 412 capture | Passed |
| Initial desktop 1280 capture | Passed |
| Every Most Used card has a visible tool visual | Passed |
| Mobile second-card scroll/peek state | Passed at 360 and 412 |
| Mobile five-dot indicator | Passed at 360 and 412 |
| Desktop next arrow changes scroll position | Passed |
| Desktop indicator changes after navigation | Passed |
| Desktop previous arrow remains usable | Passed |

## Visual review evidence

Section-focused screenshots were reviewed directly rather than relying only on DOM assertions.

| State | Evidence |
|---|---|
| 360 × 740 initial carousel | [`mobile-360-most-used-initial.png`](phase71-screenshots/mobile-360-most-used-initial.png) |
| 360 × 740 after swipe | [`mobile-360-after-swipe.png`](phase71-screenshots/mobile-360-after-swipe.png) |
| 412 × 915 initial carousel | [`mobile-412-most-used-initial.png`](phase71-screenshots/mobile-412-most-used-initial.png) |
| 412 × 915 after swipe | [`mobile-412-after-swipe.png`](phase71-screenshots/mobile-412-after-swipe.png) |
| 1280 × 900 initial carousel | [`desktop-1280-most-used-initial.png`](phase71-screenshots/desktop-1280-most-used-initial.png) |
| 1280 × 900 after next | [`desktop-1280-after-next.png`](phase71-screenshots/desktop-1280-after-next.png) |
| 1280 × 900 after previous | [`desktop-1280-after-previous.png`](phase71-screenshots/desktop-1280-after-previous.png) |

The reviewed mobile state shows a 5rem tool visual, a card width of approximately 78% of the carousel viewport, a visible next-card peek, stable two-line title/description rhythm, privacy badge, favorite control, arrow cue, and five-dot indicator. The reviewed desktop state shows four complete cards and a partial fifth card, desktop arrows, active-card emphasis, and no oversized blank area.

Detailed review notes are in [`phase71-visual-findings.md`](phase71-visual-findings.md).

## Definition of Done

| Requirement | Status |
|---|---:|
| Every Most Used card has a clear real/category asset | Passed |
| No missing visual area or placeholder-only card | Passed |
| Mobile next card visibly peeks | Passed |
| Native smooth scrolling, momentum, snap, scroll padding and overscroll containment | Passed |
| Snap/indicator feedback | Passed |
| Desktop previous/next controls with disabled edge states | Passed |
| Full-card navigation and favorite isolation | Passed |
| Active card emphasis without layout shift | Passed |
| Reduced motion preserves snap and removes meaningful animation | Passed |
| 360 × 740 and 412 × 915 | Passed |
| Desktop 1280 × 900 | Passed |
| No page horizontal overflow | Passed |
| Phase 6 regressions | Passed in full suite and production smoke |
| Most Used ranking logic unchanged | Passed by existing unit tests |
| CI and Pages | Passed |
| Production visual review | Passed |
