import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAnonymousUser, getCurrentUser } from "../services/anonymousService";
import UpgradeAnonymousModal from "../components/UpgradeAnonymousModal";
import {
  upgradeAnonymousAccount,
  clearAnonymousData,
} from "../services/anonymousService";

const severityColors = {
  MINIMAL:
    "text-green-600 border-green-400 bg-green-50 dark:text-green-300 dark:border-green-500 dark:bg-green-900",
  MILD: "text-yellow-600 border-yellow-400 bg-yellow-50 dark:text-yellow-200 dark:border-yellow-500 dark:bg-yellow-900",
  MODERATE:
    "text-orange-600 border-orange-400 bg-orange-50 dark:text-orange-300 dark:border-orange-500 dark:bg-orange-900",
  SEVERE:
    "text-red-600 border-red-400 bg-red-50 dark:text-red-300 dark:border-red-500 dark:bg-red-900",
};

// Sử dụng i18n cho mức độ

const StudentTestResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const result = location.state?.result;
  const testType = location.state?.testType;
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);

  // Đặt title cho trang
  React.useEffect(() => {
    document.title =
      i18n.language === "vi"
        ? "Kết quả bài test | MindMeter"
        : "Test Result | MindMeter";
  }, [i18n.language]);

  React.useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Xử lý nâng cấp tài khoản ẩn danh
  const handleUpgradeAccount = async (userId, upgradeData) => {
    try {
      const response = await upgradeAnonymousAccount(userId, upgradeData);

      // Xóa dữ liệu anonymous
      clearAnonymousData();

      // Lưu thông tin user mới
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Refresh trang để cập nhật thông tin user
      window.location.reload();
    } catch (error) {
      // Error upgrading account
      throw error;
    }
  };

  // Xử lý hiển thị modal nâng cấp
  const handleUpgradeClick = () => {
    setUpgradeModalOpen(true);
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-900">
        <div className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-none p-10 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {t("studentTestResultPage.notFound")}
          </h2>
          <button
            onClick={() => navigate("/student/test-history")}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
          >
            {t("studentTestResultPage.viewHistory")}
          </button>
        </div>
      </div>
    );
  }

  const severity = result.severityLevel || result.severity || "";
  const severityClass =
    severityColors[severity] || "text-gray-700 border-gray-300 bg-gray-50";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      {/* Form kết quả test - làm nhỏ hơn và căn giữa */}
      <div className="flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-xl p-6 w-full max-w-lg flex flex-col items-center animate-fade-in border border-gray-200 dark:border-gray-700">
          {/* Header với icon và title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("studentTestResultPage.resultTitle")}
            </h1>
          </div>

          {/* Content Grid - làm nhỏ hơn */}
          <div className="w-full grid grid-cols-1 gap-3 mb-4">
            {/* Test Type Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                  {t("studentTestResultPage.testType")}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {testType || "-"}
                </p>
              </div>
            </div>

            {/* Diagnosis Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                  {t("studentTestResultPage.diagnosis")}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {result.diagnosis}
                </p>
              </div>
            </div>

            {/* Score Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                  {t("studentTestResultPage.score")}
                </p>
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  {result.totalScore}
                </p>
              </div>
            </div>

            {/* Severity Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                  {t("studentTestResultPage.severity")}
                </p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-bold border ${severityClass}`}
                >
                  {t(`studentTestResultPage.severityVi.${severity}`) ||
                    severity}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation Section */}
          <div className="w-full mb-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                  {t("studentTestResultPage.recommendation")}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                  {result.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Test Date */}
          <div className="w-full mb-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                  {t("studentTestResultPage.testedAt")}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {result.testedAt
                    ? new Date(result.testedAt).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full flex-col sm:flex-row">
            {/* Nút Về trang chủ - luôn hiển thị */}
            <button
              className="flex-1 bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white py-2.5 border border-red-600 rounded-full font-semibold shadow hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm"
              onClick={() => navigate("/")}
            >
              {t("studentTestResultPage.backHome")}
            </button>

            {/* Nút bên phải - tùy theo loại user */}
            {currentUser && isAnonymousUser(currentUser) ? (
              // Anonymous user - nút Nâng cấp tài khoản
              <button
                className="flex-1 bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 py-2.5 border border-yellow-500 rounded-full font-semibold shadow hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm"
                onClick={handleUpgradeClick}
              >
                {t("anonymous.banner.upgrade")}
              </button>
            ) : (
              // Authenticated user - nút Xem lịch sử
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 border border-blue-600 rounded-full font-semibold shadow hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm"
                onClick={() => navigate("/student/test-history")}
              >
                {t("studentTestResultPage.viewHistory")}
              </button>
            )}
          </div>

          {/* Nút Liên hệ chuyên gia - chỉ hiển thị cho kết quả trầm cảm nhẹ trở lên */}
          {(severity === "MILD" ||
            severity === "MODERATE" ||
            severity === "SEVERE") && (
            <div className="w-full mt-4">
              <button
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base flex items-center justify-center gap-3 group"
                onClick={() =>
                  navigate("/consult-therapy", {
                    state: {
                      testResult: result,
                      testType: testType,
                    },
                  })
                }
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2l4 4z"
                  />
                </svg>
                {t("studentTestResultPage.contactExpert")}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                {t("studentTestResultPage.contactExpertDesc")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeAnonymousModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onUpgrade={handleUpgradeAccount}
        userId={currentUser?.id}
      />
    </div>
  );
};

export default StudentTestResultPage;
