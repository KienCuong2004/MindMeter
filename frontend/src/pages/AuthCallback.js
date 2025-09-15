import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      let role = "";
      try {
        const decoded = jwtDecode(token);
        // Lưu user vào localStorage
        const user = {
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
      } catch {}
      if (role === "EXPERT") {
        navigate("/expert/dashboard");
      } else if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
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
