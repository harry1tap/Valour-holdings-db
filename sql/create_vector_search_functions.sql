/**
 * Vector Search RPC Functions
 * Functions for semantic similarity search and embedding management
 */

-- Function: find_similar_expenses
-- Purpose: Find past expenses similar to a transaction description using vector similarity
-- Returns: Top N most similar expenses with similarity scores
CREATE OR REPLACE FUNCTION public.find_similar_expenses(
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 5,
  p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id INTEGER,
  description TEXT,
  category TEXT,
  total_amount NUMERIC,
  online_amount NUMERIC,
  field_amount NUMERIC,
  expense_date DATE,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.description,
    e.category,
    e.total_amount,
    e.online_amount,
    e.field_amount,
    e.expense_date,
    -- Calculate cosine similarity (1 - cosine distance)
    -- Higher values mean more similar
    1 - (e.description_embedding <=> p_query_embedding) AS similarity
  FROM solar.expenses e
  WHERE e.description_embedding IS NOT NULL
    AND 1 - (e.description_embedding <=> p_query_embedding) >= p_similarity_threshold
  ORDER BY e.description_embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.find_similar_expenses IS 'Find expenses similar to a given embedding vector using cosine similarity';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.find_similar_expenses TO anon, authenticated;


-- Function: update_expense_embedding
-- Purpose: Update the embedding for an expense (called after expense insertion)
-- Returns: Boolean indicating success
CREATE OR REPLACE FUNCTION public.update_expense_embedding(
  p_expense_id INTEGER,
  p_embedding vector(1536)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE solar.expenses
  SET description_embedding = p_embedding
  WHERE id = p_expense_id;

  -- Return true if a row was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.update_expense_embedding IS 'Update the embedding vector for an expense after insertion';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_expense_embedding TO anon, authenticated;
