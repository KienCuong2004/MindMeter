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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">
          Đang xử lý đăng nhập...
        </h2>
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}
