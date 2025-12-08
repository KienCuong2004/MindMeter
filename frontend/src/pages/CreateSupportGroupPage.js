import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FaUsers, FaArrowLeft } from "react-icons/fa";
import supportGroupService from "../services/supportGroupService";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import logger from "../utils/logger";

const CreateSupportGroupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "GENERAL",
    maxMembers: 50,
    isPublic: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const storedUser = localStorage.getItem("user");
        let userData = {};
        if (storedUser && storedUser !== "undefined") {
          userData = JSON.parse(storedUser);
        }
        setUser({
          email: decoded.sub,
          id: decoded.id || decoded.userId || userData.id,
          role: decoded.role,
        });
      } catch (e) {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      setError(t("supportGroups.fillAllFields"));
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await supportGroupService.createGroup(formData);
      navigate(`/support-groups/${response.id}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          t("supportGroups.createError")
      );
      logger.error("Error creating group:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "DEPRESSION", label: t("supportGroups.category.DEPRESSION") },
    { value: "ANXIETY", label: t("supportGroups.category.ANXIETY") },
    { value: "STRESS", label: t("supportGroups.category.STRESS") },
    { value: "GENERAL", label: t("supportGroups.category.GENERAL") },
    { value: "PEER_SUPPORT", label: t("supportGroups.category.PEER_SUPPORT") },
    { value: "RECOVERY", label: t("supportGroups.category.RECOVERY") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader
        logoIcon={<FaUsers />}
        logoText={t("supportGroups.createGroup")}
        user={user}
        theme={theme}
        setTheme={setTheme}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/home");
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate("/support-groups")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-6"
        >
          <FaArrowLeft />
          {t("supportGroups.backToGroups")}
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            {t("supportGroups.createGroup")}
          </h1>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("supportGroups.groupName")}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("supportGroups.description")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows="6"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("supportGroups.category")}
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("supportGroups.maxMembers")}
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={formData.maxMembers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxMembers: parseInt(e.target.value),
                  })
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className="rounded"
                />
                {t("supportGroups.publicGroup")}
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/support-groups")}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("supportGroups.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? t("supportGroups.creating")
                  : t("supportGroups.create")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default CreateSupportGroupPage;
