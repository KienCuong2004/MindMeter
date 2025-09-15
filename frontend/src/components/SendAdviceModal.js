import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { authFetch } from "../authFetch";

const adviceTypes = [
  { value: "MOTIVATION", labelKey: "adviceTypeEncourage" },
  { value: "WARNING", labelKey: "adviceTypeWarning" },
  { value: "GUIDE", labelKey: "adviceTypeGuide" },
  { value: "INFO", labelKey: "adviceTypeInfo" },
];

export default function SendAdviceModal({
  open,
  onClose,
  student,
  testResultId,
  onSuccess,
}) {
  const { t } = useTranslation();
  const [adviceType, setAdviceType] = useState("MOTIVATION");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Xử lý phím ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open && !sending) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll khi modal mở
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore body scroll khi modal đóng
      document.body.style.overflow = "unset";
    };
  }, [open, onClose, sending]);

  if (!open || !student) return null;

  const handleSend = async () => {
    setError("");
    setSuccess("");
    if (!message.trim()) {
      setError(t("adviceContentRequired"));
      setTimeout(() => setError(""), 2500);
      return;
    }
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const receiverId = student.id || student.studentId || student._id;
      if (!receiverId) {
        setError(t("common.studentNotFound"));
        setSending(false);
        return;
      }
      const res = await authFetch("/api/expert/advice", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId,
          testResultId,
          messageType: "ADVICE",
          message,
        }),
      });
      if (!res.ok) throw new Error(t("adviceSendFail"));
      setSuccess(t("adviceSendSuccess"));
      setTimeout(() => setSuccess(""), 2500);
      setMessage("");
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      setError(e.message || t("adviceSendFail"));
      setTimeout(() => setError(""), 2500);
    } finally {
      setSending(false);
    }
  };

  const handleOverlayClick = (e) => {
    // Chỉ đóng modal khi click vào overlay (không phải modal content) và không đang gửi
    if (e.target === e.currentTarget && !sending) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-blue-100 dark:border-gray-700">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition"
          onClick={onClose}
          disabled={sending}
        >
          ×
        </button>
        <h2 className="text-2xl font-extrabold mb-6 text-center text-blue-600 dark:text-blue-300 tracking-wide">
          {t("sendAdvice")}
        </h2>
        <div className="mb-4 text-sm text-gray-700 dark:text-gray-200 space-y-1">
          <div>
            <b>{t("studentNameSurveyHeader")}: </b>
            {student.name ||
              student.studentName ||
              student.fullName ||
              student.email}
          </div>
          <div>
            <b>Email:</b> {student.email}
          </div>
          {student.totalScore !== undefined && (
            <div>
              <b>{t("scoreHeader")}: </b>
              {student.totalScore}
            </div>
          )}
          {student.severityLevel && (
            <div>
              <b>{t("severityHeader")}: </b>
              {t(student.severityLevel.toLowerCase())}
            </div>
          )}
          {student.diagnosis && (
            <div>
              <b>{t("diagnosisHeader")}: </b>
              {student.diagnosis}
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">
            {t("adviceTypeLabel")}
          </label>
          <select
            className="w-full border border-blue-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-gray-700 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none"
            value={adviceType}
            onChange={(e) => setAdviceType(e.target.value)}
            disabled={sending}
          >
            {adviceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">
            {t("adviceContentLabel")}
          </label>
          <textarea
            className="w-full border border-blue-200 dark:border-gray-700 rounded-lg px-4 py-2 min-h-[90px] focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-gray-700 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            disabled={sending}
            placeholder={t("adviceContentPlaceholder")}
          />
          <div className="text-xs text-gray-400 dark:text-gray-500 text-right mt-1">
            {message.length}/500
          </div>
        </div>
        {error && (
          <div className="text-red-500 dark:text-red-300 mb-3 text-sm font-semibold text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 dark:text-green-300 mb-3 text-sm font-semibold text-center">
            {success}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-6 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition min-w-[100px]"
            onClick={onClose}
            disabled={sending}
          >
            {t("cancel")}
          </button>
          <button
            className="px-6 py-2 rounded-xl bg-blue-600 dark:bg-blue-400 text-white dark:text-gray-900 font-bold hover:bg-blue-700 dark:hover:bg-blue-500 transition min-w-[140px] disabled:opacity-60 shadow"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? t("saving") : t("sendAdvice")}
          </button>
        </div>
      </div>
    </div>
  );
}
