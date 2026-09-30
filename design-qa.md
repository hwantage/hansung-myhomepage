# Design QA

final result: passed

## Target and scope

Reference: https://www.vectrfl.com/

The approved direction is a creative interpretation for Hwantage's personal homepage: a miniature development workspace with computers, monitors, a keyboard, a mouse and desk objects. This is not a pixel-for-pixel reproduction of Vectr's industrial environment. Its bright spatial atmosphere, centered headline, quiet navigation and scroll-driven 3D camera are the reference surfaces.

The user approved local Playwright browser verification and the development-workspace concept. Actual Three.js meshes are necessary for the requested interactive 3D experience. The monitor UI textures are drawn for these screens; the profile and fallback images are captures of the same authored workspace.

## Evidence

All paths below are relative to this project.

- Source visual truth: `artifacts/design-qa/reference-desktop.png` and `reference-scroll.png`.
- Implementation: `artifacts/design-qa/desktop.png` and `desktop-scroll.png`.
- Full-view comparison, source left / implementation right: `artifacts/design-qa/comparison-hero.jpg` and `comparison-scroll.jpg`.
- Focused typography and navigation comparison: `artifacts/design-qa/comparison-typography.jpg`.
- Responsive views: `artifacts/design-qa/mobile.png`, `mobile-scroll.png`, `mobile-small.png`.
- Supporting sections: `artifacts/design-qa/about.png`, `toolkit.png`, `profile.png`.
- Reduced motion: `artifacts/design-qa/reduced-motion.png`.
- Unavailable WebGL: `artifacts/design-qa/fallback.png`.
- Functional results: `artifacts/design-qa/verification.json`.

Source and implementation desktop screenshots are both 1440 × 1000 pixels at a CSS viewport of 1440 × 1000 and deviceScaleFactor 1. The combined full-view comparisons are 2880 × 1000. The focused comparison is 2880 × 440, using the same top crop of both screenshots. No density resampling was required. Both desktop first-screen captures are after loading; the subsequent captures represent each site's scroll-driven scene, rather than identical scroll distances or identical objects.

Responsive screenshots use 390 × 844 and 320 × 568 CSS viewports at density 1. Browser layout checks also covered 768 × 1024 and 1366 × 768. Final 320px evidence was captured in a fresh mobile context with no inherited drag rotation.

## Findings and comparison history

1. **[P2, fixed] Small initial workspace on mobile.** The first 390px view gave the desk too little visual weight. Adjusted camera framing and canvas placement. `mobile.png` now presents a larger, clearly recognizable desk while retaining separation from the headline.
2. **[P2, fixed] Mobile chapter words joined and wrapped awkwardly.** Hiding the line break joined “in.” and “Experiences.” Retained the explicit break and adjusted the mobile font size. `mobile-scroll.png` shows a legible two-line headline above the scene.
3. **[P1, fixed] Profile capture contained surrounding UI.** Element screenshots initially included composited navigation, captions and controls. Regenerated the scene assets with surrounding UI hidden. Inspected `assets/studio-detail.webp` and `profile.png`: the image contains the workspace alone.
4. **[P2, fixed] Horizontal overflow at 320px.** The toolkit's long display word forced the grid wider than the viewport. Reduced its responsive type size, used a zero-minimum grid track and tightened the small-screen contact pill. Browser checks now report no horizontal overflow at all four checked sizes.
5. **[P2, fixed] Monitor approached the introductory text on a short mobile screen.** Moved the studio down specifically below 360px width. The fresh `mobile-small.png` confirms a clear gap between the introduction and the monitor and keeps both controls visible.

The final source/implementation composite was opened after these fixes. No actionable P0/P1/P2 visual issue remains in the checked states.

## Required fidelity surfaces

- **Fonts and typography:** Manrope conveys the reference's broad, compact sans-serif hierarchy; Noto Sans KR supports Korean copy. The centered desktop headline, tight tracking and restrained navigation match the intended atmosphere. Mobile headings fit, Korean text is legible, and the chapter retains an intentional line break. Family differences from the reference are an approved reinterpretation.
- **Spacing and layout rhythm:** Spacious pale-blue hero, central headline and a lower 3D scene remain the primary composition. The camera moves into the desk while a left-side narrative appears on desktop. Mobile places the narrative above the scene. Desk/platform edge cropping during close-up is intentional; persistent controls remain in view. Content sections use generous spacing and a consistent two-column desktop / single-column mobile layout.
- **Colors and visual tokens:** Pale blue `#d9e8f1`, paper `#fcfcfc`, blue `#3932dc`, ink `#08071d` and muted `#5e6271` replace the rejected dark-green/lime palette. Physical lighting produces lighter violet reflections on blue objects. The strong blue toolkit section connects the 3D accents to the rest of the page.
- **Image quality and assets:** The workspace is live geometry with individual keyboard keys, monitor stands, tower fans, cables and recognizable desk objects. Screen textures remain sharp in close-up. Locally saved WebP captures retain the same composition and palette, with no navigation or text overlay embedded in them. The profile crop intentionally emphasizes monitors and input devices. No source industrial assets were reused.
- **Copy and content:** Existing name, email, education, location, technical stack and GitHub/blog destinations are retained. Headlines describe the personal workspace and development approach. Navigation, contact copy and the screen/motion controls correspond to working actions.

## Functional verification

37 browser checks passed. The normal WebGL path recorded zero JavaScript/console errors and zero HTTP failures.

- Workspace rendering and camera movement on scroll.
- Monitor raycasting/clicks, mouse drag, and screen changes through button and keyboard input.
- Camera pause/resume and accessible pressed state.
- Section navigation, approach accordion, FAQ disclosure and contact email.
- Responsive overflow and scene visibility at 320, 390, 768 and 1366px widths.
- Mobile menu open/close, Escape dismissal and anchor navigation.
- Reduced-motion single-screen hero, static camera and usable screen-switch control.
- Forced WebGL failure, loaded image fallback and hidden unsupported controls.

After the final small-screen spacing fix, a targeted 320 × 568 capture again confirmed no overflow and no JavaScript error. `node --check studio.js` and `git diff --check` also passed.

## Implementation checklist

- [x] Approved 3D workspace implemented and locally self-contained.
- [x] Reference and implementation compared at matching desktop dimensions.
- [x] Mobile, keyboard, reduced motion and WebGL fallback verified.
- [x] Profile/fallback assets replaced with clean scene captures.
- [x] P0/P1/P2 findings resolved and final evidence inspected.

## Follow-up polish and test limits

No blocking polish item remains. Browser verification used Chromium with software WebGL; device-specific GPU behavior and Safari/Firefox were not separately tested. The built-in fallback covers unavailable WebGL. Google Fonts has system-font fallbacks.
