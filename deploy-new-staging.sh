#!/bin/bash

echo "🆕 DEPLOY TO NEW FRESH STAGING ENVIRONMENT"
echo "=========================================="
echo ""
echo "🎯 Target: Brand New Staging Environment"
echo "🌐 URL: [Will be generated by new Vercel project]"
echo "🗄️  Database: Fresh database with clean schema"
echo "🔐 OAuth: New Google OAuth client"
echo "🔒 Safe: Completely isolated from old staging"
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
echo "🆕 NEW STAGING ENVIRONMENT CHECKLIST"
echo "===================================="
echo ""
echo "Before deploying, make sure you've completed:"
echo ""
echo "✅ 1. Created new Google OAuth client"
echo "   - Go to: https://console.cloud.google.com/apis/credentials"
echo "   - Create new OAuth client ID for web application"
echo "   - Name: 'Family Chore Calendar - New Staging'"
echo ""
echo "✅ 2. Created new Vercel project"
echo "   - Go to: https://vercel.com/dashboard"
echo "   - Import your GitHub repo"
echo "   - Name: 'family-chore-calendar-staging-v2'"
echo "   - Configure to deploy only 'staging' branch"
echo ""
echo "✅ 3. Created new database"
echo "   - Option A: Vercel Postgres in new project"
echo "   - Option B: New Prisma Accelerate project"
echo "   - Get the new DATABASE_URL"
echo ""
echo "✅ 4. Set environment variables in new Vercel project"
echo "   - DATABASE_URL (from step 3)"
echo "   - NEXTAUTH_URL (will be your new staging URL)"
echo "   - GOOGLE_CLIENT_ID (from step 1)"
echo "   - GOOGLE_CLIENT_SECRET (from step 1)"
echo "   - NEXTAUTH_SECRET (can reuse existing)"
echo ""

read -p "Have you completed all the above steps? (y/n): " setup_complete

if [ "$setup_complete" != "y" ] && [ "$setup_complete" != "Y" ]; then
    echo ""
    echo "⚠️  PLEASE COMPLETE SETUP FIRST"
    echo "==============================="
    echo ""
    echo "📋 Setup guides available:"
    echo "   - setup-new-staging-oauth.md"
    echo "   - setup-new-vercel-project.md"
    echo ""
    echo "🔄 Run this script again after completing setup"
    exit 1
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

echo "🚀 DEPLOYING TO NEW STAGING..."
echo "============================="

# Configure git with token temporarily
git remote set-url origin https://$github_username:$github_token@github.com/king6870/family-chore-calendar.git

# Push to staging branch (triggers deployment to new Vercel project)
echo "📤 Pushing to GitHub staging branch..."
git push origin staging

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT TO NEW STAGING SUCCESSFUL!"
    echo "======================================="
    echo ""
    echo "🎉 Your fresh staging environment is being deployed!"
    echo "⏱️  Deployment usually takes 2-3 minutes"
    echo ""
    echo "📋 Next steps:"
    echo ""
    echo "1. 🌐 Get your new staging URL from Vercel dashboard"
    echo "2. 🔐 Update Google OAuth client with the new URL:"
    echo "   - Add JavaScript origin: https://[new-staging-url]"
    echo "   - Add redirect URI: https://[new-staging-url]/api/auth/callback/google"
    echo ""
    echo "3. 🗄️  Set up database (if not done already):"
    echo "   - Run: NEW_STAGING_DATABASE_URL=\"your-url\" node setup-new-staging-database.js"
    echo ""
    echo "4. 🧪 Test your new staging environment:"
    echo "   - Visit the new staging URL"
    echo "   - Test Google OAuth sign-in"
    echo "   - Create a test family"
    echo "   - Verify all features work"
    echo ""
    echo "5. 🗑️  Clean up old staging (optional):"
    echo "   - Delete old Vercel project"
    echo "   - Delete old database"
    echo "   - Delete old OAuth client"
    echo ""
    echo "🎯 Benefits of your new staging:"
    echo "   ✅ Clean slate with no configuration conflicts"
    echo "   ✅ Fresh database with proper schema"
    echo "   ✅ New OAuth client with correct URLs"
    echo "   ✅ Completely isolated from production"
    echo "   ✅ All features including rewards system"
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "Check the error messages above"
    echo ""
    echo "💡 Common issues:"
    echo "   - Invalid GitHub token"
    echo "   - Network connectivity"
    echo "   - Repository permissions"
fi

# Reset git remote for security
git remote set-url origin https://github.com/king6870/family-chore-calendar.git
echo "🔐 Git remote URL reset for security"

echo ""
echo "🏁 New staging deployment completed"
