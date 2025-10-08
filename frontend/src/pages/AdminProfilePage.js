import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";
import {
  FaUserCircle,
  FaArrowLeft,
  FaBrain,
  FaExclamationTriangle,
} from "react-icons/fa";
import { authFetch } from "../authFetch";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import ProfileForm from "../components/ProfileForm";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import {
  updateUserAvatarData,
  updateUserAndToken,
} from "../utils/userUpdateUtils";

export default function AdminProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  // Không cần lấy updateUserAvatar từ navigation state nữa
  const [user, setUser] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState("");
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

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

  const [profile, setProfile] = useState(null);

  // Lấy dữ liệu mới nhất từ backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await authFetch("/api/admin/profile");
        if (!res.ok) throw new Error("Failed to fetch admin profile");
        const data = await res.json();
        const updatedProfile = {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          email: data.email || "",
          role: data.role || "ADMIN",
          createdAt: data.createdAt
            ? new Date(data.createdAt).toLocaleString()
            : "",
          avatar: data.avatarUrl || null,
          avatarUrl: data.avatarUrl || null,
          plan: data.plan || "FREE",
          planStartDate: data.planStartDate || null,
          planExpiryDate: data.planExpiryDate || null,
        };
        setProfile(updatedProfile);
        // Cập nhật user state nếu user đã tồn tại
        if (user) {
          setUser((prev) => ({ ...prev, ...updatedProfile }));
        }
      } catch (err) {
        // Error fetching profile
        setError(t("fetchAdminError") || t("errors.cannotLoadAdminInfo"));
        // Tạo profile từ user data nếu có
        if (user) {
          const fallbackProfile = {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            email: user.email || "",
            role: user.role || "ADMIN",
            createdAt: "",
            avatar: user.avatar || user.avatarUrl || null,
            avatarUrl: user.avatarUrl || user.avatar || null,
            plan: user.plan || "FREE",
            planStartDate: null,
            planExpiryDate: null,
          };
          setProfile(fallbackProfile);
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch profile ngay khi component mount
    fetchProfile();
  }, [t]);

  useEffect(() => {
    document.title = t("adminProfileTitle") + " | MindMeter";
  }, [t]);

  const handleSave = async (formData) => {
    setSaving(true);
    setAlert("");
    setError("");

    try {
      // Tạo object data để gửi lên backend
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      // Nếu có ảnh mới được chọn, upload ảnh trước
      if (selectedFile) {
        try {
          // Tạo FormData để upload file
          const formData = new FormData();
          formData.append("avatar", selectedFile);

          // Upload ảnh lên server
          const uploadRes = await authFetch("/api/admin/upload-avatar", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            throw new Error(
              t("adminProfile.uploadImageFailed") + " " + errorText
            );
          }

          const uploadData = await uploadRes.json();
          updateData.avatarUrl = uploadData.avatarUrl;

          // Cập nhật profile state với avatar mới ngay lập tức
          setProfile((prev) => {
            const updatedProfile = {
              ...prev,
              avatar: uploadData.avatarUrl,
              avatarUrl: uploadData.avatarUrl,
            };
            return updatedProfile;
          });

          // Cập nhật user data với avatar mới
          updateUserAvatarData(setUser, uploadData.avatarUrl);
        } catch (uploadError) {
          setError(
            t("adminProfile.uploadImageFailed") + " " + uploadError.message
          );
          setSaving(false);
          return;
        }
      }

      const res = await authFetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error(t("adminProfile.updateFailed"));
      const data = await res.json();
      setProfile((prev) => ({ ...prev, ...data }));

      // Cập nhật user data với thông tin profile mới
      updateUserAndToken(setUser, data, formData);

      setAlert(t("updateAdminSuccess") || t("adminProfile.updateSuccess"));
      setIsEdit(false);

      // Reset selectedFile sau khi cập nhật thành công
      setSelectedFile(null);
    } catch (err) {
      setError(t("updateAdminFailed") || t("adminProfile.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEdit(false);
    setAlert("");
    setSelectedFile(null);
    setError("");
  };

  const handleEdit = () => {
    setIsEdit(true);
    setAlert("");
    setError("");
  };

  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 flex flex-col items-center border border-blue-100 dark:border-gray-700 min-w-[340px] max-w-md w-full mx-4">
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
              {t("loading")}...
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
      </div>
    );
  }

  // Nếu không có profile và có lỗi, hiển thị thông báo lỗi
  if (!profile && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 flex flex-col items-center border border-blue-100 dark:border-gray-700 min-w-[340px] max-w-md w-full mx-4">
          <div className="text-red-500 text-6xl mb-4">
            <FaExclamationTriangle />
          </div>
          <div className="text-red-600 dark:text-red-400 text-center font-semibold mb-4">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-blue-600 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("adminProfileTitle")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={() => navigate("/admin/profile")}
        onLogout={() => handleLogout(navigate)}
      />
      <div className="flex flex-col items-center justify-center pt-24">
        <ProfileForm
          profile={profile}
          isEdit={isEdit}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          onSave={handleSave}
          onCancel={handleCancel}
          onEdit={handleEdit}
          saving={saving}
          error={error}
          alert={alert}
          userRole="ADMIN"
          onBack={handleBack}
          backText={t("backToDashboard") || t("adminProfile.backToDashboard")}
          backIcon={FaArrowLeft}
          setError={setError}
        />
      </div>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
