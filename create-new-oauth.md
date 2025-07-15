# 🆕 Create New Google OAuth Client (Emergency Fix)

## If Current OAuth Client Won't Work, Create New One:

### Step 1: Create New OAuth Client
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "Family Chore Calendar - New"

### Step 2: Configure URLs
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

### Step 3: Update Environment Variables
Replace in Vercel with new credentials:
```
GOOGLE_CLIENT_ID=NEW_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=NEW_CLIENT_SECRET_HERE
```

### Step 4: Test Immediately
New OAuth clients usually work right away without waiting periods.

## Alternative: Use Different Auth Provider

### Add GitHub OAuth as Backup:
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create new OAuth app
3. Homepage URL: https://family-chore-calendar.vercel.app
4. Callback URL: https://family-chore-calendar.vercel.app/api/auth/callback/github

### Update auth.ts:
```typescript
import GitHubProvider from "next-auth/providers/github"

providers: [
  GoogleProvider({...}),
  GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }),
]
```
