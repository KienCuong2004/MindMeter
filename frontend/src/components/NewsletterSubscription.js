import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaEnvelope, FaCheckCircle, FaTimes } from "react-icons/fa";
import NewsletterService from "../services/newsletterService";

const NewsletterSubscription = ({ className = "" }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await NewsletterService.subscribe(email, firstName, lastName);
      setSuccess(true);
      setShowForm(false);
      setTimeout(() => {
        setEmail("");
        setFirstName("");
        setLastName("");
        setSuccess(false);
        setShowForm(true);
      }, 3000);
    } catch (err) {
      setError(err.message || t("newsletter.subscribeError"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-3">
          <FaCheckCircle className="text-green-500 text-2xl" />
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-200">
              {t("newsletter.successTitle")}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {t("newsletter.successMessage")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
            <FaEnvelope className="text-white text-xl" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t("newsletter.title")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {t("newsletter.description")}
          </p>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t("newsletter.firstName")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={t("newsletter.lastName")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t("newsletter.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      {t("newsletter.subscribing")}
                    </>
                  ) : (
                    <>
                      <FaEnvelope />
                      {t("newsletter.subscribe")}
                    </>
                  )}
                </button>
              </div>
              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <FaTimes />
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterSubscription;

