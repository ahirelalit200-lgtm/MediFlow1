// frontend/html-css/js/history.js
// Renders per-user history. Tries server if auth token exists, otherwise falls back to localStorage namespaced by email.

// ----------------- Helpers: localStorage per-user history -----------------
function normalizeEmail(e) {
  return (e || "").toLowerCase().trim();
}
function emailKey(email) {
  return `history_user_${normalizeEmail(email)}`;
}
function currentUserEmail() {
  return normalizeEmail(localStorage.getItem("email") || "");
}

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
function getHistoryForCurrentUserFromLocal() {
  const email = currentUserEmail();
  if (!email) return [];
  try {
    const raw = localStorage.getItem(emailKey(email));
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    console.warn("Failed to parse local history for user:", err);
    return [];
  }
}

// ----------------- Rendering -----------------
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function rowHtmlForEntry(p) {
  const patientName = p.patient || p.patientName || p.name || "—";
  const mobileNumber = p.mobileNumber || p.mobile || p.contact || "—";

  // medicines
  let medicinesList = "—";
  const meds = p.prescription?.medicines || p.medicines || p.meds || p.medicineList || [];
  if (Array.isArray(meds) && meds.length > 0) {
    medicinesList = meds.map(m => {
      if (!m) return "";
      if (typeof m === "string") return m;
      const mName = m.name || m.medicine || m.nameText || "";
      const mDosage = m.dosage || m.dose || m.dosageText || "";
      return `${mName}${mDosage ? " (" + mDosage + ")" : ""}`;
    }).filter(Boolean).join(", ");
  }

  const doctorName = p.prescription?.doctorName || p.doctor || p.doctorName || p.doctor_name || "—";

  // date handling
  let dateStr = "—";
  const dateVal = p.timestamp || p.createdAt || p.date || p.created_at || p._id;
  if (dateVal) {
    try {
      // if timestamp numeric
      const maybeNum = Number(dateVal);
      const d = !isNaN(maybeNum) && String(dateVal).length >= 10 ? new Date(maybeNum) : new Date(dateVal);
      if (!isNaN(d)) dateStr = d.toLocaleString();
    } catch (err) {
      // ignore
    }
  }

  return `
    <tr>
      <td>${escapeHtml(patientName)}</td>
      <td>${escapeHtml(mobileNumber)}</td>
      <td>${escapeHtml(medicinesList)}</td>
      <td>${escapeHtml(doctorName)}</td>
      <td>${escapeHtml(dateStr)}</td>
    </tr>`;
}

function renderHistoryList(list, tbody) {
  tbody.innerHTML = "";
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:12px;">No history records found.</td>
      </tr>`;
    return;
  }
  // If entries have newest-first already, keep order. Otherwise sort descending by timestamp/createdAt.
  list.sort((a, b) => {
    const ta = a.timestamp || Date.parse(a.createdAt) || 0;
    const tb = b.timestamp || Date.parse(b.createdAt) || 0;
    return (tb || 0) - (ta || 0);
  });

  list.forEach(p => {
    tbody.innerHTML += rowHtmlForEntry(p);
  });
}

// ----------------- Main: searchHistory -----------------
async function searchHistory() {
  const nameFilter = (document.getElementById("name")?.value || "").toLowerCase().trim();
  const mobileFilter = (document.getElementById("mobile")?.value || "").toLowerCase().trim();

  const tbody = document.querySelector("#historyTable tbody");
  if (!tbody) {
    console.warn("historyTable tbody not found.");
    return;
  }
  tbody.innerHTML = "";

  const token = localStorage.getItem("token");

  // If token exists, try server call first (server should return only current user's history when JWT used)
  if (token) {
    try {
      let url = "http://localhost:5000/api/prescriptions/history";
      const params = new URLSearchParams();
      if (nameFilter) params.append("name", nameFilter);
      if (mobileFilter) params.append("mobile", mobileFilter);
      const q = params.toString();
      if (q) url += `?${q}`;

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        // fall back to local storage on non-OK status
        console.warn("Server history fetch failed with status", res.status);
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      // Server might wrap items in { items: [...] } or return array directly
      const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.data) ? data.data : []));
      // filter server-side results additionally (defensive)
      const filtered = items.filter(it => {
        const pName = (it.patientName || it.patient || it.name || "").toLowerCase();
        const pMobile = (it.mobile || it.mobileNumber || it.contact || "").toLowerCase();
        if (nameFilter && !pName.includes(nameFilter)) return false;
        if (mobileFilter && !pMobile.includes(mobileFilter)) return false;
        return true;
      });

      renderHistoryList(filtered, tbody);
      return;
    } catch (err) {
      console.warn("Server history fetch failed, falling back to local history:", err);
      // continue to local fallback
    }
  }

  // LocalStorage fallback: read per-user history and filter client-side
  const localList = getHistoryForCurrentUserFromLocal();
  const filteredLocal = localList.filter(it => {
    const pName = (it.patient || it.patientName || it.prescription?.patientName || "").toLowerCase();
    const pMobile = (it.mobileNumber || it.mobile || it.prescription?.mobileNumber || "").toLowerCase();
    if (nameFilter && !pName.includes(nameFilter)) return false;
    if (mobileFilter && !pMobile.includes(mobileFilter)) return false;
    return true;
  });

  renderHistoryList(filteredLocal, tbody);
}

// Optional: expose searchHistory globally or bind to a search button
document.addEventListener("DOMContentLoaded", () => {
  // If a search button exists, wire it; otherwise run initial load
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      searchHistory();
    });
  }
  // Also run at load to populate table for current user
  searchHistory();
});

// Export for potential reuse (if you're using modules; otherwise harmless global)
window.searchHistory = searchHistory;
