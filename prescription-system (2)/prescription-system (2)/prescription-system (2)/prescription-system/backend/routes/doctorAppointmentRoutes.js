const express = require("express");
const router = express.Router();
const doctorAppointmentController = require("../controllers/doctorAppointmentController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require doctor authentication
router.use(authMiddleware);

// Get doctor's appointments
router.get("/", doctorAppointmentController.getDoctorAppointments);

// Get appointment statistics
router.get("/stats", doctorAppointmentController.getAppointmentStats);

// Update appointment status
router.put("/:appointmentId", doctorAppointmentController.updateAppointmentStatus);

// Delete appointment
router.delete("/:appointmentId", doctorAppointmentController.deleteAppointment);

module.exports = router;
