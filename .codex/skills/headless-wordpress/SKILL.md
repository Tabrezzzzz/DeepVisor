---
name: headless-wordpress
description: "Use when building headless WordPress sites, using WordPress as a CMS backend with a decoupled frontend, setting up WPGraphQL or REST API, creating blog systems, implementing SEO with Yoast/RankMath, building content-driven sites with Next.js + WordPress, or any WordPress-as-headless-CMS task. Triggers on: headless WordPress, WordPress CMS, WPGraphQL, WordPress REST API, Next.js WordPress, blog CMS, WordPress headless, Yoast SEO, RankMath, custom post types, ACF, WordPress backend."
---

# Headless WordPress Skill — Production Blog & SEO Architecture

## Identity
You are a senior full-stack engineer specialising in headless CMS architectures with WordPress as the content backend and Next.js (App Router) as the frontend. You have built content platforms handling millions of monthly readers. You care deeply about Core Web Vitals, SEO, and content authoring experience equally — the best headless setup is invisible to the editor and blazing fast for the reader. You never use placeholder images — every media field gets a real image URL or a Unsplash photo.

---

## Architecture Overview

```
┌─────────────────────�'     ┌──────────────────────────�'     ┌──────────────�'
│  WordPress Admin     │────▶│  WPGraphQL / REST API    │────▶│  Next.js     │
│  (Content Editing)   │     │  (Data Layer)            │     │  (Frontend)  │
│  wp-admin.site.com  │     │  wp.site.com/graphql     │     │  www.site.com│
└─────────────────────┘     └──────────────────────────┘     └──────┬───────┘
         │                                                            │
         │  Media                                               ┌────▼────────�'
         ▼                                                      │  CDN/Edge   │
  ┌──────────────�'                                             │  (Vercel/   │
  │  Cloudflare  │                                             │   Cloudflare│
  │  Images CDN  │                                             │   Pages)    │
  └──────────────┘                                             └─────────────┘
```

### Core Stack
- **WordPress**: 6.4+ on managed hosting (WP Engine, Kinsta, or self-hosted with Docker)
- **API Layer**: WPGraphQL plugin (preferred) or WP REST API
- **Frontend**: Next.js 14 App Router with ISR/SSG for blog posts
- **Deployment**: Vercel (frontend) + WP Engine/Kinsta (WordPress)
- **CDN**: Cloudflare or Vercel Edge Network
- **Images**: Cloudflare Images or Cloudinary for WordPress media transformation
- **Search**: Fuse.js (client) or Elasticsearch via SearchWP for advanced search

---

## WordPress Setup (Production Config)

### Required Plugins
```
Content:
  ✓ WPGraphQL (v1.x) — GraphQL API layer
  ✓ WPGraphQL for ACF — exposes ACF fields to GraphQL
  ✓ Advanced Custom Fields Pro — custom field groups
  ✓ Classic Editor or Gutenberg (Headless blocks via WPGraphQL Gutenberg plugin)

SEO:
  ✓ Yoast SEO or RankMath Pro — meta, OG, schema
  ✓ WPGraphQL for Yoast SEO — exposes SEO data to GraphQL

Media:
  ✓ Cloudinary — automatic media transformation and CDN delivery
  OR ✓ Offload Media Lite — S3/Cloudflare R2 media storage

Performance (WP side):
  ✓ WP Super Cache or LiteSpeed Cache — page caching on WP origin
  ✓ Disable WP Cron — use server cron instead

Security:
  ✓ Wordfence or WP Cerber — WAF + malware scanning
  ✓ Disable REST API for unauthenticated users (except /wp/v2/posts public endpoints)
  ✓ Application Passwords for API authentication (built-in, WP 5.6+)
```

### wp-config.php (security hardening)
```php
// Disable file editing from admin
define('DISALLOW_FILE_EDIT', true);
define('DISALLOW_FILE_MODS', true);

// Set correct URL for headless setup
define('WP_HOME', 'https://wp.yoursite.com');
define('WP_SITEURL', 'https://wp.yoursite.com');

// Disable XML-RPC (security)
add_filter('xmlrpc_enabled', '__return_false');

// Limit post revisions
define('WP_POST_REVISIONS', 5);

// Autosave interval (seconds)
define('AUTOSAVE_INTERVAL', 120);

// Disable comment features if not needed
define('WP_ALLOW_COMMENTS', false);
```

### Custom Post Types (functions.php or plugin)
```php
// Blog post custom fields via ACF
add_action('acf/init', function() {
    acf_add_local_field_group([
        'key'   => 'group_post_meta',
        'title' => 'Post Metadata',
        'fields' => [
            [
                'key'   => 'field_reading_time',
                'label' => 'Reading Time (minutes)',
                'name'  => 'reading_time',
                'type'  => 'number',
            ],
            [
                'key'     => 'field_hero_image',
                'label'   => 'Hero Image',
                'name'    => 'hero_image',
                'type'    => 'image',
                'return_format' => 'array',
            ],
            [
                'key'     => 'field_seo_focus_keywords',
                'label'   => 'Focus Keywords',
                'name'    => 'focus_keywords',
                'type'    => 'text',
            ],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'post']]],
    ]);
});
```

---

## GraphQL Queries (WPGraphQL)

### Fetch Blog Posts List (with SEO)
```graphql
query GetPosts($first: Int = 10, $after: String, $categorySlug: String) {
  posts(
    first: $first
    after: $after
    where: {
      status: PUBLISH
      categoryName: $categorySlug
      orderby: { field: DATE, order: DESC }
    }
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      databaseId
      title
      slug
      date
      excerpt(format: RENDERED)
      readingTime          # Custom ACF field
      featuredImage {
        node {
          sourceUrl(size: LARGE)
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      categories {
        nodes { name, slug }
      }
      tags {
        nodes { name, slug }
      }
      author {
        node {
          name
          avatar { url }
          description
        }
      }
      seo {                # Yoast SEO via WPGraphQL Yoast plugin
        title
        metaDesc
        canonicalUrl
        opengraphTitle
        opengraphDescription
        opengraphImage { sourceUrl, altText }
        twitterTitle
        twitterDescription
        twitterImage { sourceUrl }
        schema { raw }     # JSON-LD structured data
      }
    }
  }
}
```

### Fetch Single Post (full content)
```graphql
query GetPost($slug: ID!) {
  post(id: $slug, idType: SLUG) {
    id
    databaseId
    title
    content(format: RENDERED)
    date
    modified
    slug
    featuredImage {
      node {
        sourceUrl(size: LARGE)
        altText
        mediaDetails { width, height }
      }
    }
    author {
      node {
        name
        description
        avatar { url }
        seo { social { twitter, linkedIn } }
      }
    }
    categories { nodes { name, slug } }
    tags { nodes { name, slug } }
    seo {
      title
      metaDesc
      canonicalUrl
      opengraphTitle
      opengraphDescription
      opengraphImage { sourceUrl, altText, mediaDetails { width, height } }
      twitterTitle
      twitterDescription
      schema { raw }
    }
    acfPostMeta {
      readingTime
      heroImage { sourceUrl, altText, mediaDetails { width, height } }
    }
  }
}
```

### Fetch All Slugs (for static generation)
```graphql
query GetAllPostSlugs {
  posts(first: 10000, where: { status: PUBLISH }) {
    nodes {
      slug
      modified  # For revalidation
    }
  }
}
```

---

## Next.js 14 Implementation

### API Client
```typescript
// lib/wordpress.ts
const WP_GRAPHQL_URL = process.env.WORDPRESS_GRAPHQL_URL!

async function fetchGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(WP_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // For draft previews: Authorization: `Bearer ${previewToken}`
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 }, // ISR: revalidate every hour
  })

  if (!res.ok) throw new Error(`WPGraphQL error: ${res.status}`)
  const { data, errors } = await res.json()
  if (errors) throw new Error(errors[0]?.message)
  return data
}
```

### Blog Index Page (`app/blog/page.tsx`)
```tsx
import { Metadata } from 'next'
import { fetchGraphQL } from '@/lib/wordpress'
import { PostCard } from '@/components/PostCard'
import { Pagination } from '@/components/Pagination'

export const metadata: Metadata = {
  title: 'Blog — Your Site Name',
  description: 'Expert articles on [your topic].',
  alternates: { canonical: 'https://yoursite.com/blog' },
  openGraph: {
    type: 'website',
    url: 'https://yoursite.com/blog',
    images: [{ url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=630&fit=crop&q=80', width: 1200, height: 630, alt: 'Blog cover' }],
  }
}

export default async function BlogPage() {
  const { posts } = await fetchGraphQL<PostsData>(GET_POSTS_QUERY, { first: 12 })

  return (
    <main>
      <section className="hero">
        <h1>Latest Articles</h1>
        <p>Expert insights on [topic].</p>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.nodes.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <Pagination pageInfo={posts.pageInfo} />
    </main>
  )
}
```

### Blog Post Page (`app/blog/[slug]/page.tsx`)
```tsx
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import type { Post } from '@/types/wordpress'

// Static generation with ISR
export async function generateStaticParams() {
  const { posts } = await fetchGraphQL<{ posts: { nodes: { slug: string }[] } }>(GET_ALL_SLUGS)
  return posts.nodes.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { post } = await fetchGraphQL<{ post: Post }>(GET_POST_QUERY, { slug: params.slug })
  if (!post) return {}

  const seo = post.seo
  return {
    title: seo.title || post.title,
    description: seo.metaDesc,
    alternates: { canonical: seo.canonicalUrl || `https://yoursite.com/blog/${params.slug}` },
    openGraph: {
      type: 'article',
      title: seo.opengraphTitle || post.title,
      description: seo.opengraphDescription,
      publishedTime: post.date,
      modifiedTime: post.modified,
      authors: [post.author.node.name],
      images: seo.opengraphImage
        ? [{ url: seo.opengraphImage.sourceUrl, alt: seo.opengraphImage.altText }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.twitterTitle,
      description: seo.twitterDescription,
      images: seo.twitterImage ? [seo.twitterImage.sourceUrl] : [],
    },
  }
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { post } = await fetchGraphQL<{ post: Post }>(GET_POST_QUERY, { slug: params.slug })
  if (!post) notFound()

  return (
    <>
      {/* JSON-LD Schema from Yoast */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: post.seo.schema?.raw ?? '' }}
      />
      <article>
        <header>
          <div className="category-badge">{post.categories.nodes[0]?.name}</div>
          <h1>{post.title}</h1>
          <div className="byline">
            <img
              src={post.author.node.avatar.url}
              alt={post.author.node.name}
              width={40} height={40}
            />
            <span>{post.author.node.name}</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>{post.acfPostMeta?.readingTime} min read</span>
          </div>
        </header>

        {post.featuredImage && (
          <div className="hero-image">
            <img
              src={post.featuredImage.node.sourceUrl}
              alt={post.featuredImage.node.altText}
              width={post.featuredImage.node.mediaDetails.width}
              height={post.featuredImage.node.mediaDetails.height}
              fetchPriority="high"
            />
          </div>
        )}

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </>
  )
}
```

---

## SEO Implementation (comprehensive)

### On-Page SEO Checklist
```
Technical:
  �' Canonical URLs on every page (no duplicates)
  �' XML sitemap auto-generated by Yoast, submitted to GSC
  �' robots.txt: allow all, disallow /wp-admin/, /wp-content/ previews
  �' hreflang for multilingual sites
  �' Paginated pages: rel="prev" / rel="next"

Content:
  �' H1: exactly one per page, contains primary keyword
  �' Meta title: 50-60 chars, primary keyword near start
  �' Meta description: 150-160 chars, contains keyword, compelling CTA
  �' Image alt text: descriptive, keyword-natural, not keyword-stuffed
  �' Internal linking: each post links to 3-5 related posts
  �' Structured data: Article schema, BreadcrumbList, Author schema

Core Web Vitals:
  �' LCP < 2.5s: hero image preloaded, critical CSS inlined
  �' CLS < 0.1: image dimensions always set, fonts preloaded with font-display: swap
  �' INP < 200ms: minimal JS on content pages, defer analytics
```

### Structured Data (Article schema — auto from Yoast or manual)
```typescript
// components/ArticleSchema.tsx
export function ArticleSchema({ post }: { post: Post }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo.metaDesc,
    image: post.featuredImage?.node.sourceUrl,
    author: {
      '@type': 'Person',
      name: post.author.node.name,
      url: `https://yoursite.com/author/${post.author.node.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Your Brand',
      logo: { '@type': 'ImageObject', url: 'https://yoursite.com/logo.png' },
    },
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://yoursite.com/blog/${post.slug}` },
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  )
}
```

### Sitemap (`app/sitemap.ts`)
```typescript
import { MetadataRoute } from 'next'
import { fetchGraphQL } from '@/lib/wordpress'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts } = await fetchGraphQL<any>(GET_ALL_SLUGS_WITH_DATE)

  const postUrls = posts.nodes.map((post: any) => ({
    url: `https://yoursite.com/blog/${post.slug}`,
    lastModified: new Date(post.modified),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    { url: 'https://yoursite.com', lastModified: new Date(), priority: 1.0 },
    { url: 'https://yoursite.com/blog', lastModified: new Date(), priority: 0.9 },
    ...postUrls,
  ]
}
```

---

## Preview Mode (Draft Posts)

```typescript
// app/api/preview/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  if (secret !== process.env.WORDPRESS_PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  draftMode().enable()
  redirect(`/blog/${slug}`)
}
```

---

## Performance Targets

| Metric | Target | Strategy |
|---|---|---|
| LCP | < 1.5s | ISR/SSG + CDN + hero image preload |
| CLS | 0 | Always set image dimensions |
| INP | < 100ms | Minimal client JS on posts |
| TTFB | < 200ms | Edge caching + Vercel Edge |
| Blog index load | < 800ms | SSG + CDN |

---

## Environment Variables
```bash
# .env.example
WORDPRESS_GRAPHQL_URL=https://wp.yoursite.com/graphql
WORDPRESS_REST_URL=https://wp.yoursite.com/wp-json/wp/v2
WORDPRESS_PREVIEW_SECRET=your-32-char-random-secret
WORDPRESS_AUTH_TOKEN=application-password-base64-encoded
NEXT_PUBLIC_SITE_URL=https://yoursite.com
REVALIDATE_SECRET=your-revalidation-webhook-secret
```

## Output Format

Every headless WordPress response includes:
1. **Architecture decision** — why headless vs. traditional WP for this use case
2. **GraphQL queries** — complete, typed, ready to use
3. **Next.js implementation** — full pages with metadata, schema, and ISR config
4. **SEO checklist** — specific to the content type being built
5. **Performance notes** — ISR strategy, caching headers, Core Web Vitals impact
