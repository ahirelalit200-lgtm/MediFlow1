// frontend/html-css/js/patient-dashboard.js

// Check authentication on page load
function checkPatientAuth() {
  const token = localStorage.getItem("patientToken");
  const userType = localStorage.getItem("userType");

  if (!token || userType !== "patient") {
    window.location.href = "patient-auth.html";
    return false;
  }
  return true;
}

// Get patient info from localStorage
function getPatientInfo() {
  try {
    const profile = localStorage.getItem("patientProfile");
    if (profile) {
      return JSON.parse(profile);
    }
    return {
      name: localStorage.getItem("patientName") || "Patient",
      email: localStorage.getItem("patientEmail") || "",
      id: localStorage.getItem("patientId") || ""
    };
  } catch (e) {
    return {
      name: localStorage.getItem("patientName") || "Patient",
      email: localStorage.getItem("patientEmail") || "",
      id: localStorage.getItem("patientId") || ""
    };
  }
}

// Make authenticated API request
async function makePatientAPIRequest(endpoint, options = {}) {
  const token = localStorage.getItem("patientToken");

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);

    if (response.status === 401) {
      // Token expired or invalid
      patientLogout();
      return null;
    }

    return response;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Load dashboard stats
async function loadDashboardStats() {
  try {
    const response = await makePatientAPIRequest("/api/patient/dashboard/stats");

    if (!response || !response.ok) {
      throw new Error("Failed to load stats");
    }

    const data = await response.json();
    const stats = data.stats;

    // Update stat cards
    document.getElementById("total-prescriptions").textContent = stats.totalPrescriptions || 0;
    document.getElementById("total-xrays").textContent = stats.totalXrays || 0;

    // Calculate days since last visit
    if (stats.lastVisit) {
      try {
        const lastVisit = new Date(stats.lastVisit);
        const today = new Date();

        console.log("DEBUG Frontend - lastVisit value:", stats.lastVisit);
        console.log("DEBUG Frontend - parsed lastVisit:", lastVisit);
        console.log("DEBUG Frontend - today:", today);
        console.log("DEBUG Frontend - is lastVisit valid:", !isNaN(lastVisit.getTime()));

        // Check if the date is valid
        if (!isNaN(lastVisit.getTime())) {
          const daysDiff = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
          console.log("DEBUG Frontend - calculated daysDiff:", daysDiff);
          document.getElementById("last-visit").textContent = daysDiff >= 0 ? daysDiff : 0;
        } else {
          console.error("DEBUG Frontend - Invalid date:", stats.lastVisit);
          document.getElementById("last-visit").textContent = "N/A";
        }
      } catch (error) {
        console.error("Error calculating days since last visit:", error);
        document.getElementById("last-visit").textContent = "N/A";
      }
    } else {
      // No previous visits - this is normal for new patients
      document.getElementById("last-visit").textContent = "No visits yet";
    }

    // Show last doctor
    const lastDoctorElement = document.getElementById("last-doctor");
    if (stats.lastDoctor) {
      lastDoctorElement.textContent = stats.lastDoctor;
      lastDoctorElement.style.fontSize = "1.2rem";
    } else {
      lastDoctorElement.textContent = "No doctors yet";
    }

  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    // Show error in stats
    document.getElementById("total-prescriptions").textContent = "Error";
    document.getElementById("total-xrays").textContent = "Error";
    document.getElementById("last-visit").textContent = "Error";
    document.getElementById("last-doctor").textContent = "Error";
  }
}

// Load recent activity
async function loadRecentActivity() {
  const activityList = document.getElementById("recent-activity-list");

  try {
    // Load recent prescriptions
    const response = await makePatientAPIRequest("/api/patient/prescriptions?limit=5");

    if (!response || !response.ok) {
      throw new Error("Failed to load recent activity");
    }

    const data = await response.json();
    const prescriptions = data.prescriptions || [];

    if (prescriptions.length === 0) {
      activityList.innerHTML = '<div class="activity-item"><p>No recent activity found.</p></div>';
      return;
    }

    // Display recent prescriptions
    const activityHTML = prescriptions.map(prescription => {
      const date = new Date(prescription.date).toLocaleDateString();
      const medicineCount = prescription.medicines ? prescription.medicines.length : 0;

      return `
        <div class="activity-item">
          <div class="activity-info">
            <h4>Prescription from Dr. ${prescription.doctor}</h4>
            <p>${medicineCount} medicine(s) prescribed</p>
          </div>
          <div class="activity-date">${date}</div>
        </div>
      `;
    }).join('');

    activityList.innerHTML = activityHTML;

  } catch (error) {
    console.error("Error loading recent activity:", error);
    activityList.innerHTML = '<div class="error">Failed to load recent activity. Please try again later.</div>';
  }
}

// Navigation function
function navigateTo(page) {
  const routes = {
    'prescriptions': 'patient-prescriptions.html',
    'xrays': 'patient-xrays.html',
    'appointments': 'patient-appointments.html',
    'medications': 'patient-medications.html',
    'profile': 'patient-profile.html'
  };

  if (routes[page]) {
    window.location.href = routes[page];
  }
}

// Logout function
function patientLogout() {
  // Clear patient-specific localStorage
  localStorage.removeItem("patientToken");
  localStorage.removeItem("patientEmail");
  localStorage.removeItem("patientName");
  localStorage.removeItem("patientId");
  localStorage.removeItem("patientLoggedIn");
  localStorage.removeItem("patientProfile");
  localStorage.removeItem("userType");

  // Redirect to login
  window.location.href = "maindashboard.html";
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  if (!checkPatientAuth()) {
    return;
  }

  // Set patient name in header
  const patientInfo = getPatientInfo();
  document.getElementById("patient-name").textContent = patientInfo.name;

  // Load dashboard data
  loadDashboardStats();
  loadRecentActivity();
});

// Handle storage events (for cross-tab logout)
window.addEventListener("storage", function (e) {
  if (e.key === "patientToken" && !e.newValue) {
    // Patient token was removed, redirect to login
    window.location.href = "maindashboard.html";
  }
});
