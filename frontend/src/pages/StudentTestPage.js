import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { isAnonymousUser, getCurrentUser } from "../services/anonymousService";
import AnonymousBanner from "../components/AnonymousBanner";
import UpgradeAnonymousModal from "../components/UpgradeAnonymousModal";
import {
  upgradeAnonymousAccount,
  clearAnonymousData,
} from "../services/anonymousService";
import { authFetch } from "../authFetch";
import NotificationModal from "../components/NotificationModal";
import {
  getCurrentToken,
  isUsingAnonymousAccount,
} from "../services/anonymousService";
import { ThemeContext } from "../App";

const testTitleKeys = {
  "DASS-21": "studentTestPage.titleDASS21",
  "DASS-42": "studentTestPage.titleDASS42",
  RADS: "studentTestPage.titleRADS",
  BDI: "studentTestPage.titleBDI",
  EPDS: "studentTestPage.titleEPDS",
  SAS: "studentTestPage.titleSAS",
};

const StudentTestPage = () => {
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Sử dụng ThemeContext thay vì localStorage
  const { theme } = useContext(ThemeContext);

  // Lấy thông tin user hiện tại
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Xử lý hiển thị modal nâng cấp
  const handleUpgradeClick = () => {
    setUpgradeModalOpen(true);
  };

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

  // Lấy test type và ngôn ngữ từ URL
  const searchParams = new URLSearchParams(location.search);
  const testType = searchParams.get("type");
  const urlLanguage = searchParams.get("lang");

  // Nếu có ngôn ngữ trong URL, cập nhật i18n
  useEffect(() => {
    if (urlLanguage && urlLanguage !== i18n.language) {
      i18n.changeLanguage(urlLanguage);
    }
  }, [urlLanguage, i18n]);

  // Hàm fetch questions
  const fetchQuestions = async () => {
    const token = getCurrentToken();
    if (!token) {
      navigate("/home"); // Chuyển về trang home để chọn test ẩn danh hoặc đăng nhập
      return;
    }

    try {
      let url = "/api/depression-test/questions";
      if (testType) {
        url += `?type=${encodeURIComponent(testType)}`;
      }
      // Thêm ngôn ngữ hiện tại vào URL
      const currentLanguage = i18n.language;
      url += `${testType ? "&" : "?"}lang=${currentLanguage}`;

      const res = await authFetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(t("errors.cannotLoadQuestions"));
      const data = await res.json();

      setQuestions(data);
    } catch (err) {
      // Error fetching questions
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Effect để fetch questions khi component mount hoặc testType/ngôn ngữ thay đổi
  useEffect(() => {
    fetchQuestions();
  }, [navigate, testType, i18n.language]);

  // Effect để lắng nghe sự thay đổi ngôn ngữ từ Header
  useEffect(() => {
    // Đăng ký callback để lắng nghe sự thay đổi ngôn ngữ
    window.onLanguageChange = (newLanguage) => {
      // Fetch lại questions với ngôn ngữ mới
      fetchQuestions();
    };

    // Cleanup khi component unmount
    return () => {
      delete window.onLanguageChange;
    };
  }, []);

  useEffect(() => {
    document.title = t("studentTestPage.pageTitle") + " | MindMeter";
  }, [t]);

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      setNotificationModal({
        isOpen: true,
        type: "warning",
        title: t("common.notification"),
        message: t("errors.answerAllQuestions"),
        onConfirm: null,
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = getCurrentToken();
      const res = await authFetch("/api/depression-test/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, value]) => ({
            questionId: parseInt(questionId),
            answerValue: value,
          })),
          testType, // gửi thêm testType
          language: i18n.language, // gửi ngôn ngữ hiện tại
        }),
      });

      if (!res.ok) throw new Error(t("errors.submitResultFailed"));
      const result = await res.json();

      // Hiển thị kết quả
      navigate("/student/test-result", {
        state: {
          result,
          testType,
        },
      });

      // Reset form
      setAnswers({});
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    // Xóa dữ liệu anonymous nếu có
    if (isUsingAnonymousAccount()) {
      localStorage.removeItem("anonymousUser");
      localStorage.removeItem("anonymousToken");
    }
    navigate("/home");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading)
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex flex-col items-center justify-center py-20">
          {/* Loading Spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"
              style={{ animationDelay: "-0.5s" }}
            ></div>
          </div>

          {/* Loading Text */}
          <div className="mt-6 text-center">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("studentTestPage.loading")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t("pleaseWait")}
            </p>
          </div>

          {/* Loading Dots Animation */}
          <div className="flex space-x-2 mt-4">
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  if (error)
    return <div className="p-8 text-red-500">{t("studentTestPage.error")}</div>;

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isAnswered = answers[currentQuestion?.id] !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-900 py-8 px-4">
      {/* Anonymous Banner - chỉ hiển thị cho user ẩn danh */}
      {isAnonymousUser(currentUser) && (
        <AnonymousBanner onUpgradeClick={handleUpgradeClick} />
      )}

      <div className="max-w-4xl mx-auto mt-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {testTitleKeys[testType?.replace("-EN", "")]
              ? t(testTitleKeys[testType?.replace("-EN", "")])
              : testType}
          </h1>
          <div className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("studentTestPage.description")
              .split("\n\n")
              .map((paragraph, index) => {
                if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                  // Bold text
                  const text = paragraph.slice(2, -2);
                  return (
                    <p
                      key={index}
                      className="mt-3 font-bold text-red-600 dark:text-red-400"
                    >
                      {text}
                    </p>
                  );
                } else {
                  // Normal text
                  return (
                    <p key={index} className="mb-2 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                }
              })}
          </div>
        </div>

        {/* Test Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            {/* Loading Spinner */}
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"
                style={{ animationDelay: "-0.5s" }}
              ></div>
            </div>

            {/* Loading Text */}
            <div className="mt-4 text-center">
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                {t("studentTestPage.loading")}
              </p>
            </div>

            {/* Loading Dots Animation */}
            <div className="flex space-x-1 mt-3">
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-500 text-xl mb-4">
              <FaExclamationTriangle />
            </div>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={handleBackToHome}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
            >
              {t("studentTestPage.backToHome")}
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span>
                  {t("studentTestPage.question")} {currentIndex + 1} /{" "}
                  {totalQuestions}
                </span>
                <span>
                  {Math.round((answeredCount / totalQuestions) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(answeredCount / totalQuestions) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Question */}
            {currentQuestion && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 leading-relaxed">
                  {(() => {
                    const currentLanguage = i18n.language;
                    if (currentLanguage === "en") {
                      return (
                        currentQuestion.questionTextEn ||
                        currentQuestion.questionText
                      );
                    } else {
                      return (
                        currentQuestion.questionTextVi ||
                        currentQuestion.questionText
                      );
                    }
                  })()}
                </h2>
                <div className="space-y-2">
                  {(() => {
                    // Lấy options dựa trên ngôn ngữ hiện tại
                    const currentLanguage = i18n.language;
                    let options;

                    if (currentLanguage === "en") {
                      // Ưu tiên optionsEn, fallback về options
                      options =
                        currentQuestion.optionsEn &&
                        currentQuestion.optionsEn.length > 0
                          ? currentQuestion.optionsEn
                          : currentQuestion.options;
                    } else {
                      // Ưu tiên optionsVi, fallback về options
                      options =
                        currentQuestion.optionsVi &&
                        currentQuestion.optionsVi.length > 0
                          ? currentQuestion.optionsVi
                          : currentQuestion.options;
                    }

                    return (
                      options &&
                      options.map((opt) => {
                        const checked =
                          answers[currentQuestion.id] === opt.optionValue;
                        return (
                          <label
                            key={opt.id}
                            className={`block rounded-full px-3 py-2 cursor-pointer border transition mb-1 ${
                              checked
                                ? "bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-400"
                                : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}`}
                              value={opt.optionValue}
                              checked={checked}
                              onChange={() =>
                                handleAnswer(
                                  currentQuestion.id,
                                  opt.optionValue
                                )
                              }
                              className="hidden"
                            />
                            <span className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                              {opt.optionText}
                            </span>
                          </label>
                        );
                      })
                    );
                  })()}
                </div>
              </div>
            )}
            {/* Nút điều hướng */}
            <div className="flex flex-wrap items-center mt-6 gap-3 justify-between">
              <div className="flex gap-3">
                <button
                  onClick={handleBackToHome}
                  className="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white px-3 py-2 border border-red-600 rounded-full flex items-center gap-2 text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  {t("studentTestPage.back")}
                </button>
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 px-4 py-2 border border-yellow-500 rounded-full font-semibold disabled:opacity-50 text-sm"
                >
                  {t("studentTestPage.prev")}
                </button>
              </div>
              <div>
                {currentIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentIndex((i) =>
                        Math.min(totalQuestions - 1, i + 1)
                      )
                    }
                    className={`px-4 py-2 rounded-full font-semibold transition-colors text-sm ${
                      isAnswered
                        ? "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60"
                    } border border-blue-600`}
                    disabled={!isAnswered}
                  >
                    {t("studentTestPage.next")}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || answeredCount !== totalQuestions}
                    className="bg-green-600 dark:bg-green-700 text-white px-6 py-2 border border-green-600 rounded-full font-semibold disabled:opacity-50 text-sm"
                  >
                    {submitting
                      ? t("studentTestPage.submitting")
                      : t("studentTestPage.finish")}
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("studentTestPage.answered", {
                answered: answeredCount,
                total: totalQuestions,
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeAnonymousModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onUpgrade={handleUpgradeAccount}
        userId={currentUser?.id}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={() =>
          setNotificationModal((prev) => ({ ...prev, isOpen: false }))
        }
        type={notificationModal.type}
        title={notificationModal.title}
        message={notificationModal.message}
        onConfirm={notificationModal.onConfirm}
      />
    </div>
  );
};

export default StudentTestPage;
