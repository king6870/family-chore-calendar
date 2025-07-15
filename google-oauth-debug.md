# 🔍 Google OAuth Debug Checklist

## Current Error: redirect_uri_mismatch
**Expected URI:** https://family-chore-calendar.vercel.app/api/auth/callback/google

## ✅ Verification Checklist:

### 1. Google Cloud Console Settings
Go to: https://console.cloud.google.com/apis/credentials

**Find OAuth Client:** 755830677010-brh4erqde1u1cg5kovjbj0v4aoiq900p.apps.googleusercontent.com

**Authorized JavaScript origins should have:**
- [ ] http://localhost:3000
- [ ] https://family-chore-calendar.vercel.app

**Authorized redirect URIs should have:**
- [ ] http://localhost:3000/api/auth/callback/google
- [ ] https://family-chore-calendar.vercel.app/api/auth/callback/google

### 2. Common Issues to Check:

**Exact URL Matching:**
- [ ] No trailing slashes (/)
- [ ] Exact domain spelling
- [ ] HTTPS (not HTTP) for production
- [ ] No extra spaces or characters

**Google Console Issues:**
- [ ] Clicked "Save" button
- [ ] Waited 10+ minutes after saving
- [ ] Using correct Google account
- [ ] OAuth consent screen is configured

**Vercel Environment Variables:**
- [ ] NEXTAUTH_URL=https://family-chore-calendar.vercel.app (no trailing slash)
- [ ] GOOGLE_CLIENT_ID matches console
- [ ] GOOGLE_CLIENT_SECRET matches console

### 3. Alternative Solutions:

**Try These URLs Too:**
Add these additional redirect URIs:
- https://family-chore-calendar.vercel.app/api/auth/callback/google/
- https://www.family-chore-calendar.vercel.app/api/auth/callback/google

**OAuth Consent Screen:**
- Check if app is in "Testing" mode
- Add your email to test users
- Consider publishing the app

### 4. Debug Steps:
1. Clear browser cache completely
2. Try incognito/private mode
3. Try different browser
4. Check browser console for errors
5. Wait longer (Google can take up to 24 hours sometimes)
