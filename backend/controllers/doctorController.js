// backend/controllers/doctorController.js
const DoctorProfile = require("../models/DoctorProfile");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // used to resolve token -> user -> email

/**
 * Normalize request body to expected fields
 */
function normalize(body = {}) {
  return {
    email: (body.email || body.emailAddress || "").toString().trim().toLowerCase(),
    fullName: (body.fullName || body.name || "").toString().trim(),
    specialization: (body.specialization || "").toString().trim(),
    clinicName: (body.clinicName || "").toString().trim(),
    address: (body.address || "").toString().trim(),
    phone: (body.phone || body.contact || "").toString().trim(),
    timings: (body.timings || "").toString().trim(),
    experience: (body.experience || "").toString().trim(),
    degree: (body.degree || "").toString().trim(),
    RegistrationNo: (body.RegistrationNo || body.registrationNo || "").toString().trim()
  };
}

/**
 * POST /api/doctors/profile
 */
exports.saveProfile = async (req, res) => {
  try {
    const data = normalize(req.body);

    if (!data.email || !data.fullName) {
      return res.status(400).json({ message: "email and fullName are required" });
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { email: data.email },
      {
        $set: {
          fullName: data.fullName,
          specialization: data.specialization,
          clinicName: data.clinicName,
          address: data.address,
          phone: data.phone,
          timings: data.timings,
          experience: data.experience,
          degree: data.degree,
          RegistrationNo: data.RegistrationNo
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({ message: "Profile saved", doctor: profile });
  } catch (err) {
    console.error("saveProfile error:", err);
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Profile with this email already exists" });
    }
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * GET /api/doctors/profile/:email
 */
exports.getProfileByEmail = async (req, res) => {
  try {
    const email = (req.params.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "email param required" });

    const profile = await DoctorProfile.findOne({ email });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    return res.json({ doctor: profile });
  } catch (err) {
    console.error("getProfileByEmail error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * GET /api/doctors/profiles
 */
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await DoctorProfile.find().sort({ fullName: 1 });
    return res.json(profiles);
  } catch (err) {
    console.error("getAllProfiles error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * GET /api/doctors/me
 * Accepts Authorization: Bearer <JWT>
 */
exports.getMe = async (req, res) => {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || "";
    const token = auth.split(" ")[1] || auth;
    if (!token) return res.status(400).json({ message: "Authorization token required" });

    // verify JWT and extract userId (keeps compatibility if login signs { userId: ... } )
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = payload.userId || payload.id || payload._id;
    if (!userId) return res.status(400).json({ message: "Invalid token payload" });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found for token" });

    const email = (user.email || "").toString().trim().toLowerCase();
    const profile = await DoctorProfile.findOne({ email });
    if (!profile) return res.status(404).json({ message: "Profile not found for user" });

    return res.json({ doctor: profile });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
