import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { ThemeContext } from "../App";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { theme } = React.useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post("/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", data.token);
      // Decode token để lấy thông tin user đầy đủ
      let user = {
        email: data.email,
        role: data.role,
        firstName: "",
        lastName: "",
        avatar: null,
        plan: "FREE",
      };
      try {
        const decoded = jwt_decode(data.token);
        user = {
          ...user,
          firstName: decoded.firstName || "",
          lastName: decoded.lastName || "",
          avatar: decoded.avatar || null,
          plan: decoded.plan || "FREE",
        };

        // Lấy role từ decoded token
        const role = decoded.role;

        user.name =
          (user.firstName || "") + (user.lastName ? " " + user.lastName : "") ||
          user.email ||
          "User";
        localStorage.setItem("user", JSON.stringify(user));

        // Chuyển hướng sau đăng nhập thành công
        if (role === "EXPERT") {
          navigate("/expert/dashboard");
        } else if (role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/home");
        }
      } catch (error) {
        setError("Lỗi xử lý thông tin đăng nhập");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Lỗi đăng nhập. Vui lòng kiểm tra email và mật khẩu."
      );
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  useEffect(() => {
    document.title = "Đăng nhập | MindMeter";
  }, []);

  return (
    <div
      className={
        theme === "dark"
          ? "min-h-screen flex items-center justify-center bg-gray-900"
          : "min-h-screen flex items-center justify-center bg-gray-100"
      }
    >
      <div
        className={
          theme === "dark"
            ? "bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-xl"
            : "bg-white p-12 rounded-3xl shadow-2xl border border-blue-100 w-full max-w-xl"
        }
      >
        <h2
          className={
            theme === "dark"
              ? "text-3xl font-extrabold text-center mb-8 text-blue-300"
              : "text-3xl font-extrabold text-center mb-8 text-blue-600"
          }
        >
          Đăng nhập
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-semibold text-blue-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-blue-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 py-3 px-4 text-base bg-blue-50 placeholder-gray-400"
              required
              placeholder="Nhập email"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-blue-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-blue-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 py-3 px-4 text-base bg-blue-50 placeholder-gray-400"
              required
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-lg shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Đăng nhập
          </button>
        </form>
        <div className="mt-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-200"></div>
            </div>
            <div className="relative flex justify-center text-base">
              <span className="font-semibold text-blue-400">hoặc</span>
            </div>
          </div>
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center py-3 px-4 border border-blue-200 rounded-xl shadow-sm bg-white text-base font-semibold text-blue-600 hover:bg-blue-50 transition"
          >
            <FaGoogle className="h-5 w-5 text-red-600 mr-2" />
            Đăng nhập bằng Google
          </button>
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/forgot-password"
            className="text-base text-blue-500 hover:underline font-medium"
          >
            Quên mật khẩu?
          </Link>
          <p className="mt-3 text-base text-gray-600">
            {t("common.noAccount")}{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:underline font-semibold"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
