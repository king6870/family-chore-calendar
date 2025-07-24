#!/bin/bash
# Run this script after successfully running the migration routes

echo "🧹 Cleaning up migration routes..."

# Remove migration routes
rm -f app/api/migrate-db/route.ts
rm -f app/api/fix-weeklygoal/route.ts
rm -f app/api/fix-remaining-columns/route.ts

echo "✅ All migration routes removed for security"
echo "🔄 Remember to rebuild and redeploy after running migrations"
