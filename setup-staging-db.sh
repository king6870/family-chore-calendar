#!/bin/bash

echo "🗄️  Setting up Staging Database Schema..."
echo ""

echo "📋 You'll need your staging database URL from Vercel"
echo "Go to: Vercel Dashboard → Storage → family-chore-staging → Settings"
echo "Copy the POSTGRES_URL"
echo ""

read -p "Enter your staging DATABASE_URL: " staging_db_url

if [ -z "$staging_db_url" ]; then
    echo "❌ Error: DATABASE_URL is required"
    exit 1
fi

echo ""
echo "🔄 Setting up database schema..."

# Temporarily set DATABASE_URL for schema push
export DATABASE_URL="$staging_db_url"

# Push schema to staging database
npx prisma db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Staging database schema created successfully!"
    echo ""
    echo "🎯 Database includes:"
    echo "  - User management (with isOwner field)"
    echo "  - Family system"
    echo "  - Chore management"
    echo "  - Points tracking"
    echo "  - Auction system"
    echo "  - Suggestions system"
    echo "  - All relationships and constraints"
    echo ""
    echo "📋 Next: Set up environment variables in Vercel"
else
    echo ""
    echo "❌ Failed to create staging database schema"
    echo "Please check your DATABASE_URL and try again"
fi

# Unset the temporary environment variable
unset DATABASE_URL

echo ""
echo "🔐 Environment variable cleared for security"
