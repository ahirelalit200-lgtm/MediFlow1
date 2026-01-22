// frontend/html-css/js/patient-prescriptions.js

let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

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
  document.getElementById("prescriptions-grid").innerHTML = "";
  document.getElementById("pagination").style.display = "none";
}

// Show error state
function showError(message) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "block";
  document.getElementById("error").textContent = message;
  document.getElementById("prescriptions-grid").innerHTML = "";
  document.getElementById("pagination").style.display = "none";
}

// Load prescriptions
async function loadPrescriptions(page = 1, filters = {}) {
  showLoading();

  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10'
    });

    if (filters.doctorName) {
      params.append('doctorName', filters.doctorName);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }

    const response = await makePatientAPIRequest(`/api/patient/prescriptions?${params}`);

    if (!response || !response.ok) {
      throw new Error("Failed to load prescriptions");
    }

    const data = await response.json();
    displayPrescriptions(data.prescriptions || []);
    setupPagination(data.currentPage, data.totalPages, data.total);

    currentPage = data.currentPage;
    totalPages = data.totalPages;

  } catch (error) {
    console.error("Error loading prescriptions:", error);
    showError("Failed to load prescriptions. Please try again later.");
  }
}

// Display prescriptions
function displayPrescriptions(prescriptions) {
  const grid = document.getElementById("prescriptions-grid");
  document.getElementById("loading").style.display = "none";

  if (prescriptions.length === 0) {
    grid.innerHTML = `
      <div class="no-prescriptions">
        <h3>No prescriptions found</h3>
        <p>You don't have any prescriptions matching the current filters.</p>
      </div>
    `;
    return;
  }

  const prescriptionsHTML = prescriptions.map(prescription => {
    const date = new Date(prescription.date).toLocaleDateString();
    const medicineCount = prescription.medicines ? prescription.medicines.length : 0;

    // Generate medicines list
    const medicinesHTML = prescription.medicines && prescription.medicines.length > 0
      ? prescription.medicines.slice(0, 3).map(medicine => `
          <div class="medicine-item">
            <div>
              <div class="medicine-name">${medicine.name || 'Unnamed Medicine'}</div>
              <div class="medicine-details">${medicine.dosage || ''} ${medicine.measure || ''}</div>
            </div>
            <div class="medicine-details">${medicine.duration || ''}</div>
          </div>
        `).join('')
      : '<div class="medicine-item"><div class="medicine-name">No medicines prescribed</div></div>';

    const moreCount = medicineCount > 3 ? medicineCount - 3 : 0;

    // Check if prescription has X-ray
    const hasXray = prescription.xray && prescription.xray.dataUrl;
    const xrayAnalysis = prescription.xrayAnalysis;

    return `
      <div class="prescription-card">
        <div class="prescription-header">
          <div class="prescription-info">
            <h3>Dr. ${prescription.doctor}</h3>
            <p>${medicineCount} medicine(s) prescribed</p>
            ${hasXray ? '<p><strong>📷 X-ray included</strong></p>' : ''}
            ${prescription.notes ? `<p><strong>Notes:</strong> ${prescription.notes}</p>` : ''}
          </div>
          <div class="prescription-date">
            <div>${date}</div>
          </div>
        </div>
        
        ${hasXray ? `
          <div class="xray-section">
            <h4>🩻 X-ray Report</h4>
            <div class="xray-preview">
              <div class="xray-image-container">
                <img src="${prescription.xray.dataUrl}" alt="X-ray Image" class="xray-thumbnail" 
                     onclick="openXrayModal('${prescription.xray.dataUrl}', '${prescription.xray.name || 'X-ray'}')">
                <div class="xray-info">
                  <p><strong>File:</strong> ${prescription.xray.name || 'X-ray Image'}</p>
                  ${prescription.xray.size ? `<p><strong>Size:</strong> ${formatFileSize(prescription.xray.size)}</p>` : ''}
                </div>
              </div>
              
              ${xrayAnalysis && xrayAnalysis.success ? `
                <div class="xray-analysis-preview">
                  <div class="analysis-header">
                    <span class="ai-badge">AI Analysis</span>
                    ${xrayAnalysis.severity ? `<span class="severity-badge severity-${xrayAnalysis.severity.toLowerCase()}">${xrayAnalysis.severity.toUpperCase()}</span>` : ''}
                  </div>
                  
                  ${xrayAnalysis.findings && xrayAnalysis.findings.length > 0 ? `
                    <div class="findings-summary">
                      <strong>Key Findings:</strong>
                      <ul>
                        ${xrayAnalysis.findings.slice(0, 2).map(finding =>
      `<li>${finding.type || 'Finding'}: ${finding.location || ''}</li>`
    ).join('')}
                        ${xrayAnalysis.findings.length > 2 ? `<li>+ ${xrayAnalysis.findings.length - 2} more findings</li>` : ''}
                      </ul>
                    </div>
                  ` : '<p>Analysis completed - no significant findings</p>'}
                </div>
              ` : `
                <div class="xray-analysis-preview">
                  <p style="color: #666; font-style: italic;">AI analysis ${xrayAnalysis ? 'in progress' : 'not available'}</p>
                </div>
              `}
            </div>
          </div>
        ` : ''}
        
        <div class="medicines-list">
          <h4>Prescribed Medicines:</h4>
          ${medicinesHTML}
          ${moreCount > 0 ? `<div class="medicine-item"><div class="medicine-name">+ ${moreCount} more medicine(s)</div></div>` : ''}
        </div>
        
        <div class="prescription-actions">
          <button class="action-btn view-btn" onclick="viewPrescription('${prescription._id}')">
            View Details
          </button>
          <button class="action-btn download-btn" onclick="downloadPrescription('${prescription._id}')">
            Download PDF
          </button>
          ${hasXray ? `
            <button class="action-btn xray-btn" onclick="viewXrayReport('${prescription._id}')">
              View X-ray Report
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = prescriptionsHTML;
}

// Setup pagination
function setupPagination(currentPage, totalPages, totalCount) {
  const pagination = document.getElementById("pagination");

  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";

  let paginationHTML = '';

  // Previous button
  paginationHTML += `
    <button onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
      Previous
    </button>
  `;

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    paginationHTML += `<button onclick="changePage(1)">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<button disabled>...</button>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button onclick="changePage(${i})" ${i === currentPage ? 'class="active"' : ''}>
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<button disabled>...</button>`;
    }
    paginationHTML += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  paginationHTML += `
    <button onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
      Next
    </button>
  `;

  pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
  if (page < 1 || page > totalPages) return;
  loadPrescriptions(page, currentFilters);
}

// Apply filters
function applyFilters() {
  const doctorSearch = document.getElementById("doctor-search").value.trim();
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  currentFilters = {};
  if (doctorSearch) currentFilters.doctorName = doctorSearch;
  if (startDate) currentFilters.startDate = startDate;
  if (endDate) currentFilters.endDate = endDate;

  loadPrescriptions(1, currentFilters);
}

// Clear filters
function clearFilters() {
  document.getElementById("doctor-search").value = "";
  document.getElementById("start-date").value = "";
  document.getElementById("end-date").value = "";
  currentFilters = {};
  loadPrescriptions(1, currentFilters);
}

// View prescription details
function viewPrescription(prescriptionId) {
  // For now, we'll show an alert. In a full implementation, 
  // you'd open a modal or navigate to a detailed view
  alert(`Opening prescription details for ID: ${prescriptionId}`);

  // You could implement a modal here or navigate to a detailed page
  // window.location.href = `patient-prescription-detail.html?id=${prescriptionId}`;
}

// Download prescription as PDF
async function downloadPrescription(prescriptionId) {
  try {
    const response = await makePatientAPIRequest(`/api/patient/prescriptions/${prescriptionId}`);

    if (!response || !response.ok) {
      throw new Error("Failed to fetch prescription details");
    }

    const data = await response.json();
    const prescription = data.prescription;

    // Create a simple text content for download
    // In a full implementation, you'd generate a proper PDF
    const content = generatePrescriptionText(prescription);

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription_${prescription.patientName}_${new Date(prescription.date).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error downloading prescription:", error);
    alert("Failed to download prescription. Please try again.");
  }
}

// Generate prescription text content
function generatePrescriptionText(prescription) {
  const date = new Date(prescription.date).toLocaleDateString();

  let content = `PRESCRIPTION\n`;
  content += `================\n\n`;
  content += `Patient: ${prescription.patientName}\n`;
  content += `Date: ${date}\n`;
  content += `Doctor: ${prescription.doctor}\n`;
  if (prescription.mobile) content += `Mobile: ${prescription.mobile}\n`;
  if (prescription.address) content += `Address: ${prescription.address}\n`;
  content += `\nPRESCRIBED MEDICINES:\n`;
  content += `---------------------\n`;

  if (prescription.medicines && prescription.medicines.length > 0) {
    prescription.medicines.forEach((medicine, index) => {
      content += `${index + 1}. ${medicine.name || 'Unnamed Medicine'}\n`;
      if (medicine.dosage) content += `   Dosage: ${medicine.dosage} ${medicine.measure || ''}\n`;
      if (medicine.duration) content += `   Duration: ${medicine.duration}\n`;
      if (medicine.instruction) content += `   Instructions: ${medicine.instruction}\n`;
      content += `\n`;
    });
  } else {
    content += `No medicines prescribed.\n\n`;
  }

  if (prescription.notes) {
    content += `NOTES:\n`;
    content += `------\n`;
    content += `${prescription.notes}\n\n`;
  }

  content += `Generated from Patient Portal\n`;
  content += `${new Date().toLocaleString()}\n`;

  return content;
}

// Format file size helper function
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Open X-ray modal
function openXrayModal(imageSrc, fileName) {
  // Create modal if it doesn't exist
  let modal = document.getElementById("xray-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "xray-modal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close" onclick="closeXrayModal()">&times;</span>
        <img id="modal-xray-image" src="" alt="X-ray Image" />
      </div>
    `;
    document.body.appendChild(modal);
  }

  const modalImg = document.getElementById("modal-xray-image");
  modal.style.display = "block";
  modalImg.src = imageSrc;
  modalImg.alt = fileName;
}

// Close X-ray modal
function closeXrayModal() {
  const modal = document.getElementById("xray-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// View X-ray report (redirect to X-ray page with specific filter)
function viewXrayReport(prescriptionId) {
  // Store the prescription ID to highlight it on the X-ray page
  localStorage.setItem("highlightXrayFromPrescription", prescriptionId);
  window.location.href = "patient-xrays.html";
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

  // Load prescriptions
  loadPrescriptions();
});

// Handle storage events (for cross-tab logout)
window.addEventListener("storage", function (e) {
  if (e.key === "patientToken" && !e.newValue) {
    window.location.href = "maindashboard.html";
  }
});
