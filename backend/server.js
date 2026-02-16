// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// ---------------- DB ----------------
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prescriptionDB")
  .then(async () => {
    console.log("✅ MongoDB Connected");
    try {
      const Medicine = require("./models/Medicine");
      await Medicine.syncIndexes();
      console.log("✅ Medicine indexes synced");
    } catch (idxErr) {
      console.error("⚠️ Failed to sync indexes:", idxErr);
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------------- Middleware ----------------
// Increase body size limits to allow X-ray data URLs (base64) in JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Debugging middleware - logs request metadata and body (temporary)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(">>>", req.method, req.path);
    // Only show body for non-empty JSON bodies
    if (req.body && Object.keys(req.body).length) console.log(">>> BODY:", req.body);
  }
  next();
});

// ---------------- Dashboard Routes ----------------
// Serve main dashboard when accessing frontend directory
app.get("/frontend", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "html-css", "maindashboard.html"));
});

app.get("/frontend/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "html-css", "maindashboard.html"));
});

// Serve main dashboard when accessing html-css directory
app.get("/html-css", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "html-css", "maindashboard.html"));
});

app.get("/html-css/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "html-css", "maindashboard.html"));
});

app.get("/html-css/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "html-css", "maindashboard.html"));
});

// ---------------- Static Files ----------------
// Serve frontend static files
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ---------------- Root Route ----------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "html-css", "maindashboard.html"));
});

// ---------------- Routes ----------------
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const patientAuthRoutes = require("./routes/patientAuthRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorAppointmentRoutes = require("./routes/doctorAppointmentRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
let medicineRoutes, xrayRoutes, analyticsRoutes, xrayAnalysisRoutes, chatbotRoutes;
try { medicineRoutes = require("./routes/medicineRoutes"); } catch (e) { medicineRoutes = null; }
try { xrayRoutes = require("./routes/xrayRoutes"); } catch (e) { xrayRoutes = null; }
try { analyticsRoutes = require("./routes/analyticsRoutes"); } catch (e) { analyticsRoutes = null; }
try {
  xrayAnalysisRoutes = require("./routes/xrayAnalysisRoutes");
  console.log("✅ X-ray Analysis routes loaded");
} catch (e) {
  console.warn("⚠️ X-ray Analysis routes not found:", e.message);
  xrayAnalysisRoutes = null;
}
try {
  chatbotRoutes = require("./routes/chatbotRoutes");
  console.log("✅ Chatbot routes loaded");
} catch (e) {
  console.warn("⚠️ Chatbot routes not found:", e.message);
  chatbotRoutes = null;
}

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes); // plural — frontend expects this
app.use("/api/doctor", doctorRoutes); // singular — for profile.js PUT /api/doctor/profile
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/patient/auth", patientAuthRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor/appointments", doctorAppointmentRoutes);
app.use("/api/appointments", appointmentRoutes);
console.log("📅 Appointment routes loaded at /api/appointments");
if (medicineRoutes) app.use("/api/medicines", medicineRoutes);
if (xrayRoutes) app.use("/api/xrays", xrayRoutes);
if (analyticsRoutes) app.use("/api/analytics", analyticsRoutes);
if (xrayAnalysisRoutes) {
  app.use("/api/xray-analysis", xrayAnalysisRoutes);
  console.log("🤖 X-ray Analysis API mounted at /api/xray-analysis");
} else {
  console.error("❌ X-ray Analysis routes NOT loaded - AI analysis will not work");
}
if (chatbotRoutes) {
  app.use("/api/chatbot", chatbotRoutes);
  console.log("💬 Chatbot API mounted at /api/chatbot");
}
console.log("👥 Patient authentication and portal routes loaded");

// ---------------- Start ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

// ---------------- Schedulers ----------------
try {
  const { startReminderScheduler, startPrintJobWorker } = require("./utils/scheduler");
  startReminderScheduler();
  startPrintJobWorker();
  console.log("⏰ Follow-up reminder scheduler started.");
  console.log("🖨️  Print job worker started.");
} catch (e) {
  console.error("Failed to start reminder scheduler:", e.message);
}
