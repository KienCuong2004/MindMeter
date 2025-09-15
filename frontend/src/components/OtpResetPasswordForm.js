import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { authFetch } from "../authFetch";

export default function OtpResetPasswordForm({ email, onSuccess }) {
  const { t, i18n } = useTranslation();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    if (success) {
      setRedirectCountdown(5);
      const timer = setInterval(() => {
        setRedirectCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            onSuccess && onSuccess();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [success, onSuccess]);

  // Resend OTP logic
  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    try {
      const res = await authFetch("/api/auth/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.text();
      if (!res.ok) throw new Error(data);
      setResendMsg(t("otpReset.resendSuccess"));
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setResendMsg(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!otp || !password || !confirm) {
      setError(t("otpReset.errorRequired"));
      return;
    }
    if (password !== confirm) {
      setError(t("otpReset.errorMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      const data = await res.text();
      if (!res.ok) throw new Error(data);
      setSuccess(t("otpReset.success"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Hàm đánh giá độ mạnh mật khẩu
  const getPasswordStrength = (pw) => {
    if (!pw) return "";
    let score = 0;
    if (pw.length >= 6) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return t("otpReset.weak");
    if (score === 2) return t("otpReset.medium");
    if (score >= 3) return t("otpReset.strong");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow dark:shadow-lg border dark:border-gray-700"
    >
      <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-400 text-center">
        {t("otpReset.title")}
      </h2>
      <div className="mb-4 flex flex-col items-center">
        <label className="block mb-1 font-semibold text-center dark:text-gray-200">
          {t("otpReset.otpLabel")}
        </label>
        <input
          type="text"
          className="tracking-widest text-2xl text-center font-bold border-2 border-blue-400 bg-blue-50 dark:bg-gray-800 rounded-xl px-6 py-4 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-900 transition w-64 mb-2 shadow-md text-gray-900 dark:text-white"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          maxLength={6}
          required
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={t("otpReset.otpPlaceholder")}
        />
        <button
          type="button"
          className={`mt-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleResend}
          disabled={resendLoading || resendCooldown > 0}
        >
          {resendCooldown > 0
            ? t("otpReset.resendCooldown", { s: resendCooldown })
            : t("otpReset.resend")}
        </button>
        {resendMsg && (
          <div className="text-green-600 dark:text-green-400 text-xs mt-1">
            {resendMsg}
          </div>
        )}
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold dark:text-gray-200">
          {t("otpReset.passwordLabel")}
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 pr-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t("otpReset.passwordPlaceholder")}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 text-lg cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        {password && (
          <div
            className={`text-xs mt-1 ml-1 font-semibold ${
              getPasswordStrength(password) === t("otpReset.weak")
                ? "text-red-500 dark:text-red-400"
                : getPasswordStrength(password) === t("otpReset.medium")
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {t("otpReset.passwordStrength")}: {getPasswordStrength(password)}
          </div>
        )}
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold dark:text-gray-200">
          {t("otpReset.confirmLabel")}
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 pr-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder={t("otpReset.confirmPlaceholder")}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 text-lg cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
            onClick={() => setShowConfirm((v) => !v)}
          >
            {showConfirm ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
      </div>
      {error && (
        <div className="text-red-500 dark:text-red-300 text-sm mb-2 text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-600 dark:text-green-400 text-sm mb-2 text-center">
          {success}
          <div className="mt-1 text-blue-600 dark:text-blue-400">
            {t("otpReset.redirect", { s: redirectCountdown })}
          </div>
        </div>
      )}
      <button
        type="submit"
        className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
        disabled={loading}
      >
        {loading ? t("otpReset.submitting") : t("otpReset.submit")}
      </button>
    </form>
  );
}
