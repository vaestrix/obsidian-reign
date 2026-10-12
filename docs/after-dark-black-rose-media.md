# Black Rose Empress | Media integration manifest

Status: October 12, 2026 — alert approved for an opaque, click-to-play web concept; Starting Soon animation rejected. OBS deliverables remain unverified.

| Asset | Runway task ID | Specs | State |
|---|---|---|---|
| Starting Soon illustration | `9dcd7057-4b1c-4882-b960-487885cce28c` | 16:9, 2K | Rendered, not yet approved |
| Camera surround illustration | `9c9cfe85-b2a3-44f0-8e3a-a0a50ccb1a74` | 16:9, 2K | Rendered, not yet cut out |
| Alert illustration | `a8e86589-e34f-4ee1-99b1-ee5952d7b7d3` | 16:9, 2K | Rendered, not yet approved |
| Starting Soon animation | `f33555a0-0800-42a1-9371-1cd3aa3a6551` | 1920x1080, 10 seconds, silent | Rejected: camera pans until character leaves frame; hard loop reset |
| Alert animation | `2d6525d9-84bc-4860-8103-b0c47e5ecd77` | 1920x1080, 5 seconds, silent | Approved for web concept only; opaque, non-looping, user initiated |
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

## October 12 quality review and integration

Both original MP4s decoded completely without reported errors: 241 and 121 frames respectively, H.264/yuv420p, 1920x1080, 24 fps, no audio; actual durations approximately 10.04 and 5.04 seconds. Sixteen evenly spaced frames per video, including the beginning and end, were visually reviewed. This is sampled visual QA, not frame-by-frame playback certification.

Starting Soon: camera motion changes the composition substantially; the seated character is progressively cropped and leaves the frame. Beginning/end compositions cannot make a seamless loop. Do not publish this render as an approved looping scene. Fine anatomy cannot be certified from the sampled frames. A corrected locked-camera render and a new seam review are required.

Alert: reviewed samples show coherent rose/heart geometry, a controlled gold pulse and ribbon/particle motion, with no obvious unintended text, cuts or gross ornament morphing. The start/end light and particle states differ; seamless looping is not approved. Use controls without autoplay or loop. This is opaque footage, not an alpha overlay.

Web output: `/assets/video/after-dark-black-rose-alert-v1.mp4`, 1,888,679 bytes (original 4,601,779 bytes), H.264/yuv420p with faststart; SHA-256 `96f2b8af7f657290e32b97190a34dd5a49533adb94f946faa1ee43fcd32a0ed2`. Poster: `/assets/img/after-dark-black-rose-alert-v1.jpg`, 290,701 bytes. Media uses same-origin versioned paths; no signed Runway URLs are embedded. Masters and QA evidence remain outside public assets. The age-gated page shows a still on mobile and reduced-motion devices until the viewer explicitly plays the video.

Safeguards: content starts hidden behind the 18+ prompt; the prompt explicitly does not verify identity. Suggestive commissions remain on hold pending an independent verification provider and studio approval. Savannah's policy escalates suggestive and underage requests and forbids collecting ID documents by email. Production config and the deployment guard require Savannah auto-send false; Anna and shared inbox bindings are preserved.

Validation: npm test passed 73 tests; npm run build and integrated agent guard passed; Cloudflare deployment dry run passed. Browser playback, genuine alpha exports and OBS/Streamlabs validation remain outstanding. Illustrations are not approved production exports. No seamless-loop or OBS compatibility claim is made.

Deployment completed October 12, 2026: Cloudflare Worker version `b943b861-5e4a-435c-bf8c-7e7f05536937`. Live `/`, `/pricing`, `/after-dark`, `/client-portal` and `/admin/projects` return HTTP 200; a missing route returns 404. Both Hostinger webhook endpoints reject unauthorized POSTs with 401. After Dark returns a noindex header. Production video and poster URLs return the correct content types; downloaded production video matches the recorded size and SHA-256. Authenticated aggregate status and Cloudflare settings confirm Savannah disabled and Anna enabled; all three Durable Object bindings remain present. No customer email was initiated by this production task. Separate controlled Savannah validation is still required before reactivation.
