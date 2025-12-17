const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const patientAuth = require("../middleware/patientAuthMiddleware");

// All routes require patient authentication
router.use(patientAuth);

// Dashboard and stats
router.get("/dashboard/stats", patientController.getDashboardStats);

// Prescriptions
router.get("/prescriptions", patientController.getPrescriptions);
router.get("/prescriptions/:id", patientController.getPrescriptionById);

// X-rays
router.get("/xrays", patientController.getXrays);
router.delete("/xrays/:id", patientController.deleteXray);

// Medication schedule
router.get("/medications/schedule", patientController.getMedicationSchedule);

// Appointments
router.post("/appointments/request", patientController.createAppointmentRequest);

module.exports = router;
