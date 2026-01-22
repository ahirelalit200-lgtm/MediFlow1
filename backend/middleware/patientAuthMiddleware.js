const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient");

const patientAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is a patient token
    if (decoded.role !== 'patient') {
      return res.status(403).json({ message: "Access denied. Patient access required." });
    }

    // Verify patient exists and is active
    const patient = await Patient.findById(decoded.patientId);
    if (!patient || !patient.isActive) {
      return res.status(401).json({ message: "Invalid token or inactive patient." });
    }

    req.patientId = decoded.patientId;
    req.patient = patient;
    next();
  } catch (err) {
    console.error("Patient Auth Middleware Error:", err.message);
    res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = patientAuth;
