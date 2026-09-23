# Data maintenance

No data import, deletion, migration or index rebuild was performed during the website cleanup. Preserve source files and take a database backup before running import scripts. Point every loader at a staging database first; several load `.env.local` directly.

## Existing bootstrap sequence

1. Apply the reviewed Prisma schema to an empty staging database using the project's migration process.
2. `scripts/etl/01_load_cip.ts` reads `data/IPEDS.csv` for the CIP catalog.
3. `scripts/etl/02_load_ipeds_institutions.ts` loads schools. Check its source filename and source year before running.
4. `scripts/etl/03_load_completions.ts` reads `data/c2024_a.csv` and adds school/degree links for known catalog records.
5. Load approved degree aliases with `scripts/etl/load_aliases.ts`, then rebuild the search index with `npm run typesense:index` if required.

This describes the existing bootstrap scripts, not a validated refresh pipeline. The completion loader rolls records up to CIP4 and uses skipDuplicates: rerunning it does not refresh existing totals. Validate year, award level, duplicate rows and missing schools before publishing any completion statistics. Do not interpret these imported links as current admissions availability.

`04_create_missing_majors.ts` and `05_exhaustive_sync.ts` are historical repair tools, not additional mandatory bootstrap stages. Running overlapping loaders blindly can preserve stale data or change catalog membership. Their retention is intentional pending source/year reconciliation.

The existing scorecard and opportunities package commands are independent supplementary-data imports. Their SQL setup scripts must be reviewed against the deployed schema before use. Do not run them automatically during application deploys. A future refresh pipeline should use reviewed, versioned migrations, explicit source provenance, staged validation and repeatable upserts.

The tracked legacy SQLite database and seed/diagnostic scripts have not been deleted because their retention needs have not been established. The active Prisma schema uses PostgreSQL. The insecure TLS-verification override was removed from the CIP loader.
