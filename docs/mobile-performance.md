# Mobile delivery audit — 27 October 2026

Published changes preserve the existing typography, layout, effects, and video files.

- The six main font files were raw TrueType files with WOFF2 names: 599,300 bytes combined. Genuine WOFF2 delivery copies total 211,368 bytes (about 65% smaller). No glyph subsetting or font redesign; character maps were checked after conversion.
- Four After Dark PNG assets have lossless WebP alternatives. Alpha and every visible pixel were compared with the originals; originals are retained. Total artwork delivery reduction is about 2.06 MB across these assets, not a claim about one page's initial payload.
- Production JavaScript and CSS are minified by the existing installed compiler. Editable sources remain readable. Font format declarations now correctly advertise WOFF2.
- Offscreen video posters are deferred alongside videos. The hero poster and tiny header logo remain immediate. Images decode asynchronously, and later unmarked images receive native lazy loading.
- Font CSS and studio/preview controllers use new cache versions. Dynamic public pages receive the same updated stylesheet and controller references. Existing production backend modules, bindings and variables are preserved.

Verification: 145 tests passed; mobile homepage, pricing and project form checked without horizontal overflow. Selected alert plays silently with its poster after scrolling. Main fonts remain Fredoka and Nunito. No video file was changed. This audit measures delivery bytes and browser behavior; no field Core Web Vitals or simulated performance score is claimed.

Anna's separate authenticated health check could not run because the local scoped credential is unavailable; deployment entry-point and binding preservation checks passed. No agent behavior or backend logic was changed.

Greeting follow-up: the ad and transcript were revised to “Hey, creator!” with new matching ElevenLabs narration and Sync 3 lip sync; see savannah-ad-production.md for checks and owner listening confirmation.
