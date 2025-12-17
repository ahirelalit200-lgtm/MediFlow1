// frontend/html-css/js/patient-xrays.js

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
  document.getElementById("xrays-grid").innerHTML = "";
}

// Show error state
function showError(message) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "block";
  document.getElementById("error").textContent = message;
  document.getElementById("xrays-grid").innerHTML = "";
}

// Load X-rays
async function loadXrays() {
  showLoading();

  try {
    const response = await makePatientAPIRequest("/api/patient/xrays");

    if (!response || !response.ok) {
      throw new Error("Failed to load X-ray reports");
    }

    const data = await response.json();
    displayXrays(data.xrays || []);

  } catch (error) {
    console.error("Error loading X-rays:", error);
    showError("Failed to load X-ray reports. Please try again later.");
  }
}

// Display X-rays
function displayXrays(xrays) {
  const grid = document.getElementById("xrays-grid");
  document.getElementById("loading").style.display = "none";

  if (xrays.length === 0) {
    grid.innerHTML = `
      <div class="no-xrays">
        <h3>No X-ray reports found</h3>
        <p>You don't have any X-ray reports yet.</p>
        <p>X-rays taken during your visits will appear here with AI-generated analysis.</p>
      </div>
    `;
    return;
  }

  const xraysHTML = xrays.map(xray => {
    const date = new Date(xray.createdAt || xray.date).toLocaleDateString();
    const time = new Date(xray.createdAt || xray.date).toLocaleTimeString();

    // Handle both direct xray objects and xrays from prescriptions
    const imageData = xray.dataUrl || (xray.xray && xray.xray.dataUrl);
    const fileName = xray.name || (xray.xray && xray.xray.name) || 'X-ray Image';
    const fileSize = xray.size || (xray.xray && xray.xray.size);
    const analysis = xray.xrayAnalysis || xray.analysis;

    return `
      <div class="xray-card">
        <div class="xray-header">
          <div class="xray-info">
            <h3>${fileName}</h3>
            <p><strong>Doctor:</strong> ${xray.doctor || 'Unknown'}</p>
            <p><strong>Notes:</strong> ${xray.notes || 'No additional notes'}</p>
            ${fileSize ? `<p><strong>File Size:</strong> ${formatFileSize(fileSize)}</p>` : ''}
          </div>
          <div class="xray-date">
            <div>${date}</div>
            <div>${time}</div>
          </div>
        </div>
        
        <div class="xray-content">
          <div class="xray-image-section">
            ${imageData ? `
              <img src="${imageData}" alt="X-ray Image" class="xray-image" 
                   onclick="openImageModal('${imageData}', '${fileName}')" />
              <div class="image-info">
                <p>Click to view full size</p>
              </div>
            ` : `
              <div style="background: #f5f5f5; padding: 2rem; border-radius: 8px; color: #666;">
                <p>Image not available</p>
              </div>
            `}
          </div>
          
          <div class="xray-analysis">
            <div class="analysis-header">
              <h4>AI Analysis Report</h4>
              <span class="ai-badge">AI Generated</span>
            </div>
            
            ${analysis ? generateAnalysisHTML(analysis) : `
              <div class="analysis-content">
                <p style="color: #666; font-style: italic;">
                  AI analysis not available for this X-ray. 
                  This may be an older X-ray or the analysis is still being processed.
                </p>
              </div>
            `}
          </div>
        </div>
        
        <div class="xray-actions">
          ${imageData ? `
            <button class="action-btn view-btn" onclick="openImageModal('${imageData}', '${fileName}')">
              View Full Size
            </button>
            <button class="action-btn download-btn" onclick="downloadXray('${imageData}', '${fileName}')">
              Download Image
            </button>
          ` : ''}
          <button class="action-btn share-btn" onclick="shareXray('${xray._id || xray.id}')">
            Share Report
          </button>
          <button class="action-btn delete-btn" onclick="deleteXray('${xray._id || xray.id}')">
            Delete X-ray
          </button>
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = xraysHTML;
}

// Generate analysis HTML
function generateAnalysisHTML(analysis) {
  if (!analysis || !analysis.success) {
    return `
      <div class="analysis-content">
        <p style="color: #dc3545;">Analysis failed or unavailable.</p>
      </div>
    `;
  }

  let html = `<div class="analysis-content">`;

  // X-ray type and confidence
  if (analysis.xrayType) {
    html += `<p><strong>X-ray Type:</strong> ${analysis.xrayType}`;
    if (analysis.confidence) {
      html += `<span class="confidence-score">${Math.round(analysis.confidence * 100)}% confidence</span>`;
    }
    html += `</p>`;
  }

  // Overall severity
  if (analysis.severity) {
    const severityClass = analysis.severity.toLowerCase();
    html += `<p><strong>Overall Assessment:</strong> 
      <span class="severity-badge severity-${severityClass}">${analysis.severity}</span>
    </p>`;
  }

  // Findings
  if (analysis.findings && analysis.findings.length > 0) {
    html += `<h5>Findings:</h5>`;
    html += `<ul class="findings-list">`;
    analysis.findings.forEach(finding => {
      html += `<li>`;
      html += `<div class="finding-type">${finding.type || 'Finding'}`;
      if (finding.severity) {
        const severityClass = finding.severity.toLowerCase();
        html += `<span class="severity-badge severity-${severityClass}">${finding.severity}</span>`;
      }
      html += `</div>`;

      if (finding.location || finding.description) {
        html += `<div class="finding-details">`;
        if (finding.location) html += `Location: ${finding.location}<br>`;
        if (finding.description) html += `${finding.description}`;
        if (finding.confidence) html += `<br>Confidence: ${Math.round(finding.confidence * 100)}%`;
        html += `</div>`;
      }
      html += `</li>`;
    });
    html += `</ul>`;
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    html += `<div class="recommendations">`;
    html += `<h5>Recommendations:</h5>`;
    html += `<ul>`;
    analysis.recommendations.forEach(rec => {
      html += `<li>${rec}</li>`;
    });
    html += `</ul>`;
    html += `</div>`;
  }

  // Timestamp
  if (analysis.timestamp) {
    const analysisDate = new Date(analysis.timestamp).toLocaleString();
    html += `<p style="font-size: 0.8rem; color: #999; margin-top: 1rem;">
      Analysis generated on: ${analysisDate}
    </p>`;
  }

  html += `</div>`;
  return html;
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Open image modal
function openImageModal(imageSrc, fileName) {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-image");

  modal.style.display = "block";
  modalImg.src = imageSrc;
  modalImg.alt = fileName;
}

// Close modal
function closeModal() {
  document.getElementById("image-modal").style.display = "none";
}

// Download X-ray image
function downloadXray(imageData, fileName) {
  try {
    // Create download link
    const link = document.createElement('a');
    link.href = imageData;
    link.download = fileName.replace(/\.[^/.]+$/, "") + '.png'; // Ensure .png extension
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading X-ray:', error);
    alert('Failed to download X-ray image. Please try again.');
  }
}

// Share X-ray report
function shareXray(xrayId) {
  // In a full implementation, this would generate a shareable link
  // or open a sharing dialog
  const shareUrl = `${window.location.origin}/shared-xray/${xrayId}`;

  if (navigator.share) {
    navigator.share({
      title: 'X-Ray Report',
      text: 'View my X-ray report',
      url: shareUrl
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(() => {
      // Final fallback: show the URL
      prompt('Copy this link to share:', shareUrl);
    });
  }
}

// Delete X-ray
async function deleteXray(xrayId) {
  if (!confirm('Are you sure you want to delete this X-ray? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await makePatientAPIRequest(`/api/patient/xrays/${xrayId}`, {
      method: 'DELETE'
    });

    if (!response || !response.ok) {
      throw new Error('Failed to delete X-ray');
    }

    const result = await response.json();
    alert(result.message || 'X-ray deleted successfully');

    // Reload the X-rays list
    loadXrays();

  } catch (error) {
    console.error('Error deleting X-ray:', error);
    alert('Failed to delete X-ray. Please try again.');
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

  // Load X-rays
  loadXrays();
});

// Handle storage events (for cross-tab logout)
window.addEventListener("storage", function (e) {
  if (e.key === "patientToken" && !e.newValue) {
    window.location.href = "maindashboard.html";
  }
});

// Close modal when clicking outside of it
window.addEventListener("click", function (event) {
  const modal = document.getElementById("image-modal");
  if (event.target === modal) {
    closeModal();
  }
});

// Handle escape key to close modal
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
});
