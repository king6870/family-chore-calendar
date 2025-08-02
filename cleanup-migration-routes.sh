#!/bin/bash
# Run this script after successfully running the migration routes

echo "🧹 Cleaning up ALL migration routes..."

# Remove all migration routes
rm -f app/api/migrate-db/route.ts
rm -f app/api/fix-weeklygoal/route.ts
rm -f app/api/fix-remaining-columns/route.ts
rm -f app/api/fix-all-database-issues/route.ts

echo "✅ All migration routes removed for security:"
echo "  - /api/migrate-db"
echo "  - /api/fix-weeklygoal" 
echo "  - /api/fix-remaining-columns"
echo "  - /api/fix-all-database-issues"
echo ""
echo "🔄 Remember to rebuild and redeploy after running migrations:"
echo "git add . && git commit -m 'Remove migration routes for security' && git push"
