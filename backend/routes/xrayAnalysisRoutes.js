const express = require("express");
const router = express.Router();
const xrayAnalyzer = require("../services/xrayAnalyzer");

/**
 * GET /api/xray-analysis/test
 * Test endpoint to verify route is working
 */
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "X-ray Analysis API is working!",
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/xray-analysis/analyze
 * Analyze a dental X-ray image
 * Body: { imageDataUrl, xrayType }
 */
router.post("/analyze", async (req, res) => {
  try {
    const { imageDataUrl, xrayType } = req.body;

    if (!imageDataUrl) {
      return res.status(400).json({ 
        success: false, 
        error: "imageDataUrl is required" 
      });
    }

    // Validate image data URL format
    if (!imageDataUrl.startsWith('data:image/')) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid image data URL format" 
      });
    }

    console.log("🔬 Analyzing dental X-ray...");
    const analysis = await xrayAnalyzer.analyzeXray(imageDataUrl, xrayType || 'panoramic');

    if (analysis.success) {
      console.log(`✅ Analysis complete: ${analysis.findings.length} findings detected`);
    }

    return res.json(analysis);
  } catch (error) {
    console.error("❌ X-ray analysis error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Analysis failed" 
    });
  }
});

/**
 * POST /api/xray-analysis/report
 * Generate a detailed report from analysis results
 * Body: { analysisResults }
 */
router.post("/report", async (req, res) => {
  try {
    const { analysisResults } = req.body;

    if (!analysisResults) {
      return res.status(400).json({ 
        success: false, 
        error: "analysisResults is required" 
      });
    }

    const report = xrayAnalyzer.generateReport(analysisResults);

    return res.json({ 
      success: true, 
      report 
    });
  } catch (error) {
    console.error("❌ Report generation error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Report generation failed" 
    });
  }
});

module.exports = router;
