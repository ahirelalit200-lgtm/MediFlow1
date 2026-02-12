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
  try {
    const medicines = await Medicine.find({ doctorId: req.doctor.id });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add new medicine
app.post("/api/medicines", authMiddleware, async (req, res) => {
  try {
    const { name, dosageAmount, unit, morning, afternoon, night, code } = req.body;
    
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
    res.status(201).json(medicine);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ====== Fallback: serve maindashboard.html for unknown routes ======
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "html-css", "maindashboard.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});