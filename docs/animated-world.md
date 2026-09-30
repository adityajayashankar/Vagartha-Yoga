# Live pixel world

The website draws its scenery and consistent yoga guide with reusable pixel geometry. No generated scene backgrounds or character screenshots are loaded. The hero, journey, about illustration and footer use the same renderer. Small service and booking motifs use original pixel SVG geometry without additional characters.

## Six independent layers

Each `PixelWorld` owns six stacked HTML canvases. Their logical resolution is bounded independently of device pixel ratio, and CSS `image-rendering: pixelated` preserves the authored square edges.

| Layer | Contents | Motion |
| --- | --- | --- |
| Sky | Dithered palette, sun, moon, stars and clouds | Daylight interpolation, cloud drift and star twinkle |
| Landscape | Mountain ridges, woodland, lake and mist | Slow parallax, water reflections and mist |
| Architecture | Terrace, tiles, balustrade, pavilion and trees | Medium parallax, leaves and curtains |
| Life | One articulated guide, mat, props, tea and lantern | Breathing, interpolated poses, hair, clothing and lamp flicker |
| Foreground | Planters, flowers and nearby leaves | Faster restrained parallax and wind |
| Atmosphere | Birds, petals and fireflies | Flight, drift and small light changes |

The guide transitions between calm sitting, opening breath, gentle practice, standing balance and seated meditation. `animation/character.ts` authors anticipation, uncrossing, foot placement, rising, weight transfer, balance and the return to sitting. A single opaque pair of legs uses two-bone inverse kinematics with constant segment lengths; seated and standing legs never crossfade. Arms release the stretch before moving into prayer. The existing face, hair, top, trousers and palette remain code-authored pixel geometry.

Character time and scroll pose samples advance at 10fps. Breathing uses a sequence of 5.4, 5.9 and 5.6 second cycles, with a shorter inhale, pause, longer exhale and rest. Chest expansion, shoulder lift and hand response are local; the body is never scaled to simulate breathing. Blinks follow an irregular authored phrase with a double blink. Hair and the top hem respond to weight transfer and settling, while a standing balance has tiny hip corrections above a planted foot.

The hero and final meditation can perform one 9.5-second levitation per mounted world: grounded preparation, rise, brief hold, slower descent and contact. It has a grounded changing shadow and ongoing breath, without a glow aura. Scroll withdrawal attenuates the lift continuously. The footer remains grounded. Returning to a completed scene does not continually retrigger levitation.

`animation/environment.ts` supplies different branch/leaf wind periods, individual dawn/dusk star visibility, irregular lamp light and sparse bird passages with four wing frames at 10fps. Clouds retain their positions through the day, the sun passes behind the landscape, and terrace shadows change direction and length. SVG service motifs animate individual leaf groups around a fixed stem, separate steam wisps, independently timed stars, moonlight and lantern light.

## Bounded journey

`DayJourney.tsx` owns the GSAP context. `JOURNEY` declares its 1100px desktop breakpoint, 104px header offset and 1600px scroll distance. A scrubbed normalized progress ref drives the camera, light and pose without React updates for every ambient frame. React changes only the active copy block and time indicator. Scene copy is separate from the art.

The pin ends after the night stage; normal document flow contains every business section afterward. A skip link goes directly to sessions. Resizing below the breakpoint or enabling reduced motion reverts pinning through GSAP matchMedia.

Mobile and tablet use compact vertical scenes. An IntersectionObserver selects the most visible moment; only that moment draws the guide. Desktop reduced-motion visitors use the same vertical layout with static scenes.

## Ambient animation and lifecycle

- Environment rendering retains the existing 24fps budget with a maximum logical canvas width of 1280 pixels. Character joints and secondary motion have a separate 10fps clock; GSAP and document scrolling retain browser frame timing.
- Each visible world has a local clock for breathing, tea steam, cloud drift, water and leaves, independent of scrolling.
- IntersectionObserver pauses offscreen scenes. The Page Visibility API pauses hidden tabs. Hidden responsive variants do not run animation loops.
- ResizeObserver updates scene dimensions without scaling to device pixel ratio.
- Reduced motion renders still geometry and removes the ambient loop, levitation and pinning.
- Unmounting cleans up every observer, listener, frame request and GSAP context.
- Footer scroll progress changes the night entrance. Hovering or focusing its booking link brightens the lantern and opens the mat slightly. Reduced motion keeps the scene still.

Descriptive labels accompany significant canvas illustrations. All content, navigation, disclosures and enquiry controls remain semantic HTML. The guide is symbolic artwork, not a portrait of Girija.

## Verification

`tests/pixel-world.spec.ts` compares actual pixels across all six layers during stationary scrolling, checks dawn-to-night light, footer pointer/keyboard behavior, offscreen pausing, reduced-motion freezing and all five mobile scenes. `tests/website.spec.ts` checks all requested viewport sizes, fragment targets, disclosures, links, story release, breakpoint cleanup and automated accessibility.

`tests/animation.spec.ts` checks constant limb lengths and joint continuity across 800 intermediate poses, ground contact, breathing/blink phases, and a complete browser-observed levitation followed by a grounded rest. `node scripts/observe-animation.mjs` records every chapter for ten stationary seconds, scrolls in both directions, and visits the service motifs, About illustration and footer. It saves timestamp-separated screenshots, contact sheets, rendered-frame/lift diagnostics and a WebM under `artifacts/animation-observation/`. Recordings are QA artifacts and are not loaded by the site.
