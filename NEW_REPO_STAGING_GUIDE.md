# 🆕 Complete New Repository Staging Setup

## 🎯 Overview

This approach creates a completely separate GitHub repository for staging, giving you:
- **Complete independence** from production
- **No Vercel branch restrictions**
- **Clean git history** for staging
- **Full control** over staging configuration
- **Easy management** and deployment

## 📋 Quick Setup Process

### Step 1: Create New GitHub Repository 📁

1. **Go to**: https://github.com/new
2. **Repository name**: `family-chore-calendar-staging`
3. **Description**: `Staging environment for Family Chore Calendar`
4. **Visibility**: Private (recommended)
5. **Initialize with**: README and .gitignore (Node.js)
6. **Create repository**

### Step 2: Set Up Local Repository 💻

```bash
# Clone your new repository
git clone https://github.com/king6870/family-chore-calendar-staging.git
cd family-chore-calendar-staging

# Copy files from your current project (use the helper script)
# From your main project directory:
./copy-to-new-repo.sh
# Enter path: /path/to/family-chore-calendar-staging

# Or copy manually:
# cp -r /mnt/c/Users/lionv/nextjs-auth-app/* ./family-chore-calendar-staging/
```

### Step 3: Initialize Repository 🔧

```bash
# Navigate to new repository
cd family-chore-calendar-staging

# Add and commit files
git add .
git commit -m "Initial commit: Family Chore Calendar staging environment"

# Push to GitHub
git push origin main

# Create staging branch (optional)
git checkout -b staging
git push -u origin staging
```

### Step 4: Create Vercel Project 🚀

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Add New Project**: Import Git Repository
3. **Select**: Your new `family-chore-calendar-staging` repository
4. **Project Name**: `family-chore-calendar-staging`
5. **Framework**: Next.js (auto-detected)
6. **Deploy**: Click Deploy

### Step 5: Set Up Database 🗄️

**Option A: Vercel Postgres**
```bash
# In your Vercel project
# Go to Storage → Create Database → Postgres
# Name: family-chore-staging
# Copy the DATABASE_URL
```

**Option B: New Prisma Accelerate**
```bash
# Go to https://console.prisma.io/
# Create project: family-chore-staging
# Set up Accelerate connection
# Get API key
```

### Step 6: Create OAuth Client 🔐

1. **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Create Credentials** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: `Family Chore Calendar - Staging`
5. **Authorized JavaScript origins**: `https://[your-staging-url]`
6. **Authorized redirect URIs**: `https://[your-staging-url]/api/auth/callback/google`
7. **Save credentials**

### Step 7: Environment Variables ⚙️

**In Vercel project settings**:
```bash
DATABASE_URL=[your-staging-database-url]
NEXTAUTH_URL=[your-staging-vercel-url]
NEXTAUTH_SECRET=hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc=
GOOGLE_CLIENT_ID=[your-new-oauth-client-id]
GOOGLE_CLIENT_SECRET=[your-new-oauth-client-secret]
```

### Step 8: Set Up Database Schema 🏗️

```bash
# In your staging repository directory
NEW_STAGING_DATABASE_URL="your-database-url" node setup-new-staging-database.js
```

### Step 9: Deploy and Test 🧪

```bash
# Deploy using the helper script
./deploy-new-repo-staging.sh

# Or deploy manually
git add .
git commit -m "Configure staging environment"
git push origin main  # Triggers Vercel deployment
```

## ✅ Verification Checklist

### Test Your Staging Environment:

- [ ] **Access**: Visit your staging URL
- [ ] **Authentication**: Sign in with Google OAuth
- [ ] **Database**: Create test family and user
- [ ] **Features**: Test chores, points, rewards
- [ ] **Admin Panel**: Test admin functionality
- [ ] **Suggestions**: Test suggestion submission
- [ ] **Performance**: Check page load times

## 🔄 Development Workflow

### Working with Staging Repository:

```bash
# Clone staging repository (if not done)
git clone https://github.com/king6870/family-chore-calendar-staging.git
cd family-chore-calendar-staging

# Work on features
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Merge to main/staging branch
git checkout main  # or staging
git merge feature/new-feature
git push origin main  # Triggers deployment
```

### Syncing with Production (Optional):

```bash
# Add production repository as remote
git remote add production https://github.com/king6870/family-chore-calendar.git

# Pull changes from production
git fetch production
git merge production/main

# Or cherry-pick specific commits
git cherry-pick [commit-hash]
```

## 🎯 Benefits of This Approach

### ✅ **Complete Independence**:
- **Separate Repository**: No conflicts with production
- **Independent History**: Clean git history for staging
- **Different Issues/PRs**: Track staging-specific issues
- **Team Collaboration**: Add staging-specific collaborators

### 🚀 **Deployment Flexibility**:
- **No Branch Restrictions**: Use any branch strategy
- **Full Vercel Control**: Fresh project with all options
- **Independent Scaling**: Scale staging separately
- **Custom Configuration**: Staging-specific settings

### 🔧 **Management Benefits**:
- **Clear Separation**: Easy to identify staging vs production
- **Independent Updates**: Update staging without affecting production
- **Testing Safety**: Safe environment for experimental features
- **Easy Cleanup**: Can delete entire staging setup if needed

## 📁 File Structure

```
family-chore-calendar-staging/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility functions
├── prisma/                 # Database schema
├── public/                 # Static assets
├── scripts/                # Build and deployment scripts
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
├── README.md              # Staging-specific documentation
└── setup-new-staging-database.js  # Database setup script
```

## 🛠️ Helper Scripts Available

- **`setup-new-github-repo.md`**: Detailed repository setup guide
- **`copy-to-new-repo.sh`**: Copy files from main project
- **`deploy-new-repo-staging.sh`**: Deploy to staging
- **`setup-new-staging-database.js`**: Initialize database schema

## 🎉 Ready to Start?

1. **Create your GitHub repository** (5 minutes)
2. **Copy your project files** (5 minutes)
3. **Set up Vercel project** (10 minutes)
4. **Configure database and OAuth** (15 minutes)
5. **Deploy and test** (10 minutes)

**Total setup time**: ~45 minutes for a completely independent staging environment!

This approach gives you the cleanest, most flexible staging setup possible. 🚀
