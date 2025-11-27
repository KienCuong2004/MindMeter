import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaRocket, FaTimes } from "react-icons/fa";

const AnonymousBanner = ({ onUpgradeClick }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);

  // Kiểm tra trạng thái dismiss từ localStorage khi component mount
  useEffect(() => {
    const checkDismissStatus = () => {
      const dismissedData = localStorage.getItem("anonymousBannerDismissed");
      if (dismissedData) {
        try {
          const { timestamp } = JSON.parse(dismissedData);
          const now = new Date();
          const dismissedDate = new Date(timestamp);

          // Kiểm tra xem đã qua ngày hôm sau chưa (24 giờ)
          const timeDiff = now.getTime() - dismissedDate.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            // Chưa đủ 24 giờ, ẩn banner
            setIsVisible(false);
          } else {
            // Đã qua 24 giờ, hiển thị lại banner và xóa localStorage
            localStorage.removeItem("anonymousBannerDismissed");
            setIsVisible(true);
          }
        } catch (error) {
          // Nếu có lỗi parse JSON, xóa localStorage cũ và hiển thị banner
          localStorage.removeItem("anonymousBannerDismissed");
          setIsVisible(true);
        }
      }
    };

    checkDismissStatus();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Lưu timestamp khi dismiss vào localStorage
    const dismissData = {
      dismissed: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(
      "anonymousBannerDismissed",
      JSON.stringify(dismissData)
    );
  };

  const handleUpgrade = () => {
    onUpgradeClick();
  };

  // Kiểm tra xem banner có hiển thị không
  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-b border-blue-200 dark:border-blue-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon thông tin với background tròn */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Nội dung thông báo */}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  {t("anonymous.banner.title")}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300 leading-relaxed max-w-2xl">
                  {t("anonymous.banner.description")}
                </p>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex items-center space-x-3">
              {/* Nút nâng cấp với styling đẹp */}
              <button
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <FaRocket className="h-4 w-4" />
                <span>{t("anonymous.banner.upgrade")}</span>
              </button>

              {/* Nút đóng với styling đẹp */}
              <button
                onClick={handleDismiss}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-2"
              >
                <FaTimes className="h-4 w-4" />
                <span>{t("anonymous.banner.dismiss")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnonymousBanner;
