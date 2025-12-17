// backend/models/DoctorProfile.js
const mongoose = require("mongoose");

const DoctorProfileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true },
    clinicName: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    timings: { type: String, trim: true },
    experience: { type: String, trim: true },
    degree: { type: String, trim: true },
    RegistrationNo: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", DoctorProfileSchema);
