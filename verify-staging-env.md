# 🔍 Verify Staging Environment Variables

## 📋 Current Expected Values

Your Vercel Preview environment should have these exact values:

### Authentication Configuration
```
NEXTAUTH_URL=https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app
NEXTAUTH_SECRET=hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc=
```

### Google OAuth Configuration
```
GOOGLE_CLIENT_ID=755830677010-5lah4ispmh61q7jl7c9ua9ibsf569pi6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Database Configuration
```
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19RU3U4V08xcDJqTDNTYV9yT3pkRzAiLCJhcGlfa2V5IjoiMDFLMEQxM0dCUU5XUFROMFhKNFY2NzZETkciLCJ0ZW5hbnRfaWQiOiI0NDU4MTk4YjMzZjZkNWJhMTFiODA2OTU5NGM5MzY2MWQyZTViM2JhMmNhNmViODkwZjEwMjE0MGI4NTY1ZGFmIiwiaW50ZXJuYWxfc2VjcmV0IjoiYjhlZmJlNzItMWRhMC00NTA3LWE1ZjMtOWU0MGQ1YmE5YTUxIn0.qqA-bRWXV8SvwO4iF_ofd32LZ2NXgzvcOY_31Hu61Rc
```

## ✅ How to Verify in Vercel

1. **Go to**: https://vercel.com/dashboard
2. **Select**: family-chore-calendar project
3. **Navigate**: Settings → Environment Variables
4. **Check**: Each variable above exists for **Preview** environment
5. **Verify**: Values match exactly (no extra spaces or characters)

## 🔧 Common Issues

### Wrong Environment
- **Issue**: Variables set for Production instead of Preview
- **Solution**: Ensure all variables are set for **Preview** environment

### Incorrect NEXTAUTH_URL
- **Issue**: URL doesn't match current staging deployment
- **Solution**: Use exact URL: `https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app`

### Missing Trailing Characters
- **Issue**: Environment variables truncated or have extra characters
- **Solution**: Copy-paste exact values from this document

## 🚀 After Verification

Once environment variables are correct:
1. **Redeploy** staging environment (or wait for automatic deployment)
2. **Clear browser cache** or use incognito mode
3. **Test sign-in** on staging URL
4. **Should work** without OAuthCreateAccount error

## 📞 Quick Fix Commands

If you need to quickly update environment variables via Vercel CLI:
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables for preview
vercel env add NEXTAUTH_URL preview
vercel env add GOOGLE_CLIENT_ID preview
vercel env add GOOGLE_CLIENT_SECRET preview
vercel env add NEXTAUTH_SECRET preview
vercel env add DATABASE_URL preview
```
