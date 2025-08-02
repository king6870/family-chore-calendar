#!/bin/bash

echo "🚀 QUICK FIX FOR FAMILY CREATION & POINTS ISSUES"
echo "================================================"

# Step 1: Quick build test
echo "🔨 Step 1: Testing build..."
./switch-schema.sh production > /dev/null
npm run build > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Build failed - fixing first"
    npm run build
    exit 1
fi

echo "✅ Build successful"

# Step 2: Quick deploy
echo "📦 Step 2: Quick deployment..."
git add .
git commit -m "Quick fix: Add targeted migration for family creation and points issues

- Added /api/fix-final-issues route
- Diagnoses and fixes remaining database column issues
- Targets WeeklyGoal.pointsGoal and ActivityLog.details specifically
- Includes comprehensive error handling and diagnostics"

git push origin main

echo "✅ Deployed to GitHub - Vercel will auto-deploy"

# Step 3: Wait and run fix
echo ""
echo "⏳ Waiting 30 seconds for deployment..."
sleep 30

echo ""
read -p "Enter your Vercel app URL: " APP_URL

if [ -z "$APP_URL" ]; then
    echo "❌ App URL required"
    exit 1
fi

echo ""
echo "🔧 Running targeted fix..."

RESPONSE=$(curl -s -X POST "$APP_URL/api/fix-final-issues")
echo ""
echo "Fix response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ TARGETED FIX SUCCESSFUL!"
    echo ""
    echo "🧪 Test these now:"
    echo "1. Create a family (should work without errors)"
    echo "2. Award points (should work without errors)"
    echo "3. Check that data persists correctly"
    echo ""
    echo "🔗 Test at: $APP_URL"
else
    echo ""
    echo "❌ Fix may have failed - check the response above"
    echo "Try the comprehensive fix instead: ./fix-everything.sh"
fi

# Switch back to local
./switch-schema.sh local > /dev/null
