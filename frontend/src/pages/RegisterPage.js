import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ThemeContext } from "../App";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { theme } = React.useContext(ThemeContext);

  useEffect(() => {
    document.title = "Đăng ký | MindMeter";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    try {
      const { data } = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred");
    }
  };

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
              ? "text-3xl font-extrabold text-center mb-8 text-green-300"
              : "text-3xl font-extrabold text-center mb-8 text-green-600"
          }
        >
          Đăng ký tài khoản
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-semibold text-green-700 mb-1">
              Họ tên
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-green-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 py-3 px-4 text-base bg-green-50 placeholder-gray-400"
              required
              placeholder="Nhập họ tên"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-green-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-green-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 py-3 px-4 text-base bg-green-50 placeholder-gray-400"
              required
              placeholder="Nhập email"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-green-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-green-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 py-3 px-4 text-base bg-green-50 placeholder-gray-400"
              required
              minLength={6}
              placeholder="Nhập mật khẩu"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-green-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-green-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 py-3 px-4 text-base bg-green-50 placeholder-gray-400"
              required
              minLength={6}
              placeholder="Nhập lại mật khẩu"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-bold text-lg shadow hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
          >
            Đăng ký
          </button>
        </form>
        <div className="mt-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-green-200"></div>
            </div>
            <div className="relative flex justify-center text-base">
              <span className="font-semibold text-green-400">hoặc</span>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-base text-gray-600">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-green-600 hover:underline font-semibold"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
