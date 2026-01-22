// Quick script to check MongoDB connection and collections
// Run with: node check-mongodb.js

const mongoose = require("mongoose");
require("dotenv").config();

async function checkMongoDB() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB";
    
    console.log("🔌 Attempting to connect to MongoDB...");
    console.log("   URI:", mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log("✅ Successfully connected to MongoDB!");

    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log("📦 Database name:", dbName);

    // List all collections
    console.log("\n📋 Listing all collections:");
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log("⚠️  No collections found in database");
      console.log("\n💡 Collections will be created automatically when you:");
      console.log("   1. Upload an X-ray via xray.html");
      console.log("   2. Create a prescription via prescription.html");
      console.log("   3. Run: node setup-xray-collections.js");
    } else {
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name}`);
      });

      // Count documents in each collection
      console.log("\n📊 Document counts:");
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   ${col.name}: ${count} document(s)`);
      }

      // Check specifically for xrays and prescriptions
      const hasXrays = collections.some(c => c.name === 'xrays');
      const hasPrescriptions = collections.some(c => c.name === 'prescriptions');

      console.log("\n✅ Collection Status:");
      console.log(`   xrays collection: ${hasXrays ? '✓ EXISTS' : '✗ NOT FOUND'}`);
      console.log(`   prescriptions collection: ${hasPrescriptions ? '✓ EXISTS' : '✗ NOT FOUND'}`);

      if (!hasXrays || !hasPrescriptions) {
        console.log("\n💡 To create missing collections, run:");
        console.log("   node setup-xray-collections.js");
      }
    }

    console.log("\n✅ MongoDB check complete!");

  } catch (error) {
    console.error("\n❌ MongoDB connection failed!");
    console.error("Error:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Make sure MongoDB is running");
    console.log("   2. Check your .env file for MONGO_URI");
    console.log("   3. Try: mongosh (to test connection manually)");
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

checkMongoDB();
