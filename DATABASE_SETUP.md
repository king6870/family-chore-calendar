# Database Configuration

This project uses a dual database setup:
- **Local Development**: SQLite (`dev.db`)
- **Production (Vercel)**: PostgreSQL

## Local Development Setup

Your local environment is already configured to use SQLite:

```bash
# .env.local
DATABASE_URL="file:./dev.db"
```

To set up the local database:

```bash
npm run db:push
npm run dev
```

## Production Setup (Vercel)

For production, you need to:

1. **Set up a PostgreSQL database** (recommended providers):
   - [Neon](https://neon.tech) - Free tier available
   - [Supabase](https://supabase.com) - Free tier available
   - [Railway](https://railway.app) - Free tier available
   - [PlanetScale](https://planetscale.com) - Free tier available

2. **Add environment variables in Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add the following variables:

   ```
   DATABASE_URL=postgresql://username:password@host:5432/database
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. **Deploy to Vercel**:
   ```bash
   npm run build  # This will automatically use PostgreSQL schema for production
   ```

## How It Works

The build system automatically detects the environment:

- **Local (`npm run dev`)**: Uses SQLite schema
- **Production (Vercel)**: Uses PostgreSQL schema with `@db.Text` attributes

The `scripts/build.js` handles schema switching automatically during deployment.

## Manual Schema Switching

If you need to manually switch schemas:

```bash
# For production PostgreSQL
cp prisma/schema.production.prisma prisma/schema.prisma
npx prisma generate

# For local SQLite (restore)
git checkout prisma/schema.prisma
npx prisma generate
```

## Database Commands

```bash
# Local development
npm run db:push              # Push schema to SQLite
npm run db:studio           # Open Prisma Studio

# Production (after switching to PostgreSQL schema)
npm run db:push:production  # Push schema to PostgreSQL
```
