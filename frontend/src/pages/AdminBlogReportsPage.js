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
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { FaBrain, FaExclamationTriangle } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import blogService from "../services/blogService";
import logger from "../utils/logger";

const ReportStatusChip = ({ status }) => {
  const { t } = useTranslation();

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700";
      case "REVIEWED":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700";
      case "RESOLVED":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700";
      case "DISMISSED":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return t("blog.reports.status.pending");
      case "REVIEWED":
        return t("blog.reports.status.reviewed");
      case "RESOLVED":
        return t("blog.reports.status.resolved");
      case "DISMISSED":
        return t("blog.reports.status.dismissed");
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

const AdminBlogReportsPage = ({ handleLogout }) => {
  const { t } = useTranslation();
  const { theme: themeMode, setTheme } = useCustomTheme();
  const [user, setUser] = useState(null);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("RESOLVED");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        logger.error("Error decoding token:", error);
      }
    }

    fetchReports();
  }, [page, statusFilter]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        size,
        sort: "createdAt,desc",
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = statusFilter === "PENDING"
        ? await blogService.getPendingReports(params)
        : await blogService.getAdminReports(params);

      const allReports = response.content || [];
      setReports(allReports);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      logger.error("Error fetching reports:", error);
      setError(t("blog.reports.error.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, t]);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleReviewReport = (report) => {
    setSelectedReport(report);
    setReviewStatus(report.status === "PENDING" ? "RESOLVED" : report.status);
    setAdminNotes(report.adminNotes || "");
    setReviewDialogOpen(true);
  };

  const confirmReview = async () => {
    if (!selectedReport) return;

    try {
      setLoading(true);
      await blogService.reviewReport(selectedReport.id, reviewStatus, adminNotes);
      setSuccess(t("blog.reports.success.reviewed"));
      setReviewDialogOpen(false);
      setAdminNotes("");
      fetchReports();
    } catch (error) {
      logger.error("Error reviewing report:", error);
      setError(t("blog.reports.error.reviewFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchReports();
  };

  const handleClearFilters = () => {
    setStatusFilter(null);
    setSearchQuery("");
    setPage(0);
  };

  const getReasonText = (reason) => {
    switch (reason) {
      case "SPAM":
        return t("blog.report.reason.spam");
      case "INAPPROPRIATE":
        return t("blog.report.reason.inappropriate");
      case "HARASSMENT":
        return t("blog.report.reason.harassment");
      case "FALSE_INFO":
        return t("blog.report.reason.falseInfo");
      case "OTHER":
        return t("blog.report.reason.other");
      default:
        return reason;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("blog.reports.title")}
        user={user}
        theme={themeMode}
        setTheme={setTheme}
        onLogout={handleLogout}
      />

      <div className="flex-1 px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-8 mt-8 text-blue-600 dark:text-blue-300 text-center">
            {t("blog.reports.title")}
          </h1>

          {/* Controls */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <div className="min-w-[260px]">
                <select
                  value={statusFilter || "ALL"}
                  onChange={(e) => setStatusFilter(e.target.value === "ALL" ? null : e.target.value)}
                  className="w-full px-6 py-3 rounded-full shadow border outline-none focus:ring-2 focus:ring-blue-400 text-base dark:bg-gray-800 dark:text-white dark:border-gray-700"
                >
                  <option value="ALL">{t("blog.reports.filter.all")}</option>
                  <option value="PENDING">{t("blog.reports.status.pending")}</option>
                  <option value="REVIEWED">{t("blog.reports.status.reviewed")}</option>
                  <option value="RESOLVED">{t("blog.reports.status.resolved")}</option>
                  <option value="DISMISSED">{t("blog.reports.status.dismissed")}</option>
                </select>
              </div>
              <button
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-full shadow transition min-w-[160px] h-[48px] dark:bg-indigo-700 dark:hover:bg-indigo-800"
                onClick={handleClearFilters}
              >
                <FilterIcon />
                {t("blog.admin.clearFilters")}
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="w-1/5 px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.reports.table.post")}
                    </th>
                    <th className="w-1/5 px-3 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.reports.table.reporter")}
                    </th>
                    <th className="w-1/6 px-2 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.reports.table.reason")}
                    </th>
                    <th className="w-1/6 px-2 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.reports.table.status")}
                    </th>
                    <th className="w-1/6 px-2 py-4 text-left text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.reports.table.createdAt")}
                    </th>
                    <th className="w-1/6 px-3 py-4 text-center text-sm font-bold text-gray-800 dark:text-white">
                      {t("blog.reports.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        {t("common.loading")}
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        {t("blog.reports.noReports")}
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {report.postTitle || "N/A"}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-800 dark:text-white">
                          {report.userName || "Unknown"}
                        </td>
                        <td className="px-2 py-4 text-sm text-gray-800 dark:text-white">
                          {getReasonText(report.reason)}
                        </td>
                        <td className="px-2 py-4">
                          <ReportStatusChip status={report.status} />
                        </td>
                        <td className="px-2 py-4 text-sm text-gray-800 dark:text-white">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex gap-2 justify-center items-center h-full">
                            <button
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-sm transition-all text-base"
                              onClick={() => handleViewReport(report)}
                            >
                              <ViewIcon className="w-5 h-5" />
                              {t("blog.reports.actions.view")}
                            </button>
                            {report.status === "PENDING" && (
                              <button
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-sm transition-all text-base"
                                onClick={() => handleReviewReport(report)}
                              >
                                <ApproveIcon className="w-5 h-5" />
                                {t("blog.reports.actions.review")}
                              </button>
                            )}
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

      {/* View Report Dialog */}
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
          {t("blog.reports.dialog.title")}
        </DialogTitle>
        <DialogContent className="p-6">
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {t("blog.reports.dialog.post")}:
                  </span>
                  <p className="text-gray-800 dark:text-white">
                    {selectedReport.postTitle || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {t("blog.reports.dialog.reporter")}:
                  </span>
                  <p className="text-gray-800 dark:text-white">
                    {selectedReport.userName || "Unknown"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {t("blog.reports.dialog.reason")}:
                  </span>
                  <p className="text-gray-800 dark:text-white">
                    {getReasonText(selectedReport.reason)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {t("blog.reports.dialog.status")}:
                  </span>
                  <div className="mt-1">
                    <ReportStatusChip status={selectedReport.status} />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {t("blog.reports.dialog.createdAt")}:
                  </span>
                  <p className="text-gray-800 dark:text-white">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedReport.description && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                    {t("blog.reports.dialog.description")}:
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              {selectedReport.adminNotes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    {t("blog.reports.dialog.adminNotes")}:
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.adminNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions className="p-6 border-t border-gray-200 dark:border-gray-600">
          <div className="flex gap-3 w-full justify-end">
            {selectedReport?.status === "PENDING" && (
              <button
                onClick={() => {
                  setViewDialogOpen(false);
                  handleReviewReport(selectedReport);
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors flex items-center gap-2 font-bold shadow-sm"
              >
                <ApproveIcon className="w-4 h-4" />
                {t("blog.reports.actions.review")}
              </button>
            )}
            <button
              onClick={() => setViewDialogOpen(false)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors font-bold shadow-sm"
            >
              {t("common.close")}
            </button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Review Report Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
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
          {t("blog.reports.dialog.reviewTitle")}
        </DialogTitle>
        <DialogContent className="px-6 pb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("blog.reports.dialog.reviewStatus")}:
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="RESOLVED">{t("blog.reports.status.resolved")}</option>
                <option value="DISMISSED">{t("blog.reports.status.dismissed")}</option>
                <option value="REVIEWED">{t("blog.reports.status.reviewed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("blog.reports.dialog.adminNotes")}:
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder={t("blog.reports.dialog.adminNotesPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-6">
          <div className="flex gap-3 w-full justify-center">
            <button
              onClick={() => {
                setReviewDialogOpen(false);
                setAdminNotes("");
              }}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors font-bold shadow-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={confirmReview}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors font-bold shadow-sm disabled:opacity-50"
            >
              {loading ? t("common.processing") : t("blog.reports.actions.submit")}
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

export default AdminBlogReportsPage;

