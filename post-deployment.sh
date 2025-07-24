#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./post-deployment.sh <your-vercel-app-url>"
    echo "Example: ./post-deployment.sh https://family-chore-calendar.vercel.app"
    exit 1
fi

APP_URL=$1

echo "🔧 POST-DEPLOYMENT COMPREHENSIVE FIX"
echo "===================================="
echo "App URL: $APP_URL"
echo ""

# Step 1: Run comprehensive database migration
echo "📊 Step 1: Running comprehensive database migration..."
echo "This will fix ALL database issues:"
echo "- Add WeeklyGoal.pointsGoal column"
echo "- Add ActivityLog.details column"
echo "- Create missing Auction table"
echo "- Create missing AuctionBid table"
echo "- Add other missing columns"
echo ""

RESPONSE=$(curl -s -X POST "$APP_URL/api/fix-all-database-issues")
echo "Migration response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ COMPREHENSIVE DATABASE MIGRATION SUCCESSFUL!"
    echo ""
else
    echo ""
    echo "❌ DATABASE MIGRATION FAILED!"
    echo "Response: $RESPONSE"
    echo ""
    echo "🔧 Try manual SQL fix in your database console:"
    echo ""
    echo "-- Add missing columns"
    echo "ALTER TABLE \"WeeklyGoal\" ADD COLUMN IF NOT EXISTS \"pointsGoal\" INTEGER;"
    echo "ALTER TABLE \"ActivityLog\" ADD COLUMN IF NOT EXISTS \"details\" TEXT;"
    echo ""
    echo "-- Create Auction table"
    echo "CREATE TABLE IF NOT EXISTS \"Auction\" ("
    echo "  \"id\" TEXT NOT NULL PRIMARY KEY,"
    echo "  \"choreId\" TEXT NOT NULL,"
    echo "  \"familyId\" TEXT NOT NULL,"
    echo "  \"weekStart\" TIMESTAMP(3) NOT NULL,"
    echo "  \"endTime\" TIMESTAMP(3) NOT NULL,"
    echo "  \"status\" TEXT NOT NULL DEFAULT 'active',"
    echo "  \"title\" TEXT,"
    echo "  \"description\" TEXT,"
    echo "  \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"
    echo "  \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"
    echo ");"
    echo ""
    exit 1
fi

echo ""

# Step 2: Test all critical functionality
echo "🧪 Step 2: Testing all fixed functionality..."

echo "Testing auth session..."
SESSION_RESPONSE=$(curl -s "$APP_URL/api/auth/session")
if echo "$SESSION_RESPONSE" | grep -q 'user\|null'; then
    echo "✅ Auth endpoint working"
else
    echo "⚠️ Auth endpoint issue"
fi

echo ""

# Step 3: Provide comprehensive testing checklist
echo "📋 COMPREHENSIVE TESTING CHECKLIST:"
echo "===================================="
echo "🔗 Open: $APP_URL"
echo ""
echo "✅ FIXED ISSUES - Test these now work:"
echo "□ 1. Google OAuth sign-in (no state cookie errors)"
echo "□ 2. Create a family (no WeeklyGoal.pointsGoal errors)"
echo "□ 3. Award points to family member (no ActivityLog.details errors)"
echo "□ 4. Delete a family (no Auction table errors)"
echo "□ 5. View activity logs (details column available)"
echo "□ 6. Check points tracking"
echo "□ 7. Weekly goals functionality"
echo ""
echo "🎯 ALL MAJOR ISSUES SHOULD NOW BE RESOLVED!"
echo ""
echo "If any tests still fail:"
echo "🔧 Check Vercel function logs"
echo "🔧 Verify all environment variables are set"
echo "🔧 Check database connection"
echo ""
echo "🧹 After successful testing, clean up migration routes:"
echo "./cleanup-migration-routes.sh"
echo "git add . && git commit -m 'Remove migration routes' && git push"
echo ""
echo "🎉 Your app should now be fully functional!"
