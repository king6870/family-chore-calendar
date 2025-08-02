#!/bin/bash

echo "🚀 SAFE PRODUCTION DEPLOYMENT SCRIPT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  WARNING: This will deploy to LIVE PRODUCTION"
echo "🌐 URL: https://family-chore-calendar.vercel.app"
echo "👥 Users: Real family members will be affected"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    print_info "Validating deployment environment..."
    
    # Check required commands
    local required_commands=("git" "node" "npm" "npx")
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            print_error "$cmd is not installed or not in PATH"
            return 1
        fi
    done
    print_status "All required commands available"
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local major_version=$(echo $node_version | cut -d'.' -f1)
    if [ "$major_version" -lt 18 ]; then
        print_error "Node.js version $node_version is too old. Requires Node.js 18+"
        return 1
    fi
    print_status "Node.js version $node_version is compatible"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project directory?"
        return 1
    fi
    print_status "Project directory validated"
    
    # Check if git repo is initialized
    if [ ! -d ".git" ]; then
        print_error "Not a git repository. Initialize git first."
        return 1
    fi
    print_status "Git repository found"
    
    return 0
}

# Function to validate production environment files
validate_production_files() {
    print_info "Validating production configuration files..."
    
    # Check if production schema exists
    if [ ! -f "prisma/schema.prisma" ]; then
        print_error "Prisma schema not found"
        return 1
    fi
    print_status "Prisma schema found"
    
    # Check if production environment example exists
    if [ ! -f ".env.production" ]; then
        print_warning "No .env.production file found - will need to be configured in Vercel"
    else
        print_status "Production environment file found"
    fi
    
    # Check if build script exists
    if [ ! -f "scripts/build.js" ]; then
        print_error "Build script not found at scripts/build.js"
        return 1
    fi
    print_status "Build script found"
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        print_warning "No vercel.json found - using default Vercel settings"
    else
        print_status "Vercel configuration found"
    fi
    
    return 0
}

# Function to check for production-breaking changes
check_production_compatibility() {
    print_info "Checking production compatibility..."
    
    # Check for SQLite references that might break in production
    local sqlite_files=$(grep -r "sqlite" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ lib/ 2>/dev/null || true)
    if [ ! -z "$sqlite_files" ]; then
        print_warning "Found SQLite references in code - ensure they're development-only"
        echo "$sqlite_files"
    fi
    
    # Check for localhost references
    local localhost_refs=$(grep -r "localhost" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ lib/ 2>/dev/null || true)
    if [ ! -z "$localhost_refs" ]; then
        print_warning "Found localhost references - ensure they're development-only"
        echo "$localhost_refs"
    fi
    
    # Check for console.log statements (optional warning)
    local console_logs=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ lib/ 2>/dev/null | wc -l)
    if [ "$console_logs" -gt 0 ]; then
        print_warning "Found $console_logs console.log statements - consider removing for production"
    fi
    
    print_status "Production compatibility check completed"
    return 0
}

# Function to run tests and validation
run_pre_deployment_tests() {
    print_info "Running pre-deployment tests..."
    
    # Install dependencies
    print_info "Installing dependencies..."
    if ! npm ci --silent; then
        print_error "Failed to install dependencies"
        return 1
    fi
    print_status "Dependencies installed"
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    if ! npx prisma generate --silent; then
        print_error "Failed to generate Prisma client"
        return 1
    fi
    print_status "Prisma client generated"
    
    # Run TypeScript check
    print_info "Running TypeScript check..."
    if ! npx tsc --noEmit; then
        print_error "TypeScript errors found"
        return 1
    fi
    print_status "TypeScript check passed"
    
    # Run ESLint
    print_info "Running ESLint..."
    if ! npx eslint . --ext .ts,.tsx,.js,.jsx --quiet; then
        print_warning "ESLint warnings found - review before deploying"
    else
        print_status "ESLint check passed"
    fi
    
    # Test build process
    print_info "Testing production build..."
    if ! NODE_ENV=production npm run build:production; then
        print_error "Production build failed"
        return 1
    fi
    print_status "Production build successful"
    
    return 0
}

# Function to prepare for deployment
prepare_deployment() {
    print_info "Preparing for deployment..."
    
    # Ensure we're on main branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        print_warning "Currently on branch: $current_branch"
        read -p "Switch to main branch? (y/n): " switch_branch
        if [ "$switch_branch" = "y" ] || [ "$switch_branch" = "Y" ]; then
            git checkout main
            if [ $? -ne 0 ]; then
                print_error "Failed to switch to main branch"
                return 1
            fi
            print_status "Switched to main branch"
        else
            print_warning "Continuing deployment from $current_branch branch"
        fi
    fi
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Uncommitted changes found:"
        git status --short
        echo ""
        read -p "Commit these changes? (y/n): " commit_changes
        if [ "$commit_changes" = "y" ] || [ "$commit_changes" = "Y" ]; then
            read -p "Enter commit message: " commit_message
            git add .
            git commit -m "$commit_message"
            print_status "Changes committed"
        else
            print_error "Cannot deploy with uncommitted changes"
            return 1
        fi
    fi
    
    # Pull latest changes
    print_info "Pulling latest changes..."
    if ! git pull origin main; then
        print_error "Failed to pull latest changes"
        return 1
    fi
    print_status "Repository up to date"
    
    return 0
}

# Function to create production-ready schema
prepare_production_schema() {
    print_info "Preparing production database schema..."
    
    # Backup current schema
    if [ -f "prisma/schema.prisma" ]; then
        cp prisma/schema.prisma prisma/schema.backup.prisma
        print_status "Schema backed up"
    fi
    
    # Ensure we're using PostgreSQL schema for production
    if [ -f "prisma/schema.production.prisma" ]; then
        cp prisma/schema.production.prisma prisma/schema.prisma
        print_status "Production PostgreSQL schema activated"
    else
        # Check if current schema is already PostgreSQL
        if grep -q 'provider = "postgresql"' prisma/schema.prisma; then
            print_status "Schema already configured for PostgreSQL"
        else
            print_error "No production schema found and current schema is not PostgreSQL"
            return 1
        fi
    fi
    
    return 0
}

# Function to validate production environment variables
validate_production_env() {
    print_info "Validating production environment variables..."
    
    # List required environment variables
    local required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
    )
    
    print_warning "Ensure these environment variables are set in Vercel:"
    for var in "${required_vars[@]}"; do
        echo "  - $var"
    done
    
    # Check if .env.production exists and validate format
    if [ -f ".env.production" ]; then
        print_info "Checking .env.production format..."
        
        # Check for placeholder values
        if grep -q "your-.*-here" .env.production; then
            print_error "Found placeholder values in .env.production"
            grep "your-.*-here" .env.production
            return 1
        fi
        
        # Check for proper PostgreSQL URL format
        if grep -q "DATABASE_URL.*postgresql://" .env.production; then
            print_status "PostgreSQL database URL format validated"
        elif grep -q "DATABASE_URL.*postgres://" .env.production; then
            print_status "PostgreSQL database URL format validated"
        else
            print_error "Invalid or missing PostgreSQL DATABASE_URL in .env.production"
            return 1
        fi
        
        # Check for production URL
        if grep -q "NEXTAUTH_URL.*family-chore-calendar.vercel.app" .env.production; then
            print_status "Production NEXTAUTH_URL validated"
        else
            print_warning "NEXTAUTH_URL may not be set to production URL"
        fi
    fi
    
    return 0
}

# Function to display deployment summary
show_deployment_summary() {
    echo ""
    echo "📋 DEPLOYMENT SUMMARY"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎯 Target Environment: PRODUCTION"
    echo "🌐 URL: https://family-chore-calendar.vercel.app"
    echo "📊 Database: PostgreSQL (Production)"
    echo "🔐 Authentication: Google OAuth (Production credentials)"
    echo ""
    echo "✅ Pre-deployment Checks:"
    echo "  - Environment validation: PASSED"
    echo "  - Production files: VALIDATED"
    echo "  - Compatibility check: COMPLETED"
    echo "  - TypeScript compilation: PASSED"
    echo "  - Production build: SUCCESSFUL"
    echo "  - Database schema: PRODUCTION READY"
    echo ""
    echo "🚀 Deployment Actions:"
    echo "  1. Push code to GitHub main branch"
    echo "  2. Trigger Vercel production deployment"
    echo "  3. Database migrations (if needed)"
    echo "  4. Environment variables validation"
    echo ""
    echo "⚠️  IMPORTANT REMINDERS:"
    echo "  - Ensure Vercel environment variables are set"
    echo "  - Production database should be accessible"
    echo "  - Google OAuth credentials must be production-ready"
    echo "  - Monitor deployment logs for any issues"
    echo ""
}

# Function to execute deployment
execute_deployment() {
    print_info "Executing deployment to production..."
    
    # Push to GitHub
    print_info "Pushing to GitHub..."
    if ! git push origin main; then
        print_error "Failed to push to GitHub"
        return 1
    fi
    print_status "Code pushed to GitHub successfully"
    
    # Note: Vercel deployment will be triggered automatically by GitHub push
    # if Vercel is connected to the repository
    
    print_status "Deployment initiated!"
    print_info "Vercel will automatically deploy from the main branch"
    print_info "Monitor deployment at: https://vercel.com/dashboard"
    
    return 0
}

# Function to show post-deployment checklist
show_post_deployment_checklist() {
    echo ""
    echo "📝 POST-DEPLOYMENT CHECKLIST"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔍 Immediate Checks:"
    echo "  □ Visit https://family-chore-calendar.vercel.app"
    echo "  □ Test Google OAuth login"
    echo "  □ Create/join a family"
    echo "  □ Test chore creation and assignment"
    echo "  □ Test drag & drop functionality (admin)"
    echo "  □ Test chore completion and point awarding"
    echo "  □ Verify database connectivity"
    echo ""
    echo "🔧 If Issues Occur:"
    echo "  □ Check Vercel deployment logs"
    echo "  □ Verify environment variables in Vercel dashboard"
    echo "  □ Check database connection and permissions"
    echo "  □ Validate Google OAuth configuration"
    echo "  □ Monitor application logs for errors"
    echo ""
    echo "📊 Monitoring:"
    echo "  □ Set up error monitoring (Sentry, LogRocket, etc.)"
    echo "  □ Monitor database performance"
    echo "  □ Track user authentication success rates"
    echo "  □ Monitor API response times"
    echo ""
    echo "🔄 Rollback Plan:"
    echo "  □ Keep previous working commit hash: $(git rev-parse HEAD~1)"
    echo "  □ Vercel allows instant rollback to previous deployment"
    echo "  □ Database migrations may need manual rollback"
    echo ""
}

# Main deployment function
main() {
    echo "Starting production deployment process..."
    echo ""
    
    # Step 1: Validate environment
    if ! validate_environment; then
        print_error "Environment validation failed"
        exit 1
    fi
    
    # Step 2: Validate production files
    if ! validate_production_files; then
        print_error "Production files validation failed"
        exit 1
    fi
    
    # Step 3: Check production compatibility
    if ! check_production_compatibility; then
        print_error "Production compatibility check failed"
        exit 1
    fi
    
    # Step 4: Prepare production schema
    if ! prepare_production_schema; then
        print_error "Production schema preparation failed"
        exit 1
    fi
    
    # Step 5: Validate production environment variables
    if ! validate_production_env; then
        print_error "Production environment validation failed"
        exit 1
    fi
    
    # Step 6: Run pre-deployment tests
    if ! run_pre_deployment_tests; then
        print_error "Pre-deployment tests failed"
        exit 1
    fi
    
    # Step 7: Prepare for deployment
    if ! prepare_deployment; then
        print_error "Deployment preparation failed"
        exit 1
    fi
    
    # Step 8: Show deployment summary
    show_deployment_summary
    
    # Final confirmation
    echo ""
    print_warning "⚠️  FINAL CONFIRMATION REQUIRED"
    echo ""
    read -p "Are you absolutely sure you want to deploy to PRODUCTION? (type 'DEPLOY' to confirm): " final_confirmation
    
    if [ "$final_confirmation" != "DEPLOY" ]; then
        print_info "Deployment cancelled by user"
        
        # Restore schema backup if it exists
        if [ -f "prisma/schema.backup.prisma" ]; then
            mv prisma/schema.backup.prisma prisma/schema.prisma
            print_status "Schema restored to original state"
        fi
        
        exit 0
    fi
    
    # Step 9: Execute deployment
    if ! execute_deployment; then
        print_error "Deployment execution failed"
        exit 1
    fi
    
    # Step 10: Show post-deployment checklist
    show_post_deployment_checklist
    
    print_status "Production deployment completed successfully!"
    print_info "Monitor the deployment at: https://vercel.com/dashboard"
    print_info "Application URL: https://family-chore-calendar.vercel.app"
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Run main function
main "$@"
