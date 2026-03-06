// frontend/html-css/js/patient-appointments.js

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
    const response = await fetch(`${window.API_BASE_URL}${endpoint}`, mergedOptions);

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

// Set minimum date to today
function setMinimumDate() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateInput = document.getElementById("preferred-date");
  dateInput.min = tomorrow.toISOString().split('T')[0];
}

// Global variable to store all doctors data
let allDoctors = [];
let locationHierarchy = {};

// Fetch and display available doctors
async function loadDoctors() {
  const doctorsListContainer = document.getElementById("doctors-list");

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/doctors/profiles`);

    if (!response.ok) {
      throw new Error("Failed to fetch doctors");
    }

    const data = await response.json();
    const doctors = data.doctors || [];

    if (!doctors || doctors.length === 0) {
      doctorsListContainer.innerHTML = `
        <div class="no-doctors-message">
          No doctors are currently registered on our platform. 
          Please enter doctor details manually in the form below.
        </div>
      `;
      updateDoctorsCount(0);
      return;
    }

    // Store doctors data globally for filtering
    allDoctors = doctors;

    // Parse and build location hierarchy
    buildLocationHierarchy(doctors);

    // Populate location filters
    populateLocationFilters();

    // Display all doctors initially
    displayDoctors(doctors);

    // Setup filter event listeners
    setupFilterListeners();

  } catch (error) {
    console.error("Error loading doctors:", error);
    doctorsListContainer.innerHTML = `
      <div class="no-doctors-message">
        Unable to load doctors list. Please check your connection and try again.
        You can still enter doctor details manually in the form below.
      </div>
    `;
    updateDoctorsCount(0);
  }
}

// Display doctors in the grid
function displayDoctors(doctors) {
  const doctorsListContainer = document.getElementById("doctors-list");

  if (!doctors || doctors.length === 0) {
    doctorsListContainer.innerHTML = `
      <div class="no-doctors-message">
        No doctors match your current filters. Try adjusting your search criteria.
      </div>
    `;
    updateDoctorsCount(0);
    return;
  }

  // Create doctor cards
  const doctorCards = doctors.map(doctor => {
    const clinicDisplay = doctor.clinicName ? doctor.clinicName : 'Clinic not specified';
    const specializationDisplay = doctor.specialization || doctor.degree || 'General Practice';
    const phoneDisplay = doctor.phone ? `📞 ${doctor.phone}` : 'Phone not available';
    const addressDisplay = doctor.address || 'Address not specified';

    return `
      <div class="doctor-card" 
           data-doctor-name="${doctor.fullName}" 
           data-doctor-phone="${doctor.phone || ''}" 
            data-doctor-email="${doctor.email}"
            data-doctor-id="${doctor._id || doctor.id}"
            data-doctor-area="${addressDisplay.toLowerCase()}"
           data-doctor-degree="${(doctor.degree || '').toUpperCase()}"
           data-doctor-specialization="${(doctor.specialization || '').toLowerCase()}">
        <div class="doctor-name">Dr. ${doctor.fullName}</div>
        <div class="clinic-name">🏥 ${clinicDisplay}</div>
        <div class="doctor-specialization">🩺 ${specializationDisplay}</div>
        <div class="doctor-contact">${phoneDisplay}</div>
        ${addressDisplay !== 'Address not specified' ? `<div class="doctor-address">📍 ${addressDisplay}</div>` : ''}
      </div>
    `;
  }).join('');

  doctorsListContainer.innerHTML = doctorCards;

  // Add click handlers to doctor cards
  const doctorCardElements = doctorsListContainer.querySelectorAll('.doctor-card');
  doctorCardElements.forEach(card => {
    card.addEventListener('click', () => selectDoctor(card));
  });

  // Update count
  updateDoctorsCount(doctors.length);
}

// Parse addresses and build location hierarchy
function buildLocationHierarchy(doctors) {
  locationHierarchy = {};

  doctors.forEach(doctor => {
    if (doctor.address && doctor.address.trim()) {
      const parsedLocation = parseAddress(doctor.address);
      if (parsedLocation.state) {
        // Initialize state if not exists
        if (!locationHierarchy[parsedLocation.state]) {
          locationHierarchy[parsedLocation.state] = {};
        }

        if (parsedLocation.city) {
          // Initialize city if not exists
          if (!locationHierarchy[parsedLocation.state][parsedLocation.city]) {
            locationHierarchy[parsedLocation.state][parsedLocation.city] = new Set();
          }

          // Add area if exists
          if (parsedLocation.area) {
            locationHierarchy[parsedLocation.state][parsedLocation.city].add(parsedLocation.area);
          }
        }
      }
    }
  });
}

// Parse address into state, city, and area components
function parseAddress(address) {
  // Common address patterns in India:
  // "Area, City, State, PIN" or "Area, City, State" or "City, State"
  const parts = address.split(',').map(part => part.trim()).filter(part => part);

  let state = '';
  let city = '';
  let area = '';

  if (parts.length >= 2) {
    // Last part is likely state (or state with PIN)
    const lastPart = parts[parts.length - 1];
    // Remove PIN code if present (assuming 6 digits)
    state = lastPart.replace(/\s*\d{6}\s*$/, '').trim();

    if (parts.length >= 2) {
      // Second last part is likely city
      city = parts[parts.length - 2];
    }

    if (parts.length >= 3) {
      // Third last part is likely area/locality
      area = parts[parts.length - 3];
    }
  }

  return { state, city, area };
}

// Populate all location filters
function populateLocationFilters() {
  populateStateFilter();
  // City and area filters will be populated based on state selection
}

// Populate state filter
function populateStateFilter() {
  const stateFilter = document.getElementById("filter-state");
  stateFilter.innerHTML = '<option value="">All States</option>';

  const states = Object.keys(locationHierarchy).sort();
  states.forEach(state => {
    const option = document.createElement('option');
    option.value = state.toLowerCase();
    option.textContent = state;
    stateFilter.appendChild(option);
  });
}

// Populate city filter based on selected state
function populateCityFilter(selectedState) {
  const cityFilter = document.getElementById("filter-city");
  const areaFilter = document.getElementById("filter-area");

  // Reset city and area filters
  cityFilter.innerHTML = '<option value="">All Cities</option>';
  areaFilter.innerHTML = '<option value="">All Areas</option>';

  if (!selectedState || !locationHierarchy[selectedState]) {
    return;
  }

  const cities = Object.keys(locationHierarchy[selectedState]).sort();
  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city.toLowerCase();
    option.textContent = city;
    cityFilter.appendChild(option);
  });
}

// Populate area filter based on selected state and city
function populateAreaFilter(selectedState, selectedCity) {
  const areaFilter = document.getElementById("filter-area");
  areaFilter.innerHTML = '<option value="">All Areas</option>';

  if (!selectedState || !selectedCity ||
    !locationHierarchy[selectedState] ||
    !locationHierarchy[selectedState][selectedCity]) {
    return;
  }

  const areas = Array.from(locationHierarchy[selectedState][selectedCity]).sort();
  areas.forEach(area => {
    const option = document.createElement('option');
    option.value = area.toLowerCase();
    option.textContent = area;
    areaFilter.appendChild(option);
  });
}

// Setup filter event listeners
function setupFilterListeners() {
  const searchInput = document.getElementById("search-doctor");
  const stateFilter = document.getElementById("filter-state");
  const cityFilter = document.getElementById("filter-city");
  const areaFilter = document.getElementById("filter-area");
  const degreeFilter = document.getElementById("filter-degree");
  const clearButton = document.getElementById("clear-filters");

  // Search input
  searchInput.addEventListener('input', applyFilters);

  // State filter - cascading effect
  stateFilter.addEventListener('change', (e) => {
    const selectedState = e.target.options[e.target.selectedIndex].textContent;
    if (selectedState !== 'All States') {
      populateCityFilter(selectedState);
    } else {
      // Reset city and area filters
      cityFilter.innerHTML = '<option value="">All Cities</option>';
      areaFilter.innerHTML = '<option value="">All Areas</option>';
    }
    applyFilters();
  });

  // City filter - cascading effect
  cityFilter.addEventListener('change', (e) => {
    const stateFilter = document.getElementById("filter-state");
    const selectedState = stateFilter.options[stateFilter.selectedIndex].textContent;
    const selectedCity = e.target.options[e.target.selectedIndex].textContent;

    if (selectedCity !== 'All Cities' && selectedState !== 'All States') {
      populateAreaFilter(selectedState, selectedCity);
    } else {
      // Reset area filter
      areaFilter.innerHTML = '<option value="">All Areas</option>';
    }
    applyFilters();
  });

  // Area filter
  areaFilter.addEventListener('change', applyFilters);

  // Degree filter
  degreeFilter.addEventListener('change', applyFilters);

  // Clear filters button
  clearButton.addEventListener('click', clearAllFilters);
}

// Apply all filters
function applyFilters() {
  const searchTerm = document.getElementById("search-doctor").value.toLowerCase().trim();
  const selectedState = document.getElementById("filter-state").value.toLowerCase();
  const selectedCity = document.getElementById("filter-city").value.toLowerCase();
  const selectedArea = document.getElementById("filter-area").value.toLowerCase();
  const selectedDegree = document.getElementById("filter-degree").value.toUpperCase();

  const filteredDoctors = allDoctors.filter(doctor => {
    // Search filter
    const matchesSearch = !searchTerm ||
      doctor.fullName.toLowerCase().includes(searchTerm) ||
      (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm)) ||
      (doctor.clinicName && doctor.clinicName.toLowerCase().includes(searchTerm));

    // Location filters
    let matchesLocation = true;
    if (doctor.address) {
      const parsedLocation = parseAddress(doctor.address);

      // State filter
      if (selectedState && parsedLocation.state) {
        matchesLocation = matchesLocation && parsedLocation.state.toLowerCase().includes(selectedState);
      }

      // City filter
      if (selectedCity && parsedLocation.city) {
        matchesLocation = matchesLocation && parsedLocation.city.toLowerCase().includes(selectedCity);
      }

      // Area filter
      if (selectedArea && parsedLocation.area) {
        matchesLocation = matchesLocation && parsedLocation.area.toLowerCase().includes(selectedArea);
      }
    } else if (selectedState || selectedCity || selectedArea) {
      // If any location filter is selected but doctor has no address, exclude them
      matchesLocation = false;
    }

    // Degree filter
    const matchesDegree = !selectedDegree ||
      (doctor.degree && doctor.degree.toUpperCase().includes(selectedDegree)) ||
      (doctor.specialization && doctor.specialization.toUpperCase().includes(selectedDegree));

    return matchesSearch && matchesLocation && matchesDegree;
  });

  displayDoctors(filteredDoctors);
}

// Clear all filters
function clearAllFilters() {
  document.getElementById("search-doctor").value = '';
  document.getElementById("filter-state").value = '';
  document.getElementById("filter-city").value = '';
  document.getElementById("filter-area").value = '';
  document.getElementById("filter-degree").value = '';

  // Reset city and area filters to default state
  document.getElementById("filter-city").innerHTML = '<option value="">All Cities</option>';
  document.getElementById("filter-area").innerHTML = '<option value="">All Areas</option>';

  displayDoctors(allDoctors);
  showMessage('All filters cleared', 'success');
}

// Update doctors count display
function updateDoctorsCount(count) {
  const countElement = document.getElementById("doctors-count");
  if (count === 0) {
    countElement.textContent = 'No doctors found';
  } else if (count === 1) {
    countElement.textContent = '1 doctor found';
  } else {
    countElement.textContent = `${count} doctors found`;
  }
}

// Handle doctor selection
function selectDoctor(selectedCard) {
  // Remove selection from all cards
  const allCards = document.querySelectorAll('.doctor-card');
  allCards.forEach(card => card.classList.remove('selected'));

  // Add selection to clicked card
  selectedCard.classList.add('selected');

  // Fill form with selected doctor's information
  const doctorName = selectedCard.dataset.doctorName;
  const doctorPhone = selectedCard.dataset.doctorPhone;
  const doctorId = selectedCard.dataset.doctorId;
  const doctorEmail = selectedCard.dataset.doctorEmail;

  document.getElementById("doctor-name").value = `Dr. ${doctorName}`;
  document.getElementById("doctor-mobile").value = doctorPhone || '';

  // Store hidden values for submission
  document.getElementById("doctor-name").dataset.selectedDoctorId = doctorId || '';
  document.getElementById("doctor-name").dataset.selectedDoctorEmail = doctorEmail || '';

  // Show success message
  showMessage(`Selected Dr. ${doctorName}. You can modify the details below if needed.`, 'success');

  // Scroll to form
  document.getElementById("appointment-form").scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// Handle form submission
async function handleAppointmentSubmission(event) {
  event.preventDefault();

  const submitBtn = document.getElementById("submit-btn");
  const originalText = submitBtn.textContent;

  // Get form data
  const doctorName = document.getElementById("doctor-name").value.trim();
  const doctorMobile = document.getElementById("doctor-mobile").value.trim();
  const preferredDate = document.getElementById("preferred-date").value;
  const preferredTime = document.getElementById("preferred-time").value;
  const reason = document.getElementById("reason").value.trim();
  const urgency = document.querySelector('input[name="urgency"]:checked').value;

  // Validation
  if (!doctorName || !doctorMobile || !preferredDate || !reason) {
    showMessage("Please fill in all required fields.", 'error');
    return;
  }

  // Check if date is not in the past
  const selectedDate = new Date(preferredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    showMessage("Please select a future date for your appointment.", 'error');
    return;
  }

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting Request...";

  try {
    const appointmentData = {
      doctorId: document.getElementById("doctor-name").dataset.selectedDoctorId || null,
      doctorEmail: document.getElementById("doctor-name").dataset.selectedDoctorEmail || null,
      doctorName,
      doctorMobile,
      preferredDate,
      preferredTime: preferredTime || null,
      reason,
      urgency
    };

    const response = await makePatientAPIRequest("/api/patient/appointments/request", {
      method: "POST",
      body: JSON.stringify(appointmentData)
    });

    if (!response) {
      throw new Error("Authentication failed");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to submit appointment request");
    }

    const data = await response.json();

    // Show success message
    showMessage(
      "Appointment request submitted successfully! Our staff will contact you within 24 hours to confirm your appointment.",
      'success'
    );

    // Reset form
    document.getElementById("appointment-form").reset();

    // Reset urgency to normal
    document.getElementById("normal").checked = true;

  } catch (error) {
    console.error("Error submitting appointment:", error);
    showMessage(error.message || "Failed to submit appointment request. Please try again.", 'error');
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
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

  // Set patient name in header and sidebar
  const patientInfo = getPatientInfo();
  const nameElement = document.getElementById("patient-name");
  const sidebarNameElement = document.getElementById("sidebar-patient-name");

  if (nameElement) nameElement.textContent = patientInfo.name;
  if (sidebarNameElement) sidebarNameElement.textContent = patientInfo.name;

  // Set minimum date
  setMinimumDate();

  // Load available doctors
  loadDoctors();

  // Check for appointment status updates
  checkAppointmentStatusUpdates();

  // Add form submit handler
  document.getElementById("appointment-form").addEventListener("submit", handleAppointmentSubmission);
});

// Check for appointment status updates
async function checkAppointmentStatusUpdates() {
  try {
    const patientInfo = getPatientInfo();
    const response = await fetch(`${window.API_BASE_URL}/api/appointments/patient/${patientInfo.id}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("patientToken")}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const appointments = data.appointments || [];

      // Check for recent status updates (within last 24 hours)
      const recentUpdates = appointments.filter(apt => {
        const updatedAt = new Date(apt.updatedAt || apt.statusUpdatedAt);
        const now = new Date();
        const hoursDiff = (now - updatedAt) / (1000 * 60 * 60);
        return hoursDiff <= 24 && (apt.status === 'confirmed' || apt.status === 'rejected');
      });

      // Show notifications for recent updates
      recentUpdates.forEach(appointment => {
        if (appointment.status === 'confirmed') {
          showMessage(`✅ Great news! Your appointment request with Dr. ${appointment.doctorName || 'the doctor'} has been ACCEPTED!`, 'success');
        } else if (appointment.status === 'rejected') {
          const reason = appointment.rejectionReason ? ` Reason: ${appointment.rejectionReason}` : '';
          showMessage(`❌ Your appointment request with Dr. ${appointment.doctorName || 'the doctor'} has been declined.${reason}`, 'error');
        }
      });

      // Show appointment history section if there are appointments
      if (appointments.length > 0) {
        displayAppointmentHistory(appointments);
      }
    }
  } catch (error) {
    console.error("Error checking appointment status:", error);
  }
}

// Display appointment history
function displayAppointmentHistory(appointments) {
  // Check if history section already exists
  let historySection = document.getElementById("appointment-history");

  if (!historySection) {
    // Create history section
    historySection = document.createElement("div");
    historySection.id = "appointment-history";
    historySection.className = "appointment-history-section";

    historySection.innerHTML = `
      <h3>📋 Your Appointment History</h3>
      <div id="appointment-history-list" class="appointment-history-list"></div>
    `;

    // Insert before the appointment form
    const appointmentForm = document.getElementById("appointment-form");
    appointmentForm.parentNode.insertBefore(historySection, appointmentForm);
  }

  // Sort appointments by date (newest first)
  appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const historyList = document.getElementById("appointment-history-list");
  historyList.innerHTML = appointments.map(appointment => {
    const statusClass = `status-${appointment.status}`;
    const statusIcon = appointment.status === 'confirmed' ? '✅' :
      appointment.status === 'rejected' ? '❌' :
        appointment.status === 'completed' ? '✅' : '⏳';

    const requestDate = new Date(appointment.createdAt).toLocaleDateString();
    const preferredDate = appointment.preferredDate ? new Date(appointment.preferredDate).toLocaleDateString() : 'Not specified';

    return `
      <div class="appointment-history-item ${statusClass}">
        <div class="appointment-status">
          <span class="status-icon">${statusIcon}</span>
          <span class="status-text">${appointment.status.toUpperCase()}</span>
        </div>
        <div class="appointment-details">
          <div><strong>Doctor:</strong> ${appointment.doctorName || 'Any available doctor'}</div>
          <div><strong>Requested Date:</strong> ${preferredDate}</div>
          <div><strong>Request Submitted:</strong> ${requestDate}</div>
          ${appointment.reason ? `<div><strong>Reason:</strong> ${appointment.reason}</div>` : ''}
          ${appointment.rejectionReason ? `<div><strong>Rejection Reason:</strong> ${appointment.rejectionReason}</div>` : ''}
          <div class="appointment-actions">
            ${appointment.status !== 'completed' && appointment.status !== 'cancelled' ? `
              <button class="delete-appointment-btn" onclick="cancelAppointment('${appointment._id}')">
                Cancel Appointment
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Handle storage events (for cross-tab logout)
window.addEventListener("storage", function (e) {
  if (e.key === "patientToken" && !e.newValue) {
    window.location.href = "maindashboard.html";
  }
});
