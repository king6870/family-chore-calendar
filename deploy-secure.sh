#!/bin/bash

echo "🚀 Deploying your auction improvements (secrets removed)..."

# Prompt for GitHub token
echo "🔑 Enter your GitHub Personal Access Token:"
read -s -p "Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo "📋 What's being deployed:"
echo "   - 🏛️ Auctions tab in main navigation"
echo "   - 🚫 Fixed page jumping when bidding"
echo "   - ⚡ Real-time auction updates"
echo "   - 👥 All family members can access auctions"
echo "   - 🔒 OAuth secrets removed for security"
echo ""

# Set up remote with token and push
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

echo "📤 Pushing to GitHub..."
if git push origin main --force; then
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
    echo ""
    echo "🎯 Look for the 🏛️ Auctions tab in your navigation!"
    echo ""
    echo "⚠️  Note: You'll need to add your OAuth secrets back in Vercel:"
    echo "   1. Go to Vercel dashboard → Your project → Settings → Environment Variables"
    echo "   2. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
    echo "   3. Redeploy if needed"
else
    echo "❌ Push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
