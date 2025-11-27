import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AuthCallback from "./pages/AuthCallback";
import LoadingSpinner from "./components/LoadingSpinner";
import ExpertStudentsPage from "./pages/ExpertStudentsPage";
import StudentTestPage from "./pages/StudentTestPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import ExpertDashboardPage from "./pages/ExpertDashboardPage";
import ExpertProfilePage from "./pages/ExpertProfilePage";
import AdviceSentPage from "./pages/AdviceSentPage";
import { jwtDecode } from "jwt-decode";
import { authFetch } from "./authFetch";
import AdminBlogReportsPage from "./pages/AdminBlogReportsPage";
import StudentHomePage from "./pages/StudentHomePage";
import IntroduceMindMeterPage from "./pages/IntroduceMindMeterPage";
import StudentTestResultPage from "./pages/StudentTestResultPage";
import StudentTestHistoryPage from "./pages/StudentTestHistoryPage";
import StudentAppointmentsPage from "./pages/StudentAppointmentsPage";
import UserGuidePage from "./pages/UserGuidePage";
import TermsOfUse from "./pages/TermsOfUse";
import BlogPostPage from "./pages/BlogPostPage";
import SavedArticlesPage from "./pages/SavedArticlesPage";
import BlogErrorBoundary from "./components/BlogErrorBoundary";
import Disclaimer from "./pages/Disclaimer";
import SecurityPolicy from "./pages/SecurityPolicy";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import AccountLinkingNotification from "./components/AccountLinkingNotification";

// Lazy load admin pages for better performance
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminProfilePage = lazy(() => import("./pages/AdminProfilePage"));
const QuestionManagementPage = lazy(() =>
  import("./pages/QuestionManagementPage")
);
const AnnouncementManagementPage = lazy(() =>
  import("./pages/AnnouncementManagementPage")
);
const AdminStatisticsPage = lazy(() => import("./pages/AdminStatisticsPage"));
const AdminTestResultsPage = lazy(() => import("./pages/AdminTestResultsPage"));
const BlogManagementPage = lazy(() => import("./pages/BlogManagementPage"));

// Lazy load large pages for better performance
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ExpertAppointmentsPage = lazy(() => import("./pages/ExpertAppointmentsPage"));
const ExpertSchedulePage = lazy(() => import("./pages/ExpertSchedulePage"));
const PaymentMethodPage = lazy(() => import("./pages/PaymentMethodPage"));
const PayPalPaymentPage = lazy(() => import("./pages/PayPalPaymentPage"));
const VNPayPaymentPage = lazy(() => import("./pages/VNPayPaymentPage"));
const ConsultTherapyPage = lazy(() => import("./pages/ConsultTherapyPage"));
const BlogListPage = lazy(() => import("./pages/BlogListPage"));
const CreatePostPage = lazy(() => import("./pages/CreatePostPage"));
const EditPostPage = lazy(() => import("./pages/EditPostPage"));

export default function AppRoutes() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [avatarUpdateKey, setAvatarUpdateKey] = useState(0);
  const isProcessingUser = useRef(false); // Prevent concurrent user processing
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Function để cập nhật avatar
  const updateUserAvatar = (newAvatarUrl) => {
    // Cập nhật user state ngay lập tức
    setUser((prevUser) => {
      if (prevUser) {
        const updatedUser = { ...prevUser, avatarUrl: newAvatarUrl };

        return updatedUser;
      }
      return prevUser;
    });

    // Cập nhật localStorage để đảm bảo avatar mới được lưu trữ
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        const userData = JSON.parse(storedUser);
        userData.avatarUrl = newAvatarUrl;
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (e) {
        // Handle localStorage error silently
      }
    }

    // Force refresh user data từ backend để đảm bảo đồng bộ
    const refreshUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = jwtDecode(token);
          if (decoded.role === "ADMIN") {
            const res = await authFetch("/api/admin/profile");
            if (res.ok) {
              const userData = await res.json();
              setUser((prevUser) => {
                const updatedUser = {
                  ...prevUser,
                  avatarUrl: userData.avatarUrl,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  phone: userData.phone,
                  plan: userData.plan,
                  planStartDate: userData.planStartDate,
                  planExpiryDate: userData.planExpiryDate,
                };
                return updatedUser;
              });
            } else {
              // Failed to fetch user data
            }
          } else if (decoded.role === "EXPERT") {
            const res = await authFetch("/api/expert/profile");
            if (res.ok) {
              const userData = await res.json();
              setUser((prevUser) => {
                const updatedUser = {
                  ...prevUser,
                  avatarUrl: userData.avatarUrl,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  phone: userData.phone,
                  plan: userData.plan,
                  planStartDate: userData.planStartDate,
                  planExpiryDate: userData.planExpiryDate,
                };
                return updatedUser;
              });
            } else {
              // Failed to fetch user data
            }
          }
        }
      } catch (error) {
        // Error refreshing user data
      }
    };

    // Gọi refresh sau 100ms để đảm bảo backend đã xử lý xong
    setTimeout(refreshUserData, 100);

    // Thêm một refresh nữa sau 500ms để đảm bảo
    setTimeout(refreshUserData, 500);

    // Force re-render bằng cách increment avatarUpdateKey
    setAvatarUpdateKey((prev) => prev + 1);
  };

  useEffect(() => {
    // Prevent concurrent user processing
    if (isProcessingUser.current) {
      return;
    }

    // Cho phép ADMIN/EXPERT truy cập /saved-articles, /blog, /blog/create, /blog/post/:id để hiển thị 404
    const isSavedArticlesPath = window.location.pathname === "/saved-articles";
    const isBlogPath =
      window.location.pathname === "/blog" ||
      window.location.pathname === "/blog/create" ||
      window.location.pathname.startsWith("/blog/post/");
    const token = localStorage.getItem("token");

    // Nếu là ADMIN/EXPERT và đang ở /saved-articles hoặc các trang blog, không redirect
    if (token && (isSavedArticlesPath || isBlogPath)) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "ADMIN" || decoded.role === "EXPERT") {
          // Chỉ set user, không redirect
          const storedUser = localStorage.getItem("user");
          let userData = {};
          if (storedUser && storedUser !== "undefined") {
            try {
              userData = JSON.parse(storedUser);
            } catch (e) {
              userData = {};
            }
          }
          const userObject = {
            email: decoded.sub,
            role: decoded.role,
            firstName: decoded.firstName || userData.firstName || "",
            lastName: decoded.lastName || userData.lastName || "",
            plan: decoded.plan || userData.plan || "FREE",
            phone: decoded.phone || userData.phone,
            avatarUrl: decoded.avatarUrl || userData.avatarUrl,
            anonymous: decoded.anonymous || userData.anonymous || false,
          };
          setUser(userObject);
          setLoadingUser(false);
          isProcessingUser.current = false;
          return; // Return early, không chạy logic redirect
        }
      } catch (e) {
        // Nếu decode fail, tiếp tục logic bình thường
      }
    }

    isProcessingUser.current = true;
    setLoadingUser(true);
    const anonymousToken = localStorage.getItem("anonymousToken");

    const publicPaths = [
      "/privacy-policy",
      "/introduce",
      "/user-guide",
      "/introduce-mindmeter",
      "/terms-of-use",
      "/disclaimer",
      "/consult-therapy",
      "/contact",
      "/pricing",
      "/payment-method",
      "/payment/paypal",
      "/payment/vnpay",
      "/payment/vnpay/return",
      "/blog",
      "/blog/create",
      "/login",
      "/register",
      "/forgot-password",
      "/account-linking",
    ];

    // Check if current path is a blog post detail page
    const isBlogPostPath = window.location.pathname.startsWith("/blog/post/");

    if (token) {
      try {
        const decoded = jwtDecode(token);

        // Kiểm tra xem có user data trong localStorage không
        const storedUser = localStorage.getItem("user");
        let userData = {};

        if (storedUser && storedUser !== "undefined") {
          try {
            userData = JSON.parse(storedUser);
          } catch (e) {
            userData = {};
          }
        }

        const userObject = {
          email: decoded.sub,
          role: decoded.role,
          firstName: decoded.firstName || userData.firstName || "",
          lastName: decoded.lastName || userData.lastName || "",
          plan: decoded.plan || userData.plan || "FREE",
          phone: decoded.phone || userData.phone,
          avatarUrl: decoded.avatarUrl || userData.avatarUrl,
          anonymous: decoded.anonymous || userData.anonymous || false,
        };

        setUser(userObject);
        setLoadingUser(false);
        isProcessingUser.current = false; // Reset flag
        // Logic redirect rõ ràng và chính xác hơn

        // Không redirect nếu ADMIN/EXPERT truy cập /saved-articles hoặc các trang blog (để hiển thị 404)
        const isSavedArticlesPath =
          window.location.pathname === "/saved-articles";
        const isBlogPathForRestriction =
          window.location.pathname === "/blog" ||
          window.location.pathname === "/blog/create" ||
          window.location.pathname.startsWith("/blog/post/");
        const shouldAllowRestrictedPagesForAdminExpert =
          (isSavedArticlesPath || isBlogPathForRestriction) &&
          (decoded.role === "ADMIN" || decoded.role === "EXPERT");

        if (decoded.role === "ADMIN") {
          // Admin chỉ được ở /admin/* hoặc public paths
          // Không redirect nếu đang ở /saved-articles hoặc các trang blog (để hiển thị 404)
          if (
            !shouldAllowRestrictedPagesForAdminExpert &&
            !window.location.pathname.startsWith("/admin") &&
            !publicPaths.includes(window.location.pathname) &&
            !isBlogPostPath
          ) {
            navigate("/admin/dashboard", { replace: true });
          }
        } else if (decoded.role === "EXPERT") {
          // Expert chỉ được ở /expert/* hoặc public paths
          // Không redirect nếu đang ở /saved-articles hoặc các trang blog (để hiển thị 404)
          if (
            !shouldAllowRestrictedPagesForAdminExpert &&
            !window.location.pathname.startsWith("/expert") &&
            !publicPaths.includes(window.location.pathname) &&
            !isBlogPostPath
          ) {
            navigate("/expert/dashboard", { replace: true });
          }
        } else if (decoded.role === "STUDENT") {
          // Student được ở /home, /student/*, /appointments, /blog/edit/:id, hoặc public paths
          const isBlogEditPath =
            window.location.pathname.startsWith("/blog/edit/");
          if (
            window.location.pathname === "/" ||
            (!window.location.pathname.startsWith("/student") &&
              window.location.pathname !== "/home" &&
              window.location.pathname !== "/appointments" &&
              window.location.pathname !== "/saved-articles" &&
              !isBlogEditPath &&
              !publicPaths.includes(window.location.pathname) &&
              !isBlogPostPath)
          ) {
            navigate("/home", { replace: true });
          }
        }
        // Sau khi set user, kiểm tra pendingTestType
        const pendingTestType = localStorage.getItem("pendingTestType");
        if (pendingTestType) {
          navigate(`/student/test?type=${pendingTestType}`, { replace: true });
          localStorage.removeItem("pendingTestType");
        }
      } catch (e) {
        setUser(null);
        setLoadingUser(false);
      }
    } else if (anonymousToken) {
      // Xử lý anonymous user - chỉ khi không có token thông thường
      try {
        setUser({
          email: "anonymous",
          role: "ANONYMOUS",
          firstName: t("anonymous.user"),
          lastName: t("anonymous.anonymous"),
          anonymous: true,
        });
        setLoadingUser(false);
        isProcessingUser.current = false; // Reset flag

        // Anonymous users có thể truy cập tất cả public paths và student paths
        // Không cần redirect
        // Sau khi set user anonymous, kiểm tra pendingTestType
        const pendingTestType = localStorage.getItem("pendingTestType");
        if (pendingTestType) {
          navigate(`/student/test?type=${pendingTestType}`, { replace: true });
          localStorage.removeItem("pendingTestType");
        }
      } catch (error) {
        localStorage.removeItem("anonymousToken");
        localStorage.removeItem("user");
        setUser(null);
        setLoadingUser(false);
        isProcessingUser.current = false; // Reset flag
      }
    } else {
      // Người dùng chưa đăng nhập - chỉ được ở /home hoặc public paths
      setUser(null);
      setLoadingUser(false);
      isProcessingUser.current = false; // Reset flag

      // Redirect về /home nếu không ở /home hoặc public paths
      // Nhưng không redirect nếu đang ở trang login/register/forgot-password hoặc blog post
      // Hoặc nếu đang trong quá trình tạo anonymous account
      const pendingTestType = localStorage.getItem("pendingTestType");
      const creatingAnonymousAccount = localStorage.getItem(
        "creatingAnonymousAccount"
      );
      const isTestPage = window.location.pathname.startsWith("/student/test");

      if (
        window.location.pathname !== "/home" &&
        window.location.pathname !== "/" &&
        !publicPaths.includes(window.location.pathname) &&
        !isBlogPostPath &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register") &&
        !window.location.pathname.startsWith("/forgot-password") &&
        !(isTestPage && (pendingTestType || creatingAnonymousAccount)) // Cho phép test page nếu có pendingTestType hoặc đang tạo anonymous account
      ) {
        navigate("/home", { replace: true });
      }
    }
  }, [navigate, t, location.pathname]); // Use location.pathname to detect route changes

  const handleLogin = (data) => {
    // Tạo user object với đầy đủ thông tin
    const userData = {
      email: data.email || data.user?.email,
      role: data.role || data.user?.role,
      firstName: data.firstName || data.user?.firstName || "",
      lastName: data.lastName || data.user?.lastName || "",
      plan: data.plan || data.user?.plan || "FREE",
      phone: data.phone || data.user?.phone,
      avatarUrl: data.avatarUrl || data.user?.avatarUrl,
      anonymous: data.anonymous || data.user?.anonymous || false,
    };

    setUser(userData);
    localStorage.setItem("token", data.token);

    // Lưu user data mới từ backend response
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    } else {
      // Nếu không có data.user, lưu userData đã tạo
      localStorage.setItem("user", JSON.stringify(userData));
    }

    // Chuyển hướng sau đăng nhập thành công
    if (data.role === "ADMIN") {
      navigate("/admin/dashboard", { replace: true });
    } else if (data.role === "EXPERT") {
      navigate("/expert/dashboard", { replace: true });
    } else if (data.role === "STUDENT") {
      navigate("/home", { replace: true });
    }
  };

  const handleLogout = () => {
    if (user && (user.role === "ADMIN" || user.role === "EXPERT")) {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("anonymousToken");
      navigate("/login", { replace: true });
    } else {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("anonymousToken");
      navigate("/home", { replace: true });
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              {t("loading.checkingLogin")}
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
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/introduce-mindmeter" element={<IntroduceMindMeterPage />} />
      <Route path="/introduce" element={<IntroduceMindMeterPage />} />
      <Route path="/user-guide" element={<UserGuidePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/home" element={<StudentHomePage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/security-policy" element={<SecurityPolicy />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/consult-therapy" element={<ConsultTherapyPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/payment-method" element={<PaymentMethodPage />} />
      <Route path="/payment/paypal" element={<PayPalPaymentPage />} />
      <Route path="/payment/vnpay" element={<VNPayPaymentPage />} />
      <Route path="/payment/vnpay/return" element={<VNPayPaymentPage />} />
      <Route
        path="/saved-articles"
        element={
          <BlogErrorBoundary>
            <SavedArticlesPage />
          </BlogErrorBoundary>
        }
      />
      <Route
        path="/login"
        element={
          <LoginForm
            onLogin={handleLogin}
            onSwitchForm={() => navigate("/register")}
            onForgotPassword={(email) => {
              const queryParam = email
                ? `?email=${encodeURIComponent(email)}`
                : "";
              navigate(`/forgot-password${queryParam}`);
            }}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterForm
            onRegister={handleLogin}
            onSwitchForm={() => navigate("/login")}
          />
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/account-linking" element={<AccountLinkingNotification />} />
      {!user || (user && user.role === "ANONYMOUS") ? (
        <>
          <Route path="/home" element={<StudentHomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/introduce-mindmeter"
            element={<IntroduceMindMeterPage />}
          />
          <Route path="/introduce" element={<IntroduceMindMeterPage />} />
          <Route path="/user-guide" element={<UserGuidePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/security-policy" element={<SecurityPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/consult-therapy" element={<ConsultTherapyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment-method" element={<PaymentMethodPage />} />
          <Route path="/payment/paypal" element={<PayPalPaymentPage />} />
          <Route path="/payment/vnpay" element={<VNPayPaymentPage />} />
          <Route path="/payment/vnpay/return" element={<VNPayPaymentPage />} />
          <Route path="/saved-articles" element={<NotFoundPage />} />
          <Route path="/student/test" element={<StudentTestPage />} />
          <Route
            path="/student/test-result"
            element={<StudentTestResultPage />}
          />
          <Route
            path="/student/test-history"
            element={<StudentTestHistoryPage />}
          />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </>
      ) : user.role === "ADMIN" ? (
        <>
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/home" element={<StudentHomePage />} />
          <Route
            path="/introduce-mindmeter"
            element={<IntroduceMindMeterPage />}
          />
          <Route path="/introduce" element={<IntroduceMindMeterPage />} />
          <Route path="/user-guide" element={<UserGuidePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/security-policy" element={<SecurityPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/consult-therapy" element={<ConsultTherapyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/blog" element={<NotFoundPage />} />
          <Route path="/blog/create" element={<NotFoundPage />} />
          <Route path="/blog/post/:id" element={<NotFoundPage />} />
          <Route path="/saved-articles" element={<NotFoundPage />} />
          <Route
            path="/login"
            element={
              <LoginForm
                onLogin={handleLogin}
                onSwitchForm={() => navigate("/register")}
                onForgotPassword={() => navigate("/forgot-password")}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterForm
                onRegister={handleLogin}
                onSwitchForm={() => navigate("/login")}
              />
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <Suspense
                fallback={
                  <LoadingSpinner message="Loading Admin Dashboard..." />
                }
              >
                <AdminDashboardPage
                  handleLogout={handleLogout}
                  avatarUpdateKey={avatarUpdateKey}
                  user={user}
                />
              </Suspense>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminProfilePage
                handleLogout={handleLogout}
                updateUserAvatar={updateUserAvatar}
              />
            }
          />
          <Route
            path="/admin/users"
            element={
              <Suspense
                fallback={
                  <LoadingSpinner message="Loading User Management..." />
                }
              >
                <UserManagementPage handleLogout={handleLogout} />
              </Suspense>
            }
          />
          <Route
            path="/admin/questions"
            element={<QuestionManagementPage handleLogout={handleLogout} />}
          />
          <Route
            path="/admin/announcements"
            element={<AnnouncementManagementPage handleLogout={handleLogout} />}
          />
          <Route
            path="/admin/blog"
            element={<BlogManagementPage handleLogout={handleLogout} />}
          />
          <Route
            path="/admin/blog/reports"
            element={<AdminBlogReportsPage handleLogout={handleLogout} />}
          />
          <Route
            path="/admin/statistics"
            element={
              <Suspense
                fallback={<LoadingSpinner message="Loading Statistics..." />}
              >
                <AdminStatisticsPage handleLogout={handleLogout} />
              </Suspense>
            }
          />
          <Route
            path="/admin/tests"
            element={<AdminTestResultsPage handleLogout={handleLogout} />}
          />
        </>
      ) : user.role === "EXPERT" ? (
        <>
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/home" element={<StudentHomePage />} />
          <Route
            path="/introduce-mindmeter"
            element={<IntroduceMindMeterPage />}
          />
          <Route path="/introduce" element={<IntroduceMindMeterPage />} />
          <Route path="/user-guide" element={<UserGuidePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/consult-therapy" element={<ConsultTherapyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/blog" element={<NotFoundPage />} />
          <Route path="/blog/create" element={<NotFoundPage />} />
          <Route path="/blog/post/:id" element={<NotFoundPage />} />
          <Route path="/saved-articles" element={<NotFoundPage />} />
          <Route
            path="/login"
            element={
              <LoginForm
                onLogin={handleLogin}
                onSwitchForm={() => navigate("/register")}
                onForgotPassword={() => navigate("/forgot-password")}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterForm
                onRegister={handleLogin}
                onSwitchForm={() => navigate("/login")}
              />
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/expert/dashboard"
            element={<ExpertDashboardPage handleLogout={handleLogout} />}
          />
          <Route
            path="/expert/students"
            element={<ExpertStudentsPage handleLogout={handleLogout} />}
          />
          <Route
            path="/expert/profile"
            element={<ExpertProfilePage handleLogout={handleLogout} />}
          />
          <Route
            path="/expert/advice-sent"
            element={<AdviceSentPage handleLogout={handleLogout} />}
          />
          <Route
            path="/expert/appointments"
            element={<ExpertAppointmentsPage handleLogout={handleLogout} />}
          />
          <Route
            path="/expert/schedule"
            element={<ExpertSchedulePage handleLogout={handleLogout} />}
          />
        </>
      ) : user.role === "STUDENT" ? (
        <>
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/home" element={<StudentHomePage />} />
          <Route
            path="/introduce-mindmeter"
            element={<IntroduceMindMeterPage />}
          />
          <Route path="/introduce" element={<IntroduceMindMeterPage />} />
          <Route path="/user-guide" element={<UserGuidePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/consult-therapy" element={<ConsultTherapyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route
            path="/blog"
            element={
              <BlogErrorBoundary>
                <BlogListPage />
              </BlogErrorBoundary>
            }
          />
          <Route
            path="/blog/create"
            element={
              <BlogErrorBoundary>
                <CreatePostPage />
              </BlogErrorBoundary>
            }
          />
          <Route
            path="/blog/edit/:id"
            element={
              <BlogErrorBoundary>
                <EditPostPage />
              </BlogErrorBoundary>
            }
          />
          <Route
            path="/blog/post/:id"
            element={
              <BlogErrorBoundary>
                <BlogPostPage />
              </BlogErrorBoundary>
            }
          />
          <Route
            path="/saved-articles"
            element={
              <BlogErrorBoundary>
                <SavedArticlesPage />
              </BlogErrorBoundary>
            }
          />
          <Route
            path="/login"
            element={
              <LoginForm
                onLogin={handleLogin}
                onSwitchForm={() => navigate("/register")}
                onForgotPassword={() => navigate("/forgot-password")}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterForm
                onRegister={handleLogin}
                onSwitchForm={() => navigate("/login")}
              />
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/student/test" element={<StudentTestPage />} />
          <Route
            path="/student/profile"
            element={<StudentProfilePage updateUserAvatar={updateUserAvatar} />}
          />
          <Route
            path="/student/test-result"
            element={<StudentTestResultPage />}
          />
          <Route
            path="/student/test-history"
            element={<StudentTestHistoryPage />}
          />
          <Route
            path="/appointments"
            element={<StudentAppointmentsPage handleLogout={handleLogout} />}
          />
          <Route
            path="/student/appointments"
            element={<StudentAppointmentsPage handleLogout={handleLogout} />}
          />
        </>
      ) : (
        <>
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/home" element={<StudentHomePage />} />
          <Route
            path="/introduce-mindmeter"
            element={<IntroduceMindMeterPage />}
          />
          <Route path="/introduce" element={<IntroduceMindMeterPage />} />
          <Route path="/user-guide" element={<UserGuidePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/consult-therapy" element={<ConsultTherapyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment-method" element={<PaymentMethodPage />} />
          <Route path="/payment/paypal" element={<PayPalPaymentPage />} />
          <Route path="/payment/vnpay" element={<VNPayPaymentPage />} />
          <Route path="/payment/vnpay/return" element={<VNPayPaymentPage />} />
          <Route path="/saved-articles" element={<NotFoundPage />} />
          <Route
            path="/login"
            element={
              <LoginForm
                onLogin={handleLogin}
                onSwitchForm={() => navigate("/register")}
                onForgotPassword={() => navigate("/forgot-password")}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterForm
                onRegister={handleLogin}
                onSwitchForm={() => navigate("/login")}
              />
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/student/test" element={<StudentTestPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route
            path="/student/test-result"
            element={<StudentTestResultPage />}
          />
          <Route
            path="/student/test-history"
            element={<StudentTestHistoryPage />}
          />
          <Route
            path="/appointments"
            element={<StudentAppointmentsPage handleLogout={handleLogout} />}
          />
          <Route
            path="/student/appointments"
            element={<StudentAppointmentsPage handleLogout={handleLogout} />}
          />
        </>
      )}
      {/* Catch all route - 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
