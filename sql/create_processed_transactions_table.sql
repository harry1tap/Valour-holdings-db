/**
 * Processed Transactions Table
 * Tracks which banking transactions have been processed to prevent duplicates
 */

-- Create table for tracking processed transactions
-- Note: Created in public schema for Supabase REST API access
CREATE TABLE IF NOT EXISTS public.processed_transactions (
  id SERIAL PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,     -- ID from banking API (e.g., Revolut transaction ID)
  transaction_reference TEXT,              -- Reference from banking API (e.g., IT000009643473)
  processed_at TIMESTAMPTZ DEFAULT NOW(),  -- When this transaction was processed
  expense_id INTEGER REFERENCES solar.expenses(id),  -- Link to created expense (if approved)
  status TEXT NOT NULL CHECK (status IN ('auto_approved', 'pending_review', 'manually_approved', 'rejected')),
  created_by TEXT,                         -- Who/what created this record (e.g., 'n8n-auto', 'n8n-slack-username')
  notes TEXT,                              -- Any additional notes about processing
  categorization_data JSONB                -- Stores AI categorization data for pending reviews
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_processed_transactions_id
ON public.processed_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_processed_transactions_status
ON public.processed_transactions(status);

CREATE INDEX IF NOT EXISTS idx_processed_transactions_processed_at
ON public.processed_transactions(processed_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.processed_transactions IS 'Tracks processed banking transactions to prevent duplicates and maintain audit trail';
COMMENT ON COLUMN public.processed_transactions.transaction_id IS 'Unique ID from banking API to identify the transaction';
COMMENT ON COLUMN public.processed_transactions.status IS 'Processing status: auto_approved (AI confidence ≥80%), pending_review (awaiting human review), manually_approved (approved via Slack), rejected (rejected via Slack)';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.processed_transactions TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.processed_transactions_id_seq TO anon, authenticated;
