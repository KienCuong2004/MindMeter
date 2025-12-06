import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import { FaBrain } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser, getCurrentToken } from "../services/anonymousService";

export default function ContactPage() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // giây còn lại

  // Đồng bộ logic lấy user như các trang public khác - sử dụng useMemo để tránh re-render vô hạn
  const user = useMemo(() => {
    let userObj = null;
    let u = getCurrentUser();
    const token = getCurrentToken();

    // Helper function để tạo name từ firstName và lastName
    const createName = (user) => {
      if (user.name) return user.name;
      if (user.firstName || user.lastName) {
        return (
          (user.firstName || "") + (user.lastName ? " " + user.lastName : "")
        ).trim();
      }
      return "";
    };

    if (u) {
      // Tạo name nếu chưa có
      if (!u.name && (u.firstName || u.lastName)) {
        u.name = createName(u);
      }

      if (u.anonymous === true || u.role === "ANONYMOUS" || u.email === null) {
        u = {
          ...u,
          name: u.name || t("anonymousUser.name"),
          anonymous: true,
          role: u.role || "STUDENT",
        };
      }
      userObj = u;
    } else if (token) {
      try {
        const decoded = jwtDecode(token);
        let decodedUser = {};
        decodedUser.name = (
          (decoded.firstName || "") +
          (decoded.lastName ? " " + decoded.lastName : "")
        ).trim();
        decodedUser.email = decoded.sub || decoded.email || "";
        if (!decodedUser.name)
          decodedUser.name = decodedUser.email || "Student";
        if (decoded.avatar) decodedUser.avatar = decoded.avatar;
        if (decoded.role) decodedUser.role = decoded.role;
        if (decoded.anonymous) decodedUser.anonymous = true;
        if (decodedUser.anonymous && !decodedUser.role)
          decodedUser.role = "STUDENT";
        if (decodedUser.anonymous && !decodedUser.name)
          decodedUser.name = t("anonymousUser.name");
        userObj = decodedUser;
      } catch {}
    }
    return userObj;
  }, [t]);

  // Tự động điền họ tên và email nếu đã đăng nhập
  useEffect(() => {
    if (user && user.email) {
      // Tạo name từ firstName và lastName nếu name chưa có
      let userName = user.name;
      if (!userName && (user.firstName || user.lastName)) {
        userName = (
          (user.firstName || "") + (user.lastName ? " " + user.lastName : "")
        ).trim();
      }

      setForm((prev) => {
        // Chỉ update nếu giá trị thực sự thay đổi để tránh re-render vô hạn
        const newName = userName || "";
        const newEmail = user.email || "";
        if (prev.name === newName && prev.email === newEmail) {
          return prev;
        }
        return {
          ...prev,
          name: newName,
          email: newEmail,
        };
      });
    }
  }, [user]);

  // Kiểm tra cooldown khi load trang
  useEffect(() => {
    const lastSent = localStorage.getItem("contact_last_sent");
    if (lastSent) {
      const diff = Math.floor((Date.now() - Number(lastSent)) / 1000);
      if (diff < 300) {
        setCooldown(300 - diff);
        const interval = setInterval(() => {
          const newDiff = Math.floor((Date.now() - Number(lastSent)) / 1000);
          if (newDiff >= 300) {
            setCooldown(0);
            clearInterval(interval);
          } else {
            setCooldown(300 - newDiff);
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, []);

  // Đặt title động theo ngôn ngữ
  useEffect(() => {
    document.title =
      i18n.language === "vi" ? t("pageTitles.contact") : "Contact | MindMeter";
  }, [i18n.language, t]);

  // Đảm bảo clear interval khi unmount
  useEffect(() => {
    return () => {
      if (window.contactCooldownInterval)
        clearInterval(window.contactCooldownInterval);
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError(t("contact.required"));
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (cooldown > 0) {
      setError(t("contact.cooldownMessage"));
      setTimeout(() => setError(""), 2500);
      return;
    }
    try {
      setIsSending(true);
      const token = localStorage.getItem("token");
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(t("contact.sent"));
        setForm((prev) => ({ ...prev, message: "" }));
        const now = Date.now();
        localStorage.setItem("contact_last_sent", now);
        setCooldown(300);
        // Khởi động lại interval đếm ngược cooldown
        if (window.contactCooldownInterval)
          clearInterval(window.contactCooldownInterval);
        window.contactCooldownInterval = setInterval(() => {
          const diff = Math.floor((Date.now() - now) / 1000);
          if (diff >= 300) {
            setCooldown(0);
            clearInterval(window.contactCooldownInterval);
          } else {
            setCooldown(300 - diff);
          }
        }, 1000);
        setTimeout(() => setSuccess(""), 2500);
      } else {
        setError(
          t("contact.error") || "Gửi liên hệ thất bại. Vui lòng thử lại."
        );
        setTimeout(() => setError(""), 2500);
      }
    } catch (err) {
      setError(t("contact.error") || "Gửi liên hệ thất bại. Vui lòng thử lại.");
      setTimeout(() => setError(""), 2500);
    } finally {
      setIsSending(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("contact.title")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onLogout={() => handleLogout(navigate)}
      />
      <main className="flex-grow flex items-center justify-center pt-28 pb-8">
        <div className="max-w-4xl w-full flex flex-col md:flex-row items-center bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-blue-100 dark:border-gray-800 animate-fade-in">
          <div className="w-full md:w-1/2 flex justify-center items-center p-4">
            <img
              src="/src/assets/images/Contact.png"
              alt="Contact"
              className="object-contain w-full max-h-64 rounded-xl"
              style={{ aspectRatio: "1/1" }}
            />
          </div>
          <div className="w-full md:w-1/2 p-6">
            <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-4">
              {t("contact.title")}
            </h1>
            <p className="mb-6 text-gray-700 dark:text-gray-200">
              {t("contact.desc")}
            </p>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 mb-1">
                <span className="font-semibold">Email:</span>
                <span>trankiencuong30072003@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <span className="font-semibold">Facebook:</span>
                <a
                  href="https://www.facebook.com/KienCuong2003"
                  className="text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MindMeter
                </a>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium text-gray-800 dark:text-gray-100">
                  {t("contact.name")}
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-800 dark:text-gray-100">
                  {t("contact.email")}
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-800 dark:text-gray-100">
                  {t("contact.message")}
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              {success && (
                <div className="text-green-600 text-sm">{success}</div>
              )}
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSending || cooldown > 0}
              >
                {isSending ? t("contact.sending") : t("contact.send")}
              </button>
            </form>
            {cooldown > 0 && (
              <div className="text-yellow-600 text-sm mt-2">
                {t("contact.cooldown", {
                  time:
                    Math.floor(cooldown / 60) +
                    ":" +
                    ("0" + (cooldown % 60)).slice(-2),
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
