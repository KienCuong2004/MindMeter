import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme as useCustomTheme } from "../hooks/useTheme";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import { jwtDecode } from "jwt-decode";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Alert,
  Snackbar,
  Pagination,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import blogService from "../services/blogService";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 4px 20px rgba(0, 0, 0, 0.3)"
      : "0 4px 20px rgba(0, 0, 0, 0.1)",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[800]
      : theme.palette.background.paper,
}));

const StatusChip = ({ status }) => {
  const { t } = useTranslation();

  const getStatusColor = (status) => {
    switch (status) {
      case "PUBLISHED":
        return "success";
      case "DRAFT":
        return "warning";
      case "PENDING":
        return "info";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
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
    <Chip
      label={getStatusText(status)}
      color={getStatusColor(status)}
      size="small"
      variant="outlined"
    />
  );
};

const BlogManagementPage = ({ handleLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme: themeMode, setTheme } = useCustomTheme();
  const muiTheme = useMuiTheme();
  const [user, setUser] = useState(null);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

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
  }, [page, statusFilter, searchQuery]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        size,
        sort: "createdAt,desc",
      };

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await blogService.getPosts(params);

      setPosts(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError(t("blog.admin.error.fetchPosts"));
    } finally {
      setLoading(false);
    }
  };

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
      await blogService.updatePostStatus(selectedPost.id, "PUBLISHED");
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
        "REJECTED",
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

  const handleDeletePost = async (postId) => {
    if (window.confirm(t("blog.admin.confirm.deletePost"))) {
      try {
        setLoading(true);
        await blogService.deletePost(postId);
        setSuccess(t("blog.admin.success.postDeleted"));
        fetchPosts();
      } catch (error) {
        console.error("Error deleting post:", error);
        setError(t("blog.admin.error.deleteFailed"));
      } finally {
        setLoading(false);
      }
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

  const handlePageChange = (event, newPage) => {
    setPage(newPage - 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <DashboardHeader
        logoIcon="📝"
        logoText="Blog Management"
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="md:col-span-1">
                <button
                  onClick={() => navigate("/blog/create")}
                  className="w-full px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-medium"
                >
                  {t("blog.admin.createPost")}
                </button>
              </div>
            </div>
          </div>

          {/* Posts Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.admin.table.title")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.admin.table.author")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.admin.table.status")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.admin.table.createdAt")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
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
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                              {post.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {post.excerpt?.substring(0, 100)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-white">
                          {post.author?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusChip status={post.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-white">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewPost(post)}
                              title={t("blog.admin.actions.view")}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            >
                              <ViewIcon />
                            </button>
                            {post.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApprovePost(post)}
                                  title={t("blog.admin.actions.approve")}
                                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
                                >
                                  <ApproveIcon />
                                </button>
                                <button
                                  onClick={() => handleRejectPost(post)}
                                  title={t("blog.admin.actions.reject")}
                                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                  <RejectIcon />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => navigate(`/blog/edit/${post.id}`)}
                              title={t("blog.admin.actions.edit")}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              title={t("blog.admin.actions.delete")}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              <DeleteIcon />
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
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: themeMode === "dark" ? "grey.800" : "white",
            color: themeMode === "dark" ? "white" : "text.primary",
          },
        }}
      >
        <DialogTitle>{selectedPost?.title}</DialogTitle>
        <DialogContent>
          {selectedPost && (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: themeMode === "dark" ? "grey.400" : "text.secondary",
                }}
                gutterBottom
              >
                {t("blog.admin.dialog.author")}: {selectedPost.author?.name}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: themeMode === "dark" ? "grey.400" : "text.secondary",
                }}
                gutterBottom
              >
                {t("blog.admin.dialog.createdAt")}:{" "}
                {new Date(selectedPost.createdAt).toLocaleString()}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: themeMode === "dark" ? "grey.400" : "text.secondary",
                }}
                gutterBottom
              >
                {t("blog.admin.dialog.status")}:{" "}
                <StatusChip status={selectedPost.status} />
              </Typography>
              {selectedPost.featuredImage && (
                <CardMedia
                  component="img"
                  height="200"
                  image={selectedPost.featuredImage}
                  alt={selectedPost.title}
                  sx={{ mb: 2 }}
                />
              )}
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  color: themeMode === "dark" ? "white" : "text.primary",
                }}
              >
                {selectedPost.content}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            {t("common.close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Post Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: themeMode === "dark" ? "grey.800" : "white",
            color: themeMode === "dark" ? "white" : "text.primary",
          },
        }}
      >
        <DialogTitle>{t("blog.admin.dialog.approveTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("blog.admin.dialog.approveMessage", {
              title: selectedPost?.title,
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={confirmApprove} color="success" disabled={loading}>
            {t("blog.admin.actions.approve")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Post Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: themeMode === "dark" ? "grey.800" : "white",
            color: themeMode === "dark" ? "white" : "text.primary",
          },
        }}
      >
        <DialogTitle>{t("blog.admin.dialog.rejectTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("blog.admin.dialog.rejectMessage", {
              title: selectedPost?.title,
            })}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t("blog.admin.dialog.rejectionReason")}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={confirmReject} color="error" disabled={loading}>
            {t("blog.admin.actions.reject")}
          </Button>
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
