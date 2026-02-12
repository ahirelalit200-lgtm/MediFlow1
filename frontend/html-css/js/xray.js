// js/xray.js

document.addEventListener("DOMContentLoaded", () => {
  const xrayForm = document.getElementById("xray-form");
  const xrayImageInput = document.getElementById("xrayImage");
  const patientNameInput = document.getElementById("patientName");
  const patientMobileInput = document.getElementById("patientMobile");
  const xrayPreview = document.getElementById("xray-preview");

  // Preview X-ray when selected
  xrayImageInput.addEventListener("change", () => {
    const file = xrayImageInput.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        xrayPreview.innerHTML = `<img src="${e.target.result}" alt="X-ray Image" />`;
      };
      reader.readAsDataURL(file);
    } else {
      xrayPreview.innerHTML = "<p style='color:red;'>Please select a valid image file.</p>";
    }
  });

  // Handle form submit: save to local history for this user so history.html can display it
  xrayForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = (patientNameInput.value || "").trim();
    const mobile = (patientMobileInput.value || "").trim();
    const file = xrayImageInput.files && xrayImageInput.files[0];

    if (!name || !mobile || !file) {
      alert("Please enter patient name, mobile number, and select an image.");
      return;
    }

    if (!file.type || !file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const dataUrl = e.target && e.target.result ? String(e.target.result) : null;
      if (!dataUrl) {
        alert("Failed to read image. Please try again.");
        return;
      }

      // Build an entry compatible with history.html normalizeItem() logic
      const doctorProfile = JSON.parse(localStorage.getItem("doctorProfile") || "null");
      const doctorName = (doctorProfile && (doctorProfile.fullName || doctorProfile.name)) || "-";

      const xrayData = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: dataUrl
      };

      const prescription = {
        patientName: name,
        mobile: mobile,
        doctor: doctorName,
        notes: "X-ray uploaded",
        medicines: [],
        xray: xrayData,
        date: new Date().toISOString()
      };

      try {
        // 1. Save to database via API
        const token = localStorage.getItem("token");
        const saveToDatabase = async () => {
          try {
            // Save to X-ray collection
            const xrayResponse = await fetch(`${window.API_BASE_URL}/api/xrays`, {
              method: "POST",
              headers: Object.assign(
                { "Content-Type": "application/json" },
                token ? { "Authorization": `Bearer ${token}` } : {}
              ),
              body: JSON.stringify({
                patientName: name,
                mobile: mobile,
                doctor: doctorName,
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: dataUrl,
                notes: "X-ray uploaded via xray.html"
              })
            });

            if (xrayResponse.ok) {
              console.log("✅ X-ray saved to database");
            } else {
              console.warn("⚠️ X-ray database save failed:", await xrayResponse.text());
            }
          } catch (err) {
            console.error("❌ Failed to save X-ray to database:", err);
          }
        };

        // Execute database save (non-blocking)
        saveToDatabase();

        // 2. Save to local history for frontend display
        if (window.historyUtils && typeof window.historyUtils.saveHistoryForCurrentUser === "function") {
          window.historyUtils.saveHistoryForCurrentUser({
            patient: name,
            mobileNumber: mobile,
            prescription
          });
        } else {
          // Fallback: direct localStorage write to the per-user key
          const email = (localStorage.getItem("email") || "").toLowerCase().trim();
          if (email) {
            const key = `history_user_${email}`;
            const list = JSON.parse(localStorage.getItem(key) || "[]");
            const timestamp = Date.now();
            const id = `xray_${timestamp}_${Math.random().toString(36).slice(2, 9)}`;
            list.unshift({ id, timestamp, patient: name, mobileNumber: mobile, prescription });
            localStorage.setItem(key, JSON.stringify(list));
          }
        }

        alert(`X-ray for ${name} saved successfully.`);
        xrayForm.reset();
        xrayPreview.innerHTML = "";
      } catch (err) {
        console.error("Failed to save X-ray:", err);
        alert("Failed to save X-ray.");
      }
    };
    reader.readAsDataURL(file);
  });

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
