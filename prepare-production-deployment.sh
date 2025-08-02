#!/bin/bash

echo "🔧 PRODUCTION DEPLOYMENT PREPARATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Step 1: Backup current schema
print_info "Backing up current schema..."
if [ -f "prisma/schema.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.development.backup
    print_status "Development schema backed up"
fi

# Step 2: Switch to production schema
print_info "Switching to production PostgreSQL schema..."
if [ -f "schema-production.prisma" ]; then
    cp schema-production.prisma prisma/schema.prisma
    print_status "Production PostgreSQL schema activated"
else
    print_error "Production schema not found at schema-production.prisma"
    exit 1
fi

# Step 3: Validate the schema switch
print_info "Validating schema switch..."
if grep -q 'provider = "postgresql"' prisma/schema.prisma; then
    print_status "Schema successfully switched to PostgreSQL"
else
    print_error "Schema switch failed - still using SQLite"
    exit 1
fi

# Step 4: Run validation
print_info "Running production setup validation..."
if node validate-production-setup.js; then
    print_status "Production setup validation passed!"
else
    print_warning "Validation found issues - check output above"
    echo ""
    read -p "Continue with deployment despite warnings? (y/n): " continue_deploy
    if [ "$continue_deploy" != "y" ] && [ "$continue_deploy" != "Y" ]; then
        print_info "Deployment preparation cancelled"
        
        # Restore development schema
        if [ -f "prisma/schema.development.backup" ]; then
            mv prisma/schema.development.backup prisma/schema.prisma
            print_status "Development schema restored"
        fi
        
        exit 0
    fi
fi

echo ""
print_status "Production deployment preparation complete!"
echo ""
print_info "✅ PostgreSQL schema activated"
print_info "✅ Drag & drop calendar components verified"
print_info "✅ Environment configuration checked"
echo ""
print_warning "IMPORTANT REMINDERS:"
print_warning "1. Ensure Vercel environment variables are set with REAL values"
print_warning "2. Replace placeholder values in Vercel dashboard:"
print_warning "   - NEXTAUTH_SECRET (generate a secure random string)"
print_warning "   - GOOGLE_CLIENT_ID (from Google Cloud Console)"
print_warning "   - GOOGLE_CLIENT_SECRET (from Google Cloud Console)"
print_warning "3. Verify DATABASE_URL points to production PostgreSQL database"
echo ""
print_info "Ready to deploy! Run: ./deploy-production-bulletproof.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
