# n8n Workflow Setup Guide

## AI-Powered Expense Categorization with Human Review

This guide walks you through setting up the n8n workflows for automated expense categorization using OpenAI GPT-4 with vector similarity search and Slack-based human review.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Supabase project with SQL scripts executed (from `sql/` directory)
- [ ] n8n instance running (cloud or self-hosted)
- [ ] OpenAI API key with access to GPT-4 and embeddings API
- [ ] Banking API credentials (e.g., Revolut Business API)
- [ ] Slack workspace with app creation permissions
- [ ] Environment variables configured in your Next.js app

---

## Part 1: Environment Setup

### 1.1 Run Database Migrations

Execute these SQL scripts in Supabase SQL Editor in order:

```bash
1. sql/enable_pgvector_and_embeddings.sql
2. sql/create_vector_search_functions.sql
3. sql/create_processed_transactions_table.sql
4. sql/create_expenses_rpc_functions.sql  # Re-run to update insert_expense function
```

Verify:
```sql
-- Check pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check expenses table has embedding column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'solar'
  AND table_name = 'expenses'
  AND column_name = 'description_embedding';

-- Check RPC functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('find_similar_expenses', 'update_expense_embedding', 'insert_expense');
```

### 1.2 Configure Environment Variables

Add these to your n8n environment (Settings → Environment Variables):

```env
# Banking API
BANKING_API_URL=https://api.revolut.com/business/1.0
BANKING_API_KEY=your-revolut-api-key

# Your Application
APP_URL=http://localhost:3001
N8N_API_KEY=VV1Vm0iM0UudmZRkfdj1U3tWSogVWzwQGNG7M4H7h+g=

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Slack
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C1234567890  # Get from Slack channel details
```

---

## Part 2: Main Expense Processing Workflow

### Workflow Overview

```
Schedule Trigger (15 min)
  ↓
Fetch Banking Transactions
  ↓
Check Processed Transactions (Supabase)
  ↓
Filter Duplicates (Code)
  ↓
Loop Over Transactions
  ↓
Extract Transaction Data (Code)
  ↓
Generate Embedding (OpenAI)
  ↓
Find Similar Expenses (Supabase RPC)
  ↓
Categorize with AI (OpenAI Chat + Functions)
  ↓
Decision: Auto-Approve or Review?
  ↓
├─ Auto: Insert to DB → Mark Processed
└─ Review: Send to Slack → Mark Pending
```

### Node-by-Node Configuration

#### Node 1: Schedule Trigger

**Type:** Schedule Trigger

**Configuration:**
- **Mode:** Every X Minutes
- **Value:** 15

![Schedule Trigger](https://n8n.io/assets/schedule-trigger.png)

---

#### Node 2: Fetch Banking Transactions

**Type:** HTTP Request

**Configuration:**
```json
{
  "method": "GET",
  "url": "={{ $env.BANKING_API_URL }}/transactions",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.BANKING_API_KEY }}"
      }
    ]
  },
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "from",
        "value": "={{ $now.minus({ hours: 24 }).toISO() }}"
      },
      {
        "name": "to",
        "value": "={{ $now.toISO() }}"
      },
      {
        "name": "state",
        "value": "completed"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

**Expected Response:**
```json
[
  {
    "id": "6960a8f0-01a7-a98f-a698-0a2789a09951",
    "type": "transfer",
    "state": "completed",
    "created_at": "2026-01-09T07:06:24.882059Z",
    "reference": "IT000009643473",
    "legs": [{
      "amount": -1261.92,
      "currency": "GBP",
      "description": "Nest"
    }]
  }
]
```

---

#### Node 3: Check Processed Transactions

**Type:** HTTP Request (Supabase REST API)

**Configuration:**
```json
{
  "method": "GET",
  "url": "={{ $env.SUPABASE_URL }}/rest/v1/processed_transactions",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
      }
    ]
  },
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "select",
        "value": "transaction_id"
      }
    ]
  }
}
```

---

#### Node 4: Filter Duplicates

**Type:** Code (JavaScript)

**Code:**
```javascript
// Get transactions from banking API (Node 2)
const transactions = $input.all()[0].json.body || [];

// Get already processed transaction IDs (Node 3)
const processedIds = $input.all()[1].json.body.map(t => t.transaction_id);

// Filter out duplicates
const newTransactions = transactions.filter(t => !processedIds.includes(t.id));

console.log(`Found ${transactions.length} transactions, ${newTransactions.length} are new`);

// Return each transaction as a separate item for the loop
return newTransactions.map(t => ({ json: t }));
```

---

#### Node 5: Loop Over Items

**Type:** Split Out

**Configuration:**
- This node automatically iterates over each item from the previous node

---

#### Node 6: Extract Transaction Data

**Type:** Code (JavaScript)

**Code:**
```javascript
const transaction = $input.first().json;

// Extract amount (handle negative for outgoing transactions)
const amount = Math.abs(transaction.legs[0].amount);
const description = transaction.legs[0].description;
const date = transaction.created_at.split('T')[0];
const transactionId = transaction.id;
const reference = transaction.reference || '';

console.log(`Processing transaction: ${transactionId} - ${description} - £${amount}`);

return {
  json: {
    transaction_id: transactionId,
    reference: reference,
    description: description,
    amount: amount,
    date: date,
    currency: transaction.legs[0].currency
  }
};
```

---

#### Node 7: Generate Embedding

**Type:** OpenAI (Embeddings)

**Configuration:**
```json
{
  "resource": "embedding",
  "model": "text-embedding-ada-002",
  "text": "={{ $json.description }}",
  "options": {}
}
```

**Output:** Adds `embedding` array to the item (1536 dimensions)

---

#### Node 8: Find Similar Expenses

**Type:** HTTP Request (Supabase RPC)

**Configuration:**
```json
{
  "method": "POST",
  "url": "={{ $env.SUPABASE_URL }}/rest/v1/rpc/find_similar_expenses",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "p_query_embedding",
        "value": "={{ JSON.stringify($json.embedding) }}"
      },
      {
        "name": "p_limit",
        "value": "5"
      },
      {
        "name": "p_similarity_threshold",
        "value": "0.7"
      }
    ]
  }
}
```

**Output:** Returns array of similar expenses with similarity scores

---

#### Node 9: Categorize with AI

**Type:** OpenAI (Chat)

**Configuration:**

**Model:** gpt-4o

**System Message:**
```
You are an expense categorization AI for a solar leads business. Your job is to analyze banking transactions and categorize them into expenses with proper split between "Online" and "Field" channels.

**Available Expense Categories:**
- Rent
- Marketing
- Salaries
- Utilities
- Software
- Equipment
- Travel
- Insurance
- Other

**Your Task:**
1. Analyze the transaction description and amount
2. Use historical similar expenses to find patterns
3. Categorize the expense and split the amount between:
   - online_amount: Costs for online marketing/operations
   - field_amount: Costs for field representatives/operations
4. Provide a confidence score (0-100) based on:
   - How similar this transaction is to past expenses
   - Clarity of the transaction description
   - Your certainty about the channel split

**Output Format (JSON):**
{
  "expense_date": "YYYY-MM-DD",
  "category": "one of the categories above",
  "description": "cleaned/standardized description",
  "total_amount": number,
  "online_amount": number,
  "field_amount": number,
  "notes": "explanation of your categorization",
  "confidence": number (0-100),
  "is_new_transaction": boolean (true if no similar expenses found)
}

**Rules:**
- online_amount + field_amount MUST equal total_amount
- If uncertain about split, use 50/50 and lower confidence
- If this is the first time seeing this vendor/description, set is_new_transaction = true
- Be consistent with historical categorization patterns
- Round amounts to 2 decimal places
```

**User Message:**
```
Categorize this transaction:

**Transaction Details:**
- Description: {{ $json.description }}
- Amount: £{{ $json.amount }}
- Date: {{ $json.date }}
- Reference: {{ $json.reference }}

**Similar Past Expenses:**
{{ $json.similar_expenses ? JSON.stringify($json.similar_expenses, null, 2) : 'No similar expenses found (this is likely a new type of transaction)' }}

Respond with ONLY the JSON object, no additional text.
```

**Options:**
- Response Format: JSON
- Temperature: 0.3 (low for consistency)

---

#### Node 10: Parse AI Response

**Type:** Code (JavaScript)

**Code:**
```javascript
const aiResponse = $json.choices[0].message.content;

// Parse JSON response from OpenAI
let categorization;
try {
  categorization = JSON.parse(aiResponse);
} catch (error) {
  console.error('Failed to parse AI response:', aiResponse);
  throw new Error('AI returned invalid JSON');
}

// Validate amounts
if (Math.abs(categorization.online_amount + categorization.field_amount - categorization.total_amount) > 0.01) {
  console.warn('Amount split does not equal total, adjusting...');
  // Adjust field_amount to make it balance
  categorization.field_amount = categorization.total_amount - categorization.online_amount;
}

// Merge with transaction data
return {
  json: {
    ...categorization,
    transaction_id: $input.all()[0].json.transaction_id,
    reference: $input.all()[0].json.reference,
    embedding: $input.all()[0].json.embedding,
    similar_expenses: $input.all()[0].json.similar_expenses || []
  }
};
```

---

#### Node 11: Decision - Auto-Approve or Review?

**Type:** IF (Switch)

**Configuration:**

**Condition 1: Auto-Approve** (High Confidence + Existing)
```javascript
{{ $json.is_new_transaction === false && $json.confidence >= 80 }}
```
→ Route to **Branch A: Auto-Insert**

**Condition 2: Human Review** (Low Confidence or New)
```javascript
{{ $json.is_new_transaction === true || $json.confidence < 80 }}
```
→ Route to **Branch B: Slack Review**

---

### Branch A: Auto-Approve

#### Node 12a: Insert Expense to Database

**Type:** HTTP Request

**Configuration:**
```json
{
  "method": "POST",
  "url": "={{ $env.APP_URL }}/api/expenses",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Content-Type",
        "value": "application/json"
      },
      {
        "name": "X-API-Key",
        "value": "={{ $env.N8N_API_KEY }}"
      }
    ]
  },
  "sendBody": true,
  "body": "={{ JSON.stringify({\n  expense_date: $json.expense_date,\n  category: $json.category,\n  description: $json.description,\n  total_amount: $json.total_amount,\n  online_amount: $json.online_amount,\n  field_amount: $json.field_amount,\n  notes: `${$json.notes} (Auto-approved, confidence: ${$json.confidence}%)`,\n  created_by: 'n8n-auto',\n  description_embedding: $json.embedding\n}) }}"
}
```

---

#### Node 13a: Mark as Processed (Auto-Approved)

**Type:** HTTP Request (Supabase Insert)

**Configuration:**
```json
{
  "method": "POST",
  "url": "={{ $env.SUPABASE_URL }}/rest/v1/processed_transactions",
  "authentication": "genericCredentialType",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      },
      {
        "name": "Prefer",
        "value": "return=representation"
      }
    ]
  },
  "sendBody": true,
  "body": "={{ JSON.stringify({\n  transaction_id: $json.transaction_id,\n  transaction_reference: $json.reference,\n  expense_id: $input.all()[0].json.body.data.id,\n  status: 'auto_approved',\n  created_by: 'n8n-auto'\n}) }}"
}
```

---

### Branch B: Human Review

#### Node 12b: Send to Slack for Review

**Type:** Slack (Send Message)

**Configuration:**

**Channel:** Use channel ID from `SLACK_CHANNEL_ID` environment variable

**Message Type:** Blocks

**Blocks JSON:**
```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "💰 New Expense for Review"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Transaction:*\n{{ $json.description }}"
        },
        {
          "type": "mrkdwn",
          "text": "*Amount:*\n£{{ $json.total_amount }}"
        },
        {
          "type": "mrkdwn",
          "text": "*Category:*\n{{ $json.category }}"
        },
        {
          "type": "mrkdwn",
          "text": "*Date:*\n{{ $json.expense_date }}"
        },
        {
          "type": "mrkdwn",
          "text": "*AI Confidence:*\n{{ $json.confidence }}%"
        },
        {
          "type": "mrkdwn",
          "text": "*Status:*\n{{ $json.is_new_transaction ? '🆕 New Transaction' : '⚠️ Low Confidence' }}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Split:*\n• Online: £{{ $json.online_amount }}\n• Field: £{{ $json.field_amount }}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*AI Notes:*\n{{ $json.notes }}"
      }
    },
    {
      "type": "actions",
      "block_id": "expense_actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "✅ Approve"
          },
          "style": "primary",
          "value": "{{ $json.transaction_id }}",
          "action_id": "approve_expense"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "❌ Reject"
          },
          "style": "danger",
          "value": "{{ $json.transaction_id }}",
          "action_id": "reject_expense"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Transaction ID: `{{ $json.transaction_id }}`"
        }
      ]
    }
  ]
}
```

---

#### Node 13b: Store Pending Review Data

**Type:** HTTP Request (Supabase Insert)

**Configuration:**
```json
{
  "method": "POST",
  "url": "={{ $env.SUPABASE_URL }}/rest/v1/processed_transactions",
  "authentication": "genericCredentialType",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "body": "={{ JSON.stringify({\n  transaction_id: $json.transaction_id,\n  transaction_reference: $json.reference,\n  status: 'pending_review',\n  created_by: 'n8n-slack'\n}) }}"
}
```

---

## Part 3: Slack Response Handler Workflow

This separate workflow handles button clicks from Slack messages.

### Workflow Overview

```
Webhook Trigger
  ↓
Parse Slack Payload
  ↓
Verify Slack Request
  ↓
Switch on Action (Approve/Reject)
  ↓
├─ Approve: Insert Expense → Update Transaction Status
└─ Reject: Update Transaction Status
  ↓
Update Slack Message
```

### Node-by-Node Configuration

#### Node 1: Webhook Trigger

**Type:** Webhook

**Configuration:**
- **Path:** `/slack/expense-action`
- **Method:** POST
- **Response Mode:** Last Node

**Copy the webhook URL** - you'll need this for Slack app configuration

---

#### Node 2: Parse Slack Payload

**Type:** Code (JavaScript)

**Code:**
```javascript
// Slack sends data as form-urlencoded with a 'payload' field
const payload = JSON.parse($input.first().json.body.payload);

const action = payload.actions[0];
const actionType = action.action_id; // 'approve_expense' or 'reject_expense'
const transactionId = action.value;
const user = payload.user.name;
const responseUrl = payload.response_url;

console.log(`Action: ${actionType} by ${user} for transaction ${transactionId}`);

// Fetch the pending transaction data
return {
  json: {
    action_type: actionType,
    transaction_id: transactionId,
    user: user,
    response_url: responseUrl,
    message_ts: payload.message.ts,
    channel_id: payload.channel.id
  }
};
```

---

#### Node 3: Get Pending Transaction Data

**Type:** HTTP Request (Supabase Query)

**Configuration:**
```json
{
  "method": "GET",
  "url": "={{ $env.SUPABASE_URL }}/rest/v1/processed_transactions",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "transaction_id",
        "value": "=eq.{{ $json.transaction_id }}"
      },
      {
        "name": "select",
        "value": "*"
      }
    ]
  },
  "authentication": "genericCredentialType",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
      }
    ]
  }
}
```

---

#### Node 4: Switch on Action Type

**Type:** IF (Switch)

**Condition 1: Approve**
```javascript
{{ $json.action_type === 'approve_expense' }}
```
→ Route to **Approve Branch**

**Condition 2: Reject**
```javascript
{{ $json.action_type === 'reject_expense' }}
```
→ Route to **Reject Branch**

---

### Approve Branch

#### Node 5a: TODO - Get AI Categorization from Cache

**Type:** HTTP Request (Supabase Query)

**Note:** You'll need to store the AI categorization data somewhere to retrieve it here. Options:
1. Store in `processed_transactions` table as JSONB
2. Create a separate `pending_expense_reviews` table
3. Use n8n's built-in data store

For simplicity, let's add a `categorization_data` JSONB column to `processed_transactions`:

```sql
ALTER TABLE solar.processed_transactions
ADD COLUMN categorization_data JSONB;
```

Then modify Node 13b in the main workflow to store the categorization:
```json
"body": "={{ JSON.stringify({\n  transaction_id: $json.transaction_id,\n  transaction_reference: $json.reference,\n  status: 'pending_review',\n  created_by: 'n8n-slack',\n  categorization_data: {\n    expense_date: $json.expense_date,\n    category: $json.category,\n    description: $json.description,\n    total_amount: $json.total_amount,\n    online_amount: $json.online_amount,\n    field_amount: $json.field_amount,\n    notes: $json.notes,\n    confidence: $json.confidence,\n    embedding: $json.embedding\n  }\n}) }}"
```

#### Node 5a: Extract Categorization Data

**Type:** Code (JavaScript)

**Code:**
```javascript
const transactionData = $input.all()[0].json.body[0];
const categorization = transactionData.categorization_data;

if (!categorization) {
  throw new Error('No categorization data found for this transaction');
}

return {
  json: {
    ...categorization,
    transaction_id: transactionData.transaction_id,
    reference: transactionData.transaction_reference,
    user: $input.first().json.user
  }
};
```

---

#### Node 6a: Insert Expense to Database

**Type:** HTTP Request

**Configuration:** Same as Node 12a, but change `created_by`:
```json
{
  "created_by": "n8n-slack-{{ $json.user }}"
}
```

---

#### Node 7a: Update Transaction Status

**Type:** HTTP Request (Supabase Update)

**Configuration:**
```json
{
  "method": "PATCH",
  "url": "={{ $env.SUPABASE_URL }}/rest/v1/processed_transactions",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "transaction_id",
        "value": "=eq.{{ $json.transaction_id }}"
      }
    ]
  },
  "sendBody": true,
  "body": "={{ JSON.stringify({\n  status: 'manually_approved',\n  expense_id: $input.all()[0].json.body.data.id\n}) }}",
  "authentication": "genericCredentialType",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  }
}
```

---

#### Node 8a: Update Slack Message (Approved)

**Type:** HTTP Request (Slack API)

**Configuration:**
```json
{
  "method": "POST",
  "url": "https://slack.com/api/chat.update",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.SLACK_BOT_TOKEN }}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "body": "={{ JSON.stringify({\n  channel: $input.first().json.channel_id,\n  ts: $input.first().json.message_ts,\n  text: `✅ Expense Approved by ${$input.first().json.user}`,\n  blocks: [\n    {\n      type: 'header',\n      text: {\n        type: 'plain_text',\n        text: '✅ Expense Approved'\n      }\n    },\n    {\n      type: 'section',\n      text: {\n        type: 'mrkdwn',\n        text: `*Approved by:* ${$input.first().json.user}\\n*Transaction:* ${$json.description}\\n*Amount:* £${$json.total_amount}\\n*Category:* ${$json.category}`\n      }\n    }\n  ]\n}) }}"
}
```

---

### Reject Branch

#### Node 5b: Update Transaction Status (Rejected)

**Type:** HTTP Request (Supabase Update)

**Configuration:**
```json
{
  "method": "PATCH",
  "url": "={{ $env.SUPABASE_URL }}/rest/v1/processed_transactions",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "transaction_id",
        "value": "=eq.{{ $json.transaction_id }}"
      }
    ]
  },
  "sendBody": true,
  "body": "={{ JSON.stringify({\n  status: 'rejected'\n}) }}",
  "authentication": "genericCredentialType",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  }
}
```

---

#### Node 6b: Update Slack Message (Rejected)

**Type:** HTTP Request (Slack API)

**Configuration:**
```json
{
  "method": "POST",
  "url": "https://slack.com/api/chat.update",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.SLACK_BOT_TOKEN }}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "body": "={{ JSON.stringify({\n  channel: $input.first().json.channel_id,\n  ts: $input.first().json.message_ts,\n  text: `❌ Expense Rejected by ${$input.first().json.user}`,\n  blocks: [\n    {\n      type: 'header',\n      text: {\n        type: 'plain_text',\n        text: '❌ Expense Rejected'\n      }\n    },\n    {\n      type: 'section',\n      text: {\n        type: 'mrkdwn',\n        text: `*Rejected by:* ${$input.first().json.user}\\n*Transaction ID:* ${$json.transaction_id}`\n      }\n    }\n  ]\n}) }}"
}
```

---

## Part 4: Slack App Configuration

### Step 1: Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Expense Review Bot"
4. Select your workspace

### Step 2: Configure Bot Token Scopes

Go to **OAuth & Permissions** → **Scopes** and add:

- `chat:write` - Send messages
- `chat:write.public` - Send messages to channels without joining
- `channels:read` - View basic channel info
- `im:write` - Send DMs

### Step 3: Enable Interactivity

1. Go to **Interactivity & Shortcuts**
2. Turn on **Interactivity**
3. **Request URL:** Enter your n8n webhook URL from the Slack Response Handler workflow
   - Example: `https://your-n8n-instance.com/webhook/slack/expense-action`
4. Click **Save Changes**

### Step 4: Install App to Workspace

1. Go to **OAuth & Permissions**
2. Click **Install to Workspace**
3. Authorize the app
4. **Copy the Bot User OAuth Token** (starts with `xoxb-`)
5. Add to n8n environment variable: `SLACK_BOT_TOKEN`

### Step 5: Get Channel ID

1. Open Slack
2. Right-click on the channel (e.g., #expenses-review)
3. Click "View channel details"
4. Scroll down to find the Channel ID (e.g., `C1234567890`)
5. Add to n8n environment variable: `SLACK_CHANNEL_ID`

### Step 6: Invite Bot to Channel

In Slack, type:
```
/invite @Expense Review Bot
```

---

## Part 5: Testing

### Step 1: Test Database Setup

```sql
-- Test vector similarity (should work without errors)
SELECT public.find_similar_expenses(
  '[0.1, 0.2, ...]'::vector(1536),  -- Replace with actual embedding
  5,
  0.7
);
```

### Step 2: Test Main Workflow

1. In n8n, open the main workflow
2. Click "Execute Workflow" (manual trigger for testing)
3. Check execution:
   - Node 2: Should fetch transactions from banking API
   - Node 4: Should filter duplicates
   - Node 7: Should generate embeddings
   - Node 9: Should categorize with AI

### Step 3: Test Auto-Approval

Create a test expense that should auto-approve (confidence ≥ 80%):
- Check that expense appears in `solar.expenses` table
- Check that transaction appears in `processed_transactions` with status = 'auto_approved'

### Step 4: Test Slack Review

Create a test expense that should go to Slack (confidence < 80% or new transaction):
- Check that message appears in Slack
- Click ✅ Approve button
- Verify expense is created in database
- Verify Slack message updates to show "Approved"

### Step 5: Test Rejection

- Send a test transaction to Slack
- Click ❌ Reject button
- Verify transaction status = 'rejected' in database
- Verify Slack message updates to show "Rejected"

---

## Part 6: Monitoring & Maintenance

### Dashboard Queries

```sql
-- Check processing statistics
SELECT
  status,
  COUNT(*) as count,
  ROUND(AVG(CASE
    WHEN categorization_data->>'confidence' IS NOT NULL
    THEN (categorization_data->>'confidence')::numeric
    ELSE NULL
  END), 2) as avg_confidence
FROM solar.processed_transactions
GROUP BY status;

-- Recent pending reviews
SELECT
  transaction_id,
  transaction_reference,
  categorization_data->>'description' as description,
  categorization_data->>'confidence' as confidence,
  processed_at
FROM solar.processed_transactions
WHERE status = 'pending_review'
ORDER BY processed_at DESC
LIMIT 10;

-- Auto-approval rate
SELECT
  ROUND(
    100.0 * SUM(CASE WHEN status = 'auto_approved' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as auto_approval_rate_percent
FROM solar.processed_transactions;
```

### n8n Workflow Logs

- Check n8n execution history for errors
- Monitor OpenAI API usage
- Watch for failed Supabase queries

---

## Troubleshooting

### Issue: "pgvector extension not found"

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: "Invalid embedding dimension"

**Solution:** Ensure OpenAI embeddings are 1536 dimensions (text-embedding-ada-002)

### Issue: "Slack webhook not working"

**Solution:**
1. Check webhook URL is correct in Slack app settings
2. Verify n8n workflow is activated
3. Check n8n logs for incoming requests

### Issue: "Amounts don't sum correctly"

**Solution:** The Parse AI Response node (Node 10) includes validation and adjustment logic

---

## Next Steps

- [ ] Add expense editing capability in Slack
- [ ] Implement budget alerts
- [ ] Add analytics dashboard for expense trends
- [ ] Create recurring expense detection
- [ ] Add multi-currency support

---

**Workflow Status:**
- [x] Database setup complete
- [x] Main workflow documented
- [x] Slack handler documented
- [ ] Slack app configured (requires user action)
- [ ] Testing complete (requires user action)
