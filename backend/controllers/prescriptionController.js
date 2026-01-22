// backend/controllers/prescriptionController.js
const Prescription = require("../models/Prescription");

/**
 * Helper to normalize medicines array to predictable objects
 */
function normalizeMedicines(meds) {
  if (!meds) return [];
  if (!Array.isArray(meds)) return [];

  return meds.map(m => {
    if (!m || typeof m !== "object") {
      return {
        name: String(m || ""),
        dosage: "",
        duration: "",
        measure: "",
        instruction: ""
      };
    }
    return {
      name: String(m.name || m.nameText || m.medicine || ""),
      dosage: String(m.dosage || m.dose || ""),
      duration: String(m.duration || ""),
      measure: String(m.measure || ""),
      instruction: String(m.instruction || m.instr || "")
    };
  });
}

/**
 * Create and save a new prescription
 */
exports.createPrescription = async (req, res) => {
  try {
    const body = req.body || {};

    // normalize common field name variants
    const patientName = (body.patientName || body.patient_name || body.name || "").toString().trim();
    const mobile = (body.mobile || body.mobileNumber || body.contact || "").toString().trim();
    const address = (body.address || "").toString().trim();
    const sex = (body.sex || "").toString().trim();
    const ageRaw = body.age || body.patientAge;
    const age = ageRaw ? parseInt(ageRaw, 10) : undefined;
    const notes = (body.notes || body.note || "").toString().trim();
    const doctor = (body.doctor || body.doctorName || body.doctor_name || "").toString().trim();

    const medicines = normalizeMedicines(body.medicines || body.meds || body.medicineList);

    // optional contact + reminder fields
    const patientEmail = (body.patientEmail || body.email || "").toString().trim().toLowerCase();
    const followUpDate = body.followUpDate ? new Date(body.followUpDate) : undefined;

    // X-ray data (if provided)
    const xray = body.xray && typeof body.xray === 'object' ? {
      name: body.xray.name || "",
      type: body.xray.type || "",
      size: body.xray.size || 0,
      dataUrl: body.xray.dataUrl || ""
    } : undefined;

    // basic validation
    if (!patientName) return res.status(400).json({ error: "patientName is required" });
    if (!doctor) return res.status(400).json({ error: "doctor is required" });

    const prescription = new Prescription({
      patientName,
      mobile,
      patientEmail,
      address,
      sex,
      age,
      medicines,
      notes,
      doctor,
      // allow backend to set date automatically, but accept provided date if present
      date: body.date ? new Date(body.date) : undefined,
      followUpDate,
      // ensure reminders default to not sent on create
      reminderSent: false,
      // include X-ray if provided
      xray
    });

    const saved = await prescription.save();

    // return the saved document so front-end can use createdAt / _id
    return res.status(201).json({ message: "Prescription saved successfully", prescription: saved });
  } catch (error) {
    console.error("createPrescription error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

/**
 * Fetch history with optional search by name & mobile
 */
exports.getHistory = async (req, res) => {
  try {
    const { name, mobile } = req.query;
    const filter = {};

    if (name) {
      // case-insensitive partial match
      filter.patientName = new RegExp(name, "i");
    }

    if (mobile) {
      // tolerate exact or partial matches
      filter.$or = [
        { mobile: new RegExp(mobile, "i") },
        { mobileNumber: new RegExp(mobile, "i") } // in case some docs used mobileNumber
      ];
    }

    // prefer createdAt (if timestamps enabled) then date field
    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1, date: -1 });

    return res.json(prescriptions);
  } catch (error) {
    console.error("getHistory error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};
