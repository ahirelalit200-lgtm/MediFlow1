// backend/routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");

// Create or Update doctor profile
router.post("/profile", doctorController.saveProfile);

// Get profile by email
router.get("/profile/:email", doctorController.getProfileByEmail);

// Get all doctor profiles
router.get("/profiles", doctorController.getAllProfiles);

// Get current doctor using Authorization header (temporary)
router.get("/me", doctorController.getMe);

module.exports = router;
