#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./post-deployment.sh <your-vercel-app-url>"
    echo "Example: ./post-deployment.sh https://family-chore-calendar.vercel.app"
    exit 1
fi

APP_URL=$1

echo "🔧 POST-DEPLOYMENT SETUP"
echo "======================="
echo "App URL: $APP_URL"
echo ""

# Step 1: Run database migration
echo "📊 Step 1: Running database migration..."
echo "Adding missing columns: WeeklyGoal.pointsGoal, ActivityLog.details"

RESPONSE=$(curl -s -X POST "$APP_URL/api/fix-remaining-columns")
echo "Migration response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Database migration successful!"
else
    echo "❌ Database migration failed!"
    echo "Response: $RESPONSE"
    echo ""
    echo "🔧 Manual fix: Check Vercel logs and database"
    exit 1
fi

echo ""

# Step 2: Test critical endpoints
echo "🧪 Step 2: Testing critical endpoints..."

echo "Testing auth session..."
SESSION_RESPONSE=$(curl -s "$APP_URL/api/auth/session")
if echo "$SESSION_RESPONSE" | grep -q 'user\|null'; then
    echo "✅ Auth endpoint working"
else
    echo "⚠️ Auth endpoint issue: $SESSION_RESPONSE"
fi

echo "Testing user endpoint..."
USER_RESPONSE=$(curl -s "$APP_URL/api/user")
if [ $? -eq 0 ]; then
    echo "✅ User endpoint accessible"
else
    echo "⚠️ User endpoint issue"
fi

echo ""

# Step 3: Provide testing checklist
echo "📋 MANUAL TESTING CHECKLIST:"
echo "============================"
echo "🔗 Open: $APP_URL"
echo ""
echo "Test these features:"
echo "□ 1. Google OAuth sign-in"
echo "□ 2. Create a family"
echo "□ 3. Award points to family member"
echo "□ 4. View activity logs"
echo "□ 5. Check points tracking"
echo ""
echo "If all tests pass:"
echo "✅ Deployment successful!"
echo ""
echo "If issues occur:"
echo "🔧 Check Vercel function logs"
echo "🔧 Verify environment variables"
echo "🔧 Check database connection"
echo ""
echo "🧹 After successful testing, clean up:"
echo "./cleanup-migration-routes.sh"
echo "git add . && git commit -m 'Remove migration routes' && git push"
