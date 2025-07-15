#!/bin/bash

echo "🚀 Deploying Family Chore Calendar to GitHub..."
echo ""
echo "This will push your auction improvements to GitHub and trigger Vercel deployment."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the correct project directory"
    echo "Please run this from /mnt/c/Users/lionv/nextjs-auth-app"
    exit 1
fi

# Check if there are committed changes to push
if git diff --quiet HEAD origin/main 2>/dev/null; then
    echo "ℹ️  No new changes to push"
else
    echo "📦 Found changes to deploy:"
    git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline -1
    echo ""
fi

# Prompt for GitHub token
echo "🔑 Please enter your GitHub Personal Access Token:"
echo "   (Create one at: https://github.com/settings/tokens)"
echo "   Required scopes: repo"
echo ""
read -s -p "Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

# Set up remote with token
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

# Push changes
echo "📤 Pushing changes to GitHub..."
if git push origin main; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🔄 Vercel should automatically deploy your changes now."
    echo ""
    echo "📋 What was deployed:"
    echo "   - 🏛️ Auctions tab in main navigation"
    echo "   - 🚫 Fixed page jumping when bidding"
    echo "   - ⚡ Real-time auction updates"
    echo "   - 👥 All family members can access auctions"
    echo ""
    echo "🌐 Check your production site in 2-3 minutes:"
    echo "   https://family-chore-calendar.vercel.app"
    echo ""
    echo "💡 If changes don't appear:"
    echo "   1. Wait 5 minutes for deployment"
    echo "   2. Hard refresh (Ctrl+F5)"
    echo "   3. Clear browser cache"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo "Please check your token and try again"
    exit 1
fi

# Clean up (remove token from git config)
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"

echo "🎉 Deployment complete!"
