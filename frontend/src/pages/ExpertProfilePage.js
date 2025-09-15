import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaArrowLeft, FaBrain } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";

import { authFetch } from "../authFetch";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import {
  updateUserAvatarData,
  updateUserAndToken,
} from "../utils/userUpdateUtils";

import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import ProfileForm from "../components/ProfileForm";

export default function ExpertProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  // Không cần lấy updateUserAvatar từ navigation state nữa
  const [user, setUser] = useState(() => {
    let userObj = {
      firstName: "",
      lastName: "",
      email: "",
      role: t("roleExpert"),
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
        userObj.role = decoded.role || t("roleExpert");
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
      } catch {}
    }
    return userObj;
  });
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState("");
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Lấy user từ token (fallback)
  const [profile, setProfile] = useState(() => {
    let userObj = {
      firstName: "",
      lastName: "",
      email: "",
      role: t("roleExpert"),
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
        userObj.role = decoded.role || t("roleExpert");
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
      } catch {}
    }
    return userObj;
  });

  // Lấy dữ liệu mới nhất từ backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        // Gọi API profile trực tiếp
        const res = await authFetch("/api/expert/profile");
        if (!res.ok) throw new Error("Failed to fetch expert profile");
        const updatedUser = await res.json();

        // Cập nhật profile state với thông tin mới nhất
        const updatedProfile = {
          firstName: updatedUser.firstName || "",
          lastName: updatedUser.lastName || "",
          phone: updatedUser.phone || "",
          email: updatedUser.email || "",
          role: updatedUser.role || t("roleExpert"),
          createdAt: updatedUser.createdAt
            ? new Date(updatedUser.createdAt).toLocaleString()
            : "",
          avatar: updatedUser.avatarUrl || null,
          avatarUrl: updatedUser.avatarUrl || null,
          plan: updatedUser.plan || "FREE",
          planStartDate: updatedUser.planStartDate || null,
          planExpiryDate: updatedUser.planExpiryDate || null,
        };

        setProfile(updatedProfile);

        // Cập nhật user object với dữ liệu mới nhất
        setUser(updatedProfile);
      } catch (err) {
        // Fallback: gọi API profile nếu refreshToken fail
        try {
          const res = await authFetch("/api/expert/profile");
          if (!res.ok) throw new Error("Failed to fetch expert profile");
          const data = await res.json();
          const updatedProfile = {
            ...user,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: data.phone || "",
            email: data.email || user.email,
            role: data.role || user.role,
            createdAt: data.createdAt
              ? new Date(data.createdAt).toLocaleString()
              : user.createdAt,
            avatar: data.avatarUrl || user.avatar,
            avatarUrl: data.avatarUrl || user.avatarUrl,
            plan: data.plan || "FREE",
            planStartDate: data.planStartDate || null,
            planExpiryDate: data.planExpiryDate || null,
          };
          setProfile(updatedProfile);
          setUser(updatedProfile);
        } catch (fallbackErr) {
          setError(t("fetchExpertError"));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    document.title = t("expertProfileTitle") + " | MindMeter";
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
          const uploadFormData = new FormData();
          uploadFormData.append("avatar", selectedFile);

          // Upload ảnh lên server
          const uploadRes = await authFetch("/api/expert/upload-avatar", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadRes.ok) {
            throw new Error("Upload ảnh thất bại");
          }

          const uploadData = await uploadRes.json();
          updateData.avatarUrl = uploadData.avatarUrl;

          // Cập nhật profile state với avatar mới ngay lập tức
          setProfile((prev) => ({
            ...prev,
            avatar: uploadData.avatarUrl,
            avatarUrl: uploadData.avatarUrl,
          }));

          // Cập nhật user data với avatar mới
          updateUserAvatarData(setUser, uploadData.avatarUrl);
        } catch (uploadError) {
          setError("Upload ảnh thất bại: " + uploadError.message);
          setSaving(false);
          return;
        }
      }

      const res = await authFetch("/api/expert/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      const data = await res.json();
      setProfile((prev) => ({ ...prev, ...data }));

      // Cập nhật user data với thông tin profile mới
      updateUserAndToken(setUser, data, formData);

      setAlert(t("updateUserSuccess"));
      setIsEdit(false);

      // Reset selectedFile sau khi cập nhật thành công
      setSelectedFile(null);
    } catch (err) {
      setError(t("updateUserFailed") || "Cập nhật thất bại");
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
    navigate("/expert/dashboard");
  };

  const handleLogoutLocal = () => handleLogout(navigate);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 flex flex-col items-center border border-blue-100 dark:border-gray-700 min-w-[340px] w-full max-w-md">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300" />
        }
        logoText={t("expertProfileTitle")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onLogout={handleLogoutLocal}
      />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 pt-24 pb-12">
        {profile ? (
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
            userRole="EXPERT"
            onBack={handleBack}
            backText={t("backToDashboard")}
            backIcon={FaArrowLeft}
            setError={setError}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 flex flex-col items-center border border-blue-100 dark:border-gray-700 min-w-[340px] w-full max-w-md">
            <div className="text-red-500 text-center">
              <p className="font-semibold">
                {t("fetchExpertError") || "Error loading expert information"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
