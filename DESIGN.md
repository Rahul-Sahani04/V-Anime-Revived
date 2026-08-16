---
name: V-Anime Revived Design Spec
description: The single source of truth for the visual language and UX patterns of the V-Anime Revived platform.
---

# Design Philosophy

V-Anime Revived is built on three core pillars: **Immersive**, **Frictionless**, and **Cinematic**. 
As a media consumption platform, the UI must fade into the background. The artwork (posters, banners) is the focal point. The interface should feel incredibly fast, fluid, and intuitive, allowing users to go from searching to watching an episode in minimal clicks.

## 1. Color Tokens (HSL)

We avoid pure black (`#000000`) as it causes severe eye strain in low-light binge-watching scenarios. Instead, we use a sophisticated, deep slate/obsidian. 

*(Note: We strictly adhere to the anti-cliché rule of avoiding "Purple on Dark". Our accent is a high-energy Crimson, reminiscent of classic anime aesthetics.)*

### Backgrounds & Surfaces
*   `--background`: `224 25% 8%` (Deep Slate)
*   `--surface`: `224 25% 12%` (Slightly elevated for cards/modals)
*   `--surface-hover`: `224 25% 16%` (For interactive elements)
*   `--surface-border`: `224 20% 20%` (Subtle dividers, never harsh lines)

### Accents & Actions
*   `--primary`: `348 83% 47%` (Cinematic Crimson - used sparingly for primary buttons and active states)
*   `--primary-foreground`: `0 0% 100%` (White text on primary buttons)
*   `--progress-bar`: `348 83% 47%` (Crimson for the "Continue Watching" progress bars)

### Typography Colors
*   `--text-primary`: `0 0% 95%` (Off-white for high legibility, avoiding harsh pure white)
*   `--text-secondary`: `220 10% 65%` (Muted slate for metadata, genres, descriptions)

## 2. Typography

We use **Geist** (Sans) for UI and **Geist Mono** for any technical/numerical displays (like episode exact timestamps).

*   **Headings (`h1`, `h2`)**: Tight letter-spacing (tracking), bold but not oversized. Clean, authoritative.
*   **Body Text**: Generous line-height (`1.6`) for readability on long anime descriptions.
*   **Metadata (Tags, Genres)**: Small, uppercase, with slightly expanded letter-spacing for premium feel.

## 3. Motion & Animation

Animations must feel **smooth, sleek, and purposeful**. No bouncy or overly dramatic effects.

*   **Hover States**: Fluid transitions (`transition-all duration-300 ease-out`).
*   **Cards**: Anime poster cards lift slightly (`-translate-y-1`) and increase drop-shadow on hover. The poster image itself should scale up very slightly (`scale-105`) within a hidden overflow container.
*   **Page Transitions**: Soft fade-ins for route changes to prevent jarring flashes.
*   **Skeleton Loaders**: Fast, subtle pulse animations matching the `--surface` color to make loading feel instant.

## 4. Component Specifications

### Anime Cards
*   **Visual**: Bare minimum UI. Just the poster image and the title below it.
*   **Border Radius**: `0.5rem` (8px). Softens the UI without making it look bubbly.
*   **Progress**: If the user is currently watching, a 2px tall crimson progress bar spans the bottom of the poster image.

### The Player (Theater Mode)
*   **Focus**: When a video is active, the rest of the page dims. 
*   **Controls**: Controls auto-hide after 2 seconds of inactivity. Smooth fade-in on mouse move.
*   **Ease of Use**: Large, obvious hit areas for Play/Pause, Next Episode, and Settings.

### Navigation
*   **Navbar**: Sticky, transparent to blurred (`backdrop-blur-md`) as the user scrolls down, ensuring it never obstructs hero artwork.

## 5. UX & Accessibility (Ease of Use)

*   **Keyboard Navigation**: The entire video player and episode selection must be fully navigable via keyboard (Space to play/pause, arrows to skip, `F` for fullscreen).
*   **Frictionless Actions**: "Add to Watchlist" or "Favorite" are single-click toggles. No modals, no confirmation dialogs.
*   **Contrast**: Text against the dark background must pass WCAG AA contrast standards.
