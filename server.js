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
});

const Doctor = mongoose.model("Doctor", DoctorSchema);

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosageAmount: String,
  unit: String,
  morning: { type: String, default: "none" },
  afternoon: { type: String, default: "none" },
  night: { type: String, default: "none" },
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

// ====== Email Service Setup ======
const nodemailer = require('nodemailer');

// Create email transporter (using Gmail)
const transporter = nodemailer.createTransporter({
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
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

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
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get Doctor Profile
app.get("/api/doctor/profile", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor.id).select("-password");
    res.json(doctor);
  } catch (err) {
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
    
    const { name, dosageAmount, unit, morning, afternoon, night, code } = req.body;
    
    if (!name || !code) {
      console.error("❌ Missing required fields:", { name, code });
      return res.status(400).json({ message: "Missing required fields: name and code are required" });
    }
    
    // Log received data for debugging
    console.log("🔹 Received medicine data:", { name, dosageAmount, unit, morning, afternoon, night, code });
    
    const medicine = new Medicine({
      name,
      dosageAmount,
      unit,
      morning,
      afternoon,
      night,
      code,
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

// ====== Fallback: serve maindashboard.html for unknown routes ======
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "html-css", "maindashboard.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});