import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import TestDetailModal from "../components/TestDetailModal";
import SendAdviceModal from "../components/SendAdviceModal";
import { authFetch } from "../authFetch";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { FaUserGraduate, FaUsers } from "react-icons/fa";
import { useTheme } from "../hooks/useTheme";
import { jwtDecode } from "jwt-decode";

const PAGE_SIZE = 5;
const severityOptions = [
  { value: "ALL", labelKey: "all" },
  { value: "MINIMAL", labelKey: "minimal" },
  { value: "MILD", labelKey: "mild" },
  { value: "MODERATE", labelKey: "moderate" },
  { value: "SEVERE", labelKey: "severe" },
];

const getSeverityColor = (severityLevel) => {
  switch (severityLevel) {
    case "SEVERE":
      return "bg-red-100 text-red-800";
    case "MODERATE":
      return "bg-yellow-100 text-yellow-800";
    case "MILD":
      return "bg-blue-100 text-blue-800";
    case "MINIMAL":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getSeverityLabel = (severityLevel, t) => {
  switch (severityLevel) {
    case "SEVERE":
      return t("severe");
    case "MODERATE":
      return t("moderate");
    case "MILD":
      return t("mild");
    case "MINIMAL":
      return t("minimal");
    default:
      return severityLevel;
  }
};

function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function getPagination(current, total) {
  const delta = 1; // số trang lân cận
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 0; i < total; i++) {
    if (
      i === 0 ||
      i === total - 1 ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l !== undefined) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

export default function ExpertStudentsPage({ handleLogout: propHandleLogout }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Hàm format tên theo ngôn ngữ
  const formatStudentName = (studentName) => {
    if (!studentName) return "";

    // Tách firstName và lastName từ studentName (format: "firstName lastName")
    const nameParts = studentName.trim().split(" ");
    if (nameParts.length < 2) return studentName;

    // Logic mới: với tên "Kiên Cường Trần"
    // firstName = "Kiên Cường" (tên đệm + tên chính)
    // lastName = "Trần" (họ)
    let firstName, lastName;

    if (nameParts.length === 3) {
      // Trường hợp 3 từ: "Kiên Cường Trần"
      firstName = nameParts[0] + " " + nameParts[1]; // "Kiên Cường"
      lastName = nameParts[2]; // "Trần"
    } else if (nameParts.length === 2) {
      // Trường hợp 2 từ: "Kiên Trần"
      firstName = nameParts[0]; // "Kiên"
      lastName = nameParts[1]; // "Trần"
    } else {
      // Trường hợp khác
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ");
    }

    // Tiếng Việt: họ trước, tên sau (Trần Kiên Cường)
    // Tiếng Anh: tên trước, họ sau (Kien Cuong Tran)
    if (i18n.language === "en") {
      // Tiếng Anh: bỏ dấu và giữ format firstName lastName
      const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      };
      return `${removeAccents(firstName)} ${removeAccents(lastName)}`;
    } else {
      // Tiếng Việt: đảo ngược thứ tự (lastName firstName)
      // Ví dụ: "Kiên Cường Trần" -> "Trần Kiên Cường"
      return `${lastName} ${firstName}`;
    }
  };
  const [openModal, setOpenModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [openAdviceModal, setOpenAdviceModal] = useState(false);
  const [adviceStudent, setAdviceStudent] = useState(null);
  const [adviceTestId, setAdviceTestId] = useState(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialFilter = (params.get("filter") || "ALL").toUpperCase();
  const [filter, setFilter] = useState(initialFilter);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await authFetch("/api/expert/test-results");
        if (!res.ok) throw new Error(t("fetchStudentError"));
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [t]);

  useEffect(() => {
    document.title = t("studentTestListTitle");
  }, [t]);

  useEffect(() => {
    setFilterSeverity(filter);
  }, [filter]);

  // Lọc và tìm kiếm nâng cao
  const filtered = students.filter((test) => {
    if (filterSeverity !== "ALL" && test.severityLevel !== filterSeverity)
      return false;
    if (search) {
      const s = removeVietnameseTones(search.toLowerCase());
      const fullName = removeVietnameseTones(
        `${test.studentName || ""} ${test.email || ""}`.toLowerCase()
      );
      const diagnosis = removeVietnameseTones(
        (test.diagnosis || "").toLowerCase()
      );
      if (!fullName.includes(s) && !diagnosis.includes(s)) return false;
    }
    return true;
  });

  // Phân trang
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [filterSeverity, search]);

  const handleLogout =
    propHandleLogout ||
    (() => {
      localStorage.removeItem("token");
      navigate("/login");
    });

  const handleExportExcel = () => {
    const dataToExport = filtered.map((test) => [
      test.studentName,
      test.email,
      test.totalScore,
      test.diagnosis,
      getSeverityLabel(test.severityLevel, t),
      test.testedAt ? new Date(test.testedAt).toLocaleDateString("vi-VN") : "",
    ]);
    const header = [
      t("common.students"),
      t("emailHeader"),
      t("scoreHeader"),
      t("diagnosisHeader"),
      t("severityHeader"),
      t("surveyDate"),
    ];
    const ws = XLSX.utils.aoa_to_sheet([header, ...dataToExport]);
    ws["!cols"] = [
      { wch: 22 },
      { wch: 30 },
      { wch: 10 },
      { wch: 20 },
      { wch: 14 },
      { wch: 16 },
    ];
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: header.length - 1, r: filtered.length },
      }),
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HocSinhSinhVienKhaoSat");
    XLSX.writeFile(wb, "Danh_sach_hoc_sinh_sinh_vien_khao_sat.xlsx");
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    navigate(`/expert/students?filter=${newFilter}`);
  };

  // Pagination component giống UserManagementPage
  const Pagination = () => {
    if (totalPages <= 1) return null;
    const pages = getPagination(currentPage, totalPages);
    return (
      <div className="flex gap-2 justify-center mt-8">
        {/* Nút prev */}
        <button
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow transition
            ${
              currentPage === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-400 dark:bg-gray-800 dark:text-blue-400 dark:border-gray-700 dark:hover:bg-gray-700"
            }
          `}
          onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
          aria-label={t("prevPage")}
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
                    ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-gray-900"
                    : "bg-gray-200 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
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
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-400 dark:bg-gray-800 dark:text-blue-400 dark:border-gray-700 dark:hover:bg-gray-700"
            }
          `}
          onClick={() =>
            currentPage < totalPages - 1 && setCurrentPage(currentPage + 1)
          }
          disabled={currentPage === totalPages - 1 || totalPages === 0}
          aria-label={t("nextPage")}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 5l5 5-5 5" />
          </svg>
        </button>
      </div>
    );
  };

  const [user, setUser] = useState(() => {
    let userObj = {
      firstName: "",
      lastName: "",
      avatarUrl: null,
      email: "",
      role: "",
    };
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userObj.firstName = decoded.firstName || "";
        userObj.lastName = decoded.lastName || "";
        userObj.email = decoded.sub || decoded.email || "";
        userObj.avatarUrl = decoded.avatarUrl || decoded.avatar || null;
        userObj.role = decoded.role || "";
        userObj.plan = decoded.plan || "FREE";
        userObj.phone = decoded.phone || "";
      } catch {}
    }
    return userObj;
  });

  if (loading)
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <DashboardHeader
          logoIcon={
            <FaUsers className="text-indigo-500 dark:text-indigo-300 text-3xl" />
          }
          logoText={
            <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 dark:from-indigo-300 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide">
              {t("common.studentList")}
            </span>
          }
          user={user}
          theme={theme}
          setTheme={toggleTheme}
          onProfile={() => navigate("/expert/profile")}
          onLogout={handleLogout}
        />
        <div className="flex-grow flex flex-col py-10 overflow-x-hidden pt-24">
          <div className="p-8 w-full dark:bg-gray-900 min-h-screen">
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
                  {t("loadingStudentList")}
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
        </div>
        <FooterSection />
      </div>
    );
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaUserGraduate className="text-indigo-500 dark:text-indigo-300 text-3xl" />
        }
        logoText={
          <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 dark:from-indigo-300 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide">
            {t("studentTestListTitle") || t("common.studentList")}
          </span>
        }
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={() => navigate("/expert/profile")}
        onLogout={handleLogout}
      />
      <div className="flex-grow flex flex-col py-10 overflow-x-hidden pt-24">
        <h1 className="text-2xl font-bold mb-6 text-blue-600 dark:text-blue-300 text-center">
          {t("studentTestListTitle")}
        </h1>
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-center">
          <button
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[140px] h-[48px] dark:bg-red-700 dark:hover:bg-red-800"
            onClick={() => navigate("/expert/dashboard")}
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
              placeholder={t("searchStudentTest")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[140px] h-[48px] dark:bg-green-700 dark:hover:bg-green-800"
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
                  d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="12 2 12 12 16 8 12 12 8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("exportExcel")}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          {severityOptions.map((r) => {
            const getCategoryColor = (categoryValue) => {
              const colors = {
                ALL: "bg-gray-600 border-gray-600 dark:bg-gray-500 dark:border-gray-500",
                MINIMAL:
                  "bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500",
                MILD: "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500",
                MODERATE:
                  "bg-yellow-600 border-yellow-600 dark:bg-yellow-500 dark:border-yellow-500",
                SEVERE:
                  "bg-red-600 border-red-600 dark:bg-red-500 dark:border-red-500",
              };
              return (
                colors[categoryValue] ||
                "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
              );
            };

            return (
              <button
                key={r.value}
                className={`px-6 py-3 rounded-full font-bold text-base shadow transition-all border-2 ${
                  filterSeverity === r.value
                    ? `${getCategoryColor(r.value)} text-white`
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                onClick={() => handleFilterChange(r.value)}
              >
                {t(r.labelKey)}
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  {r.value === "ALL"
                    ? students.length
                    : students.filter((s) => s.severityLevel === r.value)
                        .length}
                </span>
              </button>
            );
          })}
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-center font-semibold text-lg">
            {error}
          </div>
        )}
        <div className="flex justify-center w-full">
          <div className="max-w-7xl w-full mx-auto rounded-2xl shadow-lg border border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
            <div
              className="overflow-x-auto w-full"
              style={{ overflowX: "hidden" }}
            >
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-300 text-lg">
                  {t("noStudentTestFound")}
                </div>
              ) : (
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                  <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead className="bg-blue-50 dark:bg-blue-900">
                    <tr>
                      <th className="px-2 py-4 text-left text-sm font-extrabold text-blue-800 dark:text-blue-200 uppercase tracking-wider border-b-2 border-blue-200 dark:border-blue-700 w-1/6 min-w-[120px]">
                        {t("studentNameSurveyHeader")}
                      </th>
                      <th className="px-2 py-4 text-left text-sm font-extrabold text-blue-800 dark:text-blue-200 uppercase tracking-wider border-b-2 border-blue-200 dark:border-blue-700 w-1/6 min-w-[100px]">
                        {t("emailHeader")}
                      </th>
                      <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-blue-200 uppercase tracking-wider border-b-2 border-blue-200 dark:border-blue-700 w-1/6 min-w-[60px]">
                        {t("scoreHeader")}
                      </th>
                      <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-blue-200 uppercase tracking-wider border-b-2 border-blue-200 dark:border-blue-700 w-1/6 min-w-[120px] hidden lg:table-cell">
                        {t("diagnosisHeader")}
                      </th>
                      <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-blue-200 uppercase tracking-wider border-b-2 border-blue-200 dark:border-blue-700 w-1/6 min-w-[80px]">
                        {t("severityHeader")}
                      </th>
                      <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-blue-200 uppercase tracking-wider border-b-2 border-blue-200 dark:border-blue-700 w-1/6 min-w-[100px] hidden md:table-cell">
                        {t("surveyedAtHeader")}
                      </th>
                      <th className="px-2 py-4 text-center text-sm font-extrabold text-blue-800 dark:text-blue-200 uppercase tracking-wider border-b-2 border-blue-200 dark:border-blue-700 w-1/6 min-w-[120px]">
                        {t("actionHeader")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginated.map((test) => (
                      <tr key={test.id}>
                        <td className="px-2 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          <div
                            className="truncate"
                            title={formatStudentName(test.studentName)}
                          >
                            {formatStudentName(test.studentName)}
                          </div>
                        </td>
                        <td className="px-2 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="truncate" title={test.email}>
                            {test.email}
                          </div>
                        </td>
                        <td className="px-2 py-4 text-center text-sm text-gray-900 dark:text-white">
                          <div className="font-bold text-lg">
                            {test.totalScore}
                          </div>
                        </td>
                        <td className="px-2 py-4 text-center text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                          <div className="truncate" title={test.diagnosis}>
                            {test.diagnosis}
                          </div>
                        </td>
                        <td className="px-2 py-4 text-center">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${
                              test.severityLevel === "SEVERE"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : test.severityLevel === "MODERATE"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : test.severityLevel === "MILD"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : test.severityLevel === "MINIMAL"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {getSeverityLabel(test.severityLevel, t)}
                          </span>
                        </td>
                        <td className="px-2 py-4 text-center text-sm text-gray-900 dark:text-white hidden md:table-cell">
                          <div
                            className="truncate"
                            title={
                              test.testedAt
                                ? new Date(test.testedAt).toLocaleDateString(
                                    "vi-VN"
                                  )
                                : ""
                            }
                          >
                            {test.testedAt
                              ? new Date(test.testedAt).toLocaleDateString(
                                  "vi-VN"
                                )
                              : ""}
                          </div>
                        </td>
                        <td className="px-2 py-4 text-center text-sm font-medium">
                          <div className="flex gap-1 justify-center items-center flex-wrap">
                            <button
                              className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-400 text-xs px-2 py-1 rounded"
                              onClick={() => {
                                setSelectedTest(test);
                                setOpenModal(true);
                              }}
                            >
                              <span className="hidden sm:inline">
                                {t("viewDetails")}
                              </span>
                              <span className="sm:hidden">View</span>
                            </button>
                            <button
                              className="text-green-600 dark:text-green-300 hover:text-green-900 dark:hover:text-green-400 text-xs px-2 py-1 rounded"
                              onClick={() => {
                                setAdviceStudent({
                                  id: test.userId, // Sử dụng trực tiếp userId từ backend
                                  name: formatStudentName(test.studentName),
                                  email: test.email,
                                  totalScore: test.totalScore,
                                  severityLevel: test.severityLevel,
                                  diagnosis: test.diagnosis,
                                });
                                setAdviceTestId(test.id);
                                setOpenAdviceModal(true);
                              }}
                            >
                              <span className="hidden sm:inline">
                                {t("sendAdvice")}
                              </span>
                              <span className="sm:hidden">Advice</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        {/* Phân trang */}
        <Pagination />
        {/* Modal chi tiết bài khảo sát dùng chung với admin */}
        <TestDetailModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          initialTest={selectedTest}
          adminMode={false}
        />
        <SendAdviceModal
          open={openAdviceModal}
          onClose={() => setOpenAdviceModal(false)}
          student={adviceStudent}
          testResultId={adviceTestId}
        />
      </div>
      <FooterSection />
    </div>
  );
}
