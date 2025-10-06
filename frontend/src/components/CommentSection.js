import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FaHeart,
  FaReply,
  FaUser,
  FaEdit,
  FaTrash,
  FaEllipsisV,
} from "react-icons/fa";
import blogService from "../services/blogService";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";

const CommentSection = ({
  postId,
  onCommentCountChange,
  currentUser,
  canDeleteComment,
  onDeleteComment,
}) => {
  const { t, i18n } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const currentLocale = i18n.language === "vi" ? vi : enUS;

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const commentsData = await blogService.getComments(postId, 0, 10);
      setComments(commentsData.content || []);
      setHasMore(!commentsData.last);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Notify parent component when comment count changes
  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(comments.length);
    }
  }, [comments.length, onCommentCountChange]);

  const loadMoreComments = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const nextPage = currentPage + 1;
      const commentsData = await blogService.getComments(postId, nextPage, 10);
      setComments((prev) => [...prev, ...(commentsData.content || [])]);
      setCurrentPage(nextPage);
      setHasMore(!commentsData.last);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        content: newComment.trim(),
        parentId: replyingTo,
      };

      const newCommentData = await blogService.createComment(
        postId,
        commentData
      );
      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");
      setReplyingTo(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await blogService.deleteComment(commentId);
      // Refresh comments after deletion
      loadComments();
      // Call parent's onDeleteComment for success toast notification
      if (onDeleteComment) {
        onDeleteComment(commentId);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      // TODO: Show error toast notification here
    }
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    setNewComment("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    // Debug timezone issue
    console.log("=== DATE DEBUG ===");
    console.log("Original dateString:", dateString);
    console.log("Parsed date:", date);
    console.log("Date ISO:", date.toISOString());
    console.log("Date local:", date.toString());
    console.log("Current time:", now);
    console.log("Current ISO:", now.toISOString());
    console.log("Difference (hours):", (now - date) / (1000 * 60 * 60));
    console.log("==================");

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: currentLocale,
    });
  };

  const CommentItem = ({ comment, level = 0, onCommentUpdate }) => {
    const [isLiked] = useState(comment.isLiked || false);
    const [likeCount] = useState(comment.likeCount || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setShowMenu(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleLike = async () => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        // This would need to be implemented in blogService
        // const result = await blogService.toggleCommentLike(comment.id);
        // setIsLiked(result);
        // setLikeCount(prev => result ? prev + 1 : prev - 1);
      } catch (error) {
        console.error("Error toggling comment like:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleDelete = async () => {
      if (!canDeleteComment || !canDeleteComment(comment)) return;

      setShowDeleteModal(true);
      setShowMenu(false);
    };

    const confirmDelete = async () => {
      try {
        await handleDeleteComment(comment.id);
        setShowDeleteModal(false);
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    };

    const handleEdit = () => {
      setIsEditing(true);
      setShowMenu(false);
    };

    const handleSaveEdit = async () => {
      if (!editContent.trim()) return;

      try {
        setIsLoading(true);

        // Call real edit comment API
        const updatedComment = await blogService.editComment(
          comment.id,
          editContent
        );

        // Update the comment content locally with server response
        comment.content = updatedComment.content;
        comment.updatedAt = updatedComment.updatedAt;

        setIsEditing(false);
        setShowMenu(false);

        // Refresh comments to get updated data from server
        if (onCommentUpdate) {
          onCommentUpdate();
        }
      } catch (error) {
        console.error("Error editing comment:", error);
        // Reset to original content on error
        setEditContent(comment.content);
      } finally {
        setIsLoading(false);
      }
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditContent(comment.content);
      setShowMenu(false);
    };

    return (
      <div className={`${level > 0 ? "ml-8 mt-4" : ""}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              {comment.userAvatar ? (
                <img
                  src={comment.userAvatar}
                  alt={comment.userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <FaUser className="text-white text-sm" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {comment.userName}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.updatedAt &&
                      new Date(comment.updatedAt).getTime() >
                        new Date(comment.createdAt).getTime() && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                          {t("blog.comment.edited")}
                        </span>
                      )}
                  </div>
                </div>

                {/* Menu button for comment author or admin */}
                {canDeleteComment && canDeleteComment(comment) && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <FaEllipsisV className="text-gray-400 text-xs" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10 min-w-[120px]">
                        <button
                          onClick={handleEdit}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                        >
                          <FaEdit className="text-xs" />
                          <span>{t("blog.comment.edit")}</span>
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                        >
                          <FaTrash className="text-xs" />
                          <span>{t("blog.comment.delete")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mb-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
                    rows="3"
                    maxLength="1000"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim() || isLoading}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? t("common.saving") : t("common.save")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                  {comment.content}
                </p>
              )}

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  disabled={isLoading}
                  className={`flex items-center space-x-1 text-xs transition-colors ${
                    isLiked
                      ? "text-red-500"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                >
                  <FaHeart className={isLiked ? "fill-current" : ""} />
                  <span>{likeCount}</span>
                </button>

                {level === 0 && (
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <FaReply />
                    <span>{t("blog.comment.reply")}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                level={level + 1}
                onCommentUpdate={loadComments}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {t("blog.post.comment.deleteConfirm")}
                  </h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("blog.post.comment.deleteWarning") ||
                    "This action cannot be undone."}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  {isLoading ? t("common.deleting") : t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("blog.comment.error.title")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadComments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("blog.comment.error.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {/* Comment Form */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("blog.comment.title")} ({comments.length})
        </h3>

        <form onSubmit={handleSubmitComment}>
          <div className="space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                replyingTo
                  ? t("blog.comment.replyPlaceholder")
                  : t("blog.comment.placeholder")
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
            />

            {replyingTo && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {t("blog.comment.replyingTo")}{" "}
                  {comments.find((c) => c.id === replyingTo)?.userName}
                </span>
                <button
                  type="button"
                  onClick={handleCancelReply}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  {t("blog.comment.cancel")}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {newComment.length}/1000
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? t("blog.comment.submitting")
                  : t("blog.comment.submit")}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="p-6">
        {loading && comments.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">
              💬
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("blog.comment.empty.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("blog.comment.empty.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onCommentUpdate={loadComments}
              />
            ))}

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors disabled:opacity-50"
                >
                  {loading
                    ? t("blog.comment.loading")
                    : t("blog.comment.loadMore")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
