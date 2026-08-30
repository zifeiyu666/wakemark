# WakeMark - Wake your sleeping bookmarks

WakeMark automatically tags your saved tweets, organizes bookmarks into lists, and sends you digests on your own schedule. Built with Next.js 16, React 19, and Supabase.

- 🚀 Website 👉: https://wakemark.app

> If you encounter any issues, please contact us for support:
> - Email: support@mail.wakemark.app

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
that sends a `GET` request to:

```text
https://<your-domain>/api/cron/bookmarks?job=drain
```

Set the request header `Authorization: Bearer <CRON_SECRET>` and choose a
schedule such as `*/10 * * * *`. QStash will then continue large first-time
history imports and process the pending AI backlog. You may create a second
daily schedule for `?job=daily` (for example `0 8 * * *`, UTC). Keep
`CRON_SECRET` configured in Vercel and QStash; never commit its value.

The endpoint is implemented in
[`app/api/cron/bookmarks/route.ts`](./app/api/cron/bookmarks/route.ts). Its
database checkpoints make each drain invocation resumable and idempotent.
