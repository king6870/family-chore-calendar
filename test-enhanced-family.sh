#!/bin/bash

echo "🧪 Testing Enhanced Family Manager in Local Development"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project directory."
    exit 1
fi

# Check if enhanced component exists
if [ ! -f "app/components/FamilyManagerEnhanced.tsx" ]; then
    echo "❌ Error: FamilyManagerEnhanced.tsx not found."
    exit 1
fi

echo "✅ Enhanced Family Manager component found"
echo ""

# Start development server
echo "🚀 Starting development server..."
echo "📋 Features available in Family tab:"
echo "   ✅ Family overview with member info"
echo "   ✅ Member management (promote/demote/kick)"
echo "   ✅ Complete chore management (create/edit/delete)"
echo "   ✅ Admin controls integrated"
echo "   ✅ Owner actions (transfer ownership, delete family)"
echo ""

echo "🌐 Opening: http://localhost:3000"
echo "📍 Navigate to: Family tab → Admin features"
echo ""

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use. Stopping existing process..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo "🔧 Environment: Local Development (SQLite)"
echo "🎯 Admin Features: ENABLED in Family tab"
echo ""

# Start the development server
npm run dev
