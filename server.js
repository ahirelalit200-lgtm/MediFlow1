const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ====== Middleware ======
app.use(cors({
  origin: ['https://medi-flow1.vercel.app', 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());

// ✅ Serve main dashboard when accessing html-css directory
app.get("/html-css", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "html-css", "maindashboard.html"));
});

app.get("/html-css/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "html-css", "maindashboard.html"));
});

// ✅ Serve frontend files
app.use(express.static(path.join(__dirname, "frontend")));

// ====== MongoDB Connection ======
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/doctors", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

// ====== Models ======
const DoctorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: String,
  specialization: String,
  clinicName: String,
  address: String,
  phone: String,
  timings: String,
  experience: String,
  degree: String,
  registrationNo: String
});

const Doctor = mongoose.model("Doctor", DoctorSchema);

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosageAmount: String,
  unit: String,
  morning: { type: String, default: "none" },
  afternoon: { type: String, default: "none" },
  night: { type: String, default: "none" },
  dosage: String,
  duration: String,
  code: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true }
});

const Medicine = mongoose.model("Medicine", MedicineSchema);

const PrescriptionSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  mobile: String,
  patientEmail: String,
  address: String,
  sex: String,
  age: Number,
  treatmentType: String,
  medicines: [mongoose.Schema.Types.Mixed],
  notes: String,
  treatment: String,
  doctor: String,
  xray: mongoose.Schema.Types.Mixed,
  xrayAnalysis: mongoose.Schema.Types.Mixed,
  followUpDate: Date,
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true }
});

const Prescription = mongoose.model("Prescription", PrescriptionSchema);

// Patient Schema
const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Patient = mongoose.model("Patient", PatientSchema);

// Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  patientMobile: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  doctorName: { type: String, required: true },
  doctorEmail: { type: String, required: true },
  preferredDate: { type: String, required: true },
  preferredTime: { type: String, required: true },
  reason: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model("Appointment", AppointmentSchema);

// ====== Doctor Profile Routes ======

// Get all doctor profiles
app.get("/api/doctors/profiles", async (req, res) => {
  try {
    console.log("🔹 GET /api/doctors/profiles called");
    const doctors = await Doctor.find({}, '-password').sort({ fullName: 1 });
    res.json({ success: true, doctors });
  } catch (err) {
    console.error("❌ Error fetching doctor profiles:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ====== Email Service Setup ======
const nodemailer = require('nodemailer');

let transporter = null;

// Only setup email if environment variables are available
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify email configuration
    transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Email server configuration error:', error);
        transporter = null; // Disable email if config fails
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
  } catch (error) {
    console.log('❌ Failed to initialize email service:', error);
    transporter = null;
  }
} else {
  console.log('⚠️ Email credentials not provided - email functionality disabled');
}

// ====== Auth Middleware ======
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.doctor = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Unauthorized" });
  }
}

// ====== Routes ======

// Signup
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await Doctor.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const doctor = new Doctor({ email, password: hashed });
    await doctor.save();

    const token = jwt.sign({ id: doctor._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: doctor._id }, JWT_SECRET, { expiresIn: "1d" });

    // Return doctor profile (excluding password) if it exists
    const doctorProfile = doctor.toObject();
    delete doctorProfile.password;

    res.json({ token, doctorProfile });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Patient Login
app.post("/api/patient/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const patient = await Patient.findOne({ email });
    if (!patient) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: patient._id, email: patient.email, role: 'patient' },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Patient login successful",
      token,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        mobile: patient.mobile,
        age: patient.age,
        gender: patient.gender,
        address: patient.address
      }
    });
  } catch (err) {
    console.error("Patient login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Patient Signup
app.post("/api/patient/auth/signup", async (req, res) => {
  const { name, email, mobile, password, age, gender, address } = req.body;

  try {
    // Check if patient already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ message: "Patient with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new patient
    const patient = new Patient({
      name,
      email,
      mobile,
      password: hashedPassword,
      age,
      gender,
      address
    });

    await patient.save();

    // Create JWT token
    const token = jwt.sign(
      { id: patient._id, email: patient.email, role: 'patient' },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Patient signup successful",
      token,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        mobile: patient.mobile,
        age: patient.age,
        gender: patient.gender,
        address: patient.address
      }
    });
  } catch (err) {
    console.error("Patient signup error:", err);
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: "Patient with this email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Patient middleware for authentication
const patientAuthMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log("🔹 Patient auth middleware - token received:", token ? "Yes" : "No");

  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    console.log("🔹 Patient auth middleware - decoded token:", { id: decoded.id, email: decoded.email, role: decoded.role });

    if (decoded.role !== 'patient') {
      console.log("🔹 Patient auth middleware - role mismatch:", decoded.role);
      return res.status(401).json({ message: "Access denied" });
    }

    req.patient = decoded;
    console.log("🔹 Patient auth middleware - authentication successful");
    next();
  } catch (err) {
    console.log("🔹 Patient auth middleware - token verification failed:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Get Patient Dashboard Stats
app.get("/api/patient/dashboard/stats", patientAuthMiddleware, async (req, res) => {
  try {
    console.log("🔹 GET /api/patient/dashboard/stats called by patient:", req.patient.id);
    console.log("🔹 Patient email:", req.patient.email);

    // First, get the patient's details to try multiple matching strategies
    const patient = await Patient.findById(req.patient.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    console.log("🔹 Patient details:", { name: patient.name, email: patient.email, mobile: patient.mobile });

    // Find all prescriptions for this patient using multiple matching strategies
    console.log("🔹 Searching for prescriptions with patient data:", {
      email: patient.email,
      name: patient.name,
      mobile: patient.mobile
    });

    const prescriptions = await Prescription.find({
      $or: [
        { patientEmail: patient.email },
        { patientName: patient.name },
        { mobile: patient.mobile },
        { patientName: { $regex: patient.name, $options: 'i' } },
        // Try case-insensitive email match
        { patientEmail: { $regex: patient.email, $options: 'i' } },
        // Try partial name match
        { patientName: { $regex: patient.name.split(' ')[0], $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    console.log("🔹 Search query results:", prescriptions.length, "prescriptions found");

    // If still no prescriptions, let's see what prescriptions exist in the database
    if (prescriptions.length === 0) {
      console.log("🔹 No prescriptions found. Checking existing prescriptions in database...");
      const allPrescriptions = await Prescription.find({}).limit(5).select('patientName patientEmail mobile createdAt doctor');
      console.log("🔹 Sample prescriptions in database:", allPrescriptions);
    }

    console.log("🔹 Found prescriptions:", prescriptions.length);
    if (prescriptions.length > 0) {
      console.log("🔹 First prescription:", {
        patientEmail: prescriptions[0].patientEmail,
        patientName: prescriptions[0].patientName,
        mobile: prescriptions[0].mobile,
        createdAt: prescriptions[0].createdAt
      });
    }

    // Calculate stats
    const totalPrescriptions = prescriptions.length;
    const totalXrays = prescriptions.filter(p => p.xray).length;
    const lastVisit = prescriptions.length > 0 ? prescriptions[0].createdAt : null;
    const lastDoctor = prescriptions.length > 0 ? prescriptions[0].doctor : null;

    console.log("🔹 Calculated stats:", {
      totalPrescriptions,
      totalXrays,
      lastVisit,
      lastDoctor
    });

    // Ensure we always return valid data, even if no prescriptions found
    const stats = {
      totalPrescriptions: totalPrescriptions || 0,
      totalXrays: totalXrays || 0,
      lastVisit: lastVisit || null,
      lastDoctor: lastDoctor || null
    };

    console.log("🔹 Final stats being sent to frontend:", stats);

    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error("Get patient dashboard stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Patient Prescriptions
app.get("/api/patient/prescriptions", patientAuthMiddleware, async (req, res) => {
  try {
    console.log("🔹 GET /api/patient/prescriptions called by patient:", req.patient.id);

    const { limit = 10 } = req.query;

    // Get patient details for better matching
    const patient = await Patient.findById(req.patient.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Find all prescriptions for this patient using multiple matching strategies
    const prescriptions = await Prescription.find({
      $or: [
        { patientEmail: patient.email },
        { patientName: patient.name },
        { mobile: patient.mobile },
        { patientName: { $regex: patient.name, $options: 'i' } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    console.log("🔹 Found prescriptions for patient:", prescriptions.length);

    res.json({
      success: true,
      prescriptions
    });
  } catch (err) {
    console.error("Get patient prescriptions error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Patient Profile
app.get("/api/patient/auth/profile", patientAuthMiddleware, async (req, res) => {
  try {
    console.log("🔹 GET /api/patient/auth/profile called by patient:", req.patient.id);

    const patient = await Patient.findById(req.patient.id).select("-password");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({
      success: true,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        mobile: patient.mobile,
        age: patient.age,
        gender: patient.gender,
        address: patient.address,
        createdAt: patient.createdAt
      }
    });
  } catch (err) {
    console.error("Get patient profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Patient Profile
app.put("/api/patient/auth/profile", patientAuthMiddleware, async (req, res) => {
  try {
    console.log("🔹 PUT /api/patient/auth/profile called by patient:", req.patient.id);

    const { name, mobile, age, gender, address } = req.body;

    // Validate input
    const updateData = {};
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;
    if (age !== undefined) updateData.age = age;
    if (gender) updateData.gender = gender;
    if (address) updateData.address = address;

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.patient.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      patient: {
        id: updatedPatient._id,
        name: updatedPatient.name,
        email: updatedPatient.email,
        mobile: updatedPatient.mobile,
        age: updatedPatient.age,
        gender: updatedPatient.gender,
        address: updatedPatient.address,
        createdAt: updatedPatient.createdAt
      }
    });
  } catch (err) {
    console.error("Update patient profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Patient X-rays
app.get("/api/patient/xrays", patientAuthMiddleware, async (req, res) => {
  try {
    console.log("🔹 GET /api/patient/xrays called by patient:", req.patient.id);

    // Find all prescriptions with X-rays for this patient
    const prescriptions = await Prescription.find({
      $or: [
        { patientEmail: req.patient.email },
        { patientName: { $regex: req.patient.email, $options: 'i' } }
      ],
      xray: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });

    // Extract X-ray data from prescriptions
    const xrays = prescriptions.map(prescription => ({
      id: prescription._id,
      patientName: prescription.patientName,
      doctor: prescription.doctor,
      date: prescription.createdAt,
      xray: prescription.xray,
      xrayAnalysis: prescription.xrayAnalysis,
      notes: prescription.notes
    }));

    res.json({
      success: true,
      xrays
    });
  } catch (err) {
    console.error("Get patient X-rays error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Patient X-ray
app.delete("/api/patient/xrays/:xrayId", patientAuthMiddleware, async (req, res) => {
  try {
    console.log("🔹 DELETE /api/patient/xrays/:xrayId called by patient:", req.patient.id);

    const { xrayId } = req.params;

    // Find the prescription with this X-ray
    const prescription = await Prescription.findOne({
      _id: xrayId,
      $or: [
        { patientEmail: req.patient.email },
        { patientName: { $regex: req.patient.email, $options: 'i' } }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ message: "X-ray not found" });
    }

    // Remove X-ray data from the prescription
    prescription.xray = null;
    prescription.xrayAnalysis = null;
    await prescription.save();

    res.json({
      success: true,
      message: "X-ray deleted successfully"
    });
  } catch (err) {
    console.error("Delete patient X-ray error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Available Doctors for Patients
app.get("/api/doctors/profiles", async (req, res) => {
  try {
    console.log("🔹 GET /api/doctors/profiles called");

    // Get all doctors with their profiles (excluding passwords)
    const doctors = await Doctor.find({}).select("-password").sort({ fullName: 1 });

    console.log("🔹 Found doctors:", doctors.length);

    res.json({
      success: true,
      doctors: doctors.map(doctor => ({
        id: doctor._id,
        fullName: doctor.fullName,
        email: doctor.email,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        registrationNumber: doctor.registrationNumber,
        clinicName: doctor.clinicName,
        address: doctor.address,
        phone: doctor.phone
      }))
    });
  } catch (err) {
    console.error("Get doctors profiles error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Test endpoint to verify server is working
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!", timestamp: new Date() });
});

// Request Appointment (Patient)
app.post("/api/patient/appointments/request", patientAuthMiddleware, async (req, res) => {
  try {
    console.log("🔹 POST /api/patient/appointments/request endpoint reached");
    console.log("🔹 POST /api/patient/appointments/request called by patient:", req.patient.id);

    const { doctorId, doctorEmail, doctorName, doctorMobile, preferredDate, preferredTime, reason, urgency } = req.body;
    console.log("🔹 Request body:", { doctorId, doctorEmail, doctorName, doctorMobile, preferredDate, preferredTime, reason, urgency });

    // Get patient details
    const patient = await Patient.findById(req.patient.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    let doctor_id = null;
    let doctor_name = doctorName;
    let doctor_email = doctorEmail;

    // If doctorId is provided, validate and get details
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        doctor_id = doctor._id;
        doctor_name = doctor.fullName;
        doctor_email = doctor.email;
      }
    }

    if (!doctor_name) {
      return res.status(400).json({ message: "Doctor name is required" });
    }

    // Create appointment request and save to database
    const appointment = new Appointment({
      patientId: patient._id,
      patientName: patient.name,
      patientEmail: patient.email,
      patientMobile: patient.mobile,
      doctorId: doctor_id,
      doctorName: doctor_name,
      doctorEmail: doctor_email || "Not specified",
      doctorMobile: doctorMobile || "Not specified",
      preferredDate,
      preferredTime,
      reason,
      urgency: urgency || 'medium',
      status: "pending"
    });

    await appointment.save();
    console.log("🔹 Appointment request saved to database:", appointment._id);

    res.json({
      success: true,
      message: "Appointment request submitted successfully",
      appointment: {
        id: appointment._id,
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        preferredDate: appointment.preferredDate,
        preferredTime: appointment.preferredTime,
        status: appointment.status,
        createdAt: appointment.createdAt
      }
    });
  } catch (err) {
    console.error("Request appointment error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Appointment Status for Patient
app.get("/api/appointments/patient/:id/status", patientAuthMiddleware, async (req, res) => {
  try {
    const patientId = req.params.id;
    console.log(`🔹 GET /api/appointments/patient/${patientId}/status called`);

    // Basic security check
    if (req.patient.id !== patientId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const appointments = await Appointment.find({ patientId }).sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (err) {
    console.error("❌ Error fetching appointment status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Patient Appointment Status
app.get("/api/appointments/patient/:patientId/status", patientAuthMiddleware, async (req, res) => {
  try {
    console.log("🔹 GET /api/appointments/patient/:patientId/status called");

    const { patientId } = req.params;

    // Validate that the patient can only access their own appointments
    if (patientId !== req.patient.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // For now, return empty appointments (in a real system, query from database)
    // This is a placeholder implementation
    const appointments = []; // Would fetch from Appointment model

    res.json({
      success: true,
      appointments,
      message: "No appointments found"
    });
  } catch (err) {
    console.error("Get patient appointment status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Doctor's Appointments
app.get("/api/doctor/appointments", authMiddleware, async (req, res) => {
  try {
    console.log("🔹 GET /api/doctor/appointments called by doctor:", req.doctor.id);

    // Fetch appointments for this doctor from database
    const appointments = await Appointment.find({ doctorId: req.doctor.id })
      .sort({ createdAt: -1 });

    console.log("🔹 Found appointments for doctor:", appointments.length);

    res.json({
      success: true,
      appointments: appointments.map(apt => ({
        id: apt._id,
        patientName: apt.patientName,
        patientEmail: apt.patientEmail,
        patientMobile: apt.patientMobile,
        preferredDate: apt.preferredDate,
        preferredTime: apt.preferredTime,
        reason: apt.reason,
        urgency: apt.urgency,
        status: apt.status,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt
      })),
      message: appointments.length === 0 ? "No appointments found" : "Appointments retrieved successfully"
    });
  } catch (err) {
    console.error("Get doctor appointments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Appointment Status (Doctor)
app.put("/api/doctor/appointments/:appointmentId/status", authMiddleware, async (req, res) => {
  try {
    console.log("🔹 PUT /api/doctor/appointments/:appointmentId/status called by doctor:", req.doctor.id);

    const { appointmentId } = req.params;
    const { status } = req.body; // expected: 'confirmed', 'rejected', 'completed'

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Find and update the appointment
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        doctorId: req.doctor.id // Ensure doctor can only update their own appointments
      },
      {
        status: status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or access denied" });
    }

    console.log("🔹 Appointment status updated in database:", { appointmentId, status });

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      appointment: {
        id: appointment._id,
        patientName: appointment.patientName,
        status: appointment.status,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (err) {
    console.error("Update appointment status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Doctor Profile
app.get("/api/doctor/profile", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor.id).select("-password");
    res.json(doctor);
  } catch (err) {
    console.error("Get doctor profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Doctor Profile
app.put("/api/doctor/profile", authMiddleware, async (req, res) => {
  try {
    const updated = await Doctor.findByIdAndUpdate(req.doctor.id, req.body, {
      new: true,
    }).select("-password");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ====== Medicine Routes ======

// Get all medicines for a doctor
app.get("/api/medicines", authMiddleware, async (req, res) => {
  console.log("🔹 GET /api/medicines called by doctor:", req.doctor.id);
  try {
    // Check if Medicine model exists and is accessible
    if (typeof Medicine === 'undefined') {
      console.error("❌ Medicine model is undefined");
      return res.status(500).json({ message: "Medicine model not initialized" });
    }

    const medicines = await Medicine.find({ doctorId: req.doctor.id });
    console.log("✅ Found medicines:", medicines.length);
    res.json(medicines);
  } catch (err) {
    console.error("❌ Error fetching medicines:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add new medicine
app.post("/api/medicines", authMiddleware, async (req, res) => {
  console.log("🔹 POST /api/medicines called by doctor:", req.doctor.id);
  console.log("🔹 Medicine data:", req.body);
  try {
    // Check if Medicine model exists and is accessible
    if (typeof Medicine === 'undefined') {
      console.error("❌ Medicine model is undefined");
      return res.status(500).json({ message: "Medicine model not initialized" });
    }

    const { name, dosageAmount, unit, morning, afternoon, night, code, dosage, duration } = req.body;

    if (!name || !code) {
      console.error("❌ Missing required fields:", { name, code });
      return res.status(400).json({ message: "Missing required fields: name and code are required" });
    }

    // Log received data for debugging
    console.log("🔹 Received medicine data:", { name, dosageAmount, unit, morning, afternoon, night, code, dosage, duration });

    const medicine = new Medicine({
      name,
      dosageAmount,
      unit,
      morning,
      afternoon,
      night,
      code,
      dosage,
      duration,
      doctorId: req.doctor.id
    });

    await medicine.save();
    console.log("✅ Medicine saved successfully:", medicine);
    res.status(201).json(medicine);
  } catch (err) {
    console.error("❌ Error saving medicine:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete medicine
app.delete("/api/medicines/:code", authMiddleware, async (req, res) => {
  console.log("🔹 DELETE /api/medicines called by doctor:", req.doctor.id);
  const { code } = req.params;
  try {
    if (typeof Medicine === 'undefined') {
      return res.status(500).json({ message: "Medicine model not initialized" });
    }

    const result = await Medicine.deleteMany({
      code,
      doctorId: req.doctor.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No medicines found with this code" });
    }

    console.log(`✅ Deleted ${result.deletedCount} medicines with code: ${code}`);
    res.json({ message: "Medicines deleted successfully", count: result.deletedCount });
  } catch (err) {
    console.error("❌ Error deleting medicines by code:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete specific medicine by ID
app.delete("/api/medicines/id/:id", authMiddleware, async (req, res) => {
  console.log("🔹 DELETE /api/medicines/id called by doctor:", req.doctor.id);
  const { id } = req.params;
  try {
    const result = await Medicine.findOneAndDelete({
      _id: id,
      doctorId: req.doctor.id
    });

    if (!result) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    console.log("✅ Medicine deleted successfully by ID:", id);
    res.json({ message: "Medicine deleted successfully", id });
  } catch (err) {
    console.error("❌ Error deleting medicine by ID:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get medicines by code
app.get("/api/medicines/code/:code", authMiddleware, async (req, res) => {
  console.log("🔹 GET /api/medicines/code called by doctor:", req.doctor.id);
  const { code } = req.params;
  try {
    if (typeof Medicine === 'undefined') {
      return res.status(500).json({ message: "Medicine model not initialized" });
    }

    // Find ALL medicines with this code for this doctor
    const meds = await Medicine.find({
      code: String(code).trim(),
      doctorId: req.doctor.id
    });

    console.log(`✅ Found ${meds.length} medicines for code: ${code}`);
    res.json({ medicines: meds });
  } catch (err) {
    console.error("❌ Error fetching medicines by code:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ====== Prescription Routes ======

// Add new prescription
app.post("/api/prescriptions/add", authMiddleware, async (req, res) => {
  console.log("🔹 POST /api/prescriptions/add called by doctor:", req.doctor.id);
  console.log("🔹 Prescription data:", req.body);
  try {
    const prescription = new Prescription({
      patientName: req.body.patientName,
      mobile: req.body.mobile,
      patientEmail: req.body.patientEmail,
      address: req.body.address,
      sex: req.body.sex,
      age: req.body.age,
      treatmentType: req.body.treatmentType,
      medicines: req.body.medicines,
      notes: req.body.notes,
      treatment: req.body.treatment,
      doctor: req.body.doctor,
      xray: req.body.xray,
      xrayAnalysis: req.body.xrayAnalysis,
      followUpDate: req.body.followUpDate,
      doctorId: req.doctor.id
    });

    await prescription.save();
    console.log("✅ Prescription saved successfully:", prescription);
    res.status(201).json(prescription);
  } catch (err) {
    console.error("❌ Error saving prescription:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Email prescription
app.post("/api/prescriptions/email", authMiddleware, async (req, res) => {
  console.log("🔹 POST /api/prescriptions/email called by doctor:", req.doctor.id);
  console.log("🔹 Email data:", req.body);

  try {
    const { to, subject, html, text, prescription, xray, xrayAnalysis } = req.body;

    if (!to || !subject || !prescription) {
      console.error("❌ Missing required email fields:", { to, subject, hasPrescription: !!prescription });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: to, subject, prescription"
      });
    }

    // Check if email service is available
    if (!transporter) {
      console.log("⚠️ Email service not available - falling back to simulation");
      // Fallback to simulation if email service is not configured
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(200).json({
        success: true,
        message: "Email sent successfully (simulated - email service not configured)",
        details: {
          to,
          subject,
          patientName: prescription.patientName,
          simulated: true,
          hasXray: !!(xray && xray.dataUrl)
        }
      });
    }

    console.log("📧 Sending real email to:", to);
    console.log("  Subject:", subject);
    console.log("  Prescription:", prescription.patientName || "Unknown patient");
    console.log("  Has X-ray:", !!(xray && xray.dataUrl));
    console.log("  Has X-ray Analysis:", !!(xrayAnalysis && xrayAnalysis.success));

    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("  Message ID:", info.messageId);
    console.log("  Response:", info.response);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      details: {
        to,
        subject,
        patientName: prescription.patientName,
        messageId: info.messageId,
        hasXray: !!(xray && xray.dataUrl)
      }
    });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: err.message
    });
  }
});

// Get prescription history for a doctor
app.get("/api/prescriptions/history", authMiddleware, async (req, res) => {
  console.log("🔹 GET /api/prescriptions/history called by doctor:", req.doctor.id);

  try {
    const { name, mobile } = req.query;

    // Build query for this doctor's prescriptions
    let query = { doctorId: req.doctor.id };

    // Add filters if provided
    if (name) {
      query.patientName = { $regex: name, $options: "i" };
    }
    if (mobile) {
      query.mobile = { $regex: mobile, $options: "i" };
    }

    // Fetch prescriptions, sorted by creation date (newest first)
    const prescriptions = await Prescription.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📋 Found ${prescriptions.length} prescriptions for doctor ${req.doctor.id}`);

    res.status(200).json({
      success: true,
      items: prescriptions,
      total: prescriptions.length
    });

  } catch (err) {
    console.error("❌ Error fetching prescription history:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescription history",
      error: err.message
    });
  }
});

// Analytics API - Get prescriptions for analytics
app.get("/api/analytics/prescriptions", authMiddleware, async (req, res) => {
  console.log("🔹 GET /api/analytics/prescriptions called by doctor:", req.doctor.id);

  try {
    const { limit = 1000 } = req.query;

    // Fetch prescriptions for this doctor only
    const prescriptions = await Prescription.find({ doctorId: req.doctor.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`📊 Analytics: Found ${prescriptions.length} prescriptions for doctor ${req.doctor.id}`);

    res.status(200).json({
      success: true,
      prescriptions: prescriptions,
      total: prescriptions.length
    });

  } catch (err) {
    console.error("❌ Error fetching analytics prescriptions:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
      error: err.message
    });
  }
});

// ====== Fallback: serve maindashboard.html for unknown routes ======
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "html-css", "maindashboard.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});