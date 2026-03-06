const Prescription = require("../models/Prescription");
const Xray = require("../models/Xray");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

// ------------------ GET PATIENT PRESCRIPTIONS ------------------ //
exports.getPrescriptions = async (req, res) => {
  try {
    const patient = req.patient;
    const { page = 1, limit = 10, startDate, endDate, doctorName } = req.query;

    // Build query to find prescriptions by composite key (name + email) or mobile
    let query = {
      $or: [
        {
          $and: [
            { patientEmail: patient.email },
            { patientName: { $regex: new RegExp(patient.name, 'i') } }
          ]
        },
        { mobile: patient.mobile },
        { patientEmail: patient.email }, // Fallback for old records
        { patientName: { $regex: new RegExp(patient.name, 'i') } } // Fallback for old records
      ]
    };

    // Add doctor name filter if provided
    if (doctorName) {
      query.doctor = { $regex: new RegExp(doctorName, 'i') };
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const prescriptions = await Prescription.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(query);

    res.status(200).json({
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error("Get Patient Prescriptions Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ GET PATIENT X-RAYS ------------------ //
exports.getXrays = async (req, res) => {
  try {
    const patient = req.patient;
    const { page = 1, limit = 10 } = req.query;

    console.log("Fetching X-rays for patient:", patient.name, patient.email);

    // Build query using composite key (name + email) with fallbacks
    let query = {
      $or: [
        {
          $and: [
            { patientEmail: patient.email },
            { patientName: { $regex: new RegExp(patient.name, 'i') } }
          ]
        },
        { mobile: patient.mobile },
        { patientEmail: patient.email }, // Fallback for old records
        { patientName: { $regex: new RegExp(patient.name, 'i') } } // Fallback for old records
      ]
    };

    // Get standalone X-rays from Xray collection
    const standaloneXrays = await Xray.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Get more to combine with prescription X-rays

    console.log(`Found ${standaloneXrays.length} standalone X-rays`);

    // Get X-rays from prescriptions
    const prescriptionsWithXrays = await Prescription.find({
      ...query,
      'xray.dataUrl': { $exists: true, $ne: null } // Only prescriptions with X-ray data
    })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Found ${prescriptionsWithXrays.length} prescriptions with X-rays`);

    // Convert prescription X-rays to standard format
    const prescriptionXrays = prescriptionsWithXrays.map(prescription => ({
      _id: prescription._id,
      patientName: prescription.patientName,
      patientEmail: prescription.patientEmail,
      mobile: prescription.mobile,
      doctor: prescription.doctor,
      name: prescription.xray.name || 'X-ray from prescription',
      type: prescription.xray.type || 'image/jpeg',
      size: prescription.xray.size,
      dataUrl: prescription.xray.dataUrl,
      xrayType: prescription.xrayAnalysis?.xrayType || 'other',
      bodyPart: prescription.treatment || 'Not specified',
      analysisStatus: prescription.xrayAnalysis?.success ? 'completed' : 'pending',
      xrayAnalysis: prescription.xrayAnalysis,
      notes: prescription.notes || 'From prescription',
      createdAt: prescription.createdAt || prescription.date,
      uploadDate: prescription.date,
      source: 'prescription' // Mark source for debugging
    }));

    // Combine both sources
    const allXrays = [...standaloneXrays, ...prescriptionXrays];

    // Sort by date (newest first)
    allXrays.sort((a, b) => new Date(b.createdAt || b.uploadDate) - new Date(a.createdAt || a.uploadDate));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedXrays = allXrays.slice(startIndex, endIndex);

    console.log(`Returning ${paginatedXrays.length} X-rays (${standaloneXrays.length} standalone + ${prescriptionXrays.length} from prescriptions)`);

    res.status(200).json({
      xrays: paginatedXrays,
      totalPages: Math.ceil(allXrays.length / limit),
      currentPage: parseInt(page),
      total: allXrays.length,
      sources: {
        standalone: standaloneXrays.length,
        prescriptions: prescriptionXrays.length
      }
    });
  } catch (err) {
    console.error("Get Patient X-rays Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ GET PRESCRIPTION BY ID ------------------ //
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = req.patient;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Verify this prescription belongs to the patient
    const belongsToPatient =
      prescription.patientEmail === patient.email ||
      prescription.mobile === patient.mobile ||
      prescription.patientName.toLowerCase().includes(patient.name.toLowerCase());

    if (!belongsToPatient) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ prescription });
  } catch (err) {
    console.error("Get Prescription By ID Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ GET MEDICATION SCHEDULE ------------------ //
exports.getMedicationSchedule = async (req, res) => {
  try {
    const patient = req.patient;

    // Get recent prescriptions with medicines
    const prescriptions = await Prescription.find({
      $or: [
        { patientEmail: patient.email },
        { mobile: patient.mobile },
        { patientName: { $regex: new RegExp(patient.name, 'i') } }
      ],
      medicines: { $exists: true, $ne: [] }
    })
      .sort({ date: -1 })
      .limit(5);

    // Extract current medications
    const medications = [];
    prescriptions.forEach(prescription => {
      prescription.medicines.forEach(medicine => {
        if (medicine.name && medicine.dosage) {
          medications.push({
            prescriptionId: prescription._id,
            prescriptionDate: prescription.date,
            doctor: prescription.doctor,
            medicine: medicine.name,
            dosage: medicine.dosage,
            duration: medicine.duration,
            instruction: medicine.instruction,
            measure: medicine.measure
          });
        }
      });
    });

    res.status(200).json({ medications });
  } catch (err) {
    console.error("Get Medication Schedule Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ CREATE APPOINTMENT REQUEST ------------------ //
exports.createAppointmentRequest = async (req, res) => {
  try {
    // Monolithic server middleware sets req.patient = decoded token (id, email)
    // Modular middleware sets req.patient = full patient object
    // We need to handle both cases by fetching the patient if necessary.
    let patient = req.patient;

    // If patient doesn't have name (likely from monolithic middleware), fetch from DB
    if (!patient.name || !patient.mobile) {
      console.log("🔹 Fetching full patient details for appointment request...");
      // Try both id and _id as token payload might differ
      const patientId = patient.id || patient._id || patient.patientId;
      patient = await Patient.findById(patientId);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
    }

    const { doctorId, doctorName, doctorEmail, doctorMobile, preferredDate, preferredTime, reason, urgency = 'normal' } = req.body;

    console.log("🔹 Creating appointment request for patient:", patient.name);

    if (!doctorName || !doctorMobile || !preferredDate || !reason) {
      return res.status(400).json({ message: "Doctor name, doctor mobile, preferred date, and reason are required" });
    }

    // Create new appointment request
    const appointmentRequest = new Appointment({
      patientId: patient._id,
      patientName: patient.name,
      patientEmail: patient.email,
      patientMobile: patient.mobile,
      doctorId: doctorId || null,
      doctorName,
      doctorEmail: doctorEmail || null,
      doctorMobile,
      preferredDate: new Date(preferredDate),
      preferredTime,
      reason,
      urgency,
      status: 'pending'
    });

    await appointmentRequest.save();

    res.status(201).json({
      message: "Appointment request submitted successfully",
      appointment: {
        id: appointmentRequest._id,
        doctorName: appointmentRequest.doctorName,
        preferredDate: appointmentRequest.preferredDate,
        preferredTime: appointmentRequest.preferredTime,
        reason: appointmentRequest.reason,
        urgency: appointmentRequest.urgency,
        status: appointmentRequest.status
      }
    });
  } catch (err) {
    console.error("❌ Create Appointment Request Error:", err.message);
    if (err.errors) console.error("❌ Validation Errors:", err.errors);
    res.status(500).json({ message: "Server error", error: err.message, details: err.errors });
  }
};

// ------------------ DELETE X-RAY ------------------ //
exports.deleteXray = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = req.patient;

    // First try to find and delete from standalone X-ray collection
    const deletedXray = await Xray.findOneAndDelete({
      _id: id,
      $or: [
        { patientEmail: patient.email },
        { mobile: patient.mobile },
        { patientName: { $regex: new RegExp(patient.name, 'i') } }
      ]
    });

    if (deletedXray) {
      return res.status(200).json({
        message: "X-ray deleted successfully",
        deletedFrom: "standalone"
      });
    }

    // If not found in standalone collection, try to find and remove from prescription
    const prescription = await Prescription.findOne({
      _id: id,
      $or: [
        { patientEmail: patient.email },
        { mobile: patient.mobile },
        { patientName: { $regex: new RegExp(patient.name, 'i') } }
      ],
      'xray.dataUrl': { $exists: true, $ne: null }
    });

    if (prescription) {
      // Remove the xray field from the prescription
      prescription.xray = undefined;
      await prescription.save();

      return res.status(200).json({
        message: "X-ray deleted successfully",
        deletedFrom: "prescription"
      });
    }

    // If not found in either location
    return res.status(404).json({ message: "X-ray not found or access denied" });

  } catch (err) {
    console.error("Delete X-ray Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ GET DASHBOARD STATS ------------------ //
exports.getDashboardStats = async (req, res) => {
  try {
    const patient = req.patient;

    // Count prescriptions
    const prescriptionCount = await Prescription.countDocuments({
      $or: [
        { patientEmail: patient.email },
        { mobile: patient.mobile },
        { patientName: { $regex: new RegExp(patient.name, 'i') } }
      ]
    });

    // Count standalone X-rays
    const standaloneXrayCount = await Xray.countDocuments({
      $or: [
        { patientEmail: patient.email },
        { mobile: patient.mobile },
        { patientName: { $regex: new RegExp(patient.name, 'i') } }
      ]
    });

    // Count X-rays embedded in prescriptions
    const prescriptionXrayCount = await Prescription.countDocuments({
      $or: [
        { patientEmail: patient.email },
        { mobile: patient.mobile },
        { patientName: { $regex: new RegExp(patient.name, 'i') } }
      ],
      'xray.dataUrl': { $exists: true, $ne: null }
    });

    const totalXrays = standaloneXrayCount + prescriptionXrayCount;

    // Get last visit from prescriptions
    const recentPrescription = await Prescription.findOne({
      $or: [
        { patientEmail: patient.email },
        { mobile: patient.mobile },
        { patientName: { $regex: new RegExp(patient.name, 'i') } }
      ]
    }).sort({ date: -1 });

    // Get last appointment (consider appointments as visits too)
    let recentAppointment = await Appointment.findOne({
      patientEmail: patient.email,
      status: { $in: ['confirmed', 'completed'] }
    }).sort({ preferredDate: -1 });

    // If no confirmed/completed appointments, try any appointment as fallback
    if (!recentAppointment) {
      recentAppointment = await Appointment.findOne({
        patientEmail: patient.email
      }).sort({ preferredDate: -1 });

      if (recentAppointment) {
        console.log("DEBUG - Using fallback appointment with status:", recentAppointment.status);
      }
    }

    console.log("DEBUG - Recent prescription:", {
      found: !!recentPrescription,
      date: recentPrescription?.date,
      createdAt: recentPrescription?.createdAt
    });

    console.log("DEBUG - Recent appointment:", {
      found: !!recentAppointment,
      preferredDate: recentAppointment?.preferredDate,
      createdAt: recentAppointment?.createdAt
    });

    // Determine last visit date (most recent of prescription or appointment)
    let lastVisitDate = null;
    let lastDoctor = null;

    if (recentPrescription && recentAppointment) {
      // Compare dates and take the most recent (use createdAt as fallback)
      const prescriptionDate = recentPrescription.date || recentPrescription.createdAt;
      const appointmentDate = recentAppointment.preferredDate || recentAppointment.createdAt;

      if (prescriptionDate > appointmentDate) {
        lastVisitDate = prescriptionDate;
        lastDoctor = recentPrescription.doctor;
      } else {
        lastVisitDate = appointmentDate;
        lastDoctor = recentAppointment.doctorName;
      }
    } else if (recentPrescription) {
      lastVisitDate = recentPrescription.date || recentPrescription.createdAt;
      lastDoctor = recentPrescription.doctor;
    } else if (recentAppointment) {
      lastVisitDate = recentAppointment.preferredDate || recentAppointment.createdAt;
      lastDoctor = recentAppointment.doctorName;
    }

    res.status(200).json({
      stats: {
        totalPrescriptions: prescriptionCount,
        totalXrays: totalXrays,
        lastVisit: lastVisitDate ? lastVisitDate.toISOString() : null,
        lastDoctor: lastDoctor
      }
    });
  } catch (err) {
    console.error("Get Dashboard Stats Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
