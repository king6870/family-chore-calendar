# 🔧 SIMPLE ADMIN PANEL FIX

## Step 1: Reset Database
```bash
node reset-db.js
```

## Step 2: Recreate Database
```bash
npx prisma db push
```

## Step 3: Start App
```bash
npm run dev
```

## Step 4: Test Admin Panel
1. Go to http://localhost:3000
2. Sign in with Google
3. Create a family (you become owner automatically)
4. Look for "🛠️ Admin" tab in navigation
5. Click it to access admin panel

## If Still Not Working:

### Clear Browser Data:
1. Open DevTools (F12)
2. Go to Application tab
3. Clear all cookies for localhost:3000
4. Refresh page

### Check Console:
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

## Admin Panel Features:
- **👥 Members**: Promote/demote admins, kick members
- **📋 Chores**: Create/edit/delete chores  
- **⚠️ Danger Zone**: Delete family (owner only)

## Troubleshooting:
- Make sure you're the family creator (automatic owner)
- Admin tab only shows for admins/owners
- Check browser console for JavaScript errors
- Try different browser or incognito mode
