# Admin Panel Production Deployment Guide

## 🚀 Quick Deployment

### Option 1: Automated Build
```bash
npm run build:admin
```

### Option 2: Manual Steps
```bash
# 1. Build for production
npm run build:production

# 2. Deploy to your platform
# (Vercel, Netlify, etc.)
```

## 🔧 Environment Variables (Production)

Set these in your hosting platform:

```env
# Database (PostgreSQL required for production)
DATABASE_URL="postgresql://username:password@host:5432/database"

# NextAuth Configuration
NEXTAUTH_URL="https://your-app-domain.com"
NEXTAUTH_SECRET="your-super-secure-secret-key"

# Google OAuth (same as local)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 📊 Database Migration

After deployment, run database migration:

```bash
# If using Vercel or similar
npm run db:push:production
```

## 🛠️ Admin Panel Features in Production

### 👑 Owner Privileges
- ✅ Promote/demote admins
- ✅ Transfer ownership
- ✅ Kick family members
- ✅ Delete family (when alone)
- ✅ Full chore management

### 🔧 Admin Privileges  
- ✅ Create/edit/delete chores
- ✅ Manage calendar assignments
- ✅ View family members
- ✅ Leave family

### 👤 Member Access
- ✅ View assigned chores
- ✅ Track points
- ✅ Leave family

## 🔐 Security Features

- ✅ **Session-based authentication** with NextAuth
- ✅ **Role-based access control** (Owner > Admin > Member)
- ✅ **API route protection** with server-side validation
- ✅ **Family isolation** - users only see their family data
- ✅ **Ownership transfer** required before owner can leave

## 📱 Admin Panel Access

1. **Sign in** with Google
2. **Create or join** a family
3. **Access admin panel** via "🛠️ Admin" tab (admins only)

### Admin Panel Sections:
- **👥 Members**: Manage family roles and permissions
- **📋 Chores**: Create and manage family chores
- **⚠️ Danger Zone**: Delete family (owner only, when alone)

## 🚨 Important Production Notes

### Database Requirements:
- **Local**: SQLite (automatic)
- **Production**: PostgreSQL (required)

### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Add your production domain to **Authorized redirect URIs**:
   ```
   https://your-domain.com/api/auth/callback/google
   ```

### First-Time Setup:
1. **First user** to create a family becomes the **Owner**
2. **Owner** can promote other members to **Admin**
3. **Owner** cannot leave without transferring ownership

## 🔄 Deployment Platforms

### Vercel (Recommended)
```bash
# Deploy with Vercel CLI
npx vercel --prod

# Or connect GitHub repo to Vercel dashboard
```

### Other Platforms
- **Netlify**: Works with build command `npm run build:production`
- **Railway**: Supports PostgreSQL and auto-deployment
- **Render**: Full-stack deployment with database

## 📈 Monitoring & Maintenance

### Database Management:
- Use **Prisma Studio** for database inspection
- Monitor **family growth** and **chore completion**
- Regular **backup** of production database

### Performance:
- **JWT sessions** for fast authentication
- **Optimized queries** with Prisma
- **Client-side caching** for better UX

## 🆘 Troubleshooting

### Common Issues:
1. **Database connection**: Verify DATABASE_URL format
2. **OAuth errors**: Check redirect URIs in Google Console
3. **Permission errors**: Ensure user roles are properly set
4. **Schema mismatch**: Run `npm run db:push:production`

### Support:
- Check browser console for client-side errors
- Review server logs for API errors
- Verify environment variables are set correctly

---

## 🎉 Your Admin Panel is Production-Ready!

The admin system includes all requested features:
- ✅ Role-based member management
- ✅ Comprehensive chore system
- ✅ Secure ownership transfer
- ✅ Family deletion controls
- ✅ Calendar integration ready
- ✅ Points system foundation

Deploy with confidence! 🚀
