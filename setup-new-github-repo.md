# 🆕 Create New GitHub Repository for Staging

## 🎯 Benefits of New Repository Approach

- **Complete Independence**: Staging completely separate from production
- **No Branch Conflicts**: No Vercel branch restrictions
- **Clean History**: Fresh git history without production commits
- **Easy Management**: Clear separation between environments
- **Full Control**: Configure exactly how you want

## 📋 Step 1: Create New GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository Name**: `family-chore-calendar-staging`
3. **Description**: `Staging environment for Family Chore Calendar`
4. **Visibility**: Private (recommended)
5. **Initialize**: 
   - ✅ Add README
   - ✅ Add .gitignore (Node.js)
   - ❌ Don't add license (copy from main repo if needed)
6. **Click**: "Create repository"

## 📋 Step 2: Clone and Set Up Local Repository

```bash
# Clone the new repository
git clone https://github.com/king6870/family-chore-calendar-staging.git
cd family-chore-calendar-staging

# Copy your current project files (excluding git history)
# From your main project directory:
cp -r /mnt/c/Users/lionv/nextjs-auth-app/* ./
# Or on Windows: xcopy /E /I C:\Users\lionv\nextjs-auth-app\* .\

# Remove the old git history
rm -rf .git

# Initialize new git repository
git init
git branch -M main
git add .
git commit -m "Initial commit: Family Chore Calendar staging environment"

# Connect to your new GitHub repository
git remote add origin https://github.com/king6870/family-chore-calendar-staging.git
git push -u origin main
```

## 📋 Step 3: Create Staging Branch

```bash
# Create and switch to staging branch
git checkout -b staging

# Push staging branch
git push -u origin staging
```

## 🔧 Step 4: Clean Up for Staging

### Remove Production-Specific Files:
```bash
# Remove production environment files
rm -f .env.production
rm -f .env.local

# Remove any production-specific configs
# (Keep .env.example for reference)
```

### Update Package.json (Optional):
```json
{
  "name": "family-chore-calendar-staging",
  "description": "Family Chore Calendar - Staging Environment",
  "repository": {
    "type": "git",
    "url": "https://github.com/king6870/family-chore-calendar-staging.git"
  }
}
```

## 🚀 Step 5: Set Up Vercel with New Repository

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Add New Project**: Import from Git
3. **Select**: Your new `family-chore-calendar-staging` repository
4. **Project Name**: `family-chore-calendar-staging`
5. **Framework**: Next.js
6. **Branch Configuration**: 
   - **Production Branch**: `main` or `staging` (your choice)
   - **Preview Branches**: Enable as needed

## 🗄️ Step 6: Set Up New Database

**Option A: Vercel Postgres**
1. **In Vercel project**: Storage → Create Database → Postgres
2. **Name**: `family-chore-staging`
3. **Copy DATABASE_URL**

**Option B: New Prisma Accelerate**
1. **Create new Prisma project**: `family-chore-staging`
2. **Set up Accelerate connection**
3. **Get new API key**

## 🔐 Step 7: Create New OAuth Client

1. **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Create OAuth Client**: Web application
3. **Name**: `Family Chore Calendar - Staging`
4. **Authorized Origins**: `https://[your-new-staging-url]`
5. **Redirect URIs**: `https://[your-new-staging-url]/api/auth/callback/google`

## ⚙️ Step 8: Environment Variables

**In Vercel project settings**:
```bash
DATABASE_URL=[new-database-url]
NEXTAUTH_URL=[new-staging-url]
NEXTAUTH_SECRET=hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc=
GOOGLE_CLIENT_ID=[new-oauth-client-id]
GOOGLE_CLIENT_SECRET=[new-oauth-client-secret]
```

## 🎯 Step 9: Deploy and Test

```bash
# Make any final changes
git add .
git commit -m "Configure staging environment"
git push origin main  # or staging, depending on your Vercel config

# Test deployment
# Visit your new staging URL
# Test OAuth, database, all features
```

## ✅ Benefits of This Approach

### 🔒 **Complete Separation**:
- **Different Repository**: No conflicts with production
- **Independent History**: Clean git history for staging
- **Separate Issues/PRs**: Can track staging-specific issues
- **Different Collaborators**: Can add staging-specific team members

### 🚀 **Deployment Flexibility**:
- **Any Branch Strategy**: Use main, staging, or develop branch
- **No Vercel Restrictions**: Fresh project with full control
- **Independent Scaling**: Scale staging separately from production
- **Different Configurations**: Staging-specific settings

### 🔧 **Development Workflow**:
```bash
# Work on staging repository
cd family-chore-calendar-staging
git checkout staging  # or main
# ... make changes ...
git commit -m "New staging feature"
git push origin staging  # → Auto-deploys to staging

# When ready for production, merge to main repo
# (Manual process or automated CI/CD)
```

## 🔄 Syncing with Production (Optional)

If you want to sync changes between repositories:

```bash
# Add production repo as remote
git remote add production https://github.com/king6870/family-chore-calendar.git

# Pull changes from production
git fetch production
git merge production/main

# Or cherry-pick specific commits
git cherry-pick [commit-hash]
```

## 🎉 Ready to Go!

This approach gives you:
- ✅ **Complete independence** from production
- ✅ **No Vercel branch restrictions**
- ✅ **Clean staging environment**
- ✅ **Full control** over configuration
- ✅ **Easy management** and deployment
