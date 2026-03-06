const Appointment = require("../models/Appointment");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");

// ------------------ GET DOCTOR APPOINTMENTS ------------------ //
exports.getDoctorAppointments = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status, urgency, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get doctor profile to find mobile number
    let user;
    if (userId.toString().includes('@')) {
      user = await User.findOne({ email: userId });
    } else {
      user = await User.findById(userId);
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const doctorProfile = await DoctorProfile.findOne({ email: user.email });

    if (!doctorProfile) {
      return res.status(400).json({ message: "Doctor profile not found. Please complete your profile setup first." });
    }

    const doctorMobile = doctorProfile.mobile || doctorProfile.phone;

    if (!doctorMobile) {
      return res.status(400).json({ message: "Mobile number required in doctor profile. Please update your profile with a phone number." });
    }

    // Build query to find appointments for this doctor using multiple identifiers for robustness
    let query = {
      $or: [
        { doctorMobile: doctorMobile },
        { doctorEmail: user.email },
        { doctorId: user._id }
      ]
    };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add urgency filter
    if (urgency) {
      query.urgency = urgency;
    }

    // Add date range filter
    if (startDate || endDate) {
      query.preferredDate = {};
      if (startDate) query.preferredDate.$gte = new Date(startDate);
      if (endDate) query.preferredDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .sort({ preferredDate: 1, requestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      doctorInfo: {
        name: doctorProfile.fullName || user.name,
        mobile: doctorProfile.phone || doctorProfile.mobile
      }
    });
  } catch (err) {
    console.error("Get Doctor Appointments Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ UPDATE APPOINTMENT STATUS ------------------ //
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointmentId } = req.params;
    const { status, confirmedDate, confirmedTime, doctorNotes } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get doctor profile
    let user;
    if (userId.toString().includes('@')) {
      user = await User.findOne({ email: userId });
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const doctorProfile = await DoctorProfile.findOne({ email: user.email });

    if (!doctorProfile) {
      return res.status(400).json({ message: "Doctor profile not found. Please complete your profile setup first." });
    }

    const doctorMobile = doctorProfile.phone || doctorProfile.mobile;

    if (!doctorMobile) {
      return res.status(400).json({ message: "Mobile number required in doctor profile. Please update your profile with a phone number." });
    }

    // Find appointment and verify it belongs to this doctor using multiple identifiers
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      $or: [
        { doctorMobile: doctorMobile },
        { doctorEmail: user.email },
        { doctorId: user._id }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or access denied" });
    }

    // Update appointment
    appointment.status = status;
    if (doctorNotes) appointment.doctorNotes = doctorNotes;

    if (status === 'confirmed') {
      appointment.confirmedDate = confirmedDate ? new Date(confirmedDate) : appointment.preferredDate;
      appointment.confirmedTime = confirmedTime || appointment.preferredTime;
      appointment.confirmedAt = new Date();
    } else if (status === 'completed') {
      appointment.completedAt = new Date();
    }

    await appointment.save();

    res.status(200).json({
      message: "Appointment updated successfully",
      appointment: {
        id: appointment._id,
        patientName: appointment.patientName,
        patientMobile: appointment.patientMobile,
        preferredDate: appointment.preferredDate,
        confirmedDate: appointment.confirmedDate,
        confirmedTime: appointment.confirmedTime,
        status: appointment.status,
        urgency: appointment.urgency,
        reason: appointment.reason,
        doctorNotes: appointment.doctorNotes
      }
    });
  } catch (err) {
    console.error("Update Appointment Status Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ GET APPOINTMENT STATS ------------------ //
exports.getAppointmentStats = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get doctor profile
    let user;
    if (userId.toString().includes('@')) {
      user = await User.findOne({ email: userId });
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const doctorProfile = await DoctorProfile.findOne({ email: user.email });

    if (!doctorProfile) {
      return res.status(400).json({ message: "Doctor profile not found. Please complete your profile setup first." });
    }

    const doctorMobile = doctorProfile.phone || doctorProfile.mobile;

    // Build orConditions flexibly - mobile is optional
    const orConditions = [
      { doctorEmail: user.email },
      { doctorId: user._id }
    ];
    if (doctorMobile) {
      orConditions.unshift({ doctorMobile: doctorMobile });
    }

    console.log(`📊 Stats for doctor email: ${user.email}, mobile: ${doctorMobile}`);

    // Build queries using $and to correctly combine $or with filters
    const makeQuery = (extra = {}) => ({
      $and: [
        { $or: orConditions },
        ...Object.entries(extra).map(([k, v]) => ({ [k]: v }))
      ]
    });

    // Get appointment statistics
    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      urgentAppointments,
      todayAppointments
    ] = await Promise.all([
      Appointment.countDocuments({ $or: orConditions }),
      Appointment.countDocuments(makeQuery({ status: 'pending' })),
      Appointment.countDocuments(makeQuery({ status: 'confirmed' })),
      Appointment.countDocuments(makeQuery({ urgency: { $in: ['urgent', 'emergency'] } })),
      Appointment.countDocuments(makeQuery({
        preferredDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }))
    ]);

    console.log(`📊 Stats result - total: ${totalAppointments}, pending: ${pendingAppointments}, confirmed: ${confirmedAppointments}`);

    res.status(200).json({
      stats: {
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        urgentAppointments,
        todayAppointments
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ DELETE APPOINTMENT ------------------ //
exports.deleteAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointmentId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get doctor profile
    let user;
    if (userId.toString().includes('@')) {
      user = await User.findOne({ email: userId });
    } else {
      user = await User.findById(userId);
    }

    // Safety check - though auth middleware should handle this
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctorProfile = await DoctorProfile.findOne({ email: user.email });
    const doctorMobile = doctorProfile?.phone || doctorProfile?.mobile;

    if (!doctorProfile || !doctorMobile) {
      return res.status(400).json({ message: "Mobile number required in doctor profile. Please update your profile with a phone number." });
    }

    // Find and delete appointment - ensuring it belongs to this doctor
    const result = await Appointment.findOneAndDelete({
      _id: appointmentId,
      $or: [
        { doctorMobile: doctorMobile },
        { doctorEmail: user.email },
        { doctorId: user._id }
      ]
    });

    if (!result) {
      return res.status(404).json({ message: "Appointment not found or access denied" });
    }

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("Delete Appointment Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
