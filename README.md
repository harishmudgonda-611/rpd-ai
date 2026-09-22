# RPD Money Engine

Affiliate-focused commerce engine built on the existing RPD AI foundation.

## Production flow

Product URL -> extraction -> product intelligence -> qualification -> creative -> tracked affiliate link -> public /go/<id> redirect -> click attribution -> confirmed conversion import -> revenue intelligence.

## Run locally

npm ci
npm test
npm run build
RPD_ADMIN_TOKEN="$(openssl rand -hex 32)" npm start

The app listens on port 8787. In production set RPD_ADMIN_TOKEN. Without that token, protected APIs are intentionally unavailable when NODE_ENV=production.

## Docker

cp .env.example .env
Set a strong RPD_ADMIN_TOKEN in .env, then run: docker compose up --build -d

## Affiliate compliance

- Store only verified destination URLs supplied by the operator.
- Never invent prices, discounts, availability, ratings, commissions, or orders.
- Use marketplace/affiliate APIs or feeds where required; do not bypass access controls.
- Publish the appropriate affiliate disclosure.
- Use sponsored/nofollow attributes for affiliate outbound links where applicable.
- Import actual network conversions instead of generating synthetic revenue.

## Supabase

Run data/schema.sql in a Supabase SQL editor when using Postgres persistence. Local JSON persistence is suitable for single-instance/self-hosted operation; multi-instance deployments should move persistence to Postgres before horizontal scaling.

## Deployment readiness

GitHub Actions verifies TypeScript compilation and tests. A hosting provider still needs to be connected to this repository and supplied with production environment variables.
