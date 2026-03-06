// backend/controllers/xrayController.js
const Xray = require("../models/Xray");

/**
 * Upload/Create a new X-ray entry in the database
 * Expects: { patientName, mobile, doctor, name, type, size, dataUrl, notes? }
 */
exports.uploadXray = async (req, res) => {
  try {
    const { patientName, mobile, doctor, name, type, size, dataUrl, notes } = req.body || {};

    // Validation
    if (!patientName || !patientName.trim()) {
      return res.status(400).json({ error: "patientName is required" });
    }
    if (!doctor || !doctor.trim()) {
      return res.status(400).json({ error: "doctor is required" });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "X-ray filename is required" });
    }
    if (!dataUrl || !dataUrl.trim()) {
      return res.status(400).json({ error: "X-ray image data is required" });
    }

    const xray = new Xray({
      patientName: patientName.trim(),
      mobile: mobile ? mobile.trim() : "",
      doctor: doctor.trim(),
      name: name.trim(),
      type: type || "image/jpeg",
      size: size || 0,
      dataUrl: dataUrl.trim(),
      notes: notes ? notes.trim() : ""
    });

    const saved = await xray.save();
    console.log("✅ X-ray saved to database:", saved._id);

    return res.status(201).json({ 
      message: "X-ray uploaded successfully", 
      xray: saved 
    });
  } catch (error) {
    console.error("uploadXray error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

/**
 * List all X-rays with optional filtering
 * Query params: patientName, mobile, doctor
 */
exports.listXrays = async (req, res) => {
  try {
    const { patientName, mobile, doctor } = req.query;
    const filter = {};

    if (patientName) {
      filter.patientName = new RegExp(patientName, "i");
    }
    if (mobile) {
      filter.mobile = new RegExp(mobile, "i");
    }
    if (doctor) {
      filter.doctor = new RegExp(doctor, "i");
    }

    const xrays = await Xray.find(filter).sort({ uploadDate: -1, createdAt: -1 });
    
    return res.json(xrays);
  } catch (error) {
    console.error("listXrays error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

/**
 * Get a single X-ray by ID
 */
exports.getXray = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "X-ray ID is required" });
    }

    const xray = await Xray.findById(id);
    
    if (!xray) {
      return res.status(404).json({ error: "X-ray not found" });
    }

    return res.json(xray);
  } catch (error) {
    console.error("getXray error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

/**
 * Delete an X-ray by ID
 */
exports.deleteXray = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "X-ray ID is required" });
    }

    const deleted = await Xray.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "X-ray not found" });
    }

    console.log("🗑️  X-ray deleted from database:", id);
    return res.json({ message: "X-ray deleted successfully", xray: deleted });
  } catch (error) {
    console.error("deleteXray error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};
