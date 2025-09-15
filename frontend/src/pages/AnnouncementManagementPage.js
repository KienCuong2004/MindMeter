import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";
import { useTranslation } from "react-i18next";
import { authFetch } from "../authFetch";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { FaBullhorn } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { useTheme } from "../hooks/useTheme";

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

// Hàm loại bỏ dấu tiếng Việt
function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export default function AnnouncementManagementPage({
  handleLogout: propHandleLogout,
}) {
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalAnnouncement, setModalAnnouncement] = useState({
    id: null,
    title: "",
    content: "",
    announcementType: "INFO",
    isActive: true,
  });
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
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

  // Đặt typeOptions vào trong component để dùng được t
  const typeOptions = [
    { value: "INFO", label: t("infoType") },
    { value: "WARNING", label: t("warningType") },
    { value: "URGENT", label: t("urgentType") },
    { value: "GUIDE", label: t("guideType") },
  ];

  // Lấy danh sách thông báo
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch("/api/admin/announcements", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error(t("errors.cannotLoadAnnouncements"));
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ message: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    document.title = t("announcementManagement") + " | MindMeter";
  }, [t]);

  // Tìm kiếm
  const filteredAnnouncements = announcements.filter(
    (a) =>
      removeVietnameseTones(a.title.toLowerCase()).includes(
        removeVietnameseTones(search.toLowerCase())
      ) ||
      removeVietnameseTones(a.content.toLowerCase()).includes(
        removeVietnameseTones(search.toLowerCase())
      )
  );
  const paginatedAnnouncements = filteredAnnouncements.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  const totalPages = Math.ceil(filteredAnnouncements.length / pageSize);

  // Thêm/sửa thông báo
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert({ message: "", type: "" });
    try {
      const token = localStorage.getItem("token");
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit
        ? `/api/admin/announcements/${modalAnnouncement.id}`
        : "/api/admin/announcements";
      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          title: modalAnnouncement.title,
          content: modalAnnouncement.content,
          announcementType: modalAnnouncement.announcementType,
          isActive: modalAnnouncement.isActive,
        }),
      });
      if (!res.ok)
        throw new Error(
          isEdit ? t("errors.updateFailed") : t("errors.addFailed")
        );
      setShowModal(false);
      setModalAnnouncement({
        id: null,
        title: "",
        content: "",
        announcementType: "INFO",
        isActive: true,
      });
      setAlert({ message: t("addAnnouncementSuccess"), type: "success" });
      fetchAnnouncements();
    } catch (err) {
      setAlert({ message: t("addAnnouncementFailed"), type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // Xóa thông báo
  const handleDelete = async (id) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  // Hàm xóa xác nhận
  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch(`/api/admin/announcements/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error(t("errors.deleteFailed"));
      setAlert({ message: t("deleteAnnouncementSuccess"), type: "success" });
      setConfirmDelete(false);
      setDeleteId(null);
      fetchAnnouncements();
    } catch (err) {
      setAlert({ message: t("deleteAnnouncementFailed"), type: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  // Bật/tắt trạng thái
  const handleToggle = async (id) => {
    setSaving(true);
    setAlert({ message: "", type: "" });
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch(`/api/admin/announcements/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error(t("updateStatusFailed"));
      setAlert({ message: t("updateAnnouncementSuccess"), type: "success" });
      fetchAnnouncements();
    } catch (err) {
      setAlert({ message: t("updateAnnouncementFailed"), type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // Hàm xuất Word
  function exportAnnouncementsToWord(announcements) {
    const tableRows = [
      new TableRow({
        children: [
          t("announcementIdHeader"),
          t("titleHeader"),
          t("contentHeader"),
          t("typeHeader"),
          t("statusHeader"),
          t("createdAtHeader"),
        ].map((text) => new TableCell({ children: [new Paragraph(text)] })),
      }),
      ...announcements.map(
        (a) =>
          new TableRow({
            children: [
              a.id,
              a.title,
              a.content,
              translateType(a.announcementType),
              translateStatus(a.isActive),
              a.createdAt ? new Date(a.createdAt).toLocaleString() : "",
            ].map(
              (text) =>
                new TableCell({ children: [new Paragraph(String(text))] })
            ),
          })
      ),
    ];
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: t("announcementListTitle"),
              heading: "Heading1",
            }),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "thong_bao.docx");
    });
  }

  const translateType = (type) => {
    const typeMap = {
      INFO: t("infoType"),
      WARNING: t("warningType"),
      URGENT: t("urgentType"),
      GUIDE: t("guideType"),
    };
    return typeMap[type] || type;
  };

  const translateStatus = (isActive) => {
    return isActive ? t("statusActive") : t("statusInactive");
  };

  const handleLogout =
    propHandleLogout ||
    (() => {
      localStorage.removeItem("token");
      navigate("/login");
    });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBullhorn className="text-indigo-500 dark:text-indigo-300 text-3xl" />
        }
        logoText={
          <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 dark:from-indigo-300 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide">
            {t("announcementManagement") || t("announcement.management")}
          </span>
        }
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={() => navigate("/admin/profile")}
        onLogout={handleLogout}
      />
      <div className="flex-grow flex flex-col py-10 overflow-x-hidden pt-24">
        <div className="w-full dark:bg-gray-900 min-h-screen">
          <h1 className="text-2xl font-bold mb-8 mt-8 text-blue-600 dark:text-blue-300 text-center">
            {t("announcementManagement")}
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
                placeholder={t("searchAnnouncement")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[140px] h-[48px] dark:bg-blue-700 dark:hover:bg-blue-800"
                onClick={() => {
                  setShowModal(true);
                  setIsEdit(false);
                  setModalAnnouncement({
                    id: null,
                    title: "",
                    content: "",
                    announcementType: "INFO",
                    isActive: true,
                  });
                }}
              >
                + {t("addAnnouncement")}
              </button>
              <button
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[140px] h-[48px] dark:bg-indigo-700 dark:hover:bg-indigo-800"
                onClick={() => exportAnnouncementsToWord(filteredAnnouncements)}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" />
                </svg>
                {t("exportToWord")}
              </button>
            </div>
          </div>
          {alert.message && (
            <div
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
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-center font-semibold text-lg dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
          )}
          {loading ? (
            <div>{t("loadingAnnouncements")}</div>
          ) : (
            <>
              <div className="flex justify-center w-full">
                <div className="max-w-7xl w-full mx-auto rounded-2xl shadow-lg border border-blue-200 bg-white overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-full divide-y divide-blue-100 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl">
                      <colgroup>
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "32%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "10%" }} />
                      </colgroup>
                      <thead className="bg-white dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-4 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                            {t("announcementIdHeader")}
                          </th>
                          <th className="px-4 py-4 text-left text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                            {t("titleHeader")}
                          </th>
                          <th className="px-4 py-4 text-left text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                            {t("contentHeader")}
                          </th>
                          <th className="px-4 py-4 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                            {t("typeHeader")}
                          </th>
                          <th className="px-4 py-4 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                            {t("statusHeader")}
                          </th>
                          <th className="px-4 py-4 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                            {t("createdAtHeader")}
                          </th>
                          <th className="px-4 py-4 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                            {t("actionHeader")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-blue-100 dark:bg-gray-800 dark:divide-gray-700">
                        {paginatedAnnouncements.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4">
                              {t("noAnnouncements")}
                            </td>
                          </tr>
                        ) : (
                          paginatedAnnouncements.map((a) => {
                            return (
                              <tr
                                key={a.id}
                                className="border-t hover:bg-blue-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-900"
                              >
                                <td className="px-4 py-3 text-center align-middle dark:text-white">
                                  {a.id}
                                </td>
                                <td className="px-4 py-3 align-middle font-semibold whitespace-normal break-words dark:text-white">
                                  {a.title}
                                </td>
                                <td className="px-4 py-3 align-middle max-w-[400px] whitespace-normal break-words dark:text-white">
                                  {a.content}
                                </td>
                                <td className="px-4 py-3 text-center align-middle dark:text-white">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                      a.announcementType === "URGENT"
                                        ? "bg-red-100 text-red-700 dark:bg-red-800/60 dark:text-red-100"
                                        : a.announcementType === "WARNING"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-800/60 dark:text-yellow-100"
                                        : a.announcementType === "GUIDE"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-800/60 dark:text-blue-100"
                                        : "bg-gray-200 text-gray-700 dark:bg-gray-700/60 dark:text-gray-100"
                                    }`}
                                  >
                                    {translateType(a.announcementType)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center align-middle dark:text-white">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                      a.isActive
                                        ? "bg-green-100 text-green-700 dark:bg-green-800/60 dark:text-green-100"
                                        : "bg-gray-200 text-gray-500 dark:bg-gray-700/60 dark:text-gray-100"
                                    }`}
                                  >
                                    {translateStatus(a.isActive)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center align-middle dark:text-white">
                                  {a.createdAt
                                    ? new Date(a.createdAt).toLocaleString()
                                    : ""}
                                </td>
                                <td className="px-4 py-3 text-center align-middle dark:text-white">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 transition-colors dark:bg-yellow-700 dark:hover:bg-yellow-800"
                                      onClick={() => {
                                        setShowModal(true);
                                        setIsEdit(true);
                                        setModalAnnouncement(a);
                                      }}
                                    >
                                      {t("edit")}
                                    </button>
                                    <button
                                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors dark:bg-red-700 dark:hover:bg-red-800"
                                      onClick={() => handleDelete(a.id)}
                                      disabled={deleting}
                                    >
                                      {deleting ? t("deleting") : t("delete")}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* Phân trang */}
              <div className="flex gap-2 justify-center mt-8">
                {/* Nút prev */}
                <button
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow transition
                ${
                  currentPage === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                    : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                }
              `}
                  onClick={() =>
                    currentPage > 0 && setCurrentPage(currentPage - 1)
                  }
                  disabled={currentPage === 0}
                  aria-label={t("previousPage")}
                >
                  <svg
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
                      key={idx}
                      className="w-10 h-10 flex items-center justify-center text-xl text-gray-400 select-none dark:text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow transition
                      ${
                        currentPage === page
                          ? "bg-blue-600 text-white dark:bg-blue-700"
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
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                    : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                }
              `}
                  onClick={() =>
                    currentPage < totalPages - 1 &&
                    setCurrentPage(currentPage + 1)
                  }
                  disabled={currentPage === totalPages - 1 || totalPages === 0}
                  aria-label={t("nextPage")}
                >
                  <svg
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M7 5l5 5-5 5" />
                  </svg>
                </button>
              </div>
            </>
          )}
          {/* Modal thêm/sửa thông báo */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-lg dark:bg-gray-800 dark:text-white">
                <h2 className="text-2xl font-bold mb-6 text-blue-700">
                  {isEdit ? t("editAnnouncement") : t("addNewAnnouncement")}
                </h2>
                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
                      {t("title")}
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all dark:bg-gray-900 dark:text-white dark:border-gray-700"
                      value={modalAnnouncement.title}
                      onChange={(e) =>
                        setModalAnnouncement({
                          ...modalAnnouncement,
                          title: e.target.value,
                        })
                      }
                      required
                      placeholder={t("enterAnnouncementTitle")}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
                      {t("content")}
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all min-h-[80px] dark:bg-gray-900 dark:text-white dark:border-gray-700"
                      value={modalAnnouncement.content}
                      onChange={(e) =>
                        setModalAnnouncement({
                          ...modalAnnouncement,
                          content: e.target.value,
                        })
                      }
                      required
                      placeholder={t("enterAnnouncementContent")}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
                      {t("announcementType")}
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all dark:bg-gray-900 dark:text-white dark:border-gray-700"
                      value={modalAnnouncement.announcementType}
                      onChange={(e) =>
                        setModalAnnouncement({
                          ...modalAnnouncement,
                          announcementType: e.target.value,
                        })
                      }
                      required
                    >
                      {typeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.value.toLowerCase() + "Type")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={modalAnnouncement.isActive}
                      onChange={(e) =>
                        setModalAnnouncement({
                          ...modalAnnouncement,
                          isActive: e.target.checked,
                        })
                      }
                      id="isActive"
                      className="accent-blue-600 w-5 h-5 dark:bg-gray-900 dark:accent-blue-400"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-gray-700 dark:text-gray-200"
                    >
                      {t("isActive")}
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700 font-medium transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                      onClick={() => setShowModal(false)}
                      disabled={saving}
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800"
                      disabled={saving}
                    >
                      {saving ? t("saving") : isEdit ? t("update") : t("add")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Modal xác nhận xóa */}
          {confirmDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-sm text-center">
                <h2 className="text-xl font-bold mb-4">{t("confirmDelete")}</h2>
                <p>{t("confirmDeleteMessage")}</p>
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold"
                    onClick={handleDeleteConfirmed}
                    disabled={deleting}
                  >
                    {deleting ? t("deleting") : t("delete")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <FooterSection />
    </div>
  );
}
