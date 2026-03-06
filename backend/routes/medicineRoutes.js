// backend/routes/medicineRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// Try to load real controller, otherwise use simple placeholders
let medicineController;
try {
  medicineController = require("../controllers/medicineController");
} catch (err) {
  console.warn("medicineController not found or errored; using placeholders.");
  medicineController = {
    addMedicine: async (req, res) => {
      return res.status(201).json({ message: "medicine add placeholder", body: req.body });
    },
    listMedicines: async (req, res) => {
      return res.json([]);
    },
    getMedicine: async (req, res) => {
      return res.json({ message: "medicine get placeholder", id: req.params.id });
    },
    deleteMedicine: async (req, res) => {
      return res.json({ message: "medicine delete placeholder", id: req.params.id });
    }
  };
}

// Routes (basic CRUD), all protected and scoped by doctor
router.post("/", auth, medicineController.addMedicine);
router.get("/", auth, medicineController.listMedicines);
router.get("/code/:code", auth, medicineController.getByCode); // lookup by code for current doctor
router.get("/:id", auth, medicineController.getMedicine);
router.delete("/:id", auth, medicineController.deleteMedicine);

module.exports = router;
