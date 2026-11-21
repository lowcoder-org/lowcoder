-- Data of the PostgreSQL sidecar the data source tests read.
CREATE TABLE items (id integer PRIMARY KEY, name text NOT NULL);
INSERT INTO items (id, name) VALUES (1, 'alpha'), (2, 'beta');

-- Read-only rows for the table, chart and list scenarios (paging, sorting, filtering). No test writes them.
-- 25 rows: `name` product-01 ... product-25; `category` cycles tools/books/games (tools 8, books 9, games 8);
-- `stock` is id * 3 % 17, so the first five rows hold 3, 6, 9, 12, 15. Must equal PRODUCTS in e2e/src/constants.ts.
CREATE TABLE products (id integer PRIMARY KEY, name text NOT NULL, category text NOT NULL, price numeric(10, 2) NOT NULL, stock integer NOT NULL);
INSERT INTO products (id, name, category, price, stock)
SELECT g, 'product-' || lpad(g::text, 2, '0'), (ARRAY['tools','books','games'])[1 + g % 3], (g * 7 % 50) + 0.99, g * 3 % 17
FROM generate_series(1, 25) AS g;

-- Rows the write tests insert, update and delete. Every test writes only rows with its own `owner` value, so tests
-- running in parallel never see each other's rows.
CREATE TABLE notes (id serial PRIMARY KEY, owner text NOT NULL, body text NOT NULL);
CREATE INDEX notes_owner_idx ON notes (owner);
