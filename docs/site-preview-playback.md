# Public preview playback — October 27, 2026

Public demonstrations use a shared visible-only playback controller loaded by the main studio script and the After Dark showcase script. Savannah's ad retains its dedicated controller.

- Known studio preview files play muted and loop when at least 25% visible. Offscreen or hidden previews pause and remute. Native or existing explicit sound controls remain available.
- A manual pause is retained until playback is requested again or a different source is selected. Source changes start muted. Dynamically inserted selection videos are registered automatically.
- Reduced-motion and data-saving preferences prevent automatic playback; manual controls remain usable. Background tabs pause and remute.
- Gated After Dark media remains paused until the content is visible. No age gate or access rule was changed. Private client/unknown external media is not automatically enrolled by the controller.

Media audit: 25 active MP4 demonstration files plus both transparent WebM alert files. Seventeen MP4s received short appended visual dissolves back to their opening frames, preserving the full source content and audio. Eight already had close-matching boundary frames. Five larger files in the latter group were recompressed for delivery without adding a transition. Twenty-two versioned MP4 delivery files are mapped by `assets/js/preview-loop-manifest.json`; originals remain available for production use. Transparent WebM files already begin and end fully transparent and remain unchanged.

Decoded first/last-frame checks on all 25 MP4 delivery files found a maximum mean boundary difference of 2.19 on an 8-bit 0–255 channel scale. This supports boundary similarity; it is not a guarantee about every frame of motion. Original and ending frame pairs were visually inspected, and representative selector, service, and portfolio playback was reviewed. The hero delivery file decreased from 12.60 MB to 2.99 MB.

Verification: 141 tests passed, including controller state, source switching, silent entry, offscreen muting, manual pause, reduced motion, hidden panels, existing inquiry/navigation, and After Dark selection behavior. Mobile checks covered the home styles/showroom, pricing, project selector, service player, and a portfolio case study. The After Dark gate was verified with all hidden videos paused; its hidden panel behavior is covered by automated tests. No production inquiry, payment, or email was submitted.
