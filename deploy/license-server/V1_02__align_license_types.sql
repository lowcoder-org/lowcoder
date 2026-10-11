-- Preserve the original migration checksum. Fresh installs migrate to Java's storage types.
ALTER TABLE licenses ALTER COLUMN uuid DROP DEFAULT;
ALTER TABLE licenses ALTER COLUMN uuid TYPE varchar(36) USING uuid::text;
ALTER TABLE licenses ALTER COLUMN api_calls_limit TYPE bigint;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema()
             AND table_name='licenses' AND column_name='license_file' AND data_type='text') THEN
    ALTER TABLE licenses ALTER COLUMN license_file TYPE bytea USING decode(license_file,'base64');
  END IF;
END $$;
