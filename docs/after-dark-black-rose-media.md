# Black Rose Empress | Media integration manifest

Status: Rendered in Runway; visual QA and production integration pending.

| Asset | Runway task ID | Specs | State |
|---|---|---|---|
| Starting Soon illustration | `9dcd7057-4b1c-4882-b960-487885cce28c` | 16:9, 2K | Rendered, not yet approved |
| Camera surround illustration | `9c9cfe85-b2a3-44f0-8e3a-a0a50ccb1a74` | 16:9, 2K | Rendered, not yet cut out |
| Alert illustration | `a8e86589-e34f-4ee1-99b1-ee5952d7b7d3` | 16:9, 2K | Rendered, not yet approved |
| Starting Soon animation | `f33555a0-0800-42a1-9371-1cd3aa3a6551` | 1920x1080, 10 seconds, silent | Rendered, QA pending |
| Alert animation | `2d6525d9-84bc-4860-8103-b0c47e5ecd77` | 1920x1080, 5 seconds, silent | Rendered, QA pending |
| Transparent camera frame prototype | `assets/img/after-dark-black-rose-camera-frame.svg` | SVG viewBox 1920x1080, transparent center | Source committed, OBS QA pending |

## Production integration gates

1. Retrieve original finished assets directly from the connected Runway workspace by task ID. Do not commit short-lived signed delivery URLs, credentials, or tokens to GitHub.
2. Inspect each animation for anatomy drift, flicker, morphing, strange hands, facial changes, warped ornaments, unreadable detail, visual artifacts, and unintended text.
3. Test loop seams and file encoding. A seamless loop is not established by a successful render alone.
4. Optimize final videos for web delivery; provide a still poster and ensure reduced-motion and mobile fallbacks. Keep original quality masters separate.
5. For OBS deliverables, create genuine alpha-channel overlays and test transparent pixels in OBS/Streamlabs. An opaque MP4 is not a transparent alert overlay.
6. Upload approved optimized media to the production asset location, update the After Dark demo with verified stable URLs, run tests, then deploy to Cloudflare.
7. Clearly label concept demonstrations; do not present generated footage as client work or a verified deliverable until approved.

Customer-facing production rules remain as documented in `README.md` and `src/savannah.js`.
