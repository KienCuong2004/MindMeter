import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme as useCustomTheme } from "../hooks/useTheme";
import { jwtDecode } from "jwt-decode";
import {
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { FaBrain } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import blogService from "../services/blogService";

const StatusChip = ({ status }) => {
  const { t } = useTranslation();

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case "PUBLISHED":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700";
      case "DRAFT":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700";
      case "PENDING":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700";
      case "REJECTED":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case "PUBLISHED":
        return t("blog.admin.status.published");
      case "DRAFT":
        return t("blog.admin.status.draft");
      case "PENDING":
        return t("blog.admin.status.pending");
      case "REJECTED":
        return t("blog.admin.status.rejected");
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium leading-none ${getStatusStyle(
        status
      )}`}
    >
      {getStatusText(status)}
    </span>
  );
};

const BlogManagementPage = ({ handleLogout }) => {
  const { t } = useTranslation();
  const { theme: themeMode, setTheme } = useCustomTheme();
  const [user, setUser] = useState(null);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  // Delete confirm modal state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        size,
        sort: "createdAt,desc",
      };

      if (statusFilter !== "ALL") {
        params.status = String(statusFilter).toLowerCase();
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await blogService.getPostsForAdmin(params);

      const allPosts = response.content || [];
      const normalizedFilter = String(statusFilter).toLowerCase();
      const filteredPosts =
        normalizedFilter === "all"
          ? allPosts
          : allPosts.filter(
              (p) => String(p.status || "").toLowerCase() === normalizedFilter
            );

      setPosts(filteredPosts);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError(t("blog.admin.error.fetchPosts"));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery, size, t]);

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }

    fetchPosts();
  }, [page, statusFilter, searchQuery, fetchPosts]);

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setViewDialogOpen(true);
  };

  const handleApprovePost = (post) => {
    setSelectedPost(post);
    setApproveDialogOpen(true);
  };

  const handleRejectPost = (post) => {
    setSelectedPost(post);
    setRejectDialogOpen(true);
  };

  const confirmApprove = async () => {
    try {
      setLoading(true);
      await blogService.updatePostStatus(selectedPost.id, "published");
      setSuccess(t("blog.admin.success.postApproved"));
      setApproveDialogOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Error approving post:", error);
      setError(t("blog.admin.error.approveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const confirmReject = async () => {
    try {
      setLoading(true);
      await blogService.updatePostStatus(
        selectedPost.id,
        "rejected",
        rejectionReason
      );
      setSuccess(t("blog.admin.success.postRejected"));
      setRejectDialogOpen(false);
      setRejectionReason("");
      fetchPosts();
    } catch (error) {
      console.error("Error rejecting post:", error);
      setError(t("blog.admin.error.rejectFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (postId) => {
    setDeletePostId(postId);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      setDeleting(true);
      await blogService.deletePost(deletePostId);
      setSuccess(t("blog.admin.success.postDeleted"));
      setConfirmDeleteOpen(false);
      setDeletePostId(null);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      setError(t("blog.admin.error.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchPosts();
  };

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setSearchQuery("");
    setPage(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("blog.admin.title")}
        user={user}
        theme={themeMode}
        setTheme={setTheme}
        onLogout={handleLogout}
      />

      <div className="flex-1 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              {t("blog.admin.title")}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t("blog.admin.subtitle")}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("blog.admin.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full px-4 py-3 pl-10 pr-12 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <SearchIcon />
                  </button>
                </div>
              </div>
              <div className="md:col-span-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="ALL">{t("blog.admin.filter.all")}</option>
                  <option value="PENDING">
                    {t("blog.admin.status.pending")}
                  </option>
                  <option value="PUBLISHED">
                    {t("blog.admin.status.published")}
                  </option>
                  <option value="DRAFT">{t("blog.admin.status.draft")}</option>
                  <option value="REJECTED">
                    {t("blog.admin.status.rejected")}
                  </option>
                </select>
              </div>
              <div className="md:col-span-1">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 flex items-center justify-center gap-2"
                >
                  <FilterIcon />
                  {t("blog.admin.clearFilters")}
                </button>
              </div>
            </div>
          </div>

          {/* Posts Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="w-2/5 px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.admin.table.title")}
                    </th>
                    <th className="w-1/5 px-3 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.admin.table.author")}
                    </th>
                    <th className="w-1/10 px-2 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.admin.table.status")}
                    </th>
                    <th className="w-1/10 px-2 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.admin.table.createdAt")}
                    </th>
                    <th className="w-1/5 px-3 py-4 text-center text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.admin.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        {t("common.loading")}
                      </td>
                    </tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        {t("blog.admin.noPosts")}
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr
                        key={post.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                              {post.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {post.excerpt?.substring(0, 100)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-800 dark:text-white">
                          {post.authorName || "Unknown"}
                        </td>
                        <td className="px-2 py-4">
                          <StatusChip status={post.status} />
                        </td>
                        <td className="px-2 py-4 text-sm text-gray-800 dark:text-white">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex gap-2 justify-center items-center h-full">
                            <button
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-sm transition-all text-base"
                              onClick={() => handleViewPost(post)}
                            >
                              <ViewIcon className="w-5 h-5" />
                              {t("blog.admin.actions.view")}
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-sm transition-all text-base"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <DeleteIcon className="w-5 h-5" />
                              {t("blog.admin.actions.delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Post Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: themeMode === "dark" ? "grey.800" : "white",
            color: themeMode === "dark" ? "white" : "text.primary",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-600">
          {selectedPost?.title}
        </DialogTitle>
        <DialogContent className="p-6">
          {selectedPost && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {t("blog.admin.dialog.author")}:
                  </span>
                  <p className="text-gray-800 dark:text-white">
                    {selectedPost.authorName || "Unknown"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {t("blog.admin.dialog.createdAt")}:
                  </span>
                  <p className="text-gray-800 dark:text-white">
                    {new Date(selectedPost.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {t("blog.admin.dialog.status")}:
                  </span>
                  <div className="mt-1">
                    <StatusChip status={selectedPost.status} />
                  </div>
                </div>
              </div>

              {selectedPost.featuredImage && (
                <div className="w-full">
                  <img
                    src={selectedPost.featuredImage}
                    alt={selectedPost.title}
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                  />
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                  Nội dung bài viết:
                </h4>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="p-6 border-t border-gray-200 dark:border-gray-600">
          <div className="flex gap-3 w-full justify-between">
            <div className="flex gap-3">
              {selectedPost?.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleApprovePost(selectedPost);
                    }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors flex items-center gap-2 font-bold shadow-sm"
                  >
                    <ApproveIcon className="w-4 h-4" />
                    {t("blog.admin.actions.approve")}
                  </button>
                  <button
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleRejectPost(selectedPost);
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors flex items-center gap-2 font-bold shadow-sm"
                  >
                    <RejectIcon className="w-4 h-4" />
                    {t("blog.admin.actions.reject")}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setViewDialogOpen(false)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors font-bold shadow-sm"
            >
              {t("common.close")}
            </button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl text-center border border-gray-200 bg-white p-8 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              {t("blog.admin.actions.delete")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t("blog.admin.confirm.deletePost")}
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={deleting}
              >
                {t("common.cancel")}
              </button>
              <button
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors dark:bg-red-600 dark:hover:bg-red-700"
                onClick={handleDeleteConfirmed}
                disabled={deleting}
              >
                {deleting
                  ? t("common.deleting")
                  : t("blog.admin.actions.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Post Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: themeMode === "dark" ? "grey.800" : "white",
            color: themeMode === "dark" ? "white" : "text.primary",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white text-center py-6">
          {t("blog.admin.dialog.approveTitle")}
        </DialogTitle>
        <DialogContent className="px-6 pb-4">
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t("blog.admin.dialog.approveMessage")}
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="font-medium text-gray-800 dark:text-white">
                "{selectedPost?.title}"
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-6">
          <div className="flex gap-3 w-full justify-center">
            <button
              onClick={() => setApproveDialogOpen(false)}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors font-bold shadow-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={confirmApprove}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors font-bold shadow-sm disabled:opacity-50"
            >
              {loading ? "Đang duyệt..." : t("blog.admin.actions.approve")}
            </button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Reject Post Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: themeMode === "dark" ? "grey.800" : "white",
            color: themeMode === "dark" ? "white" : "text.primary",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white text-center py-6">
          {t("blog.admin.dialog.rejectTitle")}
        </DialogTitle>
        <DialogContent className="px-6 pb-4">
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t("blog.admin.dialog.rejectMessage")}
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
              <p className="font-medium text-gray-800 dark:text-white">
                "{selectedPost?.title}"
              </p>
            </div>
            <div className="relative">
              <div className="relative">
                <textarea
                  className="w-full p-3 pt-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none resize-none peer"
                  rows={3}
                  placeholder=" "
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  id="rejection-reason"
                />
                <label
                  htmlFor="rejection-reason"
                  className="absolute left-3 top-3 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 pointer-events-none peer-focus:top-1 peer-focus:text-xs peer-focus:text-red-500 dark:peer-focus:text-red-400 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-red-500 dark:peer-[:not(:placeholder-shown)]:text-red-400"
                >
                  {t("blog.admin.dialog.rejectionReason")}
                </label>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-6">
          <div className="flex gap-3 w-full justify-center">
            <button
              onClick={() => setRejectDialogOpen(false)}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors font-bold shadow-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={confirmReject}
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors font-bold shadow-sm disabled:opacity-50"
            >
              {loading ? "Đang từ chối..." : t("blog.admin.actions.reject")}
            </button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess("")}
      >
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>

      <FooterSection />
    </div>
  );
};

export default BlogManagementPage;
