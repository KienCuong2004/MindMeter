import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaUser } from "react-icons/fa";

export default function ProfileForm({
  profile,
  isEdit,
  saving,
  onEdit,
  onCancel,
  onSave,
  selectedFile,
  setSelectedFile,
  error,
  alert,
  userRole,
  onBack,
  backText,
  backIcon: BackIcon,
  setError,
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef();

  // Local state cho form data
  const [form, setForm] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    phone: profile?.phone || "",
  });

  // Cập nhật form khi profile thay đổi
  React.useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  // Kiểm tra profile có tồn tại không - phải đặt sau tất cả React Hooks
  if (!profile) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 flex flex-col items-center border border-blue-100 dark:border-gray-700 min-w-[340px] w-full max-w-md">
        <div className="text-red-500 text-center">
          <p className="font-semibold">Profile not available</p>
        </div>
      </div>
    );
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.");
        return;
      }

      // Kiểm tra loại file
      if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn file ảnh hợp lệ.");
        return;
      }

      setSelectedFile(file);
      setError(""); // Clear error when file is valid
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const getRoleDisplayText = (role) => {
    switch (role) {
      case "ADMIN":
        return t("adminProfile.administrator") || "Administrator";
      case "EXPERT":
        return t("roleExpert") || "Expert";
      case "STUDENT":
        return t("roleStudent") || "Student";
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "text-purple-600 dark:text-purple-300";
      case "EXPERT":
        return "text-blue-600 dark:text-blue-300";
      case "STUDENT":
        return "text-blue-600 dark:text-blue-300";
      default:
        return "text-gray-600 dark:text-gray-300";
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case "PRO":
        return "text-purple-600 dark:text-purple-400";
      case "PLUS":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getPlanDisplayText = (plan) => {
    switch (plan) {
      case "PRO":
        return "Pro";
      case "PLUS":
        return "Plus";
      default:
        return "Free";
    }
  };

  const getAvatarBorderClass = (plan) => {
    if (plan === "PRO") {
      return "rounded-2xl border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-200 dark:shadow-purple-900/50 ring-2 ring-purple-300/30 dark:ring-purple-600/30";
    } else if (plan === "PLUS") {
      return "rounded-full border-green-500 dark:border-green-400 shadow-lg shadow-green-200 dark:shadow-green-900/50";
    } else {
      return "rounded-full border-indigo-400 dark:border-indigo-600";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;
      return date.toLocaleDateString("vi-VN");
    } catch {
      return "N/A";
    }
  };

  const calculateRemainingDays = (expiryDate) => {
    if (!expiryDate) return 0;
    try {
      const expiry =
        typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
      const now = new Date();
      const diffTime = expiry - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  };

  // Function để xử lý Google avatar URL (tương tự DashboardHeader)
  const processAvatarUrl = (avatarUrl, timestamp = null) => {
    if (!avatarUrl) return avatarUrl; // Return original value instead of null

    let optimizedUrl = String(avatarUrl).trim(); // Ensure it's a string

    // Xử lý relative path (ví dụ: /uploads/avatars/...)
    if (!optimizedUrl.startsWith("http") && !optimizedUrl.startsWith("/")) {
      // Nếu là relative path không bắt đầu bằng /, thêm base URL
      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8080";
      optimizedUrl = `${API_BASE_URL}/${optimizedUrl}`;
    } else if (optimizedUrl.startsWith("/")) {
      // Nếu là absolute path relative to host, thêm base URL
      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8080";
      optimizedUrl = `${API_BASE_URL}${optimizedUrl}`;
    }

    // Nếu là Google Profile Image, không thêm cache-busting để tránh làm hỏng URL
    // Google URL đã được optimize từ backend và có thể không hỗ trợ query parameters
    if (optimizedUrl.includes("googleusercontent.com")) {
      return optimizedUrl; // Return Google URL as-is
    }

    // Add cache-busting parameter nếu timestamp được provide (chỉ cho non-Google URLs)
    if (timestamp) {
      const separator = optimizedUrl.includes("?") ? "&" : "?";
      // Sử dụng timestamp + random number để đảm bảo URL luôn khác nhau
      const randomId = Math.random().toString(36).substring(7);
      optimizedUrl = `${optimizedUrl}${separator}t=${timestamp}&r=${randomId}`;
    }

    return optimizedUrl;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 flex flex-col items-center border border-blue-100 dark:border-gray-700 min-w-[340px] max-w-md w-full mx-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {userRole === "ADMIN"
            ? t("adminProfileTitle") || "Admin Profile"
            : userRole === "EXPERT"
            ? t("expertProfileTitle") || "Expert Profile"
            : t("studentProfileTitle") || "Student Profile"}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {userRole === "ADMIN"
            ? t("adminProfileSubtitle") || "Manage admin account info"
            : userRole === "EXPERT"
            ? t("expertProfileSubtitle") || "Manage expert account info"
            : t("studentProfileSubtitle") || "Manage student account info"}
        </p>
      </div>

      {/* Avatar với VIP badge */}
      <div className="relative">
        {/* VIP Badge cho user có gói PRO */}
        {profile?.plan === "PRO" && (
          <div className="absolute -top-2 -left-2 w-8 h-8 animate-pulse">
            <img
              src="/src/assets/images/VIP.png"
              alt="VIP"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
        )}

        {selectedFile ? (
          // Hiển thị ảnh mới được chọn
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="avatar"
            className={`w-24 h-24 border-2 shadow hover:scale-105 transition mb-4 ${getAvatarBorderClass(
              profile?.plan
            )}`}
          />
        ) : profile?.avatar || profile?.avatarUrl ? (
          // Hiển thị avatar hiện tại
          <div className="relative">
            <img
              src={
                processAvatarUrl(
                  profile?.avatar || profile?.avatarUrl,
                  Date.now()
                ) ||
                profile?.avatar ||
                profile?.avatarUrl
              }
              alt="avatar"
              className={`w-24 h-24 border-2 shadow hover:scale-105 transition mb-4 object-cover ${getAvatarBorderClass(
                profile?.plan
              )}`}
              onError={(e) => {
                // Hiển thị placeholder khi load lỗi
                e.target.style.display = "none";
                // Tìm và hiển thị fallback div
                const fallbackDiv =
                  e.target.parentElement.querySelector(".avatar-fallback");
                if (fallbackDiv) {
                  fallbackDiv.style.display = "flex";
                }
              }}
            />
            {/* Fallback avatar khi load lỗi */}
            <div
              className={`avatar-fallback w-24 h-24 border-2 shadow hover:scale-105 transition mb-4 flex items-center justify-center text-4xl text-indigo-400 dark:text-indigo-300 bg-white dark:bg-gray-800 ${getAvatarBorderClass(
                profile?.plan
              )}`}
              style={{ display: "none", position: "absolute", top: 0, left: 0 }}
            >
              <FaUser className="text-white" size={20} />
            </div>
          </div>
        ) : (
          // Hiển thị avatar mặc định
          <div
            className={`w-24 h-24 border-2 shadow hover:scale-105 transition mb-4 flex items-center justify-center text-4xl text-indigo-400 dark:text-indigo-300 bg-white dark:bg-gray-800 ${getAvatarBorderClass(
              profile?.plan
            )}`}
          >
            <FaUser className="text-white" size={20} />
          </div>
        )}

        {/* Icon máy ảnh để thay đổi avatar - chỉ hiển thị khi edit */}
        {isEdit && (
          <div
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors z-10"
            onClick={handleAvatarClick}
            title={t("changeAvatar") || "Thay đổi avatar"}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}

        {/* File input ẩn để chọn ảnh */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {/* Hiển thị thông tin file đã chọn */}
      {selectedFile && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {selectedFile.name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              title={t("deselectImage") || "Bỏ chọn ảnh"}
            >
              <svg
                className="w-5 h-5"
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
        </div>
      )}

      {/* Form */}
      <form className="w-full" onSubmit={onSave}>
        <div className="flex flex-col gap-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <label className="text-gray-600 dark:text-gray-300 text-sm whitespace-nowrap">
                  {t("firstNameHeader")}:
                </label>
                {isEdit ? (
                  <input
                    type="text"
                    className="w-full rounded-xl px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    required
                  />
                ) : (
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">
                    {profile?.firstName || ""}
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label className="text-gray-600 dark:text-gray-300 text-sm whitespace-nowrap">
                  {t("lastNameHeader")}:
                </label>
                {isEdit ? (
                  <input
                    type="text"
                    className="w-full rounded-xl px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    required
                  />
                ) : (
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">
                    {profile?.lastName || ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-600 dark:text-gray-300 text-sm whitespace-nowrap">
              Email:
            </label>
            <span className="text-lg font-semibold text-gray-800 dark:text-white">
              {profile?.email || ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-600 dark:text-gray-300 text-sm whitespace-nowrap">
              {t("phoneHeader")}:
            </label>
            {isEdit ? (
              <input
                type="text"
                className="w-full rounded-xl px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            ) : (
              <span className="text-lg font-semibold text-gray-800 dark:text-white">
                {profile?.phone || t("notUpdated") || "Chưa cập nhật"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-600 dark:text-gray-300 text-sm">
              {t("roleHeader")}:
            </label>
            <span
              className={`text-base font-semibold ${getRoleColor(
                profile?.role
              )}`}
            >
              {getRoleDisplayText(profile?.role)}
            </span>
          </div>

          {/* Hiển thị thông tin gói dịch vụ */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 dark:text-gray-300 text-sm">
                  {t("servicePackage")}:
                </label>
                <span
                  className={`text-base font-semibold ${getPlanColor(
                    profile?.plan
                  )}`}
                >
                  {getPlanDisplayText(profile?.plan)}
                </span>
              </div>
              {profile?.plan !== "FREE" && profile?.planExpiryDate && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("remainingTime") || "Thời gian còn lại"}:{" "}
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    {calculateRemainingDays(profile?.planExpiryDate)}{" "}
                    {t("days") || "ngày"}
                  </span>
                </span>
              )}
            </div>

            {/* Hiển thị thông tin thời hạn gói */}
            {profile?.plan !== "FREE" && profile?.planExpiryDate && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 w-24">
                      {t("startDate") || "Ngày bắt đầu"}:
                    </span>
                    <span className="font-medium">
                      {formatDate(profile?.planStartDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 w-24">
                      {t("expiryDate") || "Ngày hết hạn"}:
                    </span>
                    <span className="font-medium">
                      {formatDate(profile?.planExpiryDate)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {profile?.createdAt && (
          <div>
            <label className="block text-gray-600 dark:text-gray-300 text-sm mb-1">
              {t("createdAtHeader") || "Ngày tạo"}:
            </label>
            <div className="text-sm text-gray-400 dark:text-gray-400">
              {profile?.createdAt}
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="mb-4 text-red-600 dark:text-red-400 text-center font-semibold">
          {error}
        </div>
      )}
      {alert && (
        <div className="mb-4 text-green-600 dark:text-green-400 text-center font-semibold">
          {alert}
        </div>
      )}

      <div className="flex gap-4 justify-center mt-6">
        <button
          className="bg-indigo-500 text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-indigo-600 transition flex items-center justify-center gap-2"
          type="button"
          onClick={onBack}
        >
          {BackIcon && <BackIcon className="text-sm" />}
          {backText}
        </button>

        {isEdit ? (
          <>
            <button
              type="button"
              className="px-6 py-3 rounded-full font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
              onClick={onCancel}
              disabled={saving}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
              disabled={saving}
              onClick={() => onSave(form)}
            >
              {saving
                ? t("saving") || "Đang lưu..."
                : t("update") || "Cập nhật"}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="px-6 py-3 rounded-full font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
            onClick={onEdit}
          >
            {t("edit") || "Chỉnh sửa"}
          </button>
        )}
      </div>
    </div>
  );
}
