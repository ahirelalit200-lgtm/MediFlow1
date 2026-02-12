// frontend/html-css/js/profile.js
document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profileForm");
  if (!profileForm) return console.warn("profileForm not found on page.");

  // Helper: normalize email for consistent storage/lookup
  const normalizeEmail = (e) => (e || "").toLowerCase().trim();

  // Load saved profile if present
  const savedProfile = JSON.parse(localStorage.getItem("doctorProfile") || "null");

  // Prefill form if local data exists
  if (savedProfile) {
    document.getElementById("name").value = savedProfile.fullName || savedProfile.name || "";
    document.getElementById("email").value = savedProfile.email || "";
    document.getElementById("specialization").value = savedProfile.specialization || "";
    document.getElementById("clinicName").value = savedProfile.clinicName || "";
    document.getElementById("address").value = savedProfile.address || "";
    document.getElementById("contact").value = savedProfile.phone || savedProfile.contact || "";
    document.getElementById("timings").value = savedProfile.timings || "";
    document.getElementById("experience").value = savedProfile.experience || "";
    document.getElementById("degree").value = savedProfile.degree || "";
    document.getElementById("RegistrationNo").value = savedProfile.RegistrationNo || "";
  } else {
    // Try to fill email from localStorage email (from signup)
    const email = localStorage.getItem("email");
    if (email) document.getElementById("email").value = email;
  }

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

    // Prefer real token if returned by backend at signup; otherwise fall back to stored token/email
    const storedToken = localStorage.getItem("token");
    const token = storedToken || email; // backend should ideally return JWT at signup/login

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/doctors/profile`, {
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

      // Server may return the created/updated doctor under different keys; normalize it
      const serverProfile = (json && (json.doctor || json.data?.doctor)) ? (json.doctor || json.data?.doctor) : {
        fullName, email, specialization, clinicName, address, phone, timings, experience, degree, RegistrationNo
      };

      // Save locally for quick access (and for prefill when user logs in again)
      localStorage.setItem("doctorProfile", JSON.stringify(serverProfile));
      localStorage.setItem("email", email);

      // IMPORTANT: Clear temporary auth markers created during signup so user must login again
      localStorage.removeItem("token");
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("doctorName");

      alert("Profile saved successfully ✅ Please log in to continue.");

      // Redirect user to login page so they can authenticate properly
      window.location.href = "index.html";
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
      window.location.href = "index.html";
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
        window.location.href = "index.html";
      }
    }
  });
});
