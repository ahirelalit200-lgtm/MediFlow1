const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function createTestAppointments() {
  try {
    // Clear existing appointments
    await Appointment.deleteMany({});
    console.log("🗑️ Cleared existing appointments");

    // Create test appointments
    const testAppointments = [
      {
        patientId: new mongoose.Types.ObjectId(),
        patientName: "John Doe",
        patientEmail: "john.doe@example.com",
        patientMobile: "9876543210",
        doctorName: "Dr. Smith",
        doctorMobile: "9876543211",
        preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        preferredTime: "10:00",
        reason: "Regular checkup",
        symptoms: "Mild headache and fatigue",
        urgency: "normal",
        status: "pending"
      },
      {
        patientId: new mongoose.Types.ObjectId(),
        patientName: "Jane Smith",
        patientEmail: "jane.smith@example.com",
        patientMobile: "9876543212",
        doctorName: "Dr. Johnson",
        doctorMobile: "9876543213",
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        preferredTime: "14:30",
        reason: "Follow-up consultation",
        symptoms: "Persistent cough",
        urgency: "urgent",
        status: "pending"
      },
      {
        patientId: new mongoose.Types.ObjectId(),
        patientName: "Mike Wilson",
        patientEmail: "mike.wilson@example.com",
        patientMobile: "9876543214",
        doctorName: "Dr. Brown",
        doctorMobile: "9876543215",
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        preferredTime: "09:00",
        reason: "Emergency consultation",
        symptoms: "Severe chest pain",
        urgency: "emergency",
        status: "pending"
      }
    ];

    const createdAppointments = await Appointment.insertMany(testAppointments);
    console.log(`✅ Created ${createdAppointments.length} test appointments`);

    createdAppointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.patientName} - ${apt.urgency.toUpperCase()} - ${apt.reason}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test appointments:", error);
    process.exit(1);
  }
}

createTestAppointments();
