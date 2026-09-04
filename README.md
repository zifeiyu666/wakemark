# WakeMark - Wake your sleeping bookmarks

WakeMark automatically tags your saved tweets, organizes bookmarks into lists, and sends you digests on your own schedule. Built with Next.js 16, React 19, and Supabase.

- 🚀 Website 👉: https://wakemark.app

> If you encounter any issues, please contact us for support:
> - Email: support@wakemark.app

## ✨ Key Features

- 🚀 **Next.js 16 & React 19** - Built on the latest tech stack
- 💳 **Stripe Integration** - Complete subscription payment system
- 🔒 **Supabase Authentication** - Secure and reliable user management
- 🌍 **Internationalization (i18n) Ready** - Built-in support for English, Chinese, and Japanese
- 🧠 **AI Integration** - Supports multiple AI providers (OpenAI, Anthropic, DeepSeek, Google, etc.)
- 📊 **Admin Dashboard** - User management, pricing plans, content management, etc.
- 📱 **Responsive Design** - Perfect adaptation across various devices
- 🎨 **Tailwind CSS** - Modern UI design
- 📧 **Email System** - Notifications and marketing emails powered by Resend
- 🖼️ **R2/S3 Storage** - Cloud storage support for media files

Please refer to the [Documentation](https://wakemark.app) for more information.

## Scheduled bookmark sync (Upstash QStash)

Vercel Cron is disabled so the app remains compatible with the free Hobby plan.
Use [Upstash QStash](https://console.upstash.com/qstash) to create a schedule
that sends a `POST` request to:

```text
https://<your-domain>/api/cron/bookmarks?job=drain
```

Add an `Upstash-Forward` header whose forwarded key is `Authorization` and
whose value is `<CRON_SECRET>` (the secret itself, without `Bearer `). Set
`Upstash-Method` to `POST` and choose a schedule such as `0 */3 * * *`.
Active users drive their own first-time history import and AI tagging from
the dashboard (resumable progress banner); this schedule is the fallback that
continues backlogs and pending AI work for users who stay away. You may
create a second daily schedule for `?job=daily` (for example `0 8 * * *`,
UTC). Keep `CRON_SECRET` configured in Vercel and QStash; never commit its
value.

The route also accepts `Authorization: Bearer <CRON_SECRET>` for manual
requests and compatibility with other schedulers.

The endpoint is implemented in
[`app/api/cron/bookmarks/route.ts`](./app/api/cron/bookmarks/route.ts). Its
database checkpoints make each drain invocation resumable and idempotent.

## Weekly digests (Upstash QStash)

Every connected user receives an emailed weekly digest on **their own local
Friday**, at or after their preferred hour (default 9:00, configurable in
Settings together with the time zone; the browser time zone is also captured
implicitly on dashboard visits). Create one hourly QStash schedule that sends
a `POST` request to:

```text
https://<your-domain>/api/cron/digests?job=weekly
```

Use the same `Upstash-Forward` `Authorization: <CRON_SECRET>` header as the
bookmark sync schedules and a cron expression of `0 * * * 4,5,6` (hourly,
Thursday–Saturday UTC — a user's local Friday can start as early as Thursday
10:00 UTC in UTC+14 and end as late as Saturday 12:00 UTC in UTC-12). Each
hourly tick checks every user's local clock (IANA time zone via `Intl`,
DST-safe): when it is Friday past the preferred hour and no digest exists for
that local week (`digests.week_key`), the digest is generated and emailed
exactly once. When it is not Friday anywhere on Earth the tick returns before
touching the database (keeps Neon suspended). A tick missed during downtime is
caught up by the next tick on the same Friday; a fully missed Friday is
skipped rather than sending a stale summary.

The endpoint is implemented in
[`app/api/cron/digests/route.ts`](./app/api/cron/digests/route.ts) and reuses
the same `CRON_SECRET` authentication as the bookmark sync cron.
