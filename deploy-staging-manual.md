# 🚀 Manual Staging Deployment (Alternative Approach)

## 🎯 When to Use This Method

If you can't find branch configuration settings in Vercel, you can deploy manually. This gives you full control over which branch deploys where.

## 📋 Method 1: Vercel Dashboard Manual Deploy

### Step 1: Go to Your Staging Project
1. **Open**: Your `family-chore-calendar-staging` project in Vercel
2. **Click**: "Deployments" tab
3. **Look for**: "Deploy" or "New Deployment" button

### Step 2: Manual Deployment
1. **Click**: "Deploy" or "Create Deployment"
2. **Select Branch**: Choose `staging` from dropdown
3. **Deploy**: Click deploy button
4. **Wait**: For deployment to complete

### Step 3: Set as Production
1. **After deployment completes**
2. **Click**: "Promote to Production" (if available)
3. **Or**: The deployment should automatically be live

## 📋 Method 2: Vercel CLI Deployment

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Staging Branch
```bash
# Make sure you're on staging branch
git checkout staging

# Deploy to your staging project
vercel --prod

# Follow prompts to select your staging project
```

## 📋 Method 3: GitHub Integration

### Step 1: Push to Staging Branch
```bash
git checkout staging
git push origin staging
```

### Step 2: Check Vercel Dashboard
1. **Go to your staging project**
2. **Check if deployment triggered automatically**
3. **If not, use manual deployment method above**

## 🔧 Environment Variables Setup

### For Manual Deployments:
1. **Go to Settings** → **Environment Variables**
2. **Add all required variables**:
   ```
   DATABASE_URL=[your-staging-database-url]
   NEXTAUTH_URL=[your-staging-url]
   GOOGLE_CLIENT_ID=[your-new-oauth-client-id]
   GOOGLE_CLIENT_SECRET=[your-new-oauth-secret]
   NEXTAUTH_SECRET=hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc=
   ```
3. **Set Environment**: Production (since this is your staging project's production)

## ✅ Verification Steps

### After Deployment:
1. **Get Staging URL**: From Vercel dashboard
2. **Test Access**: Visit the URL
3. **Check Functionality**: 
   - Sign in with Google OAuth
   - Create test family
   - Test basic features
4. **Update OAuth**: Add staging URL to Google OAuth client

## 🔄 Ongoing Deployment Workflow

### For Future Updates:
```bash
# Make changes on staging branch
git checkout staging
# ... make changes ...
git add .
git commit -m "New feature"
git push origin staging

# Then either:
# Option A: Auto-deploy (if configured)
# Option B: Manual deploy from Vercel dashboard
# Option C: Use Vercel CLI: vercel --prod
```

## 💡 Benefits of Manual Deployment

### ✅ Advantages:
- **Full Control**: You decide when to deploy
- **No Branch Configuration**: Bypasses Vercel branch settings
- **Flexible**: Can deploy any branch to any project
- **Testing**: Can test deployments before making them live

### 🎯 Perfect for:
- **Initial Setup**: Getting staging environment working
- **Testing**: Trying different configurations
- **Troubleshooting**: When automatic deployments aren't working
- **Control**: When you want manual deployment control

## 🚀 Ready to Deploy?

1. **Create your staging project** in Vercel (if not done)
2. **Set up environment variables**
3. **Use one of the manual deployment methods above**
4. **Test your staging environment**
5. **Update OAuth client with new staging URL**

This approach gives you a working staging environment without needing to find the branch configuration settings!
