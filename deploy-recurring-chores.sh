#!/bin/bash

echo "🚀 Deploying Recurring Chores System!"
echo "🔄 Automated chore creation with flexible scheduling patterns"
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
echo "   - 🔄 Recurring Chores tab in Admin Panel"
echo "   - 📅 Flexible recurrence patterns (daily, weekly, biweekly, monthly, custom)"
echo "   - 🎯 Smart chore generation from patterns"
echo "   - 📊 Visual pattern management interface"
echo "   - ⚡ Automatic scheduling with duplicate prevention"
echo "   - 🛠️ Full CRUD operations for recurring patterns"
echo "   - 📈 Date range bulk generation"
echo ""

# Set up remote with token and push
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

echo "📤 Pushing recurring chores system to GitHub..."
if git push origin main; then
    echo ""
    echo "✅ SUCCESS! Recurring chores system is now deployed!"
    echo ""
    echo "🎉 What's now live on production:"
    echo "   - 🏛️ Auctions with smart bidding and floating panel"
    echo "   - 🔄 NEW: Recurring Chores automation system"
    echo "   - 📅 Flexible scheduling patterns"
    echo "   - 🎯 Automatic chore generation"
    echo "   - 📊 Visual pattern management"
    echo ""
    echo "🌐 Check your site: https://family-chore-calendar.vercel.app"
    echo "⏱️  Wait 2-3 minutes for Vercel deployment"
    echo "🔄 Hard refresh (Ctrl+F5) to see changes"
    echo ""
    echo "🎯 How to use Recurring Chores:"
    echo "   1. Go to Admin Panel"
    echo "   2. Click '🔄 Recurring Chores' tab"
    echo "   3. Click '➕ Add Recurring Chore'"
    echo "   4. Set up your recurrence pattern:"
    echo "      • Daily: Every day or every N days"
    echo "      • Weekly: Specific days (Mon, Wed, Fri)"
    echo "      • Biweekly: Every 2 weeks on chosen days"
    echo "      • Monthly: Every month or every N months"
    echo "      • Custom: Every N days (any interval)"
    echo "   5. Click '📅 Generate Chores' to create from patterns"
    echo ""
    echo "💡 Examples:"
    echo "   • 'Take out trash' - Weekly on Tuesday"
    echo "   • 'Deep clean bathroom' - Biweekly on Saturday"
    echo "   • 'Water plants' - Every 3 days"
    echo "   • 'Monthly bills review' - Monthly on 1st"
    echo ""
    echo "🔄 The system automatically creates chores based on your"
    echo "   patterns, preventing duplicates and handling all the"
    echo "   scheduling logic for you!"
else
    echo "❌ Push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
