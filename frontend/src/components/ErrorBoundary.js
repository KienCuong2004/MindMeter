import React from "react";
import logger from "../utils/logger";

class ErrorBoundary extends React.Component {
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
    logger.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-6 h-6 text-red-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Something went wrong
            </h3>
          </div>

          <div className="text-sm text-red-700 dark:text-red-300 mb-3">
            {this.state.error && this.state.error.toString()}
          </div>

          <details className="text-xs text-red-600 dark:text-red-400">
            <summary className="cursor-pointer font-medium">
              Error Details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>

          <button
            onClick={() =>
              this.setState({ hasError: false, error: null, errorInfo: null })
            }
            className="mt-3 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
