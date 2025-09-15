import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { authFetch } from "../authFetch";

export default function ForgotPasswordForm({ onSent }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await authFetch("/api/auth/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.text();
      if (!res.ok) throw new Error(data);
      setSuccess(t("forgot.success"));
      setTimeout(() => {
        onSent(email);
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow dark:shadow-lg border dark:border-gray-700"
    >
      <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-400 text-center">
        {t("forgot.title")}
      </h2>
      <div className="mb-4 relative">
        <input
          type="email"
          className={`w-full border rounded-lg px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 transition-all peer`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          autoComplete="email"
          id="forgot-email"
          placeholder={focused || email ? t("forgot.placeholder") : ""}
        />
        <label
          htmlFor="forgot-email"
          className={`absolute left-3 top-2 text-gray-500 dark:text-gray-400 pointer-events-none transition-all duration-200 bg-transparent px-1
            ${
              focused || email
                ? "-translate-y-6 scale-90 bg-white dark:bg-gray-900 px-1"
                : "top-4 text-base"
            }`}
        >
          {t("forgot.email")}
        </label>
      </div>
      {error && (
        <div className="text-red-500 dark:text-red-300 text-sm mb-2 text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-600 dark:text-green-400 text-sm mb-2 text-center">
          {success}
        </div>
      )}
      <button
        type="submit"
        className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
        disabled={loading}
      >
        {loading ? t("forgot.sending") : t("forgot.sendOtp")}
      </button>
    </form>
  );
}
