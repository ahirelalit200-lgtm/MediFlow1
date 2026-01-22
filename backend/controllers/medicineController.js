// backend/controllers/medicineController.js
const Medicine = require("../models/Medicine");

// Create/add a medicine scoped to the logged-in doctor
exports.addMedicine = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    const doctorEmail = req.user?.email || "";
    if (!doctorId) return res.status(401).json({ message: "Unauthorized" });

    const { name, dosageAmount, unit, morning = "none", afternoon = "none", night = "none", code } = req.body || {};
    if (!name || !code) {
      return res.status(400).json({ message: "'name' and 'code' are required" });
    }

    const created = await Medicine.create({
      doctorId,
      doctorEmail: (doctorEmail || "").toLowerCase().trim(),
      name,
      dosageAmount,
      unit,
      morning,
      afternoon,
      night,
      code: String(code).trim(),
    });

    return res.status(201).json({ message: "Medicine saved", medicine: created });
  } catch (err) {
    // Removed duplicate code check (error 11000) to allow multiple meds with same code
    console.error("addMedicine error:", err);
    return res.status(500).json({ message: "Server error while saving medicine" });
  }
};

// List all medicines for the logged-in doctor
exports.listMedicines = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ message: "Unauthorized" });

    const medicines = await Medicine.find({ doctorId }).sort({ createdAt: -1 });
    return res.json({ medicines });
  } catch (err) {
    console.error("listMedicines error:", err);
    return res.status(500).json({ message: "Server error while fetching medicines" });
  }
};

// Get a single medicine by id, scoped to the doctor
exports.getMedicine = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ message: "Unauthorized" });

    const med = await Medicine.findOne({ _id: req.params.id, doctorId });
    if (!med) return res.status(404).json({ message: "Medicine not found" });
    return res.json({ medicine: med });
  } catch (err) {
    console.error("getMedicine error:", err);
    return res.status(500).json({ message: "Server error while fetching medicine" });
  }
};

// Optional: Lookup by code for current doctor (e.g., for prescription use)
exports.getByCode = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ message: "Unauthorized" });
    const { code } = req.params;
    if (!code) return res.status(400).json({ message: "Code is required" });

    // Find ALL medicines with this code (returns array)
    const meds = await Medicine.find({ doctorId, code: String(code).trim() });

    // Always return an array, even if empty, so frontend can handle it
    return res.json({ medicines: meds });
  } catch (err) {
    console.error("getByCode error:", err);
    return res.status(500).json({ message: "Server error while fetching medicines by code" });
  }
};

// Delete a medicine by id, scoped to the doctor
exports.deleteMedicine = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ message: "Unauthorized" });

    const removed = await Medicine.findOneAndDelete({ _id: req.params.id, doctorId });
    if (!removed) return res.status(404).json({ message: "Medicine not found" });
    return res.json({ message: "Medicine deleted", medicine: removed });
  } catch (err) {
    console.error("deleteMedicine error:", err);
    return res.status(500).json({ message: "Server error while deleting medicine" });
  }
};
