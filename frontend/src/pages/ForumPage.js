import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaFilter } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import ForumBoard from "../components/ForumBoard";
import { useTheme } from "../hooks/useTheme";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser, getCurrentToken } from "../services/anonymousService";

const ForumPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const currentUser = getCurrentUser();
    const currentToken = getCurrentToken();

    if (currentUser) {
      setUser({
        ...currentUser,
        id: currentUser.id || currentUser.userId,
      });
    } else if (currentToken) {
      try {
        const decoded = jwtDecode(currentToken);
        const storedUser = localStorage.getItem("user");
        let userData = {};
        if (storedUser && storedUser !== "undefined") {
          userData = JSON.parse(storedUser);
        }
        setUser({
          email: decoded.sub || decoded.email || "",
          id: decoded.id || decoded.userId || userData.id,
          role: decoded.role,
          firstName: decoded.firstName || userData.firstName || "",
          lastName: decoded.lastName || userData.lastName || "",
          avatarUrl:
            decoded.avatarUrl || userData.avatarUrl || userData.avatar || null,
          avatarTimestamp: userData.avatarTimestamp || null,
          plan: decoded.plan || userData.plan || "FREE",
          phone: decoded.phone || userData.phone || "",
          anonymous: decoded.anonymous || userData.anonymous || false,
        });
      } catch (e) {
        // Handle error
      }
    }
  }, []);

  const categories = [
    { value: null, label: t("forum.allCategories") },
    { value: "GENERAL", label: t("forum.category.GENERAL") },
    { value: "SUPPORT", label: t("forum.category.SUPPORT") },
    { value: "SUCCESS_STORY", label: t("forum.category.SUCCESS_STORY") },
    { value: "QUESTION", label: t("forum.category.QUESTION") },
    { value: "DISCUSSION", label: t("forum.category.DISCUSSION") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader
        logoIcon={<FaFilter />}
        logoText={t("forum.title")}
        user={user}
        theme={theme}
        setTheme={setTheme}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/home");
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("forum.title")}
          </h1>
          {user && (
            <button
              onClick={() => navigate("/forum/create")}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              {t("forum.createPost")}
            </button>
          )}
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <ForumBoard category={selectedCategory} />
      </div>

      <FooterSection />
    </div>
  );
};

export default ForumPage;
