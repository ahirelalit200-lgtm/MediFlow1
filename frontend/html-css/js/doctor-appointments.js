// frontend/html-css/js/doctor-appointments.js

let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let currentAppointmentId = null;

// Check authentication
function checkAuth() {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const loggedIn = localStorage.getItem("loggedIn");
  const doctorProfile = localStorage.getItem("doctorProfile");
  const doctorName = localStorage.getItem("doctorName");

  // Check if user has any form of authentication
  if (!token && !email && !loggedIn && !doctorProfile && !doctorName) {
    console.log("No authentication found - redirecting to login");
    window.location.href = "signup.html";
    return false;
  }

  console.log("Authentication found - user is logged in");
  return true;
}

// Make authenticated API request
async function makeAPIRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  // Use token if available, otherwise use email as fallback
  const authToken = token || email;

  if (!authToken) {
    console.error("No authentication token found");
    window.location.href = "signup.html";
    return null;
  }

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`
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
    const response = await fetch(`${window.API_BASE_URL}${endpoint}`, mergedOptions);

    if (response.status === 401) {
      // Token expired or invalid
      console.error("Authentication failed - redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("doctorName");
      localStorage.removeItem("doctorProfile");
      window.location.href = "signup.html";
      return null;
    }

    return response;
  } catch (error) {
    throw error;
  }
}

// Show loading state
function showLoading() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("error").style.display = "none";
  document.getElementById("appointments-list").innerHTML = "";
}

// Show error state
function showError(message) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "block";
  document.getElementById("error").textContent = message;
  document.getElementById("appointments-list").innerHTML = "";
}

// Load appointment statistics
async function loadAppointmentStats() {
  try {
    const response = await makeAPIRequest("/api/doctor/appointments/stats");

    if (!response) {
      return;
    }

    if (!response.ok) {
      document.getElementById("total-appointments").textContent = "0";
      document.getElementById("pending-appointments").textContent = "0";
      document.getElementById("confirmed-appointments").textContent = "0";
      document.getElementById("urgent-appointments").textContent = "0";
      document.getElementById("today-appointments").textContent = "0";
      return;
    }

    const data = await response.json();
    const stats = data.stats;

    document.getElementById("total-appointments").textContent = stats.totalAppointments || 0;
    document.getElementById("pending-appointments").textContent = stats.pendingAppointments || 0;
    document.getElementById("confirmed-appointments").textContent = stats.confirmedAppointments || 0;
    document.getElementById("urgent-appointments").textContent = stats.urgentAppointments || 0;
    document.getElementById("today-appointments").textContent = stats.todayAppointments || 0;

  } catch (error) {
    // Set default values
    document.getElementById("total-appointments").textContent = "0";
    document.getElementById("pending-appointments").textContent = "0";
    document.getElementById("confirmed-appointments").textContent = "0";
    document.getElementById("urgent-appointments").textContent = "0";
    document.getElementById("today-appointments").textContent = "0";
  }
}

// Load appointments
async function loadAppointments(page = 1, filters = {}) {
  showLoading();

  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10'
    });

    if (filters.status) params.append('status', filters.status);
    if (filters.urgency) params.append('urgency', filters.urgency);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await makeAPIRequest(`/api/doctor/appointments?${params}`);

    if (!response) {
      throw new Error("Authentication failed. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to load appointments");
    }

    const data = await response.json();
    displayAppointments(data.appointments || []);

    currentPage = data.currentPage;
    totalPages = data.totalPages;

  } catch (error) {
    showError(error.message || "Failed to load appointments. Please try again later.");
  }
}

// Display appointments
function displayAppointments(appointments) {
  const grid = document.getElementById("appointments-list");
  document.getElementById("loading").style.display = "none";

  if (appointments.length === 0) {
    grid.innerHTML = `
      <div class="no-appointments">
        <h3>No appointment requests found</h3>
        <p>No patients have requested appointments matching the current filters.</p>
      </div>
    `;
    return;
  }

  const appointmentsHTML = appointments.map(appointment => {
    const preferredDate = new Date(appointment.preferredDate).toLocaleDateString();
    const preferredTime = appointment.preferredTime || 'Any time';
    const requestedDate = new Date(appointment.requestedAt).toLocaleDateString();

    return `
      <div class="appointment-card ${appointment.urgency}">
        <div class="appointment-header">
          <div class="patient-info">
            <h3>${appointment.patientName}</h3>
            <p><strong>Mobile:</strong> ${appointment.patientMobile}</p>
            <p><strong>Email:</strong> ${appointment.patientEmail}</p>
            <p><strong>Requested:</strong> ${requestedDate}</p>
          </div>
          <div class="appointment-meta">
            <div class="status-badge status-${appointment.status}">
              ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </div>
            <br>
            <div class="urgency-badge urgency-${appointment.urgency}">
              ${appointment.urgency.charAt(0).toUpperCase() + appointment.urgency.slice(1)}
            </div>
            <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #666;">
              <strong>Preferred:</strong><br>
              ${preferredDate}<br>
              ${preferredTime}
            </p>
          </div>
        </div>
        
        <div class="appointment-details">
          <h4>Reason for Visit:</h4>
          <p>${appointment.reason}</p>
          ${appointment.doctorNotes ? `
            <h4>Doctor Notes:</h4>
            <p>${appointment.doctorNotes}</p>
          ` : ''}
          ${appointment.confirmedDate ? `
            <h4>Confirmed Appointment:</h4>
            <p>${new Date(appointment.confirmedDate).toLocaleDateString()} at ${appointment.confirmedTime || 'TBD'}</p>
          ` : ''}
        </div>
        
        <div class="appointment-actions">
          ${appointment.status === 'pending' ? `
            <button class="action-btn confirm-btn" onclick="openAppointmentModal('${appointment._id}', 'confirm')">
              Confirm
            </button>
            <button class="action-btn reject-btn" onclick="openAppointmentModal('${appointment._id}', 'reject')">
              Reject
            </button>
          ` : ''}
          ${appointment.status === 'confirmed' ? `
            <button class="action-btn complete-btn" onclick="openAppointmentModal('${appointment._id}', 'complete')">
              Mark Complete
            </button>
          ` : ''}
          <button class="action-btn notes-btn" onclick="openAppointmentModal('${appointment._id}', 'notes')">
            ${appointment.doctorNotes ? 'Edit Notes' : 'Add Notes'}
          </button>
          
          <button class="action-btn" style="background: #dc3545; color: white;" onclick="deleteAppointment('${appointment._id}')">
            Delete
          </button>
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = appointmentsHTML;
}

// Delete appointment
async function deleteAppointment(appointmentId) {
  if (!confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) {
    return;
  }

  const deleteBtn = document.querySelector(`button[onclick="deleteAppointment('${appointmentId}')"]`);
  if (deleteBtn) {
    deleteBtn.disabled = true;
    deleteBtn.textContent = "Has Delete...";
  }

  try {
    const response = await makeAPIRequest(`/api/doctor/appointments/${appointmentId}`, {
      method: "DELETE"
    });

    if (!response || !response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete appointment");
    }

    // Success
    alert("Appointment deleted successfully");

    // Refresh list
    loadAppointments(currentPage, currentFilters);
    loadAppointmentStats();

  } catch (error) {
    console.error("Error deleting appointment:", error);
    alert(error.message || "Failed to delete appointment");
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Delete";
    }
  }
}

// Apply filters
function applyFilters() {
  const status = document.getElementById("status-filter").value;
  const urgency = document.getElementById("urgency-filter").value;
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  currentFilters = {};
  if (status) currentFilters.status = status;
  if (urgency) currentFilters.urgency = urgency;
  if (startDate) currentFilters.startDate = startDate;
  if (endDate) currentFilters.endDate = endDate;

  loadAppointments(1, currentFilters);
}

// Clear filters
function clearFilters() {
  document.getElementById("status-filter").value = "";
  document.getElementById("urgency-filter").value = "";
  document.getElementById("start-date").value = "";
  document.getElementById("end-date").value = "";
  currentFilters = {};
  loadAppointments(1, currentFilters);
}

// Open appointment modal
function openAppointmentModal(appointmentId, action) {
  currentAppointmentId = appointmentId; // Ensure global var is set
  const modal = document.getElementById("appointment-modal");
  const modalTitle = document.getElementById("modal-title");
  const appointmentAction = document.getElementById("appointment-action");
  const confirmedDateGroup = document.getElementById("confirmed-date-group");
  const confirmedTimeGroup = document.getElementById("confirmed-time-group");
  const saveBtn = document.getElementById("save-btn");

  appointmentAction.value = action;

  // Configure modal based on action
  switch (action) {
    case 'confirm':
      modalTitle.textContent = "Confirm Appointment";
      confirmedDateGroup.style.display = "block";
      confirmedTimeGroup.style.display = "block";
      saveBtn.textContent = "Confirm Appointment";
      saveBtn.className = "save-btn confirm-btn";
      break;
    case 'reject':
      modalTitle.textContent = "Reject Appointment";
      confirmedDateGroup.style.display = "none";
      confirmedTimeGroup.style.display = "none";
      saveBtn.textContent = "Reject Appointment";
      saveBtn.className = "save-btn reject-btn";
      break;
    case 'complete':
      modalTitle.textContent = "Complete Appointment";
      confirmedDateGroup.style.display = "none";
      confirmedTimeGroup.style.display = "none";
      saveBtn.textContent = "Mark Complete";
      saveBtn.className = "save-btn complete-btn";
      break;
    case 'notes':
      modalTitle.textContent = "Add/Edit Notes";
      confirmedDateGroup.style.display = "none";
      confirmedTimeGroup.style.display = "none";
      saveBtn.textContent = "Save Notes";
      saveBtn.className = "save-btn notes-btn";
      break;
  }

  modal.style.display = "block";
}

// Close modal
function closeModal() {
  const modal = document.getElementById("appointment-modal");
  modal.style.display = "none";

  // Reset form
  document.getElementById("appointment-form").reset();
  currentAppointmentId = null;
}

// Handle appointment form submission
async function handleAppointmentUpdate(event) {
  event.preventDefault();

  if (!currentAppointmentId) return;

  const action = document.getElementById("appointment-action").value;
  const confirmedDate = document.getElementById("confirmed-date").value;
  const confirmedTime = document.getElementById("confirmed-time").value;
  const doctorNotes = document.getElementById("doctor-notes").value.trim();
  const saveBtn = document.getElementById("save-btn");

  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    let status;
    switch (action) {
      case 'confirm':
        status = 'confirmed';
        break;
      case 'reject':
        status = 'rejected';
        break;
      case 'complete':
        status = 'completed';
        break;
      case 'notes':
        status = null; // Don't change status, just update notes
        break;
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (confirmedDate) updateData.confirmedDate = confirmedDate;
    if (confirmedTime) updateData.confirmedTime = confirmedTime;
    if (doctorNotes) updateData.doctorNotes = doctorNotes;

    const response = await makeAPIRequest(`/api/doctor/appointments/${currentAppointmentId}`, {
      method: "PUT",
      body: JSON.stringify(updateData)
    });

    if (!response || !response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update appointment");
    }

    // Success
    closeModal();
    loadAppointments(currentPage, currentFilters);
    loadAppointmentStats();

    alert("Appointment updated successfully!");

  } catch (error) {
    console.error("Error updating appointment:", error);
    alert(error.message || "Failed to update appointment. Please try again.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Doctor appointments page loading...");

  // Check authentication
  if (!checkAuth()) {
    return;
  }

  // Initialize form listener
  const form = document.getElementById("appointment-form");
  if (form) {
    form.addEventListener("submit", handleAppointmentUpdate);
  }

  // Load stats and initial appointments
  await loadAppointmentStats();
  await loadAppointments();
});
