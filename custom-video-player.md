# Plan: Custom Cinematic Video Player with AniSkip Integration

## Overview
Build a state-of-the-art custom HTML5/HLS video player replacing native browser controls with a custom floating UI, AniSkip intro/recap detection, smooth scrubbers, speed selector, mobile double-tap gestures, and full keyboard shortcuts.

---

## Architecture & Features
1. **AniSkip API Integration**:
   - Query `https://api.aniskip.com/v2/skip-times/${malIdOrAnilistId}/${episode}?types=op&types=ed&types=recap`
   - Dynamically render floating "Skip Opening" / "Skip Recap" CTA when playback time enters skip range.
   - Quick +85s fallback jump button.

2. **Custom Controls & UI**:
   - Floating gradient bottom HUD with auto-hide (2.5s timer).
   - Buffered + Played multi-layer progress bar with hover time tooltip and drag-to-seek.
   - Volume slider with animated mute states.
   - Center-screen ripple on play/pause and seek.
   - Settings popover: Playback Speed (0.5x - 2.0x), Audio track, Subtitles.
   - Picture-in-Picture & Fullscreen API integration.

3. **Mobile & Keyboard Shortcuts**:
   - Mobile double-tap left/right for ±10s jump with visual ripple.
   - Keyboard: Space/K (Play/Pause), Left/Right (±5s), J/L (±10s), Up/Down (Volume), M (Mute), F (Fullscreen), S (Skip Intro).

---

## Verification
- `npx tsc --noEmit` & `npm run lint` pass with 0 errors.
- `npm run build` succeeds.
