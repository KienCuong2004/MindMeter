import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const requiresPasswordChange =
      params.get("requiresPasswordChange") === "true";
    const message = params.get("message");
    const email = params.get("email");
    const name = params.get("name");

    // Nếu có email và name params, đây là account linking - không redirect
    if (email && name) {
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
      let role = "";
      let user = null;
      try {
        const decoded = jwtDecode(token);
        // Lưu user vào localStorage
        user = {
          email: decoded.sub,
          role: decoded.role,
          firstName: decoded.firstName || "",
          lastName: decoded.lastName || "",
          avatarUrl: decoded.avatarUrl || null,
          plan: decoded.plan || "FREE",
          phone: decoded.phone,
          anonymous: decoded.anonymous || false,
        };
        localStorage.setItem("user", JSON.stringify(user));
        role = decoded.role;

        // Nếu user mới cần đổi mật khẩu, lưu thông tin vào localStorage
        if (requiresPasswordChange) {
          localStorage.setItem("requiresPasswordChange", "true");
          if (message) {
            localStorage.setItem("passwordChangeMessage", message);
          }
        }
      } catch (error) {
        console.error("[AuthCallback] Error decoding token:", error);
      }

      // Redirect dựa trên role với delay nhỏ để đảm bảo localStorage được lưu
      setTimeout(() => {
        if (role === "EXPERT") {
          navigate("/expert/dashboard", { replace: true });
        } else if (role === "ADMIN") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/home", { replace: true }); // Redirect to home instead of "/"
        }
      }, 100); // Delay 100ms để đảm bảo localStorage được lưu
    } else {
      navigate("/login");
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-md w-full mx-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-700">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse-slow">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 opacity-20 animate-ping"></div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 dark:from-indigo-400 dark:via-blue-400 dark:to-purple-400">
            {email && name
              ? "Liên kết tài khoản thành công!"
              : "Đang xử lý đăng nhập..."}
          </h2>

          {/* Message */}
          {email && name ? (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                Chào mừng{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {name}
                </span>
                ! Tài khoản của bạn đã được liên kết thành công.
              </p>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {email}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                Bạn sẽ được chuyển hướng trong giây lát...
              </p>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
              Vui lòng đợi trong giây lát...
            </p>
          )}

          {/* Loading spinner */}
          <div className="mt-6 flex justify-center">
            <div className="relative">
              <div className="w-12 h-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-gradient-to-r from-indigo-500 via-blue-500 to-purple-500"></div>
              <div className="absolute inset-0 w-12 h-12 animate-ping rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 opacity-20"></div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div
              className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
