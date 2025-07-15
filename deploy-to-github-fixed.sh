#!/bin/bash

echo "🚀 Deploying Family Chore Calendar to GitHub..."
echo ""
echo "This will sync with GitHub and push your auction improvements."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the correct project directory"
    echo "Please run this from /mnt/c/Users/lionv/nextjs-auth-app"
    exit 1
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

echo "📥 Fetching latest changes from GitHub..."
if ! git fetch origin; then
    echo "❌ Failed to fetch from GitHub. Check your token."
    exit 1
fi

echo "🔄 Checking for conflicts..."
# Check if there are any conflicts
if git merge-base --is-ancestor origin/main HEAD; then
    echo "✅ Local changes are ahead of remote"
elif git merge-base --is-ancestor HEAD origin/main; then
    echo "⚠️  Remote is ahead, pulling changes..."
    git pull origin main
else
    echo "🔀 Diverged branches detected, attempting merge..."
    if ! git pull origin main --no-edit; then
        echo "❌ Merge conflicts detected!"
        echo "Please resolve conflicts manually:"
        echo "1. Fix conflicts in the files shown above"
        echo "2. Run: git add ."
        echo "3. Run: git commit -m 'Resolve merge conflicts'"
        echo "4. Run this script again"
        exit 1
    fi
fi

echo "📦 Changes to deploy:"
git log --oneline -5

echo ""
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
    echo "   4. Check Vercel dashboard for deployment status"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo "Please check your token and try again"
    exit 1
fi

# Clean up (remove token from git config)
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"

echo ""
echo "🎉 Deployment complete!"
echo "🔍 Monitor deployment at: https://vercel.com/dashboard"
