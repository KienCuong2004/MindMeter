import React, { useState } from "react";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const ReportPostModal = ({
  isOpen,
  onClose,
  onSubmit,
  postTitle,
  hasReported,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reportReasons = [
    { value: "SPAM", label: t("blog.report.reason.spam") },
    { value: "INAPPROPRIATE", label: t("blog.report.reason.inappropriate") },
    { value: "HARASSMENT", label: t("blog.report.reason.harassment") },
    { value: "FALSE_INFO", label: t("blog.report.reason.falseInfo") },
    { value: "OTHER", label: t("blog.report.reason.other") },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!reason) {
      setError(t("blog.report.error.selectReason"));
      return;
    }

    if (reason === "OTHER" && !description.trim()) {
      setError(t("blog.report.error.descriptionRequired"));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(reason, description);
      // Reset form on success
      setReason("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err.message || t("blog.report.error.submitFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDescription("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  if (hasReported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("blog.report.alreadyReported")}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <FaExclamationTriangle className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t("blog.report.alreadyReportedMessage")}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("blog.report.title")}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t("blog.report.description")}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("blog.report.reason.label")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("blog.report.reason.select")}</option>
              {reportReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("blog.report.description.label")}
              {reason === "OTHER" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={t("blog.report.description.placeholder")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {reason !== "OTHER" && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("blog.report.description.optional")}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("common.processing") : t("blog.report.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportPostModal;
