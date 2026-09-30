# The Handscroll

Local hero foundation only. Chapter artwork has **not** been commissioned or added. Awaken / Breathe / Flow / Rest and their short lines are provisional. The existing navigation, sections and enquiry flow remain in place. No deployment is part of this work.

## Files

| File | Responsibility |
| --- | --- |
| `../site/Hero.tsx` | Mounts the new hero in the existing page. |
| `Handscroll.tsx` | Server-rendered stage, four panels, live text, time chip, progress and breath ring. |
| `HandscrollController.tsx` | One scrubbed camera value, daylight/pose sampling, reveal, snap, visibility and cleanup. |
| `handscroll.css` | Paper tokens, layer positioning, portrait crops, text masks, shared CSS breath clock and static fallbacks. |
| `model.ts` | Chapter centres/copy, speeds and continuous daylight keys. |
| `FigureRig.tsx` | Reusable faceless SVG with eleven nested joint groups. |
| `poses.ts` | Mountain, reach and warrior test poses, expressed as local joint rotations. |
| `PlaceholderArt.tsx` | Only geometric layer placeholders, prepainted lighting and static fallback scenes. |
| `grain.ts` | Embedded 64 × 64 PNG, baked from stitched `feTurbulence`; no runtime filter. |
| `../../../scripts/bake-handscroll-grain.mjs` | Reproducible grain generation with the existing Sharp dependency. |
| `../../../scripts/check-handscroll-budget.mjs` | Production manifest/chunk gzip gate. Counts GSAP and shared route UI as a conservative upper bound. |
| `../../../scripts/observe-handscroll.mjs` | Timed desktop/mobile captures, videos, reduced-motion screenshot and isolated frame timing. |
| `../../../tests/handscroll.spec.ts` | Camera, edge coverage, daylight, input, breath, pause, accessibility, budgets, CLS and fallback checks. |
| `../../../tests/{website,animation,pixel-world}.spec.ts` | Existing checks updated for the new hero. |

## Scroll and scene contract

The outer section is 500svh and the CSS-sticky stage is 100svh. Its 400vw track contains four 100vw panels. CSS reserves all dimensions before hydration. Native scrolling drives a GSAP ScrollTrigger tween with `scrub: 0.8`; the tween's single `p` drives camera, time, pose and chapter UI. No wheel normalization, wheel cancellation or extra pin spacer is used.

| Layer | Travel multiplier | Width including travel |
| --- | ---: | ---: |
| sky | 0.15 | 145vw + 2px |
| far | 0.4 | 220vw + 2px |
| mid | 0.7 | 310vw + 2px |
| near / panel track | 1 | 400vw |
| foreground | 1.25 | 475vw + 2px |

Each layer translates by `-p * 300vw * multiplier`. Mobile retains the sticky stage, uses an aspect-preserving portrait crop, centres each figure at 50% of its panel and removes foreground parallax. The lower-left paper plane stays quiet; the foreground occupies only the bottom 4% to avoid crossing text during intermediate scroll positions.

Snap targets are exactly `[0, .33, .66, 1]`, with a 350ms `power2.inOut` tween, no inertia and a 950ms idle delay that lets the 800ms scrub settle. Both ScrollTrigger's built-in velocity guard and an explicit velocity/input/visibility guard gate it. Fresh wheel, touch, pointer or keyboard input interrupts snapping without cancelling native input. [ScrollTrigger reference](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

The four progress segments fill across the chapter's nearest-centre interval: `[0, .165]`, `[.165, .495]`, `[.495, .83]`, `[.83, 1]`. Chapter reveals use two counter-translated elements inside a stationary overflow mask, so the 700ms wipe animates transforms, not clip geometry. Departing copy fades in 200ms. Hidden chapter words are excluded from the accessibility tree; time is not an assertive live region.

## Time and motion contracts

`DAYLIGHT` maps `p = 0 / .33 / .66 / 1` to `05:50 / 07:10 / 10:30 / 19:30`. A single paused GSAP timeline interpolates every value continuously. The root exposes `--sky-top`, `--sky-bottom`, `--light-tint`, `--shadow-tint` and numeric `--sun-y` (in svh units). They are registered as non-inheriting properties to avoid invalidating the full panorama. Read these values on `.handscroll`; explicitly provide them on a future consuming element when needed.

The visible sky and light use prepainted gradients blended through opacity; the sun uses a transform. Do not bind a large live gradient or filter to an animated color variable. All visible motion is transform/opacity only. Flat offset duplicate paths supply small hard shadows.

For breathing, add `.hs-breath-clock` to a scene element and consume its local registered `--breath` value, from 0 to 1. Every consumer shares the same keyframes, duration, start and pause updates. Example: `transform: scaleY(calc(1 + var(--breath) * .012))`. The non-inheriting property confines recalculation to the consumer. The cycle is 10s with its peak at 40%: 4s inhale, 6s exhale, using the sine curve `cubic-bezier(.37, 0, .63, 1)`. Above 1000px/s scroll speed, the ring contracts and the cycle becomes 8s. After 600ms without scroll it returns to 10s. JavaScript only sets activity flags; CSS owns the clock.

The only ambient subjects are the cloud (32s round trip), figure breath and ring. Poses are sampled from the scroll timeline, not an extra ambient loop. An IntersectionObserver and Page Visibility listener pause ambient motion when the stage is outside the viewport or the tab is hidden. Listeners, observers, timers and GSAP state are removed on unmount or media-query changes.

With reduced motion, all four full-height scenes stack vertically with fixed daylight and server poses, no sticky stage, no parallax, no snap and no breathing. Each scene receives only a 300ms opacity fade on first entry. Disabling JavaScript also exposes the static stack, with dawn visible in the initial HTML. The existing Latin wordmark is retained; a Devanagari font will be needed if a future prompt introduces वागर्थ.

## Validation

Use the existing npm scripts. For a separate local production preview in PowerShell:

```powershell
$env:NEXT_DIST_DIR = '.next-production'
npm run build
$env:PORT = '3100'
npm run start
```

In a second terminal:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3100'
npm test
$env:NEXT_DIST_DIR = '.next-production'
node scripts/check-handscroll-budget.mjs
node scripts/observe-handscroll.mjs
```

Run observation alone for meaningful timing; its frame samples are collected without video recording. Screenshots, videos and `observation.json` go to `artifacts/handscroll/`. A throttled desktop Chromium run is diagnostic evidence, not proof of 60fps on a physical mid-range Android device. The visibility test uses a controlled Page Visibility event; offscreen pause, wheel, keyboard and touch are browser interactions.

Stop at this foundation. Subsequent chapter prompts should replace the placeholder geometry and provisional copy while retaining these contracts and budgets.
