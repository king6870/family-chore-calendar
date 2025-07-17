#!/bin/bash

echo "🛠️  DEVELOPMENT WORKFLOW HELPER"
echo "==============================="
echo ""
echo "Choose your deployment target:"
echo ""
echo "1. 🏠 Local Development (npm run dev)"
echo "2. 🧪 Deploy to Staging (safe testing)"
echo "3. 🚀 Deploy to Production (live users)"
echo "4. 📊 Check Deployment Status"
echo "5. 🔄 Switch Git Branches"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🏠 Starting Local Development Server..."
        echo "======================================"
        echo "🌐 URL: http://localhost:3001"
        echo "🗄️  Database: SQLite (local)"
        echo "🎁 Rewards: Available (development only)"
        echo ""
        npm run dev
        ;;
    2)
        echo ""
        echo "🧪 Deploying to Staging..."
        ./deploy-staging.sh
        ;;
    3)
        echo ""
        echo "⚠️  PRODUCTION DEPLOYMENT WARNING"
        echo "================================="
        echo "This will affect REAL USERS on the live site!"
        echo ""
        read -p "Are you absolutely sure? (type 'CONFIRM'): " confirm
        if [ "$confirm" = "CONFIRM" ]; then
            ./deploy-production.sh
        else
            echo "❌ Production deployment cancelled"
        fi
        ;;
    4)
        echo ""
        echo "📊 DEPLOYMENT STATUS"
        echo "==================="
        echo ""
        echo "🏠 Local Development:"
        if pgrep -f "next dev" > /dev/null; then
            echo "   ✅ Running on http://localhost:3001"
        else
            echo "   ❌ Not running (use option 1 to start)"
        fi
        echo ""
        echo "🧪 Staging Environment:"
        echo "   🌐 https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app"
        echo "   📊 Check Vercel dashboard for status"
        echo ""
        echo "🚀 Production Environment:"
        echo "   🌐 https://family-chore-calendar.vercel.app"
        echo "   📊 Check Vercel dashboard for status"
        echo ""
        echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
        ;;
    5)
        echo ""
        echo "🔄 GIT BRANCH MANAGEMENT"
        echo "======================="
        echo ""
        echo "Current branch: $(git branch --show-current)"
        echo ""
        echo "Available branches:"
        git branch -a
        echo ""
        echo "Switch to:"
        echo "1. main (production)"
        echo "2. staging (testing)"
        echo "3. Create new branch"
        echo ""
        read -p "Enter choice (1-3): " branch_choice
        
        case $branch_choice in
            1)
                git checkout main
                echo "✅ Switched to main branch"
                ;;
            2)
                git checkout staging
                if [ $? -ne 0 ]; then
                    git checkout -b staging
                    echo "✅ Created and switched to staging branch"
                else
                    echo "✅ Switched to staging branch"
                fi
                ;;
            3)
                read -p "Enter new branch name: " new_branch
                git checkout -b "$new_branch"
                echo "✅ Created and switched to $new_branch branch"
                ;;
        esac
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac

echo ""
echo "🏁 Workflow helper completed"
