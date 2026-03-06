const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ====== Middleware ======
app.use(cors({
    origin: [
        "https://medi-flow1.vercel.app",
        "http://localhost:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://127.0.0.1:5503"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
app.use(express.json());

// Request logger for Vercel debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ====== MongoDB Connection (Singleton Pattern for Serverless) ======
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("❌ MONGO_URI is missing in environment variables");
        return;
    }
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        isConnected = true;
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
    }
};

const ensureDB = async (req, res, next) => {
    await connectDB();
    next();
};

// ====== Models ======
// Consolidated Doctor model (Auth + Profile)
const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, trim: true },
    specialization: { type: String, trim: true },
    clinicName: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    timings: { type: String, trim: true },
    experience: { type: String, trim: true },
    degree: { type: String, trim: true },
    registrationNo: { type: String, trim: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: true }));

const Medicine = mongoose.models.Medicine || mongoose.model("Medicine", new mongoose.Schema({
    name: { type: String, required: true },
    dosageAmount: String, unit: String, morning: { type: String, default: "none" },
    afternoon: { type: String, default: "none" }, night: { type: String, default: "none" },
    dosage: String, duration: String, code: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }
}));

const Prescription = mongoose.models.Prescription || mongoose.model("Prescription", new mongoose.Schema({
    patientName: { type: String, required: true }, mobile: String, patientEmail: String,
    address: String, sex: String, age: Number, treatmentType: String,
    medicines: [mongoose.Schema.Types.Mixed], notes: String, treatment: String,
    doctor: String, xray: mongoose.Schema.Types.Mixed, xrayAnalysis: mongoose.Schema.Types.Mixed,
    date: { type: Date, default: Date.now },
    followUpDate: Date, doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }
}, { timestamps: true }));

const Patient = mongoose.models.Patient || mongoose.model("Patient", new mongoose.Schema({
    name: { type: String, required: true }, email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true }, password: { type: String, required: true },
    age: Number, gender: String, address: String, resetPasswordToken: String, resetPasswordExpires: Date
}, { timestamps: true }));

const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" }, patientName: String,
    patientEmail: String, patientMobile: String, doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    doctorName: String, doctorEmail: String, doctorMobile: String, preferredDate: String,
    preferredTime: String, reason: String, urgency: { type: String, default: 'medium' },
    status: { type: String, default: 'pending' }, doctorNotes: String, confirmedDate: String, confirmedTime: String
}, { timestamps: true }));

// ====== Middlewares ======
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.doctor = decoded;
        req.user = decoded; // Support both naming conventions
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid or expired token" });
    }
};

const patientAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== "patient") return res.status(403).json({ message: "Not a patient account" });
        req.patient = decoded;
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid or expired token" });
    }
};

// ====== Helper: Generate Response Payload ======
const createAuthResponse = (doctor) => {
    const profile = doctor.toObject();
    delete profile.password;
    delete profile.resetPasswordToken;
    delete profile.resetPasswordExpires;

    // Payload includes both id and userId for maximum compatibility
    const token = jwt.sign({ id: doctor._id, userId: doctor._id, email: doctor.email, role: 'doctor' }, JWT_SECRET, { expiresIn: "7d" });

    return {
        token,
        doctorProfile: profile, // Used by signup.html
        profile: profile,       // Used by authController.js
        doctor: profile,        // Generic fallback
        user: { name: doctor.fullName || doctor.name || doctor.email, email: doctor.email, role: 'doctor' }
    };
};

// ====== API Router ======
const api = express.Router();
api.use(ensureDB);

// Health Check
api.get("/health", (req, res) => res.json({ status: "ok", vercel: !!process.env.VERCEL }));

// --- Doctor Auth ---
api.post("/signup", async (req, res) => {
    const { name, fullName, email, password } = req.body;
    const targetEmail = (email || "").toLowerCase().trim();
    try {
        if (await Doctor.findOne({ email: { $regex: new RegExp("^" + targetEmail + "$", "i") } })) return res.status(400).json({ message: "Email already registered" });
        const doctor = new Doctor({
            email: targetEmail,
            password: await bcrypt.hash(password, 10),
            fullName: fullName || name
        });
        await doctor.save();
        res.status(201).json(createAuthResponse(doctor));
    } catch (err) { res.status(500).json({ message: "Signup failed", error: err.message }); }
});

api.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const targetEmail = (email || "").toLowerCase().trim();
    try {
        const doctor = await Doctor.findOne({ email: { $regex: new RegExp("^" + targetEmail + "$", "i") } });
        if (!doctor || !(await bcrypt.compare(password, doctor.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        res.json(createAuthResponse(doctor));
    } catch (err) { res.status(500).json({ message: "Login failed", error: err.message }); }
});

api.post("/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const doctor = await Doctor.findOne({ email: (email || "").toLowerCase().trim() });
        if (!doctor) return res.json({ message: "If an account exists, a reset link has been sent." });

        const resetToken = crypto.randomBytes(32).toString("hex");
        doctor.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        doctor.resetPasswordExpires = Date.now() + 3600000;
        await doctor.save();

        console.log(`Reset Token for ${email}: ${resetToken}`); // Log for dev/debugging
        res.json({ message: "Check your email for password reset instructions." });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

api.post("/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const doctor = await Doctor.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });
        if (!doctor) return res.status(400).json({ message: "Invalid or expired token" });

        doctor.password = await bcrypt.hash(newPassword, 10);
        doctor.resetPasswordToken = undefined;
        doctor.resetPasswordExpires = undefined;
        await doctor.save();
        res.json({ message: "Password reset successful" });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// --- Doctor Profile ---
api.get("/doctor/profile", authMiddleware, async (req, res) => {
    const doctor = await Doctor.findById(req.doctor.id || req.doctor.userId).select("-password");
    res.json(doctor);
});

api.get("/doctor/profile/:email", async (req, res) => {
    const email = (req.params.email || "").toLowerCase().trim();
    const doctor = await Doctor.findOne({ email }).select("-password");
    if (!doctor) return res.status(404).json({ message: "Profile not found" });
    res.json({ doctor });
});

api.get("/doctors/me", authMiddleware, async (req, res) => {
    const doctor = await Doctor.findById(req.doctor.id || req.doctor.userId).select("-password");
    res.json({ doctor });
});

api.put("/doctor/profile", authMiddleware, async (req, res) => {
    const doctor = await Doctor.findByIdAndUpdate(req.doctor.id || req.doctor.userId, req.body, { new: true }).select("-password");
    res.json({ message: "Profile updated", doctor });
});

api.get("/doctors/profiles", async (req, res) => res.json(await Doctor.find().select("-password").sort({ fullName: 1 })));

// --- Medicines ---
api.get("/medicines", authMiddleware, async (req, res) => res.json(await Medicine.find({ doctorId: req.doctor.id || req.doctor.userId })));
api.post("/medicines", authMiddleware, async (req, res) => {
    const { name, code } = req.body;
    const docId = req.doctor.id || req.doctor.userId;
    res.json(await Medicine.findOneAndUpdate({ code: code.trim(), name: name.trim(), doctorId: docId }, { ...req.body, doctorId: docId }, { new: true, upsert: true }));
});

// --- Prescriptions ---
api.post("/prescriptions/add", authMiddleware, async (req, res) => {
    const docId = req.doctor.id || req.doctor.userId;
    const p = new Prescription({ ...req.body, doctorId: docId });
    await p.save(); res.status(201).json(p);
});

api.get("/prescriptions/history", authMiddleware, async (req, res) => {
    const docId = req.doctor.id || req.doctor.userId;
    res.json({ success: true, items: await Prescription.find({ doctorId: docId }).sort({ createdAt: -1 }) });
});

// --- Chatbot ---
api.post("/chatbot/chat", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });
    const msg = message.toLowerCase();
    let response = "I don't understand yet. Rephrase?";
    if (/[\u0900-\u097F]/.test(msg)) response = "नमस्कार! मी आपला हेल्पबॉट आहे.";
    else if (msg.includes("hello")) response = "Hello! I am your MediFlow assistant.";
    res.json({ success: true, response });
});

// --- Patient Auth ---
api.post("/patient/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
        if (await Patient.findOne({ email })) return res.status(400).json({ message: "Email registered" });
        const patient = new Patient({ ...req.body, password: await bcrypt.hash(password, 10) });
        await patient.save();
        res.status(201).json({ token: jwt.sign({ id: patient._id, email, role: 'patient' }, JWT_SECRET, { expiresIn: "7d" }), patient });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

api.post("/patient/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const patient = await Patient.findOne({ email });
        if (!patient || !(await bcrypt.compare(password, patient.password))) return res.status(400).json({ message: "Invalid credentials" });
        res.json({ token: jwt.sign({ id: patient._id, email, role: 'patient' }, JWT_SECRET, { expiresIn: "7d" }), patient });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// --- Appointments ---
api.post("/patient/appointments", patientAuthMiddleware, async (req, res) => {
    const appointment = new Appointment({ ...req.body, patientId: req.patient.id });
    await appointment.save(); res.status(201).json(appointment);
});

api.get("/doctor/appointments", authMiddleware, async (req, res) => {
    const docId = req.doctor.id || req.doctor.userId;
    res.json(await Appointment.find({ doctorId: docId }).sort({ createdAt: -1 }));
});

// --- Analytics ---
api.get("/analytics/prescriptions", authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const query = { doctorId: req.doctor.id || req.doctor.userId };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }
        const limitNum = limit ? parseInt(limit) : 1000;
        const prescriptions = await Prescription.find(query)
            .sort({ date: -1, createdAt: -1 })
            .limit(limitNum)
            .select("-xray")
            .lean();
        res.json({ success: true, prescriptions, count: prescriptions.length });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

api.get("/analytics/summary", authMiddleware, async (req, res) => {
    try {
        const docId = req.doctor.id || req.doctor.userId;
        const { startDate, endDate } = req.query;
        const query = { doctorId: docId };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }
        const totalPrescriptions = await Prescription.countDocuments(query);
        const uniquePatients = await Prescription.distinct("patientName", query);
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyCount = await Prescription.countDocuments({ ...query, date: { $gte: firstDayOfMonth } });
        res.json({
            success: true,
            summary: {
                totalPrescriptions,
                totalPatients: uniquePatients.length,
                monthlyCount,
                avgPerDay: (totalPrescriptions / 30).toFixed(1)
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

api.get("/analytics/gender-distribution", authMiddleware, async (req, res) => {
    try {
        const query = { doctorId: req.doctor.id || req.doctor.userId };
        const stats = await Prescription.aggregate([
            { $match: query },
            { $group: { _id: "$sex", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        res.json({ success: true, genderDistribution: stats });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

api.get("/analytics/age-distribution", authMiddleware, async (req, res) => {
    try {
        const stats = await Prescription.aggregate([
            { $match: { doctorId: req.doctor.id || req.doctor.userId } },
            {
                $bucket: {
                    groupBy: "$age",
                    boundaries: [0, 19, 36, 51, 66, 150],
                    default: "Unknown",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        res.json({ success: true, ageDistribution: stats });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

api.get("/analytics/top-medicines", authMiddleware, async (req, res) => {
    try {
        const stats = await Prescription.aggregate([
            { $match: { doctorId: req.doctor.id || req.doctor.userId } },
            { $unwind: "$medicines" },
            { $group: { _id: "$medicines.name", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        res.json({ success: true, topMedicines: stats });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

api.get("/analytics/prescriptions-over-time", authMiddleware, async (req, res) => {
    try {
        const stats = await Prescription.aggregate([
            { $match: { doctorId: req.doctor.id || req.doctor.userId } },
            {
                $group: {
                    _id: { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);
        res.json({ success: true, timeSeriesData: stats });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

api.get("/analytics/recent-patients", authMiddleware, async (req, res) => {
    try {
        const patients = await Prescription.find({ doctorId: req.doctor.id || req.doctor.userId })
            .sort({ date: -1, createdAt: -1 })
            .limit(10)
            .select("patientName age sex date mobile")
            .lean();
        res.json({ success: true, recentPatients: patients });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// --- X-Ray ---
api.post("/ai/analyze-xray", authMiddleware, async (req, res) => {
    await new Promise(r => setTimeout(r, 1000));
    res.json({ success: true, result: "Normal lung inflation.", probability: 0.95 });
});

// ====== Robust Path Routing ======
app.use("/api", api);
app.use("/", api);

// Static Fallback
const staticPath = path.join(process.cwd(), "frontend", "html-css");
app.use(express.static(staticPath));
app.get("*", (req, res) => {
    if (req.url.startsWith("/api/")) return res.status(404).json({ message: "API route not found" });
    res.sendFile(path.join(staticPath, "index.html"));
});

module.exports = app;
