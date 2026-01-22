// frontend/html-css/js/patient-profile.js

let isEditMode = false;
let originalData = {};
let allergies = [];

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

// Show message to user
function showMessage(message, type = 'error') {
  const messageContainer = document.getElementById("message-container");
  const messageClass = type === 'success' ? 'success-message' : 'error-message';

  messageContainer.innerHTML = `<div class="${messageClass}">${message}</div>`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageContainer.innerHTML = '';
  }, 5000);

  // Scroll to top to show message
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load patient profile
async function loadPatientProfile() {
  try {
    const response = await makePatientAPIRequest("/api/patient/auth/profile");

    if (!response || !response.ok) {
      throw new Error("Failed to load profile");
    }

    const data = await response.json();
    const patient = data.patient;

    // Store original data for cancel functionality
    originalData = { ...patient };
    allergies = [...(patient.allergies || [])];

    // Update display
    updateProfileDisplay(patient);
    populateForm(patient);

  } catch (error) {
    console.error("Error loading profile:", error);
    showMessage("Failed to load profile. Please try again later.", 'error');

    // Fallback to localStorage data
    const patientInfo = getPatientInfo();
    updateProfileDisplay(patientInfo);
    populateForm(patientInfo);
  }
}

// Update profile display
function updateProfileDisplay(patient) {
  // Set avatar initial
  const avatar = document.getElementById("profile-avatar");
  const initial = patient.name ? patient.name.charAt(0).toUpperCase() : 'P';
  avatar.textContent = initial;

  // Set display info
  document.getElementById("display-name").textContent = patient.name || 'Unknown';
  document.getElementById("display-email").textContent = patient.email || 'No email';
  document.getElementById("display-mobile").textContent = patient.mobile || 'No mobile';

  // Set member since date
  const memberSince = patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Unknown';
  document.getElementById("member-since").textContent = `Member since: ${memberSince}`;

  // Update navbar name and sidebar name
  const nameElement = document.getElementById("patient-name");
  const sidebarNameElement = document.getElementById("sidebar-patient-name");

  if (nameElement) nameElement.textContent = patient.name || 'Patient';
  if (sidebarNameElement) sidebarNameElement.textContent = patient.name || 'Patient';
}

// Populate form with patient data
function populateForm(patient) {
  document.getElementById("name").value = patient.name || '';
  document.getElementById("email").value = patient.email || '';
  document.getElementById("mobile").value = patient.mobile || '';
  document.getElementById("dateOfBirth").value = patient.dateOfBirth ?
    new Date(patient.dateOfBirth).toISOString().split('T')[0] : '';
  document.getElementById("gender").value = patient.gender || '';
  document.getElementById("address").value = patient.address || '';

  // Emergency contact
  if (patient.emergencyContact) {
    document.getElementById("emergency-name").value = patient.emergencyContact.name || '';
    document.getElementById("emergency-phone").value = patient.emergencyContact.phone || '';
    document.getElementById("emergency-relationship").value = patient.emergencyContact.relationship || '';
  }

  // Allergies
  allergies = [...(patient.allergies || [])];
  updateAllergiesDisplay();

  // Medical history
  updateMedicalHistoryDisplay(patient.medicalHistory || []);
}

// Update allergies display
function updateAllergiesDisplay() {
  const allergiesList = document.getElementById("allergies-list");

  if (allergies.length === 0) {
    allergiesList.innerHTML = '<p style="color: #666; font-style: italic;">No known allergies</p>';
    return;
  }

  const allergiesHTML = allergies.map((allergy, index) => `
    <div class="allergy-tag">
      ${allergy}
      ${isEditMode ? `<button type="button" class="remove-allergy" onclick="removeAllergy(${index})">×</button>` : ''}
    </div>
  `).join('');

  allergiesList.innerHTML = allergiesHTML;
}

// Update medical history display
function updateMedicalHistoryDisplay(medicalHistory) {
  const historyContainer = document.getElementById("medical-history");

  if (!medicalHistory || medicalHistory.length === 0) {
    historyContainer.innerHTML = `
      <p style="color: #666; font-style: italic;">
        Medical history is managed by your healthcare providers and will appear here after your visits.
      </p>
    `;
    return;
  }

  const historyHTML = medicalHistory.map(condition => {
    const diagnosedDate = condition.diagnosedDate ?
      new Date(condition.diagnosedDate).toLocaleDateString() : 'Unknown date';

    return `
      <div class="history-item">
        <div class="history-info">
          <h4>${condition.condition}</h4>
          <p>Diagnosed: ${diagnosedDate}</p>
        </div>
        <span class="status-badge status-${condition.status || 'active'}">
          ${(condition.status || 'active').charAt(0).toUpperCase() + (condition.status || 'active').slice(1)}
        </span>
      </div>
    `;
  }).join('');

  historyContainer.innerHTML = historyHTML;
}

// Toggle edit mode
function toggleEditMode() {
  isEditMode = !isEditMode;
  const editToggle = document.getElementById("edit-toggle");
  const formActions = document.getElementById("form-actions");
  const addAllergy = document.getElementById("add-allergy");

  // Get all form inputs
  const inputs = document.querySelectorAll('#profile-form input, #profile-form select, #profile-form textarea');

  if (isEditMode) {
    // Enable edit mode
    editToggle.textContent = "Cancel Edit";
    formActions.style.display = "flex";
    addAllergy.style.display = "flex";

    // Enable form inputs (except email which shouldn't be changed)
    inputs.forEach(input => {
      if (input.id !== 'email') {
        input.disabled = false;
      }
    });

    updateAllergiesDisplay(); // Refresh to show remove buttons
  } else {
    // Disable edit mode
    editToggle.textContent = "Edit Profile";
    formActions.style.display = "none";
    addAllergy.style.display = "none";

    // Disable form inputs
    inputs.forEach(input => {
      input.disabled = true;
    });

    // Reset form to original data
    populateForm(originalData);
    updateAllergiesDisplay(); // Refresh to hide remove buttons
  }
}

// Cancel edit
function cancelEdit() {
  isEditMode = false;
  toggleEditMode();
}

// Add allergy
function addAllergy() {
  const newAllergyInput = document.getElementById("new-allergy");
  const allergy = newAllergyInput.value.trim();

  if (!allergy) {
    alert("Please enter an allergy name.");
    return;
  }

  if (allergies.includes(allergy)) {
    alert("This allergy is already in your list.");
    return;
  }

  allergies.push(allergy);
  newAllergyInput.value = '';
  updateAllergiesDisplay();
}

// Remove allergy
function removeAllergy(index) {
  allergies.splice(index, 1);
  updateAllergiesDisplay();
}

// Handle form submission
async function handleProfileUpdate(event) {
  event.preventDefault();

  const saveBtn = document.getElementById("save-btn");
  const originalText = saveBtn.textContent;

  // Get form data
  const formData = {
    name: document.getElementById("name").value.trim(),
    mobile: document.getElementById("mobile").value.trim(),
    dateOfBirth: document.getElementById("dateOfBirth").value || null,
    gender: document.getElementById("gender").value || null,
    address: document.getElementById("address").value.trim() || null,
    emergencyContact: {
      name: document.getElementById("emergency-name").value.trim() || null,
      phone: document.getElementById("emergency-phone").value.trim() || null,
      relationship: document.getElementById("emergency-relationship").value.trim() || null
    },
    allergies: allergies
  };

  // Validation
  if (!formData.name || !formData.mobile) {
    showMessage("Name and mobile number are required.", 'error');
    return;
  }

  // Clean up empty emergency contact
  if (!formData.emergencyContact.name && !formData.emergencyContact.phone && !formData.emergencyContact.relationship) {
    formData.emergencyContact = null;
  }

  // Disable save button
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const response = await makePatientAPIRequest("/api/patient/auth/profile", {
      method: "PUT",
      body: JSON.stringify(formData)
    });

    if (!response) {
      throw new Error("Authentication failed");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update profile");
    }

    const data = await response.json();
    const updatedPatient = data.patient;

    // Update localStorage
    localStorage.setItem("patientProfile", JSON.stringify(updatedPatient));
    localStorage.setItem("patientName", updatedPatient.name);

    // Update display
    updateProfileDisplay(updatedPatient);
    originalData = { ...updatedPatient };

    // Exit edit mode
    isEditMode = false;
    toggleEditMode();

    showMessage("Profile updated successfully!", 'success');

  } catch (error) {
    console.error("Error updating profile:", error);
    showMessage(error.message || "Failed to update profile. Please try again.", 'error');
  } finally {
    // Re-enable save button
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// Logout function
function patientLogout() {
  localStorage.removeItem("patientToken");
  localStorage.removeItem("patientEmail");
  localStorage.removeItem("patientName");
  localStorage.removeItem("patientId");
  localStorage.removeItem("patientLoggedIn");
  localStorage.removeItem("patientProfile");
  localStorage.removeItem("userType");

  window.location.href = "maindashboard.html";
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  if (!checkPatientAuth()) {
    return;
  }

  // Load patient profile
  loadPatientProfile();

  // Add form submit handler
  document.getElementById("profile-form").addEventListener("submit", handleProfileUpdate);

  // Add enter key handler for new allergy input
  document.getElementById("new-allergy").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addAllergy();
    }
  });
});

// Handle storage events (for cross-tab logout)
window.addEventListener("storage", function (e) {
  if (e.key === "patientToken" && !e.newValue) {
    window.location.href = "maindashboard.html";
  }
});
