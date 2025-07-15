# 🔧 OAuth Consent Screen Fix

## Potential Issue: OAuth Consent Screen Configuration

### Step 1: Check OAuth Consent Screen
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Check your OAuth consent screen settings

### Step 2: Common Issues:

**App Status:**
- If app is in "Testing" mode, add your email to test users
- Consider changing to "In production" if ready

**Required Fields:**
- App name must be filled
- User support email must be set
- Developer contact email must be set

### Step 3: Quick Fix - Add Test User
1. Go to OAuth consent screen
2. Scroll to "Test users" section
3. Add your email: lionvihaan@gmail.com
4. Save changes

### Step 4: Alternative - Publish App
1. Go to OAuth consent screen
2. Click "Publish App"
3. This removes testing restrictions

## If Still Not Working:

### Create New OAuth Client:
1. Go to Google Cloud Console
2. Create NEW OAuth 2.0 Client ID
3. Set it up fresh with correct URLs
4. Update your environment variables

### URLs for New Client:
**Authorized JavaScript origins:**
- http://localhost:3000
- https://family-chore-calendar.vercel.app

**Authorized redirect URIs:**
- http://localhost:3000/api/auth/callback/google
- https://family-chore-calendar.vercel.app/api/auth/callback/google
