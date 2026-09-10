import { listPublishedPostsAction } from '@/actions/posts/posts'
import { siteConfig } from '@/config/site'
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/routing'
import { blogCms } from '@/lib/cms'
import { db } from '@/lib/db'
import { posts as postsSchema } from '@/lib/db/schema'
import { DOCS_NAV, isDocsNavGroup } from '@/lib/docs/nav'
import { MetadataRoute } from 'next'
import { eq, max } from 'drizzle-orm'

const siteUrl = siteConfig.url

const STATIC_PAGE_MTIME = new Date(new Date().getFullYear(), 0, 1)

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' | undefined

function localizedUrl(locale: string, path: string) {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  return `${siteUrl}${prefix}${path}`
}

function docsPaths(): string[] {
  const paths = ['/docs']
  for (const entry of DOCS_NAV) {
    if (isDocsNavGroup(entry)) {
      paths.push(...entry.items.map((item) => item.href))
    } else {
      paths.push(entry.href)
    }
  }
  return paths
}

const MARKETING_PATHS = [
  '/about',
  '/roadmap',
  '/subscribe',
  '/tools/shadowban-check',
  '/tools/twitter-advanced-search',
  '/alternatives/readwise-alternative',
  '/alternatives/dewey-alternative',
  '/alternatives/tweetstorm-alternative',
]

const LEGAL_PATHS = [
  '/privacy-policy',
  '/terms-of-service',
  '/refund-policy',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ['', ...docsPaths(), ...MARKETING_PATHS]

  const pages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    staticPages.map((page) => ({
      url: localizedUrl(locale, page),
      lastModified: STATIC_PAGE_MTIME,
      changeFrequency: (page.startsWith('/docs') ? 'weekly' : 'daily') as ChangeFrequency,
      priority: page === '' ? 1.0 : page.startsWith('/docs') ? 0.8 : 0.7,
    }))
  )

  for (const path of LEGAL_PATHS) {
    pages.push({
      url: `${siteUrl}${path}`,
      lastModified: STATIC_PAGE_MTIME,
      changeFrequency: 'yearly',
      priority: 0.3,
    })
  }

  const [latestGlossaryResult] = await db
    .select({ latest: max(postsSchema.updatedAt) })
    .from(postsSchema)
    .where(eq(postsSchema.postType, 'glossary'));
  const glossaryContentMtime = latestGlossaryResult?.latest
    ? new Date(latestGlossaryResult.latest)
    : STATIC_PAGE_MTIME;

  const allBlogSitemapEntries: MetadataRoute.Sitemap = [];

  const [latestBlogResult] = await db
    .select({ latest: max(postsSchema.updatedAt) })
    .from(postsSchema)
    .where(eq(postsSchema.postType, 'blog'));
  const blogContentMtime = latestBlogResult?.latest
    ? new Date(latestBlogResult.latest)
    : STATIC_PAGE_MTIME;

  // Add blog list page
  for (const locale of LOCALES) {
    allBlogSitemapEntries.push({
      url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/blog`,
      lastModified: blogContentMtime,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.8,
    });
  }

  for (const locale of LOCALES) {
    const { posts: localPosts } = await blogCms.getLocalList(locale);
    localPosts
      .filter((post) => post.slug && post.status !== "draft")
      .forEach((post) => {
        const slugPart = post.slug.replace(/^\//, "").replace(/^blogs\//, "");
        if (slugPart) {
          allBlogSitemapEntries.push({
            url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/blog/${slugPart}`,
            lastModified: post.metadata?.updatedAt || post.publishedAt || new Date(),
            changeFrequency: 'daily' as ChangeFrequency,
            priority: 0.7,
          });
        }
      });
  }

  for (const locale of LOCALES) {
    const serverResult = await listPublishedPostsAction({
      locale: locale,
      pageSize: 1000,
      visibility: "public",
      postType: "blog",
    });
    if (serverResult.success && serverResult.data?.posts) {
      serverResult.data.posts.forEach((post) => {
        const slugPart = post.slug?.replace(/^\//, "").replace(/^blogs\//, "");
        if (slugPart) {
          allBlogSitemapEntries.push({
            url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/blog/${slugPart}`,
            lastModified: post.publishedAt || new Date(),
            changeFrequency: 'daily' as ChangeFrequency,
            priority: 0.7,
          });
        }
      });
    }
  }

  const uniqueBlogPostEntries = Array.from(
    new Map(allBlogSitemapEntries.map((entry) => [entry.url, entry])).values()
  );

  // Glossary entries (server-side only, no local file system access)
  const allGlossarySitemapEntries: MetadataRoute.Sitemap = [];

  // Add glossary list page
  for (const locale of LOCALES) {
    allGlossarySitemapEntries.push({
      url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/glossary`,
      lastModified: glossaryContentMtime,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.8,
    });
  }

  // Add glossary entries
  for (const locale of LOCALES) {
    const serverResult = await listPublishedPostsAction({
      locale: locale,
      pageSize: 1000,
      visibility: "public",
      postType: "glossary",
    });
    if (serverResult.success && serverResult.data?.posts) {
      serverResult.data.posts.forEach((post) => {
        const slugPart = post.slug?.replace(/^\//, "").replace(/^glossary\//, "");
        if (slugPart) {
          allGlossarySitemapEntries.push({
            url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/glossary/${slugPart}`,
            lastModified: post.publishedAt || new Date(),
            changeFrequency: 'daily' as ChangeFrequency,
            priority: 0.7,
          });
        }
      });
    }
  }

  const uniqueGlossaryEntries = Array.from(
    new Map(allGlossarySitemapEntries.map((entry) => [entry.url, entry])).values()
  );

  return [
    ...pages,
    ...uniqueBlogPostEntries,
    ...uniqueGlossaryEntries
  ]
}