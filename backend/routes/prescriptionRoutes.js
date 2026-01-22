// backend/routes/prescriptionRoutes.js
const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");
const { sendEmail } = require("../utils/email");
const PrintJob = require("../models/PrintJob");

/**
 * Helper: ensure medicines is an array of objects with predictable keys
 */
function normalizeMedicines(meds) {
  if (!meds) return [];
  if (!Array.isArray(meds)) return [];

  return meds.map(m => {
    if (!m || typeof m !== "object") {
      // if it's a plain string like "Paracetamol", convert to object
      return { name: String(m || ""), dosage: "", duration: "", measure: "", instruction: "" };
    }
    return {
      name: (m.name || m.nameText || m.medicine || "").toString(),
      dosage: (m.dosage || m.dose || "").toString(),
      duration: (m.duration || "").toString(),
      measure: (m.measure || "").toString(),
      instruction: (m.instruction || m.instr || "").toString()
    };
  });

/**
 * POST /api/prescriptions/print-email
 * Enqueue a print email job; a DB trigger (change stream) will send it.
 * Body: { to, subject, html, text?, xray?: { name, dataUrl } }
 */
router.post("/print-email", async (req, res) => {
  try {
    const { to, subject, html, text, xray } = req.body || {};
    if (!to || !subject || !html) {
      return res.status(400).json({ error: "to, subject, html are required" });
    }
    const job = await PrintJob.create({ to, subject, html, text, xray, status: "pending" });
    console.log("🖨️  Enqueued print email job:", job._id.toString(), to);
    return res.status(202).json({ message: "Print email enqueued", id: job._id });
  } catch (err) {
    console.error("Failed to enqueue print email job:", err);
    return res.status(500).json({ error: err.message || "Enqueue failed" });
  }
});
}

/**
 * POST /api/prescriptions/add
 * Save a new prescription
 */
router.post("/add", async (req, res) => {
  try {
    // tolerate different field names from various frontends
    const body = req.body || {};

    const patientName = (body.patientName || body.patient_name || body.name || "").toString().trim();
    const mobile = (body.mobile || body.mobileNumber || body.contact || "").toString().trim();
    const address = (body.address || "").toString().trim();
    const sex = (body.sex || "").toString().trim();
    const ageRaw = body.age || body.patientAge;
    const age = ageRaw ? parseInt(ageRaw, 10) : undefined;
    const notes = (body.notes || body.note || "").toString().trim();
    const treatment = (body.treatment || "").toString().trim();
    const treatmentType = (body.treatmentType || "").toString().trim();
    const doctor = (body.doctor || body.doctorName || body.doctor_name || "").toString().trim();
    const patientEmail = (body.patientEmail || body.email || "").toString().trim().toLowerCase();
    const followUpDateRaw = body.followUpDate || body.follow_up_date || body.followUp;
    const followUpDate = followUpDateRaw ? new Date(followUpDateRaw) : undefined;
    const medicines = normalizeMedicines(body.medicines || body.meds || body.medicineList);

    // Debug logging
    console.log("📝 Received prescription data:", {
      patientName,
      patientEmail,
      followUpDate: followUpDate ? followUpDate.toISOString() : "none",
      doctor
    });

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
      treatment,
      treatmentType,
      doctor,
      date: body.date ? new Date(body.date) : undefined,
      followUpDate,
      reminderSent: false,
      xray: body.xray || undefined,
      xrayAnalysis: body.xrayAnalysis || undefined
    });

    const saved = await prescription.save();
    console.log("💾 Saved prescription:", {
      patientEmail: saved.patientEmail,
      hasXray: !!saved.xray,
      hasXrayAnalysis: !!saved.xrayAnalysis
    });
    return res.status(201).json({ message: "Prescription saved", prescription: saved });
  } catch (err) {
    console.error("Error saving prescription:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

/**
 * GET /api/prescriptions
 * Fetch all prescriptions (for analytics dashboard)
 * Optional query params: ?limit=...
 */
router.get("/", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 1000;

    // Return most recent first
    const prescriptions = await Prescription.find({})
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

    console.log(`📊 Fetched ${prescriptions.length} prescriptions for analytics`);
    return res.json({ prescriptions, count: prescriptions.length });
  } catch (err) {
    console.error("Error fetching prescriptions:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

/**
 * GET /api/prescriptions/history
 * Query params: ?name=...&mobile=...
 */
router.get("/history", async (req, res) => {
  try {
    const { name, mobile } = req.query;
    const query = {};

    if (name) query.patientName = { $regex: new RegExp(name, "i") };
    if (mobile) query.mobile = mobile;

    // Return most recent first
    const prescriptions = await Prescription.find(query).sort({ date: -1 });

    return res.json(prescriptions);
  } catch (err) {
    console.error("Error fetching history:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
 
/**
 * POST /api/prescriptions/email
 * Send prescription email to patient, with optional X-ray image (data URL) as attachment.
 * Body: { to, subject, html, text?, xray?: { name, dataUrl } }
 */
router.post("/email", async (req, res) => {
  try {
    const { to, subject, html, text, xray } = req.body || {};
    if (!to || !subject || !html) {
      return res.status(400).json({ error: "to, subject, html are required" });
    }

    console.log("✉️  Email request:", { 
      to, 
      hasHtml: !!html, 
      hasXray: !!(xray && xray.dataUrl),
      hasXrayAnalysis: !!(req.body.xrayAnalysis && req.body.xrayAnalysis.success)
    });
    
    // Log if AI analysis is present
    if (req.body.xrayAnalysis && req.body.xrayAnalysis.success) {
      console.log("🤖 AI Analysis included in email:", {
        severity: req.body.xrayAnalysis.severity,
        findingsCount: req.body.xrayAnalysis.findings?.length,
        recommendationsCount: req.body.xrayAnalysis.recommendations?.length
      });
    }
    
    // Check if HTML contains AI analysis section
    const hasAIinHTML = html.includes('AI X-ray Analysis Results') || html.includes('🤖');
    if (hasAIinHTML) {
      console.log("✅ AI Analysis section found in email HTML");
    } else if (req.body.xrayAnalysis) {
      console.warn("⚠️  AI Analysis data present but NOT in email HTML");
    }

    let attachments = [];
    if (xray && xray.dataUrl) {
      try {
        // Parse data URL: data:<mime>;base64,<data>
        const match = String(xray.dataUrl).match(/^data:(.*?);base64,(.*)$/);
        if (match) {
          const mime = match[1] || "application/octet-stream";
          const b64 = match[2] || "";
          
          // Validate base64 data exists
          if (!b64 || b64.length === 0) {
            console.warn("⚠️  X-ray data URL has no base64 content");
          } else {
            const sizeInMB = (b64.length * 0.75 / 1024 / 1024).toFixed(2); // Approximate decoded size
            console.log(`📎 X-ray attachment: ${xray.name}, size: ~${sizeInMB} MB`);
            
            // Check if size is reasonable (< 10MB)
            if (b64.length * 0.75 > 10 * 1024 * 1024) {
              console.warn(`⚠️  X-ray is very large (${sizeInMB} MB), may fail to send`);
            }
            
            attachments.push({
              filename: xray.name || "xray.png",
              content: Buffer.from(b64, "base64"),
              contentType: mime
            });
          }
        } else {
          console.warn("⚠️  X-ray data URL format is invalid");
        }
      } catch (err) {
        console.error("❌ Error processing X-ray attachment:", err.message);
        // Continue without attachment rather than failing the entire email
      }
    }

    const info = await sendEmail({ to, subject, html, text, attachments });
    const msgId = info && (info.messageId || info.response);
    console.log(`📧 Prescription email sent to ${to}`, msgId ? `id=${msgId}` : "");
    return res.json({ message: "Prescription email sent", id: msgId, sent: true });
  } catch (err) {
    console.error("❌ Prescription email send failed:", err);
    return res.status(500).json({ error: err.message || "Email send failed", sent: false });
  }
});
