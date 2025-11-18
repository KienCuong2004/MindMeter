import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/anonymousService";

const NotFoundPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Helper function để lấy translation với fallback
  // Ưu tiên key1 (error404 cho vi), sau đó key2 (error.404 cho en)
  const getTranslation = (key1, key2, fallback) => {
    // Thử key1 trước (error404 - format trong file vi)
    const val1 = t(key1);
    // Nếu giá trị khác key (tức là đã tìm thấy translation) và không rỗng
    if (val1 && val1 !== key1 && val1.trim() !== "") {
      return val1;
    }
    // Thử key2 (error.404 - format trong file en)
    const val2 = t(key2);
    if (val2 && val2 !== key2 && val2.trim() !== "") {
      return val2;
    }
    // Fallback về giá trị mặc định
    return fallback;
  };

  // Thay đổi title của trang
  useEffect(() => {
    // Lưu title cũ
    const oldTitle = document.title;

    // Đặt title mới cho trang 404
    const title = getTranslation(
      "error404.title",
      "error.404.title",
      "Page Not Found"
    );
    document.title = `404 - ${title} | MindMeter`;

    // Khôi phục title cũ khi component unmount
    return () => {
      document.title = oldTitle;
    };
  }, [t]);

  const handleGoHome = () => {
    // Điều hướng về trang dashboard phù hợp với role
    if (user?.role === "ADMIN") {
      navigate("/admin/dashboard");
    } else if (user?.role === "EXPERT") {
      navigate("/expert/dashboard");
    } else {
      navigate("/home");
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Lấy text phù hợp cho nút dựa trên role
  const getButtonText = () => {
    if (user?.role === "ADMIN" || user?.role === "EXPERT") {
      return getTranslation(
        "error404.goToDashboard",
        "error.404.goToDashboard",
        "Go to Dashboard"
      );
    }
    return getTranslation("error404.goHome", "error.404.goHome", "Go Home");
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
            {getTranslation(
              "error404.title",
              "error.404.title",
              "Page Not Found"
            )}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {getTranslation(
              "error404.description",
              "error.404.description",
              "Sorry, the page you are looking for does not exist or has been moved."
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoHome}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {getButtonText()}
          </button>
          <button
            onClick={handleGoBack}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {getTranslation("error404.goBack", "error.404.goBack", "Go Back")}
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            {getTranslation(
              "error404.helpTitle",
              "error.404.helpTitle",
              "You can try:"
            )}
          </h3>
          <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {getTranslation(
                "error404.help1",
                "error.404.help1",
                "Check the URL again"
              )}
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {getTranslation(
                "error404.help2",
                "error.404.help2",
                "Use the navigation menu"
              )}
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {getTranslation(
                "error404.help3",
                "error.404.help3",
                "Contact support if the problem persists"
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
