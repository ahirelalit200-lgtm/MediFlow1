const cron = require("node-cron");
const Prescription = require("../models/Prescription");
const PrintJob = require("../models/PrintJob");
const { sendEmail } = require("./email");

/**
 * Runs periodically to send follow-up reminder emails for prescriptions
 * whose followUpDate is today (same calendar date) and reminderSent=false.
 */
function startReminderScheduler() {
  const timezone = process.env.TZ || "UTC";

  // Run every minute to send exactly one day before the follow-up time
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const windowStart = new Date(now.getTime() + oneDayMs);
      const windowEnd = new Date(windowStart.getTime() + 60 * 1000); // 1-minute window

      const due = await Prescription.find({
        // Send reminder for appointments exactly one day from now (within 1-minute window)
        followUpDate: { $gte: windowStart, $lt: windowEnd },
        reminderSent: { $ne: true },
        patientEmail: { $exists: true, $ne: "" }
      }).limit(100);

      for (const pres of due) {
        const to = pres.patientEmail;
        const subject = `Follow-up Reminder (1 day before) for ${pres.patientName}`;
        const when = pres.followUpDate ? new Date(pres.followUpDate).toLocaleString() : new Date().toLocaleString();
        const text = `Dear ${pres.patientName},\n\nThis is a reminder that your follow-up appointment is scheduled for ${when} (in approximately 24 hours).\n\n- ${pres.doctor}`;
        const html = `<p>Dear ${pres.patientName},</p><p>This is a reminder that your follow-up appointment is scheduled for <strong>${when}</strong> (in approximately 24 hours).</p><p>- ${pres.doctor}</p>`;

        try {
          await sendEmail({ to, subject, text, html });
          pres.reminderSent = true;
          await pres.save();
          console.log(`📧 Reminder email sent to ${to} for ${pres.patientName} @ ${when}`);
        } catch (sendErr) {
          console.error("Failed to send reminder email:", sendErr);
        }
      }
    } catch (err) {
      console.error("Reminder scheduler error:", err);
    }
  }, { timezone });
}

/**
 * Processes pending PrintJob documents and sends emails.
 * Runs every 15 seconds to simulate a DB-triggered worker.
 */
function startPrintJobWorker() {
  const timezone = process.env.TZ || "UTC";
  cron.schedule("*/15 * * * * *", async () => {
    try {
      const jobs = await PrintJob.find({ status: "pending" }).sort({ createdAt: 1 }).limit(10);
      for (const job of jobs) {
        try {
          let attachments = [];
          if (job.xray && job.xray.dataUrl) {
            const match = String(job.xray.dataUrl).match(/^data:(.*?);base64,(.*)$/);
            if (match) {
              attachments.push({
                filename: job.xray.name || "xray.png",
                content: Buffer.from(match[2] || "", "base64"),
                contentType: match[1] || "application/octet-stream"
              });
            }
          }
          const info = await sendEmail({ to: job.to, subject: job.subject, html: job.html, text: job.text, attachments });
          job.status = "sent";
          job.error = undefined;
          await job.save();
          console.log("📨 Print job sent:", job._id.toString(), info && (info.messageId || info.response));
        } catch (err) {
          job.status = "failed";
          job.error = err && err.message ? err.message : String(err);
          await job.save();
          console.error("Print job failed:", job._id.toString(), job.error);
        }
      }
    } catch (e) {
      console.error("Print job worker error:", e);
    }
  }, { timezone });
}

module.exports = { startReminderScheduler, startPrintJobWorker };


