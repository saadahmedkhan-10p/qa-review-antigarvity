# Email Notification Setup Guide

The QA Review App now includes automated email notifications for all major events.

## 📧 Email Notifications

### Automated Emails Sent:

1. **User Creation** ✉️
   - Welcome email with login credentials
   - Sent to: New user
   - Triggered: When admin creates a new user

2. **Project Assignment** 📋
   - Project details and team information
   - Sent to: Reviewer and Review Lead
   - Triggered: When admin creates a new project

3. **Review Cycle Invitation** 🔔
   - Review form details and deadlines
   - Sent to: All reviewers with pending reviews
   - Sent to: Review leads (notification)
   - Triggered: When admin initiates a review cycle

4. **Review Scheduled** ✅
   - Confirmation with scheduled date
   - Sent to: Reviewer (confirmation)
   - Sent to: Review lead (notification)
   - Triggered: When reviewer schedules a review

## 🔧 Configuration

### Step 1: Set Up Email Service

The app supports any SMTP email service. Here are popular options:

#### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update `.env.local`**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Option B: SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Option C: Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Option D: AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Restart the Development Server

After updating `.env.local`:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## 🧪 Development Mode

**Important**: If SMTP credentials are not configured, the app will run in **development mode**:

- ✅ No errors - app continues to work normally
- 📝 Email content is logged to the console instead of being sent
- 🔍 You can see what emails would be sent in the terminal

This allows you to develop and test without setting up email immediately.

## 📧 Email Templates

All emails include:
- Professional HTML formatting
- Branded header with "QA Review System"
- Clear call-to-action buttons
- Important deadline reminders
- Direct links to relevant dashboards

### Email Preview

**User Creation Email:**
```
Subject: Welcome to QA Review System

Hello [Name],

Your account has been created successfully.

Email: user@example.com
Role: Reviewer

[Login to Dashboard Button]
```

**Review Invitation Email:**
```
Subject: Review Invitation: [Project] - [Form]

Hello [Name],

A new review cycle has been initiated for your project.

⚠️ Important Deadlines:
• Schedule by: 10th of the month
• Complete by: 20th of the month

[Schedule Review Button]
```

## 🔐 Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use App Passwords** - Don't use your main email password
3. **Rotate credentials** - Change passwords periodically
4. **Use environment-specific configs** - Different credentials for dev/staging/production

## 🚀 Production Deployment

For production, use environment variables in your hosting platform:

### Vercel
```bash
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASS
vercel env add NEXT_PUBLIC_APP_URL
```

### Netlify
Add in: Site settings → Environment variables

### AWS/Docker
Set environment variables in your deployment configuration

## 🐛 Troubleshooting

### Emails not sending?

1. **Check console logs** - Look for email errors in terminal
2. **Verify credentials** - Test SMTP settings
3. **Check spam folder** - Emails might be filtered
4. **Gmail blocks?** - Ensure "Less secure app access" is enabled or use App Password
5. **Port blocked?** - Try port 465 (SSL) instead of 587 (TLS)

### Common Errors

**"Invalid login"**
- Check SMTP_USER and SMTP_PASS are correct
- For Gmail, use App Password, not account password

**"Connection timeout"**
- Check SMTP_HOST and SMTP_PORT
- Verify firewall isn't blocking SMTP ports

**"Self-signed certificate"**
- Add `rejectUnauthorized: false` to transporter config (not recommended for production)

## 📊 Monitoring

In production, consider:
- **Email delivery tracking** - Use SendGrid/Mailgun analytics
- **Error logging** - Monitor failed email attempts
- **Rate limiting** - Prevent email spam
- **Bounce handling** - Track invalid email addresses

## 🎨 Customization

To customize email templates, edit:
```
src/lib/email.ts
```

Each template is a function that returns `{ subject, html }`.

## 📝 Testing Emails

To test without sending real emails:

1. **Use Mailtrap** (https://mailtrap.io)
   - Free testing SMTP server
   - Catches all emails in a virtual inbox

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

2. **Use Ethereal** (https://ethereal.email)
   - Temporary testing accounts
   - View emails in web interface

## ✅ Verification

To verify emails are working:

1. Create a new user from Admin → Users
2. Check console logs for email confirmation
3. If configured, check the recipient's inbox
4. Verify email formatting and links work

---

**Need help?** Check the Nodemailer documentation: https://nodemailer.com/
