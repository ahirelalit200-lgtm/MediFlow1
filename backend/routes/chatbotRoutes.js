// backend/routes/chatbotRoutes.js
const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

// POST /api/chatbot/chat - Send a message to the chatbot
router.post("/chat", chatbotController.chat);

// GET /api/chatbot/help - Get chatbot capabilities
router.get("/help", chatbotController.getHelp);

module.exports = router;
