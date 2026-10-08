# RateMyDegrees

Student degree reviews for incoming students. The platform presents firsthand experiences under the same rules for every school. It does not rank schools, recommend majors, or provide comparison or pricing tools.

## Development

Next.js App Router, React, TypeScript, Prisma/PostgreSQL, and Supabase authentication. Install with `npm ci`, then run `npx prisma generate` and `npm run dev`.

Provide DATABASE_URL and DIRECT_URL for a development PostgreSQL database, plus NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for a development Supabase project. Keep credentials in untracked environment files. Typesense is optional for school alias fallback; see `src/lib/typesense.ts` for its configuration. Never use its admin key as a public search key.

### Email sign-in setup

The sign-in page offers a six-digit email code through Supabase Auth. In the Supabase project dashboard, enable the Email provider under Authentication > Providers. In Authentication > Email Templates, change the Magic Link template to display `{{ .Token }}` as the sign-in code. Supabase sends a link by default until this template is changed. Keep the Google provider enabled if you want both options. Review the project's email delivery and rate-limit settings before inviting users. The app uses only the public Supabase URL and anon key in the browser; do not put a service-role key in a `NEXT_PUBLIC_` variable.

Under Authentication > URL Configuration, set Site URL to `https://ratemydegrees.com` for production and add `https://ratemydegrees.com/auth/callback**` to Redirect URLs for Google sign-in. The narrow suffix wildcard includes the validated `next` query that preserves a review draft's return path. For local development, add `http://localhost:3000/auth/callback**` (or the exact local port in use). Google OAuth returns through that app route; email code verification occurs in the sign-in page and then uses the validated local `next` path. In Google Cloud, the authorized redirect URI is the **Supabase project's** callback URL shown on its Google provider page (`https://<project-ref>.supabase.co/auth/v1/callback` for a hosted project), while the app's `/auth/callback` belongs in Supabase's Redirect URLs. These steps follow [Supabase passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless), [redirect URL](https://supabase.com/docs/guides/auth/redirect-urls), and [Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google) guidance.

`npm run check` runs lint, strict TypeScript including unused declarations, and isolated regression tests. Tests mock database writes and require no production credentials. GitHub Actions runs this check for pushes and pull requests.

`npm run build` generates Prisma and builds the application. A normal build enables existing Sentry integration and may upload source maps. For a local verification build in PowerShell:

```powershell
$env:RMD_LOCAL_CHECK='1'
$env:RMD_BUILD_DIR='artifacts/local-build'
npm run build
npm start -- --port 3001
```

Use the same RMD_BUILD_DIR when starting that build. RMD_LOCAL_CHECK bypasses the Sentry build wrapper, server instrumentation initialization and Google Analytics. It does not isolate the configured database or Supabase service. Use dedicated test services before testing authenticated writes. Google font downloads require network access. Omit these local flags for a normal deployment.

## Review behavior

- Database search is authoritative, case-insensitive and alphabetically ordered. Catalog counts include approved reviews only. Published reviews remain discoverable even when an imported degree/school pairing is missing.
- Public queries select a narrow review payload. Author IDs, account details and moderation metadata are not passed into public review components.
- Reviews are paginated newest first. Each category average requires five valid ratings; N/A is excluded. Existing rating definitions retain their meanings.
- One non-deleted review per account/degree/school is checked in a serializable transaction. Editing requires ownership and returns text to moderation. Removal marks a review DELETED and removes it from public views; it does not erase the internal record.
- Reports request moderation and do not automatically hide reviews. Automated checks flag potential contact details/links, not sentiment. Human review is still required for context, abuse and disputes.
- Existing supplementary statistics routes remain compatible and separate from student reviews.

See [implementation notes](docs/implementation-2026-09-23.md), [audit](docs/audits/2026-09-23-website-audit.md), and [data maintenance](docs/data-maintenance.md).
