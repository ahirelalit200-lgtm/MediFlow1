// frontend/html-css/js/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  const doctorNameEl = document.getElementById("doctor-name");
  const logoutBtn = document.getElementById("logoutBtn");

  // Load and show doctor profile (try backend first, then localStorage fallbacks)
  loadAndShowDoctorName();

  // Listen for cross-tab logout broadcasts
  window.addEventListener("storage", (e) => {
    if (e && e.key === "global_logout") {
      // Only act if user appears logged in on this tab
      const hasAuth = localStorage.getItem("email") || localStorage.getItem("token");
      if (hasAuth) {
        // Perform local logout without rebroadcasting
        performLocalLogout();
      }
    }
  });

  // Bind logout if button present
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
});

// Normalize email helper (consistent with other scripts)
function normalizeEmail(e) {
  return (e || "").toLowerCase().trim();
}

// Try to fetch doctor profile from backend using token
async function fetchDoctorProfileFromServer() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    // Use token-based endpoint to resolve current user's profile
    // Reverted to singular /api/doctor
    const res = await fetch(`${window.API_BASE_URL}/api/doctor/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn("fetchDoctorProfileFromServer: server returned", res.status);
      // try email based as fallback below
    }

    const json = await res.json().catch(() => ({}));
    // Accept several response shapes
    if (json && (json.doctor || json.fullName || json.name)) {
      // The root server returns the doctor object directly or with properties
      return json;
    }
    // If token endpoint failed or returned no profile, try email-based endpoint
    const email = localStorage.getItem("email");
    if (email) {
      try {
        const res2 = await fetch(`${window.API_BASE_URL}/api/doctor/profile/` + encodeURIComponent(email));
        if (res2.ok) {
          const j2 = await res2.json().catch(() => ({}));
          if (j2 && (j2.doctor || j2.data?.doctor)) {
            return j2.doctor || j2.data?.doctor;
          }
        }
      } catch (e) {
        console.warn("email-based profile fetch failed", e);
      }
    }
    return null;
  } catch (err) {
    console.error("Error fetching doctor profile from server:", err);
    return null;
  }
}

async function loadAndShowDoctorName() {
  const doctorNameEl = document.getElementById("doctor-name");
  if (!doctorNameEl) return;

  // 1) try server
  const serverProfile = await fetchDoctorProfileFromServer();
  if (serverProfile) {
    // persist for other pages and show
    localStorage.setItem("doctorProfile", JSON.stringify(serverProfile));
    const name = serverProfile.fullName || serverProfile.name || serverProfile.full_name || "";
    doctorNameEl.textContent = name ? `Dr. ${name}` : "Doctor";
    return;
  }

  // 2) try local doctorProfile stored earlier
  try {
    const localProfileRaw = localStorage.getItem("doctorProfile");
    if (localProfileRaw) {
      const localProfile = JSON.parse(localProfileRaw);
      const name = localProfile.fullName || localProfile.name || "";
      if (name) {
        doctorNameEl.textContent = `Dr. ${name}`;
        return;
      }
    }
  } catch (err) {
    console.warn("Error parsing local doctorProfile", err);
  }

  // 3) fallback to doctorName or generic
  const fallbackName = localStorage.getItem("doctorName");
  doctorNameEl.textContent = fallbackName ? `Dr. ${fallbackName}` : "Doctor";
}

// Clears auth markers but preserves per-user history
function performLocalLogout() {
  // Remove only auth/session related keys
  localStorage.removeItem("email");
  localStorage.removeItem("token");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("doctorName");
  // Do NOT remove keys like history_user_<email> — those hold per-user history

  // Optionally remove cached doctorProfile (so next login fetches fresh)
  localStorage.removeItem("doctorProfile");

  // Redirect to login page
  window.location.href = "index.html";
}

// Public logout: also broadcasts to other tabs/windows
function logout() {
  try {
    localStorage.setItem("global_logout", String(Date.now()));
  } catch (e) {
    // ignore
  }
  performLocalLogout();
}

// Navigation convenience if used by UI
function navigateTo(page) {
  const routes = {
    dashboard: "doctor-dashboard.html",
    prescription: "prescription.html",
    history: "history.html",
    xray: "xray.html",
    profile: "profile.html",
    medicine: "medicine.html",
    appointments: "doctor-appointments.html",
    analytics: "analytics.html",
    signup: "signup.html",
    login: "index.html"
  };

  if (routes[page]) {
    location.href = routes[page];
  } else {
    console.error("Invalid route:", page);
  }
}

// expose logout for debug or external binding if needed
window.logout = logout;
window.navigateTo = navigateTo;
