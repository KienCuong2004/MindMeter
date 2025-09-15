import { clearAnonymousData } from "../services/anonymousService";

/**
 * Utility function để xử lý logout đồng nhất cho tất cả các trang
 * Tự động xác định role và chuyển hướng đúng:
 * - Admin/Expert: về trang login
 * - Student: về trang home
 * @param {Function} navigate - React Router navigate function (nếu có)
 * @param {boolean} forceReload - Có force reload trang không (mặc định: false)
 */
export const handleLogout = (navigate = null, forceReload = false) => {
  // Lấy thông tin user từ localStorage để xác định role
  const userStr = localStorage.getItem("user");
  let userRole = null;

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userRole = user.role;
    } catch (error) {
      // Không thể parse user data
    }
  }

  // Xóa tất cả dữ liệu authentication
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Xóa dữ liệu anonymous user nếu có
  try {
    clearAnonymousData();
  } catch (error) {
    // Không thể xóa anonymous data
  }

  // Xóa các dữ liệu khác có thể có
  localStorage.removeItem("theme");
  localStorage.removeItem("language");

  // Xác định trang đích dựa trên role
  let targetPath = "/login"; // Mặc định về login

  if (userRole === "STUDENT") {
    targetPath = "/home"; // Student về trang home
  }
  // Admin và Expert về trang login (mặc định)

  // Chuyển hướng về trang đích
  if (forceReload) {
    // Force reload để reset toàn bộ state
    window.location.href = targetPath;
  } else if (navigate) {
    // Sử dụng React Router navigate nếu có
    navigate(targetPath);
  } else {
    // Fallback về window.location
    window.location.href = targetPath;
  }
};

/**
 * Utility function đặc biệt cho StudentHomePage (cần force reload)
 * @deprecated Sử dụng handleLogout thay thế
 */
export const handleStudentLogout = () => {
  // Xóa tất cả dữ liệu
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  try {
    clearAnonymousData();
  } catch (error) {
    // Không thể xóa anonymous data
  }

  // Force reload về trang home để reset toàn bộ state
  window.location.href = "/home";
};
