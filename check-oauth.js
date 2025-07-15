// Google OAuth Configuration Checker

console.log('🔍 Checking Google OAuth Configuration...')
console.log('')

// Check environment variables
const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const nextAuthUrl = process.env.NEXTAUTH_URL

console.log('📋 Current Configuration:')
console.log(`GOOGLE_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Missing'}`)
console.log(`GOOGLE_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Missing'}`)
console.log(`NEXTAUTH_URL: ${nextAuthUrl || 'Not set'}`)
console.log('')

if (clientId) {
  console.log('🔧 Your Google OAuth Client ID:')
  console.log(clientId)
  console.log('')
  
  console.log('📝 Required Google Cloud Console Settings:')
  console.log('')
  console.log('1. Authorized JavaScript origins:')
  console.log('   http://localhost:3000')
  console.log('   https://your-app.vercel.app')
  console.log('')
  console.log('2. Authorized redirect URIs:')
  console.log('   http://localhost:3000/api/auth/callback/google')
  console.log('   https://your-app.vercel.app/api/auth/callback/google')
  console.log('')
  console.log('🌐 Replace "your-app.vercel.app" with your actual domain!')
}

console.log('🔗 Google Cloud Console URL:')
console.log('https://console.cloud.google.com/apis/credentials')
console.log('')
console.log('⚠️  Make sure to:')
console.log('1. Add your production domain to Google OAuth settings')
console.log('2. Set NEXTAUTH_URL to your production domain')
console.log('3. Redeploy after making changes')
