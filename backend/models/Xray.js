// backend/models/Xray.js
const mongoose = require("mongoose");

const XraySchema = new mongoose.Schema({
  // Patient Information (using composite key)
  patientName: { type: String, required: true, trim: true },
  patientEmail: { type: String, required: true, lowercase: true },
  mobile: { type: String, trim: true },
  
  // Doctor Information
  doctor: { type: String, required: true, trim: true },
  
  // File Information
  name: { type: String, required: true },      // filename
  type: { type: String, default: "image/jpeg" }, // MIME type
  size: { type: Number },                       // file size in bytes
  dataUrl: { type: String, required: true },    // Base64-encoded image data
  
  // X-ray Details
  xrayType: { 
    type: String, 
    enum: ['dental', 'chest', 'bone', 'abdomen', 'other'], 
    default: 'other' 
  },
  bodyPart: { type: String, trim: true }, // e.g., "left arm", "upper jaw"
  
  // AI Analysis Results
  xrayAnalysis: {
    success: { type: Boolean, default: false },
    xrayType: { type: String },
    findings: [{
      type: { type: String }, // e.g., "cavity", "fracture", "normal"
      location: { type: String }, // e.g., "upper left molar"
      description: { type: String },
      severity: { type: String, enum: ['low', 'medium', 'high'] },
      confidence: { type: Number, min: 0, max: 1 }
    }],
    recommendations: [{ type: String }],
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    confidence: { type: Number, min: 0, max: 1 },
    timestamp: { type: Date, default: Date.now }
  },
  
  // Status and Metadata
  analysisStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  uploadDate: { type: Date, default: Date.now },
  notes: { type: String, default: "" }
}, {
  timestamps: true
});

// Index for faster queries using composite key
XraySchema.index({ patientName: 1, patientEmail: 1 });
XraySchema.index({ mobile: 1 });
XraySchema.index({ doctor: 1 });
XraySchema.index({ uploadDate: -1 });
XraySchema.index({ analysisStatus: 1 });
XraySchema.index({ xrayType: 1 });

module.exports = mongoose.model("Xray", XraySchema);