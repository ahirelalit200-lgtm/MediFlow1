const mongoose = require("mongoose");
const Xray = require("../models/Xray");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Sample X-ray image data (placeholder base64)
const sampleXrayImages = {
  dental: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  chest: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  bone: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
};

async function createSampleXrays() {
  try {
    console.log("🩻 Creating sample X-ray reports with AI analysis...\n");

    // Clear existing X-rays
    await Xray.deleteMany({});
    console.log("🗑️ Cleared existing X-rays");

    const sampleXrays = [
      {
        patientName: "John Smith",
        patientEmail: "john@example.com",
        mobile: "9876543210",
        doctor: "Dr. Sarah Wilson",
        name: "Dental_Panoramic_20241009.jpg",
        type: "image/jpeg",
        size: 245760,
        dataUrl: sampleXrayImages.dental,
        xrayType: "dental",
        bodyPart: "Full mouth panoramic",
        analysisStatus: "completed",
        xrayAnalysis: {
          success: true,
          xrayType: "Dental Panoramic",
          findings: [
            {
              type: "Cavity",
              location: "Upper right molar (tooth #3)",
              description: "Small cavity detected on the occlusal surface. Early stage decay requiring immediate attention.",
              severity: "medium",
              confidence: 0.87
            },
            {
              type: "Plaque buildup",
              location: "Lower anterior teeth",
              description: "Moderate plaque accumulation along the gum line. Regular cleaning recommended.",
              severity: "low",
              confidence: 0.92
            }
          ],
          recommendations: [
            "Schedule dental filling for upper right molar within 2 weeks",
            "Professional dental cleaning recommended",
            "Improve daily oral hygiene routine",
            "Use fluoride toothpaste twice daily",
            "Follow-up appointment in 3 months"
          ],
          severity: "medium",
          confidence: 0.89,
          timestamp: new Date()
        },
        notes: "Routine dental checkup - patient reported mild tooth sensitivity"
      },
      {
        patientName: "John Doe",
        patientEmail: "john@example.com", // Same email, different name
        mobile: "9876543211",
        doctor: "Dr. Michael Chen",
        name: "Chest_PA_20241008.jpg",
        type: "image/jpeg",
        size: 512000,
        dataUrl: sampleXrayImages.chest,
        xrayType: "chest",
        bodyPart: "Chest PA view",
        analysisStatus: "completed",
        xrayAnalysis: {
          success: true,
          xrayType: "Chest X-ray (PA view)",
          findings: [
            {
              type: "Normal",
              location: "Bilateral lung fields",
              description: "Clear lung fields with no signs of consolidation, pneumothorax, or pleural effusion.",
              severity: "low",
              confidence: 0.95
            },
            {
              type: "Normal",
              location: "Heart shadow",
              description: "Normal cardiac silhouette and mediastinal contours.",
              severity: "low",
              confidence: 0.93
            }
          ],
          recommendations: [
            "No immediate medical intervention required",
            "Continue regular health checkups",
            "Maintain healthy lifestyle",
            "Annual chest X-ray recommended for monitoring"
          ],
          severity: "low",
          confidence: 0.94,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        },
        notes: "Pre-employment medical examination - all clear"
      },
      {
        patientName: "Jane Smith",
        patientEmail: "jane.smith@example.com",
        mobile: "9876543212",
        doctor: "Dr. Robert Martinez",
        name: "Wrist_Fracture_20241007.jpg",
        type: "image/jpeg",
        size: 189440,
        dataUrl: sampleXrayImages.bone,
        xrayType: "bone",
        bodyPart: "Left wrist",
        analysisStatus: "completed",
        xrayAnalysis: {
          success: true,
          xrayType: "Bone X-ray (Wrist)",
          findings: [
            {
              type: "Fracture",
              location: "Distal radius",
              description: "Displaced fracture of the distal radius with dorsal angulation. Requires immediate orthopedic attention.",
              severity: "high",
              confidence: 0.96
            },
            {
              type: "Soft tissue swelling",
              location: "Surrounding wrist area",
              description: "Significant soft tissue swelling consistent with acute trauma.",
              severity: "medium",
              confidence: 0.88
            }
          ],
          recommendations: [
            "URGENT: Immediate orthopedic consultation required",
            "Immobilize wrist with splint or cast",
            "Pain management with prescribed medications",
            "Follow-up X-ray in 2 weeks to assess healing",
            "Physical therapy after initial healing phase",
            "Avoid weight-bearing activities on affected arm"
          ],
          severity: "high",
          confidence: 0.92,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        notes: "Emergency visit - patient fell while cycling. Immediate treatment initiated."
      },
      {
        patientName: "Mike Wilson",
        patientEmail: "mike.wilson@example.com",
        mobile: "9876543214",
        doctor: "Dr. Emily Johnson",
        name: "Dental_Bitewing_20241006.jpg",
        type: "image/jpeg",
        size: 156720,
        dataUrl: sampleXrayImages.dental,
        xrayType: "dental",
        bodyPart: "Posterior teeth bitewing",
        analysisStatus: "processing",
        xrayAnalysis: {
          success: false,
          timestamp: new Date()
        },
        notes: "Routine dental checkup - analysis in progress"
      }
    ];

    const createdXrays = await Xray.insertMany(sampleXrays);
    console.log(`✅ Created ${createdXrays.length} sample X-ray reports\n`);

    // Display summary
    createdXrays.forEach((xray, index) => {
      const status = xray.analysisStatus === 'completed' ? '✅' : '⏳';
      const severity = xray.xrayAnalysis?.severity || 'N/A';
      console.log(`${index + 1}. ${status} ${xray.patientName} - ${xray.xrayType.toUpperCase()} - ${severity.toUpperCase()}`);
      console.log(`   Doctor: ${xray.doctor}`);
      console.log(`   Body Part: ${xray.bodyPart}`);
      if (xray.xrayAnalysis?.findings?.length > 0) {
        console.log(`   Findings: ${xray.xrayAnalysis.findings.length} detected`);
      }
      console.log('');
    });

    console.log("🎉 Sample X-ray data created successfully!");
    console.log("\n📊 Summary:");
    console.log("✅ Dental X-rays with cavity detection");
    console.log("✅ Chest X-ray with normal findings");
    console.log("✅ Bone X-ray with fracture detection");
    console.log("⏳ X-ray with pending analysis");
    console.log("\n🔗 Data linked using composite key (name + email)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating sample X-rays:", error);
    process.exit(1);
  }
}

createSampleXrays();
