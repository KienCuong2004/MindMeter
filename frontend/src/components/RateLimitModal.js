import React, { useState, useEffect } from "react";
import { FaClock, FaExclamationTriangle } from "react-icons/fa";

const RateLimitModal = ({
  isOpen,
  onClose,
  retryAfterSeconds = 60, // Default 60 seconds
  title = "Vui lòng chờ",
  message = "Giới hạn tốc độ đã bị vượt quá. Vui lòng thử lại sau.",
}) => {
  const [timeLeft, setTimeLeft] = useState(retryAfterSeconds);

  useEffect(() => {
    if (!isOpen) return;

    // Reset timer when modal opens
    setTimeLeft(retryAfterSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(); // Auto close when timer reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, retryAfterSeconds, onClose]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-2 border-red-200 dark:border-red-700">
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
          <div className="flex justify-center mb-4">
            <FaExclamationTriangle className="w-12 h-12 text-red-500" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {message}
          </p>

          {/* Countdown Timer */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-6 border border-red-200 dark:border-red-600">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FaClock className="w-6 h-6 text-red-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Thời gian còn lại:
              </span>
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 font-mono">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* OK button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateLimitModal;
