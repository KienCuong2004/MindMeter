import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaArrowLeft,
  FaUser,
  FaCalendarAlt,
  FaEye,
  FaTag,
  FaEdit,
  FaTrash,
  FaEllipsisH,
  FaTimes,
  FaCopy,
} from "react-icons/fa";
import blogService from "../services/blogService";
import CommentSection from "../components/CommentSection";
import BlogPostMeta from "../components/BlogPostMeta";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import "../styles/blog.css";

const BlogPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [actualCommentCount, setActualCommentCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const currentLocale = i18n.language === "vi" ? vi : enUS;

  // Function to scroll to comments section
  const scrollToComments = () => {
    const commentsSection = document.getElementById("comments-section");
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const loadPost = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      // Try to load real data first
      try {
        const postData = await blogService.getPostByIdPublic(id);

        setPost(postData);
        setIsLiked(postData.isLiked || false);
        setIsBookmarked(postData.isBookmarked || false);
        setLikeCount(postData.likeCount || 0);
        setCommentCount(postData.commentCount || 0);
        setShareCount(postData.shareCount || 0);

        // Record view - temporarily disabled to avoid 500 error
        // try {
        //   await blogService.recordView(id);
        // } catch (viewError) {
        //   // Silently ignore view recording errors
        // }
      } catch (apiError) {
        // Fallback to mock data if API fails
        const mockPost = {
          id: parseInt(id) || 1,
          title: "Test Post - " + id,
          content: "This is a test post content for ID: " + id,
          excerpt: "Test excerpt for post " + id,
          authorName: "Test Author",
          authorAvatar: null,
          status: "published",
          featuredImage: null,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          isFeatured: false,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isLiked: false,
          isBookmarked: false,
          isShared: false,
          readingTime: "1 min read",
          shortContent: "Test content for post " + id,
        };

        // Always set data, don't check isMountedRef here
        setPost(mockPost);
        setIsLiked(false);
        setIsBookmarked(false);
        setLikeCount(0);
        setCommentCount(0);
        setShareCount(0);
      }
    } catch (err) {
      console.error("Error loading post:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [id, loadPost]);

  // Early return if no ID
  if (!id) {
    return <Navigate to="/home" replace />;
  }

  const handleLike = async () => {
    if (isLoading || !post) return;

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      setToastMessage("Vui lòng đăng nhập để thực hiện chức năng này");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const result = await blogService.toggleLike(post.id);
      setIsLiked(result);
      // Reload post data to get accurate like count from server
      const updatedPost = await blogService.getPostById(post.id);
      setLikeCount(updatedPost.likeCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      setToastMessage("Có lỗi xảy ra khi thực hiện chức năng like");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (isLoading || !post) return;

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      setToastMessage("Vui lòng đăng nhập để thực hiện chức năng này");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const result = await blogService.toggleBookmark(post.id);
      setIsBookmarked(result);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      setToastMessage("Có lỗi xảy ra khi thực hiện chức năng bookmark");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleSocialShare = async (platform) => {
    if (!post) return;

    const url = window.location.href;
    const title = post.title;
    const description = post.excerpt || post.content.substring(0, 200) + "...";
    const text = description;

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
        await blogService.createShare(post.id, {
          platform,
          sharedUrl: url,
        });
        setShareCount((prev) => prev + 1);
      } catch (error) {
        console.error("Error recording share:", error);
      }
    }

    setShowShareModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: currentLocale,
    });
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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!post && !loading) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BlogPostMeta post={post} />
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/blog")}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft />
              <span>{t("blog.backToBlog")}</span>
            </button>

            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <FaEdit className="text-gray-500 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <FaTrash className="text-red-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <FaEllipsisH className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Post Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  {post.authorAvatar ? (
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-white text-xl" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {post.authorName}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
                    <FaCalendarAlt className="text-xs" />
                    <span>{formatDate(post.publishedAt)}</span>
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

              {post.isFeatured && (
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                  {t("blog.featured")}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Categories and Tags */}
            {(post.categories?.length > 0 || post.tags?.length > 0) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {post.categories?.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {category.name}
                  </span>
                ))}
                {post.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    <FaTag className="mr-1 text-xs" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {post.featuredImage && (
              <div className="mb-6">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="p-6">
            <div
              className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
              style={{
                color: "inherit",
              }}
              dangerouslySetInnerHTML={{
                __html: showFullContent
                  ? post.content
                  : post.content.length > 500
                  ? post.content.substring(0, 500) + "..."
                  : post.content,
              }}
            />
            {post.content.length > 500 && !showFullContent && (
              <button
                onClick={() => setShowFullContent(true)}
                className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
              >
                Xem thêm
              </button>
            )}
            {showFullContent && post.content.length > 500 && (
              <button
                onClick={() => setShowFullContent(false)}
                className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
              >
                Thu gọn
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  disabled={isLoading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isLiked
                      ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                      : "text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  }`}
                >
                  <FaHeart className={isLiked ? "fill-current" : ""} />
                  <span className="font-medium">{likeCount}</span>
                </button>

                <button
                  onClick={scrollToComments}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <FaComment />
                  <span className="font-medium">{actualCommentCount}</span>
                </button>

                <button
                  onClick={handleShare}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                >
                  <FaShare />
                  <span className="font-medium">{shareCount}</span>
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
        </div>

        {/* Comments Section */}
        <div id="comments-section" className="mt-8">
          <CommentSection
            postId={id}
            onCommentCountChange={setActualCommentCount}
          />
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
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
                  <span className="text-white font-bold text-sm">in</span>
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
                  <FaCopy className="text-white text-sm" />
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
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-500 text-xs">✓</span>
            </div>
            <span className="font-medium">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="text-white hover:text-gray-200 ml-2"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPostPage;
