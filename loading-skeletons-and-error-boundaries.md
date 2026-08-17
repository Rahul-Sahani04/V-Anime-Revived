# Loading Skeletons & Error Boundaries Plan

## Overview
Implement dedicated **Next.js App Router `loading.tsx`** (shimmer pulse skeleton loaders) and **`error.tsx`** (interactive error recovery boundaries with retry capabilities) across all core routes:
1. Root Home (`/`)
2. Anime Details (`/anime/[id]`)
3. Watch Player (`/anime/[id]/watch/[episode]`)
4. User Library (`/library`)

---

## Project Type & Design Tokens
- **WEB** (Next.js 15 App Router, React 19)
- **DESIGN.md Compliance**:
  - Background: Deep Slate (`224 25% 8%` / `#0f141c`)
  - Accent: Crimson Red (`348 83% 47%` / `#e11d48`)
  - Skeleton Shimmer Surface: (`224 20% 12%` / `#181f2c`) with animated opacity pulse
  - Border: (`224 15% 18%`)
  - No purple or jarring raw layouts.

---

## Success Criteria
- [ ] Next.js instant loading states render fluidly on route transitions without layout shifts (CLS < 0.1).
- [ ] Error boundaries catch unhandled runtime errors, display friendly error descriptions, and provide a "Try Again" recovery button.
- [ ] Skeletons closely mirror actual rendered layout dimensions (Hero aspect ratios, 2/3 poster ratios, 16/9 video frames, episode grids).

---

## Task Breakdown

### Task 1: Home Page Loading & Error Boundary
- `apps/web/src/app/loading.tsx`: Hero Spotlight Carousel skeleton + Shelves skeleton.
- `apps/web/src/app/error.tsx`: Client error boundary with retry trigger.

### Task 2: Anime Details Loading & Error Boundary
- `apps/web/src/app/anime/[id]/loading.tsx`: Cinematic banner skeleton, poster skeleton, synopsis lines, and episode grid skeleton.
- `apps/web/src/app/anime/[id]/error.tsx`: Details error boundary.

### Task 3: Watch Page Loading & Error Boundary
- `apps/web/src/app/anime/[id]/watch/[episode]/loading.tsx`: 16:9 Video player skeleton with ambient glow, server button skeletons, and episode selector skeleton.
- `apps/web/src/app/anime/[id]/watch/[episode]/error.tsx`: Stream recovery error boundary.

### Task 4: Library Page Loading & Error Boundary
- `apps/web/src/app/library/loading.tsx`: Profile header skeleton, tab pill skeletons, and card grid skeleton.
- `apps/web/src/app/library/error.tsx`: Library error boundary.

---

## Phase X: Verification Checklist
- [x] `npx tsc --noEmit` in `apps/web` passes with 0 errors.
- [x] `npm run lint` in `apps/web` passes with 0 errors.
- [x] `npm run build` succeeds with all `loading.tsx` and `error.tsx` routes detected.

## ✅ PLAN COMPLETE
- All core routes equipped with tailored pulse shimmer loading skeletons and interactive error recovery boundaries.
- Date: 2026-08-17
