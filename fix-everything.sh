#!/bin/bash

echo "🚀 COMPREHENSIVE FIX FOR ALL DATABASE ISSUES"
echo "============================================="

# Step 1: Deploy the comprehensive migration
echo "📦 Step 1: Deploying comprehensive database migration..."
./prepare-for-deployment.sh

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "⏳ Waiting 30 seconds for Vercel deployment to complete..."
sleep 30

# Step 2: Get the app URL (you'll need to replace this)
echo "🔗 Step 2: Running post-deployment migration..."
echo "⚠️  IMPORTANT: Replace 'your-app-name' with your actual Vercel app name"
echo ""

read -p "Enter your Vercel app URL (e.g., https://family-chore-calendar.vercel.app): " APP_URL

if [ -z "$APP_URL" ]; then
    echo "❌ App URL is required"
    exit 1
fi

# Step 3: Run the comprehensive migration
echo ""
echo "🔧 Step 3: Running comprehensive database migration..."
./post-deployment.sh "$APP_URL"

echo ""
echo "🎉 COMPREHENSIVE FIX COMPLETE!"
echo "=============================="
echo ""
echo "✅ All database issues should now be resolved:"
echo "  - OAuth state cookie issues"
echo "  - WeeklyGoal.pointsGoal column"
echo "  - ActivityLog.details column"
echo "  - Missing Auction table"
echo "  - Missing AuctionBid table"
echo "  - All other missing columns"
echo ""
echo "🧪 Test your app now:"
echo "  1. Sign in with Google"
echo "  2. Create a family"
echo "  3. Award points"
echo "  4. Delete a family"
echo ""
echo "🧹 After testing, clean up:"
echo "./cleanup-migration-routes.sh"
echo "git add . && git commit -m 'Remove migration routes' && git push"
