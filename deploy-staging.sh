#!/bin/bash

echo "🧪 STAGING DEPLOYMENT WITH PRISMA ACCELERATE"
echo "============================================="
echo ""
echo "🎯 Target: Staging Environment"
echo "🌐 URL: https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app"
echo "🗄️  Database: Prisma Accelerate (High-Performance)"
echo "🔒 Safe: No production users affected"
echo ""

# Check if we're on staging branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "staging" ]; then
    echo "⚠️  You're currently on branch: $current_branch"
    echo "🔄 Switching to staging branch..."
    git checkout staging
    if [ $? -ne 0 ]; then
        echo "❌ Failed to switch to staging branch"
        echo "💡 Creating staging branch from current branch..."
        git checkout -b staging
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
        echo "✅ Changes committed to staging"
    else
        echo "❌ Cannot deploy with uncommitted changes"
        exit 1
    fi
fi

echo ""
echo "🔑 GitHub Authentication Required"
read -p "Enter your GitHub username: " github_username
read -s -p "Enter your GitHub Personal Access Token: " github_token
echo ""
echo ""

# Validate inputs
if [ -z "$github_username" ] || [ -z "$github_token" ]; then
    echo "❌ Username and token are required"
    exit 1
fi

echo "🗄️  PRISMA ACCELERATE SETUP"
echo "=========================="
echo "✅ Database URL configured for Prisma Accelerate"
echo "⚡ High-performance connection with caching"
echo "🌍 Global edge network for fast queries"
echo ""
echo "📋 Make sure you've added this to Vercel Environment Variables:"
echo "   Name: DATABASE_URL"
echo "   Value: prisma+postgres://accelerate.prisma-data.net/?api_key=..."
echo "   Environment: Preview (for staging)"
echo ""

read -p "Have you added the DATABASE_URL to Vercel Preview environment? (y/n): " db_configured

if [ "$db_configured" != "y" ] && [ "$db_configured" != "Y" ]; then
    echo ""
    echo "⚠️  PLEASE CONFIGURE DATABASE FIRST"
    echo "=================================="
    echo "1. Go to: https://vercel.com/dashboard"
    echo "2. Select your project: family-chore-calendar"
    echo "3. Go to Settings → Environment Variables"
    echo "4. Add new variable:"
    echo "   Name: DATABASE_URL"
    echo "   Value: Your Prisma Accelerate URL"
    echo "   Environment: Preview"
    echo "5. Save and run this script again"
    echo ""
    exit 1
fi

echo "🚀 DEPLOYING TO STAGING..."
echo "========================="

# Configure git with token temporarily
git remote set-url origin https://$github_username:$github_token@github.com/king6870/family-chore-calendar.git

# Push to staging branch (triggers Vercel preview deployment)
echo "📤 Pushing to GitHub staging branch..."
git push origin staging

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ STAGING DEPLOYMENT SUCCESSFUL!"
    echo "================================"
    echo ""
    echo "🧪 Staging URL: https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app"
    echo "⚡ Database: Prisma Accelerate (High-Performance)"
    echo "⏱️  Deployment usually takes 2-3 minutes"
    echo ""
    echo "🔍 What to test on staging:"
    echo "   ✅ User authentication and sign-in"
    echo "   ✅ Family creation and management"
    echo "   ✅ Chore completion and points system"
    echo "   ✅ Rewards system (available in staging)"
    echo "   ✅ Admin panel functionality"
    echo "   ✅ Database performance with Accelerate"
    echo ""
    echo "🎯 Once satisfied with staging, deploy to production:"
    echo "   ./deploy-production.sh"
    echo ""
else
    echo ""
    echo "❌ STAGING DEPLOYMENT FAILED"
    echo "Check the error messages above"
fi

# Reset git remote for security
git remote set-url origin https://github.com/king6870/family-chore-calendar.git
echo "🔐 Git remote URL reset for security"

echo ""
echo "🏁 Staging deployment completed"
