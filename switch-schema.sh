#!/bin/bash

if [ "$1" = "local" ]; then
    echo "🔄 Switching to local SQLite schema..."
    cp prisma/schema.local.prisma prisma/schema.prisma
    echo "✅ Local schema activated"
    echo "🔧 Run: npx prisma db push"
    echo "🔧 Then: npx prisma generate"
elif [ "$1" = "production" ]; then
    echo "🔄 Switching to production PostgreSQL schema..."
    cp prisma/schema.production.prisma prisma/schema.prisma
    echo "✅ Production schema activated"
    echo "🔧 Run: npx prisma generate"
else
    echo "Usage: ./switch-schema.sh [local|production]"
    echo ""
    echo "local      - Switch to SQLite schema for local development"
    echo "production - Switch to PostgreSQL schema for production"
fi
