# 🆕 Create New Google OAuth Client for Fresh Staging

## 🎯 Step 1: Create Brand New OAuth Client

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Click "Create Credentials"** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: `Family Chore Calendar - New Staging`

## 🔗 Step 2: Configure OAuth URLs

**Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:3001
https://[NEW-STAGING-URL-WILL-BE-GENERATED]
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
https://[NEW-STAGING-URL-WILL-BE-GENERATED]/api/auth/callback/google
```

## 📋 Step 3: Save Credentials

After creating, you'll get:
- **Client ID**: `[NEW-CLIENT-ID]`
- **Client Secret**: `[NEW-CLIENT-SECRET]`

**⚠️ Important**: Copy these immediately - we'll need them for the new Vercel project!

## 🗑️ Step 4: Delete Old Staging OAuth Client (Optional)

If you want to clean up:
1. Find old staging client: `755830677010-5lah4ispmh61q7jl7c9ua9ibsf569pi6.apps.googleusercontent.com`
2. Click the trash icon to delete it
3. Confirm deletion

## ✅ Ready for Next Steps

Once you have the new OAuth credentials, we'll:
1. Create new Vercel project
2. Set up new database
3. Configure environment variables
4. Deploy fresh staging environment
