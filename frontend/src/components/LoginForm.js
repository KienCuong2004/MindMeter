import React, { useState, useRef, useEffect } from "react";
import {
  FaSignInAlt,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaExclamationCircle,
  FaGoogle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { authFetch } from "../authFetch";
import { useTheme } from "../hooks/useTheme";
import ChangePasswordModal from "./ChangePasswordModal";

function LoginForm({ onLogin, onSwitchForm, onForgotPassword }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState({});
  const emailRef = useRef();
  const passwordRef = useRef();
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    document.title = t("loginTitle") + " | MindMeter";
  }, [t]);

  const validate = () => {
    const err = {};
    if (!email) err.email = t("validation.emailRequired");
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      err.email = t("validation.emailInvalid");
    if (!password) err.password = t("validation.passwordRequired");
    else if (password.length < 6)
      err.password = t("validation.passwordMinLength");
    setFieldError(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 2000);
      return () => clearTimeout(timer);
    }
    setLoading(true);
    try {
      const res = await authFetch(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t("loginFailed"));
      }
      const data = await res.json();

      // Lưu user vào localStorage (giống logic LoginPage)
      let user = {
        email: data.email,
        role: data.role,
        firstName: "",
        lastName: "",
        avatar: null,
        plan: null, // Không set giá trị mặc định
      };
      try {
        // Sử dụng hàm decode base64url an toàn cho Unicode
        const payload = data.token.split(".")[1];
        const decoded = JSON.parse(base64UrlDecode(payload));
        user = {
          ...user,
          firstName: decoded.firstName || "",
          lastName: decoded.lastName || "",
          avatar: decoded.avatar || null,
          plan: decoded.plan || "FREE", // Chỉ set FREE nếu decoded.plan không có
        };
      } catch (error) {
        // Nếu decode thất bại, set plan mặc định
        user.plan = "FREE";
      }
      user.name =
        (user.firstName || "") + (user.lastName ? " " + user.lastName : "") ||
        user.email ||
        "User";
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", data.token);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/oauth2/authorization/google`;
  };

  const requiredErrors = Object.values(fieldError).filter((e) =>
    e.includes(t("validation.fieldRequired"))
  );

  useEffect(() => {
    if (requiredErrors.length > 0) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [requiredErrors.length]);

  let errorMsg = "";
  if (requiredErrors.length === 1) {
    errorMsg = requiredErrors[0];
  } else if (requiredErrors.length > 1) {
    const fields = requiredErrors.map((e) =>
      e.split(t("validation.fieldRequired"))[0].trim()
    );
    const last = fields.pop();
    errorMsg = fields.length
      ? `${fields.join(", ")} ${t(
          "validation.multipleFieldsRequired"
        )} ${last} ${t("validation.fieldRequired")}`
      : `${last} ${t("validation.fieldRequired")}`;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f4f6fa] dark:bg-[#101624]">
      <div className="flex bg-white dark:bg-[#181e29] rounded-3xl shadow-lg overflow-hidden max-w-3xl w-full border border-gray-200 dark:border-[#353c4a]">
        <div
          className="hidden md:block w-1/2 bg-cover bg-center"
          style={{
            backgroundImage:
              theme === "dark"
                ? "url('/src/assets/images/Auth_1.png')"
                : "url('/src/assets/images/Auth_2.png')",
          }}
        />
        <div className="w-full md:w-1/2 flex items-center">
          <div className="animate-fade-in w-full">
            <form
              onSubmit={handleSubmit}
              className="w-full px-10 pt-8 pb-10"
              autoComplete="off"
            >
              <div className="flex flex-col items-center mb-6">
                <FaSignInAlt className="text-4xl text-blue-500 dark:text-[#2563eb] mb-2" />
                <h2 className="text-3xl font-extrabold text-blue-700 dark:text-[#7bb0ff] tracking-tight">
                  {t("login")}
                </h2>
              </div>
              {showError && errorMsg && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-2 rounded-3xl shadow animate-shake">
                  <FaExclamationCircle className="text-xl mr-2 text-red-500 dark:text-red-300" />
                  <div className="font-semibold">{errorMsg}</div>
                </div>
              )}
              <div className="mb-5 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200 dark:text-gray-200 text-lg pointer-events-none">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  ref={emailRef}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  className={`peer border border-gray-200 dark:border-[#353c4a] rounded-3xl w-full py-2 pl-10 pr-4 text-gray-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-100 dark:bg-[#232a36] transition duration-150 text-base placeholder-gray-600 dark:placeholder-gray-300 ${
                    fieldError.email &&
                    fieldError.email.includes(t("validation.fieldRequired"))
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-600 dark:focus:border-red-500 dark:focus:ring-red-900"
                      : ""
                  }`}
                  placeholder={emailFocus || email ? t("emailPlaceholder") : ""}
                />
                <label
                  className={`pointer-events-none absolute left-10 transition-all duration-200
                    ${
                      email || emailFocus
                        ? "-top-5 left-3 px-1 bg-transparent text-sm font-bold text-blue-800 dark:text-[#7bb0ff]"
                        : "top-1/2 -translate-y-1/2 text-base text-gray-500 dark:text-gray-400"
                    }
                  `}
                >
                  {t("emailLabel")}
                </label>
              </div>
              <div className="mb-6 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200 dark:text-gray-200 text-lg pointer-events-none">
                  <FaLock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  ref={passwordRef}
                  onFocus={() => setPasswordFocus(true)}
                  onBlur={() => setPasswordFocus(false)}
                  className={`peer border border-gray-200 dark:border-[#353c4a] rounded-3xl w-full py-2 pl-10 pr-10 text-gray-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-100 dark:bg-[#232a36] transition duration-150 text-base placeholder-gray-600 dark:placeholder-gray-300 ${
                    fieldError.password &&
                    fieldError.password.includes(t("validation.fieldRequired"))
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-600 dark:focus:border-red-500 dark:focus:ring-red-900"
                      : ""
                  }`}
                  placeholder={
                    passwordFocus || password ? t("passwordPlaceholder") : ""
                  }
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-200 dark:text-gray-200 text-lg cursor-pointer hover:text-blue-500 dark:hover:text-[#2563eb] transition"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
                <label
                  className={`pointer-events-none absolute left-10 transition-all duration-200
                    ${
                      password || passwordFocus
                        ? "-top-5 left-3 px-1 bg-transparent text-sm font-bold text-blue-800 dark:text-[#7bb0ff]"
                        : "top-1/2 -translate-y-1/2 text-base text-gray-500 dark:text-gray-400"
                    }
                  `}
                >
                  {t("passwordLabel")}
                </label>
              </div>
              <div className="relative mb-6 flex items-center">
                <div className="flex-grow border-t border-gray-300 dark:border-[#353c4a]"></div>
                <span className="mx-4 text-gray-500 dark:text-gray-400">
                  {t("or")}
                </span>
                <div className="flex-grow border-t border-gray-300 dark:border-[#353c4a]"></div>
              </div>
              <div className="flex flex-col gap-3 mb-6">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 border border-gray-200 dark:border-[#353c4a] rounded-3xl py-2 px-4 bg-white dark:bg-[#232a36] text-gray-800 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-[#232a36]/80 transition"
                  onClick={handleGoogleLogin}
                >
                  <FaGoogle className="text-red-500 text-lg" />
                  {t("loginWithGoogle")}
                </button>
              </div>
              <div className="flex justify-between items-center mb-6">
                <button
                  type="button"
                  className="text-[#2563eb] dark:text-[#7bb0ff] hover:underline text-sm font-medium"
                  onClick={() => onForgotPassword && onForgotPassword(email)}
                >
                  {t("forgotPassword")}
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-[#2563eb] hover:bg-[#397cf6] dark:bg-[#2563eb] dark:hover:bg-[#397cf6] text-white font-semibold py-2 rounded-3xl transition text-lg shadow"
                disabled={loading}
              >
                {loading ? t("loading") : t("login")}
              </button>
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("noAccount")}{" "}
                <span
                  className="text-[#2563eb] dark:text-[#7bb0ff] font-semibold hover:underline cursor-pointer"
                  onClick={() => onSwitchForm && onSwitchForm("register")}
                >
                  {t("register")}
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Thêm hàm decode base64url an toàn cho Unicode
function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return decodeURIComponent(
    atob(str)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
}

export default function LoginFormWrapper({
  onLogin,
  onSwitchForm,
  onForgotPassword,
}) {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [tempPasswordUsed, setTempPasswordUsed] = useState(false);

  const handleLogin = (data) => {
    // Check if user needs to change temporary password
    if (data.requiresPasswordChange) {
      setTempPasswordUsed(true);
      setShowChangePasswordModal(true);
      return; // Don't proceed with normal login flow
    }
    onLogin(data);
  };

  const handleCloseModal = () => {
    setShowChangePasswordModal(false);
    setTempPasswordUsed(false);
  };

  return (
    <>
      <LoginForm
        onLogin={handleLogin}
        onSwitchForm={onSwitchForm}
        onForgotPassword={onForgotPassword}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={handleCloseModal}
        isTemporaryPassword={tempPasswordUsed}
      />
    </>
  );
}
