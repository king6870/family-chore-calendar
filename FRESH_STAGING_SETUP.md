# 🆕 Complete Fresh Staging Environment Setup

## 🎯 Overview

This guide will help you create a completely new staging environment from scratch:
- **New Google OAuth Client** (separate from production)
- **New Vercel Project** (dedicated staging project)
- **New Database** (fresh schema with no old data)
- **Same Git Branch** (keeping your existing staging branch)

## 🗑️ What We're Replacing

**Old Staging Environment:**
- URL: `https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app`
- OAuth Client: `755830677010-5lah4ispmh61q7jl7c9ua9ibsf569pi6.apps.googleusercontent.com`
- Database: Prisma Accelerate with potential configuration issues

**New Staging Environment:**
- URL: Will be generated (something like `https://family-chore-calendar-staging-v2-[hash].vercel.app`)
- OAuth Client: Brand new client with fresh credentials
- Database: Clean database with proper schema

## 📋 Step-by-Step Setup

### Step 1: Create New Google OAuth Client 🔐

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click**: "Create Credentials" → "OAuth client ID"
3. **Application type**: Web application
4. **Name**: `Family Chore Calendar - New Staging`
5. **Authorized JavaScript origins**: (leave empty for now)
6. **Authorized redirect URIs**: (leave empty for now)
7. **Click**: "Create"
8. **Copy**: Client ID and Client Secret (save these!)

### Step 2: Create Separate Vercel Project 🚀

**Important**: Since your existing `family-chore-calendar` project is restricted to production branch, we'll create a completely separate Vercel project for staging.

1. **Go to**: https://vercel.com/dashboard
2. **Click**: "Add New..." → "Project"
3. **Import**: Your `family-chore-calendar` GitHub repo (same repo, different project)
4. **Project Name**: `family-chore-calendar-staging`
5. **Framework**: Next.js (auto-detected)
6. **Root Directory**: `./` (default)
7. **Deploy**: Click "Deploy" (initial deployment)

**Project Structure After Setup:**
- **Production Project**: `family-chore-calendar` → deploys `main` branch
- **Staging Project**: `family-chore-calendar-staging` → deploys `staging` branch

### Step 3: Configure Git Branch Deployment 🌿

**In your NEW staging project** (not the production one):
1. **Go to Settings** → **Git**
2. **Production Branch**: Set to `staging` (this makes staging branch the "production" branch for this project)
3. **Preview Branches**: Disable or leave empty
4. **Save**: This ensures only staging branch deploys to this project

### Step 4: Create New Database 🗄️

**Option A: Vercel Postgres (Recommended)**
1. **In your Vercel project**: Go to Storage tab
2. **Create Database**: Postgres
3. **Name**: `family-chore-staging-v2`
4. **Region**: Choose closest to you
5. **Copy**: The DATABASE_URL from the .env.local tab

**Option B: New Prisma Accelerate**
1. **Go to**: https://console.prisma.io/
2. **Create Project**: `family-chore-staging-v2`
3. **Set up Accelerate**: Follow their setup guide
4. **Copy**: The Accelerate connection string

### Step 5: Set Environment Variables ⚙️

**In your new Vercel project** (Settings → Environment Variables):

```bash
# Database
DATABASE_URL=[YOUR-NEW-DATABASE-URL]

# Authentication (get from Vercel project URL)
NEXTAUTH_URL=[YOUR-NEW-STAGING-URL]
NEXTAUTH_SECRET=hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc=

# Google OAuth (from Step 1)
GOOGLE_CLIENT_ID=[YOUR-NEW-CLIENT-ID]
GOOGLE_CLIENT_SECRET=[YOUR-NEW-CLIENT-SECRET]
```

**Important**: Set environment for **Production** (since the staging branch is the "production" branch for your staging project)

### Step 6: Update OAuth Client URLs 🔗

1. **Get your new staging URL** from Vercel (after first deployment)
2. **Go back to Google Cloud Console**: Find your new OAuth client
3. **Edit** the OAuth client
4. **Add Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:3001
   https://[YOUR-NEW-STAGING-URL]
   ```
5. **Add Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3001/api/auth/callback/google
   https://[YOUR-NEW-STAGING-URL]/api/auth/callback/google
   ```
6. **Save**

### Step 7: Set Up Database Schema 🏗️

```bash
# Set your new database URL
export NEW_STAGING_DATABASE_URL="[YOUR-NEW-DATABASE-URL]"

# Run database setup
node setup-new-staging-database.js
```

This will:
- Create complete database schema
- Add all necessary tables
- Create test data for verification

### Step 8: Deploy to New Staging 🚀

```bash
# Deploy to your new staging environment
./deploy-new-staging.sh
```

This will:
- Push your staging branch to GitHub
- Trigger deployment to your new Vercel project
- Give you the new staging URL

## ✅ Verification Steps

### Test Your New Staging Environment:

1. **Visit**: Your new staging URL
2. **Sign In**: Test Google OAuth authentication
3. **Create Family**: Use the test family or create new one
4. **Test Features**:
   - Create chores and assign them
   - Complete chores and earn points
   - Test rewards system (should work in staging)
   - Submit suggestions
   - Test admin panel features

### Verify Database:

1. **Check Tables**: All tables should exist with proper schema
2. **Test Data**: Should see test family, user, chore, and suggestion
3. **Functionality**: All CRUD operations should work

## 🗑️ Clean Up Old Staging (Optional)

Once your new staging is working perfectly:

### Delete Old Resources:

1. **Old Vercel Project**: Delete from Vercel dashboard
2. **Old Database**: Delete old Prisma Accelerate project or Vercel Postgres
3. **Old OAuth Client**: Delete from Google Cloud Console
4. **Old Environment Variables**: Clean up any old references

### Keep What Works:

- **Git Branch**: Keep using the same `staging` branch
- **Codebase**: No changes needed to your application code
- **Production**: Leave production environment untouched

## 🎉 Benefits of Fresh Setup

### ✅ Advantages:

- **Clean Slate**: No configuration conflicts or legacy issues
- **Proper URLs**: Fresh staging domain with correct OAuth setup
- **Clean Database**: Proper schema without migration issues
- **Better Organization**: Clear separation between environments
- **Full Functionality**: All features including rewards system
- **Easy Testing**: Isolated environment for safe feature testing

### 🔄 Development Workflow:

```bash
# Work on new features
git checkout staging
# ... make changes ...
git commit -m "New feature"
git push origin staging  # → Deploys to new staging

# Test on new staging environment
# Once satisfied, promote to production
git checkout main
git merge staging
./deploy-production.sh  # → Secure production deployment
```

## 📞 Support

If you encounter any issues:

1. **Check Setup Guides**:
   - `setup-new-staging-oauth.md`
   - `setup-new-vercel-project.md`

2. **Verify Environment Variables**: Make sure all are set correctly in Vercel

3. **Check OAuth Configuration**: Ensure URLs match exactly

4. **Database Connection**: Verify DATABASE_URL is correct and accessible

5. **Deployment Logs**: Check Vercel deployment logs for errors

## 🎯 Next Steps

After setup is complete:

1. **Test Thoroughly**: Verify all features work in new staging
2. **Update Documentation**: Update any internal docs with new URLs
3. **Team Communication**: Inform team members of new staging URL
4. **Monitor Performance**: Check if new setup performs better
5. **Plan Migration**: Decide when to clean up old resources

Your fresh staging environment is now ready for safe feature testing! 🚀
