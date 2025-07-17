# 🔧 Fix Staging OAuth Configuration

## 🚨 Current Issue
**Error**: `OAuthCreateAccount` when trying to sign in on staging
**URL**: https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app
**Cause**: Google OAuth client not configured for current staging URL

## 🔍 Problem Analysis
- **OAuth Client ID**: `755830677010-5lah4ispmh61q7jl7c9ua9ibsf569pi6.apps.googleusercontent.com`
- **Current Staging URL**: `https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app`
- **Issue**: OAuth client configured for old staging URL pattern

## ✅ Solution Steps

### Step 1: Update Google OAuth Client
1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Find OAuth Client**: `755830677010-5lah4ispmh61q7jl7c9ua9ibsf569pi6.apps.googleusercontent.com`
3. **Click Edit** (pencil icon)

### Step 2: Add Authorized JavaScript Origins
Add these URLs to the "Authorized JavaScript origins" section:
```
http://localhost:3000
http://localhost:3001
https://family-chore-calendar-lkzj99l99-duckys-projects-22b2b673.vercel.app
https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app
```

### Step 3: Add Authorized Redirect URIs
Add these URLs to the "Authorized redirect URIs" section:
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
https://family-chore-calendar-lkzj99l99-duckys-projects-22b2b673.vercel.app/api/auth/callback/google
https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app/api/auth/callback/google
```

### Step 4: Save and Wait
1. **Click Save** in Google Cloud Console
2. **Wait 5-10 minutes** for changes to propagate
3. **Clear browser cache** or use incognito mode
4. **Try signing in again** on staging

## 🔍 Verification Steps

### Test OAuth Flow:
1. **Visit**: https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app
2. **Click Sign In**
3. **Select Google Account**
4. **Should redirect successfully** without OAuthCreateAccount error

### Check Environment Variables:
Verify these are set correctly in Vercel Preview environment:
```
NEXTAUTH_URL=https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app
GOOGLE_CLIENT_ID=755830677010-5lah4ispmh61q7jl7c9ua9ibsf569pi6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 🚨 Alternative Solution: Use Production OAuth Client

If the staging OAuth client continues to have issues, you can temporarily use the production OAuth client for staging:

### Update Vercel Environment Variables:
```
GOOGLE_CLIENT_ID=755830677010-nnndvpr4ulmplmbk1264263ag6t96daa.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Add Staging URL to Production OAuth Client:
Add the staging URL to the production OAuth client in Google Cloud Console.

## 🔧 Common OAuth Errors and Solutions

### OAuthCreateAccount
- **Cause**: OAuth client not configured for current domain
- **Solution**: Add domain to authorized origins and redirect URIs

### redirect_uri_mismatch
- **Cause**: Redirect URI not in OAuth client configuration
- **Solution**: Add exact redirect URI to OAuth client

### invalid_client
- **Cause**: Wrong client ID or client secret
- **Solution**: Verify environment variables match OAuth client

## 📞 Support Information

If issues persist:
1. **Check Google Cloud Console** for any error messages
2. **Verify OAuth consent screen** is properly configured
3. **Check browser developer tools** for detailed error messages
4. **Try different Google account** to isolate account-specific issues

## ⏱️ Expected Resolution Time
- **OAuth changes**: 5-10 minutes to propagate
- **Browser cache**: Clear cache or use incognito mode
- **Total time**: Usually resolved within 15 minutes
