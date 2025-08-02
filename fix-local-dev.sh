#!/bin/bash

echo "🔧 Fixing Local Development Database Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Stop any running dev server
echo "🛑 Stopping any running development server..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project directory."
    exit 1
fi

# Backup current schema
echo "💾 Backing up current schema..."
if [ -f "prisma/schema.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.backup.prisma
    echo "✅ Schema backed up to schema.backup.prisma"
fi

# Switch to SQLite schema for local development
echo "🔄 Switching to SQLite schema for local development..."
if [ -f "prisma/schema.sqlite.prisma" ]; then
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
    echo "✅ SQLite schema activated"
else
    echo "❌ SQLite schema not found. Creating it..."
    exit 1
fi

# Clean up old database and generated client
echo "🧹 Cleaning up old database and client..."
rm -f prisma/dev.db
rm -f prisma/dev.db-journal
rm -rf node_modules/.prisma
rm -rf .next

# Verify environment variables
echo "🔍 Checking environment variables..."
if [ -f ".env.local" ]; then
    if grep -q "file:./dev.db" .env.local; then
        echo "✅ DATABASE_URL is correctly set for SQLite"
    else
        echo "⚠️  Updating DATABASE_URL in .env.local..."
        sed -i 's|DATABASE_URL=.*|DATABASE_URL="file:./dev.db"|' .env.local
        echo "✅ DATABASE_URL updated"
    fi
else
    echo "❌ .env.local not found. Creating it..."
    cat > .env.local << EOF
# Local Development with SQLite
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc="

# Google OAuth - Development credentials
GOOGLE_CLIENT_ID="755830677010-brh4erqde1u1cg5kovjbj0v4aoiq900p.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
EOF
    echo "✅ .env.local created with correct settings"
fi

# Generate Prisma client
echo "📦 Generating Prisma client for SQLite..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi
echo "✅ Prisma client generated"

# Push database schema
echo "🗄️ Creating SQLite database..."
npx prisma db push --force-reset
if [ $? -ne 0 ]; then
    echo "❌ Failed to create database"
    exit 1
fi
echo "✅ SQLite database created"

# Verify database
echo "🔍 Verifying database setup..."
if [ -f "prisma/dev.db" ]; then
    echo "✅ Database file created: prisma/dev.db"
else
    echo "❌ Database file not found"
    exit 1
fi

echo ""
echo "🎉 Local development setup complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Schema switched to SQLite"
echo "   ✅ Environment variables configured"
echo "   ✅ Prisma client generated"
echo "   ✅ SQLite database created"
echo "   ✅ Ready for local development"
echo ""
echo "🚀 Starting development server..."
echo "   URL: http://localhost:3000"
echo "   Enhanced Family Tab: Available with admin features"
echo ""

# Start development server
npm run dev
