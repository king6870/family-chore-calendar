const fs = require('fs');
const path = require('path');

// Get all TypeScript files in the API directory
function getAllTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixUserLookupPattern(filePath) {
  console.log(`Fixing user lookup in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Pattern 1: Fix session check and add user lookup
  if (content.includes('if (!session?.user?.email)')) {
    // Check if user lookup already exists
    if (!content.includes('const user = await prisma.user.findUnique')) {
      // Add user lookup after session check
      const sessionCheckPattern = /(if \(!session\?\.\?user\?\.\?email\) \{\s*return NextResponse\.json\(\{ error: ['"]Unauthorized['"] \}, \{ status: 401 \}\);\s*\})/;
      
      if (sessionCheckPattern.test(content)) {
        content = content.replace(
          sessionCheckPattern,
          `$1

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }`
        );
        changed = true;
      }
    }
  }
  
  // Pattern 2: Fix any remaining user.id references that should be using the looked up user
  if (content.includes('where: { id: user.id }') && content.includes('const user = await prisma.user.findUnique({')) {
    // This is the problematic pattern where user.id is used in its own declaration
    // We need to find these and fix them
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('const user = await prisma.user.findUnique({') && 
          i + 1 < lines.length && 
          lines[i + 1].includes('where: { id: user.id }')) {
        // This is a problematic pattern - remove this duplicate lookup
        // Find the end of this findUnique call
        let j = i + 1;
        let braceCount = 1;
        while (j < lines.length && braceCount > 0) {
          j++;
          if (lines[j].includes('{')) braceCount++;
          if (lines[j].includes('}')) braceCount--;
        }
        // Remove these lines
        lines.splice(i, j - i + 1);
        changed = true;
        break;
      }
    }
    if (changed) {
      content = lines.join('\n');
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed user lookup in ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
  }
}

// Get all API files
const apiDir = 'app/api';
const allFiles = getAllTsFiles(apiDir);

console.log(`🔧 Fixing user lookup patterns in ${allFiles.length} files...`);

// Fix each file
allFiles.forEach(fixUserLookupPattern);

console.log('✅ User lookup fixes complete!');
