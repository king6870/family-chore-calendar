#!/bin/bash

echo "🚀 Pushing your auction improvements to GitHub..."

# Prompt for GitHub token
echo "🔑 Enter your GitHub Personal Access Token:"
read -s -p "Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

# Set up remote with token and push
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

echo "📤 Pushing to GitHub..."
if git push origin main; then
    echo ""
    echo "✅ SUCCESS! Your auction improvements are now deployed!"
    echo ""
    echo "🎉 What's now live on production:"
    echo "   - 🏛️ Auctions tab in main navigation"
    echo "   - 🚫 Fixed page jumping when bidding"
    echo "   - ⚡ Real-time auction updates"
    echo "   - 👥 All family members can access auctions"
    echo ""
    echo "🌐 Check your site: https://family-chore-calendar.vercel.app"
    echo "⏱️  Wait 2-3 minutes for Vercel deployment"
    echo "🔄 Hard refresh (Ctrl+F5) to see changes"
else
    echo "❌ Push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
