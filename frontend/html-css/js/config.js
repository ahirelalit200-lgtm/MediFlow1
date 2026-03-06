// Application Configuration
const API_BASE_URL = (window.location.port === '5500' || window.location.port === '5501' || window.location.port === '5503' || window.location.port === '3000') 
  ? 'http://localhost:5000' 
  : window.location.origin;

// Set global API URL for all files
if (typeof window !== "undefined") {
  window.API_BASE_URL = API_BASE_URL;
}
