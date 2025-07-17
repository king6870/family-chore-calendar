#!/bin/bash

echo "🔧 Pushing Staging Fix to GitHub..."
echo ""

read -p "Enter your GitHub username: " github_username
read -s -p "Enter your GitHub Personal Access Token: " github_token
echo ""

# Configure git with token
git remote set-url origin https://$github_username:$github_token@github.com/king6870/family-chore-calendar.git

# Push staging branch
echo ""
echo "🔄 Pushing staging fix..."
git push origin staging

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Staging fix pushed successfully!"
    echo "🔄 Vercel will now redeploy with the TypeScript fix"
    echo "⏱️  Wait 2-3 minutes for deployment to complete"
else
    echo ""
    echo "❌ Failed to push staging fix"
fi

# Reset git remote
git remote set-url origin https://github.com/king6870/family-chore-calendar.git
echo "🔐 Git remote URL reset for security"
