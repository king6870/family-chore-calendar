#!/bin/bash

echo "🔄 Syncing with GitHub production repository..."

# Switch to production schema before committing
echo "📝 Switching to production schema..."
./switch-schema.sh production

# Add all changes
echo "📦 Adding changes..."
git add .

# Commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "💾 Committing changes..."
git commit -m "Production sync: $TIMESTAMP - Fixed database schema issues and OAuth configuration"

# Push to main branch
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Successfully synced with GitHub!"
echo "🔄 Switching back to local schema for development..."
./switch-schema.sh local

echo "🎉 GitHub sync complete!"
