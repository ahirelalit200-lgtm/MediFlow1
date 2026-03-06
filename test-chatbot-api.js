// Test script for chatbot API
const http = require('http');

function testChatbot(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      message: message,
      conversationId: 'test-' + Date.now()
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/chatbot/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Chatbot API...\n');

  const tests = [
    { name: 'Greeting', message: 'Hello' },
    { name: 'Symptom Query', message: 'What is fever?' },
    { name: 'Medication Query', message: 'How to use paracetamol?' },
    { name: 'System Feature', message: 'How do I create a prescription?' },
    { name: 'Emergency Detection', message: 'I have chest pain' },
    { name: 'Unknown Query', message: 'Tell me about quantum physics' }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📝 Test: ${test.name}`);
      console.log(`   Query: "${test.message}"`);
      
      const response = await testChatbot(test.message);
      
      if (response.success) {
        console.log(`   ✅ Success`);
        console.log(`   Response: ${response.response.substring(0, 100)}...`);
        if (response.suggestions) {
          console.log(`   Suggestions: ${response.suggestions.length} provided`);
        }
        if (response.type) {
          console.log(`   Type: ${response.type}`);
        }
      } else {
        console.log(`   ❌ Failed: ${response.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n✅ All tests completed!');
}

runTests().catch(console.error);
