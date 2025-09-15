import {
  getCurrentToken,
  clearAnonymousData,
} from "./services/anonymousService";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Function để lấy CSRF token từ cookie
function getCsrfToken() {
  const name = "XSRF-TOKEN";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export async function authFetch(url, options = {}) {
  // Nếu URL bắt đầu bằng /, thêm base URL
  const fullUrl = url.startsWith("/") ? `${API_BASE_URL}${url}` : url;

  const token = getCurrentToken();

  // Lấy ngôn ngữ hiện tại từ i18n hoặc localStorage
  let currentLanguage = "vi"; // Default
  try {
    // Kiểm tra xem có đang ở React component không
    if (typeof window !== "undefined" && window.i18n) {
      currentLanguage = window.i18n.language;
    } else {
      // Fallback: lấy từ localStorage
      currentLanguage = localStorage.getItem("i18nextLng") || "vi";
    }
  } catch (e) {
    // Fallback về tiếng Việt nếu có lỗi
    currentLanguage = "vi";
  }

  // Lấy CSRF token cho các request POST/PUT/DELETE
  const csrfToken = getCsrfToken();

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Accept-Language": currentLanguage,
    ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
  };

  const res = await fetch(fullUrl, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    clearAnonymousData();
    window.location.href = "/login";
    return;
  }

  return res;
}
