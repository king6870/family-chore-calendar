# 🔧 Production Environment Variables

## Required Variables for Production:

### Database (PostgreSQL - Required for Production)
```
DATABASE_URL="postgresql://username:password@host:5432/database_name"
```

### NextAuth Configuration
```
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your-super-secure-secret-key-here"
```

### Google OAuth (Same as Local)
```
GOOGLE_CLIENT_ID="[YOUR-GOOGLE-CLIENT-ID]"
GOOGLE_CLIENT_SECRET="[YOUR-GOOGLE-CLIENT-SECRET]"
```

## ⚠️ Common Production Issues:

### 1. Database URL Format
❌ Wrong: `DATABASE_URL="file:./dev.db"`
✅ Correct: `DATABASE_URL="postgresql://user:pass@host:5432/db"`

### 2. NEXTAUTH_URL
❌ Wrong: `NEXTAUTH_URL="http://localhost:3000"`
✅ Correct: `NEXTAUTH_URL="https://your-app.vercel.app"`

### 3. Google OAuth Redirect URIs
Add to Google Cloud Console:
```
https://your-production-domain.com/api/auth/callback/google
```

## 🔍 How to Check:
1. Go to your hosting platform dashboard
2. Find "Environment Variables" or "Settings"
3. Verify all variables are set correctly
4. Redeploy after changes
