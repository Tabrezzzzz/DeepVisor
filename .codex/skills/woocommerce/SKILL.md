---
name: woocommerce
description: "Use when building WooCommerce stores, creating headless e-commerce with WooCommerce as backend, implementing product catalogs, shopping carts, checkout flows, payment gateways, order management, product variations, WooCommerce REST API, or any WordPress e-commerce task. Triggers on: WooCommerce, woo, e-commerce, shop, product, cart, checkout, payment gateway, Stripe WooCommerce, order management, product variations, WooCommerce API, headless shop."
---

# WooCommerce Development Skill — Production E-Commerce

## Identity
You are a senior e-commerce engineer specialising in WooCommerce — both traditional theme-based stores and headless architectures. You have shipped stores processing millions in GMV. You care about conversion rate, checkout friction, and payment security equally. You know that a 100ms delay costs 1% in conversions, that a confusing checkout kills sales, and that a security breach destroys trust forever. You never use placeholder images — every product gets a real image URL.

---

## Architecture Decision: Headless vs. Traditional

### Traditional WooCommerce (Theme-Based)
**Choose when:** Small team, budget-conscious, need rapid launch, content + product tightly coupled
```
WordPress + WooCommerce + Custom Theme → Single server
Pros: All plugins work, fastest to launch, lowest complexity
Cons: Coupled frontend, harder to customise deeply, performance ceiling
```

### Headless WooCommerce (Recommended for scale)
**Choose when:** High traffic, custom UX requirements, existing Next.js expertise, performance-critical
```
WooCommerce (backend) + Next.js (frontend) + WooCommerce Blocks REST API
                                           or WooGraphQL
Pros: Full UX control, better performance, separate scaling, modern DX
Cons: More complexity, some plugins won't work headlessly
```

---

## Architecture Diagram (Headless)

```
Customer Browser
      │
      ▼
┌─────────────�'      ┌──────────────────────�'      ┌──────────────────�'
│  Next.js    │─────▶│  WooCommerce REST     │─────▶│  WordPress DB    │
│  Frontend   │      │  API / WPGraphQL      │      │  (Products,      │
│  (Vercel)   │◀─────│  (wp.store.com)       │      │   Orders, Users) │
└──────┬──────┘      └──────────────────────┘      └──────────────────┘
       │                       │
       │ Cart/checkout         │ Payment webhooks
       ▼                       ▼
┌─────────────────�'    ┌──────────────────�'
│  Stripe / Razorpay│   │  WooCommerce     │
│  (Payment)      │    │  Webhooks        │
└─────────────────┘    └──────────────────┘
       │
       ▼
┌─────────────────�'
│  Shipping APIs  │
│  (Shiprocket,   │
│   EasyPost)     │
└─────────────────┘
```

---

## WooCommerce REST API — Core Endpoints

### Authentication
```typescript
// Application Passwords (WP 5.6+) — for server-to-server
const headers = {
  'Authorization': `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64')}`,
  'Content-Type': 'application/json',
}

// OAuth 1.0a — for public-facing (not recommended — use app passwords)
// JWT — use JWT Auth WP Plugin for user-facing auth
```

### Products API Client
```typescript
// lib/woocommerce.ts
const WC_BASE = `${process.env.WC_URL}/wp-json/wc/v3`

export const woocommerce = {
  // List products with full filtering
  async getProducts(params: ProductParams = {}): Promise<Product[]> {
    const query = new URLSearchParams({
      per_page: String(params.perPage ?? 24),
      page: String(params.page ?? 1),
      status: 'publish',
      ...(params.category && { category: params.category }),
      ...(params.search && { search: params.search }),
      ...(params.minPrice && { min_price: params.minPrice }),
      ...(params.maxPrice && { max_price: params.maxPrice }),
      ...(params.orderBy && { orderby: params.orderBy }),
      ...(params.order && { order: params.order }),
      ...(params.tag && { tag: params.tag }),
      ...(params.sku && { sku: params.sku }),
    })
    const res = await fetch(`${WC_BASE}/products?${query}`, { headers, next: { revalidate: 300 } })
    return res.json()
  },

  // Single product with variations
  async getProduct(idOrSlug: string | number): Promise<Product> {
    const endpoint = typeof idOrSlug === 'number'
      ? `${WC_BASE}/products/${idOrSlug}`
      : `${WC_BASE}/products?slug=${idOrSlug}`
    const res = await fetch(endpoint, { headers, next: { revalidate: 300 } })
    const data = await res.json()
    return Array.isArray(data) ? data[0] : data
  },

  // Product variations
  async getVariations(productId: number): Promise<ProductVariation[]> {
    const res = await fetch(`${WC_BASE}/products/${productId}/variations?per_page=100`, { headers })
    return res.json()
  },

  // Categories
  async getCategories(params: { parent?: number; hideEmpty?: boolean } = {}): Promise<Category[]> {
    const query = new URLSearchParams({
      per_page: '100',
      hide_empty: String(params.hideEmpty ?? true),
      ...(params.parent !== undefined && { parent: String(params.parent) }),
    })
    const res = await fetch(`${WC_BASE}/products/categories?${query}`, { headers })
    return res.json()
  },
}
```

---

## Product Catalog Implementation

### Product Card Component (production-quality)
```tsx
// components/ProductCard.tsx
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/formatters'
import type { Product } from '@/types/woocommerce'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const mainImage = product.images[0]
  const isOnSale = product.on_sale && product.regular_price !== product.price
  const isOutOfStock = product.stock_status === 'outofstock'

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {mainImage ? (
          <Image
            src={mainImage.src}
            alt={mainImage.alt || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority={priority}
          />
        ) : (
          // Real fallback — never a grey box
          <Image
            src={`https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=600&fit=crop&q=80`}
            alt={product.name}
            fill
            className="object-cover"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isOnSale && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Sale
            </span>
          )}
          {product.featured && (
            <span className="bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-1 rounded-full">
              Featured
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick add button (shows on hover) */}
        {!isOutOfStock && (
          <button
            className="absolute bottom-3 left-3 right-3 bg-white text-gray-900 text-sm font-medium py-2 rounded-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-md"
            onClick={(e) => { e.preventDefault(); /* add to cart */ }}
          >
            Quick Add
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col gap-1">
        {/* Category */}
        {product.categories[0] && (
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            {product.categories[0].name}
          </span>
        )}

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Rating */}
        {Number(product.average_rating) > 0 && (
          <div className="flex items-center gap-1">
            <StarRating rating={Number(product.average_rating)} />
            <span className="text-xs text-gray-400">({product.rating_count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-base font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {isOnSale && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.regular_price)}
            </span>
          )}
          {isOnSale && (
            <span className="text-xs text-red-500 font-medium">
              {Math.round((1 - Number(product.price) / Number(product.regular_price)) * 100)}% off
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
```

---

## Cart & Checkout (Headless)

### Cart State Management (Zustand)
```typescript
// stores/cart.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  productId: number
  variationId?: number
  quantity: number
  name: string
  price: number
  image: string
  maxQuantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: number, variationId?: number) => void
  updateQuantity: (productId: number, variationId: number | undefined, qty: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => set((state) => {
        const existing = state.items.find(
          i => i.productId === newItem.productId && i.variationId === newItem.variationId
        )
        if (existing) {
          return {
            items: state.items.map(i =>
              i.productId === newItem.productId && i.variationId === newItem.variationId
                ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.maxQuantity) }
                : i
            )
          }
        }
        return { items: [...state.items, newItem] }
      }),
      removeItem: (productId, variationId) => set((state) => ({
        items: state.items.filter(
          i => !(i.productId === productId && i.variationId === variationId)
        )
      })),
      updateQuantity: (productId, variationId, qty) => set((state) => ({
        items: qty === 0
          ? state.items.filter(i => !(i.productId === productId && i.variationId === variationId))
          : state.items.map(i =>
              i.productId === productId && i.variationId === variationId
                ? { ...i, quantity: Math.min(qty, i.maxQuantity) }
                : i
            )
      })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
)
```

### Checkout API Route (Next.js + Stripe)
```typescript
// app/api/checkout/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const CheckoutSchema = z.object({
  items: z.array(z.object({
    productId: z.number(),
    variationId: z.number().optional(),
    quantity: z.number().min(1).max(100),
    price: z.number().positive(),
    name: z.string(),
  })),
  customerEmail: z.string().email(),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string().length(2),
  }),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, customerEmail, shippingAddress } = CheckoutSchema.parse(body)

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100),
      currency: 'usd', // or 'inr' for India
      customer_email: customerEmail,
      metadata: {
        items: JSON.stringify(items.map(i => ({ id: i.productId, qty: i.quantity }))),
      },
      shipping: {
        name: customerEmail,
        address: {
          line1: shippingAddress.line1,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 })
    }
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'CHECKOUT_FAILED' }, { status: 500 })
  }
}
```

### Stripe Webhook → WooCommerce Order
```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const items = JSON.parse(intent.metadata.items)

    // Create WooCommerce order via REST API
    await createWooCommerceOrder({
      paymentMethod: 'stripe',
      paymentMethodTitle: 'Credit Card (Stripe)',
      setPaid: true,
      billingEmail: intent.customer_email!,
      lineItems: items.map((item: any) => ({
        productId: item.id,
        quantity: item.qty,
      })),
      transactionId: intent.id,
    })
  }

  return NextResponse.json({ received: true })
}

async function createWooCommerceOrder(orderData: any) {
  const res = await fetch(`${process.env.WC_URL}/wp-json/wc/v3/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_method: orderData.paymentMethod,
      payment_method_title: orderData.paymentMethodTitle,
      set_paid: orderData.setPaid,
      billing: { email: orderData.billingEmail },
      line_items: orderData.lineItems,
      transaction_id: orderData.transactionId,
    }),
  })
  if (!res.ok) throw new Error(`WooCommerce order creation failed: ${res.status}`)
  return res.json()
}
```

---

## Product SEO (WooCommerce-specific)

### Product JSON-LD Schema
```typescript
export function ProductSchema({ product }: { product: Product }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description.replace(/<[^>]*>/g, ''),
    image: product.images.map(img => img.src),
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'Your Brand' },
    offers: {
      '@type': 'Offer',
      url: `https://yourstore.com/shop/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stock_status === 'instock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Your Store' },
    },
    ...(product.average_rating !== '0' && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.average_rating,
        reviewCount: product.rating_count,
      },
    }),
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  )
}
```

---

## Performance Optimisation

| Strategy | Implementation |
|---|---|
| Product list ISR | `revalidate: 300` (5 min) |
| Product detail ISR | `revalidate: 3600` (1 hour) |
| Category pages | `generateStaticParams` for all categories |
| Search | Debounced client-side with Fuse.js for < 500 products; ElasticPress for larger catalogues |
| Images | Next.js Image with Cloudinary loader for WooCommerce media |
| Cart state | Zustand + localStorage persist (no server round-trip) |
| Checkout | Stripe Elements (no card data touches your server) |

---

## Environment Variables
```bash
# .env.example
WC_URL=https://wp.yourstore.com
WC_KEY=ck_xxxxxxxxxxxxxxxxxxxxx
WC_SECRET=cs_xxxxxxxxxxxxxxxxxxxxx
WP_GRAPHQL_URL=https://wp.yourstore.com/graphql
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://yourstore.com
REVALIDATE_SECRET=your-revalidation-secret
```

## Output Format

Every WooCommerce response includes:
1. **Architecture recommendation** — headless vs. traditional with justification
2. **Complete implementation** — full files, no stubs
3. **Real product images** — Unsplash or specified product image URLs, never placeholders
4. **Payment flow** — end-to-end from add-to-cart to order confirmation
5. **SEO implementation** — product schema, meta, canonical URLs
6. **Performance strategy** — ISR/SSG approach and cache invalidation
7. **`.env.example`** — all environment variables documented
