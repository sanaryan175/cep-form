# Gmail Setup for Nodemailer

## Step 1: Enable 2-Step Verification
1. Go to Gmail: https://myaccount.google.com/
2. Click on "Security"
3. Enable "2-Step Verification"

## Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" for the app
3. Select "Other (Custom name)" and enter "Financial Survey"
4. Click "Generate"
5. Copy the 16-character password (without spaces)

## Step 3: Update .env File
```
# In server/.env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=the-16-character-app-password
```

## Step 4: Test Email
```bash
cd server
node test-email.js
```

## Alternative: Use Different Email Service

### Outlook/Hotmail:
```
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-app-password
```

### Custom SMTP:
```javascript
// In emailService.js
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Common Issues:
- "Invalid login" → Use App Password, not regular password
- "Less secure apps" → Enable 2-Step Verification + App Password
- "Connection timeout" → Check firewall/internet connection
