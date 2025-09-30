import React, { useState } from "react";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaGlobe,
  FaChevronDown,
  FaHistory,
  FaCreditCard,
  FaCalendarAlt,
  FaClock,
  FaRocket,
  FaBullseye,
  FaBookmark,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BellIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { authFetch } from "../authFetch";
import { isAnonymousUser } from "../services/anonymousService";
import { THEME_CONSTANTS } from "../constants/theme";
import SavedArticlesBadge from "./SavedArticlesBadge";

// Utility function to handle Google Profile Image URLs
function getOptimizedAvatarUrl(avatarUrl, timestamp = null) {
  if (!avatarUrl) return null;

  let optimizedUrl = avatarUrl;

  // If it's a Google Profile Image, optimize it
  if (avatarUrl.includes("googleusercontent.com")) {
    // Remove size parameters and add our own for better control
    const baseUrl = avatarUrl.split("=")[0];
    optimizedUrl = `${baseUrl}=s96-c`;
  }

  // Add cache-busting parameter if timestamp is provided
  if (timestamp) {
    const separator = optimizedUrl.includes("?") ? "&" : "?";
    // Sử dụng timestamp + random number để đảm bảo URL luôn khác nhau
    const randomId = Math.random().toString(36).substring(7);
    optimizedUrl = `${optimizedUrl}${separator}t=${timestamp}&r=${randomId}`;
  }

  return optimizedUrl;
}

function mergeAndSortNotifications(adviceArr, systemArr) {
  // Chuẩn hóa advice
  const advice = (adviceArr || []).map((n) => ({
    ...n,
    type: "advice",
    isRead: n.isRead !== undefined ? n.isRead : n.read, // Đảm bảo luôn có isRead
    createdAt: n.createdAt || n.sentAt || n.timestamp,
  }));
  // Chuẩn hóa system announcement
  const system = (systemArr || []).map((n) => ({
    ...n,
    type: "system",
    isRead: true, // system announcement luôn coi là đã đọc
    createdAt: n.createdAt,
  }));
  // Gộp và sort
  return [...advice, ...system].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export default function DashboardHeader({
  logoIcon, // React node, ví dụ <FaChartPie ... />
  logoText, // string, ví dụ "MindMeter Admin" hoặc "MindMeter Expert"
  user,
  theme,
  setTheme,
  onNotificationClick,
  onLogout,
  onProfile, // optional
  updateUserAvatar, // optional
  onStartTour, // optional - callback để bắt đầu tour
  className,
}) {
  // Force re-render khi user thay đổi
  const [avatarKey, setAvatarKey] = useState(0);

  // Force refresh avatar khi component mount hoặc user thay đổi
  useEffect(() => {
    if (user) {
      // Lấy avatar timestamp từ localStorage để force refresh
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.avatarTimestamp) {
            setAvatarKey(parsedUser.avatarTimestamp); // Force avatar refresh
          }
        } catch (error) {
          // Error parsing stored user
        }
      }
    }
  }, [user]);

  // Global avatar refresh mechanism
  useEffect(() => {
    const checkAvatarUpdate = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (
            parsedUser.avatarTimestamp &&
            user?.avatarTimestamp !== parsedUser.avatarTimestamp
          ) {
            // Global avatar check: timestamp changed, forcing re-render
            setAvatarKey(parsedUser.avatarTimestamp); // Force avatar refresh
            // Global avatar refresh triggered with timestamp
          }
        } catch (error) {
          // Error parsing stored user in global check
        }
      }
    };

    // Check every 2 seconds for avatar updates
    const interval = setInterval(checkAvatarUpdate, 2000);

    return () => clearInterval(interval);
  }, [user?.avatarTimestamp]);

  // Lắng nghe event avatar update từ các trang khác
  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      // Avatar update event received
      // Force re-render để cập nhật avatar
      setAvatarKey(event.detail.timestamp);

      // Không cần setUser vì user được truyền từ props
      // Avatar sẽ được cập nhật thông qua localStorage
    };

    window.addEventListener("avatarUpdated", handleAvatarUpdate);

    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdate);
    };
  }, []);

  // Monitor localStorage changes for avatar updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user" && e.newValue) {
        try {
          const newUserData = JSON.parse(e.newValue);
          if (
            newUserData.avatarTimestamp &&
            user?.avatarTimestamp !== newUserData.avatarTimestamp
          ) {
            // Avatar timestamp changed, forcing re-render
            setAvatarKey(newUserData.avatarTimestamp);
          }
        } catch (error) {
          // Error parsing user data from storage
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user?.avatarTimestamp]);

  // Sync theme với localStorage
  useEffect(() => {
    if (theme) {
      localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, theme);
    }
  }, [theme]);

  // Initialize theme from localStorage if not provided
  useEffect(() => {
    if (!theme) {
      const savedTheme =
        localStorage.getItem(THEME_CONSTANTS.STORAGE_KEY) ||
        THEME_CONSTANTS.DEFAULT_THEME;
      setTheme(savedTheme);
    }
  }, [theme, setTheme]);

  const [showMenu, setShowMenu] = useState(false);
  const [showIntroMenu, setShowIntroMenu] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNoti, setLoadingNoti] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Fetch notifications khi mở popup
  useEffect(() => {
    if (
      showNotifications &&
      user &&
      user.role === "STUDENT" &&
      !isAnonymousUser(user)
    ) {
      setLoadingNoti(true);
      Promise.all([
        authFetch("/api/advice/received").then((res) =>
          Array.isArray(res)
            ? res
            : res && typeof res.json === "function"
            ? res.json()
            : []
        ),
        authFetch("/api/auth/student/announcements").then((res) =>
          Array.isArray(res)
            ? res
            : res && typeof res.json === "function"
            ? res.json()
            : []
        ),
      ])
        .then(([adviceData, systemData]) => {
          const adviceArr = Array.isArray(adviceData) ? adviceData : [];
          const systemArr = Array.isArray(systemData) ? systemData : [];
          const notiArr = mergeAndSortNotifications(adviceArr, systemArr);
          setNotifications(notiArr);
          // Đếm số chưa đọc dựa trên notiArr đã chuẩn hóa
          setUnreadCount(
            notiArr.filter((n) => n.type === "advice" && !n.isRead).length
          );
          setLoadingNoti(false);
        })
        .catch(() => setLoadingNoti(false));
    }
  }, [showNotifications, user]);

  // Fetch unreadCount khi user thay đổi (vào trang, login, reload...)
  useEffect(() => {
    if (user && user.role === "STUDENT" && !isAnonymousUser(user)) {
      authFetch("/api/advice/received")
        .then((res) =>
          Array.isArray(res)
            ? res
            : res && typeof res.json === "function"
            ? res.json()
            : []
        )
        .then((data) => {
          const adviceArr = Array.isArray(data) ? data : [];
          // Chuẩn hóa adviceArr để lấy đúng isRead
          const mapped = adviceArr.map((n) => ({
            ...n,
            isRead: n.isRead !== undefined ? n.isRead : n.read,
          }));
          setUnreadCount(mapped.filter((n) => !n.isRead).length);
        })
        .catch(() => {});
    } else {
      // Reset unreadCount và notifications cho anonymous users và người chưa đăng nhập
      setUnreadCount(0);
      setNotifications([]);
      setShowNotifications(false);
    }
  }, [user]);

  // Đánh dấu đã đọc
  const markAsRead = (id) => {
    authFetch(`/api/advice/${id}/read`, { method: "PUT" })
      .then(() => {
        setNotifications((prev) => {
          const updated = prev.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return updated;
        });
        setUnreadCount((prev) => Math.max(0, prev - 1));
      })
      .catch(() => {});
  };

  // Đóng notifications khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest("[data-notifications]")) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);
  return (
    <div
      className={
        "fixed top-0 left-0 w-full z-30 flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-12 py-3 sm:py-4 " +
        (theme === "dark"
          ? "bg-gray-900/95 border-gray-700"
          : "bg-white/95 border-gray-200") +
        " backdrop-blur-md shadow-lg rounded-b-2xl border-b animate-fade-in-slow " +
        (className || "")
      }
    >
      {/* Logo + Mobile menu button */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 select-none cursor-pointer flex-1 lg:flex-none min-w-0">
        <div
          className="flex items-center gap-2 sm:gap-3 lg:gap-5 select-none cursor-pointer min-w-0"
          onClick={() => {
            // Điều hướng về trang phù hợp theo role
            if (user?.role === "ADMIN") {
              navigate("/admin/dashboard");
            } else if (user?.role === "EXPERT") {
              navigate("/expert/dashboard");
            } else if (user?.role === "STUDENT") {
              navigate("/home");
            } else {
              navigate("/home");
            }
          }}
        >
          <div className="text-indigo-500 dark:text-indigo-300">{logoIcon}</div>
          <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 dark:from-indigo-300 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide whitespace-nowrap overflow-visible flex-shrink-0">
            {logoText}
          </span>
        </div>
        {/* Mobile menu button - responsive */}
        <div className="flex justify-end lg:hidden ml-2 sm:ml-4">
          <button
            className="p-1.5 sm:p-2 rounded-full hover:bg-blue-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
            onClick={() => setShowMobileMenu((v) => !v)}
            aria-label="Open menu"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Menu ngang: chỉ hiện ở lg trở lên */}
      <div
        id="navigation-menu"
        className="flex-1 justify-center hidden lg:flex min-w-0 ml-8 xl:ml-12"
      >
        <nav className="flex gap-4 xl:gap-6 2xl:gap-8 items-center text-sm xl:text-base font-semibold whitespace-nowrap">
          <span
            className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200 transition-colors whitespace-nowrap"
            onClick={() => {
              // Điều hướng về trang phù hợp theo role
              if (user?.role === "ADMIN") {
                navigate("/admin/dashboard");
              } else if (user?.role === "EXPERT") {
                navigate("/expert/dashboard");
              } else if (user?.role === "STUDENT") {
                navigate("/home");
              } else {
                navigate("/home");
              }
            }}
          >
            {t("navHome")}
          </span>
          <div
            className="relative"
            onMouseEnter={() => setShowIntroMenu(true)}
            onMouseLeave={() => setShowIntroMenu(false)}
          >
            <span
              className={
                "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-gray-700 dark:text-gray-200 transition-colors whitespace-nowrap " +
                (showIntroMenu ? "text-blue-600 dark:text-blue-400" : "")
              }
            >
              {t("navAbout")}{" "}
              <FaChevronDown className="inline text-xs mt-0.5" />
            </span>
            {/* Dropdown About */}
            {showIntroMenu && (
              <>
                <div
                  className="absolute left-0 top-full w-full h-3 z-40"
                  onMouseEnter={() => setShowIntroMenu(true)}
                  onMouseLeave={() => setShowIntroMenu(false)}
                />
                <div
                  className="absolute left-0 top-[calc(100%+12px)] bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 min-w-[220px] z-50 border border-gray-200 dark:border-gray-700"
                  onMouseEnter={() => setShowIntroMenu(true)}
                  onMouseLeave={() => setShowIntroMenu(false)}
                >
                  <div
                    className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
                    onClick={() => {
                      navigate("/privacy-policy");
                      setShowIntroMenu(false);
                    }}
                  >
                    {t("navPrivacyPolicy")}
                  </div>
                  <div
                    className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
                    onClick={() => {
                      navigate("/terms-of-use");
                      setShowIntroMenu(false);
                    }}
                  >
                    {t("navTermsOfUse")}
                  </div>
                  <div
                    className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
                    onClick={() => {
                      navigate("/user-guide");
                      setShowIntroMenu(false);
                    }}
                  >
                    {t("navUserGuide")}
                  </div>
                  <div
                    className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
                    onClick={() => {
                      navigate("/disclaimer");
                      setShowIntroMenu(false);
                    }}
                  >
                    {t("navDisclaimer")}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Chỉ hiển thị "Danh sách bài khảo sát" cho STUDENT và ANONYMOUS */}
          {(!user || user.role === "STUDENT" || isAnonymousUser(user)) && (
            <span
              className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200 transition-colors whitespace-nowrap"
              onClick={() => {
                function smoothScrollTo(element) {
                  if (!element) return;
                  const headerOffset = 90; // adjust if needed
                  const elementPosition =
                    element.getBoundingClientRect().top + window.pageYOffset;
                  const offsetPosition = elementPosition - headerOffset;
                  const start = window.pageYOffset;
                  const distance = offsetPosition - start;
                  const duration = 900; // ms, slower scroll
                  let startTime = null;
                  function animation(currentTime) {
                    if (startTime === null) startTime = currentTime;
                    const timeElapsed = currentTime - startTime;
                    const run = ease(timeElapsed, start, distance, duration);
                    window.scrollTo(0, run);
                    if (timeElapsed < duration)
                      requestAnimationFrame(animation);
                  }
                  function ease(t, b, c, d) {
                    t /= d / 2;
                    if (t < 1) return (c / 2) * t * t + b;
                    t--;
                    return (-c / 2) * (t * (t - 2) - 1) + b;
                  }
                  requestAnimationFrame(animation);
                }
                if (window.location.pathname === "/home") {
                  const el = document.getElementById("test-section");
                  smoothScrollTo(el);
                } else {
                  navigate("/home#test-section");
                  setTimeout(() => {
                    const el = document.getElementById("test-section");
                    smoothScrollTo(el);
                  }, 400);
                }
              }}
            >
              {t("navTestList")}
            </span>
          )}
          {/* Blog link - chỉ hiển thị cho user đã đăng nhập (không phải anonymous) */}
          {user && !user.anonymous && (
            <span
              className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200 transition-colors whitespace-nowrap"
              onClick={() => navigate("/blog")}
            >
              {t("navBlog")}
            </span>
          )}
          <span
            className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200 transition-colors whitespace-nowrap"
            onClick={() => navigate("/contact")}
          >
            {t("navContact")}
          </span>
          {/* Nút bắt đầu tour - chỉ hiển thị cho STUDENT (không phải anonymous) và chỉ trên trang Home */}
          {user &&
            user.role === "STUDENT" &&
            !isAnonymousUser(user) &&
            onStartTour &&
            window.location.pathname === "/home" && (
              <button
                className="px-3 py-1.5 xl:px-4 xl:py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-xs xl:text-sm whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onStartTour();
                }}
              >
                <FaBullseye
                  className="inline-block mr-1 xl:mr-2 -mt-0.5"
                  size={14}
                />
                <span className="hidden xl:inline">{t("tour.startTour")}</span>
                <span className="xl:hidden">Tour</span>
              </button>
            )}
        </nav>
      </div>
      {/* Mobile menu - responsive */}
      {showMobileMenu && (
        <div className="absolute top-14 sm:top-16 left-0 w-full bg-white dark:bg-gray-900 shadow-lg z-50 flex flex-col items-center py-3 sm:py-4 animate-fade-in lg:hidden">
          {/* Main nav items - responsive */}
          <span
            className="py-2 sm:py-3 w-full text-center font-semibold text-base sm:text-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
            onClick={() => {
              // Điều hướng về dashboard tương ứng với role thay vì về home
              if (user?.role === "ADMIN") {
                navigate("/admin/dashboard");
              } else if (user?.role === "EXPERT") {
                navigate("/expert/dashboard");
              } else if (user?.role === "STUDENT") {
                navigate("/student/dashboard");
              } else {
                navigate("/home");
              }
              setShowMobileMenu(false);
            }}
          >
            {t("navHome")}
          </span>
          <div className="w-full border-t border-gray-200 dark:border-gray-700 my-1" />
          <span
            className="py-2 sm:py-3 w-full text-center font-semibold text-base sm:text-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 text-gray-900 dark:text-gray-100 transition-colors"
            onClick={() => setShowIntroMenu((v) => !v)}
          >
            {t("navAbout")} <FaChevronDown className="inline text-xs mt-0.5" />
          </span>
          {showIntroMenu && (
            <div className="w-full flex flex-col items-center">
              <span
                className="py-1.5 sm:py-2 w-full text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors text-sm sm:text-base"
                onClick={() => {
                  navigate("/privacy-policy");
                  setShowIntroMenu(false);
                  setShowMobileMenu(false);
                }}
              >
                {t("navPrivacyPolicy")}
              </span>
              <span
                className="py-1.5 sm:py-2 w-full text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors text-sm sm:text-base"
                onClick={() => {
                  navigate("/terms-of-use");
                  setShowIntroMenu(false);
                  setShowMobileMenu(false);
                }}
              >
                {t("navTermsOfUse")}
              </span>
              <span
                className="py-1.5 sm:py-2 w-full text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors text-sm sm:text-base"
                onClick={() => {
                  navigate("/user-guide");
                  setShowIntroMenu(false);
                  setShowMobileMenu(false);
                }}
              >
                {t("navUserGuide")}
              </span>
              <span
                className="py-1.5 sm:py-2 w-full text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors text-sm sm:text-base"
                onClick={() => {
                  navigate("/disclaimer");
                  setShowIntroMenu(false);
                  setShowMobileMenu(false);
                }}
              >
                {t("navDisclaimer")}
              </span>
            </div>
          )}
          <div className="w-full border-t border-gray-200 dark:border-gray-700 my-1" />
          <span
            className="py-2 sm:py-3 w-full text-center font-semibold text-base sm:text-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
            onClick={() => {
              function smoothScrollTo(element) {
                if (!element) return;
                const headerOffset = 90; // adjust if needed
                const elementPosition =
                  element.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerOffset;
                const start = window.pageYOffset;
                const distance = offsetPosition - start;
                const duration = 900; // ms, slower scroll
                let startTime = null;
                function animation(currentTime) {
                  if (startTime === null) startTime = currentTime;
                  const timeElapsed = currentTime - startTime;
                  const run = ease(timeElapsed, start, distance, duration);
                  window.scrollTo(0, run);
                  if (timeElapsed < duration) requestAnimationFrame(animation);
                }
                function ease(t, b, c, d) {
                  t /= d / 2;
                  if (t < 1) return (c / 2) * t * t + b;
                  t--;
                  return (-c / 2) * (t * (t - 2) - 1) + b;
                }
                requestAnimationFrame(animation);
              }
              if (window.location.pathname === "/home") {
                const el = document.getElementById("test-section");
                smoothScrollTo(el);
              } else {
                navigate("/home#test-section");
                setTimeout(() => {
                  const el = document.getElementById("test-section");
                  smoothScrollTo(el);
                }, 400);
              }
              setShowMobileMenu(false);
            }}
          >
            {t("navTestList")}
          </span>
          <div className="w-full border-t border-gray-200 dark:border-gray-700 my-1" />
          {/* Blog link - chỉ hiển thị cho user đã đăng nhập (không phải anonymous) */}
          {user && !user.anonymous && (
            <span
              className="py-2 sm:py-3 w-full text-center font-semibold text-base sm:text-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              onClick={() => {
                navigate("/blog");
                setShowMobileMenu(false);
              }}
            >
              {t("navBlog")}
            </span>
          )}
          <span
            className="py-2 sm:py-3 w-full text-center font-semibold text-base sm:text-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
            onClick={() => {
              navigate("/contact");
              setShowMobileMenu(false);
            }}
          >
            {t("navContact")}
          </span>

          {/* Nút nâng cấp tài khoản cho user anonymous trong mobile menu */}
          {isAnonymousUser(user) && (
            <>
              <div className="w-full border-t border-gray-200 dark:border-gray-700 my-1" />
              <span
                className="py-2 sm:py-3 w-full text-center font-semibold text-base sm:text-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                onClick={() => {
                  // Gọi callback để mở modal nâng cấp
                  if (window.handleUpgradeClick) {
                    window.handleUpgradeClick();
                  }
                  setShowMobileMenu(false);
                }}
              >
                <FaRocket className="inline-block w-4 h-4 mr-2" />
                {t("anonymous.banner.upgrade")}
              </span>
            </>
          )}

          {/* Nút Bắt đầu hướng dẫn cho STUDENT trong mobile menu (không phải anonymous) và chỉ trên trang Home */}
          {user &&
            user.role === "STUDENT" &&
            !isAnonymousUser(user) &&
            onStartTour &&
            window.location.pathname === "/home" && (
              <>
                <div className="w-full border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  className="py-2 sm:py-3 w-full text-center font-semibold text-base sm:text-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors"
                  onClick={() => {
                    onStartTour();
                    setShowMobileMenu(false);
                  }}
                >
                  <FaBullseye className="inline-block w-4 h-4 mr-2" />
                  {t("tour.startTour")}
                </button>
              </>
            )}
        </div>
      )}
      {/* Right section - responsive */}
      <div className="relative items-center gap-1 sm:gap-2 md:gap-4 lg:gap-6 select-none flex ml-2 sm:ml-4 xl:ml-6">
        {/* Nếu không có user, hiển thị nút Đăng nhập/Đăng ký */}
        {!user ? (
          <div className="flex gap-1 sm:gap-2 md:gap-3">
            <button
              className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 xl:px-5 xl:py-2 rounded-full font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all duration-200 text-xs sm:text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/login");
              }}
            >
              <span className="hidden sm:inline">{t("login")}</span>
              <span className="sm:hidden">ĐN</span>
            </button>
            <button
              className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 xl:px-5 xl:py-2 rounded-full font-semibold border border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 shadow-md hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 text-xs sm:text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/register");
              }}
            >
              <span className="hidden sm:inline">{t("register")}</span>
              <span className="sm:hidden">ĐK</span>
            </button>
          </div>
        ) : (
          // ...avatar/menu như cũ...
          <>
            {/* Icon chuông - chỉ hiển thị cho STUDENT users (không phải anonymous) */}
            {user && user.role === "STUDENT" && !isAnonymousUser(user) && (
              <button
                className="relative focus:outline-none mr-2 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  if (onNotificationClick) {
                    onNotificationClick();
                  } else {
                    setShowNotifications((v) => !v);
                  }
                  setShowMenu(false);
                }}
                aria-label="Notifications"
                data-notifications
              >
                <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 text-blue-500 dark:text-blue-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[18px] h-[18px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Thông báo cho anonymous users và người chưa đăng nhập */}
            {(!user || isAnonymousUser(user)) && (
              <button
                className="relative focus:outline-none mr-2"
                onClick={() => {
                  if (onNotificationClick) {
                    onNotificationClick();
                  } else {
                    setShowNotifications((v) => !v);
                  }
                  setShowMenu(false);
                }}
                aria-label="Notifications"
                data-notifications
              >
                <div className="w-7 h-7 relative">
                  {/* Icon chuông với dấu gạch chéo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BellIcon className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                  </div>
                  {/* Dấu gạch chéo đỏ */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-0.5 bg-red-500 transform rotate-45"></div>
                  </div>
                </div>
              </button>
            )}
            {/* Khối avatar + tên + mũi tên - responsive */}
            <div
              id="user-menu"
              className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-1 sm:px-2 py-1 transition-colors"
              onClick={() => {
                setShowMenu((v) => !v);
                setShowNotifications(false);
              }}
            >
              {/* Container cho avatar với VIP badge */}
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    key={`avatar-${user.avatarUrl}-${avatarKey}`}
                    src={getOptimizedAvatarUrl(user.avatarUrl, avatarKey)}
                    alt="avatar"
                    className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 border-2 shadow hover:scale-105 transition ${
                      user.plan === "PRO"
                        ? "rounded-2xl border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/50 ring-2 ring-purple-300/30 dark:ring-purple-600/30"
                        : user.plan === "PLUS"
                        ? "rounded-full border-green-500 dark:border-green-400 shadow-lg shadow-green-200 dark:shadow-green-900/50"
                        : "rounded-full border-indigo-400 dark:border-indigo-300"
                    }`}
                    onError={(e) => {
                      // Fallback to default avatar icon
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                    onLoad={(e) => {
                      // Hide fallback icon when avatar loads successfully
                      e.target.nextSibling.style.display = "none";
                      // Avatar loaded successfully
                    }}
                    onLoadStart={() => {
                      // Avatar loading started
                    }}
                  />
                ) : null}

                {/* Fallback avatar icon - always present but conditionally shown */}
                <FaUserCircle
                  className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 text-indigo-400 dark:text-indigo-300 bg-white dark:bg-gray-800 border-2 shadow hover:scale-105 transition ${
                    user.plan === "PRO"
                      ? "rounded-2xl border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/50 ring-2 ring-purple-300/30 dark:ring-purple-600/30"
                      : user.plan === "PLUS"
                      ? "rounded-full border-green-500 dark:border-green-400 shadow-lg shadow-green-200 dark:shadow-green-900/50"
                      : "rounded-full border-indigo-200 dark:border-indigo-300"
                  }`}
                  style={{ display: user.avatarUrl ? "none" : "block" }}
                />

                {/* VIP Badge cho user có gói PRO */}
                {user.plan === "PRO" && (
                  <div className="absolute -top-0.5 -left-0.5 sm:-top-1 sm:-left-1 md:-top-2 md:-left-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 xl:w-6 xl:h-6 animate-pulse">
                    <img
                      src="/src/assets/images/VIP.png"
                      alt="VIP"
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                )}
              </div>

              {/* Tên user - responsive visibility */}
              <span className="hidden md:block font-semibold text-gray-800 dark:text-gray-200 mr-1 xl:mr-2 transition-colors text-sm xl:text-base truncate max-w-[100px] md:max-w-[120px] xl:max-w-[200px]">
                {isAnonymousUser(user)
                  ? t("anonymousUserName")
                  : user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`.trim()
                  : user.firstName ||
                    user.lastName ||
                    user.email ||
                    "MindMeter App"}
              </span>
              <FaChevronDown className="text-indigo-500 dark:text-indigo-300 w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4" />
            </div>
            {showMenu && (
              <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 min-w-[180px] py-2 animate-fade-in z-50">
                {/* Nút nâng cấp tài khoản cho user anonymous */}
                {isAnonymousUser(user) && (
                  <div
                    className="px-4 py-2 flex items-center gap-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Gọi callback để mở modal nâng cấp
                      if (window.handleUpgradeClick) {
                        window.handleUpgradeClick();
                      }
                      setShowMenu(false);
                    }}
                  >
                    <FaCreditCard className="text-green-500 dark:text-green-400" />
                    <span className="font-medium">
                      {t("menu.upgradeAccount")}
                    </span>
                  </div>
                )}

                {!isAnonymousUser(user) && (
                  <div
                    className="px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onProfile) {
                        onProfile();
                      } else if (user.role === "ADMIN") {
                        navigate("/admin/profile", {
                          state: { updateUserAvatar },
                        });
                      } else if (user.role === "EXPERT") {
                        navigate("/expert/profile", {
                          state: { updateUserAvatar },
                        });
                      } else {
                        navigate("/student/profile");
                      }
                      setShowMenu(false);
                    }}
                  >
                    <FaUserCircle className="text-indigo-400 dark:text-indigo-200" />
                    <span>{t("accountInfo")}</span>
                  </div>
                )}
                {user.role === "STUDENT" && !isAnonymousUser(user) && (
                  <div
                    className="px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/student/test-history");
                      setShowMenu(false);
                    }}
                  >
                    <FaHistory className="text-gray-500 dark:text-gray-300" />
                    <span>{t("history")}</span>
                  </div>
                )}
                {/* Bài viết đã lưu - cho tất cả users */}
                <div
                  className="px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/saved-articles");
                    setShowMenu(false);
                  }}
                >
                  <FaBookmark className="text-yellow-500 dark:text-yellow-400" />
                  <span>{t("navSavedArticles")}</span>
                  <SavedArticlesBadge className="ml-auto" />
                </div>
                {/* Lịch làm việc - chỉ cho EXPERT */}
                {user.role === "EXPERT" && !isAnonymousUser(user) && (
                  <div
                    className="px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/expert/schedule");
                      setShowMenu(false);
                    }}
                  >
                    <FaClock className="text-green-500 dark:text-green-400" />
                    <span>{t("scheduleNavigation")}</span>
                  </div>
                )}

                {/* Lịch hẹn - cho STUDENT và EXPERT */}
                {(user.role === "STUDENT" || user.role === "EXPERT") &&
                  !isAnonymousUser(user) && (
                    <div
                      className="px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (user.role === "EXPERT") {
                          navigate("/expert/appointments");
                        } else {
                          navigate("/appointments");
                        }
                        setShowMenu(false);
                      }}
                    >
                      <FaCalendarAlt className="text-blue-500 dark:text-blue-400" />
                      <span>{t("appointments")}</span>
                    </div>
                  )}
                {(user.role === "STUDENT" ||
                  user.role === "ADMIN" ||
                  user.role === "EXPERT") &&
                  !isAnonymousUser(user) && (
                    <div
                      className="px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/pricing");
                        setShowMenu(false);
                      }}
                    >
                      <FaCreditCard className="text-green-500 dark:text-green-400" />
                      <span>{t("pricingPackages")}</span>
                    </div>
                  )}
                <div
                  className="px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTheme = theme === "dark" ? "light" : "dark";

                    // Update local state first
                    setTheme(newTheme);

                    // Update localStorage
                    localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, newTheme);

                    // Emit custom event với delay để đảm bảo state đã update
                    setTimeout(() => {
                      window.dispatchEvent(
                        new CustomEvent("themeChanged", {
                          detail: { theme: newTheme },
                          bubbles: true,
                          cancelable: true,
                        })
                      );
                    }, 10);

                    // Force DOM update
                    document.documentElement.classList.remove("dark", "light");
                    document.documentElement.classList.add(newTheme);

                    setShowMenu(false);
                  }}
                >
                  {theme === THEME_CONSTANTS.DARK ? (
                    <FaSun className="text-yellow-400" />
                  ) : (
                    <FaMoon className="text-gray-600" />
                  )}
                  <span>
                    {theme === THEME_CONSTANTS.DARK
                      ? t("lightMode")
                      : t("darkMode")}
                  </span>
                </div>
                <div
                  className="px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newLanguage = i18n.language === "vi" ? "en" : "vi";
                    i18n.changeLanguage(newLanguage);

                    // Thông báo cho parent component về việc thay đổi ngôn ngữ
                    if (window.onLanguageChange) {
                      window.onLanguageChange(newLanguage);
                    }

                    setShowMenu(false);
                  }}
                >
                  <FaGlobe className="text-blue-500" />
                  <span>
                    {i18n.language === "vi"
                      ? t("switchToEnglish")
                      : t("switchToVietnamese")}
                  </span>
                </div>
                <div
                  className="px-4 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Reset notifications trước khi logout
                    setShowNotifications(false);
                    setNotifications([]);
                    setUnreadCount(0);
                    onLogout();
                    setShowMenu(false);
                  }}
                >
                  <FaSignOutAlt className="text-red-500" />
                  <span>{t("logout")}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Popup notification */}
      {showNotifications && (
        <div
          className="absolute right-0 top-full mt-0.5 w-96 max-w-[90vw] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-60 animate-fade-in"
          data-notifications
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-lg text-blue-700 dark:text-blue-300">
            {t("notification.title")}
          </div>

          {/* Hiển thị thông báo khác nhau dựa trên loại user */}
          {!user || isAnonymousUser(user) ? (
            // Thông báo cho anonymous users và người chưa đăng nhập
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                {/* Icon chuông với dấu gạch chéo lớn */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <BellIcon className="w-20 h-20 text-gray-400 dark:text-gray-500" />
                </div>
                {/* Dấu gạch chéo đỏ lớn */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-1 bg-red-500 transform rotate-45"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors">
                {t("notifications.loginRequired.title")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors">
                {t("notifications.loginRequired.description")}
              </p>
              {!user ? (
                <div className="flex gap-3 justify-center">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate("/login");
                    }}
                  >
                    {t("login")}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate("/register");
                    }}
                  >
                    {t("register")}
                  </button>
                </div>
              ) : (
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    navigate("/login");
                    setShowNotifications(false);
                  }}
                >
                  {t("loginNow")}
                </button>
              )}
            </div>
          ) : (
            // Thông báo cho STUDENT users đã đăng nhập
            <>
              {/* Filter buttons */}
              <div className="flex gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition border ${
                    filterType === "all"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                  }`}
                  onClick={() => setFilterType("all")}
                >
                  {t("notification.filter.all")}
                </button>
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition border ${
                    filterType === "system"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                  }`}
                  onClick={() => setFilterType("system")}
                >
                  {t("notification.type.system")}
                </button>
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition border ${
                    filterType === "advice"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                  }`}
                  onClick={() => setFilterType("advice")}
                >
                  {t("notification.type.advice")}
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loadingNoti ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    {/* Loading Spinner */}
                    <div className="relative">
                      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <div
                        className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-blue-400 rounded-full animate-spin"
                        style={{ animationDelay: "-0.5s" }}
                      ></div>
                    </div>

                    {/* Loading Text */}
                    <div className="mt-3 text-center">
                      <p className="text-gray-500 dark:text-gray-300 text-sm">
                        {t("loading")}...
                      </p>
                    </div>

                    {/* Loading Dots Animation */}
                    <div className="flex space-x-1 mt-2">
                      <div
                        className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                ) : notifications.filter((n) =>
                    filterType === "all" ? true : n.type === filterType
                  ).length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-300 transition-colors">
                    {t("notification.noNotifications")}
                  </div>
                ) : (
                  notifications
                    .filter((n) =>
                      filterType === "all" ? true : n.type === filterType
                    )
                    .map((n) => (
                      <div
                        key={n.id + n.type}
                        className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-1 ${
                          n.isRead
                            ? "bg-gray-50 dark:bg-gray-900"
                            : "bg-blue-50 dark:bg-blue-900/20"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`font-semibold transition-colors ${
                              n.isRead
                                ? "text-gray-500 dark:text-gray-300"
                                : "text-blue-700 dark:text-blue-200"
                            }`}
                          >
                            {/* Nhãn loại thông báo */}
                            {n.type === "advice"
                              ? t("notification.type.advice")
                              : t("notification.type.system")}
                          </span>
                          {/* Chỉ advice mới có thể đánh dấu đã đọc */}
                          {n.type === "advice" && !n.isRead && (
                            <button
                              className="text-xs text-blue-600 dark:text-blue-300 underline ml-2 transition-colors"
                              onClick={() => markAsRead(n.id)}
                            >
                              {t("notification.markAsRead")}
                            </button>
                          )}
                        </div>
                        {/* Tiêu đề và nội dung */}
                        <div className="font-bold text-base text-gray-800 dark:text-gray-100 transition-colors">
                          {n.type === "advice"
                            ? t("notification.defaultAdviceTitle")
                            : n.title || n.subject || t("chatbot.noTitle")}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-200 transition-colors">
                          {n.content || n.message || n.body || ""}
                        </div>
                        {/* {t("createdDate")} */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString("vi-VN")
                            : ""}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
