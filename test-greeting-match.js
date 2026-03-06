// Test greeting matching
const message = "नमस्कार";
const lowerMessage = message.toLowerCase().trim().replace(/[।.!?]/g, '');

console.log('Testing message:', message);
console.log('Lower message:', lowerMessage);
console.log('After trim and punctuation removal:', lowerMessage);

const greetingPattern = /(नमस्कार|नमस्ते|हाय|हॅलो)/i;
const testResult = greetingPattern.test(lowerMessage);

console.log('Greeting pattern test:', testResult);
console.log('Match result:', lowerMessage.match(greetingPattern));

// Simulate what should happen
if (testResult) {
  console.log('\n✅ Should return greeting type');
  const marathiResponses = {
    greeting: [
      "नमस्कार! मी तुमचा वैद्यकीय सहाय्यक आहे. आज मी तुम्हाला कशी मदत करू शकतो?",
      "नमस्ते! मी वैद्यकीय प्रश्न आणि सिस्टम नेव्हिगेशनसाठी मदत करण्यासाठी येथे आहे.",
      "स्वागत आहे! लक्षणे, औषधे किंवा या प्रणालीचा वापर कसा करावा याबद्दल विचारा."
    ]
  };
  console.log('Response:', marathiResponses.greeting[0]);
} else {
  console.log('\n❌ Greeting not matched');
}
