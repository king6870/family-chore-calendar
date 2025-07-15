# 🔧 Production Database Fix - Add isOwner Column

## The Problem:
Your production database is missing the `isOwner` column that the admin panel needs.

## 🎯 Quick Fix - Run SQL in Supabase

### Step 1: Go to Supabase Dashboard
1. **Go to**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to SQL Editor** (left sidebar)

### Step 2: Run This SQL Command
```sql
-- Add isOwner column to User table
ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- Update existing family creators to be owners
UPDATE "User" 
SET "isOwner" = true 
WHERE "isAdmin" = true;
```

### Step 3: Verify the Fix
```sql
-- Check if column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'isOwner';
```

## 🚀 Alternative - Use Prisma Studio

### Step 1: Connect to Production Database
1. **Temporarily update your .env.local**:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.qciwiasvbbsbwqrenwxk.supabase.co:5432/postgres"
   ```

2. **Run Prisma Studio**:
   ```bash
   npx prisma studio
   ```

3. **Check if User table has isOwner column**

### Step 2: If Column Missing, Add It
Run the SQL commands above in Supabase dashboard.

## ✅ After Running the SQL:

1. **Your production app should work**
2. **Admin panel will be accessible**
3. **No more adapter_error_getUserByAccount**

## 🎯 Expected Result:
- ✅ isOwner column added to User table
- ✅ Existing admins become owners
- ✅ Admin panel functional
- ✅ Authentication working

## 🚨 If You Don't Have Supabase Access:
Let me know and I'll help you set up the database migration properly with your credentials.
