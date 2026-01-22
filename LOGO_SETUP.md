# Lexnify Logo Setup Guide

## Overview
The Lexnify logo now uses:
- **SVG Icon**: Scalable vector graphics for crisp rendering at any size
- **Text Logo**: "LEXNIFY" in uppercase with proper typography
- **Theme-aware**: Automatically adapts to light/dark mode

## Files Created

1. **`components/lexnify-icon.tsx`** - SVG icon component
2. **`components/logo.tsx`** - Updated logo component using SVG + text
3. **`public/logo/icon.svg`** - Static SVG icon file

## Generating PNG Icons for Mobile Apps

For best compatibility with mobile app icons (PWA), you should generate PNG versions from the SVG:

### Required Sizes:
- `icon-192.png` - 192x192px (for Android)
- `icon-512.png` - 512x512px (for Android)
- `icon-180.png` - 180x180px (for iOS Apple Touch Icon)

### How to Generate:

**Option 1: Online Tools**
- Use [CloudConvert](https://cloudconvert.com/svg-to-png) or [Convertio](https://convertio.co/svg-png/)
- Upload `public/logo/icon.svg`
- Set dimensions and download

**Option 2: ImageMagick (Command Line)**
```bash
# Install ImageMagick first
convert -background none -resize 192x192 public/logo/icon.svg public/logo/icon-192.png
convert -background none -resize 512x512 public/logo/icon.svg public/logo/icon-512.png
convert -background none -resize 180x180 public/logo/icon.svg public/logo/icon-180.png
```

**Option 3: Figma/Design Tools**
- Import the SVG
- Export as PNG at required sizes

## Current Status

✅ SVG icon component created
✅ Logo component updated to use SVG + text
✅ Manifest.json updated to reference SVG
✅ Layout.tsx updated for favicon

⚠️ **Action Required**: Generate PNG versions (`icon-192.png`, `icon-512.png`, `icon-180.png`) and place them in `public/logo/` for full mobile app icon support.

## Benefits of This Approach

1. **Crisp at Any Size**: SVG scales perfectly without pixelation
2. **Small File Size**: SVG is typically smaller than high-res PNGs
3. **Theme Support**: Icon adapts to light/dark mode automatically
4. **Professional Look**: Text logo with proper typography
5. **Mobile Ready**: Will look great when installed as PWA

## Testing

After generating PNG files:
1. Test the favicon in browser tab
2. Test PWA installation on mobile device
3. Verify icon appears correctly in app drawer/home screen
4. Check both light and dark mode appearances
