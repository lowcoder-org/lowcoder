-- Run ONLY on Northflank: lowcoder / lowcoder-license-server / license-database.
-- n8n credential: License Database — Enterprise licensing (ssSYBhUdXUxCEl9q).
-- Never run on the Trading Database or in n8n's application database.
CREATE SCHEMA IF NOT EXISTS enterprise_billing;
CREATE TABLE IF NOT EXISTS enterprise_billing.orders (
  request_id uuid PRIMARY KEY,
  host_id varchar(36) NOT NULL,
  org_id varchar(128) NOT NULL,
  user_id varchar(128) NOT NULL,
  capability_hash char(64) NOT NULL CHECK (capability_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb NOT NULL,
  customer_id text,
  checkout_id text UNIQUE,
  checkout_url text,
  subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'awaiting_payment',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enterprise_license_owner ON enterprise_billing.orders(host_id,org_id,user_id,capability_hash);
CREATE TABLE IF NOT EXISTS enterprise_billing.files (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES enterprise_billing.orders(request_id),
  invoice_id text NOT NULL,
  deployment_id varchar(36) NOT NULL,
  not_before timestamp NOT NULL,
  not_after timestamp NOT NULL,
  filename text NOT NULL,
  license text,
  lease_token text NOT NULL,
  lease_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invoice_id,deployment_id),
  CHECK(not_after > not_before)
);
-- Receipt only. License issuance still requires an authenticated admin UI sync and fresh Stripe verification.
CREATE TABLE IF NOT EXISTS enterprise_billing.payment_events (
  event_id text PRIMARY KEY,
  invoice_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
