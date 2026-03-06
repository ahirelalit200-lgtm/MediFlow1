// frontend/html-css/js/patient-medications.js

let remindersEnabled = false;
let reminderTime = "08:00";

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

// Show loading state
function showLoading() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("error").style.display = "none";
  document.getElementById("medications-grid").innerHTML = "";
}

// Show error state
function showError(message) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "block";
  document.getElementById("error").textContent = message;
  document.getElementById("medications-grid").innerHTML = "";
}

// Load medication schedule
async function loadMedicationSchedule() {
  showLoading();

  try {
    const response = await makePatientAPIRequest("/api/patient/medications/schedule");

    if (!response || !response.ok) {
      throw new Error("Failed to load medication schedule");
    }

    const data = await response.json();
    displayMedications(data.medications || []);

  } catch (error) {
    console.error("Error loading medication schedule:", error);
    showError("Failed to load medication schedule. Please try again later.");
  }
}

// Display medications
function displayMedications(medications) {
  const grid = document.getElementById("medications-grid");
  document.getElementById("loading").style.display = "none";

  if (medications.length === 0) {
    grid.innerHTML = `
      <div class="no-medications">
        <h3>No current medications</h3>
        <p>You don't have any active medications in your recent prescriptions.</p>
        <p>Visit your doctor to get new prescriptions, or check your <a href="patient-prescriptions.html">prescription history</a>.</p>
      </div>
    `;
    return;
  }

  const medicationsHTML = medications.map(medication => {
    const prescriptionDate = new Date(medication.prescriptionDate).toLocaleDateString();
    const medicationId = `med_${medication.prescriptionId}_${medication.medicine.replace(/\s+/g, '_')}`;
    const hasReminder = localStorage.getItem(`reminder_${medicationId}`) === 'true';

    // Generate suggested schedule based on dosage
    const schedule = generateMedicationSchedule(medication.dosage, medication.instruction);

    return `
      <div class="medication-card">
        <div class="medication-header">
          <div class="medication-info">
            <h3>${medication.medicine}</h3>
            <div class="dosage">${medication.dosage} ${medication.measure || ''}</div>
            <div class="duration">Duration: ${medication.duration || 'As prescribed'}</div>
          </div>
          <div class="prescription-info">
            <div>Dr. ${medication.doctor}</div>
            <div>${prescriptionDate}</div>
            <span class="reminder-status ${hasReminder ? 'reminder-active' : 'reminder-inactive'}">
              ${hasReminder ? 'Reminders On' : 'Reminders Off'}
            </span>
          </div>
        </div>
        
        ${medication.instruction ? `
          <div class="medication-instructions">
            <h4>Instructions:</h4>
            <p>${medication.instruction}</p>
          </div>
        ` : ''}
        
        <div class="medication-schedule">
          ${schedule.map(time => `
            <div class="schedule-time ${isCurrentTimeSlot(time.time) ? 'current' : ''}">
              <div class="time">${time.time}</div>
              <div class="label">${time.label}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="medication-actions">
          <button class="action-btn reminder-btn ${hasReminder ? 'active' : ''}" 
                  onclick="toggleMedicationReminder('${medicationId}', '${medication.medicine}')">
            ${hasReminder ? 'Disable Reminder' : 'Set Reminder'}
          </button>
          <button class="action-btn info-btn" onclick="showMedicationInfo('${medication.medicine}')">
            More Info
          </button>
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = medicationsHTML;
}

// Generate medication schedule based on dosage
function generateMedicationSchedule(dosage, instruction) {
  const schedule = [];
  const dosageText = (dosage || '').toLowerCase();
  const instructionText = (instruction || '').toLowerCase();

  // Default schedule
  if (dosageText.includes('once') || dosageText.includes('1 time') || dosageText.includes('daily')) {
    schedule.push({ time: '08:00', label: 'Morning' });
  } else if (dosageText.includes('twice') || dosageText.includes('2 time') || dosageText.includes('bid')) {
    schedule.push({ time: '08:00', label: 'Morning' });
    schedule.push({ time: '20:00', label: 'Evening' });
  } else if (dosageText.includes('thrice') || dosageText.includes('3 time') || dosageText.includes('tid')) {
    schedule.push({ time: '08:00', label: 'Morning' });
    schedule.push({ time: '14:00', label: 'Afternoon' });
    schedule.push({ time: '20:00', label: 'Evening' });
  } else if (dosageText.includes('four') || dosageText.includes('4 time') || dosageText.includes('qid')) {
    schedule.push({ time: '08:00', label: 'Morning' });
    schedule.push({ time: '12:00', label: 'Noon' });
    schedule.push({ time: '16:00', label: 'Afternoon' });
    schedule.push({ time: '20:00', label: 'Evening' });
  } else {
    // Default to once daily
    schedule.push({ time: '08:00', label: 'Morning' });
  }

  // Adjust based on instructions
  if (instructionText.includes('before meal') || instructionText.includes('empty stomach')) {
    schedule.forEach(slot => {
      const [hour, minute] = slot.time.split(':');
      const newHour = Math.max(0, parseInt(hour) - 1);
      slot.time = `${newHour.toString().padStart(2, '0')}:${minute}`;
      slot.label += ' (Before meal)';
    });
  } else if (instructionText.includes('after meal')) {
    schedule.forEach(slot => {
      const [hour, minute] = slot.time.split(':');
      const newHour = Math.min(23, parseInt(hour) + 1);
      slot.time = `${newHour.toString().padStart(2, '0')}:${minute}`;
      slot.label += ' (After meal)';
    });
  }

  return schedule;
}

// Check if current time slot
function isCurrentTimeSlot(timeSlot) {
  const now = new Date();
  const currentHour = now.getHours();
  const [slotHour] = timeSlot.split(':').map(Number);

  // Consider current if within 1 hour window
  return Math.abs(currentHour - slotHour) <= 1;
}

// Toggle global reminders
function toggleReminders() {
  remindersEnabled = !remindersEnabled;
  const toggle = document.getElementById("reminder-toggle");
  const timeSelector = document.getElementById("reminder-time-selector");

  if (remindersEnabled) {
    toggle.textContent = "Disable Reminders";
    toggle.classList.add("active");
    timeSelector.style.display = "flex";

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("Medication Reminders Enabled", {
            body: "You'll receive notifications for your medication schedule.",
            icon: "/favicon.ico"
          });
        }
      });
    }
  } else {
    toggle.textContent = "Enable Reminders";
    toggle.classList.remove("active");
    timeSelector.style.display = "none";
  }

  // Save preference
  localStorage.setItem("medicationRemindersEnabled", remindersEnabled.toString());
}

// Save reminder time
function saveReminderTime() {
  reminderTime = document.getElementById("reminder-time").value;
  localStorage.setItem("medicationReminderTime", reminderTime);

  // Show confirmation
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Reminder Time Updated", {
      body: `Daily medication reminder set for ${reminderTime}`,
      icon: "/favicon.ico"
    });
  }
}

// Toggle individual medication reminder
function toggleMedicationReminder(medicationId, medicineName) {
  const currentState = localStorage.getItem(`reminder_${medicationId}`) === 'true';
  const newState = !currentState;

  localStorage.setItem(`reminder_${medicationId}`, newState.toString());

  // Update button
  const button = event.target;
  if (newState) {
    button.textContent = "Disable Reminder";
    button.classList.add("active");
  } else {
    button.textContent = "Set Reminder";
    button.classList.remove("active");
  }

  // Update status
  const card = button.closest('.medication-card');
  const statusSpan = card.querySelector('.reminder-status');
  if (newState) {
    statusSpan.textContent = "Reminders On";
    statusSpan.className = "reminder-status reminder-active";
  } else {
    statusSpan.textContent = "Reminders Off";
    statusSpan.className = "reminder-status reminder-inactive";
  }

  // Show notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(
      newState ? "Reminder Enabled" : "Reminder Disabled",
      {
        body: `${medicineName} reminder ${newState ? 'enabled' : 'disabled'}`,
        icon: "/favicon.ico"
      }
    );
  }
}

// Show medication info
function showMedicationInfo(medicineName) {
  // In a full implementation, this would show detailed drug information
  alert(`Showing information for: ${medicineName}\n\nThis feature would display:\n- Drug interactions\n- Side effects\n- Precautions\n- Storage instructions`);
}

// Load reminder preferences
function loadReminderPreferences() {
  remindersEnabled = localStorage.getItem("medicationRemindersEnabled") === "true";
  reminderTime = localStorage.getItem("medicationReminderTime") || "08:00";

  const toggle = document.getElementById("reminder-toggle");
  const timeSelector = document.getElementById("reminder-time-selector");
  const timeInput = document.getElementById("reminder-time");

  if (remindersEnabled) {
    toggle.textContent = "Disable Reminders";
    toggle.classList.add("active");
    timeSelector.style.display = "flex";
  }

  timeInput.value = reminderTime;
}

// Setup daily reminder notifications
function setupDailyReminders() {
  if (!remindersEnabled || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  // This is a simplified version. In a production app, you'd use a service worker
  // or integrate with a push notification service
  const now = new Date();
  const [hour, minute] = reminderTime.split(':').map(Number);
  const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

  if (reminderDate <= now) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  const timeUntilReminder = reminderDate.getTime() - now.getTime();

  setTimeout(() => {
    new Notification("Medication Reminder", {
      body: "Time to check your medication schedule!",
      icon: "/favicon.ico",
      requireInteraction: true
    });

    // Set up next day's reminder
    setupDailyReminders();
  }, timeUntilReminder);
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

  // Load reminder preferences
  loadReminderPreferences();

  // Load medication schedule
  loadMedicationSchedule();

  // Setup daily reminders
  setupDailyReminders();
});

// Handle storage events (for cross-tab logout)
window.addEventListener("storage", function (e) {
  if (e.key === "patientToken" && !e.newValue) {
    window.location.href = "maindashboard.html";
  }
});
