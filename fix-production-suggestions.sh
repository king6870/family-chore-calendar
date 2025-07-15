#!/bin/bash

echo "🔧 Fixing Production Suggestions Issue"
echo "This will regenerate the Prisma client and redeploy"
echo ""

# Prompt for GitHub token
echo "🔑 Enter your GitHub Personal Access Token:"
read -s -p "Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo "🔍 Diagnosing the issue..."
echo "The problem is likely that the production Prisma client doesn't include the Suggestion model"
echo ""

# Step 1: Regenerate Prisma client
echo "🔄 Regenerating Prisma client with Suggestion model..."
npx prisma generate

# Step 2: Test locally to make sure it works
echo ""
echo "🧪 Testing suggestions locally..."
if node test-suggestions.js; then
    echo "✅ Local testing successful"
else
    echo "❌ Local testing failed - there may be a deeper issue"
    exit 1
fi

# Step 3: Commit the fix
echo ""
echo "📝 Committing the fix..."
git add .
git commit -m "Fix suggestions API - remove optional chaining and ensure proper database usage

🔧 Fixed Issues:
- Removed optional chaining (?.) from prisma.suggestion.create()
- Now properly attempts database creation and falls back to logging
- Added better error handling and logging
- Added suggestionId to successful responses

🧪 Testing:
- Local tests pass completely
- Database connection verified
- API endpoint working correctly

🎯 This should fix production suggestions not being stored in database"

# Step 4: Deploy to production
echo ""
echo "📤 Deploying fix to production..."
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

if git push origin main; then
    echo ""
    echo "🎉 SUCCESS! Fix deployed to production!"
    echo ""
    echo "✅ What was fixed:"
    echo "   - 🔧 Removed optional chaining that was preventing database writes"
    echo "   - 📊 Added better error logging for debugging"
    echo "   - 🆔 Added suggestion ID to successful responses"
    echo "   - 🔄 Regenerated Prisma client with Suggestion model"
    echo ""
    echo "🌐 Check your site: https://family-chore-calendar.vercel.app"
    echo "⏱️  Wait 2-3 minutes for Vercel deployment"
    echo "🔄 Hard refresh (Ctrl+F5) to see changes"
    echo ""
    echo "🧪 How to test:"
    echo "   1. Click the purple lightbulb button"
    echo "   2. Submit a test suggestion"
    echo "   3. Check database: npx prisma studio → Suggestion table"
    echo "   4. Or check Vercel function logs for any errors"
    echo ""
    echo "💡 If still not working, check Vercel function logs:"
    echo "   - Go to Vercel dashboard → Functions → /api/suggestions → Logs"
    echo "   - Look for error messages or 'SUGGESTION SUBMITTED' entries"
else
    echo "❌ Push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
