// Test script to verify X-ray database storage
// Run with: node test-xray.js

const mongoose = require("mongoose");
require("dotenv").config();

const Xray = require("./models/Xray");
const Prescription = require("./models/Prescription");

async function testXrayStorage() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB");
    console.log("✅ Connected to MongoDB");

    // Test 1: Create a test X-ray
    console.log("\n📝 Test 1: Creating test X-ray...");
    const testXray = new Xray({
      patientName: "Test Patient",
      mobile: "1234567890",
      doctor: "Dr. Test",
      name: "test-xray.jpg",
      type: "image/jpeg",
      size: 12345,
      dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // truncated for test
      notes: "Test X-ray upload"
    });

    const savedXray = await testXray.save();
    console.log("✅ X-ray saved successfully!");
    console.log("   ID:", savedXray._id);
    console.log("   Patient:", savedXray.patientName);
    console.log("   Doctor:", savedXray.doctor);

    // Test 2: Retrieve X-rays
    console.log("\n📝 Test 2: Retrieving X-rays...");
    const xrays = await Xray.find({ patientName: "Test Patient" });
    console.log(`✅ Found ${xrays.length} X-ray(s)`);

    // Test 3: Create prescription with X-ray
    console.log("\n📝 Test 3: Creating prescription with X-ray...");
    const testPrescription = new Prescription({
      patientName: "Test Patient 2",
      mobile: "9876543210",
      doctor: "Dr. Test",
      medicines: [
        { name: "Test Medicine", dosage: "1-0-1", duration: "7 days" }
      ],
      notes: "Test prescription with X-ray",
      xray: {
        name: "prescription-xray.jpg",
        type: "image/jpeg",
        size: 54321,
        dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // truncated
      }
    });

    const savedPrescription = await testPrescription.save();
    console.log("✅ Prescription with X-ray saved successfully!");
    console.log("   ID:", savedPrescription._id);
    console.log("   Patient:", savedPrescription.patientName);
    console.log("   Has X-ray:", !!savedPrescription.xray);
    console.log("   X-ray name:", savedPrescription.xray?.name);

    // Test 4: Query prescriptions with X-rays
    console.log("\n📝 Test 4: Querying prescriptions with X-rays...");
    const prescriptionsWithXray = await Prescription.find({ "xray.name": { $exists: true } });
    console.log(`✅ Found ${prescriptionsWithXray.length} prescription(s) with X-rays`);

    // Test 5: Count all X-rays
    console.log("\n📝 Test 5: Counting all X-rays...");
    const xrayCount = await Xray.countDocuments();
    console.log(`✅ Total X-rays in database: ${xrayCount}`);

    // Cleanup test data
    console.log("\n🧹 Cleaning up test data...");
    await Xray.deleteOne({ _id: savedXray._id });
    await Prescription.deleteOne({ _id: savedPrescription._id });
    console.log("✅ Test data cleaned up");

    console.log("\n✅ All tests passed! X-ray database storage is working correctly.");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run tests
testXrayStorage();
