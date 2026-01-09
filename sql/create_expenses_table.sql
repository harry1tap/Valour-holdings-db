-- ============================================================================
-- Create expenses table for tracking business expenses by channel
-- ============================================================================
-- This table stores individual expense items with pre-split amounts for
-- Online and Field channels. n8n workflow will insert expenses via API.
-- ============================================================================

CREATE TABLE solar.expenses (
  id SERIAL PRIMARY KEY,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  online_amount NUMERIC(10, 2) NOT NULL CHECK (online_amount >= 0),
  field_amount NUMERIC(10, 2) NOT NULL CHECK (field_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  notes TEXT,

  -- Validation: online + field should equal total
  CONSTRAINT amounts_sum_check CHECK (
    online_amount + field_amount = total_amount
  )
);

-- Indexes for performance
CREATE INDEX idx_expenses_date ON solar.expenses(expense_date);
CREATE INDEX idx_expenses_created_at ON solar.expenses(created_at);
CREATE INDEX idx_expenses_category ON solar.expenses(category);

-- Add comment for documentation
COMMENT ON TABLE solar.expenses IS 'Business expenses with split amounts for Online and Field channels';
COMMENT ON COLUMN solar.expenses.expense_date IS 'The date the expense applies to (not when it was entered)';
COMMENT ON COLUMN solar.expenses.total_amount IS 'Total expense amount';
COMMENT ON COLUMN solar.expenses.online_amount IS 'Amount allocated to Online channel';
COMMENT ON COLUMN solar.expenses.field_amount IS 'Amount allocated to Field channel';
COMMENT ON COLUMN solar.expenses.created_by IS 'Who/what created this record (e.g., n8n, user ID)';
