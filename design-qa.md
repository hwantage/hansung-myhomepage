# Design QA — Connected workspace

final result: passed

## Target

Reference: https://www.vectrfl.com/

The user's approved direction preserves the existing miniature development workspace and extends its short overview/close-up transition into a long connected journey: overview → network hub → computer → keyboard → mouse → headphones → speaker → monitor → surrounding objects → overview.

The desktop scroll track is 1150svh, with 10.5 viewport heights of camera travel; mobile is 1050svh, with 9.5 viewport heights of travel. This is a creative interpretation of Vectr's spatial storytelling for a personal homepage. The industrial objects, exact camera poses and identical scroll distances are not reproduction targets.

## Evidence and normalization

Paths are relative to the project root.

- Source visual truth: `artifacts/design-qa/reference-desktop.png`, `reference-scroll.png`.
- Current implementation: `artifacts/design-qa/desktop.png`, `desktop-scroll.png`.
- Source/implementation comparisons, source left: `artifacts/design-qa/comparison-hero.jpg`, `comparison-scroll.jpg`.
- Focused header/typography comparison: `artifacts/design-qa/comparison-typography.jpg`. These surfaces remain unchanged by the extended journey.
- All desktop stages: `artifacts/design-qa/journey/contact-sheet.jpg` and the individual overview/hub/computer/keyboard/mouse/headphones/speaker/monitor/connected/finale PNG files beside it.
- All 390px stages: `artifacts/design-qa/journey/mobile-contact-sheet.jpg` and individual `mobile-*.png` files.
- Focused geometry, ports, screen textures and line inspection: `journey/hub.png`, `keyboard.png`, `headphones.png`, `speaker.png`, `monitor.png` under `artifacts/design-qa/`.
- Short mobile views: `artifacts/design-qa/mobile-small.png`, `journey/small-hub.png`, `journey/small-headphones.png`, `journey/small-monitor.png`.
- Current profile and fallback: `artifacts/design-qa/profile.png`, `fallback.png`.
- Browser results: `artifacts/design-qa/verification.json` (37 checks), `journey/verification.json` (58 checks), `scroll-fix/verification.json` (23 checks).

Reference and implementation desktop captures are 1440 × 1000 pixels at a 1440 × 1000 CSS viewport, density 1. Side-by-side full views are 2880 × 1000; the focused typography composite is 2880 × 440. No density resampling is used in the comparison composites. Contact sheets use thumbnails only for navigation; individual full-resolution views were also opened for close inspection.

Mobile captures are 390 × 844 and 320 × 568, density 1. Initial captures show the loaded overview. Scrolled captures show representative camera-travel states on each site: the reference's industrial flow and the implementation's keyboard, plus separate captures of every approved new stop. Different objects, framing and timing are intentional adaptations of the approved route.

## Comparison history and findings

- **Previous build:** The initial mobile model scale, chapter line break, image-capture overlays and 320px overflow were fixed before the earlier handoff. Those corrections remain in the current implementation.
- **[P1, resolved] Insufficient camera travel:** The earlier hero only moved between a wide view and one close-up. Replaced it with a continuous camera path, additional audio-orbit poses, device-specific framing and an approximately ten-screen scroll sequence. The desktop and mobile contact sheets show distinct views of every required device.
- **[P2, resolved] No origin for the connection:** Added a visible network hub with four ports, pins, an active connector and a readable top label. The first close-up starts there and follows the cable toward the computer.
- **[P2, resolved] No visual continuity between devices:** Added a progressive blue signal, a leading point, loops around input/audio devices and branches from the monitor to the portrait display, laptop, mug, plant and lamp. Reverse scrolling retracts the same paths.
- **[P2, resolved] Long route needs direct access:** Added eight keyboard/touch-accessible stop buttons, an active-step state, contextual captions and a working Skip to about link.
- **[P1, resolved] Flickering and stuttering during initial zoom:** The expanding `.studio` rectangle repeatedly resized the WebGL drawing buffer. A controlled 91-frame scroll recorded 118 canvas dimension assignments. The canvas now remains full-screen; a camera view offset preserves the accepted lower overview and expands its framing without reallocating the buffer. The same trace recorded zero dimension assignments after the fix. UI presentation and camera movement now use one smoothed progress value. Static shadows are reused during camera travel, and repeated geometry uses GPU instancing.
- **[P2, resolved] Incorrect computer entry:** The original hub cable reached the front intake. Added rear I/O details, a rear network connector and separate USB output. Shared route/connector coordinates align the endpoints, while intermediate camera poses travel around the outside of the tower to show its rear. The onward signal passes through the case and leaves the rear USB connector toward the keyboard. Desktop and mobile rear views are in `artifacts/design-qa/scroll-fix/`.
- **[P2, resolved] Pause during initial expansion:** Pausing now freezes camera movement, signal progress and the canvas expansion together. A targeted browser check at the early zoom confirmed that the camera and stage height stay fixed while scrolling.
- **[P2, resolved] Fallback would inherit a long empty track:** Unavailable WebGL now uses the current overview image in a single-screen hero. The image and profile capture were regenerated from the updated workspace with surrounding UI hidden.

Final source/implementation composites, full desktop/mobile sequences, individual close-ups, the current profile and short mobile view were opened after implementation. No actionable P0/P1/P2 issue remains in the checked states.

## Required fidelity surfaces

- **Fonts and typography:** The accepted Manrope/Noto Sans KR hero and content hierarchy are preserved. Journey captions use a quieter 32px desktop / 24px mobile heading and readable Korean text; short-phone headings use 22px. Titles wrap within the card. Step names and numbers describe the actual ordered route.
- **Spacing and layout rhythm:** The first screen retains its centered headline and lower workspace. The canvas gradually fills the viewport as the tour begins. Desktop captions stay at lower left; mobile captions sit below the header. The active device remains readable, while background furniture can crop during close-up. Navigation and both motion/screen controls fit even at 320px. The existing content sections are preserved.
- **Colors and tokens:** Pale blue `#d9e8f1`, paper `#fcfcfc`, ink `#08071d` and blue `#3932dc` retain the accepted atmosphere. Pale unlit cables and a saturated blue active signal make the connection readable against white devices. A restrained translucent halo and leading point support the scroll action without an idle animation.
- **Image quality and assets:** The network hub, individual keys, monitor UI, audio objects and curved connections remain actual 3D geometry. Close-ups show legible ports, keys and screens. Local WebP fallback/profile assets show the current workspace, including the hub and the final connections, without surrounding site UI.
- **Copy and content:** Personal information, technology stack, education, GitHub/blog links and contact email are retained. The eight captions relate to the device currently in view. The stage-navigation buttons have descriptive accessible names and a current-step state. Static assistive text describes the route; changing decorative captions do not repeatedly interrupt a screen reader.

## Browser verification

118 checks passed after the scroll fixes: 37 functionality checks, 58 journey checks and 23 permanent scroll-rendering regression checks. Both runs recorded zero JavaScript/console errors and zero failed HTTP requests on the normal WebGL path.

New verification covered:

- More than ten desktop / nine mobile viewport heights of travel.
- Finite, continuous camera-curve samples; maximum adjacent displacement was 0.1083 world units at a normalized step of 0.0005.
- All eight forward stops and all reverse stops, with distinct camera positions.
- No horizontal overflow at any desktop stop.
- All eight stop buttons, current-step state, keyboard activation and touch activation.
- Simultaneous camera/signal pause, resume to the current scroll position and tour skipping.
- Returning to the overview restores the initial headline.
- 320px hub/headphone/monitor framing, caption fit and touch scrolling.

The existing checks cover screen changes, raycasting, overview dragging, menus, content navigation, accordions, contact links, 320/390/768/1366px widths, reduced motion and forced WebGL failure. Two final targeted checks also confirmed early-zoom pause and a single-screen fallback after regenerating the assets.

`node --check studio.js`, `node --check journey.js` and `git diff --check` passed.

## Implementation checklist

- [x] Long camera route and input/audio orbits implemented.
- [x] Progressive and reversible connections reach the requested devices.
- [x] Branching finale returns to the whole workspace.
- [x] Direct stop navigation, skipping and pause/resume work.
- [x] Desktop/mobile screenshots and reference comparisons reviewed.
- [x] Reduced motion and WebGL fallback retain a short static hero.
- [x] Current scene captures replace the previous assets.

## Follow-up polish and test limits

No blocking polish item remains. Verification used Chromium with software WebGL; Safari/Firefox and device-specific GPU performance were not separately measured. The scene renders on demand and stops when settled, outside the viewport or in a hidden tab. Google Fonts has system-font fallbacks.

## Scroll rendering regression evidence

The repeatable regression script is `scripts/verify_scroll_rendering.py`; it runs against the local preview and saves `artifacts/design-qa/scroll-fix/verification.json`. It checks desktop and mobile (390 × 844, density 2) buffer stability, shadow reuse, rendering while scrolling, idle rendering, rear port and camera alignment, signal continuity, pixel-stable scene pause during the opening zoom, resume and genuine viewport resizing. Keyboard picking and hover shadow updates are also checked after instancing. Decorative HTML overlays are hidden only for the pause pixel comparison so button hover transitions cannot create false failures.

Before/after diagnostics are `scroll-fix/before-metrics.json` and `after-metrics.json`. The same 91-frame desktop trace produced 50,326 → 17,199 GPU draw calls (about 66% fewer), including 22,288 → 0 shadow-pass draws, and 118 → 0 canvas dimension assignments. Software-WebGL mean frame intervals were 126.8 → 111.4 ms; these are diagnostic values, not real-device FPS guarantees.

Current focused evidence includes `scroll-fix/desktop-route.jpg`, `mobile-route.jpg`, and the checked rear-port screenshots. The overview-to-rear-to-keyboard route remains continuous, and both the network plug and USB exit are visible. Actual hardware GPU performance and Safari/Firefox remain unmeasured.

A separate `WEBGL_lose_context` browser check confirmed that context loss shows the fallback and restoration resumes the current scroll position, scene and navigation without JavaScript errors. Evidence: `scroll-fix/context-recovery.json` and `context-restored.png`.

## Spacebar left-edge flicker correction

The final left modifier key overlapped the spacebar by 0.1115 world units, with identical upper face heights. Browser captures reproduced the changing white/blue fragments at the spacebar left edge as the camera moved (depth fighting). Repositioned the four left modifier keys to leave a 0.0335-unit gap before the spacebar while preserving its size. All bottom-row key bounds are now disjoint.

Evidence: `artifacts/design-qa/keyboard-fix/before-sequence.jpg`, `after-sequence.jpg`, `geometry-verification.json`, plus desktop/mobile interaction verification. The controlled before capture serves the former key positions through a temporary browser route; the after capture reads the current application. No production instrumentation was added.
