// Application Configuration
const API_BASE_URL = "https://mediflow-api-8796.onrender.com";

// Set global API URL for all files
if (typeof window !== "undefined") {
  window.API_BASE_URL = API_BASE_URL;
}
