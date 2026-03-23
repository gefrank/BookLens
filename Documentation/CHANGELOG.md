# Changelog — BookLens

---

## v0.5.0 — 2026-03-23

Perspective Correction + Camera Cleanup — the Microsoft Lens edge-detection experience.

### Added
- New **Adjust Edges** screen with auto-detected page corners
- Sobel edge detection algorithm finds page boundaries automatically
- Four draggable corner handles with 36px touch targets
- SVG overlay grays out area outside the detected page (like Lens)
- Full perspective warp using 3×3 homography matrix with bilinear interpolation
- **Tap-to-focus** on camera screen with animated focus ring indicator
- Focus ring shows tap → lock → fade animation sequence

### Removed
- Selfie/flip camera button (app is scanning-only, always rear camera)
- `facingMode` state variable (hardcoded to `environment`)

### Changed
- Flow is now: Capture/Import → **Adjust Edges** → Enhance → Crop → Save
- Camera screen layout rebalanced after flip button removal

---

## v0.4.0 — 2026-03-23

Image Enhancement — the Microsoft Lens "document scan" look.

### Added
- New **Enhance** screen between capture and crop in the workflow
- Preset modes: **Original**, **Auto**, **Document**, **Photo**, **B&W**
- Manual sliders: Brightness (-100 to +100), Contrast (-100 to +100), Sharpness (0–100)
- Real-time canvas preview with 100ms debounce
- Auto-levels algorithm (per-channel histogram stretch, 1st/99th percentile)
- Document mode: auto-levels + 70% desaturate + high contrast + sharpen
- 3×3 sharpening kernel with adjustable strength
- "Skip" button to bypass enhancement and go straight to crop
- Full-resolution processing on "Apply" (preview works at reduced res for speed)
- Processing spinner during heavy canvas operations

### Changed
- Capture and import now route through Enhance screen before Crop
- Flow is now: Capture/Import → Enhance → Crop → Save

---

## v0.3.0 — 2026-03-23

Crop Workspace Upgrades — precision cropping on mobile is now practical.

### Added
- Pinch-to-zoom on crop image (two-finger gesture, up to 5×)
- Single-finger pan when zoomed in (drag on image area, not crop box)
- Double-tap to toggle between fit-to-screen and 3× zoom
- Zoom level badge (e.g. "2.4×") appears briefly during pinch
- Degree readout next to angle slider (e.g. "+3.5°")
- Half-degree step precision on angle slider (was whole degrees)
- Mouse wheel zoom for desktop testing

### Changed
- Minimum crop size hardened from 8% to 5% of image dimensions
- Crop image transform now combines zoom, pan, and rotation in one pipeline

---

## v0.2.0 — 2026-03-23

PWA Foundation — BookLens is now installable and works offline.

### Added
- `manifest.json` — app metadata, standalone display, amber/ink themed icons
- `sw.js` — service worker with cache-first strategy (`booklens-v1` cache)
- App icons at 192×192 and 512×512 (open book with magnifying lens)
- `<link rel="manifest">` in HTML head
- Service worker registration with feature detection at app startup
- Pre-caching of app shell, Google Fonts, and Tesseract.js CDN bundle

### Changed
- None — all existing functionality preserved, additive changes only

---

## v0.1.0 — 2026-03-23

Initial implementation. Single HTML file produced in Claude.ai chat session.

### Features
- Camera capture with rear/front toggle
- Image import from device gallery
- Interactive crop tool — 8 drag handles (corners + edges)
- Aspect ratio lock: Free, 1:1, 4:3, 16:9, 3:2
- ±15° angle/straighten slider
- Rule-of-thirds grid overlay on crop area
- Save to Downloads (browser download trigger)
- Session gallery: thumbnail grid, re-crop, re-download, delete
- localStorage persistence (`booklens_saves`)
- Toast notification system
- Amber/ink design system (Playfair Display + JetBrains Mono)

### Known limitations
- No PWA manifest or service worker (not installable as standalone app)
- No offline support
- No image enhancement
- No OCR
- localStorage ~5MB cap limits gallery to ~8–20 images
- No share sheet integration
