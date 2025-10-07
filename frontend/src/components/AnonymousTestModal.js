import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const AnonymousTestModal = ({
  isOpen,
  onClose,
  onAnonymousStart,
  onLoginStart,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleAnonymousStart = async () => {
    setIsLoading(true);
    try {
      await onAnonymousStart();
    } catch (error) {
      // Error creating anonymous account
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginStart = () => {
    onLoginStart();
    onClose();
  };

  // Handle click outside to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden"; // Prevent body scroll
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 ease-out scale-100 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
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

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t("anonymous.modal.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t("anonymous.modal.description")}
          </p>
        </div>

        <div className="space-y-4">
          {/* Anonymous Test Option */}
          <div className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shadow-md">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {t("anonymous.modal.anonymous.title")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {t("anonymous.modal.anonymous.description")}
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 mt-3 space-y-1">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                    {t("anonymous.modal.anonymous.benefit1")}
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                    {t("anonymous.modal.anonymous.benefit2")}
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                    {t("anonymous.modal.anonymous.benefit3")}
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={handleAnonymousStart}
              disabled={isLoading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:shadow-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  {t("anonymous.modal.creating")}
                </div>
              ) : (
                t("anonymous.modal.anonymous.button")
              )}
            </button>
          </div>

          {/* Login Option */}
          <div className="border-2 border-green-200 dark:border-green-700 rounded-xl p-5 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center shadow-md">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {t("anonymous.modal.login.title")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {t("anonymous.modal.login.description")}
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 mt-3 space-y-1">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                    {t("anonymous.modal.login.benefit1")}
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                    {t("anonymous.modal.login.benefit2")}
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                    {t("anonymous.modal.login.benefit3")}
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={handleLoginStart}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              {t("anonymous.modal.login.button")}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            {t("anonymous.modal.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnonymousTestModal;
