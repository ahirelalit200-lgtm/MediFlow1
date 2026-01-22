// backend/models/PrintJob.js
const mongoose = require("mongoose");

const PrintJobSchema = new mongoose.Schema({
  to: { type: String, required: true, lowercase: true, trim: true },
  subject: { type: String, required: true },
  html: { type: String, required: true },
  text: { type: String },
  xray: {
    name: String,
    dataUrl: String
  },
  status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
  error: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("PrintJob", PrintJobSchema);
