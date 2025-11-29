import React, { useState } from "react";
import { FaLock, FaKey } from "react-icons/fa";

const ChangePasswordModal = ({
  isOpen,
  onClose,
  isTemporaryPassword = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!isTemporaryPassword && currentPassword.trim() === "") {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const endpoint = isTemporaryPassword
        ? "/api/password/change-temporary"
        : "/api/password/change";

      const requestBody = isTemporaryPassword
        ? { newPassword }
        : { currentPassword, newPassword };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Đổi mật khẩu thành công! Đang chuyển hướng...");

        // Auto login with new password after successful change
        setTimeout(async () => {
          try {
            const currentToken = localStorage.getItem("token");
            if (currentToken) {
              // Get user email from current token
              const payload = JSON.parse(atob(currentToken.split(".")[1]));
              const email = payload.sub;

              // Auto login with new password
              const loginResponse = await fetch(
                `${process.env.REACT_APP_API_URL}/api/auth/login`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    email: email,
                    password: newPassword,
                  }),
                }
              );

              if (loginResponse.ok) {
                const loginData = await loginResponse.json();

                // Update token and user data
                localStorage.setItem("token", loginData.token);
                localStorage.setItem("user", JSON.stringify(loginData.user));

                // Close modal and redirect to home
                onClose();
                window.location.href = "/";
              } else {
                // If auto login fails, just redirect to login page
                onClose();
                window.location.href = "/login";
              }
            } else {
              // No token found, redirect to login
              onClose();
              window.location.href = "/login";
            }
          } catch (error) {
            console.error("Auto login failed:", error);
            // Fallback: redirect to login page
            onClose();
            window.location.href = "/login";
          }
        }, 1500);
      } else {
        setError(data.error || "Có lỗi xảy ra khi đổi mật khẩu");
      }
    } catch (err) {
      setError("Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            {isTemporaryPassword ? (
              <>
                <FaLock className="mr-2 text-blue-600" />
                Đặt mật khẩu mới
              </>
            ) : (
              <>
                <FaKey className="mr-2 text-blue-600" />
                Đổi mật khẩu
              </>
            )}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Warning for temporary password */}
        {isTemporaryPassword && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center">
              <FaLock className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>CHÀO MỪNG:</strong> Vui lòng đặt mật khẩu mới cho tài
                khoản của bạn. Đây là bước bảo mật quan trọng.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password (only for regular password change) */}
          {!isTemporaryPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Nhập mật khẩu hiện tại"
                required
              />
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mật khẩu mới
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              required
              minLength={6}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Nhập lại mật khẩu mới"
              required
              minLength={6}
            />
          </div>

          {/* Show Password Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="mr-2 accent-blue-500 dark:accent-blue-400"
            />
            <label
              htmlFor="showPassword"
              className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none"
            >
              Hiển thị mật khẩu
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-sm text-green-800 dark:text-green-200">
                {success}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang xử lý...
                </div>
              ) : isTemporaryPassword ? (
                "Đặt mật khẩu mới"
              ) : (
                "Đổi mật khẩu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
