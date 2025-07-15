const fs = require('fs');
const path = require('path');

// Simple database reset - delete the SQLite file
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Database reset - deleted dev.db');
  console.log('🔄 Run "npx prisma db push" to recreate database');
  console.log('🚀 Then run "npm run dev" to start fresh');
} else {
  console.log('❌ Database file not found');
}
