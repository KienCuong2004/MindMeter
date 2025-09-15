import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaCheckCircle,
  FaRocket,
} from "react-icons/fa";

const UpgradeAnonymousModal = ({ isOpen, onClose, onUpgrade, userId }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form khi modal đóng
  const handleClose = useCallback(() => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    });
    setErrors({});
    setIsLoading(false);
    onClose();
  }, [onClose]);

  // Xử lý click outside để đóng modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    // Xử lý phím Escape để đóng modal
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
      // Ngăn scroll của body khi modal mở
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      // Khôi phục scroll của body khi modal đóng
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t("upgrade.errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("upgrade.errors.emailInvalid");
    }

    if (!formData.password) {
      newErrors.password = t("upgrade.errors.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("upgrade.errors.passwordLength");
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("upgrade.errors.confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("upgrade.errors.passwordMismatch");
    }

    if (!formData.firstName) {
      newErrors.firstName = t("upgrade.errors.firstNameRequired");
    }

    if (!formData.lastName) {
      newErrors.lastName = t("upgrade.errors.lastNameRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const upgradeData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      await onUpgrade(userId, upgradeData);
      handleClose();
    } catch (error) {
      setErrors({ general: t("upgrade.errors.upgradeFailed") });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20"></div>

      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-gray-900/50 max-w-lg w-full max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-700 animate-scale-in relative z-10"
      >
        {/* Header với gradient background - giảm padding */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute top-8 right-8 w-24 h-24 bg-white rounded-full opacity-50"></div>
            <div className="absolute bottom-0 left-1/2 w-20 h-20 bg-white rounded-full translate-x-10 translate-y-10"></div>
          </div>

          {/* Icon và title - giảm kích thước */}
          <div className="relative z-10">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
              <FaRocket className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {t("upgrade.modal.title")}
            </h2>
            <p className="text-white/90 text-base leading-relaxed max-w-md mx-auto">
              {t("upgrade.modal.description")}
            </p>
          </div>
        </div>

        {/* Form content - giảm padding và spacing với custom scrollbar */}
        <div
          className="p-6 pr-8 overflow-y-auto custom-scrollbar modal-scrollable-content"
          style={{ maxHeight: "calc(85vh - 200px)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 animate-pulse">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                      {errors.general}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Name fields - giảm gap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <FaUser className="h-4 w-4 text-emerald-500" />
                  {t("upgrade.form.firstName")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 ${
                    errors.firstName
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600"
                  }`}
                  placeholder={t("upgrade.form.firstNamePlaceholder")}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <FaUser className="h-4 w-4 text-emerald-500" />
                  {t("upgrade.form.lastName")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 ${
                    errors.lastName
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600"
                  }`}
                  placeholder={t("upgrade.form.lastNamePlaceholder")}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email field - giảm spacing */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <FaEnvelope className="h-4 w-4 text-emerald-500" />
                {t("upgrade.form.email")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 ${
                  errors.email
                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600"
                }`}
                placeholder={t("upgrade.form.emailPlaceholder")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone field - giảm spacing */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <FaPhone className="h-4 w-4 text-emerald-500" />
                {t("upgrade.form.phone")}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 bg-gray-50 dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600"
                placeholder={t("upgrade.form.phonePlaceholder")}
              />
            </div>

            {/* Password fields - giảm gap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <FaLock className="h-4 w-4 text-emerald-500" />
                  {t("upgrade.form.password")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 ${
                    errors.password
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600"
                  }`}
                  placeholder={t("upgrade.form.passwordPlaceholder")}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <FaLock className="h-4 w-4 text-emerald-500" />
                  {t("upgrade.form.confirmPassword")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 ${
                    errors.confirmPassword
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600"
                  }`}
                  placeholder={t("upgrade.form.confirmPasswordPlaceholder")}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Info box - giảm padding */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <FaCheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                    {t("upgrade.modal.info")}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons - giảm padding top và đảm bảo luôn hiển thị */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 pb-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
              >
                {t("upgrade.modal.cancel")}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-emerald-400 disabled:to-teal-400 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                    {t("upgrade.modal.upgrading")}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaRocket className="h-5 w-5" />
                    {t("upgrade.modal.upgrade")}
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpgradeAnonymousModal;
