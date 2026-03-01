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
      <div style="text-align: center; padding: 4rem; color: var(--text-muted); border: 2px dashed var(--border-color); border-radius: var(--radius-lg); width: 100%;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No appointment requests found</h3>
        <p>No patients have requested appointments matching the current filters.</p>
      </div>
    `;
    return;
  }

  const appointmentsHTML = appointments.map(appointment => {
    const appointmentId = appointment._id || appointment.id;
    const preferredDate = new Date(appointment.preferredDate).toLocaleDateString();
    const preferredTime = appointment.preferredTime || 'Any time';
    const requestedDate = new Date(appointment.requestedAt).toLocaleDateString();

    let urgencyColor = 'var(--accent-primary)';
    if (appointment.urgency === 'urgent') urgencyColor = '#f59e0b';
    if (appointment.urgency === 'emergency') urgencyColor = 'var(--danger)';

    return `
      <div class="feature-card" style="border-left: 4px solid ${urgencyColor}; cursor: default; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem;">
          <div style="flex: 1; min-width: 250px;">
            <h3 style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1.25rem;">${appointment.patientName}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
              <p><strong>Mobile:</strong> ${appointment.patientMobile}</p>
              <p><strong>Email:</strong> ${appointment.patientEmail}</p>
              <p><strong>Requested on:</strong> ${requestedDate}</p>
            </div>
          </div>
          <div style="text-align: right; min-width: 150px;">
            <span class="badge" style="background: var(--bg-tertiary); color: var(--accent-primary); padding: 0.25rem 0.75rem; border-radius: 999px; font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">${appointment.status}</span>
            <div style="margin-top: 0.5rem;">
              <span class="badge" style="background: ${urgencyColor}15; color: ${urgencyColor}; padding: 0.25rem 0.75rem; border-radius: 999px; font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">${appointment.urgency}</span>
            </div>
            <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-primary);">
              <p><strong>Preferred Slot:</strong></p>
              <p style="color: var(--accent-primary); font-weight: 600;">${preferredDate} at ${preferredTime}</p>
            </div>
          </div>
        </div>
        
        <div style="margin: 1.5rem 0; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
          <h4 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Reason for Visit</h4>
          <p style="color: var(--text-primary); font-size: 0.9375rem;">${appointment.reason}</p>
          
          ${appointment.doctorNotes ? `
            <h4 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.5rem;">Doctor's Observations</h4>
            <p style="color: var(--text-primary); font-size: 0.9375rem;">${appointment.doctorNotes}</p>
          ` : ''}
          
          ${appointment.confirmedDate ? `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.5rem; color: var(--success); font-weight: 700;">
              <span>✅ Verified Appointment:</span>
              <span>${new Date(appointment.confirmedDate).toLocaleDateString()} at ${appointment.confirmedTime || 'TBD'}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="header-right" style="gap: 0.75rem; flex-wrap: wrap;">
          ${appointment.status === 'pending' ? `
            <button class="book-btn" onclick="openAppointmentModal('${appointmentId}', 'confirm')">Confirm</button>
            <button class="book-btn" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid var(--danger);" onclick="openAppointmentModal('${appointmentId}', 'reject')">Reject</button>
          ` : ''}
          ${appointment.status === 'confirmed' ? `
            <button class="book-btn" style="background: var(--success);" onclick="openAppointmentModal('${appointmentId}', 'complete')">Mark Complete</button>
          ` : ''}
          <button class="book-btn" style="background: var(--bg-tertiary); color: var(--text-primary);" onclick="openAppointmentModal('${appointmentId}', 'notes')">
            ${appointment.doctorNotes ? 'Edit Clinical Notes' : 'Add Clinical Notes'}
          </button>
          <button class="book-btn" style="background: transparent; color: var(--danger); border: 1px solid transparent;" onclick="deleteAppointment('${appointmentId}')">Delete</button>
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
  console.log(`🔹 Opening modal for Appointment ID: ${appointmentId}, Action: ${action}`);
  if (!appointmentId || appointmentId === 'undefined') {
    console.error("❌ Error: Invalid Appointment ID passed to modal");
    alert("Error: Cannot update this appointment. Invalid ID.");
    return;
  }

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
