const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: { type: String, trim: true },
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relationship: { type: String, trim: true }
  },
  medicalHistory: [{
    condition: { type: String, trim: true },
    diagnosedDate: { type: Date },
    status: { type: String, enum: ['active', 'resolved', 'chronic'], default: 'active' }
  }],
  allergies: [{ type: String, trim: true }],
  currentMedications: [{
    name: { type: String, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date }
  }],
  role: { type: String, default: "patient" },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, {
  timestamps: true
});

// Hash password before saving
patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
patientSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get composite primary key
patientSchema.methods.getCompositeKey = function() {
  return `${this.name.toLowerCase().trim()}|${this.email.toLowerCase().trim()}`;
};

// Static method to create composite key from name and email
patientSchema.statics.createCompositeKey = function(name, email) {
  return `${name.toLowerCase().trim()}|${email.toLowerCase().trim()}`;
};

// COMPOSITE PRIMARY KEY: name + email combination must be unique
patientSchema.index({ name: 1, email: 1 }, { unique: true });

// Mobile should still be unique (one phone per person)
patientSchema.index({ mobile: 1 }, { unique: true });

// Email can be used for login but doesn't need to be globally unique
// (same email can exist with different names)
patientSchema.index({ email: 1 });

module.exports = mongoose.model("Patient", patientSchema);
