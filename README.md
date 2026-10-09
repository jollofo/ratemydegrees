# RateMyDegrees

Student degree reviews for incoming students. The platform presents firsthand experiences under the same rules for every school. It does not rank schools, recommend majors, or provide comparison or pricing tools.

## Development

Next.js App Router, React, TypeScript, Prisma/PostgreSQL, and Supabase authentication. Install with `npm ci`, then run `npx prisma generate` and `npm run dev`.

Provide DATABASE_URL and DIRECT_URL for a development PostgreSQL database, plus NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for a development Supabase project. Keep credentials in untracked environment files. Typesense is optional for school alias fallback; see `src/lib/typesense.ts` for its configuration. Never use its admin key as a public search key.

### Email sign-in setup

The sign-in page offers an email code through Supabase Auth and accepts the supported six- to ten-digit OTP lengths. In the Supabase project dashboard, enable the Email provider under Authentication > Providers. In Authentication > Email Templates, change the Magic Link template to display `{{ .Token }}` as the sign-in code. Supabase sends a link by default until this template is changed. Keep the Google provider enabled if you want both options. Review the project's email delivery and rate-limit settings before inviting users. The app uses only the public Supabase URL and anon key in the browser; do not put a service-role key in a `NEXT_PUBLIC_` variable.

Under Authentication > URL Configuration, set Site URL to `https://ratemydegrees.com` for production and add `https://ratemydegrees.com/auth/callback**` to Redirect URLs for Google sign-in. The narrow suffix wildcard includes the validated `next` query that preserves a review draft's return path. For local development, add `http://localhost:3000/auth/callback**` (or the exact local port in use). Google OAuth returns through that app route; email code verification occurs in the sign-in page and then uses the validated local `next` path. In Google Cloud, the authorized redirect URI is the **Supabase project's** callback URL shown on its Google provider page (`https://<project-ref>.supabase.co/auth/v1/callback` for a hosted project), while the app's `/auth/callback` belongs in Supabase's Redirect URLs. These steps follow [Supabase passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless), [redirect URL](https://supabase.com/docs/guides/auth/redirect-urls), and [Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google) guidance.

### Optional product analytics

Create or select a PostHog project yourself, then set `NEXT_PUBLIC_POSTHOG_KEY` to its publishable project key and `NEXT_PUBLIC_POSTHOG_HOST` to the project's `https://us.i.posthog.com` or `https://eu.i.posthog.com` ingestion host. Set `NEXT_PUBLIC_RMD_ANALYTICS_ENABLED=1` only in the intended production environment. Never put a private PostHog admin/personal API token in a `NEXT_PUBLIC_` variable. No PostHog configuration is required for local development or tests.

The footer offers Allow/Decline analytics controls. Google Analytics and the small set of PostHog product events load only after an explicit Allow choice; a missing or unavailable consent choice leaves them off. Declining later reloads the page to unload analytics scripts. A random anonymous PostHog ID is stored in session storage only after consent so a same-tab Google redirect and review restore remain in one funnel; it is removed on Decline or when the tab session ends. This is never an account or email ID. PostHog has autocapture, pageview capture, replay, surveys, feature flags, automatic exception capture, SDK persistence, and person profiles disabled. Manual Error Tracking captures use only fixed stage/category combinations and omit original exception messages and stacks, so issues show counts by category rather than code-level traces. Events use an explicit property allowlist and exclude review text, credentials, and URL query strings. The existing AdSense integration is separate and described in the Privacy Policy. Configuration follows PostHog's [Next.js guide](https://posthog.com/docs/libraries/next-js), [JavaScript SDK](https://posthog.com/docs/libraries/js), [configuration options](https://posthog.com/docs/libraries/js/config), [persistence guide](https://posthog.com/docs/libraries/js/persistence), and [Error Tracking capture guide](https://posthog.com/docs/error-tracking/capture).

The explicit full-site journey events are `page_viewed` (fixed route template), `detail_viewed` (validated degree/school IDs), `search_submitted` (search type), `search_results` (type, count, results/no-results/unavailable), `navigation_clicked` (fixed destination), `review_cta_clicked` (fixed source and validated IDs), and `share_action_success` (shared/copied). The review/auth events are `review_started`, `review_draft_restored`, `review_submitted` (approved/pending), `sign_in_started`, `sign_in_completed`, and `product_error` with a corresponding normalized manual `$exception` for supported error stages. Search strings, arbitrary paths, URL query strings, and referrers are excluded. No acquisition campaign attribution is collected until a project-specific allowlist is defined.

Useful PostHog funnels include home → search submitted → search results → detail viewed, detail viewed → review CTA → review started → sign-in completed → review submitted, and review draft restored → review submitted. Compare no-results and unavailable counts by search type, and inspect where these sequences end. A visit ending or a short engagement period is a signal for further investigation, not proof of why someone left or that they were dissatisfied.

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
