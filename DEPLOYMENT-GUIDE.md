# 🚀 VERCEL DEPLOYMENT GUIDE

## 📋 Quick Deployment

### **Step 1: Prepare and Deploy**
```bash
./prepare-for-deployment.sh
```

This script will:
- ✅ Switch to production schema
- ✅ Test production build
- ✅ Commit all changes
- ✅ Push to GitHub
- ✅ Trigger Vercel auto-deployment

### **Step 2: Post-Deployment Setup**
```bash
./post-deployment.sh https://your-app-name.vercel.app
```

This script will:
- ✅ Run database migration
- ✅ Test critical endpoints
- ✅ Provide testing checklist

### **Step 3: Clean Up (After Testing)**
```bash
./cleanup-migration-routes.sh
git add . && git commit -m "Remove migration routes" && git push
```

## 🔧 What Gets Fixed

### **Database Issues Resolved:**
- ✅ `User.createdAt` and `User.updatedAt` columns
- ✅ `WeeklyGoal.pointsGoal` column (via migration)
- ✅ `ActivityLog.details` column (via migration)
- ✅ OAuth state cookie configuration

### **Application Features Fixed:**
- ✅ Google OAuth sign-in
- ✅ Family creation
- ✅ Points management
- ✅ Activity logging
- ✅ Weekly goals tracking

## 🚨 Troubleshooting

### **If Build Fails:**
```bash
# Check for TypeScript errors
npm run build

# Fix any schema mismatches
./switch-schema.sh production
npx prisma generate
npm run build
```

### **If Migration Fails:**
```bash
# Check Vercel function logs
# Verify DATABASE_URL in Vercel environment variables
# Manually run SQL in database console:

ALTER TABLE "WeeklyGoal" ADD COLUMN IF NOT EXISTS "pointsGoal" INTEGER;
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "details" TEXT;
```

### **If OAuth Fails:**
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel
- Verify `NEXTAUTH_URL` matches your Vercel domain
- Check `NEXTAUTH_SECRET` is set

## 📊 Environment Variables Checklist

Verify these are set in Vercel Dashboard → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🧪 Testing Checklist

After deployment, test these features:

- [ ] **OAuth Sign-in**: Google authentication works
- [ ] **Family Creation**: Can create family without errors
- [ ] **Points Management**: Can award/deduct points
- [ ] **Activity Logs**: Points transactions appear in logs
- [ ] **Weekly Goals**: Goals display and track properly
- [ ] **User Sessions**: Sessions persist across page reloads

## 🔄 Development Workflow

### **Local Development:**
```bash
./dev-start.sh  # Uses SQLite
```

### **Deploy Changes:**
```bash
./prepare-for-deployment.sh  # Switches to PostgreSQL, tests, deploys
```

### **Continue Development:**
```bash
./dev-start.sh  # Automatically switches back to SQLite
```

## 📁 File Structure

```
├── prisma/
│   ├── schema.prisma           # Active schema (switches between local/prod)
│   ├── schema.local.prisma     # SQLite schema for development
│   └── schema.production.prisma # PostgreSQL schema for production
├── app/api/
│   └── fix-remaining-columns/  # Migration route (remove after use)
├── prepare-for-deployment.sh   # Main deployment script
├── post-deployment.sh          # Post-deployment migration
├── cleanup-migration-routes.sh # Security cleanup
├── dev-start.sh               # Local development startup
└── switch-schema.sh           # Schema switching utility
```

## 🎯 Success Indicators

**Deployment Successful When:**
- ✅ Build completes without errors
- ✅ Migration returns `{"success": true}`
- ✅ OAuth sign-in works
- ✅ Family creation works
- ✅ Points management works
- ✅ No console errors in browser

**Ready for Production When:**
- ✅ All manual tests pass
- ✅ Migration routes removed
- ✅ No sensitive endpoints exposed
