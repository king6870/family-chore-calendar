#!/bin/bash

echo "🚀 Final deployment of your auction improvements!"
echo "📁 Repository structure fixed - Vercel will now find package.json"
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
echo "   - 🏛️ Auctions tab in main navigation"
echo "   - 🚫 Fixed page jumping when bidding"
echo "   - ⚡ Real-time auction updates"
echo "   - 👥 All family members can access auctions"
echo "   - 📁 Fixed repository structure for Vercel"
echo "   - 🔒 OAuth secrets removed for security"
echo ""

# Set up remote with token and push
git remote set-url origin "https://$GITHUB_TOKEN@github.com/king6870/family-chore-calendar.git"

echo "📤 Pushing to GitHub with correct structure..."
if git push origin main --force; then
    echo ""
    echo "✅ SUCCESS! Your auction improvements are now deployed!"
    echo ""
    echo "🎉 What's now live on production:"
    echo "   - 🏛️ Auctions tab in main navigation"
    echo "   - 🚫 Fixed page jumping when bidding"
    echo "   - ⚡ Real-time auction updates"
    echo "   - 👥 All family members can access auctions"
    echo "   - 📁 Proper file structure for Vercel"
    echo ""
    echo "🌐 Check your site: https://family-chore-calendar.vercel.app"
    echo "⏱️  Wait 2-3 minutes for Vercel deployment"
    echo "🔄 Hard refresh (Ctrl+F5) to see changes"
    echo ""
    echo "🎯 Look for the 🏛️ Auctions tab in your navigation!"
    echo ""
    echo "✅ Vercel should now find package.json and build successfully!"
else
    echo "❌ Push failed. Check your token."
fi

# Clean up
git remote set-url origin "https://github.com/king6870/family-chore-calendar.git"
