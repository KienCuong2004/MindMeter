import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaSearch,
  FaTrash,
  FaEye,
  FaFileExcel,
  FaFileWord,
  FaBrain,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import TestDetailModal from "../components/TestDetailModal";
import { authFetch } from "../authFetch";
import DashboardHeader from "../components/DashboardHeader";
import NotificationModal from "../components/NotificationModal";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";

function exportToExcel(data, t) {
  const header = [
    t("emailHeader"),
    t("studentNameHeader"),
    t("testedAtHeader"),
    t("severityHeader"),
    t("scoreHeader"),
    t("diagnosisHeader"),
  ];
  const rows = data.map((r) => [
    r.email,
    r.studentName,
    r.testedAt ? new Date(r.testedAt).toLocaleString("vi-VN") : "",
    t(r.severityLevel?.toLowerCase() || ""),
    r.totalScore,
    t(`studentTestResultPage.diagnosisKeys.${r.diagnosis}`) || r.diagnosis,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 10 },
    { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SurveyResults");
  XLSX.writeFile(wb, "survey_results.xlsx");
}

function exportToWord(data, t) {
  let html = `<table border='1' cellpadding='5' style='border-collapse:collapse;'>`;
  html += `<tr>`;
  html += `<th>${t("emailHeader")}</th>`;
  html += `<th>${t("studentNameHeader")}</th>`;
  html += `<th>${t("testedAtHeader")}</th>`;
  html += `<th>${t("severityHeader")}</th>`;
  html += `<th>${t("scoreHeader")}</th>`;
  html += `<th>${t("diagnosisHeader")}</th>`;
  html += `</tr>`;
  data.forEach((r) => {
    html += `<tr>`;
    html += `<td>${r.email || ""}</td>`;
    html += `<td>${r.studentName || ""}</td>`;
    html += `<td>${
      r.testedAt ? new Date(r.testedAt).toLocaleString("vi-VN") : ""
    }</td>`;
    html += `<td>${t(r.severityLevel?.toLowerCase() || "")}</td>`;
    html += `<td>${r.totalScore || ""}</td>`;
    html += `<td>${
      t(`studentTestResultPage.diagnosisKeys.${r.diagnosis}`) ||
      r.diagnosis ||
      ""
    }</td>`;
    html += `</tr>`;
  });
  html += `</table>`;
  const blob = new Blob(
    [`<html><head><meta charset='utf-8'></head><body>${html}</body></html>`],
    { type: "application/msword" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "survey_results.doc";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

function getPagination(current, total) {
  const delta = 1; // số trang lân cận
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

function Pagination({ currentPage, totalPages, setCurrentPage, t }) {
  if (totalPages <= 1) return null;
  const pages = getPagination(currentPage, totalPages);
  return (
    <div className="flex gap-2 justify-center mt-8">
      {/* Nút prev */}
      <button
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow transition
          ${
            currentPage === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
              : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-400 dark:bg-gray-800 dark:text-blue-300 dark:border-gray-600"
          }
        `}
        onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
        disabled={currentPage === 0}
        aria-label={t("pagination.previousPage")}
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 15l-5-5 5-5" />
        </svg>
      </button>
      {/* Số trang với dấu ... */}
      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={idx}
            className="w-10 h-10 flex items-center justify-center text-gray-400"
          >
            ...
          </span>
        ) : (
          <button
            key={idx}
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
        aria-label={t("pagination.nextPage")}
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 5l5 5-5 5" />
        </svg>
      </button>
    </div>
  );
}

const SEVERITY_OPTIONS = [
  { value: "ALL", labelKey: "allLevels" },
  { value: "SEVERE", labelKey: "severe" },
  { value: "MODERATE", labelKey: "moderate" },
  { value: "MILD", labelKey: "mild" },
  { value: "MINIMAL", labelKey: "minimal" },
];

export default function AdminTestResultsPage() {
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [viewTest, setViewTest] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;
  const { theme, toggleTheme } = useTheme();

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

  useEffect(() => {
    document.title = t("testList") + " | MindMeter";
    const fetchResults = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await authFetch("/api/admin/test-results");
        if (!res.ok) throw new Error(t("loadTestListError"));
        const data = await res.json();
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [t]);

  useEffect(() => {
    setCurrentPage(0);
  }, [search, filterSeverity]);

  useEffect(() => {
    // Đọc query param 'severity' để focus filter nếu có
    const params = new URLSearchParams(location.search);
    const severity = params.get("severity");
    if (["SEVERE", "MODERATE", "MILD", "MINIMAL", "ALL"].includes(severity)) {
      setFilterSeverity(severity);
    }
  }, [location.search]);

  const filteredResults = results.filter((r) => {
    const s = search.toLowerCase();
    const matchText =
      (r.email && r.email.toLowerCase().includes(s)) ||
      (r.studentName && r.studentName.toLowerCase().includes(s)) ||
      (r.diagnosis &&
        t(`studentTestResultPage.diagnosisKeys.${r.diagnosis}`)
          .toLowerCase()
          .includes(s));
    const matchSeverity =
      filterSeverity === "ALL" || r.severityLevel === filterSeverity;
    return matchText && matchSeverity;
  });

  const paginatedResults = filteredResults.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  const totalPages = Math.ceil(filteredResults.length / pageSize);

  const handleDelete = async (id) => {
    if (!window.confirm(t("confirmDeleteTest"))) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch(`/api/admin/test-results/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("deleteTestError"));
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setNotificationModal({
        isOpen: true,
        type: "error",
        title: t("common.error"),
        message: err.message,
        onConfirm: null,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("email.testResult.title")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={() => navigate("/admin/profile")}
        onLogout={() => handleLogout(navigate)}
      />
      <div className="p-8 w-full dark:bg-gray-900 pt-24">
        <h1 className="text-2xl font-bold mb-6 text-blue-600 dark:text-blue-300 text-center">
          {t("testList")}
        </h1>
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <button
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl shadow transition min-w-[140px] h-[48px] dark:bg-red-700 dark:hover:bg-red-800"
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
          {/* Center search, right-align export buttons */}
          <div className="flex-1 flex items-center justify-center min-w-[220px]">
            <input
              type="text"
              className="w-full max-w-xl px-6 py-3 rounded-full shadow border outline-none focus:ring-2 focus:ring-blue-400 text-base dark:bg-gray-800 dark:text-white dark:border-gray-700"
              placeholder={t("searchTest")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4 justify-end">
            <button
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow transition min-w-[140px] h-[48px] dark:bg-green-700 dark:hover:bg-green-800"
              onClick={() => exportToExcel(filteredResults, t)}
            >
              <FaFileExcel className="text-lg" />
              {t("exportExcel")}
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow transition min-w-[140px] h-[48px] dark:bg-blue-700 dark:hover:bg-blue-800"
              onClick={() => exportToWord(filteredResults, t)}
            >
              <FaFileWord className="text-lg" />
              {t("exportToWord")}
            </button>
          </div>
        </div>
        {/* Filter mức độ nằm dưới, căn trái */}
        <div className="flex gap-4 mb-6 justify-start flex-wrap">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`px-6 py-2 rounded-full font-bold text-base shadow transition-all border-2 border-transparent
              ${
                filterSeverity === opt.value
                  ? opt.value === "SEVERE"
                    ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-white"
                    : opt.value === "MODERATE"
                    ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-white"
                    : opt.value === "MILD"
                    ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-white"
                    : opt.value === "MINIMAL"
                    ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-white"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white"
              }`}
              onClick={() => setFilterSeverity(opt.value)}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-center font-semibold text-lg">
            {error}
          </div>
        )}
        <div className="flex justify-center w-full">
          <div className="max-w-7xl w-full mx-auto rounded-2xl shadow-lg border border-blue-200 bg-white overflow-hidden">
            <div
              className="overflow-x-auto w-full"
              style={{ overflowX: "hidden" }}
            >
              {loading ? (
                <div className="text-center py-10 text-gray-500 text-lg">
                  {t("loading")}
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-lg">
                  {t("noSurveyData")}
                </div>
              ) : (
                <>
                  <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl">
                    <thead className="bg-blue-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-2 py-4 text-left text-sm font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 w-1/6 min-w-[120px]">
                          {t("emailHeader")}
                        </th>
                        <th className="px-2 py-4 text-left text-sm font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 w-1/6 min-w-[100px]">
                          {t("studentNameHeader")}
                        </th>
                        <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 w-1/6 min-w-[100px] hidden md:table-cell">
                          {t("testedAtHeader")}
                        </th>
                        <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 w-1/6 min-w-[80px]">
                          {t("severityHeader")}
                        </th>
                        <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 w-1/6 min-w-[60px]">
                          {t("scoreHeader")}
                        </th>
                        <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 w-1/6 min-w-[120px] hidden lg:table-cell">
                          {t("diagnosisHeader")}
                        </th>
                        <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 w-1/6 min-w-[100px]">
                          {t("actionHeader")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {paginatedResults.map((r) => (
                        <tr
                          key={r.id}
                          className="bg-white even:bg-blue-50 dark:bg-gray-800 dark:even:bg-gray-900 align-middle hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-2 py-4 text-sm align-middle break-words dark:text-white">
                            <div className="truncate" title={r.email}>
                              {r.email}
                            </div>
                          </td>
                          <td className="px-2 py-4 text-sm align-middle dark:text-white">
                            <div className="truncate" title={r.studentName}>
                              {r.studentName}
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center align-middle dark:text-white hidden md:table-cell">
                            <div
                              className="truncate"
                              title={
                                r.testedAt
                                  ? new Date(r.testedAt).toLocaleString(
                                      i18n.language === "vi" ? "vi-VN" : "en-US"
                                    )
                                  : ""
                              }
                            >
                              {r.testedAt
                                ? new Date(r.testedAt).toLocaleString(
                                    i18n.language === "vi" ? "vi-VN" : "en-US"
                                  )
                                : ""}
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center align-middle dark:text-white">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-bold shadow-sm border whitespace-nowrap
                              ${
                                r.severityLevel === "SEVERE"
                                  ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-800 dark:text-red-100"
                                  : r.severityLevel === "MILD"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-800 dark:text-yellow-100"
                                  : r.severityLevel === "MINIMAL"
                                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-800 dark:text-green-100"
                                  : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-800 dark:text-blue-100"
                              }
                            `}
                            >
                              {t(r.severityLevel?.toLowerCase() || "")}
                            </span>
                          </td>
                          <td className="px-2 py-4 text-center align-middle dark:text-white">
                            <div className="font-bold text-lg">
                              {r.totalScore}
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center align-middle dark:text-white hidden lg:table-cell">
                            <div
                              className="truncate"
                              title={
                                t(
                                  `studentTestResultPage.diagnosisKeys.${r.diagnosis}`
                                ) || r.diagnosis
                              }
                            >
                              {t(
                                `studentTestResultPage.diagnosisKeys.${r.diagnosis}`
                              ) || r.diagnosis}
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center align-middle">
                            <div className="flex gap-1 justify-center items-center h-full flex-wrap">
                              <button
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-sm transition-all text-xs"
                                title={t("viewDetails")}
                                onClick={() => setViewTest(r)}
                              >
                                <FaEye className="text-xs" />
                                <span className="hidden sm:inline">
                                  {t("view")}
                                </span>
                              </button>
                              <button
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-sm transition-all text-xs disabled:opacity-60"
                                title={t("delete")}
                                onClick={() => handleDelete(r.id)}
                                disabled={deletingId === r.id}
                              >
                                <FaTrash className="text-xs" />
                                <span className="hidden sm:inline">
                                  {t("delete")}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Move Pagination outside the table container */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          t={t}
        />
        <TestDetailModal
          open={!!viewTest}
          onClose={() => setViewTest(null)}
          initialTest={viewTest}
          adminMode={true}
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
    </div>
  );
}
