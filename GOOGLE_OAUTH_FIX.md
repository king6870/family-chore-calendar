# 🔧 Google OAuth redirect_uri_mismatch - Complete Fix Guide

## Current Error:
```
Error 400: redirect_uri_mismatch
Request details: redirect_uri=https://family-chore-calendar.vercel.app/api/auth/callback/google
```

## 🎯 Step-by-Step Solution

### Step 1: Google Cloud Console Setup
1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Find OAuth Client**: `[YOUR-GOOGLE-CLIENT-ID]`
3. **Click Edit (pencil icon)**

### Step 2: Add EXACT URLs
**Authorized JavaScript origins:**
```
http://localhost:3000
https://family-chore-calendar.vercel.app
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
https://family-chore-calendar.vercel.app/api/auth/callback/google
```

### Step 3: OAuth Consent Screen (CRITICAL!)
1. **Go to**: https://console.cloud.google.com/apis/credentials/consent
2. **Check app status** - if "Testing", do ONE of these:
   - **Option A**: Add `lionvihaan@gmail.com` to "Test users"
   - **Option B**: Click "Publish App" to make it public

### Step 4: Verify Vercel Environment Variables
```
NEXTAUTH_URL=https://family-chore-calendar.vercel.app
GOOGLE_CLIENT_ID=[YOUR-GOOGLE-CLIENT-ID]
GOOGLE_CLIENT_SECRET=[YOUR-GOOGLE-CLIENT-SECRET]
DATABASE_URL=postgresql://postgres:PASSWORD@db.qciwiasvbbsbwqrenwxk.supabase.co:5432/postgres
NEXTAUTH_SECRET=hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc=
```

### Step 5: Wait and Test
1. **Save all changes**
2. **Wait 10-15 minutes** (Google propagation time)
3. **Clear browser cache** or use incognito
4. **Test**: https://family-chore-calendar.vercel.app

## 🚨 If Still Not Working

### Option 1: Create New OAuth Client
1. **Create new OAuth 2.0 Client ID** in Google Cloud Console
2. **Name**: "Family Chore Calendar - Production"
3. **Add URLs immediately**:
   - Origins: `https://family-chore-calendar.vercel.app`
   - Redirect: `https://family-chore-calendar.vercel.app/api/auth/callback/google`
4. **Update Vercel env vars** with new credentials

### Option 2: Use GitHub Auth (Backup)
I've added GitHub authentication as backup. To enable:

1. **Create GitHub OAuth App**:
   - Go to: https://github.com/settings/developers
   - New OAuth App
   - Homepage: `https://family-chore-calendar.vercel.app`
   - Callback: `https://family-chore-calendar.vercel.app/api/auth/callback/github`

2. **Add to Vercel env vars**:
   ```
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

### Option 3: Domain Issues
Sometimes Vercel domains have issues. Try:
1. **Add www version**: `https://www.family-chore-calendar.vercel.app/api/auth/callback/google`
2. **Check actual domain** in Vercel dashboard
3. **Use custom domain** if available

## 🔍 Debug Checklist

- [ ] URLs match exactly (no typos, spaces, trailing slashes)
- [ ] OAuth consent screen configured
- [ ] Test user added (if in testing mode)
- [ ] Environment variables set correctly
- [ ] Waited 10+ minutes after changes
- [ ] Tried incognito/different browser
- [ ] Checked Vercel deployment logs

## 🎯 Most Common Fixes

1. **OAuth Consent Screen** - Add test user or publish app
2. **Trailing Slash** - Remove from NEXTAUTH_URL
3. **Case Sensitivity** - URLs must match exactly
4. **Wait Time** - Google needs time to propagate

## 🆘 Emergency Contact
If nothing works, the GitHub auth backup will let you access your admin panel while we debug Google OAuth.

Your admin panel is ready - just need authentication working! 🚀
