// backend/jobs/followUpReminderJob.js
const Prescription = require("../models/Prescription");
const { sendEmail } = require("../utils/email");

function todayRangeLocal() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function runFollowUpReminderJob() {
  const { start, end } = todayRangeLocal();
  console.log(`🔍 Searching for followUpDate between ${start.toISOString()} and ${end.toISOString()}`);

  const due = await Prescription.find({
    followUpDate: { $gte: start, $lte: end },
    patientEmail: { $exists: true, $ne: "" },
    reminderSent: { $ne: true },
  }).limit(500);

  console.log(`🔎 Reminder job found ${due.length} due prescription(s) today`);
  if (due.length === 0) {
    // Debug: show all prescriptions with followUpDate and patientEmail
    const allWithFollowUp = await Prescription.find({
      followUpDate: { $exists: true },
      patientEmail: { $exists: true, $ne: "" }
    }).select('patientName patientEmail followUpDate reminderSent').limit(5);
    console.log(`📋 Recent prescriptions with followUpDate:`, allWithFollowUp.map(p => ({
      patient: p.patientName,
      email: p.patientEmail,
      followUpDate: p.followUpDate,
      reminderSent: p.reminderSent
    })));
  }

  for (const rx of due) {
    try {
      const when = rx.followUpDate ? new Date(rx.followUpDate).toLocaleString() : "today";
      await sendEmail({
        to: rx.patientEmail,
        subject: "Follow-up appointment reminder",
        text: `Hi ${rx.patientName},\n\nThis is a reminder for your follow-up appointment on ${when}.\n\n- ${rx.doctor}`,
        html: `<p>Hi ${rx.patientName},</p><p>This is a reminder for your follow-up appointment on <b>${when}</b>.</p><p>- ${rx.doctor}</p>`,
      });
      rx.reminderSent = true;
      await rx.save();
      console.log(`📧 Reminder email sent to ${rx.patientEmail}`);
    } catch (err) {
      console.error(`❌ Failed for ${rx._id}:`, err.message);
    }
  }
}

module.exports = { runFollowUpReminderJob };
