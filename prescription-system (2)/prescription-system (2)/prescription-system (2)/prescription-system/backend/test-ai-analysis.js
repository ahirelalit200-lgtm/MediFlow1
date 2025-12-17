/**
 * Test script for Dental X-ray AI Analysis
 * Run: node backend/test-ai-analysis.js
 */

// Node.js 18+ has built-in fetch, no need to import

// Sample base64 image (1x1 pixel PNG for testing)
const sampleImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testXrayAnalysis() {
  console.log('🧪 Testing Dental X-ray AI Analysis...\n');

  try {
    console.log('📤 Sending X-ray for analysis...');
    const response = await fetch('http://localhost:5000/api/xray-analysis/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageDataUrl: sampleImageDataUrl,
        xrayType: 'panoramic'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('✅ Analysis Complete!\n');
    console.log('📊 RESULTS:');
    console.log('─'.repeat(50));
    console.log(`Success: ${result.success}`);
    console.log(`X-ray Type: ${result.xrayType}`);
    console.log(`Severity: ${result.severity}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Timestamp: ${result.timestamp}\n`);

    console.log('🔍 FINDINGS:');
    result.findings.forEach((finding, index) => {
      console.log(`\n${index + 1}. ${finding.type}`);
      console.log(`   Location: ${finding.location}`);
      console.log(`   Severity: ${finding.severity}`);
      console.log(`   Confidence: ${(finding.confidence * 100).toFixed(1)}%`);
      console.log(`   Description: ${finding.description}`);
    });

    console.log('\n💡 RECOMMENDATIONS:');
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n' + '─'.repeat(50));
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
    console.error('\n💡 Make sure:');
    console.error('   1. Server is running (npm run dev)');
    console.error('   2. Server is on http://localhost:5000');
    console.error('   3. AI analysis routes are loaded');
    console.error('\n🔍 Trying to check if server is running...');
    
    try {
      const serverCheck = await fetch('http://localhost:5000/');
      console.log('✅ Server is responding on port 5000');
      console.log('⚠️  But AI analysis endpoint is not available');
      console.log('   Check server logs for: "🤖 X-ray Analysis API mounted"');
    } catch (e) {
      console.error('❌ Server is NOT running on http://localhost:5000');
      console.error('   Start it with: npm run dev');
    }
  }
}

// Run test
testXrayAnalysis();
