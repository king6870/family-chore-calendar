# Family Chore Calendar

A comprehensive Next.js application for managing family chores with Google authentication, point tracking, and intelligent assignment distribution.

## 🌟 Features

### Core Functionality
- **Google OAuth Authentication** - Secure family member login
- **Family Groups** - Create or join families with unique invite codes
- **Smart Chore Assignment** - Automatic distribution based on age and point balance
- **Point Tracking System** - Earn points for completed chores
- **Weekly Goals** - Set and track family point targets
- **Age-Based Restrictions** - Ensure appropriate chores for each family member

### Family Management
- **S, L, M, P Member System** - Use nicknames for easy identification
- **Age Tracking** - Automatic chore filtering based on minimum age requirements
- **Admin Controls** - Family creators get administrative privileges
- **Invite System** - Easy family joining with 6-character codes

### Chore System
- **Three Difficulty Levels**: Easy (5-10 pts), Medium (15-20 pts), Hard (25-40 pts)
- **Age Requirements** - Chores filtered by minimum age (e.g., cooking requires 12+ years)
- **Point Balance** - Automatic distribution ensures equal workload
- **Calendar View** - Visual weekly chore calendar
- **Completion Tracking** - Mark chores complete and earn points instantly

### Default Chores Included
**Easy Chores (Ages 3-6+)**:
- Make bed (5 pts)
- Put toys away (5 pts)
- Feed pets (10 pts)
- Set the table (8 pts)
- Water plants (8 pts)

**Medium Chores (Ages 8-10+)**:
- Load dishwasher (15 pts)
- Vacuum living room (20 pts)
- Take out trash (15 pts)
- Fold laundry (20 pts)
- Clean bathroom sink (15 pts)

**Hard Chores (Ages 12-16+)**:
- Cook dinner (35 pts) - Kids S & L can do this if 12+
- Mow the lawn (30 pts)
- Deep clean kitchen (40 pts)
- Grocery shopping (25 pts)
- Clean entire bathroom (30 pts)

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd /mnt/c/Users/lionv/nextjs-auth-app
npm install
```

### 2. Set up Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Client Secret

### 3. Configure Environment Variables
Update `.env.local` with your credentials:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="hSx7PjeugAKPk0lWLkuDrAjwE8v132a02GM4rtZ5zuc="
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Set up Database
```bash
npx prisma db push
npx prisma generate
```

### 5. Start the Application
```bash
npm run dev
```

Visit `http://localhost:3000` to get started!

## 📱 How to Use

### Getting Started
1. **Sign in** with your Google account
2. **Create a family** (first member becomes admin) or **join existing family** with invite code
3. **Set your nickname** (S, L, M, P, etc.) and **age**

### For Family Admins
1. **Manage Chores**: Add, edit, or delete chores with custom points and age requirements
2. **Generate Assignments**: Automatically distribute chores for the week
3. **Set Weekly Goals**: Adjust point targets for family members
4. **View Family Stats**: Monitor completion rates and point distribution

### For Family Members
1. **View Calendar**: See your assigned chores for each day
2. **Complete Chores**: Check off completed tasks to earn points
3. **Track Progress**: Monitor your weekly points and goal progress
4. **View Family Stats**: See how everyone is doing

## 🎯 Key Requirements Met

✅ **Points System**: Each chore has appropriate point values (5-40 points)
✅ **Calendar Integration**: Weekly calendar view with daily chore assignments
✅ **Member Nicknames**: S, L, M, P system for easy identification
✅ **Equal Distribution**: Smart algorithm ensures balanced chore assignment
✅ **Point Tracking**: Real-time point tracking for all family members
✅ **Weekly Goals**: Customizable point targets with progress tracking
✅ **Age Restrictions**: Minimum age requirements for each chore (kids can cook if 12+)
✅ **Authentication**: Secure Google OAuth login system
✅ **Admin Controls**: Full management of chores, members, and settings
✅ **Family Groups**: Create and join families with invite codes
✅ **Customizable**: All chores, points, ages, and goals can be modified

## 🛠 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Update database schema
- `npm run db:studio` - Open Prisma Studio (database GUI)

## 📊 Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── admin/             # Admin management endpoints
│   │   ├── assignments/       # Chore assignment endpoints
│   │   ├── auth/              # NextAuth configuration
│   │   ├── family/            # Family creation/joining
│   │   ├── points/            # Point tracking endpoints
│   │   └── user/              # User data endpoints
│   ├── components/            # React components
│   │   ├── AdminPanel.tsx     # Family administration
│   │   ├── ChoreCalendar.tsx  # Weekly calendar view
│   │   ├── FamilySetup.tsx    # Family creation/joining
│   │   └── PointsTracker.tsx  # Point tracking dashboard
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main application page
│   └── providers.tsx          # Session provider
├── lib/
│   ├── auth.ts                # NextAuth configuration
│   └── prisma.ts              # Database client
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Default chore data
└── ...config files
```

## 🔧 Technologies Used

- **Next.js 14** - React framework with App Router
- **NextAuth.js** - Authentication with Google OAuth
- **Prisma** - Database ORM with SQLite
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety throughout the application

## 🎨 Features in Detail

### Smart Assignment Algorithm
- Distributes chores based on age eligibility
- Balances points across family members
- Ensures everyone reaches weekly goals
- Considers chore difficulty and member capacity

### Point System
- **Easy**: 5-10 points (basic daily tasks)
- **Medium**: 15-20 points (regular household chores)
- **Hard**: 25-40 points (complex tasks requiring skill/time)

### Age-Based Safety
- Prevents young children from dangerous tasks
- Allows older kids (S, L if 12+) to handle cooking
- Customizable age requirements for each chore
- Admin can adjust restrictions as needed

This comprehensive chore calendar system helps families stay organized, teaches responsibility, and ensures fair distribution of household tasks!
# Force deployment Fri Aug  1 22:09:41 PDT 2025
