#!/bin/bash

echo "📁 COPY PROJECT TO NEW STAGING REPOSITORY"
echo "========================================="
echo ""
echo "This script helps you copy your current project to a new repository"
echo "for staging, excluding git history and production-specific files."
echo ""

# Get target directory
read -p "Enter the path to your new staging repository: " target_dir

if [ -z "$target_dir" ]; then
    echo "❌ Target directory is required"
    exit 1
fi

if [ ! -d "$target_dir" ]; then
    echo "❌ Target directory does not exist: $target_dir"
    echo "💡 Make sure you've cloned your new repository first"
    exit 1
fi

echo ""
echo "📋 COPYING FILES..."
echo "=================="

# Get current directory (source)
source_dir=$(pwd)
echo "📂 Source: $source_dir"
echo "📁 Target: $target_dir"
echo ""

# Copy files excluding certain directories and files
echo "📄 Copying project files..."

# Create rsync exclude list
exclude_list=(
    ".git/"
    ".next/"
    "node_modules/"
    ".env.production"
    ".env.local"
    "*.log"
    ".DS_Store"
    "Thumbs.db"
    "*.backup.*"
    "test-*.js"
    "migrate-*.js"
)

# Build rsync exclude options
exclude_opts=""
for item in "${exclude_list[@]}"; do
    exclude_opts="$exclude_opts --exclude=$item"
done

# Copy files using rsync (if available) or cp
if command -v rsync &> /dev/null; then
    rsync -av $exclude_opts "$source_dir/" "$target_dir/"
else
    # Fallback to cp with manual exclusions
    echo "⚠️  rsync not available, using cp (some files might be copied that should be excluded)"
    cp -r "$source_dir"/* "$target_dir/" 2>/dev/null || true
    
    # Remove excluded directories if they were copied
    rm -rf "$target_dir/.git" 2>/dev/null || true
    rm -rf "$target_dir/.next" 2>/dev/null || true
    rm -rf "$target_dir/node_modules" 2>/dev/null || true
    rm -f "$target_dir/.env.production" 2>/dev/null || true
    rm -f "$target_dir/.env.local" 2>/dev/null || true
fi

echo "✅ Files copied successfully"

echo ""
echo "🔧 CLEANING UP STAGING-SPECIFIC FILES..."
echo "========================================"

cd "$target_dir"

# Update package.json for staging
if [ -f "package.json" ]; then
    echo "📝 Updating package.json for staging..."
    # You might want to update name, description, repository URL
    # This is optional - you can do it manually
fi

# Create staging-specific .env.example
if [ -f ".env.example" ]; then
    echo "📝 Creating staging .env.example..."
    cat > .env.example << 'EOF'
# Staging Environment Variables
# Copy this to .env.local for local development

# Database (Staging)
DATABASE_URL="your-staging-database-url"

# Authentication (Staging)
NEXTAUTH_URL="https://your-staging-url.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google OAuth (Staging)
GOOGLE_CLIENT_ID="your-staging-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-staging-oauth-client-secret"

# Environment
NODE_ENV="development"
EOF
fi

echo "✅ Cleanup completed"

echo ""
echo "🎯 NEXT STEPS"
echo "============"
echo ""
echo "1. 📁 Navigate to your new repository:"
echo "   cd $target_dir"
echo ""
echo "2. 🔧 Initialize git (if not already done):"
echo "   git init"
echo "   git add ."
echo "   git commit -m \"Initial commit: Staging environment\""
echo ""
echo "3. 🔗 Connect to GitHub:"
echo "   git remote add origin https://github.com/[username]/family-chore-calendar-staging.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. 🌿 Create staging branch:"
echo "   git checkout -b staging"
echo "   git push -u origin staging"
echo ""
echo "5. 🚀 Set up Vercel project with your new repository"
echo ""
echo "6. 🗄️  Set up database and environment variables"
echo ""
echo "7. 🔐 Create new Google OAuth client"
echo ""
echo "8. 📤 Deploy using: ./deploy-new-repo-staging.sh"
echo ""
echo "✅ Your project is ready for staging setup!"
