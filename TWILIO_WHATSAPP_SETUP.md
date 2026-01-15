# Twilio WhatsApp Integration Setup Guide

This guide will walk you through setting up Twilio WhatsApp integration for EventOrg SaaS.

## 📋 Prerequisites

1. A Twilio account (sign up at [twilio.com](https://www.twilio.com))
2. A verified phone number (can use Twilio's sandbox for testing)
3. Your application deployed with a public URL (for webhooks)

---

## 🚀 Step-by-Step Setup

### Step 1: Create a Twilio Account

1. Go to [twilio.com](https://www.twilio.com) and sign up
2. Verify your email address
3. Complete the account setup process

### Step 2: Get Your Twilio Credentials

1. Log in to the [Twilio Console](https://console.twilio.com/)
2. Navigate to **Account** → **API Keys & Tokens**
3. You'll find:
   - **Account SID**: Starts with `AC...` (always visible)
   - **Auth Token**: Click "Show" to reveal (keep this secret!)

**⚠️ Important**: Save these credentials securely. You'll need them for your `.env` file.

### Step 3: Set Up WhatsApp Sandbox (For Testing)

Twilio provides a WhatsApp sandbox for testing without approval:

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Or navigate to **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
3. You'll see a sandbox number (format: `+14155238886`)
4. Follow the instructions to join the sandbox:
   - Send the join code to the sandbox number via WhatsApp
   - Example: Send `join <code>` to `+1 415 523 8886`

**Sandbox Limitations:**
- Only works with numbers you've added to the sandbox
- Limited to testing purposes
- Free tier available

### Step 4: Get a Production WhatsApp Number (For Production)

For production use, you need a Twilio WhatsApp-enabled phone number:

#### Option A: Use Twilio's WhatsApp Business API (Recommended)

1. In Twilio Console, go to **Messaging** → **Settings** → **WhatsApp Senders**
2. Click **Request a WhatsApp Sender**
3. Fill out the form:
   - **Business Display Name**: Your business/organization name
   - **Category**: Select appropriate category (e.g., "Events", "Non-profit")
   - **Website**: Your website URL
   - **Business Description**: Brief description of your business
   - **Use Case**: Describe how you'll use WhatsApp (e.g., "Event invitations and reminders")
4. Submit for approval (usually takes 24-48 hours)
5. Once approved, you'll receive a WhatsApp-enabled phone number

#### Option B: Use Your Own Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Search for a number with WhatsApp capability
3. Purchase the number
4. Configure it for WhatsApp messaging

### Step 5: Configure Environment Variables

Add these to your `.env` file:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token-here"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

**Format Notes:**
- `TWILIO_ACCOUNT_SID`: Your Account SID from Step 2
- `TWILIO_AUTH_TOKEN`: Your Auth Token from Step 2
- `TWILIO_WHATSAPP_FROM`: Must be in format `whatsapp:+[country code][number]`
  - Example: `whatsapp:+14155238886` (US)
  - Example: `whatsapp:+919876543210` (India)

### Step 6: Configure Webhook URL (Optional but Recommended)

Webhooks allow you to track message delivery status:

1. In Twilio Console, go to **Messaging** → **Settings** → **WhatsApp Senders**
2. Click on your WhatsApp number
3. Under **Status Callback URL**, enter:
   ```
   https://yourdomain.com/api/webhooks/twilio
   ```
4. Select **HTTP Method**: `POST`
5. Save the configuration

**For Local Development:**
- Use a tool like [ngrok](https://ngrok.com/) to expose your local server
- Set webhook URL to: `https://your-ngrok-url.ngrok.io/api/webhooks/twilio`

### Step 7: Test the Integration

1. Make sure your `.env` file has all Twilio credentials
2. Restart your application
3. In your app, try sending a WhatsApp invitation:
   - Go to an event
   - Select contacts
   - Click "Send WhatsApp Invitations"
4. Check the console logs for any errors
5. Verify the message is received on WhatsApp

---

## 📱 Phone Number Formatting

The app automatically formats phone numbers to E.164 format required by Twilio:

- **10 digits** (e.g., `9876543210`) → Assumes India (+91) → `+919876543210`
- **12 digits starting with 91** → Adds `+` → `+919876543210`
- **Already with +** → Uses as-is
- **Starts with 0** → Removes leading 0, then formats

**Supported Formats:**
- `9876543210` → `+919876543210`
- `919876543210` → `+919876543210`
- `+919876543210` → `+919876543210`
- `09876543210` → `+919876543210`

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** to version control
2. **Rotate Auth Token** periodically in Twilio Console
3. **Use environment-specific credentials** (dev/staging/production)
4. **Enable webhook signature verification** (optional, for extra security)
5. **Monitor usage** in Twilio Console to detect anomalies

---

## 💰 Pricing

Twilio WhatsApp pricing (as of 2024):

- **Conversation-based pricing**:
  - Free tier: Limited messages (check current limits)
  - Paid: ~$0.005 - $0.02 per message (varies by country)
  - Session messages: Lower cost for ongoing conversations

**Cost Optimization Tips:**
1. Use session messages when possible (24-hour window)
2. Batch messages to same recipient
3. Monitor usage in Twilio Console
4. Set up usage alerts

---

## 🐛 Troubleshooting

### Messages Not Sending

1. **Check credentials**:
   ```bash
   # Verify environment variables are set
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_WHATSAPP_FROM
   ```

2. **Check phone number format**:
   - Must be in E.164 format: `+[country code][number]`
   - Example: `+919876543210` (not `919876543210` or `9876543210`)

3. **Check Twilio Console logs**:
   - Go to **Monitor** → **Logs** → **Messaging**
   - Look for error messages

4. **Verify WhatsApp number**:
   - For sandbox: Make sure recipient joined the sandbox
   - For production: Number must be approved and active

### Common Error Codes

- **21211**: Invalid 'To' phone number
  - **Solution**: Check phone number format (must be E.164)

- **21608**: Unsubscribed recipient
  - **Solution**: Recipient must opt-in to receive messages

- **30008**: Unknown destination handset
  - **Solution**: Phone number doesn't exist or is invalid

- **63007**: Invalid WhatsApp number
  - **Solution**: Number not approved for WhatsApp or sandbox not joined

### Webhook Not Receiving Callbacks

1. **Check webhook URL**:
   - Must be publicly accessible (not localhost)
   - Must use HTTPS (not HTTP)
   - Must return 200 OK response

2. **Check Twilio Console**:
   - Go to **Monitor** → **Logs** → **Webhooks**
   - See if requests are being sent

3. **Test webhook endpoint**:
   ```bash
   curl -X POST https://yourdomain.com/api/webhooks/twilio
   ```

---

## 📚 Additional Resources

- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [Twilio WhatsApp API Reference](https://www.twilio.com/docs/whatsapp/api)
- [Twilio Console](https://console.twilio.com/)
- [Twilio Support](https://support.twilio.com/)

---

## ✅ Verification Checklist

Before going to production:

- [ ] Twilio account created and verified
- [ ] Account SID and Auth Token obtained
- [ ] WhatsApp number configured (sandbox or production)
- [ ] Environment variables set in `.env`
- [ ] Webhook URL configured (optional)
- [ ] Test message sent successfully
- [ ] Webhook receiving callbacks (if configured)
- [ ] Error handling tested
- [ ] Usage monitoring set up in Twilio Console

---

## 🎯 Next Steps

1. **Monitor Usage**: Set up alerts in Twilio Console for high usage
2. **Track Delivery**: Use webhooks to track message delivery rates
3. **Optimize Costs**: Review pricing and optimize message sending
4. **Scale**: As you grow, consider Twilio's enterprise features

---

## 📞 Support

If you encounter issues:

1. Check Twilio Console logs
2. Review this guide's troubleshooting section
3. Check [Twilio Support Center](https://support.twilio.com/)
4. Review application logs for detailed error messages

---

**Last Updated**: 2024
**Twilio WhatsApp Integration Version**: 1.0
