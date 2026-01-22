import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lexnify.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl

  // Static routes
  const routes = [
    '',
    '/landing',
    '/pricing',
    '/sign-in',
    '/sign-up',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' || route === '/landing' ? 1.0 : 0.8,
  }))

  // Note: Dynamic event pages would be added here if we had access to the database
  // For now, we'll include the pattern in robots.txt

  return routes
}
