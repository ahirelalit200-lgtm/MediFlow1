const Patient = require("../models/Patient");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendEmail } = require("../utils/email");

// ------------------ PATIENT SIGNUP ------------------ //
exports.signup = async (req, res) => {
  try {
    const { name, email, password, mobile, dateOfBirth, gender, address } = req.body;

    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ message: "Name, email, password, and mobile are required" });
    }

    // Check if the combination of name + email already exists (composite primary key)
    const existingPatient = await Patient.findOne({ name, email });
    if (existingPatient) {
      return res.status(400).json({ 
        message: "A patient with this name and email combination already exists" 
      });
    }

    const existingMobile = await Patient.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ message: "Mobile number already registered" });
    }

    const newPatient = new Patient({ 
      name, 
      email, 
      password, 
      mobile,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address
    });
    await newPatient.save();

    const token = jwt.sign(
      { patientId: newPatient._id, role: 'patient' }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.status(201).json({
      patient: {
        id: newPatient._id,
        name: newPatient.name,
        email: newPatient.email,
        mobile: newPatient.mobile,
        role: newPatient.role,
      },
      token,
    });
  } catch (err) {
    console.error("Patient Signup Error:", err.message);
    res.status(500).json({ message: "Signup failed. Server error." });
  }
};

// ------------------ PATIENT LOGIN ------------------ //
exports.login = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // If name is provided, use composite key (name + email)
    let query = { email, isActive: true };
    if (name) {
      query.name = name;
    }

    const patients = await Patient.find(query);
    
    // If multiple patients found with same email, require name
    if (patients.length > 1 && !name) {
      const patientNames = patients.map(p => p.name);
      return res.status(400).json({ 
        message: "Multiple accounts found with this email. Please specify your name.",
        requiresName: true,
        availableNames: patientNames
      });
    }

    const patient = patients[0];
    if (!patient) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await patient.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last login
    patient.lastLogin = new Date();
    await patient.save();

    const token = jwt.sign(
      { patientId: patient._id, role: 'patient' }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.status(200).json({
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        mobile: patient.mobile,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        role: patient.role,
      },
      token,
    });
  } catch (err) {
    console.error("Patient Login Error:", err.message);
    res.status(500).json({ message: "Login failed. Server error." });
  }
};

// ------------------ GET PATIENT PROFILE ------------------ //
exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patientId).select('-password');
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({ patient });
  } catch (err) {
    console.error("Get Patient Profile Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ UPDATE PATIENT PROFILE ------------------ //
exports.updateProfile = async (req, res) => {
  try {
    const { name, mobile, dateOfBirth, gender, address, emergencyContact, allergies } = req.body;

    const patient = await Patient.findById(req.patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Update fields if provided
    if (name) patient.name = name;
    if (mobile) patient.mobile = mobile;
    if (dateOfBirth) patient.dateOfBirth = new Date(dateOfBirth);
    if (gender) patient.gender = gender;
    if (address) patient.address = address;
    if (emergencyContact) patient.emergencyContact = emergencyContact;
    if (allergies) patient.allergies = allergies;

    await patient.save();

    res.status(200).json({
      message: "Profile updated successfully",
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        mobile: patient.mobile,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        allergies: patient.allergies,
        role: patient.role,
      }
    });
  } catch (err) {
    console.error("Update Patient Profile Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ FORGOT PASSWORD ------------------ //
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find all patients with this email
    const patients = await Patient.find({ email, isActive: true });
    
    if (patients.length === 0) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // If multiple patients with same email, send reset links for all
    for (const patient of patients) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      // Save hashed token and expiry to database
      patient.resetPasswordToken = hashedToken;
      patient.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await patient.save();

      // Create reset URL
      const resetUrl = `http://localhost:5000/html-css/reset-password.html?token=${resetToken}&type=patient`;

      // Send email
      try {
        await sendEmail({
          to: patient.email,
          subject: "Password Reset Request - MediFlow Patient Portal",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">Password Reset Request</h2>
              <p>Hello ${patient.name},</p>
              <p>You requested to reset your password for your patient account. Click the button below to reset it:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p style="color: #999; font-size: 14px;">This link will expire in 1 hour.</p>
              <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
          `,
          text: `Hello ${patient.name},\n\nYou requested to reset your password. Click this link to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`
        });
      } catch (emailError) {
        console.error("Email sending error for patient:", patient._id, emailError);
        patient.resetPasswordToken = undefined;
        patient.resetPasswordExpires = undefined;
        await patient.save();
      }
    }

    res.status(200).json({ 
      message: "Password reset link has been sent to your email." 
    });
  } catch (err) {
    console.error("Patient Forgot Password Error:", err.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// ------------------ RESET PASSWORD ------------------ //
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Hash the token from URL to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find patient with valid token and not expired
    const patient = await Patient.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!patient) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token. Please request a new password reset." 
      });
    }

    // Update password (will be hashed by pre-save hook)
    patient.password = newPassword;
    patient.resetPasswordToken = undefined;
    patient.resetPasswordExpires = undefined;
    await patient.save();

    res.status(200).json({ 
      message: "Password has been reset successfully. You can now login with your new password." 
    });
  } catch (err) {
    console.error("Patient Reset Password Error:", err.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
