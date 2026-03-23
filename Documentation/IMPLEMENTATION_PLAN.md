# BookLens — Implementation Plan

A mobile-first Progressive Web App for capturing and cropping book quotes.
Designed for Android (Chrome). No build toolchain required — pure HTML/CSS/JS.

---

## Current State (v0.1 — completed in Claude.ai chat)

Single HTML file (`BookLens.html`) with:
- Camera capture (rear/front toggle)
- Image import from gallery
- Interactive 8-handle crop tool with aspect ratio lock
- ±15° angle/straighten slider
- Rule-of-thirds overlay
- Save to Downloads (triggers browser download)
- Session gallery with re-crop, re-download, delete
- localStorage persistence for gallery thumbnails

---

## Phase 1 — PWA Foundation

**Goal:** Make BookLens a proper installable app with offline support.

### Deliverables
- `manifest.json` — app name, icons, display mode, theme color
- `sw.js` — service worker for offline caching
- Icon set — 192×192 and 512×512 PNG (amber/ink theme)
- Update `BookLens.html` to register service worker and link manifest

### Key decisions
- Cache strategy: Cache-first for app shell, network-first for nothing (fully offline)
- Tesseract language data (~10MB) pre-cached during service worker install
- Display mode: `standalone` (hides browser chrome)

### Acceptance criteria
- Chrome "Add to Home Screen" prompt appears automatically
- App loads with no network connection after first visit
- Splash screen and theme color match app aesthetic

---

## Phase 2 — Crop Workspace Upgrades

**Goal:** Make precision cropping fast and comfortable on a phone screen.

### Deliverables
- Pinch-to-zoom on the crop image (two-finger scale gesture)
- Pan when zoomed in (single-finger drag on image, not crop box)
- Double-tap: fit-to-screen / 100% zoom toggle
- Degree readout label next to angle slider (e.g. `+3.5°`)
- Minimum crop size enforcement (already partially in v0.1, harden it)

### Implementation notes
- Track pointer events for pinch: `pointerId`, distance between two touches
- Zoom state: `scale` and `translate` applied via CSS transform on `#cropImg`
- Crop box coordinates must compensate for zoom/pan offset when rendering to canvas

### Acceptance criteria
- Can zoom to 3× and drag to position a single paragraph in the crop box
- Crop output is pixel-accurate regardless of zoom level
- No jank on mid-range Android hardware

---

## Phase 3 — Image Enhancement

**Goal:** Replicate the "document mode" processing that made Microsoft Lens excellent.

### Deliverables
- Enhancement panel between capture and crop screens
- Presets: **Auto**, **Document**, **Photo**, **B&W**
- Manual sliders: Brightness, Contrast, Sharpness
- Real-time canvas preview (debounced, ~100ms)
- "Skip" option to go straight to crop

### Implementation notes
- All processing via HTML5 Canvas 2D API — no external libraries needed
- **Auto-levels:** sample histogram, stretch to fill 0–255 range per channel
- **Document mode:** desaturate partially, boost contrast aggressively (~1.8×), sharpen kernel
- **Sharpen kernel:** 3×3 convolution `[0,-1,0,-1,5,-1,0,-1,0]` via `getImageData`
- Process on a hidden offscreen canvas; display scaled preview

### Acceptance criteria
- Document mode makes typical phone-camera book page clearly legible
- Processing completes in <500ms on a mid-range phone
- Original image data is preserved (enhancement is non-destructive until Save)

---

## Phase 3.5 — Perspective Correction

**Goal:** Replicate Microsoft Lens's signature feature — detect page edges and straighten the perspective so a crooked phone photo becomes a clean, flat rectangle.

### Deliverables
- **Auto-detect mode** — find the four corners of the page/document automatically using edge detection
- **Manual adjust** — drag the four corner points if auto-detect isn't perfect
- **Perspective warp** — apply a four-point homography transform to flatten the image into a clean rectangle
- Integrated into the flow between capture and enhancement: Capture → **Perspective** → Enhance → Crop

### Implementation notes
- Edge detection: convert to grayscale, apply Sobel/Canny-style filter via `getImageData`, find dominant contour lines using Hough-like approach
- Four-point transform: compute 3×3 homography matrix from source corners → destination rectangle, apply via pixel remapping on canvas
- All processing via Canvas 2D — no external libraries
- Preview: show the detected corners as draggable amber dots overlaid on the image, with connecting lines
- "Skip" button if the user doesn't need perspective correction (e.g. already flat)
- Output is a new rectangular image at the correct aspect ratio, fed into enhancement/crop

### Acceptance criteria
- Auto-detect finds correct page boundaries on a typical book photo (high contrast background)
- Manual corner adjustment is smooth and responsive on mobile (44px+ touch targets)
- Perspective-corrected output has no visible warping artifacts
- Processing completes in <1 second on a mid-range phone
- Works correctly with both light pages on dark backgrounds and vice versa

---

## Phase 4 — OCR (Text Extraction)

**Goal:** Extract quote text from cropped images directly in the browser.

### Deliverables
- Tesseract.js integration (v4, runs fully in-browser via Web Worker)
- "Extract Text" button on saved gallery items
- OCR result overlay: editable textarea, Copy button, Save as .txt button
- Progress indicator during recognition
- Language: English default; architecture allows adding more

### Implementation notes
- Load Tesseract from CDN: `https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js`
- Worker initialization: lazy (only on first OCR request)
- Feed the cropped `dataURL` directly to `Tesseract.recognize()`
- Service worker (Phase 1) caches the ~10MB `eng.traineddata` after first download
- Editable textarea allows user to fix OCR errors before copying

### Acceptance criteria
- Clean printed text recognized with >95% accuracy
- OCR completes in <8 seconds on mid-range Android
- Works fully offline after first use (cached language data)

---

## Phase 5 — Share & Export

**Goal:** Get captured quotes into the user's note-taking workflow with minimal friction.

### Deliverables
- **Web Share API** — share image directly to Android share sheet (Keep, Obsidian, Signal, etc.)
- **Google Drive integration** — share finished scans directly to Google Drive via share sheet with folder selection in Drive's UI
- **Copy image to clipboard** per gallery item
- **Batch export** — select multiple items → download as ZIP (JSZip library)
- Share extracted OCR text directly (plain text via Web Share API)

### Implementation notes
- Web Share API: `navigator.share({ files: [imageFile], title: 'BookLens Quote' })`
- Convert `dataURL` to `File` object for share/clipboard APIs
- Clipboard API: `navigator.clipboard.write([new ClipboardItem({ 'image/jpeg': blob })])`
- JSZip CDN: `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`
- Batch select UI: long-press to enter selection mode, checkboxes appear

### Acceptance criteria
- Share sheet appears with one tap from gallery item
- Google Drive appears as a share target; user can pick destination folder in Drive's UI
- Batch ZIP downloads correctly on Android Chrome
- Copy to clipboard works for both image and text

---

## File Structure (target)

```
BookLens/
├── BookLens.html          # Main app (single file, all phases)
├── manifest.json          # Phase 1
├── sw.js                  # Phase 1
├── icons/
│   ├── icon-192.png       # Phase 1
│   └── icon-512.png       # Phase 1
└── Documentation/
    ├── IMPLEMENTATION_PLAN.md   ← this file
    ├── CLAUDE.md                # Claude Code instructions
    ├── ARCHITECTURE.md          # Technical decisions & patterns
    └── CHANGELOG.md             # Version history
```

---

## Out of scope (for now)
- Cloud sync / account system
- Multi-language OCR (architecture supports it, not prioritized)
- iOS Safari support (PWA install flow differs; camera API works)
- Native APK (would require Capacitor/Cordova wrapper — separate project)
