# 📊 How to View User Suggestions

## 🗄️ Database Access Methods

### Method 1: Prisma Studio (Recommended)
```bash
cd /mnt/c/Users/lionv/nextjs-auth-app
npx prisma studio
```
- Opens web interface at http://localhost:5555
- Navigate to "Suggestion" table
- View all suggestions with full context
- Filter by category, priority, status
- Edit suggestion status if needed

### Method 2: Direct Database Query
```bash
# SQLite (Local Development)
sqlite3 prisma/dev.db
SELECT * FROM Suggestion ORDER BY createdAt DESC;

# Or with formatted output
SELECT 
  title,
  category,
  priority,
  userName,
  userEmail,
  createdAt,
  description
FROM Suggestion 
ORDER BY priority DESC, createdAt DESC;
```

### Method 3: Production Database (Vercel Postgres)
```bash
# Connect to production database
vercel env pull .env.temp
# Use DATABASE_URL from .env.temp to connect via your preferred DB client
```

## 📋 Suggestion Data Structure

Each suggestion contains:
- **id**: Unique identifier
- **title**: Brief summary
- **description**: Detailed feedback
- **category**: general, feature, bug, improvement
- **priority**: low, medium, high
- **status**: pending, reviewed, implemented, rejected
- **userId**: User ID (if logged in)
- **familyId**: Family context (if applicable)
- **userEmail**: User's email or "anonymous"
- **userName**: User's display name
- **createdAt**: Submission timestamp
- **updatedAt**: Last modification

## 🎯 Common Queries

### View Recent Suggestions
```sql
SELECT title, category, priority, userName, createdAt 
FROM Suggestion 
ORDER BY createdAt DESC 
LIMIT 10;
```

### View High Priority Items
```sql
SELECT * FROM Suggestion 
WHERE priority = 'high' 
ORDER BY createdAt DESC;
```

### View Bug Reports
```sql
SELECT * FROM Suggestion 
WHERE category = 'bug' 
ORDER BY createdAt DESC;
```

### View Feature Requests
```sql
SELECT * FROM Suggestion 
WHERE category = 'feature' 
ORDER BY createdAt DESC;
```

### Update Suggestion Status
```sql
UPDATE Suggestion 
SET status = 'reviewed', updatedAt = datetime('now') 
WHERE id = 'suggestion_id_here';
```

## 🔧 Status Management

You can update suggestion statuses:
- **pending**: New submission (default)
- **reviewed**: You've seen and considered it
- **implemented**: Feature/fix has been added
- **rejected**: Not feasible or not aligned with goals

## 📱 User Experience

Users see the floating button on every page:
- **Purple gradient button** in bottom-right corner
- **Lightbulb icon** indicating suggestions/ideas
- **Modal form** with category and priority selection
- **Success confirmation** after submission
- **Anonymous submissions** allowed for non-logged users

## 🎉 Benefits

- **Direct user feedback** channel
- **Categorized suggestions** for easy organization  
- **Priority levels** to focus on important items
- **User context** to understand who's suggesting what
- **Family context** to see which families need specific features
- **Database flexibility** to query and analyze feedback trends
