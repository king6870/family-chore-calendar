#!/bin/bash

echo "🚀 Deploying Staging Branch to GitHub..."
echo "This will create your staging environment on Vercel"
echo ""

# Check if we're on staging branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "staging" ]; then
    echo "❌ Error: You must be on the staging branch"
    echo "Current branch: $current_branch"
    echo "Run: git checkout staging"
    exit 1
fi

# Get GitHub credentials
echo "📋 GitHub Authentication Required"
echo "Go to: https://github.com/settings/tokens"
echo "Create token with 'repo' scope if you don't have one"
echo ""
read -p "Enter your GitHub username: " github_username
read -s -p "Enter your GitHub Personal Access Token: " github_token
echo ""

# Configure git with token
git remote set-url origin https://$github_username:$github_token@github.com/king6870/family-chore-calendar.git

# Push staging branch
echo ""
echo "🔄 Pushing staging branch to GitHub..."
git push origin staging

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Staging branch pushed successfully!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
    echo "2. Find your project: family-chore-calendar"
    echo "3. Look for new deployment from 'staging' branch"
    echo "4. Staging URL will be: https://family-chore-calendar-git-staging-[username].vercel.app"
    echo ""
    echo "⏱️  Deployment usually takes 2-3 minutes"
    echo "🔄 Vercel will automatically deploy every push to staging branch"
else
    echo ""
    echo "❌ Failed to push staging branch"
    echo "Please check your GitHub token and try again"
fi

# Reset git remote (remove token from URL for security)
git remote set-url origin https://github.com/king6870/family-chore-calendar.git

echo ""
echo "🔐 Git remote URL reset for security"
