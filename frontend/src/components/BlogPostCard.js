import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaEllipsisH,
  FaUser,
  FaCalendarAlt,
  FaEye,
  FaTag,
  FaExclamationTriangle,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import blogService from "../services/blogService";
import logger from "../utils/logger";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useSavedArticles } from "../contexts/SavedArticlesContext";
import ReportPostModal from "./blog/ReportPostModal";

const BlogPostCard = ({
  post,
  onLike,
  onBookmark,
  onShare,
  onComment,
  currentUser,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { saveArticle, unsaveArticle } =
    useSavedArticles();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount] = useState(post.commentCount || 0);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const menuRef = useRef(null);

  const currentLocale = i18n.language === "vi" ? vi : enUS;

  // Check if current user is the author
  // Try multiple ways to check: by authorId, authorEmail, or author.email
  const isAuthor = React.useMemo(() => {
    if (!currentUser || !post) return false;

    // Check by email (most reliable since JWT has email)
    if (post.authorEmail && currentUser.email === post.authorEmail) {
      return true;
    }

    // Check by authorId (if user has id)
    if (
      post.authorId &&
      (currentUser.id === post.authorId || currentUser.userId === post.authorId)
    ) {
      return true;
    }

    // Check by author object
    if (post.author) {
      if (post.author.email && currentUser.email === post.author.email) {
        return true;
      }
      if (
        post.author.id &&
        (currentUser.id === post.author.id ||
          currentUser.userId === post.author.id)
      ) {
        return true;
      }
    }

    return false;
  }, [currentUser, post]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await blogService.toggleLike(post.id);
      setIsLiked(result);
      // Reload post data to get accurate like count from server
      const updatedPost = await blogService.getPostById(post.id);
      setLikeCount(updatedPost.likeCount);
      if (onLike) onLike(post.id, result);
    } catch (error) {
      logger.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (isLoading) return;

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      // You might want to show a login prompt here
      return;
    }

    setIsLoading(true);
    try {
      // Use backend API to toggle bookmark
      const result = await blogService.toggleBookmark(post.id);
      setIsBookmarked(result);

      // Also update localStorage system for saved articles count display
      if (result) {
        // Bookmarked - add to localStorage
        saveArticle(post);
      } else {
        // Unbookmarked - remove from localStorage
        unsaveArticle(post.id);
      }

      // Also call the original onBookmark callback if provided
      if (onBookmark) onBookmark(post.id, result);
    } catch (error) {
      logger.error("Error toggling bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (platform) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await blogService.createShare(post.id, {
        platform,
        sharedUrl: window.location.href,
      });
      setShareCount((prev) => prev + 1);
      if (onShare) onShare(post.id, platform);
    } catch (error) {
      logger.error("Error sharing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = () => {
    if (onComment) onComment(post.id);
  };

  const handleReport = async (reason, description) => {
    try {
      await blogService.reportPost(post.id, reason, description);
      setHasReported(true);
      setShowReportModal(false);
    } catch (error) {
      logger.error("Error reporting post:", error);
      throw error;
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    navigate(`/blog/edit/${post.id}`);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (
      window.confirm(
        t("blog.post.delete.confirm") ||
          "Bạn có chắc chắn muốn xóa bài viết này?"
      )
    ) {
      try {
        await blogService.deletePost(post.id);
        if (onDelete) onDelete(post.id);
      } catch (error) {
        logger.error("Error deleting post:", error);
        alert(t("blog.post.delete.error") || "Có lỗi xảy ra khi xóa bài viết");
      }
    }
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <FaUser className="text-white text-lg" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {post.authorName}
              </h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
                <FaCalendarAlt className="text-xs" />
                <span>
                  {formatDate(
                    post.publishedAt || post.createdAt || post.updatedAt
                  )}
                </span>
                {post.viewCount > 0 && (
                  <>
                    <span>•</span>
                    <FaEye className="text-xs" />
                    <span>
                      {post.viewCount} {t("blog.views")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {post.status === "pending" && (
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {t("blog.status.pending") || "Chờ duyệt"}
              </span>
            )}
            {post.isFeatured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {t("blog.featured")}
              </span>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <FaEllipsisH className="text-gray-500 dark:text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    {/* Report - Show for non-authors */}
                    {!isAuthor && currentUser && (
                      <button
                        onClick={() => {
                          setShowReportModal(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <FaExclamationTriangle className="text-red-500" />
                        <span>
                          {t("blog.post.menu.report") || "Báo cáo bài viết"}
                        </span>
                      </button>
                    )}

                    {/* Edit - Show for authors */}
                    {isAuthor && (
                      <button
                        onClick={handleEdit}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <FaEdit className="text-blue-500" />
                        <span>
                          {t("blog.post.menu.edit") || "Sửa bài viết"}
                        </span>
                      </button>
                    )}

                    {/* Delete - Show for authors */}
                    {isAuthor && (
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <FaTrash className="text-red-500" />
                        <span>
                          {t("blog.post.menu.delete") || "Xóa bài viết"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h2
          className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
          onClick={() => onComment && onComment(post.id)}
        >
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {post.featuredImage && (
          <div className="mb-4">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Categories and Tags */}
        {(post.categories?.length > 0 || post.tags?.length > 0) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.categories?.map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {category.name}
              </span>
            ))}
            {post.tags?.map((tag) => (
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
          <p>{getShortContent(post.content)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isLiked
                  ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                  : "text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              }`}
            >
              <FaHeart className={isLiked ? "fill-current" : ""} />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>

            <button
              onClick={handleComment}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <FaComment />
              <span className="text-sm font-medium">{commentCount}</span>
            </button>

            <button
              onClick={() => handleShare("facebook")}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <FaShare />
              <span className="text-sm font-medium">{shareCount}</span>
            </button>
          </div>

          <button
            onClick={handleBookmark}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked
                ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            }`}
          >
            <FaBookmark className={isBookmarked ? "fill-current" : ""} />
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {currentUser && (
        <ReportPostModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
          postTitle={post.title}
          hasReported={hasReported}
        />
      )}
    </div>
  );
};

export default BlogPostCard;
