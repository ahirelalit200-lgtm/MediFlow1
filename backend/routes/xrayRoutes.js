// backend/routes/xrayRoutes.js
const express = require("express");
const router = express.Router();
const xrayController = require("../controllers/xrayController");

// X-ray routes
router.post("/", xrayController.uploadXray);        // Create/upload X-ray
router.get("/", xrayController.listXrays);          // List all X-rays (with optional filters)
router.get("/:id", xrayController.getXray);         // Get single X-ray by ID
router.delete("/:id", xrayController.deleteXray);   // Delete X-ray by ID

module.exports = router;
