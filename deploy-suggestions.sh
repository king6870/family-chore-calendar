#!/bin/bash

echo "🚀 Deploying Suggestions Floating Button System!"
echo "💡 Global feedback collection with database-only viewing"
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
echo "   - 💡 Floating suggestions button on all pages"
echo "   - 📊 Database-only suggestion viewing (Prisma Studio)"
echo "   - 🎯 Categorized feedback system (general, feature, bug, improvement)"
echo "   - 🎨 Priority levels (low, medium, high)"
echo "   - 👤 User context tracking with anonymous support"
echo "   - 📱 Mobile-responsive modal form"
echo "   - ✅ Complete validation and error handling"
echo ""

# Set up remote with token and push
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

echo "📤 Pushing suggestions system to GitHub..."
if git push origin main; then
    echo ""
    echo "✅ SUCCESS! Suggestions floating button system is now deployed!"
    echo ""
    echo "🎉 What's now live on production:"
    echo "   - 🏛️ Auctions with smart bidding and floating panel"
    echo "   - 🔄 Recurring chores automation system"
    echo "   - 💡 NEW: Suggestions floating button on all pages"
    echo "   - 📊 Database feedback collection system"
    echo "   - 🎯 Categorized user feedback with priority levels"
    echo ""
    echo "🌐 Check your site: https://family-chore-calendar.vercel.app"
    echo "⏱️  Wait 2-3 minutes for Vercel deployment"
    echo "🔄 Hard refresh (Ctrl+F5) to see changes"
    echo ""
    echo "💡 How to use the Suggestions System:"
    echo "   1. Look for purple lightbulb button in bottom-right corner"
    echo "   2. Click to open suggestion form"
    echo "   3. Select category: General, Feature, Bug, or Improvement"
    echo "   4. Choose priority: Low, Medium, or High"
    echo "   5. Write title and detailed description"
    echo "   6. Submit - feedback stored in your database"
    echo ""
    echo "📊 How to view suggestions:"
    echo "   1. Run: npx prisma studio"
    echo "   2. Open: http://localhost:5555"
    echo "   3. Click 'Suggestion' table"
    echo "   4. View all user feedback with full context"
    echo ""
    echo "🎯 The floating button appears on every page and collects:"
    echo "   • User feedback and feature requests"
    echo "   • Bug reports with user context"
    echo "   • Improvement suggestions"
    echo "   • Anonymous submissions (works for non-logged users)"
    echo "   • Full user and family context for logged users"
else
    echo "❌ Push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
