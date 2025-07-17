# 🚀 Secure Deployment Guide

## 🔐 Production Protection System

**Production is now PROTECTED** - it will only update when you explicitly run the production deploy script with your personal access token.

## 📋 Deployment Options

### 🏠 Local Development
```bash
# Start local development server
npm run dev
# OR use the workflow helper
./dev-workflow.sh
```
- **URL**: http://localhost:3001
- **Database**: SQLite (local file)
- **Features**: All features including rewards system
- **Safe**: No impact on production users

### 🧪 Staging Deployment (Safe Testing)
```bash
# Deploy to staging for testing
./deploy-staging.sh
```
- **URL**: https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app
- **Database**: Staging PostgreSQL database
- **Features**: All features including rewards system
- **Safe**: Separate from production, no real users affected
- **Auto-Deploy**: Pushes to `staging` branch trigger automatic deployment

### 🚀 Production Deployment (Live Users)
```bash
# Deploy to production (REQUIRES CONFIRMATION)
./deploy-production.sh
```
- **URL**: https://family-chore-calendar.vercel.app
- **Database**: Production PostgreSQL database
- **Features**: All features except rewards (production-restricted)
- **CRITICAL**: Affects real users
- **Manual Only**: Requires explicit script execution with personal access token

## 🔑 GitHub Personal Access Token Setup

1. **Create Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: "Family Chore Calendar Deployment"
   - Scopes: Select `repo` (full control of private repositories)
   - Click "Generate token"
   - **COPY THE TOKEN** (won't be shown again)

2. **Use Token**:
   - Run deployment script
   - Enter your GitHub username
   - Paste the token when prompted
   - Token is used temporarily and not stored

## 🛡️ Security Features

### Production Protection:
- ✅ **Manual Deployment Only**: Production never updates automatically
- ✅ **Double Confirmation**: Requires typing "DEPLOY" and "YES" to confirm
- ✅ **Token Authentication**: Requires valid GitHub personal access token
- ✅ **Branch Validation**: Ensures deployment from correct branch
- ✅ **Change Review**: Shows what will be deployed before confirmation
- ✅ **Secure Cleanup**: Removes token from git config after use

### Development Safety:
- ✅ **Staging Environment**: Safe testing environment for new features
- ✅ **Local Development**: Complete local environment with SQLite
- ✅ **Branch Isolation**: Separate branches for different environments
- ✅ **Feature Restrictions**: Rewards system only in dev/staging

## 🔄 Recommended Workflow

### For New Features:
```bash
# 1. Develop locally
npm run dev
# ... make changes ...

# 2. Test on staging
git add .
git commit -m "New feature: description"
./deploy-staging.sh

# 3. Test staging thoroughly
# Visit staging URL and verify everything works

# 4. Deploy to production (when ready)
git checkout main
git merge staging
./deploy-production.sh
```

### For Quick Fixes:
```bash
# 1. Make fix locally
# ... fix issue ...

# 2. Test locally
npm run dev

# 3. Deploy directly to production (if urgent)
git add .
git commit -m "Fix: description"
./deploy-production.sh
```

## 🎯 Environment Comparison

| Feature | Local | Staging | Production |
|---------|-------|---------|------------|
| Database | SQLite | PostgreSQL | PostgreSQL |
| URL | localhost:3001 | staging-*.vercel.app | family-chore-calendar.vercel.app |
| Users | You only | Test users | Real families |
| Rewards System | ✅ Available | ✅ Available | ❌ Disabled |
| Auto-Deploy | Manual start | Auto on push | Manual only |
| Safety | 100% Safe | Safe testing | LIVE USERS |

## 🚨 Important Notes

### Before Production Deployment:
- ✅ Test thoroughly on staging
- ✅ Verify all features work correctly
- ✅ Check for any breaking changes
- ✅ Ensure database compatibility
- ✅ Review commit messages and changes

### After Production Deployment:
- ✅ Clear browser cache (Ctrl+F5)
- ✅ Test critical user flows
- ✅ Monitor for any errors
- ✅ Check Vercel deployment logs
- ✅ Verify OAuth still works

### Emergency Rollback:
If production deployment causes issues:
1. Check Vercel dashboard for previous deployment
2. Click "Rollback" on last working deployment
3. Or fix issue and redeploy quickly

## 📞 Troubleshooting

### Common Issues:

**"Authentication failed" during deployment:**
- Check GitHub token is valid and has `repo` permissions
- Ensure token hasn't expired
- Try generating a new token

**"Permission denied" error:**
- Make sure scripts are executable: `chmod +x *.sh`
- Check you're in the correct directory

**Staging deployment not updating:**
- Verify you're on staging branch: `git branch --show-current`
- Check Vercel dashboard for deployment status
- Wait 2-3 minutes for deployment to complete

**Production not updating after deployment:**
- Clear browser cache (Ctrl+F5)
- Check Vercel dashboard for deployment status
- Verify deployment was successful

## 🎉 Benefits of This System

- **🔒 Production Safety**: No accidental deployments to live users
- **🧪 Safe Testing**: Staging environment for thorough testing
- **🔑 Secure Access**: Token-based authentication for deployments
- **📋 Clear Process**: Step-by-step deployment with confirmations
- **🛡️ Error Prevention**: Multiple validation checks before deployment
- **📊 Visibility**: Clear status and monitoring of all environments
