# SEO Optimization Guide

This document outlines all SEO optimizations implemented for EventOrg (lexnify.com).

## Domain Configuration

- **Production Domain**: `https://lexnify.com`
- **Environment Variable**: `NEXT_PUBLIC_APP_URL` should be set to `https://lexnify.com` in production

## Implemented SEO Features

### 1. Root Layout Metadata (`app/layout.tsx`)

✅ **Comprehensive Metadata**
- Title with template support
- Rich meta descriptions
- Keywords for search engine optimization
- Author, creator, and publisher information

✅ **Open Graph Tags**
- Full Open Graph implementation for social sharing
- Custom images (1200x630px)
- Locale settings (en_IN)
- Site name and URL

✅ **Twitter Card Tags**
- Summary large image cards
- Optimized for Twitter sharing
- Custom images and descriptions

✅ **Robots Meta Tags**
- Proper indexing directives
- Googlebot-specific rules
- Image and video preview settings

✅ **Canonical URLs**
- Prevents duplicate content issues
- Points to correct domain

### 2. Sitemap (`app/sitemap.ts`)

✅ **Dynamic Sitemap Generation**
- Static routes included (/, /landing, /pricing, etc.)
- Priority and change frequency settings
- Last modified dates
- Accessible at `/sitemap.xml`

**Note**: Dynamic event routes are discoverable through crawling. To include them in the sitemap, you would need to fetch all public events from the database.

### 3. Robots.txt (`app/robots.ts`)

✅ **Search Engine Crawling Rules**
- Allows all public pages
- Blocks private routes (/dashboard, /api, /settings)
- Allows Googlebot with specific rules
- Points to sitemap location

### 4. Landing Page SEO (`app/landing/page.tsx`)

✅ **Page-Specific Metadata**
- Optimized title and description
- Targeted keywords
- Open Graph and Twitter Card tags
- Canonical URL

✅ **Structured Data (JSON-LD)**
- **SoftwareApplication Schema**: App details, pricing, ratings
- **Organization Schema**: Company information
- **FAQPage Schema**: FAQ content for rich snippets

### 5. Event Pages SEO (`app/event/[slug]/page.tsx`)

✅ **Dynamic Metadata Generation**
- Event-specific titles and descriptions
- Open Graph tags with event images
- Twitter Card support
- Event-specific canonical URLs

✅ **Event Structured Data (JSON-LD)**
- **Event Schema**: Full event details
- Location information (online/offline)
- Organizer details
- Pricing information
- Start/end dates and times

## SEO Best Practices Implemented

### ✅ Technical SEO
- Proper HTML structure
- Semantic HTML5 elements
- Mobile-responsive design
- Fast page load times (Next.js optimization)
- Proper heading hierarchy

### ✅ On-Page SEO
- Optimized title tags (50-60 characters)
- Meta descriptions (150-160 characters)
- Keyword optimization
- Internal linking structure
- Image alt text (via components)

### ✅ Structured Data
- JSON-LD format (recommended by Google)
- Multiple schema types (Event, SoftwareApplication, Organization, FAQPage)
- Rich snippets support

### ✅ Social Media Optimization
- Open Graph tags for Facebook/LinkedIn
- Twitter Card tags
- Optimized images for sharing

### ✅ Search Engine Guidelines
- robots.txt configuration
- Sitemap.xml generation
- Canonical URLs
- Proper redirects

## Keywords Targeted

Primary keywords:
- event management
- WhatsApp event invitations
- event attendance tracking
- QR code check-in
- event registration
- event organizer software
- WhatsApp automation
- event management India

Long-tail keywords:
- workshop management software
- seminar management tool
- training event management
- yoga class management
- fitness class management
- community event management

## Next Steps for Better SEO

### 1. Content Optimization
- Add blog section for content marketing
- Create helpful guides and tutorials
- User-generated content (testimonials, case studies)

### 2. Technical Improvements
- Add dynamic sitemap generation for events (fetch from database)
- Implement hreflang tags if multi-language support is added
- Add breadcrumb structured data
- Implement review/rating structured data

### 3. Performance
- Optimize images (already using Next.js Image component)
- Implement lazy loading
- Monitor Core Web Vitals
- Use CDN for static assets

### 4. Link Building
- Create backlinks from relevant directories
- Guest posting on event management blogs
- Partner with event organizers
- Social media presence

### 5. Analytics & Monitoring
- Set up Google Search Console
- Monitor Google Analytics
- Track keyword rankings
- Monitor search performance

## Verification Checklist

- [x] Meta tags implemented
- [x] Open Graph tags added
- [x] Twitter Cards configured
- [x] Structured data (JSON-LD) added
- [x] Sitemap.xml generated
- [x] Robots.txt configured
- [x] Canonical URLs set
- [x] Domain updated to lexnify.com
- [x] Mobile-responsive design
- [x] Fast page load times

## Testing Your SEO

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
4. **Google Search Console**: Submit sitemap and monitor indexing
5. **PageSpeed Insights**: https://pagespeed.web.dev/

## Environment Variables

Make sure these are set in production (Vercel):

```env
NEXT_PUBLIC_APP_URL=https://lexnify.com
```

## Notes

- Dynamic event pages are automatically discoverable through crawling
- Structured data helps with rich snippets in search results
- All metadata is server-rendered for better SEO
- Images are optimized using Next.js Image component
- The app follows Next.js 14 App Router best practices for SEO

---

**Last Updated**: 2024
**Domain**: https://lexnify.com
