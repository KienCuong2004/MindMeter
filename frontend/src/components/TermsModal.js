import React from "react";
import { useTranslation } from "react-i18next";
import {
  FaFileContract,
  FaCheckCircle,
  FaShieldAlt,
  FaUserShield,
  FaCopyright,
  FaExclamationTriangle,
  FaEnvelope,
} from "react-icons/fa";

export default function TermsModal({ open, onClose }) {
  const { t } = useTranslation();

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 relative animate-fade-in border border-green-200 dark:border-green-700 transform transition-all duration-300"
        onClick={handleModalClick}
      >
        {/* Header with icon and gradient title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3 shadow-lg">
            <FaFileContract className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
            {t("terms.title")}
          </h2>
        </div>

        {/* Content with beautiful styling */}
        <div className="max-h-80 overflow-y-auto text-gray-700 dark:text-gray-200 text-sm leading-relaxed pr-2 custom-scrollbar">
          {/* Introduction */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border-l-4 border-green-500 dark:border-green-400 mb-4">
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
              {t("terms.intro")}
            </p>
          </div>

          {/* Terms list with enhanced styling */}
          <ol className="list-none space-y-3">
            <li className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border-l-4 border-blue-500 dark:border-blue-400 transform transition-all duration-200">
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full mr-3 text-xs font-bold flex-shrink-0">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-base text-blue-700 dark:text-blue-300 mb-1 flex items-center">
                    <FaCheckCircle className="mr-2 text-blue-500 text-sm" />
                    {t("terms.items.1.title")}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {t("terms.items.1.desc")}
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border-l-4 border-purple-500 dark:border-purple-400 transform transition-all duration-200">
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500 text-white rounded-full mr-3 text-xs font-bold flex-shrink-0">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-base text-purple-700 dark:text-purple-300 mb-1 flex items-center">
                    <FaExclamationTriangle className="mr-2 text-purple-500 text-sm" />
                    {t("terms.items.2.title")}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {t("terms.items.2.desc")}
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-3 rounded-lg border-l-4 border-red-500 dark:border-red-400 transform transition-all duration-200">
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full mr-3 text-xs font-bold flex-shrink-0">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-base text-red-700 dark:text-red-300 mb-1 flex items-center">
                    <FaCopyright className="mr-2 text-red-500 text-sm" />
                    {t("terms.items.3.title")}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {t("terms.items.3.desc")}
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-3 rounded-lg border-l-4 border-teal-500 dark:border-teal-400 transform transition-all duration-200">
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-teal-500 text-white rounded-full mr-3 text-xs font-bold flex-shrink-0">
                  4
                </span>
                <div>
                  <h3 className="font-bold text-base text-teal-700 dark:text-teal-300 mb-1 flex items-center">
                    <FaShieldAlt className="mr-2 text-teal-500 text-sm" />
                    {t("terms.items.4.title")}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {t("terms.items.4.desc")}
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-3 rounded-lg border-l-4 border-amber-500 dark:border-amber-400 transform transition-all duration-200">
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white rounded-full mr-3 text-xs font-bold flex-shrink-0">
                  5
                </span>
                <div>
                  <h3 className="font-bold text-base text-amber-700 dark:text-amber-300 mb-1 flex items-center">
                    <FaUserShield className="mr-2 text-amber-500 text-sm" />
                    {t("terms.items.5.title")}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {t("terms.items.5.desc")}
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-3 rounded-lg border-l-4 border-indigo-500 dark:border-indigo-400 transform transition-all duration-200">
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-500 text-white rounded-full mr-3 text-xs font-bold flex-shrink-0">
                  6
                </span>
                <div>
                  <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-300 mb-1 flex items-center">
                    <FaExclamationTriangle className="mr-2 text-indigo-500 text-sm" />
                    {t("terms.items.6.title")}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {t("terms.items.6.desc")}
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-3 rounded-lg border-l-4 border-emerald-500 dark:border-emerald-400 transform transition-all duration-200">
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full mr-3 text-xs font-bold flex-shrink-0">
                  7
                </span>
                <div>
                  <h3 className="font-bold text-base text-emerald-700 dark:text-emerald-300 mb-1 flex items-center">
                    <FaEnvelope className="mr-2 text-emerald-500 text-sm" />
                    {t("terms.items.7.title")}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {t("terms.items.7.desc")}
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </div>

        {/* Enhanced button */}
        <button
          className="mt-6 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-base"
          onClick={onClose}
        >
          <FaCheckCircle className="inline mr-2" />
          {t("understand")}
        </button>
      </div>
    </div>
  );
}
