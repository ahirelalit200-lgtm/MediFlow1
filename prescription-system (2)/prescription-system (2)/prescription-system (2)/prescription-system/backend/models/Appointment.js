const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  // Patient Information
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true, trim: true },
  patientEmail: { type: String, required: true, lowercase: true },
  patientMobile: { type: String, required: true, trim: true },
  
  // Doctor Information
  doctorName: { type: String, required: true, trim: true },
  doctorMobile: { type: String, required: true, trim: true },
  
  // Appointment Details
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String }, // e.g., "14:00"
  reason: { type: String, required: true, trim: true },
  symptoms: { type: String, trim: true }, // Additional symptoms field
  urgency: { 
    type: String, 
    enum: ['normal', 'urgent', 'emergency'], 
    default: 'normal' 
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Confirmed appointment details (filled by doctor/staff)
  confirmedDate: { type: Date },
  confirmedTime: { type: String },
  doctorNotes: { type: String, trim: true },
  rejectionReason: { type: String, trim: true }, // Reason for rejection
  
  // Timestamps
  requestedAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  rejectedAt: { type: Date },
  statusUpdatedAt: { type: Date },
  notesUpdatedAt: { type: Date }
}, {
  timestamps: true
});

// Index for efficient queries
appointmentSchema.index({ doctorMobile: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ preferredDate: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
