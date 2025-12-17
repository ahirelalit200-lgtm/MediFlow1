// frontend/html-css/js/prescription.js

// --- Helper functions for per-user history (localStorage namespacing) ---
function normalizeEmail(e) {
  return (e || "").toLowerCase().trim();
}
function emailKey(email) {
  return `history_user_${normalizeEmail(email)}`;
}
function currentUserEmail() {
  return normalizeEmail(localStorage.getItem("email") || "");
}

// Cross-tab logout listener
window.addEventListener("storage", function(e) {
  if (e && e.key === "global_logout") {
    const hasAuth = localStorage.getItem("email") || localStorage.getItem("token");
    if (hasAuth) {
      localStorage.removeItem("email");
      localStorage.removeItem("token");
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("doctorName");
      localStorage.removeItem("doctorProfile");
      window.location.href = "index.html";
    }
  }
});

/**
 * Save a history entry for the currently logged-in user.
 * entry should be an object (prescription snapshot, patient, notes, etc.)
 * returns the saved entry (with id and timestamp)
 */
function saveHistoryForCurrentUser(entry = {}) {
  const email = currentUserEmail();
  if (!email) {
    console.warn("No logged-in user found; history not saved.");
    return null;
  }
  const key = emailKey(email);
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(list)) list = [];
  } catch (err) {
    console.warn("Failed to parse existing history, resetting:", err);
    list = [];
  }

  const fullEntry = Object.assign({
    id: `presc_${Date.now()}`,
    timestamp: Date.now()
  }, entry);

  // newest first
  list.unshift(fullEntry);
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save history to localStorage:", err);
  }
  return fullEntry;
}

// --- Main form submission handler ---
const form = document.getElementById("prescriptionForm");
if (!form) {
  console.warn("prescriptionForm not found on page.");
} else {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const prescription = {
      patientName: (document.getElementById("patientName") || {}).value || "",
      mobileNumber: (document.getElementById("mobileNumber") || {}).value || "",
      medicines: [{
        name: (document.getElementById("medicineName") || {}).value || "",
        dosage: (document.getElementById("dosage") || {}).value || "",
        instructions: (document.getElementById("instructions") || {}).value || ""
      }],
      doctorName: (document.getElementById("doctorName") || {}).value || ""
    };

    // Basic validation
    if (!prescription.patientName || !prescription.doctorName) {
      return alert("Please provide patient name and doctor name.");
    }

    // Use token from localStorage if available (prefer real JWT from backend)
    const token = localStorage.getItem("token") || localStorage.getItem("email") || "";

    try {
      const res = await fetch("http://localhost:5000/api/prescriptions", {
        method: "POST",
        headers: Object.assign({
          "Content-Type": "application/json"
        }, token ? { "Authorization": `Bearer ${token}` } : {}),
        body: JSON.stringify(prescription)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Failed to create prescription:", data);
        return alert(data.message || "Failed to save prescription. Please try again.");
      }

      // Use server-provided id if available, otherwise timestamp-generated one will be used
      const savedPrescription = data.prescription || data.data || data || {};
      const entry = {
        patient: prescription.patientName,
        mobileNumber: prescription.mobileNumber,
        prescription: savedPrescription,
        notes: "Printed/Saved prescription",
        serverMessage: data.message || ""
      };

      // Save history for current user
      const savedEntry = saveHistoryForCurrentUser(entry);

      alert(data.message || "Prescription saved successfully.");
      form.reset();

      // Optionally, open print dialog / show saved entry id in console
      console.log("Saved history entry:", savedEntry);
    } catch (err) {
      console.error("Network/server error while saving prescription:", err);
      alert("Server error. Could not save prescription.");
    }
  });
}
