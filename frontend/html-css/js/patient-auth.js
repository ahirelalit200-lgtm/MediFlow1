// frontend/html-css/js/patient-auth.js
const form = document.getElementById("patient-auth-form");
const title = document.getElementById("auth-title");
const toggle = document.getElementById("auth-toggle");
const nameGroup = document.getElementById("name-group");
const mobileGroup = document.getElementById("mobile-group");
const additionalFields = document.getElementById("additional-fields");
const submitBtn = document.getElementById("submit-btn");
const messageContainer = document.getElementById("message-container");

let isLogin = true;

// Show message to user
function showMessage(message, type = 'error') {
  messageContainer.innerHTML = `<div class="${type}-message">${message}</div>`;
  setTimeout(() => {
    messageContainer.innerHTML = '';
  }, 5000);
}

// Toggle between login and signup
const toggleForm = () => {
  isLogin = !isLogin;
  title.textContent = isLogin ? "Patient Login" : "Patient Signup";
  toggle.textContent = isLogin
    ? "Don't have an account? Sign up"
    : "Already have an account? Login";
  nameGroup.style.display = isLogin ? "none" : "block";
  mobileGroup.style.display = isLogin ? "none" : "block";
  additionalFields.style.display = isLogin ? "none" : "block";
  submitBtn.textContent = isLogin ? "Login" : "Sign Up";
  messageContainer.innerHTML = '';

  // Toggle forgot password link visibility
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  if (forgotPasswordLink) {
    forgotPasswordLink.style.display = isLogin ? "block" : "none";
  }
};

toggle.addEventListener("click", toggleForm);

// Handle forgot password
async function handleForgotPassword() {
  const email = document.getElementById("email").value.trim();
  if (!email) {
    showMessage("Please enter your email address first.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/patient/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(data.message, 'success');
    } else {
      showMessage(data.message || "Failed to send reset email.", 'error');
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    showMessage("Server error. Please try again later.", 'error');
  }
}

// Make function globally accessible
window.handleForgotPassword = handleForgotPassword;

// Helper to persist patient auth info
function savePatientAuthLocals(patientData, token) {
  localStorage.setItem("patientToken", token);
  localStorage.setItem("patientEmail", patientData.email);
  localStorage.setItem("patientName", patientData.name);
  localStorage.setItem("patientId", patientData.id);
  localStorage.setItem("patientLoggedIn", "true");
  localStorage.setItem("userType", "patient");

  // Store full patient profile
  localStorage.setItem("patientProfile", JSON.stringify(patientData));
}

// Check if patient is already logged in
function checkPatientAuth() {
  const token = localStorage.getItem("patientToken");
  const userType = localStorage.getItem("userType");

  if (token && userType === "patient") {
    window.location.href = "patient-dashboard.html";
  }
}

// Handle form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const dateOfBirth = document.getElementById("dateOfBirth").value;
  const gender = document.getElementById("gender").value;
  const address = document.getElementById("address").value.trim();

  // Validation
  if (!email || !password) {
    showMessage("Email and password are required.");
    return;
  }

  if (!isLogin && (!name || !mobile)) {
    showMessage("Name and mobile number are required for signup.");
    return;
  }

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = isLogin ? "Logging in..." : "Signing up...";

  const endpoint = isLogin ? "/api/patient/auth/login" : "/api/patient/auth/signup";
  const payload = isLogin
    ? { email, password, name: name || undefined } // Include name for login if provided
    : { name, email, password, mobile, dateOfBirth, gender, address };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      // Handle case where multiple patients exist with same email
      if (data.requiresName && data.availableNames) {
        const nameOptions = data.availableNames.map(name => `"${name}"`).join(', ');
        showMessage(`${data.message} Available names: ${nameOptions}. Please enter your name in the Name field above.`);

        // Show name field for login if it's hidden
        if (isLogin) {
          nameGroup.style.display = "block";
        }
        return;
      }

      showMessage(data.message || "Authentication failed");
      return;
    }

    // Success
    const patientData = data.patient;
    const token = data.token;

    // Save auth info
    savePatientAuthLocals(patientData, token);

    showMessage(
      isLogin ? "Login successful! Redirecting..." : "Account created successfully! Redirecting...",
      'success'
    );

    // Redirect to patient dashboard
    setTimeout(() => {
      window.location.href = "patient-dashboard.html";
    }, 1500);

  } catch (err) {
    console.error("Auth error:", err);
    showMessage("Server error. Please try again.");
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = isLogin ? "Login" : "Sign Up";
  }
});

// Check auth on page load
document.addEventListener("DOMContentLoaded", () => {
  checkPatientAuth();
});
