# Enterprise licenses

The administrator purchases from Settings → Subscription → Enterprise licenses. The first deployment ID comes from the running Lowcoder server; additional IDs can be copied from that screen on each other installation. Annual billing is the default. Stripe charges USD 459/month or USD 4,990/year per instance, for one to three instances.

## Components

- Lowcoder's authenticated `/api/enterprise-licenses/*` endpoints require the requesting user to be a current administrator of the selected workspace. Files are scoped to the purchasing user, workspace, and installation.
- A private random owner capability is stored encrypted in Lowcoder's MongoDB. Its hash scopes n8n database queries. The capability is sent only from the Lowcoder backend to n8n; it is never returned to the browser or stored in Stripe metadata. Preserve MongoDB and the existing encryption key across upgrades.
- n8n creates hosted Stripe Checkout subscriptions, validates the configured live prices, and records purchase ownership in the dedicated License Database.
- The UI checks while an administrator is signed in and the page is visible. Only missing/expired license periods trigger Stripe reconciliation. Reconciliation verifies the subscription owner, paid invoice, exact product/price/quantity, successful payment, and absence of refunds or disputes before calling the private license service.
- Stripe payment receipts do not issue licenses independently. A monthly renewal requires the purchasing administrator to return to Lowcoder. Administrators download and install the newly issued files through the normal license installation process. Service can be interrupted if this is delayed.
- Each file has a deterministic identity per paid invoice and deployment, a generation lease, an exact paid validity period, and `apiCallsLimit: 1000000000`. Names use `Company_deployment_YYYY-MM-DD_YYYY-MM-DD.lic`.

## Dedicated infrastructure

Use only Northflank team `lowcoder`, project `lowcoder-license-server`, addon `license-database`. Never use the Trading Database or n8n's own application database.

The `enterprise_billing` schema contains orders, files, and payment receipts. The application database role has schema USAGE and only the required SELECT/INSERT/UPDATE grants. One-time setup admin credentials were removed from n8n after setup. Existing `public.licenses` records are preserved.

The service `lowcoder-licensing-server` is private on port 8080, with cross-project hostname `lowcoder-licensing-server.ns-6clrm8dzlwsk`. It uses the same License Database. The existing secret group supplies runtime database credentials and `GENERATOR_API_KEY`. `SPRING_FLYWAY_ENABLED=false` preserves the existing public schema; the repository's follow-up migration supports clean installations separately.

The approved plan is 1 CPU / 1 GB RAM, USD 18/month plus metered build time. The private signing dependency is supplied through the encrypted Docker build secret `enterprise_keygen_base64`; never commit it, include it in workflow exports, or publish the resulting image publicly.

## Workflow configuration

`config.example.json` contains catalog identifiers and n8n credential IDs, not keys. Generate the workflow exports with:

```sh
node deploy/n8n/enterprise-licenses/build-workflow.cjs
node --test deploy/n8n/enterprise-licenses/logic.test.cjs
```

Use the existing accessible `Stripe PROD Account - Personal` credential and `License Database — Enterprise licensing`. The generator credential must send the existing API key under `X-API-KEY` and be restricted to the private service hostname. Confirm every credential binding after import: n8n can silently select an unrelated default credential.

The purchase webhook path is `secure/enterprise-licenses`. Lowcoder defaults to `https://flow.lowcoder.cloud/webhook/secure/enterprise-licenses`; an operator can override `LOWCODER_ENTERPRISE_LICENSE_RELAY_URL`. HTTPS return origins are resolved from `LOWCODER_PUBLIC_URL` when configured, otherwise from the UI request. Stripe URLs are limited to Stripe's checkout/portal domains and the verified custom domain `secure.lowcoder.cloud`.

Before publishing, confirm that successful/failed execution data and manual execution storage are disabled, and the execution timeout is 100 seconds. n8n's import may not carry these workflow settings. Do not pin real owner capabilities, customer data, or license files into test nodes. Do not publish a Stripe event endpoint until its signature verification is configured and tested.

A Lowcoder frontend/backend release containing the controller, encrypted capability service, purchase dialog, and UI renewal hook is required before customers can use the integration. The server and n8n infrastructure alone do not deploy those application changes.

## Recovery

A retry reuses the immutable purchase request ID and Stripe idempotency keys. After an ambiguous checkout creation older than 23 hours, reconcile the existing Stripe customer/session before retrying to avoid duplicate subscriptions. License generation claims expire after 180 seconds; the next authenticated UI check retries. Preserve database backups, the signing dependency, and the Lowcoder encryption key. Do not reset capabilities to repair an unrelated billing problem, because doing so would break access to existing purchases.

## Verification on 2026-10-10

- Northflank service is running commit `83aab4d327a756e3c609d17e69bc3ae55ec8662d` from `codex/enterprise-license-deployment`, one instance, private port 8080. Deployment source review: https://github.com/Lowcoder-Pro/lowcoder-licensing-server/pull/1.
- Purchase workflow `ynTJMJsJEqV7NToV` is published. Its saved export contains 49 nodes, the dedicated License Database credential, the accessible live Stripe credential, and the private API credential; no unresolved placeholders. Stored success/error/manual execution data is disabled and timeout is 100 seconds.
- Receipt workflow `IkRJiPPgcOJuCvsV` is published. It retrieves authoritative Stripe events and filters Enterprise invoices. Its production endpoint rejects an unsigned test event with HTTP 401.
- The private generator returned HTTP 401 without its key and HTTP 200 with an empty result for an authenticated lookup of a nonexistent UUID. No live license was generated by these checks.
- Published purchase status and empty-owner renewal requests return HTTP 200 with empty orders/licenses. A missing ownership credential is rejected.
- The n8n runtime harness passed: two mock purchases, five deployments, four mock generations, one existing-lease skip. It made no external calls and issued no license files. Import `runtime-harness.json` into a separate empty, unpublished workflow; only one Manual Trigger is allowed per workflow.
- All 19 payment/ownership/URL unit tests passed. Seven backend controller tests and the frontend TypeScript check passed. PostgreSQL ownership, download isolation, and immutable purchase retry checks passed in a disposable local PostgreSQL 18 transaction, then rolled back.
- A completed payment followed by a real signed-file download has not yet been exercised end to end. No customer was charged. The Lowcoder frontend/backend changes still require an application release.
