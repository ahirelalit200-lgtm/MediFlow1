// Application Configuration
const API_BASE_URL = "http://localhost:5000";

// Set global API URL for all files
if (typeof window !== "undefined") {
  window.API_BASE_URL = API_BASE_URL;
}
