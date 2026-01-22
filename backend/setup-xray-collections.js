// Setup script to create X-ray collections in MongoDB
// Run with: node setup-xray-collections.js

const mongoose = require("mongoose");
require("dotenv").config();

async function setupCollections() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB";
    console.log("🔌 Connecting to MongoDB:", mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Check existing collections
    console.log("\n📋 Checking existing collections...");
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log("Existing collections:", collectionNames);

    // Create xrays collection if it doesn't exist
    if (!collectionNames.includes('xrays')) {
      console.log("\n📦 Creating 'xrays' collection...");
      await db.createCollection('xrays');
      console.log("✅ 'xrays' collection created");
    } else {
      console.log("\n✅ 'xrays' collection already exists");
    }

    // Check if prescriptions collection exists
    if (!collectionNames.includes('prescriptions')) {
      console.log("\n📦 Creating 'prescriptions' collection...");
      await db.createCollection('prescriptions');
      console.log("✅ 'prescriptions' collection created");
    } else {
      console.log("\n✅ 'prescriptions' collection already exists");
    }

    // Create indexes for xrays collection
    console.log("\n🔍 Creating indexes for xrays collection...");
    const xraysCollection = db.collection('xrays');
    
    await xraysCollection.createIndex({ patientName: 1, mobile: 1 });
    console.log("✅ Index created: patientName + mobile");
    
    await xraysCollection.createIndex({ doctor: 1 });
    console.log("✅ Index created: doctor");
    
    await xraysCollection.createIndex({ uploadDate: -1 });
    console.log("✅ Index created: uploadDate (descending)");

    // Create index for prescriptions with xrays
    console.log("\n🔍 Creating index for prescriptions with X-rays...");
    const prescriptionsCollection = db.collection('prescriptions');
    await prescriptionsCollection.createIndex({ "xray.name": 1 });
    console.log("✅ Index created: xray.name");

    // Insert a sample X-ray to verify everything works
    console.log("\n📝 Inserting sample X-ray...");
    const sampleXray = {
      patientName: "Sample Patient",
      mobile: "0000000000",
      doctor: "Dr. Setup",
      name: "sample-xray.jpg",
      type: "image/jpeg",
      size: 12345,
      dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==",
      uploadDate: new Date(),
      notes: "Sample X-ray for testing",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await xraysCollection.insertOne(sampleXray);
    console.log("✅ Sample X-ray inserted with ID:", result.insertedId);

    // Verify the insertion
    const count = await xraysCollection.countDocuments();
    console.log("📊 Total X-rays in collection:", count);

    // Show the sample document
    console.log("\n📄 Sample X-ray document:");
    const sample = await xraysCollection.findOne({ _id: result.insertedId }, { dataUrl: 0 });
    console.log(JSON.stringify(sample, null, 2));

    console.log("\n✅ Setup complete! Collections are ready to use.");
    console.log("\n📋 Summary:");
    console.log("   - Database: prescriptionDB");
    console.log("   - Collection 1: xrays (for standalone X-rays)");
    console.log("   - Collection 2: prescriptions (for X-rays with prescriptions)");
    console.log("   - Indexes: Created for optimal query performance");
    console.log("\n🚀 You can now upload X-rays through the frontend!");

  } catch (error) {
    console.error("❌ Setup failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run setup
setupCollections();
