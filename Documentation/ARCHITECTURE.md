# Architecture — BookLens

Technical decisions, patterns, and rationale.

---

## Image Data Flow

```
Camera / File Input
       │
       ▼ dataURL (JPEG, ~95% quality)
Enhancement Panel (Phase 3)
       │
       ▼ processed dataURL
Crop Workspace
       │  box{x,y,w,h} as % of displayed image
       ▼
saveCrop() — offscreen canvas pipeline:
  1. Draw source image to canvas at natural resolution
  2. Apply rotation via translate+rotate transform
  3. Extract crop region using box{} mapped to natural px
  4. Output as JPEG dataURL (~92% quality)
       │
       ├─▶ Trigger browser download (a.click())
       └─▶ Push to saved[] → localStorage
```

---

## Crop Coordinate System

The `box` object stores crop bounds as **percentages of the displayed image element**
(i.e., after CSS object-fit scaling). This makes the crop box UI resolution-independent.

When rendering to canvas in `saveCrop()`:
```
cropX_px = (box.x / 100) * naturalWidth
cropY_px = (box.y / 100) * naturalHeight
cropW_px = (box.w / 100) * naturalWidth
cropH_px = (box.h / 100) * naturalHeight
```

When rotation is applied, the natural dimensions expand to the rotated bounding box
dimensions (`rotW`, `rotH`) before the crop extraction step.

---

## Screen Navigation

Single-page app. All screens are `position: fixed; inset: 0`. Visibility toggled via
`.hidden` class (opacity: 0 + pointer-events: none + slight translateY).

No router. No history API. Navigation is always intentional via button press.
Back navigation restores the prior screen explicitly (no browser back button support
in standalone PWA mode by design — avoids accidental exit).

---

## Storage

**localStorage** (`booklens_saves`): Array of `{id: timestamp, dataURL: string}`.
- `id` is `Date.now()` at save time — used as filename and sort key
- `dataURL` is the full base64 JPEG — roughly 200–800KB per image
- localStorage limit is ~5MB on most Android Chrome builds
- ~8–20 images max before hitting limits depending on resolution
- **Phase 5** batch export addresses this — export and delete old items

No IndexedDB in v0.1. Phase 5 may migrate to IDB for larger storage if needed.

---

## Camera

Uses `getUserMedia` with `facingMode: 'environment'` (rear camera) by default.
Resolution hint: `{ width: { ideal: 2048 }, height: { ideal: 2048 } }` — browser
picks the closest supported resolution.

`flipCamera()` stops the stream and restarts with the alternate `facingMode`.
Stream is stored in the module-level `stream` variable and explicitly stopped on
navigation away from the camera screen.

---

## Phase 1 — Service Worker Strategy

Cache name: `booklens-v1`

Pre-cache on install:
- `BookLens.html`
- `manifest.json`
- Google Fonts CSS + woff2 files (fetched and cached on first load)
- Tesseract.js CDN bundle
- `eng.traineddata` (~10MB, fetched on first OCR use, then cached)

Fetch strategy: **Cache-first** for all cached assets. Fall through to network for
anything not in cache. No dynamic caching of user content (images stay in localStorage).

---

## Phase 3 — Image Processing Pipeline

All processing via Canvas 2D `getImageData` / `putImageData`. No WebGL.

### Auto-levels algorithm
1. Build per-channel histograms (R, G, B) from `getImageData`
2. Find 1st and 99th percentile values per channel (ignore outliers)
3. Apply linear stretch: `out = (in - low) / (high - low) * 255`

### Sharpening kernel (3×3 convolution)
```
 0  -1   0
-1   5  -1
 0  -1   0
```
Applied via manual pixel loop over `getImageData`. Edge pixels are clamped.

### Document mode sequence
1. Auto-levels
2. Partial desaturate (lerp toward grayscale at 70%)
3. Contrast boost (factor 1.8, centered at 128)
4. Sharpen (1 pass)

### Performance
- Process on offscreen canvas at display resolution (not natural resolution) for preview
- Apply at natural resolution only at save time
- Debounce slider input at 100ms before reprocessing

---

## Phase 4 — Tesseract.js Integration

```javascript
// Lazy init pattern
let ocrWorker = null;

async function getOCRWorker() {
  if (!ocrWorker) {
    ocrWorker = await Tesseract.createWorker('eng');
  }
  return ocrWorker;
}

async function recognizeImage(dataURL) {
  const worker = await getOCRWorker();
  const { data: { text } } = await worker.recognize(dataURL);
  return text;
}
```

Worker is created once and reused. `eng.traineddata` is downloaded on first call
and cached by the service worker for offline use.

---

## Phase 5 — Web Share API

```javascript
async function shareImage(dataURL) {
  const blob = await (await fetch(dataURL)).blob();
  const file = new File([blob], 'booklens_quote.jpg', { type: 'image/jpeg' });
  await navigator.share({ files: [file], title: 'BookLens Quote' });
}
```

Feature-detected before use: `if (navigator.canShare && navigator.canShare({ files: [...] }))`.
Falls back to download if Web Share API unavailable.
