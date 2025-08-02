// Debug script to test API endpoints
// Run with: node debug-api.js

const testEndpoints = [
  '/api/assignments',
  '/api/chores',
  '/api/user/profile'
];

console.log('🔍 API Debugging Helper');
console.log('This script helps identify API response issues');
console.log('');
console.log('📋 Endpoints to test manually:');
testEndpoints.forEach(endpoint => {
  console.log(`  - ${endpoint}`);
});
console.log('');
console.log('🛠️  To debug in browser:');
console.log('1. Open browser dev tools (F12)');
console.log('2. Go to Network tab');
console.log('3. Perform calendar operations');
console.log('4. Check for failed requests (red status codes)');
console.log('5. Look at response body for error details');
console.log('');
console.log('🔧 Common issues to check:');
console.log('- Response status codes (should be 200 for success)');
console.log('- Response body format (should be valid JSON)');
console.log('- Console errors in browser');
console.log('- Network timeouts or connection issues');
