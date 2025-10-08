import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaSortAmountDown,
  FaFire,
  FaClock,
  FaHeart,
  FaBrain,
  FaTimes,
} from "react-icons/fa";
import BlogPostCard from "../components/BlogPostCard";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import blogService from "../services/blogService";

const BlogListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme, toggleTheme } = useTheme();

  // User state
  const [user, setUser] = useState(null);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // recent, popular, trending
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Load user information
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const storedUser = localStorage.getItem("user");
        let userData = {};

        if (storedUser && storedUser !== "undefined") {
          try {
            userData = JSON.parse(storedUser);
          } catch (e) {
            userData = {};
          }
        }

        const userObject = {
          email: decoded.sub,
          role: decoded.role,
          firstName: decoded.firstName || userData.firstName || "",
          lastName: decoded.lastName || userData.lastName || "",
          plan: decoded.plan || userData.plan || "FREE",
          phone: decoded.phone || userData.phone,
          avatarUrl: decoded.avatarUrl || userData.avatarUrl,
          anonymous: decoded.anonymous || userData.anonymous || false,
        };

        setUser(userObject);
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [postsData, categoriesData, tagsData] = await Promise.all([
        blogService.getAllPosts(0, 10),
        blogService.getAllCategories(),
        blogService.getAllTags(),
      ]);

      // If API returns error, set empty arrays
      if (postsData && postsData.error) {
        setPosts([]);
      }

      if (categoriesData && categoriesData.error) {
        setCategories([]);
      }

      if (tagsData && tagsData.error) {
        setTags([]);
      }

      // Ensure we have arrays
      const posts = Array.isArray(postsData?.content) ? postsData.content : [];
      const categories = Array.isArray(categoriesData) ? categoriesData : [];
      const tags = Array.isArray(tagsData) ? tagsData : [];

      // If no data, set empty arrays to prevent map errors
      if (!Array.isArray(categories)) {
        console.warn("Categories data is not an array:", categories);
        setCategories([]);
      } else {
        setCategories(categories);
      }

      if (!Array.isArray(tags)) {
        console.warn("Tags data is not an array:", tags);
        setTags([]);
      } else {
        setTags(tags);
      }

      setPosts(posts);
      setHasMore(postsData?.last === false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    try {
      setLoading(true);
      setCurrentPage(0);

      let postsData;
      if (searchTerm) {
        postsData = await blogService.searchPosts(searchTerm, 0, 10);
      } else if (selectedCategory) {
        postsData = await blogService.getPostsByCategory(
          selectedCategory,
          0,
          10
        );
      } else if (selectedTag) {
        postsData = await blogService.getPostsByTag(selectedTag, 0, 10);
      } else {
        postsData = await blogService.getAllPosts(0, 10);
      }

      setPosts(postsData.content || []);
      setHasMore(!postsData.last);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedTag]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchTerm || selectedCategory || selectedTag || sortBy) {
      handleSearch();
    }
  }, [searchTerm, selectedCategory, selectedTag, sortBy, handleSearch]);

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const nextPage = currentPage + 1;

      let postsData;
      if (searchTerm) {
        postsData = await blogService.searchPosts(searchTerm, nextPage, 10);
      } else if (selectedCategory) {
        postsData = await blogService.getPostsByCategory(
          selectedCategory,
          nextPage,
          10
        );
      } else if (selectedTag) {
        postsData = await blogService.getPostsByTag(selectedTag, nextPage, 10);
      } else {
        postsData = await blogService.getAllPosts(nextPage, 10);
      }

      setPosts((prev) => [...prev, ...(postsData.content || [])]);
      setCurrentPage(nextPage);
      setHasMore(!postsData.last);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (postId, isLiked) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked,
              likeCount: isLiked ? post.likeCount + 1 : post.likeCount - 1,
            }
          : post
      )
    );
  };

  const handleBookmark = (postId, isBookmarked) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isBookmarked } : post
      )
    );
  };

  const handleShare = (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setShowShareModal(true);
    }
  };

  const handleSocialShare = async (platform) => {
    if (!selectedPost) return;

    const url = `${window.location.origin}/blog/post/${selectedPost.id}`;
    const title = selectedPost.title;
    const description =
      selectedPost.excerpt || selectedPost.content.substring(0, 200) + "...";

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        // Chỉ hiển thị nội dung cho người dùng nhập
        shareUrl = `https://www.facebook.com/sharer/sharer.php`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title)}&hashtags=${encodeURIComponent(
          "MindMeter,SứcKhỏeTâmThần"
        )}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(
          description
        )}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(
          title + " - " + url
        )}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title + " - " + description)}`;
        break;
      case "copy":
        try {
          await navigator.clipboard.writeText(url);
          setToastMessage("Đã sao chép liên kết vào clipboard!");
          setShowToast(true);
          setShowShareModal(false);
          setTimeout(() => setShowToast(false), 3000);
          return;
        } catch (err) {
          console.error("Failed to copy: ", err);
          setToastMessage("Không thể sao chép liên kết");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          return;
        }
      default:
        return;
    }

    // Open sharing window
    window.open(shareUrl, "_blank", "width=600,height=400");

    // Close modal after opening share window
    setShowShareModal(false);

    // Record share in backend if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await blogService.createShare(selectedPost.id, {
          platform,
          sharedUrl: url,
        });

        // Update share count in local state
        setPosts((prev) =>
          prev.map((post) =>
            post.id === selectedPost.id
              ? { ...post, shareCount: post.shareCount + 1 }
              : post
          )
        );
      } catch (error) {
        console.error("Error recording share:", error);
      }
    }
  };

  const handleComment = (postId) => {
    // Navigate to post detail page using React Router
    navigate(`/blog/post/${postId}`);
  };

  const getSortIcon = () => {
    switch (sortBy) {
      case "recent":
        return <FaClock className="text-blue-500" />;
      case "popular":
        return <FaHeart className="text-red-500" />;
      case "trending":
        return <FaFire className="text-orange-500" />;
      default:
        return <FaSortAmountDown />;
    }
  };

  // Handler functions for DashboardHeader
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const handleProfile = () => {
    if (user?.role === "ADMIN") {
      navigate("/admin/profile");
    } else if (user?.role === "EXPERT") {
      navigate("/expert/profile");
    } else if (user?.role === "STUDENT") {
      navigate("/student/profile");
    }
  };

  const handleNotificationClick = () => {
    // Handle notification click
  };

  const handleStartTour = () => {
    // Handle start tour
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("blog.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t("blog.error.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("blog.error.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Dashboard Header */}
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("blog.title")}
        user={user}
        theme={theme}
        setTheme={setTheme}
        onNotificationClick={handleNotificationClick}
        onLogout={handleLogout}
        onProfile={handleProfile}
        onStartTour={handleStartTour}
      />

      {/* Main Content */}
      <div className="pt-20">
        {/* Blog Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t("blog.title")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {t("blog.subtitle")}
                </p>
              </div>
              <button
                onClick={() => navigate("/blog/create")}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
                <span>{t("blog.createPost")}</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("blog.search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t("blog.filters.allCategories")}</option>
                  {categories &&
                    Array.isArray(categories) &&
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>

                {/* Tag Filter */}
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t("blog.filters.allTags")}</option>
                  {tags &&
                    Array.isArray(tags) &&
                    tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                </select>

                {/* Sort Filter */}
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recent">{t("blog.sort.recent")}</option>
                    <option value="popular">{t("blog.sort.popular")}</option>
                    <option value="trending">{t("blog.sort.trending")}</option>
                  </select>
                  {getSortIcon()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {loading && posts.length === 0 ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
                Blog
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t("blog.empty.title")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("blog.empty.description")}
              </p>
              <button
                onClick={() => navigate("/blog/create")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("blog.empty.createFirst")}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <BlogPostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                  onComment={handleComment}
                />
              ))}

              {hasMore && (
                <div className="text-center py-8">
                  <button
                    onClick={loadMorePosts}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? t("blog.loading") : t("blog.loadMore")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chia sẻ bài viết
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialShare("facebook")}
                className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">f</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">
                  Facebook
                </span>
              </button>

              <button
                onClick={() => handleSocialShare("twitter")}
                className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">𝕏</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">
                  Twitter
                </span>
              </button>

              <button
                onClick={() => handleSocialShare("linkedin")}
                className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">in</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">
                  LinkedIn
                </span>
              </button>

              <button
                onClick={() => handleSocialShare("whatsapp")}
                className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">
                  WhatsApp
                </span>
              </button>

              <button
                onClick={() => handleSocialShare("telegram")}
                className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">
                  Telegram
                </span>
              </button>

              <button
                onClick={() => handleSocialShare("copy")}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📋</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium">
                  Sao chép link
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default BlogListPage;
