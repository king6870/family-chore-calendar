const { PrismaClient } = require('@prisma/client');

async function testSuggestions() {
  console.log('🧪 Testing Suggestions functionality...');
  
  // Test 1: Check if Prisma client recognizes Suggestion model
  console.log('\n1️⃣ Testing Prisma Client...');
  const prisma = new PrismaClient();
  
  try {
    // Check if suggestion model exists in Prisma client
    if (prisma.suggestion) {
      console.log('✅ Prisma client has suggestion model');
    } else {
      console.log('❌ Prisma client missing suggestion model');
      console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
    }

    // Test 2: Try to count suggestions
    console.log('\n2️⃣ Testing database connection...');
    const count = await prisma.suggestion.count();
    console.log(`✅ Database connection successful. Current suggestions: ${count}`);

    // Test 3: Try to create a test suggestion
    console.log('\n3️⃣ Testing suggestion creation...');
    const testSuggestion = await prisma.suggestion.create({
      data: {
        title: 'Test Suggestion from Script',
        description: 'This is a test suggestion to verify the API works',
        category: 'general',
        priority: 'low',
        status: 'pending',
        userEmail: 'test@example.com',
        userName: 'Test User'
      }
    });
    
    console.log('✅ Test suggestion created:', testSuggestion.id);
    console.log('📋 Suggestion data:', {
      title: testSuggestion.title,
      category: testSuggestion.category,
      createdAt: testSuggestion.createdAt
    });

    // Test 4: Retrieve the suggestion
    console.log('\n4️⃣ Testing suggestion retrieval...');
    const retrieved = await prisma.suggestion.findUnique({
      where: { id: testSuggestion.id }
    });
    
    if (retrieved) {
      console.log('✅ Suggestion retrieved successfully');
    } else {
      console.log('❌ Could not retrieve suggestion');
    }

    // Test 5: Clean up
    console.log('\n5️⃣ Cleaning up test data...');
    await prisma.suggestion.delete({
      where: { id: testSuggestion.id }
    });
    console.log('✅ Test suggestion deleted');

    // Test 6: Final count
    const finalCount = await prisma.suggestion.count();
    console.log(`📊 Final suggestion count: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }

  // Test 7: Test the API endpoint
  console.log('\n7️⃣ Testing API endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'API Test Suggestion',
        description: 'Testing the suggestions API endpoint',
        category: 'general',
        priority: 'medium'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API endpoint working:', result.message);
      if (result.suggestionId) {
        console.log('✅ Suggestion ID returned:', result.suggestionId);
      }
    } else {
      console.log('❌ API endpoint failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (apiError) {
    console.log('⚠️ Could not test API endpoint (server may not be running):', apiError.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('- If all tests pass, suggestions should work in production');
  console.log('- If tests fail, there may be a schema or database issue');
  console.log('- Check the Prisma client generation and database connection');
}

testSuggestions().catch(console.error);
