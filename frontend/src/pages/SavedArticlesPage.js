import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  FaBrain,
  FaBookmark,
  FaHeart,
  FaComment,
  FaShare,
  FaEye,
  FaCalendarAlt,
  FaTag,
  FaUser,
  FaTrash,
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaSpinner,
} from "react-icons/fa";
import blogService from "../services/blogService";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { jwtDecode } from "jwt-decode";
import { handleLogout } from "../utils/logoutUtils";

const SavedArticlesPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // recent, title, author
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  const currentLocale = i18n.language === "vi" ? vi : enUS;

  // Load user data and bookmarks
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem("token");
        const anonymousToken = localStorage.getItem("anonymousToken");
        const storedUser = localStorage.getItem("user");

        if (token) {
          const tokenData = jwtDecode(token);
          let userData = {};

          if (storedUser && storedUser !== "undefined") {
            try {
              userData = JSON.parse(storedUser);
            } catch (e) {
              userData = {};
            }
          }

          const userObject = {
            email: tokenData.sub,
            role: tokenData.role,
            firstName: tokenData.firstName || userData.firstName || "",
            lastName: tokenData.lastName || userData.lastName || "",
            plan: tokenData.plan || userData.plan || "FREE",
            phone: tokenData.phone || userData.phone,
            avatarUrl: tokenData.avatarUrl || userData.avatarUrl,
            anonymous: tokenData.anonymous || userData.anonymous || false,
          };

          setUser(userObject);
          return true; // User is authenticated
        } else if (anonymousToken) {
          setUser({
            email: "anonymous",
            role: "ANONYMOUS",
            firstName: t("anonymous.user"),
            lastName: t("anonymous.anonymous"),
            anonymous: true,
          });
          return false; // Anonymous user
        }
        return false; // No user
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
        return false;
      }
    };

    const isAuthenticated = loadUser();
    
    // Load bookmarks if user is authenticated
    if (isAuthenticated) {
      loadBookmarks(0);
    } else {
      setLoading(false);
      setError(t("blog.savedArticles.loginRequired") || "Please login to view your saved articles");
    }
  }, [t]);

  // Load bookmarks from API
  const loadBookmarks = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page,
        size: 20, // Number of items per page
        sort: "createdAt,desc"
      };
      
      const response = await blogService.getMyBookmarks(params);
      
      if (page === 0) {
        // First page - replace all articles
        setSavedArticles(response.content || []);
      } else {
        // Subsequent pages - append to existing articles
        setSavedArticles(prev => [...prev, ...(response.content || [])]);
      }
      
      setCurrentPage(page);
      setHasMore(!response.last);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      setError(t("blog.savedArticles.loadError") || "Failed to load saved articles");
      if (error.response?.status === 401) {
        // User not authenticated
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load more bookmarks (pagination)
  const loadMore = () => {
    if (!loading && hasMore) {
      loadBookmarks(currentPage + 1);
    }
  };

  // Filter and sort articles
  useEffect(() => {
    let filtered = [...savedArticles];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (article) =>
          article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (article.excerpt &&
            article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort articles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "author":
          return (a.authorName || "").localeCompare(b.authorName || "");
        case "recent":
        default:
          // Sort by publishedAt (most recent first)
          const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
          const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
          return dateB - dateA;
      }
    });

    setFilteredArticles(filtered);
  }, [savedArticles, searchTerm, sortBy]);

  const handleUnsaveArticle = async (articleId) => {
    try {
      await blogService.toggleBookmark(articleId);
      // Remove from local state
      setSavedArticles(prev => prev.filter(article => article.id !== articleId));
      setTotalElements(prev => prev - 1);
    } catch (error) {
      console.error("Error unsaving article:", error);
      setError(t("blog.savedArticles.unsaveError") || "Failed to unsave article");
    }
  };

  const handleClearAll = async () => {
    try {
      // Unbookmark all articles
      const promises = savedArticles.map(article => 
        blogService.toggleBookmark(article.id).catch(err => {
          console.error(`Error unsaving article ${article.id}:`, err);
          return null;
        })
      );
      
      await Promise.all(promises);
      
      // Clear local state
      setSavedArticles([]);
      setTotalElements(0);
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Error clearing all bookmarks:", error);
      setError(t("blog.savedArticles.clearError") || "Failed to clear all bookmarks");
    }
  };

  const handleViewArticle = (articleId) => {
    navigate(`/blog/post/${articleId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: currentLocale,
    });
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const getShortContent = (content, maxLength = 200) => {
    const plainText = stripHtml(content);
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText;
  };

  const handleLogoutLocal = () => {
    handleLogout();
  };

  const handleProfile = () => {
    navigate("/student/profile");
  };

  const handleNotificationClick = () => {
    // Handle notification click
  };

  const handleStartTour = () => {
    // Handle start tour
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Dashboard Header */}
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("blog.savedArticles.title")}
        user={user}
        theme={theme}
        setTheme={setTheme}
        i18n={i18n}
        onNotificationClick={handleNotificationClick}
        onLogout={handleLogoutLocal}
        onProfile={handleProfile}
        onStartTour={handleStartTour}
      />

      {/* Main Content */}
      <div className="pt-20">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/blog")}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t("blog.savedArticles.title")}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {`${totalElements} ${t(
                      "blog.savedArticles.articleText"
                    )}`}
                  </p>
                </div>
              </div>
              {savedArticles.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FaTrash />
                  <span>{t("blog.savedArticles.clearAll")}</span>
                </button>
              )}
            </div>

            {/* Search and Filters */}
            {savedArticles.length > 0 && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("blog.savedArticles.search.placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Sort Filter */}
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recent">
                      {t("blog.savedArticles.sort.recent")}
                    </option>
                    <option value="title">
                      {t("blog.savedArticles.sort.title")}
                    </option>
                    <option value="author">
                      {t("blog.savedArticles.sort.author")}
                    </option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {loading && savedArticles.length === 0 ? (
            <div className="text-center py-12">
              <FaSpinner className="text-gray-400 dark:text-gray-500 text-6xl mb-4 animate-spin mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t("blog.savedArticles.loading") || "Loading..."}
              </h3>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 dark:text-red-500 text-6xl mb-4">
                <FaBookmark />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {error}
              </h3>
              <button
                onClick={() => loadBookmarks(0)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4"
              >
                {t("common.retry") || "Retry"}
              </button>
            </div>
          ) : savedArticles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
                <FaBookmark />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t("blog.savedArticles.empty.title")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("blog.savedArticles.empty.description")}
              </p>
              <button
                onClick={() => navigate("/blog")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("blog.savedArticles.empty.browseArticles")}
              </button>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
                <FaSearch />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t("blog.savedArticles.noResults.title")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("blog.savedArticles.noResults.description")}
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t("blog.savedArticles.noResults.clearSearch")}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          {article.authorAvatar ? (
                            <img
                              src={article.authorAvatar}
                              alt={article.authorName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <FaUser className="text-white text-lg" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {article.authorName}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
                            <FaCalendarAlt className="text-xs" />
                            <span>{formatDate(article.publishedAt)}</span>
                            {article.viewCount > 0 && (
                              <>
                                <span>•</span>
                                <FaEye className="text-xs" />
                                <span>
                                  {article.viewCount} {t("blog.views")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUnsaveArticle(article.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t("blog.savedArticles.unsave")}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h2
                      className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      onClick={() => handleViewArticle(article.id)}
                    >
                      {article.title}
                    </h2>

                    {article.excerpt && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}

                    {article.featuredImage && (
                      <div className="mb-4">
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Categories and Tags */}
                    {(article.categories?.length > 0 ||
                      article.tags?.length > 0) && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {article.categories?.map((category) => (
                          <span
                            key={category.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {category.name}
                          </span>
                        ))}
                        {article.tags?.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          >
                            <FaTag className="mr-1 text-xs" />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      <p>{getShortContent(article.content)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <FaHeart />
                          <span className="text-sm font-medium">
                            {article.likeCount || 0}
                          </span>
                        </button>

                        <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <FaComment />
                          <span className="text-sm font-medium">
                            {article.commentCount || 0}
                          </span>
                        </button>

                        <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                          <FaShare />
                          <span className="text-sm font-medium">
                            {article.shareCount || 0}
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleViewArticle(article.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t("blog.savedArticles.viewArticle")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>{t("blog.savedArticles.loading") || "Loading..."}</span>
                      </>
                    ) : (
                      <span>{t("blog.savedArticles.loadMore") || "Load More"}</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("blog.savedArticles.clearConfirm.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("blog.savedArticles.clearConfirm.description")}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t("blog.savedArticles.clearAll")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default SavedArticlesPage;
