

# Add Image Crop for Profile Pictures

## Problem
Profile pictures appear distorted (চেপ্টা/squashed) because images are resized without maintaining a square aspect ratio. A rectangular photo gets squeezed into a circular avatar.

## Solution
Add a crop dialog using `react-image-crop` that lets users select a square area before uploading. This ensures the avatar is always a perfect square — no distortion.

## How It Works
1. User selects/captures a photo → instead of uploading immediately, a **crop dialog** opens
2. The dialog shows the image with a **locked 1:1 square crop area**
3. User adjusts the crop area, then clicks "Save"
4. The cropped square image is compressed and uploaded

## Changes

### 1. Install `react-image-crop` package
Lightweight, well-maintained crop library (~15KB).

### 2. Create `src/components/ImageCropDialog.tsx` (new file)
A reusable dialog component:
- Takes an image file as input
- Shows a 1:1 aspect ratio crop UI
- Returns a cropped `Blob` on confirm
- Bangla/English labels

### 3. Update `src/pages/SettingsPage.tsx`
- On file select, open crop dialog instead of uploading directly
- On crop confirm, upload the cropped blob

### 4. Update `src/pages/tenant/TenantProfile.tsx`
- Same pattern for the avatar upload section
- Document uploads (NID front/back) remain unchanged — no crop needed there

| File | Change |
|------|--------|
| `package.json` | Add `react-image-crop` |
| `src/components/ImageCropDialog.tsx` | New — reusable crop dialog |
| `src/pages/SettingsPage.tsx` | Use crop dialog for avatar |
| `src/pages/tenant/TenantProfile.tsx` | Use crop dialog for avatar |

