#!/bin/bash

echo "🚀 PREPARING FOR VERCEL DEPLOYMENT"
echo "=================================="

# Step 1: Switch to production schema
echo "📝 Step 1: Switching to production schema..."
./switch-schema.sh production
if [ $? -ne 0 ]; then
    echo "❌ Failed to switch to production schema"
    exit 1
fi

# Step 2: Generate production Prisma client
echo "⚙️ Step 2: Generating production Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Step 3: Test production build
echo "🔨 Step 3: Testing production build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Production build failed - cannot deploy"
    echo "🔧 Please fix build errors before deploying"
    exit 1
fi

echo "✅ Production build successful!"

# Step 4: Commit all changes
echo "📦 Step 4: Committing all changes..."
git add .

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "Production deployment: $TIMESTAMP

✅ Fixed OAuth state cookie issues
✅ Added database migration routes
✅ Fixed schema mismatches
✅ Updated local development workflow
✅ Ready for production deployment

Migration routes included:
- /api/fix-remaining-columns (adds WeeklyGoal.pointsGoal, ActivityLog.details)

Post-deployment steps:
1. Run migration: curl -X POST https://your-app.vercel.app/api/fix-remaining-columns
2. Test OAuth sign-in
3. Test family creation and points management
4. Remove migration routes for security"

if [ $? -ne 0 ]; then
    echo "⚠️ Nothing new to commit or commit failed"
fi

# Step 5: Push to GitHub
echo "🚀 Step 5: Pushing to GitHub..."
git push origin main
if [ $? -ne 0 ]; then
    echo "❌ Failed to push to GitHub"
    exit 1
fi

echo ""
echo "🎉 SUCCESS! Ready for Vercel deployment"
echo "======================================"
echo ""
echo "📋 NEXT STEPS:"
echo "1. ✅ Code pushed to GitHub - Vercel will auto-deploy"
echo "2. 🔧 After deployment, run database migration:"
echo "   curl -X POST https://your-app.vercel.app/api/fix-remaining-columns"
echo ""
echo "3. 🧪 Test these features:"
echo "   - OAuth Google sign-in"
echo "   - Family creation"
echo "   - Points awarding/management"
echo "   - Activity logs"
echo ""
echo "4. 🧹 After testing, clean up migration routes:"
echo "   ./cleanup-migration-routes.sh"
echo "   git add . && git commit -m 'Remove migration routes' && git push"
echo ""
echo "🔗 Monitor deployment: https://vercel.com/dashboard"
echo "📱 Your app: https://your-app-name.vercel.app"

# Step 6: Switch back to local schema for continued development
echo ""
echo "🔄 Switching back to local schema for development..."
./switch-schema.sh local
npx prisma generate > /dev/null 2>&1

echo ""
echo "✅ DEPLOYMENT PREPARATION COMPLETE!"
echo "🚀 Vercel will automatically deploy from GitHub"
