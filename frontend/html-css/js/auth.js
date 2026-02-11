// frontend/html-css/js/auth.js
const form = document.getElementById("auth-form");
const title = document.getElementById("auth-title");
const toggle = document.querySelector(".auth-toggle");
const nameGroup = document.getElementById("name-group");

let isLogin = false;

// Toggle between login and signup
const toggleForm = () => {
  isLogin = !isLogin;
  title.textContent = isLogin ? "Login" : "Sign Up";
  toggle.textContent = isLogin
    ? "Don't have an account? Sign up"
    : "Already have an account? Login";
  nameGroup.style.display = isLogin ? "none" : "block";
  form.querySelector("button").textContent = isLogin ? "Login" : "Sign Up";
};
toggle.addEventListener("click", toggleForm);

// Helper to persist auth info consistently
function saveAuthLocals(emailRaw, serverData = {}) {
  const email = (emailRaw || "").toLowerCase().trim();
  // Prefer real token from server if provided (JWT), otherwise fall back to email
  const token = serverData.token || serverData?.data?.token || email;
  const nameFromServer = serverData.user?.name || serverData.name || serverData?.data?.user?.name;

  localStorage.setItem("token", token);
  localStorage.setItem("email", email);
  localStorage.setItem("doctorName", nameFromServer || serverData.user?.name || "");
  localStorage.setItem("loggedIn", "true");

  // If backend returned a profile directly, persist it so profile page can read it
  const returnedProfile =
    serverData.profile ||
    serverData.doctor ||
    serverData.doctorProfile ||
    serverData.data?.profile ||
    serverData.data?.doctor ||
    serverData.data?.doctorProfile ||
    null;

  if (returnedProfile) {
    try {
      localStorage.setItem("doctorProfile", JSON.stringify(returnedProfile));
    } catch (err) {
      console.warn("Failed to save doctorProfile to localStorage:", err);
    }
  }
}

// Helper to fetch profile from server using token and persist it
async function fetchAndSaveProfileFromServer(token) {
  if (!token) return;
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/doctors/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      // if 401/404 etc., just bail silently (frontend will handle missing profile)
      return;
    }
    const json = await res.json().catch(() => null);
    const profile = json && (json.doctor || json.profile || json.data?.doctor || json.data?.profile) ? (json.doctor || json.profile || json.data?.doctor || json.data?.profile) : null;
    if (profile) {
      try {
        localStorage.setItem("doctorProfile", JSON.stringify(profile));
      } catch (err) {
        console.warn("Failed to save fetched profile to localStorage:", err);
      }
    }
  } catch (err) {
    console.warn("Could not fetch profile from server:", err);
  }
}

// Handle form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const emailRaw = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!emailRaw || !password || (!isLogin && !name)) {
    return alert("Please fill required fields.");
  }

  const endpoint = isLogin ? "/api/login" : "/api/signup";
  const payload = isLogin ? { email: emailRaw, password } : { name, email: emailRaw, password };

  try {
    const res = await fetch(`${window.API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return alert(data.message || "Authentication failed");
    }

    // Persist auth info (prefer backend token if available) and store any profile returned
    saveAuthLocals(emailRaw, data);

    // If this was a login, attempt to fetch the server's canonical profile using the token.
    // This ensures profile is present after logout/login even if signup flow cleared temp storage.
    if (isLogin) {
      const token = data.token || data?.data?.token || localStorage.getItem("token");
      await fetchAndSaveProfileFromServer(token);

      // After login → dashboard
      location.href = "dashboard.html";
    } else {
      // After signup → profile setup page
      location.href = "profile-setup.html";
    }
  } catch (err) {
    console.error("Auth error:", err);
    alert("Server error. Please try again.");
  }
});
