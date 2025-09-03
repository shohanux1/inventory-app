-- Increase the maximum rows that can be fetched in a single request
-- This allows fetching up to 2000 products in one query
-- Default is 1000 rows

-- Set the max rows for the authenticator role (used by your app)
ALTER ROLE authenticator SET pgrst.db_max_rows = 2000;

-- Also set for the anon role if you're using anonymous access
ALTER ROLE anon SET pgrst.db_max_rows = 2000;

-- Reload the PostgREST configuration
NOTIFY pgrst, 'reload config';

-- Note: This change affects all queries from your app
-- Use pagination for larger datasets to maintain performance