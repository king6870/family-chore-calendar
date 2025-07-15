#!/bin/bash

echo "🚀 Family Chore Calendar - Vercel Deployment Helper"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "🔧 Pre-deployment checklist:"
echo "✅ Code updated for PostgreSQL"
echo "✅ Vercel configuration ready"
echo "✅ Environment variables template created"
echo ""

echo "📋 Next steps:"
echo "1. Set up Supabase database (see DEPLOYMENT.md)"
echo "2. Update Google OAuth settings"
echo "3. Run deployment commands"
echo ""

echo "🚀 Ready to deploy? Run these commands:"
echo ""
echo "# Login to Vercel"
echo "vercel login"
echo ""
echo "# Deploy (first time)"
echo "vercel"
echo ""
echo "# Set environment variables (after getting database URL)"
echo "vercel env add DATABASE_URL"
echo "vercel env add NEXTAUTH_URL"
echo "vercel env add NEXTAUTH_SECRET"
echo "vercel env add GOOGLE_CLIENT_ID"
echo "vercel env add GOOGLE_CLIENT_SECRET"
echo ""
echo "# Deploy to production"
echo "vercel --prod"
echo ""
echo "📖 Full guide: See DEPLOYMENT.md"
