const express = require("express");
const router = express.Router();
const patientAuthController = require("../controllers/patientAuthController");
const patientAuth = require("../middleware/patientAuthMiddleware");

// Public routes
router.post("/signup", patientAuthController.signup);
router.post("/login", patientAuthController.login);

// Password reset routes
router.post("/forgot-password", patientAuthController.forgotPassword);
router.post("/reset-password", patientAuthController.resetPassword);

// Protected routes
router.get("/profile", patientAuth, patientAuthController.getProfile);
router.put("/profile", patientAuth, patientAuthController.updateProfile);

module.exports = router;
