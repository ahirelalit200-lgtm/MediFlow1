// backend/models/Prescription.js
const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  dosage: { type: String, default: "" },
  duration: { type: String, default: "" },
  measure: { type: String, default: "" },
  instruction: { type: String, default: "" }
}, { _id: false });

const PrescriptionSchema = new mongoose.Schema({
  patientName: { type: String, required: true, trim: true },
  mobile: { type: String, trim: true },         // unified field name: 'mobile'
  patientEmail: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  sex: { type: String, trim: true },
  age: { type: Number },
  medicines: { type: [MedicineSchema], default: [] },
  notes: { type: String, default: "" },
  treatment: { type: String, default: "" },
  treatmentType: { type: String, default: "" },
  doctor: { type: String, required: true, trim: true }, // unified: 'doctor'
  date: { type: Date, default: Date.now },
  followUpDate: { type: Date },
  reminderSent: { type: Boolean, default: false },
  xray: {
    name: { type: String },
    type: { type: String },
    size: { type: Number },
    dataUrl: { type: String }  // Base64-encoded image data
  },
  xrayAnalysis: {
    success: { type: Boolean },
    xrayType: { type: String },
    timestamp: { type: Date },
    findings: [{
      type: { type: String },
      location: { type: String },
      severity: { type: String },
      confidence: { type: Number },
      description: { type: String }
    }],
    recommendations: [{ type: String }],
    severity: { type: String },
    confidence: { type: Number }
  }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

module.exports = mongoose.model("Prescription", PrescriptionSchema);
