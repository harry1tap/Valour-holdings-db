# Slack App Setup for Expense Review

This guide walks through creating and configuring a Slack app for expense review with interactive buttons.

---

## Step 1: Create Slack App

1. Go to **https://api.slack.com/apps**
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Fill in details:
   - **App Name:** `Expense Review Bot`
   - **Pick a workspace:** Select your workspace
5. Click **"Create App"**

![Create Slack App](https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png)

---

## Step 2: Configure Basic Information

1. In the left sidebar, click **"Basic Information"**
2. Scroll to **"Display Information"**
3. Optionally add:
   - **Short description:** "AI-powered expense categorization with human review"
   - **App icon:** Upload a money/calculator icon
   - **Background color:** Choose a color (e.g., #4A154B)

---

## Step 3: Configure Bot Token Scopes

1. In the left sidebar, click **"OAuth & Permissions"**
2. Scroll down to **"Scopes"** → **"Bot Token Scopes"**
3. Click **"Add an OAuth Scope"** and add the following:

| Scope | Description | Required For |
|-------|-------------|--------------|
| `chat:write` | Send messages as the bot | Posting expense review messages |
| `chat:write.public` | Send messages to channels without joining | Post to #expenses-review without /invite |
| `channels:read` | View basic channel info | Finding channel names |
| `im:write` | Send direct messages | (Optional) DM users about expenses |

4. Click **"Save Changes"**

![OAuth Scopes](https://i.imgur.com/example.png)

---

## Step 4: Install App to Workspace

1. Still on the **"OAuth & Permissions"** page
2. Scroll to the top
3. Click **"Install to Workspace"**
4. Review the permissions
5. Click **"Allow"**

6. **Important:** Copy the **Bot User OAuth Token**
   - Format: `xoxb-1234567890-1234567890123-abcdefghijklmnopqrstuv`
   - Store this securely - you'll need it for n8n

### Add to n8n Environment Variables

In n8n, add:
```env
SLACK_BOT_TOKEN=xoxb-your-token-here
```

---

## Step 5: Enable Interactivity

This is the most critical step - it connects Slack buttons to your n8n workflow.

1. In the left sidebar, click **"Interactivity & Shortcuts"**
2. Toggle **"Interactivity"** to **ON**
3. In **"Request URL"**, enter your n8n webhook URL:
   ```
   https://your-n8n-instance.com/webhook/slack/expense-action
   ```

   **How to get this URL:**
   - Open your Slack Response Handler workflow in n8n
   - Click on the Webhook Trigger node (first node)
   - Copy the "Production URL"
   - Example: `https://n8n.example.com/webhook/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

4. Click **"Save Changes"**

### Testing the Webhook

Test that the webhook is reachable:
```bash
curl -X POST https://your-n8n-instance.com/webhook/slack/expense-action \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Should return: `{"status": "ok"}` or similar

---

## Step 6: Get Channel ID

You need the channel ID where expense review messages will be posted.

### Option A: Via Slack UI

1. Open Slack desktop or web app
2. Go to the channel (e.g., `#expenses-review`)
3. Click the channel name at the top
4. Scroll down in the modal
5. Copy the **Channel ID**
   - Format: `C1234567890` or `C01A2B3C4D5`

![Channel ID Location](https://i.imgur.com/example2.png)

### Option B: Via API Call

```bash
curl -X GET "https://slack.com/api/conversations.list" \
  -H "Authorization: Bearer xoxb-your-bot-token" \
  | jq '.channels[] | select(.name=="expenses-review") | .id'
```

### Add to n8n Environment Variables

In n8n, add:
```env
SLACK_CHANNEL_ID=C1234567890
```

---

## Step 7: Invite Bot to Channel

The bot needs to be a member of the channel to post messages.

### If you added `chat:write.public` scope:
✅ Bot can post without being invited

### If you didn't add that scope:
1. In Slack, go to the channel
2. Type:
   ```
   /invite @Expense Review Bot
   ```
3. Press Enter

---

## Step 8: Test the Integration

### Test 1: Send a Test Message

In n8n, create a simple test workflow:

1. **Manual Trigger** node
2. **Slack → Send Message** node
   - **Authentication:** Use `SLACK_BOT_TOKEN`
   - **Channel:** Use `SLACK_CHANNEL_ID`
   - **Message:** "Test message from n8n!"

Run the workflow. You should see the message in Slack.

### Test 2: Send a Message with Buttons

Update the message to include buttons:

```json
{
  "channel": "{{ $env.SLACK_CHANNEL_ID }}",
  "text": "Expense Review Test",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "This is a test expense review message"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "✅ Approve"
          },
          "style": "primary",
          "value": "test-123",
          "action_id": "approve_expense"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "❌ Reject"
          },
          "style": "danger",
          "value": "test-123",
          "action_id": "reject_expense"
        }
      ]
    }
  ]
}
```

### Test 3: Test Button Clicks

1. In Slack, click one of the buttons
2. Check n8n workflow execution logs
3. You should see an incoming webhook call with the button payload

---

## Step 9: Verify Permissions

Check that the bot has all required permissions:

```bash
curl -X POST "https://slack.com/api/auth.test" \
  -H "Authorization: Bearer xoxb-your-bot-token"
```

Expected response:
```json
{
  "ok": true,
  "url": "https://your-workspace.slack.com/",
  "team": "Your Workspace",
  "user": "expense-review-bot",
  "team_id": "T1234567890",
  "user_id": "U0987654321",
  "bot_id": "B1122334455"
}
```

---

## Troubleshooting

### Issue: "channel_not_found"

**Cause:** Bot doesn't have access to the channel

**Solutions:**
1. Add `chat:write.public` scope (allows posting without joining)
2. Or invite the bot: `/invite @Expense Review Bot`

### Issue: "not_authed" or "invalid_auth"

**Cause:** Bot token is incorrect or missing

**Solution:**
1. Verify `SLACK_BOT_TOKEN` in n8n environment variables
2. Check token format starts with `xoxb-`
3. Re-install the app to workspace and get a new token

### Issue: Buttons don't work (no response in n8n)

**Cause:** Interactivity webhook URL is wrong or not reachable

**Solutions:**
1. Verify the webhook URL in Slack app settings matches n8n
2. Ensure n8n workflow is **activated** (not just saved)
3. Check n8n is publicly accessible (not localhost)
4. Test webhook directly with curl

### Issue: "This app is not installed in your workspace"

**Solution:**
1. Go to "Install App" in Slack app settings
2. Click "Reinstall App"

---

## Security Best Practices

### 1. Verify Slack Request Signatures (Optional but Recommended)

Slack signs all requests with a signature. To verify:

**In n8n Code node:**
```javascript
const crypto = require('crypto');

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const timestamp = $input.first().headers['x-slack-request-timestamp'];
const signature = $input.first().headers['x-slack-signature'];
const body = JSON.stringify($input.first().json.body);

// Prevent replay attacks
const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);
if (timestamp < fiveMinutesAgo) {
  throw new Error('Request timestamp too old');
}

// Verify signature
const sigBasestring = `v0:${timestamp}:${body}`;
const mySignature = 'v0=' + crypto
  .createHmac('sha256', slackSigningSecret)
  .update(sigBasestring)
  .digest('hex');

if (mySignature !== signature) {
  throw new Error('Invalid signature');
}

// Continue processing
return $input.all();
```

Get your signing secret from **Basic Information** → **App Credentials** → **Signing Secret**

### 2. Use Environment Variables

Never hardcode tokens in workflows. Always use:
- `{{ $env.SLACK_BOT_TOKEN }}`
- `{{ $env.SLACK_CHANNEL_ID }}`

### 3. Limit Bot Scopes

Only add scopes that are absolutely necessary.

---

## Next Steps

Now that your Slack app is configured:

1. ✅ Slack app created and installed
2. ✅ Interactivity webhook configured
3. ✅ Environment variables set in n8n
4. → Test the main expense workflow end-to-end
5. → Monitor first few expense reviews
6. → Adjust confidence threshold if needed

---

## Useful Slack API References

- [Slack Block Kit Builder](https://app.slack.com/block-kit-builder) - Design message layouts visually
- [Slack API Methods](https://api.slack.com/methods) - Full API reference
- [Interactive Components](https://api.slack.com/interactivity/handling) - Button handling docs
- [OAuth Scopes](https://api.slack.com/scopes) - All available permission scopes

---

**Support:**
If you encounter issues, check:
1. n8n execution logs
2. Slack API Method Tester: https://api.slack.com/methods/chat.postMessage/test
3. Slack app event logs: Your App → Event Subscriptions → View Recent Events
