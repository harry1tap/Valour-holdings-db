/**
 * Enable pgvector extension and add embedding column to expenses table
 * This enables semantic similarity search for expense categorization
 */

-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column for semantic search
-- OpenAI text-embedding-ada-002 produces 1536-dimension vectors
ALTER TABLE solar.expenses
ADD COLUMN IF NOT EXISTS description_embedding vector(1536);

-- Create index for fast similarity search using cosine distance
-- IVFFlat is an approximate nearest neighbor index that's fast for large datasets
-- lists = 100 is a good starting point (recommended: sqrt of expected row count)
CREATE INDEX IF NOT EXISTS idx_expenses_embedding
ON solar.expenses
USING ivfflat (description_embedding vector_cosine_ops)
WITH (lists = 100);

-- Add comment for documentation
COMMENT ON COLUMN solar.expenses.description_embedding IS 'OpenAI text-embedding-ada-002 embedding (1536 dimensions) for semantic similarity search';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA solar TO anon, authenticated;
GRANT SELECT ON solar.expenses TO anon, authenticated;
