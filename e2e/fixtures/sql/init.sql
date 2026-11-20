-- Data of the PostgreSQL sidecar the data source tests read.
CREATE TABLE items (id integer PRIMARY KEY, name text NOT NULL);
INSERT INTO items (id, name) VALUES (1, 'alpha'), (2, 'beta');

-- Read-only rows for the data source tests that read and display a list.
CREATE TABLE products (id integer PRIMARY KEY, name text NOT NULL, price numeric(10, 2) NOT NULL);
INSERT INTO products (id, name, price) VALUES (1, 'widget', 9.50), (2, 'gadget', 24.00), (3, 'gizmo', 3.25);

-- Rows the write tests insert, update and delete. Every test writes only rows with its own `owner` value, so tests
-- running in parallel never see each other's rows.
CREATE TABLE notes (id serial PRIMARY KEY, owner text NOT NULL, body text NOT NULL);
CREATE INDEX notes_owner_idx ON notes (owner);
