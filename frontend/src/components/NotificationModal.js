import React, { useEffect } from "react";
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaTimesCircle,
} from "react-icons/fa";

const NotificationModal = ({
  isOpen,
  onClose,
  type = "info",
  title,
  message,
  confirmText = "OK",
  showConfirmButton = true,
  onConfirm,
}) => {
  // Xử lý phím ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll khi modal mở
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore body scroll khi modal đóng
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="w-12 h-12 text-green-500" />;
      case "error":
        return <FaTimesCircle className="w-12 h-12 text-red-500" />;
      case "warning":
        return <FaExclamationTriangle className="w-12 h-12 text-yellow-500" />;
      default:
        return <FaInfoCircle className="w-12 h-12 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20";
      case "error":
        return "bg-red-50 dark:bg-red-900/20";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "bg-blue-50 dark:bg-blue-900/20";
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-green-200 dark:border-green-700";
      case "error":
        return "border-red-200 dark:border-red-700";
      case "warning":
        return "border-yellow-200 dark:border-yellow-700";
      default:
        return "border-blue-200 dark:border-blue-700";
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-2 ${getBorderColor()} ${getBgColor()}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">{getIcon()}</div>

          {/* Title */}
          {title && (
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {title}
            </h3>
          )}

          {/* Message */}
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Confirm button */}
          {showConfirmButton && (
            <button
              onClick={handleConfirm}
              className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                type === "success"
                  ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                  : type === "error"
                  ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                  : type === "warning"
                  ? "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              }`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
