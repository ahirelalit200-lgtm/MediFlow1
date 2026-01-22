const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    doctorEmail: { type: String, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    dosageAmount: { type: String, trim: true },
    unit: { type: String, trim: true },
    morning: { type: String, default: "none" },
    afternoon: { type: String, default: "none" },
    night: { type: String, default: "none" },
    code: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Index for efficient lookup (non-unique to allow multiple meds with same code)
MedicineSchema.index({ doctorId: 1, code: 1 });

module.exports = mongoose.model("Medicine", MedicineSchema);






