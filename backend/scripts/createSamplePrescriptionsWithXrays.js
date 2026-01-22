const mongoose = require("mongoose");
const Prescription = require("../models/Prescription");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Sample X-ray image data (placeholder base64)
const sampleXrayImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

async function createSamplePrescriptionsWithXrays() {
  try {
    console.log("💊 Creating sample prescriptions with X-rays...\n");

    const samplePrescriptions = [
      {
        patientName: "John Smith",
        patientEmail: "john@example.com",
        mobile: "9876543210",
        address: "123 Main Street, City",
        sex: "Male",
        age: 35,
        doctor: "Dr. Sarah Wilson",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        medicines: [
          {
            name: "Amoxicillin",
            dosage: "500mg",
            duration: "7 days",
            measure: "Tablet",
            instruction: "Take with food, twice daily"
          },
          {
            name: "Ibuprofen",
            dosage: "400mg",
            duration: "5 days",
            measure: "Tablet",
            instruction: "After meals, for pain relief"
          }
        ],
        notes: "Patient presented with dental pain. X-ray shows cavity in upper molar. Prescribed antibiotics and pain relief.",
        treatment: "Dental cavity treatment",
        treatmentType: "Dental",
        xray: {
          name: "Dental_Panoramic_John_20241007.jpg",
          type: "image/jpeg",
          size: 245760,
          dataUrl: sampleXrayImage
        },
        xrayAnalysis: {
          success: true,
          xrayType: "Dental Panoramic",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          findings: [
            {
              type: "Cavity",
              location: "Upper right molar (tooth #3)",
              severity: "medium",
              confidence: 0.87,
              description: "Small cavity detected on the occlusal surface requiring immediate attention."
            },
            {
              type: "Plaque buildup",
              location: "Lower anterior teeth",
              severity: "low",
              confidence: 0.92,
              description: "Moderate plaque accumulation along the gum line."
            }
          ],
          recommendations: [
            "Schedule dental filling for upper right molar within 2 weeks",
            "Professional dental cleaning recommended",
            "Improve daily oral hygiene routine"
          ],
          severity: "medium",
          confidence: 0.89
        }
      },
      {
        patientName: "John Doe",
        patientEmail: "john@example.com", // Same email, different name
        mobile: "9876543211",
        address: "456 Oak Avenue, Town",
        sex: "Male",
        age: 42,
        doctor: "Dr. Michael Chen",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        medicines: [
          {
            name: "Cough Syrup",
            dosage: "10ml",
            duration: "5 days",
            measure: "Syrup",
            instruction: "Three times daily after meals"
          }
        ],
        notes: "Routine chest examination. X-ray shows clear lungs, no abnormalities detected.",
        treatment: "Respiratory checkup",
        treatmentType: "General",
        xray: {
          name: "Chest_PA_John_20241008.jpg",
          type: "image/jpeg",
          size: 512000,
          dataUrl: sampleXrayImage
        },
        xrayAnalysis: {
          success: true,
          xrayType: "Chest X-ray (PA view)",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          findings: [
            {
              type: "Normal",
              location: "Bilateral lung fields",
              severity: "low",
              confidence: 0.95,
              description: "Clear lung fields with no signs of consolidation or abnormalities."
            }
          ],
          recommendations: [
            "No immediate medical intervention required",
            "Continue regular health checkups",
            "Maintain healthy lifestyle"
          ],
          severity: "low",
          confidence: 0.94
        }
      },
      {
        patientName: "Jane Smith",
        patientEmail: "jane.smith@example.com",
        mobile: "9876543212",
        address: "789 Pine Road, Village",
        sex: "Female",
        age: 28,
        doctor: "Dr. Robert Martinez",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        medicines: [
          {
            name: "Paracetamol",
            dosage: "650mg",
            duration: "3 days",
            measure: "Tablet",
            instruction: "Every 6 hours for pain relief"
          },
          {
            name: "Calcium supplement",
            dosage: "500mg",
            duration: "30 days",
            measure: "Tablet",
            instruction: "Once daily with breakfast"
          }
        ],
        notes: "Patient fell while cycling. X-ray reveals fracture in left wrist. Immediate orthopedic consultation recommended.",
        treatment: "Wrist fracture treatment",
        treatmentType: "Orthopedic",
        xray: {
          name: "Wrist_Fracture_Jane_20241006.jpg",
          type: "image/jpeg",
          size: 189440,
          dataUrl: sampleXrayImage
        },
        xrayAnalysis: {
          success: true,
          xrayType: "Bone X-ray (Wrist)",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          findings: [
            {
              type: "Fracture",
              location: "Distal radius",
              severity: "high",
              confidence: 0.96,
              description: "Displaced fracture of the distal radius with dorsal angulation requiring immediate attention."
            },
            {
              type: "Soft tissue swelling",
              location: "Surrounding wrist area",
              severity: "medium",
              confidence: 0.88,
              description: "Significant soft tissue swelling consistent with acute trauma."
            }
          ],
          recommendations: [
            "URGENT: Immediate orthopedic consultation required",
            "Immobilize wrist with splint or cast",
            "Follow-up X-ray in 2 weeks to assess healing",
            "Physical therapy after initial healing phase"
          ],
          severity: "high",
          confidence: 0.92
        }
      },
      {
        patientName: "Mike Wilson",
        patientEmail: "mike.wilson@example.com",
        mobile: "9876543214",
        address: "321 Elm Street, District",
        sex: "Male",
        age: 55,
        doctor: "Dr. Emily Johnson",
        date: new Date(), // Today
        medicines: [
          {
            name: "Multivitamin",
            dosage: "1 tablet",
            duration: "30 days",
            measure: "Tablet",
            instruction: "Once daily with breakfast"
          }
        ],
        notes: "Regular health checkup. No X-ray analysis available yet - processing in progress.",
        treatment: "General health checkup",
        treatmentType: "General",
        xray: {
          name: "Chest_Routine_Mike_20241009.jpg",
          type: "image/jpeg",
          size: 156720,
          dataUrl: sampleXrayImage
        },
        xrayAnalysis: {
          success: false,
          timestamp: new Date()
        }
      }
    ];

    const createdPrescriptions = await Prescription.insertMany(samplePrescriptions);
    console.log(`✅ Created ${createdPrescriptions.length} sample prescriptions with X-rays\n`);

    // Display summary
    createdPrescriptions.forEach((prescription, index) => {
      const hasAnalysis = prescription.xrayAnalysis?.success ? '✅' : '⏳';
      const severity = prescription.xrayAnalysis?.severity || 'N/A';
      console.log(`${index + 1}. ${hasAnalysis} ${prescription.patientName} - ${prescription.treatmentType.toUpperCase()}`);
      console.log(`   Doctor: ${prescription.doctor}`);
      console.log(`   X-ray: ${prescription.xray.name}`);
      console.log(`   Analysis: ${prescription.xrayAnalysis?.success ? `${severity.toUpperCase()} severity` : 'Processing'}`);
      if (prescription.xrayAnalysis?.findings?.length > 0) {
        console.log(`   Findings: ${prescription.xrayAnalysis.findings.length} detected`);
      }
      console.log('');
    });

    console.log("🎉 Sample prescription data with X-rays created successfully!");
    console.log("\n📊 Summary:");
    console.log("✅ Dental prescription with cavity detection");
    console.log("✅ Chest X-ray prescription with normal findings");
    console.log("✅ Orthopedic prescription with fracture detection");
    console.log("⏳ General checkup with X-ray processing");
    console.log("\n🔗 Data linked using composite key (name + email)");
    console.log("📱 X-rays will now appear in both prescription history AND X-ray reports page");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating sample prescriptions:", error);
    process.exit(1);
  }
}

createSamplePrescriptionsWithXrays();
