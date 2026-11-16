This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Authentication

From `server`, run `docker compose up -d redis` and start NestJS on port 3000.
Copy the values from `.env.example` into `.env.local`, keeping any existing
settings. Generate a private `NEXTAUTH_SECRET` with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.
Start the client with `npm run dev` and sign in at
`http://localhost:5173/login` with an active, verified NestJS account.

Next.js calls NestJS using the server-only `API_URL`. The browser calls
`/api/me`, `/api/services`, and `/api/session/logout` on the Next.js origin.
Set `AUTH_COOKIE_NAME` to the refresh cookie name configured in NestJS.
In production, set `NEXTAUTH_URL` to the public HTTPS origin and use the same
`NEXTAUTH_SECRET` and private, access-controlled Redis instance across all
Next.js instances. Use a dedicated Redis instance with TLS and no eviction for
session data. Keep `AUTH_COOKIE_SECURE=true` in production NestJS.

The account pages are `/register`, `/verify-email`, `/forgot-password`,
`/reset-password`, and `/change-password`. Set NestJS `APP_PUBLIC_URL` to
`http://localhost:5173` in development and the public Next.js origin in
production so the verification and reset emails open the correct pages.
Configure SMTP in NestJS to deliver those emails.

Google sign-in and registration use the same NestJS OAuth endpoints. Enable
`GOOGLE_OAUTH_ENABLED` and set NestJS `GOOGLE_CALLBACK_URL` to
`http://localhost:5173/api/v1/auth/google/callback` in development. Add that
exact URI to the existing Google OAuth client's authorized redirect URIs.
In production, use the equivalent public HTTPS URL and route that path
to Next.js. Leave `GOOGLE_OAUTH_SUCCESS_REDIRECT_URL` empty for this client.

The development and build scripts use Webpack because Turbopack's CSS worker
fails to start in the current Windows environment.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
