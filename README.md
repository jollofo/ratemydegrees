# RateMyDegrees

Student degree reviews for incoming students. The platform presents firsthand experiences under the same rules for every school. It does not rank schools, recommend majors, or provide comparison or pricing tools.

## Development

Next.js App Router, React, TypeScript, Prisma/PostgreSQL, and Supabase authentication. Install with `npm ci`, then run `npx prisma generate` and `npm run dev`.

Provide DATABASE_URL and DIRECT_URL for a development PostgreSQL database, plus NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for a development Supabase project. Keep credentials in untracked environment files. Typesense is optional for school alias fallback; see `src/lib/typesense.ts` for its configuration. Never use its admin key as a public search key.

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
