#!/bin/bash

echo "🔐 SECURE PRODUCTION DEPLOYMENT"
echo "================================"
echo ""
echo "⚠️  WARNING: This will deploy to LIVE PRODUCTION"
echo "🌐 URL: https://family-chore-calendar.vercel.app"
echo "👥 Users: Real family members will be affected"
echo ""

# Confirmation prompt
read -p "Are you sure you want to deploy to production? (type 'DEPLOY' to confirm): " confirmation

if [ "$confirmation" != "DEPLOY" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🔑 GitHub Authentication Required"
echo "📋 You need a Personal Access Token with 'repo' permissions"
echo "🔗 Create one at: https://github.com/settings/tokens"
echo ""

read -p "Enter your GitHub username: " github_username
read -s -p "Enter your GitHub Personal Access Token: " github_token
echo ""
echo ""

# Validate inputs
if [ -z "$github_username" ] || [ -z "$github_token" ]; then
    echo "❌ Username and token are required"
    exit 1
fi

echo "🔍 Checking current branch and status..."

# Check if we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  You're currently on branch: $current_branch"
    echo "🔄 Switching to main branch..."
    git checkout main
    if [ $? -ne 0 ]; then
        echo "❌ Failed to switch to main branch"
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes"
    echo "📋 Uncommitted files:"
    git status --porcelain
    echo ""
    read -p "Do you want to commit these changes? (y/n): " commit_changes
    
    if [ "$commit_changes" = "y" ] || [ "$commit_changes" = "Y" ]; then
        read -p "Enter commit message: " commit_message
        git add .
        git commit -m "$commit_message"
        echo "✅ Changes committed"
    else
        echo "❌ Cannot deploy with uncommitted changes"
        exit 1
    fi
fi

# Show what will be deployed
echo ""
echo "📦 DEPLOYMENT SUMMARY"
echo "===================="
echo "🌿 Branch: main"
echo "📝 Latest commit:"
git log -1 --oneline
echo ""
echo "📁 Files that will be deployed:"
git diff --name-only HEAD~1 HEAD | head -10
if [ $(git diff --name-only HEAD~1 HEAD | wc -l) -gt 10 ]; then
    echo "... and $(( $(git diff --name-only HEAD~1 HEAD | wc -l) - 10 )) more files"
fi
echo ""

# Final confirmation
read -p "Proceed with production deployment? (type 'YES' to confirm): " final_confirmation

if [ "$final_confirmation" != "YES" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 DEPLOYING TO PRODUCTION..."
echo "=============================="

# Configure git with token temporarily
git remote set-url origin https://$github_username:$github_token@github.com/king6870/family-chore-calendar.git

# Push to main branch (triggers Vercel production deployment)
echo "📤 Pushing to GitHub main branch..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PRODUCTION DEPLOYMENT INITIATED!"
    echo "=================================="
    echo ""
    echo "🔄 Vercel is now building and deploying..."
    echo "⏱️  This usually takes 2-3 minutes"
    echo ""
    echo "🌐 Production URL: https://family-chore-calendar.vercel.app"
    echo "📊 Vercel Dashboard: https://vercel.com/dashboard"
    echo ""
    echo "🔍 To monitor deployment:"
    echo "   1. Visit Vercel dashboard"
    echo "   2. Check deployment status"
    echo "   3. View build logs if needed"
    echo ""
    echo "✅ Once deployment completes:"
    echo "   - Clear browser cache (Ctrl+F5)"
    echo "   - Test critical functionality"
    echo "   - Verify new features work correctly"
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "=================="
    echo "🔍 Check the error messages above"
    echo "💡 Common issues:"
    echo "   - Invalid GitHub token"
    echo "   - Network connectivity"
    echo "   - Repository permissions"
    echo ""
fi

# Reset git remote for security
git remote set-url origin https://github.com/king6870/family-chore-calendar.git
echo "🔐 Git remote URL reset for security"

echo ""
echo "🏁 Production deployment script completed"
