import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Thay đổi title của trang
  useEffect(() => {
    // Lưu title cũ
    const oldTitle = document.title;

    // Đặt title mới cho trang 404
    document.title = `404 - ${t("error.404.title")} | MindMeter`;

    // Khôi phục title cũ khi component unmount
    return () => {
      document.title = oldTitle;
    };
  }, [t]);

  const handleGoHome = () => {
    navigate("/home");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Error Image */}
        <div className="mb-8">
          <img
            src="/src/assets/images/Error.png"
            alt="404 Error"
            className="w-64 h-64 mx-auto object-contain"
          />
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {t("error.404.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {t("error.404.description")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoHome}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {t("error.404.goHome")}
          </button>
          <button
            onClick={handleGoBack}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {t("error.404.goBack")}
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            {t("error.404.helpTitle")}
          </h3>
          <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {t("error.404.help1")}
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {t("error.404.help2")}
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {t("error.404.help3")}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
