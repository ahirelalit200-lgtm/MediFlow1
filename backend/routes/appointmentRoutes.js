const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const authMiddleware = require("../middleware/authMiddleware");

// Get all appointment requests (for doctors) - with flexible auth
router.get("/requests", async (req, res) => {
  try {
    console.log("Fetching appointment requests...");
    
    // Get all appointment requests (prioritize pending ones)
    const appointments = await Appointment.find({})
    .sort({ 
      status: 1, // pending first
      urgency: -1, // emergency first
      createdAt: -1 // newest first
    })
    .limit(50);

    console.log(`Found ${appointments.length} appointment requests`);
    
    // Add some debug info
    const statusCounts = appointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log("Status breakdown:", statusCounts);
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointment requests:", error);
    res.status(500).json({ 
      message: "Failed to fetch appointment requests",
      error: error.message 
    });
  }
});

// Accept appointment request
router.post("/:appointmentId/accept", authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    appointment.status = 'confirmed';
    appointment.confirmedAt = new Date();
    appointment.statusUpdatedAt = new Date();
    
    await appointment.save();
    
    console.log(`Appointment ${appointmentId} accepted`);
    
    res.status(200).json({
      message: "Appointment accepted successfully",
      appointment
    });
  } catch (error) {
    console.error("Error accepting appointment:", error);
    res.status(500).json({ 
      message: "Failed to accept appointment",
      error: error.message 
    });
  }
});

// Reject appointment request
router.post("/:appointmentId/reject", authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    appointment.status = 'rejected';
    appointment.rejectionReason = reason || 'No reason provided';
    appointment.rejectedAt = new Date();
    appointment.statusUpdatedAt = new Date();
    
    await appointment.save();
    
    console.log(`Appointment ${appointmentId} rejected`);
    
    res.status(200).json({
      message: "Appointment rejected successfully",
      appointment
    });
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    res.status(500).json({ 
      message: "Failed to reject appointment",
      error: error.message 
    });
  }
});

// Complete appointment
router.post("/:appointmentId/complete", authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    appointment.status = 'completed';
    appointment.completedAt = new Date();
    appointment.statusUpdatedAt = new Date();
    
    await appointment.save();
    
    console.log(`Appointment ${appointmentId} completed`);
    
    res.status(200).json({
      message: "Appointment completed successfully",
      appointment
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res.status(500).json({ 
      message: "Failed to complete appointment",
      error: error.message 
    });
  }
});

// Add notes to appointment
router.post("/:appointmentId/notes", authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    appointment.doctorNotes = notes;
    appointment.notesUpdatedAt = new Date();
    
    await appointment.save();
    
    console.log(`Notes added to appointment ${appointmentId}`);
    
    res.status(200).json({
      message: "Notes added successfully",
      appointment
    });
  } catch (error) {
    console.error("Error adding notes:", error);
    res.status(500).json({ 
      message: "Failed to add notes",
      error: error.message 
    });
  }
});

// Get patient's appointment status
router.get("/patient/:patientId/status", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const appointments = await Appointment.find({
      $or: [
        { patientId: patientId },
        { patientEmail: patientId } // In case patientId is actually email
      ]
    })
    .sort({ createdAt: -1 });
    
    console.log(`Found ${appointments.length} appointments for patient ${patientId}`);
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({ 
      message: "Failed to fetch patient appointments",
      error: error.message 
    });
  }
});

module.exports = router;
