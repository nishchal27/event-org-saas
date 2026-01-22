# PWA Installation Guide for Lexnify

## Overview

Lexnify is configured as a Progressive Web App (PWA), which means users can install it on their phones like a native app. This provides a better user experience with:
- Quick access from home screen
- Faster loading times
- Offline capability (with service worker)
- App-like experience without app store

## How It Works

### Automatic Browser Prompts

**Android (Chrome/Edge):**
- Browser automatically shows an install banner after user visits the site
- Appears in the address bar or as a bottom sheet
- User can tap "Install" or "Add to Home Screen"

**iOS (Safari):**
- Users need to use the Share button → "Add to Home Screen"
- No automatic prompt (Apple's limitation)
- Our custom prompt guides iOS users

### Custom Install Prompt

We've added a custom install prompt component that:
- ✅ Only shows on mobile devices
- ✅ Detects if app is already installed
- ✅ Shows a friendly banner with "Install Lexnify" button
- ✅ Remembers if user dismissed it (won't show again for 1 week)
- ✅ Automatically hides after installation

## What Happens When Someone Shares a Link

When someone shares a Lexnify link (WhatsApp, social media, etc.), the shared preview shows:

**Title:** "Lexnify - Event Management Made Simple"

**Description:** "Create events, send WhatsApp invitations, and track attendance — for groups, instructors, and organizers. Install Lexnify on your phone for quick access to event management."

**Image:** Hero image from the landing page

This appears in:
- WhatsApp link previews
- Facebook/Twitter/LinkedIn shares
- SMS link previews
- Other social platforms

## Installation Requirements

For the app to be installable, it needs:
1. ✅ HTTPS (required for PWA)
2. ✅ Valid manifest.json (configured)
3. ✅ Service worker (handled by next-pwa)
4. ✅ Icons (192x192 and 512x512 PNG files needed)

## Current Status

✅ **Configured:**
- PWA manifest with proper metadata
- Custom install prompt component
- Service worker (via next-pwa)
- Open Graph tags for better sharing
- Theme colors and branding

⚠️ **Action Required:**
Generate PNG icon files:
- `public/logo/icon-192.png` (192x192px)
- `public/logo/icon-512.png` (512x512px)
- `public/logo/icon-180.png` (180x180px for iOS)

See `LOGO_SETUP.md` for instructions on generating these from the SVG.

## Testing Installation

### On Android:
1. Open Chrome/Edge on Android
2. Visit lexnify.com
3. Wait a few seconds
4. Look for install banner in address bar or bottom sheet
5. Or use our custom prompt that appears

### On iOS:
1. Open Safari on iPhone/iPad
2. Visit lexnify.com
3. Tap Share button (square with arrow)
4. Scroll down and tap "Add to Home Screen"
5. Customize name if needed
6. Tap "Add"

### Desktop:
- Chrome/Edge: Install button in address bar
- Not as common, but still works

## User Experience

When users install Lexnify:
1. App icon appears on home screen
2. Opens in standalone mode (no browser UI)
3. Faster loading (cached assets)
4. Can work offline (with service worker)
5. Feels like a native app

## Customization

The install prompt can be customized in:
- `components/install-prompt.tsx` - Change message, styling, behavior
- `app/manifest.json` - Change app name, description, colors
- `app/layout.tsx` - Update Open Graph metadata for sharing

## Benefits for Your SaaS

1. **Higher Engagement:** Installed apps get 3x more usage
2. **Better UX:** Faster, app-like experience
3. **Professional:** Shows you're modern and tech-savvy
4. **Easy Sharing:** Great previews when links are shared
5. **Mobile-First:** Perfect for your WhatsApp-focused audience

## Notes

- Installation is optional - users can still use the website normally
- Works best on mobile devices
- Requires HTTPS in production
- Service worker caches assets for offline use
- Updates automatically when you deploy new versions
