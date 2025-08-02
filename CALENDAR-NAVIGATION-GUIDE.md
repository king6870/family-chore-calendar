# 📅 **Calendar Navigation Guide**

## 🎯 **How to Access the NEW Drag & Drop Calendar:**

### **✅ CORRECT Path:**
1. **Sign in** to the application
2. **Click "👥 Family" tab** in the main navigation
3. **Click "📅 Drag & Drop Calendar" tab** within the Family section

### **❌ WRONG Path (Causes Error):**
- Don't click the old "📅 Calendar" tab in main navigation
- That's the old calendar component with the filter bug

## 🗂️ **Tab Structure:**

```
Main Navigation:
├── 🏠 Home
├── 👥 Family ← CLICK HERE FIRST
│   ├── 📊 Overview
│   ├── 👥 Members (Admin)
│   ├── 🧹 Chore Management (Admin)
│   └── 📅 Drag & Drop Calendar (Admin) ← THEN CLICK HERE
├── 📅 Calendar ← DON'T CLICK (Old calendar with bug)
├── 🏆 Points
└── 🛒 Rewards
```

## 🎮 **Step-by-Step:**

### **1. Navigate to Family Tab:**
- Look for "👥 Family" in the main horizontal navigation
- Click it to enter the enhanced family management interface

### **2. Find the Calendar Tab:**
- Inside the Family section, you'll see sub-tabs
- Look for "📅 Drag & Drop Calendar" 
- This is the NEW calendar with drag & drop functionality

### **3. Admin Access Required:**
- You need admin privileges to see the calendar tab
- If you don't see it, you might not be an admin in your family

## 🔧 **If You Still Get Errors:**

### **Clear Browser Cache:**
```bash
# Hard refresh the page
Ctrl + F5 (Windows/Linux)
Cmd + Shift + R (Mac)
```

### **Check Console:**
- Press F12 to open developer tools
- Look for any error messages in the Console tab
- This will help identify the specific issue

## 🎯 **Features You'll See:**

### **In the Drag & Drop Calendar:**
- **Available Chores Panel** at the top
- **Weekly Grid** with family members and days
- **Drag & Drop Interface** for assigning chores
- **Color-coded Difficulty** levels
- **Age Validation** messages
- **Week Navigation** buttons

## 🚨 **Troubleshooting:**

### **If Calendar Tab is Missing:**
- You might not be an admin - ask the family owner to promote you
- Try refreshing the page after being promoted

### **If Drag & Drop Doesn't Work:**
- Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Try disabling browser extensions temporarily
- Check if JavaScript is enabled

### **If API Errors Occur:**
- Make sure the development server is running
- Check that the database is properly set up
- Try running `./fix-local-dev.sh` again

## ✅ **Success Indicators:**

You'll know you're in the right place when you see:
- **"📅 Drag & Drop Chore Calendar"** as the page title
- **Available Chores panel** at the top with draggable chore tiles
- **Weekly calendar grid** with family member names on the left
- **Previous Week / Next Week** navigation buttons

**The drag & drop calendar is a completely new feature - make sure you're accessing it through the Family tab! 🎯**
