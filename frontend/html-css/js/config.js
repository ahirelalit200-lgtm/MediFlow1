// Application Configuration
// Change API_BASE_URL to your production API URL when deploying
const API_BASE_URL = "http://localhost:5000";

// Optional: Auto-detect localhost vs production
// const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
//   ? "http://localhost:5000"
//   : "https://your-production-api.com";

(function () {
  try {
    const fromStorage = typeof localStorage !== "undefined" ? localStorage.getItem("API_BASE_URL") : null;
    const fromWindow = typeof window !== "undefined" ? (window.__API_BASE_URL || window.API_BASE_URL) : null;
    const resolvedBase = String(fromWindow || fromStorage || API_BASE_URL || "").trim();
    const normalizedBase = resolvedBase.replace(/\/+$/, "");

    if (typeof window !== "undefined") {
      window.API_BASE_URL = normalizedBase;
    }

    if (typeof window !== "undefined" && typeof window.fetch === "function") {
      const originalFetch = window.fetch.bind(window);
      window.fetch = function (input, init) {
        try {
          const baseWithSlash = (window.API_BASE_URL || "").replace(/\/+$/, "") + "/";
          const baseUrl = new URL(baseWithSlash, window.location.href);

          const rewriteUrl = (urlStr) => {
            const targetUrl = new URL(urlStr, window.location.href);
            const isLocalhost = (targetUrl.hostname === "localhost" || targetUrl.hostname === "127.0.0.1");
            const isPort5000 = (targetUrl.port === "5000");
            const isHttp = (targetUrl.protocol === "http:" || targetUrl.protocol === "https:");
            if (!isHttp || !isLocalhost || !isPort5000) return urlStr;

            const path = targetUrl.pathname.replace(/^\//, "");
            const rewritten = new URL(path + targetUrl.search + targetUrl.hash, baseUrl);
            return rewritten.toString();
          };

          if (typeof input === "string") {
            return originalFetch(rewriteUrl(input), init);
          }

          if (input && typeof input === "object" && typeof input.url === "string") {
            const newUrl = rewriteUrl(input.url);
            if (newUrl === input.url) return originalFetch(input, init);
            const newRequest = new Request(newUrl, input);
            return originalFetch(newRequest, init);
          }
        } catch (_) {
          // ignore
        }
        return originalFetch(input, init);
      };
    }
  } catch (_) {
    // ignore
  }
})();
