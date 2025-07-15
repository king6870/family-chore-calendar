#!/bin/bash

echo "🚀 Deploying Smart Bidding System!"
echo "🧠 Intelligent auction strategy with dynamic bid limits"
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
echo "   - 🧠 Smart Bidding Assistant for each auction"
echo "   - 📊 Dynamic min/max bid limits based on weekly goals"
echo "   - 🎯 Strategy recommendations (Conservative/Balanced/Aggressive)"
echo "   - 📈 Weekly goal progress tracking"
echo "   - 🎨 Visual bid range indicators"
echo "   - ⚡ Real-time bid calculations"
echo "   - 🏆 Competition-aware bidding advice"
echo ""

# Set up remote with token and push
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

echo "📤 Pushing smart bidding system to GitHub..."
if git push origin main; then
    echo ""
    echo "✅ SUCCESS! Smart bidding system is now deployed!"
    echo ""
    echo "🎉 What's now live on production:"
    echo "   - 🏛️ Auctions tab with floating bid panel"
    echo "   - 🧠 NEW: Smart Bidding Assistant"
    echo "   - 📊 Dynamic bid limits based on your weekly goals"
    echo "   - 🎯 Personalized bidding strategies"
    echo "   - 📈 Weekly goal progress tracking"
    echo "   - 🎨 Visual bid range guidance"
    echo ""
    echo "🌐 Check your site: https://family-chore-calendar.vercel.app"
    echo "⏱️  Wait 2-3 minutes for Vercel deployment"
    echo "🔄 Hard refresh (Ctrl+F5) to see changes"
    echo ""
    echo "🎯 How to use Smart Bidding:"
    echo "   1. Go to Auctions tab"
    echo "   2. Click '🧠 Smart Assistant' on any auction"
    echo "   3. See your recommended bid range"
    echo "   4. Click 'Use Recommended' for optimal bids"
    echo "   5. Track your weekly goal progress"
    echo ""
    echo "💡 The system ensures you can meet your weekly goals"
    echo "   even if you don't win every auction you bid on!"
else
    echo "❌ Push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
