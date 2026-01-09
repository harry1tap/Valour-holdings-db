# Deployment Checklist: AI Expense Categorization Workflow

Use this checklist to deploy the n8n expense categorization workflow.

---

## Phase 1: Database Setup ⚙️

### 1.1 Execute SQL Scripts

Run these in **Supabase SQL Editor** in order:

- [ ] Execute `sql/enable_pgvector_and_embeddings.sql`
  - Enables pgvector extension
  - Adds embedding column to expenses table
  - Creates IVFFlat index for fast similarity search

- [ ] Execute `sql/create_vector_search_functions.sql`
  - Creates `find_similar_expenses` RPC function
  - Creates `update_expense_embedding` RPC function

- [ ] Execute `sql/create_processed_transactions_table.sql`
  - Creates transaction tracking table
  - Adds indexes for fast lookups

- [ ] Re-run `sql/create_expenses_rpc_functions.sql`
  - Updates `insert_expense` to support embeddings

### 1.2 Verify Database Setup

Run verification queries:

```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Expected: 1 row

-- Check embedding column
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'solar' AND table_name = 'expenses'
AND column_name = 'description_embedding';
-- Expected: 1 row

-- Check RPC functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('find_similar_expenses', 'update_expense_embedding', 'insert_expense');
-- Expected: 3 rows

-- Check processed_transactions table
SELECT COUNT(*) FROM solar.processed_transactions;
-- Expected: 0 rows (empty table)
```

- [ ] All verification queries return expected results

---

## Phase 2: Environment Configuration 🔐

### 2.1 Banking API Credentials

- [ ] Obtain banking API credentials (e.g., Revolut Business API)
- [ ] Test API access with curl:
  ```bash
  curl -H "Authorization: Bearer YOUR_API_KEY" \
    https://api.revolut.com/business/1.0/transactions
  ```
- [ ] Add to n8n environment:
  ```env
  BANKING_API_URL=https://api.revolut.com/business/1.0
  BANKING_API_KEY=your-api-key-here
  ```

### 2.2 OpenAI API

- [ ] Verify OpenAI API key has access to:
  - GPT-4o (or GPT-4)
  - text-embedding-ada-002
- [ ] Test with curl:
  ```bash
  curl https://api.openai.com/v1/models \
    -H "Authorization: Bearer YOUR_OPENAI_KEY"
  ```
- [ ] Add to n8n environment:
  ```env
  OPENAI_API_KEY=sk-your-openai-key
  ```

### 2.3 Supabase Service Key

- [ ] Get Supabase service role key (Settings → API → service_role secret)
- [ ] Add to n8n environment:
  ```env
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_KEY=your-service-role-key
  ```

### 2.4 Application API

- [ ] Verify `N8N_API_KEY` is set in `.env.local`:
  ```env
  N8N_API_KEY=VV1Vm0iM0UudmZRkfdj1U3tWSogVWzwQGNG7M4H7h+g=
  ```
- [ ] Add to n8n environment:
  ```env
  APP_URL=http://localhost:3001  # or your production URL
  N8N_API_KEY=VV1Vm0iM0UudmZRkfdj1U3tWSogVWzwQGNG7M4H7h+g=
  ```

### 2.5 Test API Endpoint

- [ ] Test expense insertion via API:
  ```bash
  curl -X POST http://localhost:3001/api/expenses \
    -H "Content-Type: application/json" \
    -H "X-API-Key: VV1Vm0iM0UudmZRkfdj1U3tWSogVWzwQGNG7M4H7h+g=" \
    -d '{
      "expense_date": "2026-01-09",
      "category": "Software",
      "description": "Test expense",
      "total_amount": 50.00,
      "online_amount": 50.00,
      "field_amount": 0.00,
      "notes": "API test"
    }'
  ```
- [ ] Verify expense appears in Supabase

---

## Phase 3: Slack App Setup 💬

Follow detailed steps in `slack-app-setup.md`:

- [ ] Create Slack app at https://api.slack.com/apps
- [ ] Add OAuth scopes: `chat:write`, `chat:write.public`, `channels:read`
- [ ] Install app to workspace
- [ ] Copy Bot User OAuth Token (starts with `xoxb-`)
- [ ] Get channel ID for #expenses-review
- [ ] Enable Interactivity (you'll add the webhook URL later)
- [ ] Invite bot to channel (if needed): `/invite @Expense Review Bot`

Add to n8n environment:
```env
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL_ID=C1234567890
```

---

## Phase 4: n8n Workflows 🤖

### 4.1 Create Main Workflow

Follow `n8n-workflow-setup.md` Part 2:

- [ ] Create new workflow: "Expense Processing - Main"
- [ ] Add Schedule Trigger (every 15 min)
- [ ] Add HTTP Request node - Fetch Transactions
- [ ] Add HTTP Request node - Check Processed Transactions
- [ ] Add Code node - Filter Duplicates
- [ ] Add Split Out node - Loop Over Items
- [ ] Add Code node - Extract Transaction Data
- [ ] Add OpenAI node - Generate Embedding
- [ ] Add HTTP Request node - Find Similar Expenses (Supabase RPC)
- [ ] Add OpenAI Chat node - Categorize with AI
- [ ] Add Code node - Parse AI Response
- [ ] Add IF node - Decision: Auto-Approve or Review
- [ ] **Branch A:** Add HTTP Request - Insert Expense (auto-approve)
- [ ] **Branch A:** Add HTTP Request - Mark Processed (auto_approved)
- [ ] **Branch B:** Add Slack node - Send Review Message
- [ ] **Branch B:** Add HTTP Request - Mark Processed (pending_review)

- [ ] Configure all node parameters (see setup guide)
- [ ] Save workflow
- [ ] **Activate workflow**

### 4.2 Create Slack Response Handler

Follow `n8n-workflow-setup.md` Part 3:

- [ ] Create new workflow: "Expense Processing - Slack Handler"
- [ ] Add Webhook Trigger
  - Path: `/slack/expense-action`
  - Method: POST
- [ ] **Copy webhook URL** (e.g., `https://n8n.example.com/webhook/abc123`)
- [ ] Add Code node - Parse Slack Payload
- [ ] Add HTTP Request - Get Pending Transaction Data
- [ ] Add IF node - Switch on Action (Approve/Reject)
- [ ] **Approve Branch:**
  - [ ] Add Code node - Extract Categorization Data
  - [ ] Add HTTP Request - Insert Expense
  - [ ] Add HTTP Request - Update Transaction Status
  - [ ] Add HTTP Request - Update Slack Message (Approved)
- [ ] **Reject Branch:**
  - [ ] Add HTTP Request - Update Transaction Status (Rejected)
  - [ ] Add HTTP Request - Update Slack Message (Rejected)

- [ ] Configure all node parameters
- [ ] Save workflow
- [ ] **Activate workflow**

### 4.3 Update Slack App with Webhook URL

- [ ] Go to Slack app settings → Interactivity & Shortcuts
- [ ] Set Request URL to your webhook URL from step 4.2
- [ ] Save changes

---

## Phase 5: Testing 🧪

### 5.1 Test Database Functions

```sql
-- Test similarity search (with dummy embedding)
SELECT public.find_similar_expenses(
  array_fill(0.1, ARRAY[1536])::vector(1536),
  5,
  0.7
);
-- Expected: Empty array (no expenses with embeddings yet)
```

- [ ] Query runs without errors

### 5.2 Test Main Workflow (Manual Trigger)

- [ ] In n8n, open "Expense Processing - Main"
- [ ] Click "Test workflow" → "Execute Workflow"
- [ ] Check each node execution:
  - [ ] Node 2: Fetches transactions from banking API
  - [ ] Node 4: Filters duplicates
  - [ ] Node 7: Generates embeddings
  - [ ] Node 9: AI categorizes transaction
  - [ ] Node 11: Routes to correct branch

### 5.3 Test Auto-Approval Path

Create a test transaction that should auto-approve:

- [ ] Use a transaction similar to existing expenses
- [ ] AI should return confidence ≥ 80% and is_new_transaction = false
- [ ] Verify expense inserted in `solar.expenses`
- [ ] Verify transaction in `processed_transactions` with status = 'auto_approved'
- [ ] Verify embedding stored

### 5.4 Test Slack Review Path

Create a test transaction that needs review:

- [ ] Use a NEW type of transaction (never seen before)
- [ ] OR use a transaction with ambiguous description
- [ ] AI should return confidence < 80% OR is_new_transaction = true
- [ ] Verify message appears in Slack #expenses-review
- [ ] Message should have:
  - [ ] Transaction details
  - [ ] AI confidence score
  - [ ] ✅ Approve button
  - [ ] ❌ Reject button

### 5.5 Test Slack Approve Action

- [ ] Click ✅ Approve on a test message
- [ ] Check n8n "Slack Handler" execution logs
- [ ] Verify expense created in database
- [ ] Verify transaction status updated to 'manually_approved'
- [ ] Verify Slack message updated to show "Approved by [username]"

### 5.6 Test Slack Reject Action

- [ ] Click ❌ Reject on a test message
- [ ] Verify transaction status updated to 'rejected'
- [ ] Verify Slack message updated to show "Rejected by [username]"
- [ ] Verify NO expense created in database

### 5.7 Test Scheduled Run

- [ ] Wait for scheduled trigger (or set to 1-minute intervals for testing)
- [ ] Create a new transaction in banking API
- [ ] Wait for workflow to run
- [ ] Verify transaction is processed automatically

---

## Phase 6: Monitoring 📊

### 6.1 Set Up Monitoring Queries

Create saved queries in Supabase:

```sql
-- Processing statistics
SELECT
  status,
  COUNT(*) as count,
  ROUND(AVG((categorization_data->>'confidence')::numeric), 2) as avg_confidence
FROM solar.processed_transactions
WHERE categorization_data IS NOT NULL
GROUP BY status;

-- Recent auto-approvals
SELECT
  transaction_reference,
  categorization_data->>'description' as description,
  categorization_data->>'category' as category,
  (categorization_data->>'total_amount')::numeric as amount,
  (categorization_data->>'confidence')::numeric as confidence,
  processed_at
FROM solar.processed_transactions
WHERE status = 'auto_approved'
ORDER BY processed_at DESC
LIMIT 10;

-- Pending reviews
SELECT
  transaction_reference,
  categorization_data->>'description' as description,
  (categorization_data->>'confidence')::numeric as confidence,
  processed_at
FROM solar.processed_transactions
WHERE status = 'pending_review'
ORDER BY processed_at DESC;
```

- [ ] Test queries run successfully
- [ ] Bookmark queries for easy access

### 6.2 Set Up n8n Monitoring

- [ ] Check workflow execution history daily
- [ ] Monitor OpenAI API usage in OpenAI dashboard
- [ ] Set up error notifications in n8n (optional)

### 6.3 Set Up Slack Notifications (Optional)

- [ ] Create a #workflow-errors channel
- [ ] Add error handling in workflows to post failures to this channel

---

## Phase 7: Optimization 🚀

### 7.1 Confidence Threshold Tuning

After 1 week of usage:

- [ ] Run query to check auto-approval rate:
  ```sql
  SELECT
    ROUND(100.0 * SUM(CASE WHEN status = 'auto_approved' THEN 1 ELSE 0 END) / COUNT(*), 2)
    as auto_approval_rate
  FROM solar.processed_transactions;
  ```
- [ ] Target: 60-70% auto-approval rate
- [ ] If too low (<50%): Lower confidence threshold to 75%
- [ ] If too high (>80%): Raise confidence threshold to 85%

### 7.2 Category Accuracy Check

- [ ] Review 20 random auto-approved expenses
- [ ] Check if category and split are correct
- [ ] If accuracy < 90%: Improve AI system prompt

### 7.3 Performance Optimization

- [ ] Check average workflow execution time
- [ ] If > 30 seconds: Consider caching embeddings for common vendors
- [ ] Monitor OpenAI API latency

---

## Rollback Plan 🔄

If something goes wrong:

### Option 1: Disable Workflows

- [ ] In n8n, deactivate both workflows
- [ ] Manually process transactions using existing method
- [ ] Investigate issues

### Option 2: Database Rollback

```sql
-- Remove vector search features
DROP FUNCTION IF EXISTS public.find_similar_expenses CASCADE;
DROP FUNCTION IF EXISTS public.update_expense_embedding CASCADE;
DROP INDEX IF EXISTS solar.idx_expenses_embedding;
ALTER TABLE solar.expenses DROP COLUMN IF EXISTS description_embedding;

-- Remove transaction tracking
DROP TABLE IF EXISTS solar.processed_transactions CASCADE;

-- Revert insert_expense to original version
-- (Re-run the old version of create_expenses_rpc_functions.sql)
```

### Option 3: Slack Fallback

- [ ] Disable Interactivity in Slack app
- [ ] Manually review expenses via Supabase dashboard

---

## Success Criteria ✅

After deployment, the workflow should:

- [x] Process transactions every 15 minutes automatically
- [x] Auto-approve 60-70% of transactions (confidence ≥ 80%)
- [x] Send 30-40% to Slack for review
- [x] Update dashboard within 5 minutes of approval
- [x] Handle duplicate transactions correctly
- [x] Store embeddings for future similarity search
- [x] Respond to Slack button clicks within 2 seconds

---

## Maintenance Schedule 📅

### Daily
- [ ] Check pending reviews in Slack
- [ ] Review auto-approved expenses (spot check 5 random)

### Weekly
- [ ] Review processing statistics
- [ ] Check for any workflow errors
- [ ] Monitor OpenAI API usage and costs

### Monthly
- [ ] Tune confidence threshold if needed
- [ ] Review and improve AI system prompt
- [ ] Check embedding index performance
- [ ] Update expense categories if needed

---

## Support & Documentation

- **Detailed Setup:** `n8n-workflow-setup.md`
- **Slack Configuration:** `slack-app-setup.md`
- **SQL Scripts:** `sql/README.md`
- **Original Plan:** `.claude/plans/partitioned-wandering-locket.md`

---

**Deployed by:** _______________
**Date:** _______________
**n8n Instance:** _______________
**Slack Workspace:** _______________
