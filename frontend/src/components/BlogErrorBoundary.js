import React from "react";
import { useTranslation } from "react-i18next";
import logger from "../utils/logger";

class BlogErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error using logger
    logger.error("Blog Error Boundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {this.props.t
                ? this.props.t("blog.error.title")
                : "Có lỗi xảy ra"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.props.t
                ? this.props.t("blog.error.description")
                : "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {this.props.t ? this.props.t("common.retry") : "Thử lại"}
            </button>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                  Chi tiết lỗi (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use hooks
const BlogErrorBoundaryWrapper = ({ children }) => {
  const { t } = useTranslation();
  return <BlogErrorBoundary t={t}>{children}</BlogErrorBoundary>;
};

export default BlogErrorBoundaryWrapper;
