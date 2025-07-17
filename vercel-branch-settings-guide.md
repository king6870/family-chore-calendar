# 🔍 Finding Vercel Branch Settings

## 🎯 Where to Find Branch Configuration

### Method 1: Git Settings Tab
1. **Go to your Vercel project dashboard**
2. **Click "Settings"** (top navigation)
3. **Look for "Git" in the left sidebar**
4. **You should see:**
   ```
   Git Repository
   ├── Repository: king6870/family-chore-calendar
   ├── Production Branch: [dropdown or text field]
   └── Preview Branches: [configuration options]
   ```

### Method 2: General Settings
1. **Go to Settings** → **General**
2. **Scroll down to find "Git Repository" section**
3. **Look for branch configuration options**

### Method 3: Project Overview
1. **On your project's main dashboard**
2. **Look for "Git Repository" card/section**
3. **Click "Configure" or "Edit" if available**

## 🔧 What to Configure

### For Your Staging Project:
```
Production Branch: staging
Preview Branches: (disable or leave empty)
```

### For Your Production Project:
```
Production Branch: main
Preview Branches: (disable or leave empty)
```

## 🚨 If You Don't See Branch Options

### Possible Reasons:
1. **New Vercel Interface**: Settings might be in a different location
2. **Project Type**: Some project types have different options
3. **Permissions**: You might need admin access to the project

### Solutions:
1. **Check Project Type**: Make sure it's a Next.js project
2. **Refresh Page**: Sometimes settings take a moment to load
3. **Try Different Browser**: Clear cache or try incognito mode
4. **Contact Support**: Vercel support can help locate settings

## 🔄 Alternative Approach

If you can't find branch settings, you can:

### Option 1: Use Environment Variables
Set different environment variables for different deployments:
- **Staging deployments**: Use Preview environment variables
- **Production deployments**: Use Production environment variables

### Option 2: Manual Deployment
- **Deploy staging manually** from Vercel dashboard
- **Select staging branch** during manual deployment
- **This bypasses automatic branch configuration**

### Option 3: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy staging branch manually
vercel --prod --branch staging
```

## 📞 Need Help?

If you still can't find the branch settings:
1. **Take a screenshot** of your Vercel project settings page
2. **Check Vercel documentation**: https://vercel.com/docs/concepts/git
3. **Contact Vercel support**: They can help locate the settings

## ✅ Verification

Once you find and configure the settings:
1. **Push to staging branch**
2. **Check if deployment triggers**
3. **Verify correct branch is being deployed**
4. **Test the deployed application**
