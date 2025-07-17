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
echo "🔄 Setting up database schema for PostgreSQL..."

# Backup current schema
echo "📋 Backing up current SQLite schema..."
cp prisma/schema.prisma prisma/schema.backup.prisma

# Use production schema temporarily (PostgreSQL)
echo "🔄 Switching to PostgreSQL schema..."
cp prisma/schema.production.prisma prisma/schema.prisma

# Temporarily set DATABASE_URL for schema push
export DATABASE_URL="$staging_db_url"

# Generate Prisma client for PostgreSQL
echo "🔧 Generating PostgreSQL Prisma client..."
npx prisma generate

# Push schema to staging database
echo "🚀 Pushing schema to staging database..."
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
    echo "  - All relationships and constraints"
    echo ""
    echo "📋 Next: Test your staging environment!"
else
    echo ""
    echo "❌ Failed to create staging database schema"
    echo "Please check your DATABASE_URL and try again"
fi

# Restore original SQLite schema
echo ""
echo "🔄 Restoring original SQLite schema..."
cp prisma/schema.backup.prisma prisma/schema.prisma
rm prisma/schema.backup.prisma

# Regenerate client for local development
echo "🔧 Regenerating SQLite Prisma client for local development..."
npx prisma generate

# Unset the temporary environment variable
unset DATABASE_URL

echo ""
echo "🔐 Environment variable cleared for security"
echo "✅ Local development schema restored"
