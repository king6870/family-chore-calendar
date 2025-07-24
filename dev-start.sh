#!/bin/bash

echo "🚀 Starting local development environment..."

# Ensure we're using local schema
echo "🔧 Setting up local schema..."
./switch-schema.sh local

# Check if database needs reset
if [ ! -f "dev.db" ]; then
    echo "📦 Creating fresh local database..."
    npx prisma db push --force-reset
else
    echo "🔄 Updating existing database..."
    npx prisma db push
fi

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

echo "✅ Local environment ready!"
echo "🌟 Starting Next.js development server..."
echo "📱 Open http://localhost:3000 in your browser"
echo ""

# Start development server
npm run dev
