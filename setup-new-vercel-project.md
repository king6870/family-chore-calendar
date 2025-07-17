# 🚀 Create New Vercel Project for Fresh Staging

## 🎯 Step 1: Create New Vercel Project

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New..."** → **Project**
3. **Import Git Repository**: Select your `family-chore-calendar` repo
4. **Project Name**: `family-chore-calendar-staging-v2` (or similar)
5. **Framework Preset**: Next.js
6. **Root Directory**: `./` (default)

## ⚙️ Step 2: Configure Build Settings

**Build Command**: `npm run build`
**Output Directory**: `.next` (default)
**Install Command**: `npm install`

## 🌿 Step 3: Configure Git Branch

**Production Branch**: Leave empty (we don't want auto-deploy to production)
**Preview Branches**: Check "staging" branch

This ensures only the staging branch deploys to this project.

## 🗄️ Step 4: Create New Database

**Option A: Vercel Postgres (Recommended)**
1. In your new project dashboard
2. Go to **Storage** tab
3. **Create Database** → **Postgres**
4. **Database Name**: `family-chore-staging-v2`
5. **Region**: Choose closest to your users

**Option B: Prisma Accelerate (High Performance)**
1. Go to: https://console.prisma.io/
2. Create new project: `family-chore-staging-v2`
3. Set up new Accelerate connection
4. Get new API key

## 🔐 Step 5: Environment Variables

Add these to your new Vercel project (Settings → Environment Variables):

```
# Database (choose one option)
DATABASE_URL=[NEW-DATABASE-URL]

# Authentication
NEXTAUTH_URL=[NEW-STAGING-URL]
NEXTAUTH_SECRET=hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc=

# Google OAuth (from Step 1)
GOOGLE_CLIENT_ID=[NEW-OAUTH-CLIENT-ID]
GOOGLE_CLIENT_SECRET=[NEW-OAUTH-CLIENT-SECRET]
```

**Environment**: Set all for **Preview** (not Production)

## 🎯 Step 6: Deploy

1. **Trigger Deployment**: Push to staging branch or manual deploy
2. **Get New URL**: Will be something like `https://family-chore-calendar-staging-v2-[hash].vercel.app`
3. **Update OAuth**: Add the new URL to your Google OAuth client

## 🗑️ Step 7: Clean Up Old Staging

After new staging is working:
1. **Delete old Vercel project** (if desired)
2. **Delete old database** (if separate)
3. **Remove old OAuth client** (if desired)

## ✅ Benefits of Fresh Setup

- **Clean slate**: No configuration conflicts
- **New URLs**: Fresh staging domain
- **Isolated resources**: Completely separate from old setup
- **Better organization**: Clear naming and structure
