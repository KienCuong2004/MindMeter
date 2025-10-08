import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { FaFileExcel, FaExclamationTriangle } from "react-icons/fa";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { authFetch } from "../authFetch";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { FaBrain } from "react-icons/fa";

const emptyUser = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  role: "STUDENT",
  status: "ACTIVE",
  enabled: true,
  phone: "",
  address: "",
};

// roleOptionsForForm sẽ được định nghĩa trong component để có thể sử dụng t function

/* eslint-disable no-unused-vars */
const EmailIcon = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M424 80H88a56.06 56.06 0 00-56 56v240a56.06 56.06 0 0056 56h336a56.06 56.06 0 0056-56V136a56.06 56.06 0 00-56-56zm-14.18 92.63l-144 112a16 16 0 01-19.64 0l-144-112a16 16 0 1119.64-25.26L256 251.73l134.18-104.36a16 16 0 0119.64 25.26z"></path>
  </svg>
);

const PhoneIcon = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M391 480c-19.52 0-46.94-7.06-88-30-49.93-28-88.55-53.85-138.21-103.38C116.91 298.77 93.61 267.79 61 208.45c-36.84-67-30.56-102.12-23.54-117.13C45.82 73.38 58.16 62.65 74.11 52a176.3 176.3 0 0128.64-15.2c1-.43 1.93-.84 2.76-1.21 4.95-2.23 12.45-5.6 21.95-2 6.34 2.38 12 7.25 20.86 16 18.17 17.92 43 57.83 52.16 77.43 6.15 13.21 10.22 21.93 10.23 31.71 0 11.45-5.76 20.28-12.75 29.81-1.31 1.79-2.61 3.5-3.87 5.16-7.61 10-9.28 12.89-8.18 18.05 2.23 10.37 18.86 41.24 46.19 68.51s57.31 42.85 67.72 45.07c5.38 1.15 8.33-.59 18.65-8.47 1.48-1.13 3-2.3 4.59-3.47 10.66-7.93 19.08-13.54 30.26-13.54h.06c9.73 0 18.06 4.22 31.86 11.18 18 9.08 59.11 33.59 77.14 51.78 8.77 8.84 13.66 14.48 16.05 20.81 3.6 9.50.21 17-2 22-.37.83-.78 1.74-1.21 2.75a176.49 176.49 0 01-15.29 28.58c-10.63 15.9-21.4 28.21-39.38 36.58A67.42 67.42 0 01391 480z"></path>
  </svg>
);

const LockIcon = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M368 192h-16v-80a96 96 0 10-192 0v80h-16a64.07 64.07 0 00-64 64v176a64.07 64.07 0 0064 64h224a64.07 64.07 0 0064-64V256a64.07 64.07 0 00-64-64zm-48 0H192v-80a64 64 0 11128 0z"></path>
  </svg>
);

const UserIcon = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M256 256a112 112 0 10-112-112 112 112 0 00112 112zm0 32c-69.42 0-208 42.88-208 128v64h416v-64c0-85.12-138.58-128-208-128z"></path>
  </svg>
);

const LocationIcon = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1164-64 64.07 64.07 0 01-64 64z"></path>
  </svg>
);

const CityIcon = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M436.4 32H75.6C48.8 32 32 49.2 32 75.9V436c0 26.7 16.8 44 43.6 44h360.8c26.8 0 43.6-17.2 43.6-43.9V75.9C480 49.2 463.2 32 436.4 32zM153.6 436H75.6V358h78v78zm0-103.9H75.6v-78h78v78zm0-104H75.6v-78h78v78zm103.9 207.9h-78v-78h78v78zm0-103.9h-78v-78h78v78zm0-104h-78v-78h78v78zm103.9 207.9h-78v-78h78v78zm0-103.9h-78v-78h78v78zm0-104h-78v-78h78v78z"></path>
  </svg>
);

// Hàm sinh mảng phân trang rút gọn
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

export default function UserManagementPage({ handleLogout: propHandleLogout }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState({ ...emptyUser, role: "STUDENT" });
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;
  const [formErrors, setFormErrors] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

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

  // Đặt roleOptions, statusOptions, translateRole, translateStatus vào trong component để dùng được t
  const roleOptions = [
    { value: "ADMIN", label: t("admin") },
    { value: "EXPERT", label: t("expert") },
    { value: "STUDENT", label: t("student") },
  ];
  const statusOptions = [
    { value: "ALL", label: t("all") },
    { value: "ACTIVE", label: t("active") },
    { value: "INACTIVE", label: t("inactive") },
    { value: "BANNED", label: t("banned") },
  ];
  const translateRole = (role) => {
    const roleMap = {
      ADMIN: t("admin"),
      EXPERT: t("expert"),
      STUDENT: t("student"),
      STAFF: t("staff"),
      CUSTOMER: t("customer"),
      PARTNER: t("partner"),
    };
    return roleMap[role] || role;
  };
  const translateStatus = (status) => {
    const statusMap = {
      ACTIVE: t("active"),
      INACTIVE: t("inactive"),
      BANNED: t("banned"),
    };
    return statusMap[status] || status;
  };

  // Định nghĩa roleOptionsForForm trong component để có thể sử dụng t function
  const roleOptionsForForm = [
    { value: "ADMIN", label: t("admin") },
    { value: "EXPERT", label: t("expertRole") },
    { value: "STUDENT", label: t("student") },
  ];

  const fetchUsers = useCallback(
    async (retryCount = 0) => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await authFetch(`/api/auth/users`);

        if (res.status === 429) {
          // Rate limit exceeded - retry after delay
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            setTimeout(() => {
              fetchUsers(retryCount + 1);
            }, delay);
            return;
          } else {
            throw new Error(t("errors.rateLimitExceeded"));
          }
        }

        if (!res.ok) throw new Error(t("errors.cannotLoadUserList"));
        const data = await res.json();

        // Map lại để mỗi user có trường address là địa chỉ mặc định
        const usersWithAddress = (data.users || data).map((user) => {
          let address = "";
          if (user.addresses && user.addresses.length > 0) {
            const defaultAddr =
              user.addresses.find((addr) => addr.isDefault) ||
              user.addresses[0];
            address = defaultAddr ? defaultAddr.addressLine1 : "";
          }
          return { ...user, address };
        });
        setUsers(usersWithAddress);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ message: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    let timeoutId;
    if (formErrors) {
      timeoutId = setTimeout(() => {
        setFormErrors("");
      }, 5000); // 5 seconds
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [formErrors]);

  useEffect(() => {
    document.title = t("userManagementTitle") + " | MindMeter";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Khi trang mount hoặc URL thay đổi, đọc role từ query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlRole = params.get("role");
    if (["STUDENT", "EXPERT", "ADMIN"].includes(urlRole)) {
      setFilterRole(urlRole);
    } else {
      setFilterRole("ALL");
    }
  }, [location.search]);

  const handleAdd = () => {
    setModalUser(emptyUser);
    setIsEdit(false);
    setFormErrors("");
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setModalUser({ ...user });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  const confirmDeleteUser = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/auth/users/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("errors.deleteFailed"));
      setUsers(users.filter((u) => u.id !== deleteId));
      setAlert({ message: t("deleteUserSuccess"), type: "success" });
      setConfirmDelete(false);
      setDeleteId(null);
    } catch (err) {
      setAlert({ message: t("deleteUserFailed"), type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = {
      email: t("common.email"),
      firstName: t("common.firstName"),
      lastName: t("common.lastName"),
      phone: t("phoneNumber"),
    };

    if (!isEdit) {
      requiredFields.password = t("common.password");
    }

    const emptyFields = Object.entries(requiredFields)
      .filter(([key]) => !modalUser[key])
      .map(([_, label]) => label);

    if (emptyFields.length > 0) {
      setFormErrors(`${emptyFields.join(", ")} ${t("errors.fieldRequired")}!`);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(modalUser.email)) {
      setFormErrors(t("errors.emailInvalidFormat"));
      return;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(modalUser.phone)) {
      setFormErrors(t("phoneNumberValidation"));
      return;
    }

    try {
      setSaving(true);
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit
        ? `/api/auth/users/${modalUser.id}`
        : "/api/auth/users";

      // Loại bỏ hoàn toàn address và addresses khỏi payload
      const { address, addresses, ...userData } = modalUser;

      // Nếu là cập nhật, không gửi password
      if (isEdit) {
        delete userData.password;
      } else {
        // Nếu là thêm mới, không gửi id
        delete userData.id;
      }

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(isEdit ? t("updateUserFailed") : t("addUserFailed"));
      }

      await fetchUsers();
      setShowModal(false);
      setAlert({
        message: isEdit ? t("updateUserSuccess") : t("addUserSuccess"),
        type: "success",
      });
      setModalUser(emptyUser);
    } catch (err) {
      setFormErrors(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;
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
          aria-label="Trang trước"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 15l-5-5 5-5" />
          </svg>
        </button>
        {/* Số trang */}
        {[...Array(totalPages)].map((_, page) => (
          <button
            key={page}
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
        ))}
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
          aria-label="Trang sau"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 5l5 5-5 5" />
          </svg>
        </button>
      </div>
    );
  };

  // Lọc dữ liệu theo filter nâng cao
  const filteredUsers = users.filter((user) => {
    if (filterRole !== "ALL" && user.role !== filterRole) return false;
    if (filterStatus !== "ALL" && user.status !== filterStatus) return false;
    if (search) {
      const s = removeVietnameseTones(search.toLowerCase());
      const firstName = removeVietnameseTones(
        (user.firstName || "").toLowerCase()
      );
      const lastName = removeVietnameseTones(
        (user.lastName || "").toLowerCase()
      );
      const fullName = removeVietnameseTones(
        `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase()
      );
      const email = removeVietnameseTones((user.email || "").toLowerCase());
      const phone = removeVietnameseTones((user.phone || "").toLowerCase());
      if (
        !email.includes(s) &&
        !firstName.includes(s) &&
        !lastName.includes(s) &&
        !fullName.includes(s) &&
        !phone.includes(s)
      ) {
        return false;
      }
    }
    return true;
  });
  const paginatedUsers = filteredUsers.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  // Reset về trang 1 khi filterRole thay đổi
  useEffect(() => {
    setCurrentPage(0);
  }, [filterRole]);

  // Đảm bảo currentPage luôn hợp lệ khi số trang thay đổi
  useEffect(() => {
    if (currentPage > 0 && currentPage >= totalPages) {
      setCurrentPage(totalPages > 0 ? totalPages - 1 : 0);
    }
  }, [totalPages, currentPage]);

  // Hàm xuất Excel
  const handleExportExcel = () => {
    const dataToExport = filteredUsers.map((user) => [
      `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      user.email,
      translateRole(user.role),
      translateStatus(user.status),
      user.phone,
      user.createdAt ? new Date(user.createdAt).toLocaleString("vi-VN") : "",
    ]);
    const header = [
      t("common.fullName"),
      t("common.email"),
      t("common.role"),
      t("status"),
      t("phoneNumber"),
      t("createdDate"),
    ];
    const ws = XLSX.utils.aoa_to_sheet([header, ...dataToExport]);
    // Set column width
    ws["!cols"] = [
      { wch: 20 }, // Full name
      { wch: 30 }, // Email
      { wch: 18 }, // Role
      { wch: 15 }, // {t("status")}
      { wch: 15 }, // {t("phoneNumber")}
      { wch: 22 }, // {t("createdDate")}
    ];
    // Freeze header
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    // Set autofilter
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: header.length - 1, r: filteredUsers.length },
      }),
    };
    // Tô màu header (nếu mở bằng Excel sẽ thấy)
    header.forEach((col, idx) => {
      const cell = ws[XLSX.utils.encode_cell({ c: idx, r: 0 })];
      if (cell && !cell.s) cell.s = {};
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F81BD" } },
          alignment: { horizontal: "center" },
        };
      }
    });
    // Zebra row (dòng chẵn lẻ)
    for (let i = 1; i <= filteredUsers.length; i++) {
      for (let j = 0; j < header.length; j++) {
        const cell = ws[XLSX.utils.encode_cell({ c: j, r: i })];
        if (cell && !cell.s) cell.s = {};
        if (cell) {
          cell.s = {
            fill: { fgColor: { rgb: i % 2 === 0 ? "F2F2F2" : "FFFFFF" } },
          };
        }
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NguoiDung");
    XLSX.writeFile(wb, "nguoi_dung_mindmeter.xlsx");
  };

  // Đếm số lượng user theo vai trò
  const countByRole = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const handleLogout =
    propHandleLogout ||
    (() => {
      localStorage.removeItem("token");
      navigate("/login");
    });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <DashboardHeader
          logoIcon={
            <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
          }
          logoText={
            <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 dark:from-indigo-300 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide">
              {t("userManagementTitle")}
            </span>
          }
          user={user}
          theme={theme}
          setTheme={toggleTheme}
          onProfile={() => navigate("/admin/profile")}
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
                  {t("loadingData")}
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
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={
          <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 dark:from-indigo-300 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide">
            {t("userManagementTitle")}
          </span>
        }
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={() => navigate("/admin/profile")}
        onLogout={handleLogout}
      />
      <div className="flex-grow flex flex-col py-10 overflow-x-hidden pt-24">
        <h1 className="text-2xl font-bold mb-6 text-blue-600 dark:text-blue-300 text-center">
          {t("userManagement")}
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
              placeholder={t("searchUser")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <button
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[140px] h-[48px] dark:bg-blue-700 dark:hover:bg-blue-800"
              onClick={handleAdd}
            >
              + {t("addUser")}
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[140px] h-[48px] dark:bg-green-700 dark:hover:bg-green-800"
            >
              <FaFileExcel className="text-lg" />
              {t("exportExcel")}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-6 items-end justify-center">
          {/* Filter vai trò dạng button group */}
          <div className="flex gap-4 mb-6 justify-center w-full">
            {[{ value: "ALL", label: t("all") }, ...roleOptions].map((r) => (
              <button
                key={r.value}
                className={`px-6 py-2 rounded-full font-bold text-base shadow transition-all border-2 border-transparent
                  ${
                    filterRole === r.value
                      ? r.value === "ALL"
                        ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-white"
                        : r.value === "ADMIN"
                        ? "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-white"
                        : r.value === "EXPERT"
                        ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-white"
                        : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-white"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white"
                  }
                `}
                onClick={() => setFilterRole(r.value)}
              >
                {r.label}
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-gray-900 text-blue-700 dark:text-white border border-blue-200 dark:border-gray-700">
                  {r.value === "ALL" ? users.length : countByRole[r.value] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-center font-semibold text-lg">
            {error}
          </div>
        )}
        <div className="flex justify-center w-full">
          <div className="max-w-7xl w-full mx-auto rounded-2xl shadow-lg border border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="overflow-x-auto w-full">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-300 text-lg">
                  {t("noUserFound")}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl">
                  <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <thead className="bg-blue-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-4 text-left text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                        {t("emailHeader")}
                      </th>
                      <th className="px-4 py-4 text-left text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                        {t("firstNameHeader")}
                      </th>
                      <th className="px-4 py-4 text-left text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                        {t("lastNameHeader")}
                      </th>
                      <th className="px-4 py-4 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 hidden md:table-cell">
                        {t("roleHeader")}
                      </th>
                      <th className="px-4 py-4 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 hidden md:table-cell">
                        {t("statusHeader")}
                      </th>
                      <th className="px-4 py-4 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700 hidden md:table-cell">
                        {t("phoneHeader")}
                      </th>
                      <th className="px-4 py-4 text-center text-base font-extrabold text-blue-800 dark:text-white uppercase tracking-wider border-b-2 border-blue-200 dark:border-gray-700">
                        {t("actionHeader")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id || user.email}
                        className="bg-white even:bg-blue-50 dark:bg-gray-800 dark:even:bg-gray-900 align-middle hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm align-middle break-words max-w-[180px] truncate whitespace-nowrap overflow-hidden dark:text-white">
                          {user.email}
                        </td>
                        <td className="px-4 py-4 text-sm align-middle max-w-[80px] truncate whitespace-nowrap overflow-hidden dark:text-white">
                          {user.firstName}
                        </td>
                        <td className="px-4 py-4 text-sm align-middle max-w-[80px] truncate whitespace-nowrap overflow-hidden dark:text-white">
                          {user.lastName}
                        </td>
                        <td className="px-4 py-4 text-center align-middle hidden md:table-cell max-w-[100px] truncate whitespace-nowrap overflow-hidden dark:text-white">
                          <span
                            className={`inline-block whitespace-normal break-words px-3 py-1 rounded-full text-sm font-bold shadow-sm border
                            ${
                              user.role === "ADMIN"
                                ? "bg-purple-100 dark:bg-purple-800/60 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700"
                                : user.role === "EXPERT"
                                ? "bg-blue-100 dark:bg-blue-800/60 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700"
                                : "bg-green-100 dark:bg-green-800/60 text-green-800 dark:text-green-100 border-green-200 dark:border-green-700"
                            }
                          `}
                            style={{ minWidth: 80 }}
                          >
                            {translateRole(user.role)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center align-middle hidden md:table-cell max-w-[100px] truncate whitespace-nowrap overflow-hidden dark:text-white">
                          <span
                            className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-sm font-bold text-center whitespace-nowrap shadow-sm border
                          ${
                            user.status === "ACTIVE"
                              ? "bg-green-100 dark:bg-green-800/60 text-green-700 dark:text-green-100 border-green-200 dark:border-green-700"
                              : user.status === "BANNED"
                              ? "bg-red-100 dark:bg-red-800/60 text-red-700 dark:text-red-100 border-red-200 dark:border-red-700"
                              : "bg-gray-200 dark:bg-gray-700/60 text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          }
                        `}
                          >
                            {user.status === "ACTIVE" ? (
                              <svg
                                className="w-4 h-4 mr-1 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : user.status === "BANNED" ? (
                              <svg
                                className="w-4 h-4 mr-1 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 mr-1 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                            {translateStatus(user.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center align-middle hidden md:table-cell max-w-[120px] truncate whitespace-nowrap overflow-hidden dark:text-white">
                          {user.phone}
                        </td>
                        <td className="px-4 py-4 text-center h-full align-middle">
                          <div className="flex gap-2 justify-center items-center h-full">
                            <button
                              className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-sm transition-all text-base"
                              data-tooltip-id="tooltip-sua"
                              data-tooltip-content={t("editUser")}
                              onClick={() => handleEdit(user)}
                            >
                              <svg
                                width="1.2em"
                                height="1.2em"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M17.414 2.586a2 2 0 00-2.828 0l-9.9 9.9A2 2 0 004 14v2a2 2 0 002 2h2a2 2 0 001.414-.586l9.9-9.9a2 2 0 000-2.828l-2.828-2.828zM5 16v-1.586l9.293-9.293 1.586 1.586L6.586 16H5zm2 0h1.586l9.293-9.293-1.586-1.586L7 14.414V16z"></path>
                              </svg>
                              {t("edit")}
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-sm transition-all text-base"
                              data-tooltip-id="tooltip-xoa"
                              data-tooltip-content={t("deleteUser")}
                              onClick={() => handleDelete(user.id)}
                            >
                              <svg
                                width="1.2em"
                                height="1.2em"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M6 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1z"></path>
                                <path
                                  fillRule="evenodd"
                                  d="M4 6a1 1 0 011-1h10a1 1 0 011 1v1H4V6zm2-3a1 1 0 00-1 1v1h10V4a1 1 0 00-1-1H6z"
                                  clipRule="evenodd"
                                ></path>
                              </svg>
                              {t("delete")}
                            </button>
                            <ReactTooltip
                              id="tooltip-sua"
                              place="top"
                              effect="solid"
                            />
                            <ReactTooltip
                              id="tooltip-xoa"
                              place="top"
                              effect="solid"
                            />
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
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full min-w-[320px] mx-4 transition-all duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-extrabold text-blue-600 text-center w-full tracking-wide">
                  {isEdit ? t("editUser") : t("addUser")}
                </h2>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 text-2xl font-bold absolute right-8 top-8"
                  onClick={() => {
                    setShowModal(false);
                    setFormErrors("");
                  }}
                >
                  ✕
                </button>
              </div>

              {formErrors && (
                <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg">
                  <p className="text-red-700 font-medium flex items-center text-base">
                    <FaExclamationTriangle className="mr-2 text-xl" />
                    {formErrors}
                  </p>
                </div>
              )}

              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      {t("emailHeader")}
                    </label>
                    <input
                      type="email"
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-base"
                      value={modalUser.email || ""}
                      onChange={(e) =>
                        setModalUser({ ...modalUser, email: e.target.value })
                      }
                      placeholder={t("email")}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      {t("phoneHeader")}
                    </label>
                    <input
                      type="tel"
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-base"
                      value={modalUser.phone || ""}
                      onChange={(e) =>
                        setModalUser({ ...modalUser, phone: e.target.value })
                      }
                      placeholder={t("phone")}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      {t("firstNameHeader")}
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-base"
                      value={modalUser.firstName || ""}
                      onChange={(e) =>
                        setModalUser({
                          ...modalUser,
                          firstName: e.target.value,
                        })
                      }
                      placeholder={t("firstName")}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      {t("lastNameHeader")}
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-base"
                      value={modalUser.lastName || ""}
                      onChange={(e) =>
                        setModalUser({ ...modalUser, lastName: e.target.value })
                      }
                      placeholder={t("lastName")}
                    />
                  </div>
                  {!isEdit && (
                    <div>
                      <label className="block text-gray-700 text-base font-medium mb-2">
                        {t("passwordLabel")}
                      </label>
                      <input
                        type="password"
                        className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-base"
                        value={modalUser.password || ""}
                        onChange={(e) =>
                          setModalUser({
                            ...modalUser,
                            password: e.target.value,
                          })
                        }
                        placeholder={t("password")}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      {t("roleHeader")}
                    </label>
                    <select
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-base bg-white"
                      value={modalUser.role}
                      onChange={(e) =>
                        setModalUser({ ...modalUser, role: e.target.value })
                      }
                    >
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value}>
                          {t(r.value.toLowerCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      {t("statusHeader")}
                    </label>
                    <select
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-base bg-white"
                      value={modalUser.status}
                      onChange={(e) =>
                        setModalUser({ ...modalUser, status: e.target.value })
                      }
                    >
                      <option value="ACTIVE">{t("active")}</option>
                      <option value="INACTIVE">{t("inactive")}</option>
                      <option value="BANNED">{t("banned")}</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all text-base shadow"
                    onClick={() => setShowModal(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all text-base shadow-lg"
                    disabled={saving}
                  >
                    {isEdit ? t("update") : t("add")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-sm text-center">
              <h2 className="text-xl font-bold mb-4">{t("confirmDelete")}</h2>
              <p>{t("confirmDeleteMessage")}</p>
              <div className="flex justify-center gap-4 mt-6">
                <button
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
                  onClick={() => setConfirmDelete(false)}
                  disabled={saving}
                >
                  {t("cancel")}
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold"
                  onClick={confirmDeleteUser}
                  disabled={saving}
                >
                  {saving ? t("deleting") : t("delete")}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Pagination: luôn hiển thị, kể cả khi chỉ có 1 trang */}
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
            aria-label="Trang trước"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 15l-5-5 5-5" />
            </svg>
          </button>
          {/* Số trang rút gọn */}
          {getPagination(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span
                key={idx}
                className="w-10 h-10 flex items-center justify-center text-xl text-gray-400 select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
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
            aria-label="Trang sau"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 5l5 5-5 5" />
            </svg>
          </button>
        </div>
        {/* Alert thông báo nổi góc trên phải */}
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
      </div>
      <FooterSection />
    </div>
  );
}
/* eslint-enable no-unused-vars */
