// frontend/html-css/js/profile.js

// Fallback API URL in case config.js doesn't load properly
const API_BASE_URL = window.API_BASE_URL || "https://mediflow-api-8796.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profileForm");
  if (!profileForm) return console.warn("profileForm not found on page.");

  // Helper: normalize email for consistent storage/lookup
  const normalizeEmail = (e) => (e || "").toLowerCase().trim();

  // Load saved profile from server if token exists
  const loadProfileFromServer = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/doctors/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const profile = json.doctor;
        if (profile) {
          localStorage.setItem("doctorProfile", JSON.stringify(profile));
          prefillForm(profile);
        }
      }
    } catch (err) {
      console.error("Error fetching profile from server:", err);
    }
  };

  const prefillForm = (data) => {
    if (!data) return;
    if (document.getElementById("name")) document.getElementById("name").value = data.fullName || data.name || "";
    if (document.getElementById("email")) document.getElementById("email").value = data.email || "";
    if (document.getElementById("specialization")) document.getElementById("specialization").value = data.specialization || "";
    if (document.getElementById("clinicName")) document.getElementById("clinicName").value = data.clinicName || "";
    if (document.getElementById("address")) document.getElementById("address").value = data.address || "";
    if (document.getElementById("contact")) document.getElementById("contact").value = data.phone || data.contact || "";
    if (document.getElementById("timings")) document.getElementById("timings").value = data.timings || "";
    if (document.getElementById("experience")) document.getElementById("experience").value = data.experience || "";
    if (document.getElementById("degree")) document.getElementById("degree").value = data.degree || "";
    if (document.getElementById("RegistrationNo")) document.getElementById("RegistrationNo").value = data.RegistrationNo || "";
  };

  // 1) Prefill from localStorage immediately
  const savedProfile = JSON.parse(localStorage.getItem("doctorProfile") || "null");
  if (savedProfile) {
    prefillForm(savedProfile);
  } else {
    const email = localStorage.getItem("email");
    if (email) document.getElementById("email").value = email;
  }

  // 2) Then fetch fresh data from server
  loadProfileFromServer();

  // Submit handler
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    const specialization = document.getElementById("specialization").value.trim();
    const clinicName = document.getElementById("clinicName").value.trim();
    const address = document.getElementById("address").value.trim();
    const phone = document.getElementById("contact").value.trim();
    const timings = document.getElementById("timings").value.trim();
    const experience = document.getElementById("experience").value.trim();
    const degree = document.getElementById("degree").value.trim();
    const RegistrationNo = document.getElementById("RegistrationNo").value.trim();

    if (!fullName || !email) {
      alert("Please enter Full Name and Email.");
      return;
    }

    // Normalize email for consistent keys and server payload
    email = normalizeEmail(email);

    const payload = {
      email,
      fullName,
      specialization,
      clinicName,
      address,
      phone,
      timings,
      experience,
      degree,
      RegistrationNo
    };

    // Only use JWT token - email fallback won't work with auth middleware
    const storedToken = localStorage.getItem("token");
    const token = storedToken;
    
    if (!token) {
      alert("Please login first to save your profile");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/doctors/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({ message: "Invalid JSON response" }));
      if (!res.ok) {
        console.error("Server returned error while saving profile:", json);
        alert(json.message || "Failed to save profile. Please try again.");
        return;
      }

      // Save the profile to localStorage for dashboard use
      localStorage.setItem("doctorProfile", JSON.stringify(json));
      localStorage.setItem("email", email);

      alert("Profile saved successfully! Redirecting to dashboard...");

      // Redirect to doctor dashboard directly (no need to login again)
      window.location.href = "doctor-dashboard.html";
    } catch (err) {
      console.error("Failed to save profile (network/server):", err);
      alert("Server error ❌ (network or server may be down). Please try again later.");
    }
  });

  // Cancel should send user to login (since profile isn't completed)
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      // Also clear temp auth markers on cancel
      localStorage.removeItem("token");
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("doctorName");
      window.location.href = "doctor-dashboard.html";
    });
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
        window.location.href = "doctor-dashboard.html";
      }
    }
  });
});
