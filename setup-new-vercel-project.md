# 🚀 Create Separate Vercel Project for Staging

## 🎯 Why Separate Projects?

Since your existing `family-chore-calendar` project is restricted to production branch only, we'll create a completely separate Vercel project for staging. This provides better isolation anyway!

**Project Structure:**
- **Production Project**: `family-chore-calendar` → deploys `main` branch
- **Staging Project**: `family-chore-calendar-staging` → deploys `staging` branch

## 🆕 Step 1: Create New Vercel Project

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New..."** → **Project**
3. **Import Git Repository**: Select your `family-chore-calendar` repo (same repo, different project)
4. **Project Name**: `family-chore-calendar-staging`
5. **Framework Preset**: Next.js (auto-detected)
6. **Root Directory**: `./` (default)

## ⚙️ Step 2: Configure Build Settings

**Build Command**: `npm run build`
**Output Directory**: `.next` (default)
**Install Command**: `npm install`
**Node.js Version**: 18.x (recommended)

## 🌿 Step 3: Configure Git Branch (IMPORTANT!)

**In your NEW staging project settings:**
1. **Go to Settings** → **Git**
2. **Production Branch**: Set to `staging` (not main!)
3. **Preview Branches**: Disable or leave empty
4. **Save Changes**

This ensures:
- Your staging project only deploys the `staging` branch
- No conflicts with your production project
- Clean separation between environments

## 🗄️ Step 4: Create Database for Staging

**Option A: Vercel Postgres (Recommended)**
1. **In your staging project**: Go to Storage tab
2. **Create Database** → **Postgres**
3. **Database Name**: `family-chore-staging`
4. **Region**: Choose closest to your users
5. **Copy the DATABASE_URL** from the .env.local tab

**Option B: New Prisma Accelerate**
1. **Go to**: https://console.prisma.io/
2. **Create New Project**: `family-chore-staging`
3. **Set up Accelerate**: Follow setup guide
4. **Copy the connection string**

## 🔐 Step 5: Environment Variables

**Add these to your staging project** (Settings → Environment Variables):

```bash
# Database (from Step 4)
DATABASE_URL=[YOUR-STAGING-DATABASE-URL]

# Authentication (will be your staging URL)
NEXTAUTH_URL=[WILL-BE-GENERATED-AFTER-FIRST-DEPLOY]
NEXTAUTH_SECRET=hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc=

# Google OAuth (create new client)
GOOGLE_CLIENT_ID=[NEW-STAGING-OAUTH-CLIENT-ID]
GOOGLE_CLIENT_SECRET=[NEW-STAGING-OAUTH-CLIENT-SECRET]
```

**Environment**: Set all for **Production** (since staging branch is "production" for this project)

## 🚀 Step 6: First Deployment

1. **Trigger Deployment**: 
   - Push to staging branch, or
   - Manual deploy from Vercel dashboard
2. **Get Staging URL**: Will be `https://family-chore-calendar-staging-[hash].vercel.app`
3. **Update NEXTAUTH_URL**: Add the generated URL to environment variables
4. **Update OAuth Client**: Add the new URL to your Google OAuth configuration

## ✅ Benefits of Separate Projects

### 🔒 **Better Isolation:**
- **Production**: Completely separate from staging
- **Staging**: No risk of affecting production users
- **Resources**: Separate databases, environment variables, domains

### 🎯 **Cleaner Management:**
- **Clear Separation**: Easy to identify which project is which
- **Independent Scaling**: Scale staging and production independently
- **Different Configurations**: Staging can have different settings

### 🚀 **Deployment Workflow:**
```bash
# Deploy to staging
git checkout staging
git push origin staging  # → Deploys to staging project

# Deploy to production (when ready)
git checkout main
git merge staging
git push origin main     # → Deploys to production project
```

## 🔧 Project Configuration Summary

**Production Project (`family-chore-calendar`):**
- **Branch**: `main`
- **URL**: `https://family-chore-calendar.vercel.app`
- **Database**: Production database
- **Users**: Real users

**Staging Project (`family-chore-calendar-staging`):**
- **Branch**: `staging`
- **URL**: `https://family-chore-calendar-staging-[hash].vercel.app`
- **Database**: Staging database
- **Users**: Testing only

## 🎯 Next Steps

1. **Create OAuth Client**: Follow `setup-new-staging-oauth.md`
2. **Set Up Database**: Run `setup-new-staging-database.js`
3. **Deploy**: Use `./deploy-new-staging.sh`
4. **Test**: Verify everything works on staging
5. **Develop**: Use staging for safe feature testing

This setup gives you the best of both worlds - complete isolation and easy management!
