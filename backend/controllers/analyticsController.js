// backend/controllers/analyticsController.js
const Prescription = require("../models/Prescription");

/**
 * Get all prescriptions for analytics dashboard
 * Supports filtering by date range
 */
exports.getAllPrescriptions = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const query = {};

    // Apply date filters if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const limitNum = limit ? parseInt(limit) : 1000;

    // Fetch prescriptions sorted by most recent first
    const prescriptions = await Prescription.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limitNum)
      .select('-xray.dataUrl') // Exclude large X-ray data for performance
      .lean();

    console.log(`📊 Fetched ${prescriptions.length} prescriptions for analytics`);
    
    return res.json({ 
      success: true,
      prescriptions, 
      count: prescriptions.length 
    });
  } catch (err) {
    console.error("Error fetching prescriptions for analytics:", err);
    return res.status(500).json({ 
      success: false,
      error: err.message || "Server error" 
    });
  }
};

/**
 * Get analytics statistics summary
 */
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    // Apply date filters
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Get total prescriptions
    const totalPrescriptions = await Prescription.countDocuments(query);

    // Get unique patients
    const uniquePatients = await Prescription.distinct("patientName", query);
    const totalPatients = uniquePatients.length;

    // Get this month's count
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthQuery = { ...query, date: { $gte: firstDayOfMonth } };
    const monthlyCount = await Prescription.countDocuments(monthQuery);

    // Calculate average per day
    const days = startDate && endDate 
      ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
      : 30;
    const avgPerDay = days > 0 ? (totalPrescriptions / days).toFixed(1) : 0;

    return res.json({
      success: true,
      summary: {
        totalPrescriptions,
        totalPatients,
        monthlyCount,
        avgPerDay
      }
    });
  } catch (err) {
    console.error("Error fetching analytics summary:", err);
    return res.status(500).json({ 
      success: false,
      error: err.message || "Server error" 
    });
  }
};

/**
 * Get gender distribution statistics
 */
exports.getGenderDistribution = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const genderStats = await Prescription.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: "$sex", 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    return res.json({
      success: true,
      genderDistribution: genderStats
    });
  } catch (err) {
    console.error("Error fetching gender distribution:", err);
    return res.status(500).json({ 
      success: false,
      error: err.message || "Server error" 
    });
  }
};

/**
 * Get age distribution statistics
 */
exports.getAgeDistribution = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const ageStats = await Prescription.aggregate([
      { $match: query },
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [0, 19, 36, 51, 66, 150],
          default: "Unknown",
          output: {
            count: { $sum: 1 },
            ageGroup: { 
              $literal: ["0-18", "19-35", "36-50", "51-65", "65+"] 
            }
          }
        }
      }
    ]);

    return res.json({
      success: true,
      ageDistribution: ageStats
    });
  } catch (err) {
    console.error("Error fetching age distribution:", err);
    return res.status(500).json({ 
      success: false,
      error: err.message || "Server error" 
    });
  }
};

/**
 * Get most prescribed medicines
 */
exports.getTopMedicines = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const limitNum = limit ? parseInt(limit) : 10;

    const medicineStats = await Prescription.aggregate([
      { $match: query },
      { $unwind: "$medicines" },
      { 
        $group: { 
          _id: "$medicines.name", 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: limitNum }
    ]);

    return res.json({
      success: true,
      topMedicines: medicineStats
    });
  } catch (err) {
    console.error("Error fetching top medicines:", err);
    return res.status(500).json({ 
      success: false,
      error: err.message || "Server error" 
    });
  }
};

/**
 * Get prescriptions over time (daily/weekly/monthly)
 */
exports.getPrescriptionsOverTime = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Default to daily grouping
    const groupByFormat = groupBy === "monthly" 
      ? { year: { $year: "$date" }, month: { $month: "$date" } }
      : groupBy === "weekly"
      ? { year: { $year: "$date" }, week: { $week: "$date" } }
      : { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } };

    const timeStats = await Prescription.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupByFormat,
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    return res.json({
      success: true,
      timeSeriesData: timeStats
    });
  } catch (err) {
    console.error("Error fetching prescriptions over time:", err);
    return res.status(500).json({ 
      success: false,
      error: err.message || "Server error" 
    });
  }
};

/**
 * Get recent patients
 */
exports.getRecentPatients = async (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit) : 10;

    const recentPatients = await Prescription.find({})
      .sort({ date: -1, createdAt: -1 })
      .limit(limitNum)
      .select('patientName age sex date medicines mobile')
      .lean();

    return res.json({
      success: true,
      recentPatients
    });
  } catch (err) {
    console.error("Error fetching recent patients:", err);
    return res.status(500).json({ 
      success: false,
      error: err.message || "Server error" 
    });
  }
};
