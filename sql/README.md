# SQL Migration Guide

Execute these SQL scripts in **Supabase SQL Editor** in the following order:

## Setup Order

### Phase 1: Core Tables (Already Completed)
1. ✅ `create_expenses_table.sql` - Creates the expenses table
2. ✅ `create_expenses_rpc_functions.sql` - Creates insert_expense and get_expenses functions
3. ✅ `update_lead_source_constraint.sql` - Updates lead source to "Online" or "Field"
4. ✅ `update_dashboard_metrics_rpc.sql` - Updates dashboard metrics with CPL split

### Phase 2: Vector Search & AI (New - Run These Now)
5. **`enable_pgvector_and_embeddings.sql`** - Enables pgvector extension and adds embedding column
6. **`create_vector_search_functions.sql`** - Creates find_similar_expenses and update_expense_embedding
7. **`create_processed_transactions_table.sql`** - Creates transaction tracking table
8. **Re-run `create_expenses_rpc_functions.sql`** - Updates insert_expense to support embeddings

## Verification

After running all scripts, verify setup:

```sql
-- 1. Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 2. Check embedding column exists
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'solar'
  AND table_name = 'expenses'
  AND column_name = 'description_embedding';

-- 3. Check RPC functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'insert_expense',
    'get_expenses',
    'find_similar_expenses',
    'update_expense_embedding',
    'calculate_dashboard_metrics'
  );

-- 4. Check processed_transactions table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'solar'
  AND table_name = 'processed_transactions'
ORDER BY ordinal_position;
```

Expected output:
- ✅ pgvector extension enabled
- ✅ description_embedding column (type: USER-DEFINED, udt_name: vector)
- ✅ 5 RPC functions exist
- ✅ processed_transactions table with 9 columns including categorization_data (jsonb)

## Rollback (if needed)

To rollback changes:

```sql
-- Remove vector search
DROP FUNCTION IF EXISTS public.find_similar_expenses;
DROP FUNCTION IF EXISTS public.update_expense_embedding;
DROP INDEX IF EXISTS solar.idx_expenses_embedding;
ALTER TABLE solar.expenses DROP COLUMN IF EXISTS description_embedding;
DROP EXTENSION IF EXISTS vector CASCADE;

-- Remove transaction tracking
DROP TABLE IF EXISTS solar.processed_transactions CASCADE;
```

## Next Steps

After running these SQL scripts:
1. Configure n8n workflows (see `n8n-workflow-setup.md`)
2. Set up Slack app (see Part 4 in setup guide)
3. Test the complete workflow
