-- Data of the PostgreSQL sidecar the data source tests read.
CREATE TABLE items (id integer PRIMARY KEY, name text NOT NULL);
INSERT INTO items (id, name) VALUES (1, 'alpha'), (2, 'beta');
