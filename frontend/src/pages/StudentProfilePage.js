import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";
import { FaUserCircle, FaArrowLeft, FaBrain } from "react-icons/fa";
import { authFetch } from "../authFetch";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import ProfileForm from "../components/ProfileForm";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import { updateUserAndToken } from "../utils/userUpdateUtils";

export default function StudentProfilePage({ updateUserAvatar }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState("");
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Lấy user từ token (fallback)
  const [user, setUser] = useState(() => {
    let userObj = {
      firstName: "",
      lastName: "",
      email: "",
      role: "STUDENT",
      avatar: null,
      avatarUrl: null,
      createdAt: "",
      phone: "",
      plan: "FREE",
      planStartDate: null,
      planExpiryDate: null,
    };

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userObj.email = decoded.sub || decoded.email || "";
        userObj.role = decoded.role || "STUDENT";
        userObj.firstName = decoded.firstName || "";
        userObj.lastName = decoded.lastName || "";
        userObj.phone = decoded.phone || "";
        userObj.createdAt = decoded.createdAt
          ? new Date(decoded.createdAt).toLocaleString()
          : "";
        if (decoded.avatar) userObj.avatar = decoded.avatar;
        if (decoded.avatarUrl) userObj.avatarUrl = decoded.avatarUrl;
        if (decoded.plan) userObj.plan = decoded.plan;
        if (decoded.planStartDate)
          userObj.planStartDate = decoded.planStartDate;
        if (decoded.planExpiryDate)
          userObj.planExpiryDate = decoded.planExpiryDate;
      } catch (error) {
        // Error decoding token
      }
    }

    return userObj;
  });
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Lấy dữ liệu mới nhất từ backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await authFetch("/api/student/profile");
        if (!res.ok) throw new Error("Failed to fetch student profile");
        const data = await res.json();
        const updatedProfile = {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          email: data.email || "",
          role: data.role || "STUDENT",
          plan: data.plan || "FREE",
          createdAt: data.createdAt
            ? new Date(data.createdAt).toLocaleString()
            : "",
          avatar: data.avatarUrl || null,
          avatarUrl: data.avatarUrl || null,
          planStartDate: data.planStartDate || null,
          planExpiryDate: data.planExpiryDate || null,
        };
        setProfile(updatedProfile);
        setForm({
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          phone: updatedProfile.phone,
        });

        // Cập nhật user state với dữ liệu mới nhất
        setUser(updatedProfile);
      } catch (err) {
        setError(t("fetchStudentError") || t("common.loadStudentInfoError"));
        setForm({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [t]);

  // Kiểm tra token và redirect nếu cần
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // Kiểm tra xem token có hợp lệ không
    try {
      const decoded = jwtDecode(token);
      if (!decoded.sub && !decoded.email) {
        navigate("/");
      }
    } catch (error) {
      // Invalid token
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    document.title = t("studentProfileTitle") + " | MindMeter";
  }, [t]);

  const handleLogoutLocal = () => handleLogout(navigate);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert("");
    setError("");

    try {
      // Tạo object data để gửi lên backend
      const updateData = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      };

      // Nếu có ảnh mới được chọn, upload ảnh trước
      if (selectedFile) {
        try {
          // Tạo FormData để upload file
          const formData = new FormData();
          formData.append("avatar", selectedFile);

          // Upload ảnh lên server
          const uploadRes = await authFetch("/api/student/upload-avatar", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            throw new Error("Upload ảnh thất bại: " + errorText);
          }

          const uploadData = await uploadRes.json();
          updateData.avatarUrl = uploadData.avatarUrl;
        } catch (uploadError) {
          // Upload error
          setError("Lỗi upload ảnh: " + uploadError.message);
          setSaving(false);
          return;
        }
      }

      // Cập nhật thông tin profile
      const res = await authFetch("/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Cập nhật thất bại: " + errorText);
      }

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setAlert(t("updateSuccess") || "Cập nhật thành công!");
      setIsEdit(false);
      setSelectedFile(null);

      // Cập nhật user data với thông tin profile mới
      updateUserAndToken(setUser, updatedProfile, form, updateUserAvatar);
    } catch (err) {
      // Update error
      setError(err.message || "Lỗi cập nhật thông tin");
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
    navigate("/home");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("studentProfileTitle")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onLogout={handleLogoutLocal}
      />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 pt-24 pb-12">
        <ProfileForm
          profile={profile}
          isEdit={isEdit}
          form={form}
          setForm={setForm}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          onSave={handleSave}
          onCancel={handleCancel}
          onEdit={handleEdit}
          saving={saving}
          error={error}
          alert={alert}
          userRole="STUDENT"
          updateUserAvatar={updateUserAvatar}
          onBack={handleBack}
          backText={t("backToHome")}
          backIcon={FaArrowLeft}
          setError={setError}
        />
      </div>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
