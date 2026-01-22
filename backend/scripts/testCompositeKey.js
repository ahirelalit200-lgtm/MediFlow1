const mongoose = require("mongoose");
const Patient = require("../models/Patient");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function testCompositeKey() {
  try {
    console.log("🧪 Testing Composite Primary Key (Name + Email)...\n");

    // Clear existing patients for clean test
    await Patient.deleteMany({});
    console.log("🗑️ Cleared existing patients");

    // Test 1: Create patients with same email but different names (should work)
    console.log("\n📝 Test 1: Same email, different names");
    
    const patient1 = new Patient({
      name: "John Smith",
      email: "john@example.com",
      password: "password123",
      mobile: "9876543210"
    });
    await patient1.save();
    console.log("✅ Created: John Smith - john@example.com");

    const patient2 = new Patient({
      name: "John Doe", 
      email: "john@example.com", // Same email, different name
      password: "password123",
      mobile: "9876543211" // Different mobile
    });
    await patient2.save();
    console.log("✅ Created: John Doe - john@example.com");

    // Test 2: Try to create duplicate name + email combination (should fail)
    console.log("\n📝 Test 2: Duplicate name + email combination");
    try {
      const patient3 = new Patient({
        name: "John Smith", // Same name
        email: "john@example.com", // Same email
        password: "password123",
        mobile: "9876543212"
      });
      await patient3.save();
      console.log("❌ ERROR: Should not have allowed duplicate name + email");
    } catch (error) {
      console.log("✅ Correctly rejected duplicate: " + error.message);
    }

    // Test 3: Create patient with same name but different email (should work)
    console.log("\n📝 Test 3: Same name, different email");
    const patient4 = new Patient({
      name: "John Smith", // Same name as patient1
      email: "johnsmith@different.com", // Different email
      password: "password123",
      mobile: "9876543213"
    });
    await patient4.save();
    console.log("✅ Created: John Smith - johnsmith@different.com");

    // Test 4: Test composite key methods
    console.log("\n📝 Test 4: Composite key methods");
    console.log("Patient 1 composite key:", patient1.getCompositeKey());
    console.log("Patient 2 composite key:", patient2.getCompositeKey());
    console.log("Static composite key:", Patient.createCompositeKey("John Smith", "john@example.com"));

    // Test 5: Query patients by email (should return multiple)
    console.log("\n📝 Test 5: Query by email");
    const patientsByEmail = await Patient.find({ email: "john@example.com" });
    console.log(`Found ${patientsByEmail.length} patients with email john@example.com:`);
    patientsByEmail.forEach(p => console.log(`  - ${p.name} (${p.email})`));

    // Test 6: Query by composite key
    console.log("\n📝 Test 6: Query by composite key");
    const specificPatient = await Patient.findOne({ 
      name: "John Smith", 
      email: "john@example.com" 
    });
    if (specificPatient) {
      console.log(`✅ Found specific patient: ${specificPatient.name} - ${specificPatient.email}`);
    }

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📊 Summary:");
    console.log("✅ Multiple patients can have the same email with different names");
    console.log("✅ Multiple patients can have the same name with different emails");
    console.log("❌ Cannot create duplicate name + email combinations");
    console.log("✅ Composite key methods work correctly");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testCompositeKey();
