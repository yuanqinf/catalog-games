-- PostgreSQL Full-Text Search Setup for Games Table
-- Execute this in Supabase SQL Editor

-- Step 1: Add search vector column
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Step 2: Create GIN index for fast FTS queries
CREATE INDEX IF NOT EXISTS games_search_vector_idx ON games 
USING gin(search_vector);

-- Step 3: Create function to generate search vectors
CREATE OR REPLACE FUNCTION update_games_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    -- Game name (highest weight A)
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    -- Developers (weight B)
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.developers, ' '), '')), 'B') ||
    -- Summary/description (weight C)
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'C') ||
    -- Genres and categories (weight D)
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.genres, ' '), '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.game_modes, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to auto-update search vectors
DROP TRIGGER IF EXISTS games_search_vector_update_trigger ON games;
CREATE TRIGGER games_search_vector_update_trigger
  BEFORE INSERT OR UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_games_search_vector();

-- Step 5: Update existing games with search vectors
UPDATE games SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(developers, ' '), '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(summary, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(genres, ' '), '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(game_modes, ' '), '')), 'D');

-- Step 6: Create RPC function for multi-field search
CREATE OR REPLACE FUNCTION search_games_fts(
  search_query text,
  result_limit integer DEFAULT 10
)
RETURNS TABLE(
  id integer,
  name text,
  slug text,
  cover_url text,
  developers text[],
  first_release_date timestamp with time zone,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.slug,
    g.cover_url,
    g.developers,
    g.first_release_date,
    ts_rank_cd(g.search_vector, websearch_to_tsquery('english', search_query)) as rank
  FROM games g
  WHERE g.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC, g.name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Test the setup (optional - remove if not needed)
-- Test FTS search
SELECT name, developers, ts_rank_cd(search_vector, websearch_to_tsquery('english', 'mario')) as rank
FROM games 
WHERE search_vector @@ websearch_to_tsquery('english', 'mario')
ORDER BY rank DESC
LIMIT 5;

-- Test RPC function
SELECT * FROM search_games_fts('zelda', 5);