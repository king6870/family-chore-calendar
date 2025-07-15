# 🚀 Vercel Deployment Guide

## Step 1: Set Up Database (Supabase - Free)

### 1.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub
3. Click "New Project"
4. Choose organization and enter:
   - **Name**: `chore-calendar`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to you
5. Click "Create new project"

### 1.2 Get Database URL
1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** → **URI**
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual password

## Step 2: Set Up Google OAuth for Production

### 2.1 Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Add to **Authorized redirect URIs**:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
   (Replace `your-app-name` with your actual Vercel app name)

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI
```bash
npm i -g vercel
```

### 3.2 Login to Vercel
```bash
vercel login
```

### 3.3 Deploy from Your Project Directory
```bash
cd /mnt/c/Users/lionv/nextjs-auth-app
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your personal account
- **Link to existing project?** → No
- **Project name?** → `family-chore-calendar` (or your choice)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

### 3.4 Set Environment Variables
After deployment, set up environment variables:

```bash
# Set database URL
vercel env add DATABASE_URL

# Set NextAuth URL (replace with your actual Vercel URL)
vercel env add NEXTAUTH_URL

# Set NextAuth secret
vercel env add NEXTAUTH_SECRET

# Set Google OAuth credentials
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
```

**Values to use:**
- `DATABASE_URL`: Your Supabase connection string
- `NEXTAUTH_URL`: `https://your-app-name.vercel.app`
- `NEXTAUTH_SECRET`: Generate with: `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console

### 3.5 Set Up Database Schema
```bash
# Deploy database schema to production
vercel env pull .env.local
npx prisma db push
```

### 3.6 Redeploy with Environment Variables
```bash
vercel --prod
```

## Step 4: Test Your Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Test Google sign-in
3. Create a family
4. Test family joining with invite code

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain
1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS setup instructions

### 5.2 Update Google OAuth
1. Add your custom domain to Google OAuth redirect URIs:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

## Environment Variables Summary

Create these in Vercel dashboard or via CLI:

| Variable | Example Value | Where to Get |
|----------|---------------|--------------|
| `DATABASE_URL` | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` | Supabase Dashboard |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel URL |
| `NEXTAUTH_SECRET` | `abc123...` | Generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | `123456789-abc.apps.googleusercontent.com` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-abc123...` | Google Cloud Console |

## Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL is correct
- Check Supabase project is active
- Verify password in connection string

### OAuth Issues
- Verify redirect URIs in Google Console
- Check NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_SECRET is set

### Build Issues
- Check all environment variables are set
- Verify Prisma schema is valid
- Check build logs in Vercel dashboard

## Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment logs
vercel logs

# Pull environment variables locally
vercel env pull .env.local

# Push database schema
npx prisma db push

# View database
npx prisma studio
```

## Cost Breakdown

- **Vercel**: Free (Hobby plan)
- **Supabase**: Free (up to 500MB database)
- **Google OAuth**: Free
- **Total**: $0/month for personal use

Your family chore calendar will be live at `https://your-app-name.vercel.app`!
