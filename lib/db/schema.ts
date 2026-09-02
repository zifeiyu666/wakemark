import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  vector,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin'])

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(), // better-auth
  name: text("name"), // better-auth
  image: text("image"), // better-auth
  role: userRoleEnum('role').default('user').notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  referral: text('referral'),
  stripeCustomerId: text("stripe_customer_id").unique(),
  paypalPayerId: text("paypal_payer_id").unique(), // PayPal Payer ID
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const session = pgTable("session", {
  id: uuid('id').primaryKey().defaultRandom(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// better-auth API Keys plugin (model name "apikey"). Powers the WakeMark MCP
// endpoint: agents authenticate with a Bearer key instead of a cookie session.
export const apikey = pgTable("apikey", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  start: text("start"),
  prefix: text("prefix"),
  key: text("key").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  refillInterval: integer("refill_interval"),
  refillAmount: integer("refill_amount"),
  lastRefillAt: timestamp("last_refill_at", { withTimezone: true }),
  enabled: boolean("enabled"),
  rateLimitEnabled: boolean("rate_limit_enabled"),
  rateLimitTimeWindow: integer("rate_limit_time_window"),
  rateLimitMax: integer("rate_limit_max"),
  requestCount: integer("request_count"),
  remaining: integer("remaining"),
  lastRequest: timestamp("last_request", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  permissions: text("permissions"),
  metadata: text("metadata"),
}, (table) => ({
  // verifyApiKey looks up rows by hashed key on every MCP request.
  keyIdx: index("idx_apikey_key").on(table.key),
  userIdx: index("idx_apikey_user_id").on(table.userId),
}));

// User source/attribution tracking
export const userSource = pgTable(
  'user_source',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),

    // aff code (from URL params like ref, via, aff.)
    affCode: text('aff_code'),

    // Traffic Source (UTM parameters)
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmTerm: text('utm_term'),
    utmContent: text('utm_content'),
    referrer: text('referrer'),
    referrerDomain: text('referrer_domain'),
    landingPage: text('landing_page'),

    // Device & Browser
    userAgent: text('user_agent'),
    browser: text('browser'),
    browserVersion: text('browser_version'),
    os: text('os'),
    osVersion: text('os_version'),
    deviceType: text('device_type'), // mobile, desktop, tablet
    deviceBrand: text('device_brand'),
    deviceModel: text('device_model'),
    screenWidth: integer('screen_width'),
    screenHeight: integer('screen_height'),
    language: text('language'),
    timezone: text('timezone'),

    // Network & Location (from Cloudflare headers)
    ipAddress: text('ip_address'),
    countryCode: varchar('country_code', { length: 2 }),

    // Extensibility
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_user_source_user_id').on(table.userId),
    affCodeIdx: index('idx_user_source_aff_code').on(table.affCode),
    utmSourceIdx: index('idx_user_source_utm_source').on(table.utmSource),
    countryCodeIdx: index('idx_user_source_country_code').on(table.countryCode),
    createdAtIdx: index('idx_user_source_created_at').on(table.createdAt),
  })
)

export const pricingPlanEnvironmentEnum = pgEnum('pricing_plan_environment', [
  'test',
  'live',
])

export const providerEnum = pgEnum('provider', [
  'none', // no payment feature
  'stripe',
  'creem',
  'paypal',
])
export type PaymentProvider = (typeof providerEnum.enumValues)[number]

export const paymentTypeEnum = pgEnum('payment_type', [
  'one_time', // stripe
  'onetime', // creem
  'recurring', // stripe and creem
])
export type PaymentType = (typeof paymentTypeEnum.enumValues)[number]

export const recurringIntervalEnum = pgEnum('recurring_interval', [
  'month', // stripe
  'year', // stripe
  'every-month', // creem recurring
  'every-year', // creem recurring
  'once', // creem onetime
])
export type RecurringInterval = (typeof recurringIntervalEnum.enumValues)[number]

// Pricing plan groups for organizing plans
// Using slug as primary key for simplicity and easier querying
export const pricingPlanGroups = pgTable('pricing_plan_groups', {
  slug: varchar('slug', { length: 100 }).primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const pricingPlans = pgTable('pricing_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  environment: pricingPlanEnvironmentEnum('environment').notNull(),
  groupSlug: varchar('group_slug', { length: 100 })
    .references(() => pricingPlanGroups.slug, { onDelete: 'restrict' })
    .default('default')
    .notNull(),
  cardTitle: text('card_title').notNull(),
  cardDescription: text('card_description'),
  provider: providerEnum('provider').default('none'),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  stripeCouponId: varchar('stripe_coupon_id', { length: 255 }),
  creemProductId: varchar('creem_product_id', { length: 255 }),
  creemDiscountCode: varchar('creem_discount_code', { length: 255 }),
  paypalPlanId: varchar('paypal_plan_id', { length: 255 }),
  enableManualInputCoupon: boolean('enable_manual_input_coupon')
    .default(false)
    .notNull(),
  // paymentType: varchar('payment_type', { length: 50 }),
  paymentType: paymentTypeEnum('payment_type'),
  // recurringInterval: varchar('recurring_interval', { length: 50 }),
  recurringInterval: recurringIntervalEnum('recurring_interval'),
  trialPeriodDays: integer('trial_period_days'),
  price: numeric('price'),
  currency: varchar('currency', { length: 10 }),
  displayPrice: varchar('display_price', { length: 50 }),
  originalPrice: varchar('original_price', { length: 50 }),
  priceSuffix: varchar('price_suffix', { length: 100 }),
  features: jsonb('features').default('[]').notNull(),
  isHighlighted: boolean('is_highlighted').default(false).notNull(),
  highlightText: text('highlight_text'),
  buttonText: text('button_text'),
  buttonLink: text('button_link'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  langJsonb: jsonb('lang_jsonb').default('{}').notNull(),
  benefitsJsonb: jsonb('benefits_jsonb').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    provider: text('provider').notNull(),
    providerOrderId: text('provider_order_id').notNull(),
    orderType: text('order_type').notNull(),
    status: text('status').notNull(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeInvoiceId: text('stripe_invoice_id'),
    stripeChargeId: text('stripe_charge_id'),
    subscriptionId: text('subscription_id'),
    planId: uuid('plan_id').references(() => pricingPlans.id, {
      onDelete: 'set null',
    }),
    productId: text('product_id'),
    priceId: varchar('price_id', { length: 255 }),
    amountSubtotal: numeric('amount_subtotal'),
    amountDiscount: numeric('amount_discount').default('0'),
    amountTax: numeric('amount_tax').default('0'),
    amountTotal: numeric('amount_total').notNull(),
    currency: varchar('currency', { length: 10 }).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userIdx: index('idx_orders_user_id').on(table.userId),
      providerIdx: index('idx_orders_provider').on(table.provider),
      planIdIdx: index('idx_orders_plan_id').on(table.planId),
      providerProviderOrderIdUnique: unique(
        'idx_orders_provider_provider_order_id_unique'
      ).on(table.provider, table.providerOrderId),
    }
  }
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    planId: uuid('plan_id')
      .references(() => pricingPlans.id, { onDelete: 'restrict' })
      .notNull(),
    provider: providerEnum('provider').notNull(),
    subscriptionId: text('subscription_id').notNull().unique(),
    customerId: text('customer_id').notNull(),
    productId: text('product_id'),
    priceId: varchar('price_id'),
    status: text('status').notNull(),
    currentPeriodStart: timestamp('current_period_start', {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    trialStart: timestamp('trial_start', { withTimezone: true }),
    trialEnd: timestamp('trial_end', { withTimezone: true }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userIdx: index('idx_subscriptions_user_id').on(table.userId),
      subscriptionIdIdx: index('idx_subscriptions_subscription_id').on(table.subscriptionId),
      statusIdx: index('idx_subscriptions_status').on(table.status),
      planIdIdx: index('idx_subscriptions_plan_id').on(table.planId),
    }
  }
)

export const usage = pgTable('usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  subscriptionCreditsBalance: integer('subscription_credits_balance')
    .default(0)
    .notNull(),
  oneTimeCreditsBalance: integer('one_time_credits_balance')
    .default(0)
    .notNull(),
  balanceJsonb: jsonb('balance_jsonb').default('{}').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const creditLogs = pgTable(
  'credit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    amount: integer('amount').notNull(),
    oneTimeCreditsSnapshot: integer('one_time_credits_snapshot').notNull(),
    subscriptionCreditsSnapshot: integer('subscription_credits_snapshot').notNull(),
    type: text('type').notNull(),
    notes: text('notes'),
    relatedOrderId: uuid('related_order_id').references(() => orders.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      userIdx: index('idx_credit_logs_user_id').on(table.userId),
      typeIdx: index('idx_credit_logs_type').on(table.type),
      relatedOrderIdIdx: index('idx_credit_logs_related_order_id').on(
        table.relatedOrderId
      ),
    }
  }
)

export const postTypeEnum = pgEnum('post_type', [
  'blog',
  'glossary',
])
export type PostType = (typeof postTypeEnum.enumValues)[number]

export const postStatusEnum = pgEnum('post_status', [
  'draft',
  'published',
  'archived',
])
export type PostStatus = (typeof postStatusEnum.enumValues)[number]

export const postVisibilityEnum = pgEnum('post_visibility', [
  'public',
  'logged_in',
  'subscribers',
])

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    language: varchar('language', { length: 10 }).notNull(),
    postType: postTypeEnum('post_type').default('blog'),
    authorId: uuid('author_id')
      .references(() => user.id, { onDelete: 'set null' })
      .notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: text('content'),
    description: text('description'),
    featuredImageUrl: text('featured_image_url'),
    isPinned: boolean('is_pinned').default(false).notNull(),
    status: postStatusEnum('status').default('draft').notNull(),
    visibility: postVisibilityEnum('visibility').default('public').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      languageSlugPostTypeUnique: unique('posts_language_slug_post_type_unique').on(
        table.language,
        table.slug,
        table.postType
      ),
      authorIdIdx: index('idx_posts_author_id').on(table.authorId),
      postTypeIdx: index('idx_posts_post_type').on(table.postType),
      statusIdx: index('idx_posts_status').on(table.status),
      visibilityIdx: index('idx_posts_visibility').on(table.visibility),
      languageStatusIdx: index('idx_posts_language_status').on(
        table.language,
        table.status
      ),
      languagePostTypeStatusIdx: index('idx_posts_language_post_type_status').on(
        table.language,
        table.postType,
        table.status
      ),
    }
  }
)

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    postType: postTypeEnum('post_type').default('blog'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      nameIdx: index('idx_tags_name').on(table.name),
      namePostTypeUnique: unique('tags_name_post_type_unique').on(
        table.name,
        table.postType
      ),
    }
  }
)

export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .references(() => posts.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.postId, table.tagId] }),
      postIdIdx: index('idx_post_tags_post_id').on(table.postId),
      tagIdIdx: index('idx_post_tags_tag_id').on(table.tagId),
    }
  }
)

export const feedbackCategoryEnum = pgEnum('feedback_category', [
  'bug',
  'feature',
  'question',
])

export const feedbacks = pgTable(
  'feedbacks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
    category: feedbackCategoryEnum('category').notNull().default('bug'),
    title: text('title').notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      createdAtIdx: index('idx_feedbacks_created_at').on(table.createdAt),
    }
  }
)

// ============ X Bookmarks ============

export const xSyncStatusEnum = pgEnum('x_sync_status', [
  'idle',
  'syncing',
  'processing',
  'error',
])

// X account connection: OAuth tokens (encrypted) + incremental sync progress
export const xConnections = pgTable(
  'x_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    xUserId: text('x_user_id').notNull(),
    username: text('username'),
    name: text('name'),
    profileImageUrl: text('profile_image_url'),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    scopes: text('scopes'),
    // sync progress / checkpoint
    syncStatus: xSyncStatusEnum('sync_status').default('idle').notNull(),
    paginationToken: text('pagination_token'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastSyncAdded: integer('last_sync_added').default(0),
    lastSyncError: text('last_sync_error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userIdIdx: index('idx_x_connections_user_id').on(table.userId),
    }
  }
)

export const bookmarkStatusEnum = pgEnum('bookmark_status', [
  'pending',
  'processing',
  'ready',
  'failed',
])
export type BookmarkStatus = (typeof bookmarkStatusEnum.enumValues)[number]

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    tweetId: text('tweet_id').notNull(),
    text: text('text').notNull(),
    authorXId: text('author_x_id'),
    authorUsername: text('author_username'),
    authorName: text('author_name'),
    authorProfileImageUrl: text('author_profile_image_url'),
    tweetCreatedAt: timestamp('tweet_created_at', { withTimezone: true }),
    mediaUrls: jsonb('media_urls').default('[]').notNull(),
    // Parallel to mediaUrls: 'photo' | 'video' | 'animated_gif' (video entries
    // hold the preview thumbnail url; playback goes through the X embed player).
    mediaTypes: jsonb('media_types').default('[]').notNull(),
    metrics: jsonb('metrics'),
    urls: jsonb('urls').default('[]').notNull(),
    // AI processing results
    primaryCategory: varchar('primary_category', { length: 50 }),
    subTags: jsonb('sub_tags').default('[]').notNull(),
    summary: text('summary'),
    embedding: vector('embedding', { dimensions: 1024 }),
    status: bookmarkStatusEnum('status').default('pending').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    // reserved for weekly digest
    isPushed: boolean('is_pushed').default(false).notNull(),
    syncedAt: timestamp('synced_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userTweetUnique: unique('bookmarks_user_id_tweet_id_unique').on(
        table.userId,
        table.tweetId
      ),
      userSyncedIdx: index('idx_bookmarks_user_synced').on(
        table.userId,
        table.syncedAt
      ),
      userReadIdx: index('idx_bookmarks_user_read').on(table.userId, table.isRead),
      userStatusIdx: index('idx_bookmarks_user_status').on(
        table.userId,
        table.status
      ),
    }
  }
)

// Per-user tag usage counters, maintained on every subTags write (AI tagging
// and manual add/remove). Sources the AI-tagging whitelist and the filter
// bar's custom tag chips without scanning bookmarks.sub_tags jsonb.
export const bookmarkTags = pgTable(
  'bookmark_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 60 }).notNull(),
    usage: integer('usage').notNull().default(0),
    // Palette id from TAG_COLORS (null = default neutral chip).
    color: varchar('color', { length: 20 }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userTagUnique: unique('bookmark_tags_user_id_name_unique').on(
        table.userId,
        table.name
      ),
      userUsageIdx: index('idx_bookmark_tags_user_usage').on(
        table.userId,
        table.usage
      ),
    }
  }
)

// User-curated bookmark collections. Public lists are shareable via
// /u/{x-username}/{slug}; the slug is regenerated on every visibility flip so
// previously shared links stop resolving once the list goes private.
export const bookmarkLists = pgTable(
  'bookmark_lists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 60 }).notNull(),
    slug: text('slug').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      userSlugUnique: unique('bookmark_lists_user_id_slug_unique').on(
        table.userId,
        table.slug
      ),
      userIdx: index('idx_bookmark_lists_user_id').on(table.userId),
    }
  }
)

export const bookmarkListItems = pgTable(
  'bookmark_list_items',
  {
    listId: uuid('list_id')
      .references(() => bookmarkLists.id, { onDelete: 'cascade' })
      .notNull(),
    bookmarkId: uuid('bookmark_id')
      .references(() => bookmarks.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.listId, table.bookmarkId] }),
      bookmarkIdx: index('idx_bookmark_list_items_bookmark_id').on(
        table.bookmarkId
      ),
    }
  }
)

export const digestStatusEnum = pgEnum('digest_status', [
  'generating',
  'ready',
  'failed',
])
export type DigestStatus = (typeof digestStatusEnum.enumValues)[number]

export const digestEmailStatusEnum = pgEnum('digest_email_status', [
  'pending',
  'sent',
  'failed',
  'skipped',
])
export type DigestEmailStatus =
  (typeof digestEmailStatusEnum.enumValues)[number]

// Weekly bookmark summary, generated on each user's local Friday by the
// hourly digest cron. weekKey is the local Friday date (YYYY-MM-DD) in the
// user's timezone; the unique (userId, weekKey) keeps hourly ticks idempotent
// while still allowing a same-Friday catch-up send after downtime.
export const digests = pgTable(
  'digests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    weekKey: varchar('week_key', { length: 10 }).notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    overview: text('overview').notNull().default(''),
    highlightCount: integer('highlight_count').notNull().default(0),
    bookmarkCount: integer('bookmark_count').notNull().default(0),
    // Structured render payload: { highlightGroups, alsoBookmarked }.
    content: jsonb('content').notNull().default('{}'),
    status: digestStatusEnum('status').default('generating').notNull(),
    emailStatus: digestEmailStatusEnum('email_status')
      .default('pending')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      userWeekUnique: unique('digests_user_id_week_key_unique').on(
        table.userId,
        table.weekKey
      ),
      userCreatedIdx: index('idx_digests_user_created').on(
        table.userId,
        table.createdAt
      ),
    }
  }
)

// Per-user digest delivery preferences. timeZone (IANA name) is captured
// implicitly from the browser and may be overridden in Settings; null falls
// back to UTC so every connected user eventually gets a digest.
export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  timeZone: text('time_zone'),
  digestHour: integer('digest_hour').notNull().default(9),
  digestEnabled: boolean('digest_enabled').notNull().default(true),
  // Set once the new-user onboarding tour is finished or dismissed; the tour
  // only auto-opens while this stays NULL.
  onboardingCompletedAt: timestamp('onboarding_completed_at', {
    withTimezone: true,
  }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

// Ask AI drawer chat transcript. sessionId groups messages per "New chat";
// only plain text is stored (tool calls stay ephemeral).
export const askAiMessages = pgTable(
  'ask_ai_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    sessionId: uuid('session_id').notNull(),
    role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    modelId: varchar('model_id', { length: 100 }),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      userSessionIdx: index('idx_ask_ai_messages_user_session').on(
        table.userId,
        table.sessionId,
        table.createdAt
      ),
    }
  }
)
