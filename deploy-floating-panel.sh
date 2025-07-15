#!/bin/bash

echo "🚀 Deploying Floating Bid Panel Update!"
echo "📱 New floating auction dashboard with real-time bid tracking"
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
echo "   - 🏛️ Floating bid panel in top-right corner"
echo "   - 📊 Three tabs: My Bids, Winning, All Auctions"
echo "   - 🏆 Real-time winning status indicators"
echo "   - ⏰ Live countdown timers for auctions"
echo "   - 💰 Points savings calculator"
echo "   - 📱 Responsive design for all devices"
echo ""

# Set up remote with token and push
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

echo "📤 Pushing floating panel update to GitHub..."
if git push origin main; then
    echo ""
    echo "✅ SUCCESS! Floating bid panel is now deployed!"
    echo ""
    echo "🎉 What's now live on production:"
    echo "   - 🏛️ Auctions tab in main navigation"
    echo "   - 🚫 Fixed page jumping when bidding"
    echo "   - ⚡ Real-time auction updates"
    echo "   - 👥 All family members can access auctions"
    echo "   - 📱 NEW: Floating bid panel dashboard"
    echo ""
    echo "🌐 Check your site: https://family-chore-calendar.vercel.app"
    echo "⏱️  Wait 2-3 minutes for Vercel deployment"
    echo "🔄 Hard refresh (Ctrl+F5) to see changes"
    echo ""
    echo "🎯 Look for the floating auction button in top-right corner!"
    echo "📊 Click it to see your bid dashboard with:"
    echo "   • My Bids - All your active bids"
    echo "   • Winning - Auctions you're currently winning"
    echo "   • All Auctions - Complete auction overview"
else
    echo "❌ Push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
