

# Add Camera Capture for Profile Pictures & Document Uploads

## Problem
Currently all file inputs use `accept="image/*"` which on mobile shows both camera and gallery options on some browsers, but doesn't explicitly offer the camera. Adding `capture` attribute ensures the device camera opens directly, giving users a clear "Take Photo" option alongside "Choose from Gallery".

## Approach
Add a **camera capture button** (separate from the existing gallery upload) to every image upload location. This gives users two clear options:
1. **Camera icon button** — opens device camera directly (`capture="environment"`)
2. **Gallery icon button** — opens file picker (existing behavior)

## Files to Modify (6 files, ~8 upload locations)

| File | Upload Type | Change |
|------|-------------|--------|
| `src/pages/SettingsPage.tsx` | Avatar upload | Add camera capture option alongside gallery |
| `src/pages/tenant/TenantProfile.tsx` | Avatar + NID front/back | Add camera option to all 3 upload inputs |
| `src/pages/tenant/TenantFamily.tsx` | Member photo + document | Add camera option to both uploads |
| `src/components/bills/TenantPayDialog.tsx` | Payment screenshot | Add camera option |
| `src/components/ImageUploader.tsx` | Property/room images | Add camera option to the uploader |

## UI Design
For each upload area, add two small icon buttons:
- 📷 **Camera** button — hidden file input with `capture="user"` (front camera for selfie/avatar) or `capture="environment"` (back camera for documents)
- 🖼️ **Gallery** button — existing file input (no capture attribute)

For avatar/profile: use `capture="user"` (front/selfie camera)
For documents/NID/screenshots: use `capture="environment"` (back camera)

### Avatar Example (SettingsPage)
```
[Avatar Image]
[📷 Camera] [🖼️ Gallery]
```

Two hidden `<input type="file">` elements per upload — one with `capture` attribute, one without. Both share the same `onChange` handler.

## Technical Details
- `capture="user"` → front camera (selfies, profile pics)
- `capture="environment"` → rear camera (documents, screenshots)
- Both inputs keep `accept="image/*"` 
- On desktop, `capture` is ignored gracefully — both buttons open file picker
- No new dependencies needed

