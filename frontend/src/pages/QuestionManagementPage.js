import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileExcel, FaEdit, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { authFetch } from "../authFetch";

import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import DualLanguageQuestionModal from "../components/DualLanguageQuestionModal";
import { FaQuestionCircle } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

export default function QuestionManagementPage({
  handleLogout: propHandleLogout,
}) {
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [modalQuestion, setModalQuestion] = useState({
    id: null,
    questionText: "",
    questionTextEn: "",
    questionTextVi: "",
    weight: 1,
    isActive: true,
    category: "MOOD",
    order: 1,
    options: [
      { optionText: "", optionValue: 0, order: 1 },
      { optionText: "", optionValue: 1, order: 2 },
    ],
    optionsEn: [
      { optionText: "", optionValue: 0, order: 1 },
      { optionText: "", optionValue: 1, order: 2 },
    ],
    optionsVi: [
      { optionText: "", optionValue: 0, order: 1 },
      { optionText: "", optionValue: 1, order: 2 },
    ],
  });
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  // Hàm hiển thị câu hỏi theo ngôn ngữ
  const getQuestionTextByLanguage = (question) => {
    if (!question) return "";

    // Sử dụng questionTextEn hoặc questionTextVi dựa trên ngôn ngữ hiện tại
    if (i18n.language === "en") {
      return question.questionTextEn || question.questionText || "";
    } else {
      return question.questionTextVi || question.questionText || "";
    }
  };

  // Hàm helper để đếm câu hỏi tiếng Việt (không có suffix -EN)
  const getUniqueQuestionsCount = (questionsList) => {
    return questionsList.filter((q) => {
      const testKey = q.testKey || q.category;
      return !testKey.endsWith("-EN");
    }).length;
  };

  // Hàm tạo màu sắc khác nhau cho mỗi category
  const getCategoryColor = (categoryValue) => {
    const colors = {
      "DASS-21":
        "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500",
      "DASS-42":
        "bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500",
      BDI: "bg-purple-600 border-purple-600 dark:bg-purple-500 dark:border-purple-500",
      RADS: "bg-orange-600 border-orange-600 dark:bg-orange-500 dark:border-orange-500",
      EPDS: "bg-pink-600 border-pink-600 dark:bg-pink-500 dark:border-pink-500",
      SAS: "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500",
      all: "bg-gray-600 border-gray-600 dark:bg-gray-500 dark:border-gray-500",
    };
    return (
      colors[categoryValue] ||
      "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
    );
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Lấy thông tin user từ localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Kiểm tra role để đảm bảo chỉ admin mới có thể truy cập
        if (parsedUser.role !== "ADMIN") {
          navigate("/admin/dashboard", { replace: true });
        }
      } catch (e) {
        // Error parsing user data
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Lấy danh sách câu hỏi
  const fetchQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch("/api/admin/questions");
      if (!res.ok) throw new Error(t("errorFetchQuestions"));
      const data = await res.json();

      // Validate và deduplicate data
      const questionsData = data.questions || data;
      // Raw questions data loaded

      const validQuestions = questionsData
        .filter((q) => q && q.id != null) // Lọc bỏ null/undefined
        .map((q, index) => ({
          ...q,
          id: q.id || `temp-${index}`, // Fallback ID nếu null
          order: q.order || index + 1, // Fallback order nếu null
        }));

      // Questions validated successfully
      setQuestions(validQuestions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách category động từ backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await authFetch("/api/admin/questions/categories");
        if (!res.ok) throw new Error(t("errorFetchCategories"));
        const data = await res.json();
        setCategoryOptions(
          data.map((cat, index) => ({
            value: cat,
            label: cat,
            key: `${cat}-${index}`,
          }))
        );
      } catch (err) {
        setCategoryOptions([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ message: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    document.title = t("questionManagement") + " | MindMeter";
  }, [t]);

  // Hàm loại bỏ dấu tiếng Việt
  function removeVietnameseTones(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  // Tìm kiếm và lọc theo category
  const filteredQuestions = questions
    .filter((q) => {
      // Lọc theo search text
      const matchesSearch = removeVietnameseTones(
        q.questionText.toLowerCase()
      ).includes(removeVietnameseTones(search.toLowerCase()));

      // Lọc theo category (nếu không phải "all")
      let matchesCategory = true;
      if (selectedCategory !== "all") {
        const testKey = q.testKey || q.category;
        const baseTestKey = testKey.endsWith("-EN")
          ? testKey.substring(0, testKey.length - 3)
          : testKey;
        matchesCategory = baseTestKey === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (a.id || 0) - (b.id || 0));

  // Chỉ hiển thị câu hỏi tiếng Việt (không có suffix -EN)
  const uniqueFilteredQuestions = filteredQuestions.filter((q) => {
    const testKey = q.testKey || q.category;
    return !testKey.endsWith("-EN");
  });

  // Reset page khi search hoặc filter thay đổi
  useEffect(() => {
    setCurrentPage(0);
  }, [search, selectedCategory]);

  // Phân trang
  const paginatedQuestions = uniqueFilteredQuestions.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  const totalPages = Math.ceil(uniqueFilteredQuestions.length / pageSize);

  // Thêm/sửa câu hỏi
  const handleSave = async () => {
    setSaving(true);
    setAlert({ message: "", type: "" });
    try {
      const token = localStorage.getItem("token");
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit
        ? `/api/admin/questions/${modalQuestion.id}`
        : "/api/admin/questions";

      const requestData = {
        questionText:
          modalQuestion.questionTextEn || modalQuestion.questionText, // Ưu tiên tiếng Anh
        questionTextEn: modalQuestion.questionTextEn,
        questionTextVi: modalQuestion.questionTextVi,
        weight: modalQuestion.weight,
        isActive: modalQuestion.isActive,
        category: modalQuestion.category,
        order: Number(modalQuestion.order),
        options:
          modalQuestion.optionsEn?.filter(
            (option) => option.optionText.trim() !== ""
          ) ||
          modalQuestion.options.filter(
            (option) => option.optionText.trim() !== ""
          ),
        optionsEn: modalQuestion.optionsEn?.filter(
          (option) => option.optionText.trim() !== ""
        ),
        optionsVi: modalQuestion.optionsVi?.filter(
          (option) => option.optionText.trim() !== ""
        ),
      };

      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(requestData),
      });
      if (!res.ok)
        throw new Error(isEdit ? "Cập nhật thất bại" : "Thêm thất bại");
      // API call successful, closing modal
      setShowModal(false);
      setModalQuestion({
        id: null,
        questionText: "",
        questionTextEn: "",
        questionTextVi: "",
        weight: 1,
        isActive: true,
        category: "MOOD",
        order: 1,
        options: [
          { optionText: "", optionValue: 0, order: 1 },
          { optionText: "", optionValue: 1, order: 2 },
        ],
        optionsEn: [
          { optionText: "", optionValue: 0, order: 1 },
          { optionText: "", optionValue: 1, order: 2 },
        ],
        optionsVi: [
          { optionText: "", optionValue: 0, order: 1 },
          { optionText: "", optionValue: 1, order: 2 },
        ],
      });
      setAlert({ message: t("updateQuestionSuccess"), type: "success" });
      fetchQuestions();
    } catch (err) {
      setAlert({ message: t("updateQuestionFailed"), type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // Xóa câu hỏi
  const handleDelete = async (id) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  // Hàm xóa xác nhận
  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    setDeletingId(deleteId);
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch(`/api/admin/questions/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      setAlert({ message: t("deleteQuestionSuccess"), type: "success" });
      setConfirmDelete(false);
      setDeleteId(null);
      fetchQuestions();
    } catch (err) {
      setAlert({ message: t("deleteQuestionFailed"), type: "danger" });
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  // Bật/tắt trạng thái
  const handleToggle = async (id) => {
    setSaving(true);
    setAlert({ message: "", type: "" });
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch(`/api/admin/questions/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error(t("updateStatusFailed"));
      setAlert({ message: t("updateStatusSuccess"), type: "success" });
      fetchQuestions();
    } catch (err) {
      setAlert({ message: err.message, type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // Simulate async operation for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      const dataToExport = uniqueFilteredQuestions.map((q, index) => [
        q.id,
        q.questionText,
        q.weight,
        q.category,
        q.order,
        q.isActive ? t("using") : t("inactiveStatus"),
      ]);
      const header = [
        t("common.questionId"),
        t("common.questionContent"),
        t("common.weight"),
        t("common.questionType"),
        t("common.order"),
        t("status"),
      ];
      const ws = XLSX.utils.aoa_to_sheet([header, ...dataToExport]);
      ws["!cols"] = [
        { wch: 10 }, // ID
        { wch: 60 }, // Content
        { wch: 10 }, // Weight
        { wch: 18 }, // Type
        { wch: 10 }, // Order
        { wch: 16 }, // {t("status")}
      ];
      ws["!freeze"] = { xSplit: 0, ySplit: 1 };
      ws["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: header.length - 1, r: uniqueFilteredQuestions.length },
        }),
      };
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t("questions") || "Questions");
      XLSX.writeFile(wb, t("questionList") || "question_list.xlsx");
    } finally {
      setExporting(false);
    }
  };

  // Hàm sinh mảng phân trang rút gọn
  function getPagination(current, total) {
    const delta = 1;
    const range = [];
    for (
      let i = Math.max(0, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }
    if (range[0] > 1) range.unshift("...");
    if (range[0] !== 0) range.unshift(0);
    if (range[range.length - 1] < total - 2) range.push("...");
    if (range[range.length - 1] !== total - 1) range.push(total - 1);
    return range;
  }

  const handleLogout =
    propHandleLogout ||
    (() => {
      localStorage.removeItem("token");
      navigate("/login");
    });

  return (
    <div
      key="question-management-page"
      className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900"
    >
      <DashboardHeader
        key="question-management-header"
        logoIcon={
          <FaQuestionCircle
            key="question-management-logo"
            className="text-indigo-500 dark:text-indigo-300 text-3xl"
          />
        }
        logoText={
          <span
            key="question-management-title"
            className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 dark:from-indigo-300 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide"
          >
            {t("questionManagement")}
          </span>
        }
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={() => navigate("/admin/profile")}
        onLogout={handleLogout}
      />
      <div
        key="main-content-container"
        className="flex-grow flex flex-col py-10 overflow-x-hidden pt-24"
      >
        <div
          key="questions-page-content"
          className="w-full dark:bg-gray-900 min-h-screen"
        >
          <h1
            key="questions-page-title"
            className="text-2xl font-bold mb-6 text-blue-600 dark:text-blue-300 text-center"
          >
            {t("questionManagement")}
          </h1>
          <div className="flex flex-wrap gap-4 mb-6 items-center justify-center">
            <button
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[140px] h-[48px] dark:bg-red-700 dark:hover:bg-red-800"
              onClick={() => navigate("/admin/dashboard")}
            >
              <svg
                className="text-lg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 19L8 12L15 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("back")}
            </button>
            <div className="flex items-center justify-center min-w-[300px]">
              <input
                type="text"
                className="w-full max-w-2xl px-6 py-3 rounded-full shadow border outline-none focus:ring-2 focus:ring-blue-400 text-base dark:bg-gray-800 dark:text-white dark:border-gray-700"
                placeholder={t("searchQuestion")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button
                key="add-question-btn"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[140px] h-[48px] dark:bg-blue-700 dark:hover:bg-blue-800"
                onClick={() => {
                  setShowModal(true);
                  setIsEdit(false);
                  setModalQuestion({
                    id: null,
                    questionText: "",
                    questionTextEn: "",
                    questionTextVi: "",
                    weight: 1,
                    isActive: true,
                    category: categoryOptions[0]?.value || "",
                    order: 1,
                    options: [
                      { optionText: "", optionValue: 0, order: 1 },
                      { optionText: "", optionValue: 1, order: 2 },
                    ],
                    optionsEn: [
                      { optionText: "", optionValue: 0, order: 1 },
                      { optionText: "", optionValue: 1, order: 2 },
                    ],
                    optionsVi: [
                      { optionText: "", optionValue: 0, order: 1 },
                      { optionText: "", optionValue: 1, order: 2 },
                    ],
                  });
                }}
              >
                + {t("addQuestion")}
              </button>
              <button
                key="export-excel-btn"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[140px] h-[48px] dark:bg-green-700 dark:hover:bg-green-800"
                onClick={handleExportExcel}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <div
                      key="export-spinner"
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></div>
                    {t("exporting")}
                  </>
                ) : (
                  <>
                    <FaFileExcel key="export-excel-icon" className="text-lg" />
                    {t("exportExcel")}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filter tabs cho các loại câu hỏi */}
          <div
            key="category-filter-tabs"
            className="flex flex-wrap gap-4 mb-6 justify-center"
          >
            {/* Tab "Tất cả" */}
            <button
              key="filter-all"
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm border-2 ${
                selectedCategory === "all"
                  ? `${getCategoryColor("all")} text-white`
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              }`}
            >
              {t("all")} ({getUniqueQuestionsCount(questions)})
            </button>

            {/* Tab cho từng category */}
            {categoryOptions.map((category) => (
              <button
                key={`filter-${category.value}`}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm border-2 ${
                  selectedCategory === category.value
                    ? `${getCategoryColor(category.value)} text-white`
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                {category.label} (
                {getUniqueQuestionsCount(
                  questions.filter((q) => {
                    const testKey = q.testKey || q.category;
                    // Lọc theo testKey, loại bỏ suffix -EN để so sánh
                    const baseTestKey = testKey.endsWith("-EN")
                      ? testKey.substring(0, testKey.length - 3)
                      : testKey;
                    return baseTestKey === category.value;
                  })
                )}
                )
              </button>
            ))}

            {/* Clear filter button (chỉ hiển thị khi có filter active) */}
            {selectedCategory !== "all" && (
              <button
                key="clear-filter"
                onClick={() => setSelectedCategory("all")}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
              >
                <span>✕</span>
                {t("clearFilter")}
              </button>
            )}
          </div>

          {alert.message && (
            <div
              key={`alert-${alert.type}-${Date.now()}`}
              className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-xl shadow-lg text-base font-semibold transition-all duration-300
          ${
            alert.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
            >
              {alert.message}
            </div>
          )}
          {error && (
            <div
              key="error-message"
              className="mb-4 p-3 bg-red-100 text-red-700 rounded"
            >
              {error}
            </div>
          )}
          {loading ? (
            <div
              key="loading-container"
              className="flex flex-col items-center justify-center py-20"
            >
              {/* Loading Spinner */}
              <div key="loading-spinner-container" className="relative">
                <div
                  key="loading-spinner-1"
                  className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
                ></div>
                <div
                  key="loading-spinner-2"
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"
                  style={{ animationDelay: "-0.5s" }}
                ></div>
              </div>

              {/* Loading Text */}
              <div key="loading-text-container" className="mt-6 text-center">
                <h3
                  key="loading-title"
                  className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t("loadingQuestions")}
                </h3>
                <p
                  key="loading-subtitle"
                  className="text-gray-500 dark:text-gray-400"
                >
                  {t("pleaseWait")}
                </p>
              </div>

              {/* Loading Dots Animation */}
              <div key="loading-dots-container" className="flex space-x-2 mt-4">
                <div
                  key="loading-dot-1"
                  className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  key="loading-dot-2"
                  className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  key="loading-dot-3"
                  className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          ) : (
            <div
              key="questions-table-container"
              className="overflow-x-auto w-full flex justify-center"
            >
              <table
                key="questions-table"
                className="min-w-full max-w-4xl mx-auto divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl border border-blue-200 dark:border-gray-700"
              >
                <thead
                  key="questions-table-header"
                  className="bg-blue-50 dark:bg-gray-900"
                >
                  <tr key="questions-table-header-row">
                    <th
                      key="header-question-code"
                      className="px-2 py-3 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700"
                    >
                      {t("questionCode")}
                    </th>
                    <th
                      key="header-question-content"
                      className="px-3 py-3 text-left text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700"
                    >
                      {t("questionContent")}
                    </th>
                    <th
                      key="header-weight"
                      className="px-2 py-3 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700"
                    >
                      {t("weight")}
                    </th>
                    <th
                      key="header-question-type"
                      className="px-2 py-3 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700"
                    >
                      {t("questionType")}
                    </th>
                    <th
                      key="header-order"
                      className="px-2 py-3 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700"
                    >
                      {t("order")}
                    </th>
                    <th
                      key="header-status"
                      className="px-2 py-3 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700"
                    >
                      {t("status")}
                    </th>
                    <th
                      key="header-action"
                      className="px-2 py-3 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700"
                    >
                      {t("action")}
                    </th>
                  </tr>
                </thead>
                <tbody
                  key="questions-table-body"
                  className="divide-y divide-gray-100 dark:divide-gray-700"
                >
                  {paginatedQuestions.map((q, index) => (
                    <tr
                      key={`${q.id}-${index}`}
                      className="bg-white even:bg-blue-50 dark:bg-gray-800 dark:even:bg-gray-900"
                    >
                      <td
                        key={`cell-id-${q.id}`}
                        className="px-2 py-3 text-center font-semibold text-blue-700 dark:text-blue-200"
                      >
                        {q.id}
                      </td>
                      <td
                        key={`cell-content-${q.id}`}
                        className="px-3 py-3 text-gray-800 dark:text-white break-words whitespace-pre-line"
                      >
                        {getQuestionTextByLanguage(q)}
                      </td>
                      <td
                        key={`cell-weight-${q.id}`}
                        className="px-2 py-3 text-center font-bold text-indigo-600 dark:text-indigo-200"
                      >
                        {q.weight}
                      </td>
                      <td
                        key={`cell-category-${q.id}`}
                        className="px-2 py-3 text-center"
                      >
                        <span
                          key={`category-${q.category}-${q.id}`}
                          className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700"
                        >
                          {categoryOptions.find((opt) => {
                            const testKey = q.testKey || q.category;
                            const baseTestKey = testKey.endsWith("-EN")
                              ? testKey.substring(0, testKey.length - 3)
                              : testKey;
                            return opt.value === baseTestKey;
                          })?.label || ""}
                        </span>
                      </td>
                      <td
                        key={`cell-order-${q.id}`}
                        className="px-2 py-3 text-center font-semibold text-blue-600 dark:text-blue-200"
                      >
                        {q.order}
                      </td>
                      <td
                        key={`cell-status-${q.id}`}
                        className="px-2 py-3 text-center"
                      >
                        <span
                          key={`status-${q.id}-${q.isActive}`}
                          className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-sm font-bold text-center whitespace-nowrap shadow-sm border
                      ${
                        q.isActive
                          ? "bg-green-100 dark:bg-green-800/60 text-green-700 dark:text-green-100 border-green-200 dark:border-gray-700"
                          : "bg-gray-200 dark:bg-gray-700/60 text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      }
                    `}
                        >
                          {q.isActive ? t("using") : t("inactiveStatus")}
                        </span>
                      </td>
                      <td
                        key={`cell-action-${q.id}`}
                        className="px-2 py-3 text-center h-full align-middle"
                      >
                        <div
                          key={`action-buttons-${q.id}`}
                          className="flex gap-2 justify-center items-center h-full"
                        >
                          <button
                            key={`edit-${q.id}`}
                            className="bg-yellow-400 text-white px-6 py-2 rounded-full hover:bg-yellow-500 transition-colors flex items-center gap-2 shadow font-semibold text-base min-w-[80px]"
                            onClick={() => {
                              setShowModal(true);
                              setIsEdit(true);
                              setModalQuestion({
                                ...q,
                                questionTextEn: q.questionTextEn || "",
                                questionTextVi: q.questionTextVi || "",
                                options:
                                  Array.isArray(q.options) &&
                                  q.options.length > 0
                                    ? q.options.map((opt, optIndex) => ({
                                        optionText:
                                          opt.optionText ||
                                          opt.content ||
                                          opt.option_text ||
                                          "",
                                        optionValue:
                                          opt.optionValue ??
                                          opt.value ??
                                          opt.option_value ??
                                          optIndex,
                                        order: opt.order ?? optIndex + 1,
                                      }))
                                    : [
                                        {
                                          optionText: "",
                                          optionValue: 0,
                                          order: 1,
                                        },
                                        {
                                          optionText: "",
                                          optionValue: 1,
                                          order: 2,
                                        },
                                      ],
                                optionsEn:
                                  Array.isArray(q.optionsEn) &&
                                  q.optionsEn.length > 0
                                    ? q.optionsEn.map((opt, optIndex) => ({
                                        optionText: opt.optionText || "",
                                        optionValue:
                                          opt.optionValue ?? optIndex,
                                        order: opt.order ?? optIndex + 1,
                                      }))
                                    : [
                                        {
                                          optionText: "",
                                          optionValue: 0,
                                          order: 1,
                                        },
                                        {
                                          optionText: "",
                                          optionValue: 1,
                                          order: 2,
                                        },
                                      ],
                                optionsVi:
                                  Array.isArray(q.optionsVi) &&
                                  q.optionsVi.length > 0
                                    ? q.optionsVi.map((opt, optIndex) => ({
                                        optionText: opt.optionText || "",
                                        optionValue:
                                          opt.optionValue ?? optIndex,
                                        order: opt.order ?? optIndex + 1,
                                      }))
                                    : [
                                        {
                                          optionText: "",
                                          optionValue: 0,
                                          order: 1,
                                        },
                                        {
                                          optionText: "",
                                          optionValue: 1,
                                          order: 2,
                                        },
                                      ],
                              });
                            }}
                          >
                            <FaEdit
                              key={`edit-icon-${q.id}`}
                              className="w-5 h-5 mr-1"
                            />
                            {t("edit")}
                          </button>
                          <button
                            key={`delete-${q.id}`}
                            className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors flex items-center gap-2 shadow font-semibold text-base min-w-[80px]"
                            onClick={() => {
                              handleDelete(q.id);
                            }}
                            disabled={deletingId === q.id}
                          >
                            {deletingId === q.id ? (
                              <>
                                <div
                                  key={`spinner-${q.id}`}
                                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                                ></div>
                                {t("deleting")}
                              </>
                            ) : (
                              <>
                                <FaTrash
                                  key={`trash-icon-${q.id}`}
                                  className="w-5 h-5 mr-1"
                                />
                                {t("delete")}
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination: luôn hiển thị, kể cả khi chỉ có 1 trang */}
          <div
            key="pagination-container"
            className="flex gap-2 justify-center mt-8"
          >
            {/* Nút prev */}
            <button
              key="pagination-prev-btn"
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow transition
            ${
              currentPage === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-400 dark:bg-gray-800 dark:text-blue-300 dark:border-gray-600"
            }
          `}
              onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label={t("previousPage")}
            >
              <svg
                key="prev-arrow-icon"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 15l-5-5 5-5" />
              </svg>
            </button>
            {/* Số trang rút gọn */}
            {getPagination(currentPage, totalPages).map((page, idx) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-10 h-10 flex items-center justify-center text-xl text-gray-400 select-none"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow transition
                  ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900 border border-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  }
                `}
                  onClick={() => setCurrentPage(page)}
                >
                  {page + 1}
                </button>
              )
            )}
            {/* Nút next */}
            <button
              key="pagination-next-btn"
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow transition
            ${
              currentPage === totalPages - 1 || totalPages === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-400 dark:bg-gray-800 dark:text-blue-300 dark:border-gray-600"
            }
          `}
              onClick={() =>
                currentPage < totalPages - 1 && setCurrentPage(currentPage + 1)
              }
              disabled={currentPage === totalPages - 1 || totalPages === 0}
              aria-label={t("nextPage")}
            >
              <svg
                key="next-arrow-icon"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7 5l5 5-5 5" />
              </svg>
            </button>
          </div>
          {/* Dual Language Question Modal */}
          <DualLanguageQuestionModal
            key={`question-modal-${isEdit ? "edit" : "add"}-${
              showModal ? "open" : "closed"
            }`}
            showModal={showModal}
            onClose={() => {
              // Modal onClose called, setting showModal to false
              setShowModal(false);
            }}
            modalQuestion={modalQuestion}
            setModalQuestion={setModalQuestion}
            onSave={handleSave}
            isEdit={isEdit}
          />
          {/* Modal xác nhận xóa câu hỏi */}
          {confirmDelete && (
            <div
              key="delete-confirm-modal"
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
            >
              <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-sm text-center">
                <h2 className="text-xl font-bold mb-4">
                  {t("confirmDeleteQuestion")}
                </h2>
                <p>{t("confirmDeleteQuestionMessage")}</p>
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    key="delete-cancel-btn"
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    key="delete-confirm-btn"
                    className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2 min-w-[100px]"
                    onClick={handleDeleteConfirmed}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <div
                          key="delete-confirm-spinner"
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                        ></div>
                        {t("deleting")}
                      </>
                    ) : (
                      t("delete")
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <FooterSection key="question-management-footer" />
    </div>
  );
}
