#!/bin/bash

echo "🚀 Force deploying your auction improvements to GitHub..."
echo "⚠️  This will override any changes on GitHub with your local version."
echo ""

# Prompt for GitHub token
echo "🔑 Enter your GitHub Personal Access Token:"
read -s -p "Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo "📋 Your auction improvements to deploy:"
echo "   - 🏛️ Auctions tab in main navigation"
echo "   - 🚫 Fixed page jumping when bidding"
echo "   - ⚡ Real-time auction updates"
echo "   - 👥 All family members can access auctions"
echo ""

read -p "Continue with force push? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Set up remote with token and force push
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

echo "📤 Force pushing to GitHub..."
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
else
    echo "❌ Force push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
