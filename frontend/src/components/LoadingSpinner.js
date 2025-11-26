import React from "react";
import { FaBrain } from "react-icons/fa";

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="text-center">
        <div className="relative">
          <FaBrain className="text-6xl text-blue-500 animate-pulse mb-4 mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
          {message}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Please wait while we load the content...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
