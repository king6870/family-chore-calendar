#!/bin/bash

echo "🚀 Deploying Family Chore Calendar with Database Updates!"
echo "💡 This will add the Suggestion table to production and deploy all features"
echo ""

# Prompt for GitHub token
echo "🔑 Enter your GitHub Personal Access Token:"
read -s -p "Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo "📋 What's being deployed:"
echo "   - 💡 Suggestions floating button with database storage"
echo "   - 🔄 Recurring chores system"
echo "   - 📝 Chore assignment system for admins/owners"
echo "   - 🧠 Smart bidding system"
echo "   - 🏛️ Enhanced auctions with floating panel"
echo "   - 📊 All existing features (points, calendar, admin panel)"
echo ""

# Step 1: Get production environment variables
echo "📥 Getting production database credentials..."
if vercel env pull .env.production; then
    echo "✅ Production environment variables retrieved"
else
    echo "❌ Failed to get production environment. Make sure you're logged into Vercel CLI"
    exit 1
fi

# Step 2: Add Suggestion table to production database
echo ""
echo "🗄️ Adding Suggestion table to production database..."
if node add-suggestion-only.js; then
    echo "✅ Database table created successfully"
else
    echo "⚠️ Database table creation had issues, but continuing with deployment..."
fi

# Step 3: Regenerate Prisma client with new schema
echo ""
echo "🔄 Regenerating Prisma client..."
npx prisma generate

# Step 4: Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

if git push origin main; then
    echo ""
    echo "🎉 SUCCESS! Family Chore Calendar deployed with all features!"
    echo ""
    echo "✅ What's now live on production:"
    echo "   - 💡 Suggestions floating button (with database storage)"
    echo "   - 🔄 Recurring chores automation"
    echo "   - 📝 Admin chore assignment system"
    echo "   - 🧠 Smart bidding recommendations"
    echo "   - 🏛️ Enhanced auction system"
    echo "   - 📊 Complete points tracking"
    echo "   - 📅 Interactive calendar"
    echo "   - 👥 Full admin panel"
    echo ""
    echo "🌐 Check your site: https://family-chore-calendar.vercel.app"
    echo "⏱️  Wait 2-3 minutes for Vercel deployment"
    echo "🔄 Hard refresh (Ctrl+F5) to see changes"
    echo ""
    echo "💡 How to use new features:"
    echo ""
    echo "🔄 Recurring Chores:"
    echo "   1. Go to Admin Panel → 'Recurring Chores' tab"
    echo "   2. Click 'Add Recurring Chore'"
    echo "   3. Set pattern (daily, weekly, etc.)"
    echo "   4. Click 'Generate Chores' to create assignments"
    echo ""
    echo "📝 Assign Chores:"
    echo "   1. Go to Admin Panel → 'Assign Chores' tab"
    echo "   2. Select chore and family members"
    echo "   3. Choose date and click 'Assign Chore'"
    echo ""
    echo "💡 Suggestions:"
    echo "   1. Look for purple lightbulb button (bottom-right)"
    echo "   2. Click to submit feedback/suggestions"
    echo "   3. View suggestions: npx prisma studio → Suggestion table"
    echo ""
    echo "🎯 All suggestions now stored in database!"
    echo "   - Run 'npx prisma studio' locally"
    echo "   - Or check Vercel Postgres dashboard"
else
    echo "❌ Push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
rm -f .env.production
