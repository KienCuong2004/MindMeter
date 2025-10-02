import axios from "axios";
import { ANONYMOUS_USER } from "../constants/userConstants";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Tạo tài khoản ẩn danh
export const createAnonymousAccount = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/anonymous/create`,
      {}
    );
    return response.data;
  } catch (error) {
    // Error creating anonymous account
    throw error;
  }
};

// Nâng cấp tài khoản ẩn danh
export const upgradeAnonymousAccount = async (userId, upgradeData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/auth/anonymous/upgrade/${userId}`,
      upgradeData
    );
    return response.data;
  } catch (error) {
    // Error upgrading anonymous account
    throw error;
  }
};

// Kiểm tra xem user có phải là anonymous không
export const isAnonymousUser = (user) => {
  if (!user) return false;

  // Kiểm tra các điều kiện để xác định user anonymous
  return (
    user.anonymous === true ||
    user.role === "ANONYMOUS" ||
    user.email === "anonymous" ||
    user.email === null ||
    (user.firstName === ANONYMOUS_USER.firstName &&
      user.lastName === ANONYMOUS_USER.lastName) ||
    // Check cho trường hợp anonymous user có role "STUDENT" nhưng email là "anonymous"
    (user.role === "STUDENT" && user.email === "anonymous")
  );
};

// Lưu thông tin user ẩn danh vào localStorage
export const saveAnonymousUser = (userData) => {
  localStorage.setItem("anonymousUser", JSON.stringify(userData));
};

// Lấy thông tin user ẩn danh từ localStorage
export const getAnonymousUser = () => {
  const userData = localStorage.getItem("anonymousUser");
  if (!userData || userData === "undefined") return null;
  try {
    const user = JSON.parse(userData);
    // Bổ sung role nếu thiếu
    if (!user.role) user.role = "STUDENT";
    if (!user.firstName) user.firstName = ANONYMOUS_USER.firstName;
    if (!user.lastName) user.lastName = ANONYMOUS_USER.lastName;
    return user;
  } catch {
    return null;
  }
};

// Xóa thông tin user ẩn danh khỏi localStorage
export const removeAnonymousUser = () => {
  localStorage.removeItem("anonymousUser");
};

// Lưu token ẩn danh
export const saveAnonymousToken = (token) => {
  localStorage.setItem("anonymousToken", token);
};

// Lấy token ẩn danh
export const getAnonymousToken = () => {
  return localStorage.getItem("anonymousToken");
};

// Xóa token ẩn danh
export const removeAnonymousToken = () => {
  localStorage.removeItem("anonymousToken");
};

// Kiểm tra xem có đang sử dụng tài khoản ẩn danh không
export const isUsingAnonymousAccount = () => {
  return getAnonymousToken() !== null;
};

// Lấy thông tin user hiện tại (anonymous hoặc logged in)
export const getCurrentUser = () => {
  // Ưu tiên user đã đăng nhập
  const loggedInUser = localStorage.getItem("user");
  if (loggedInUser && loggedInUser !== "undefined") {
    try {
      return JSON.parse(loggedInUser);
    } catch {
      return null;
    }
  }

  // Nếu không có user đăng nhập, kiểm tra anonymous user
  return getAnonymousUser();
};

// Lấy token hiện tại
export const getCurrentToken = () => {
  // Ưu tiên token đăng nhập
  const loggedInToken = localStorage.getItem("token");
  if (loggedInToken) {
    return loggedInToken;
  }

  // Nếu không có token đăng nhập, kiểm tra anonymous token
  return getAnonymousToken();
};

// Xóa tất cả thông tin anonymous
export const clearAnonymousData = () => {
  removeAnonymousUser();
  removeAnonymousToken();
};

// Function để refresh token và cập nhật thông tin user
export const refreshToken = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    // Xác định role để gọi đúng endpoint
    const user = getCurrentUser();
    let endpoint = "";

    if (user?.role === "ADMIN") {
      endpoint = "/api/admin/refresh-token";
    } else if (user?.role === "EXPERT") {
      endpoint = "/api/expert/refresh-token";
    } else {
      endpoint = "/api/payment/refresh-token";
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cập nhật token mới
    localStorage.setItem("token", data.token);

    // Cập nhật thông tin user
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  } catch (error) {
    // Error refreshing token
    throw error;
  }
};

// Function để cập nhật thông tin user sau khi thay đổi
export const updateUserInfo = async () => {
  try {
    const data = await refreshToken();
    return data.user;
  } catch (error) {
    // Error updating user info
    throw error;
  }
};

// Function để refresh token tự động khi cập nhật avatar hoặc plan
export const autoRefreshToken = async () => {
  try {
    const data = await refreshToken();

    // Cập nhật localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  } catch (error) {
    // Error auto-refreshing token
    throw error;
  }
};

// Function để kiểm tra và refresh token nếu cần
export const checkAndRefreshToken = async () => {
  try {
    const user = getCurrentUser();
    const token = localStorage.getItem("token");

    if (!user || !token) {
      return false;
    }

    // Kiểm tra xem token có cần refresh không
    // Có thể thêm logic kiểm tra thời gian hết hạn ở đây

    // Tạm thời luôn refresh để đảm bảo thông tin mới nhất
    await autoRefreshToken();
    return true;
  } catch (error) {
    // Error checking and refreshing token
    return false;
  }
};
