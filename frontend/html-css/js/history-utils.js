// frontend/html-css/js/history-utils.js
// Utilities for per-user history stored in localStorage (namespaced by normalized email).
// Exposes an object `window.historyUtils` with helper functions.
//
// Key pattern in localStorage: "history_user_<normalized-email>"

(function () {
  // ----------------- Helpers -----------------
  function normalizeEmail(email) {
    if (!email) return "";
    return String(email).toLowerCase().trim();
  }

  function emailKey(email) {
    return `history_user_${normalizeEmail(email)}`;
  }

  function currentUserEmail() {
    return normalizeEmail(localStorage.getItem("email") || "");
  }

  function readJsonSafe(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn("history-utils: failed to parse JSON from localStorage for key", key, err);
      return null;
    }
  }

  function writeJsonSafe(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error("history-utils: failed to write JSON to localStorage for key", key, err);
      return false;
    }
  }

  // ----------------- Core API -----------------
  /**
   * Save a history entry for the currently logged-in user.
   * entry: object (may contain patient, prescription, notes, mobileNumber, etc.)
   * Returns the saved entry (with id and timestamp added) or null on failure.
   */
  function saveHistoryForCurrentUser(entry = {}) {
    const email = currentUserEmail();
    if (!email) {
      console.warn("history-utils: no logged-in email found; history not saved.");
      return null;
    }

    const key = emailKey(email);
    let list = readJsonSafe(key);
    if (!Array.isArray(list)) list = [];

    // Ensure entry has stable id and timestamp
    const timestamp = entry.timestamp || Date.now();
    const id = entry.id || `presc_${timestamp}_${Math.random().toString(36).slice(2, 9)}`;

    const fullEntry = Object.assign(
      {
        id,
        timestamp
      },
      entry
    );

    // Prepend newest-first
    list.unshift(fullEntry);

    const ok = writeJsonSafe(key, list);
    if (!ok) {
      console.error("history-utils: failed to save history to localStorage.");
      return null;
    }

    return fullEntry;
  }

  /**
   * Get history array for the currently logged-in user.
   * Returns [] if none or no logged in user.
   */
  function getHistoryForCurrentUser() {
    const email = currentUserEmail();
    if (!email) return [];
    const key = emailKey(email);
    const list = readJsonSafe(key);
    return Array.isArray(list) ? list : [];
  }

  /**
   * Clear (delete) history for the currently logged-in user.
   */
  function clearHistoryForCurrentUser() {
    const email = currentUserEmail();
    if (!email) return false;
    const key = emailKey(email);
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error("history-utils: failed to remove history key", key, err);
      return false;
    }
  }

  // ----------------- Optional migration helper -----------------
  /**
   * Migrate a previously used global history key into the per-user key.
   * - email: the user's email to migrate into
   * - globalKey: the old key in localStorage (default: "history")
   *
   * Returns number of migrated entries.
   */
  function migrateGlobalHistoryToUser(email, globalKey = "history") {
    const normalized = normalizeEmail(email);
    if (!normalized) return 0;

    const oldRaw = readJsonSafe(globalKey);
    if (!Array.isArray(oldRaw) || oldRaw.length === 0) return 0;

    const targetKey = emailKey(normalized);
    let existing = readJsonSafe(targetKey);
    if (!Array.isArray(existing)) existing = [];

    // Append old entries (keep newest-first by putting old entries after existing newest-first order)
    // We'll add unique ids if missing
    const toAdd = oldRaw.map((it) => {
      const ts = it.timestamp || Date.now();
      const id = it.id || `migr_${ts}_${Math.random().toString(36).slice(2, 8)}`;
      return Object.assign({ id, timestamp: ts }, it);
    });

    // Merge: place new migrated entries at front (assuming older entries were earlier)
    const merged = toAdd.concat(existing);
    const ok = writeJsonSafe(targetKey, merged);
    if (ok) {
      try {
        localStorage.removeItem(globalKey);
      } catch (e) {
        // Not critical
      }
      return toAdd.length;
    }
    return 0;
  }

  // ----------------- Optional server sync helper -----------------
  /**
   * Try to POST a history entry to the server endpoint.
   * This is optional and non-blocking; failures are logged and do not stop local save.
   *
   * opts: { endpoint, token } - if not provided token will be read from localStorage.
   *
   * Returns a Promise that resolves to server response JSON on success or null on failure.
   */
  async function syncEntryToServer(entry, opts = {}) {
    if (!entry) return null;
    const endpoint = opts.endpoint || `${window.API_BASE_URL}/api/history`;
    const token = opts.token || localStorage.getItem("token") || null;
    if (!token) {
      // no token: cannot sync to server
      return null;
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: Object.assign(
          { "Content-Type": "application/json" },
          token ? { Authorization: `Bearer ${token}` } : {}
        ),
        body: JSON.stringify(entry)
      });
      if (!res.ok) {
        console.warn("history-utils: server sync failed", res.status);
        return null;
      }
      const json = await res.json().catch(() => null);
      return json;
    } catch (err) {
      console.warn("history-utils: server sync error", err);
      return null;
    }
  }

  // ----------------- Export to window -----------------
  const historyUtils = {
    normalizeEmail,
    emailKey,
    currentUserEmail,
    saveHistoryForCurrentUser,
    getHistoryForCurrentUser,
    clearHistoryForCurrentUser,
    migrateGlobalHistoryToUser,
    syncEntryToServer
  };

  // Expose for use in other scripts
  window.historyUtils = historyUtils;
})();
