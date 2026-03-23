# CLAUDE.md — BookLens Project Instructions

This file guides Claude Code when working on the BookLens project.

---

## Project Overview

BookLens is a mobile-first Progressive Web App for Android (Chrome) that lets the user
photograph book pages, crop quotes precisely, apply document enhancement, extract text
via OCR, and save/share the results. No build toolchain — pure HTML/CSS/JS, single-file
app architecture (all code in `BookLens.html` unless a file genuinely must be separate).

**Primary user:** Gordo, working from his PC in VS Code, deploying to Android Chrome.

---

## Architecture Principles

- **Single HTML file** for the app shell. Do not split into separate JS/CSS files unless
  there is a concrete reason (e.g. service worker MUST be `sw.js`, manifest MUST be
  `manifest.json`).
- **No build step, no npm, no bundler.** CDN imports only.
- **No frameworks.** Vanilla JS with DOM manipulation. No React, no Vue.
- **Canvas 2D API** for all image processing. No canvas libraries.
- **Offline-first.** Everything must work without a network connection after first load.
- **Touch-first.** All interactions must work with fingers. Mouse support is secondary.

---

## CDN Dependencies (approved)

```
Tesseract.js v4:  https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js
JSZip:            https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
Fonts:            https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@300;400
```

Do not add other CDN dependencies without discussing first.

---

## Design System

### Colors (CSS variables — do not change)
```css
--ink:         #1a1208   /* primary background */
--paper:       #f5f0e8   /* primary text */
--paper2:      #ede7d5
--amber:       #c8902a   /* primary accent */
--amber-light: #e8b84b   /* highlights */
--amber-dim:   #7a5518   /* muted accent */
--rust:        #9c3d1a
--cream:       #faf7f0
--shadow:      rgba(26,18,8,0.35)
```

### Typography
- **Display/logo:** Playfair Display (serif, italic for emphasis)
- **UI/code:** JetBrains Mono (monospace)
- Buttons: uppercase, letter-spacing: 1px, font-size: 10–13px

### Aesthetic
Dark ink/amber — aged manuscript, editorial. No gradients involving purple or blue.
No rounded corners beyond border-radius: 3–4px. Sparse, deliberate use of emoji as icons.

---

## Screen Architecture

The app uses a single-page screen stack with `.hidden` class toggling opacity/transform.
All screens are `position: fixed; inset: 0`.

### Screens (current)
| ID         | Purpose                              |
|------------|--------------------------------------|
| `#home`    | Main entry, capture/import/gallery   |
| `#camera`  | Live camera viewfinder               |
| `#crop`    | Crop workspace                       |
| `#perspective` | Edge detection & perspective warp  |
| `#enhance` | Image enhancement presets & sliders   |
| `#gallery` | Saved images grid                    |

### Adding screens
Follow the same pattern: `<div id="newscreen" class="screen hidden">`.
Use `showScreen('newscreen')` to navigate.
If the new screen needs to appear between capture and crop, insert it in the flow:
`capturePhoto()` → enhancement → crop → save.

---

## Key Functions Reference

```
showScreen(id)          Navigate to a screen
startCamera()           Open camera viewfinder
stopCamera()            Kill camera stream
capturePhoto()          Capture frame from video → open crop
openCrop(dataURL)       Load image into crop workspace
saveCrop()              Render crop to canvas → download + save to gallery
renderGallery()         Rebuild gallery grid from `saved[]`
showToast(msg)          Brief status message (2.2s)
updateCropBox()         Sync crop-box div position/size from box{} state
setRatio(r, btn)        Apply aspect ratio lock to crop
applyRotation(deg)      Rotate crop image, recompute box
```

### State variables
```
stream        MediaStream | null      Active camera stream
facingMode    'environment'|'user'    Camera direction
cropImgDataURL string|null            Current image being cropped
cropRatio     string                  'free'|'1:1'|'4:3'|'16:9'|'3:2'
cropRotation  number                  Degrees, -15 to +15
box           {x,y,w,h}              Crop box as % of displayed image
saved         Array<{id,dataURL}>    Gallery items (localStorage backed)
```

---

## Implementation Phases

See `IMPLEMENTATION_PLAN.md` for full detail. Summary:

| Phase | Feature                  | Status      |
|-------|--------------------------|-------------|
| 0     | Core app (camera, crop)  | ✅ Complete |
| 1     | PWA (manifest, SW)       | ✅ Complete |
| 2     | Crop workspace upgrades  | ✅ Complete |
| 3     | Image enhancement        | ✅ Complete |
| 3.5   | Perspective correction   | ✅ Complete |
| 4     | OCR (Tesseract.js)       | ⬜          |
| 5     | Share & export           | ⬜          |

---

## Working Conventions

- **Always read the current `BookLens.html` before editing it.** It changes between sessions.
- **Preserve the full file.** Never truncate or summarize sections — the entire file must
  remain valid and runnable after every edit.
- **Test mentally on mobile.** Touch targets ≥ 44px. No hover-only interactions.
- **No inline event handlers on dynamically generated HTML** where avoidable — prefer
  event delegation on the parent container.
- **localStorage key:** `booklens_saves` — do not change this key name.
- When adding a new screen, update the Screen Architecture table in this file.
- When completing a phase, update the phase status table above and add an entry to
  `CHANGELOG.md`.

---

## Common Pitfalls

- `updateCropBox()` must be called after any layout change (resize, screen transition,
  image load) because it reads live `getBoundingClientRect()` values.
- The crop box coordinates in `box{}` are **percentages of the displayed image rect**,
  not the natural image dimensions. The `saveCrop()` function maps them to natural
  dimensions via the offscreen canvas.
- Camera stream must be explicitly stopped (`stopCamera()`) before navigating away from
  `#camera` — Android Chrome holds the camera indicator light open otherwise.
- Tesseract.js worker should be initialized lazily and reused — do not create a new
  worker per OCR call.
- Service worker scope must be at the root of the served directory. If serving from a
  subdirectory, adjust the `scope` in `navigator.serviceWorker.register()`.
