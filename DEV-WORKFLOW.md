# 🚀 Development Workflow

## 📁 Project Structure

- `prisma/schema.prisma` - Current active schema
- `prisma/schema.local.prisma` - SQLite schema for local development
- `prisma/schema.production.prisma` - PostgreSQL schema for production
- `.env.local` - Local development environment variables
- `.env.production` - Production environment variables

## 🔧 Development Commands

### **Start Local Development**
```bash
./dev-start.sh
# OR manually:
./switch-schema.sh local
npx prisma generate
npm run dev
```

### **Switch Database Schemas**
```bash
# For local development (SQLite)
./switch-schema.sh local

# For production deployment (PostgreSQL)
./switch-schema.sh production
```

### **Sync with GitHub**
```bash
./sync-with-github.sh
# This will:
# 1. Switch to production schema
# 2. Commit and push changes
# 3. Switch back to local schema
```

### **Database Management**
```bash
# Reset local database (if needed)
npx prisma db push --force-reset

# View database in Prisma Studio
npx prisma studio
```

## 🔄 Typical Development Flow

1. **Start Development**:
   ```bash
   ./dev-start.sh
   ```

2. **Make Changes**: Edit code, test locally

3. **Sync with GitHub**:
   ```bash
   ./sync-with-github.sh
   ```

4. **Deploy**: Vercel will auto-deploy from GitHub

## 🚨 Important Notes

- **Always use local schema for development** (SQLite)
- **Always use production schema for deployment** (PostgreSQL)
- **Local database resets are safe** - no production data affected
- **Migration routes are temporary** - remove after use for security

## 🔧 Troubleshooting

### **Loading Screen Issues**
- Ensure correct schema is active: `./switch-schema.sh local`
- Reset local database: `npx prisma db push --force-reset`
- Regenerate client: `npx prisma generate`

### **Database Connection Issues**
- Check `.env.local` has correct DATABASE_URL
- Ensure SQLite file permissions are correct
- Try resetting local database

### **Schema Sync Issues**
- Always run `./sync-with-github.sh` before deploying
- Check that production schema is active before committing
- Verify environment variables are correct

## 📋 Environment Variables

### **Local (.env.local)**
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### **Production (.env.production)**
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-production-client-id"
GOOGLE_CLIENT_SECRET="your-production-client-secret"
```
