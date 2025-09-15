import React from "react";
import AnimatedNumber from "./AnimatedNumber";

function getDarkBg(bgColor) {
  if (bgColor.includes("bg-green-50")) return "dark:bg-gray-900";
  if (bgColor.includes("bg-blue-50")) return "dark:bg-gray-900";
  if (bgColor.includes("bg-yellow-50")) return "dark:bg-gray-900";
  if (bgColor.includes("bg-orange-50")) return "dark:bg-gray-900";
  if (bgColor.includes("bg-red-50")) return "dark:bg-gray-900";
  if (bgColor.includes("bg-indigo-50")) return "dark:bg-gray-900";
  if (bgColor.includes("bg-purple-50")) return "dark:bg-gray-900";
  return "dark:bg-gray-900";
}

export default function StatCard({
  icon,
  value,
  label,
  color = "text-blue-600",
  bgColor = "bg-blue-50",
  iconBg = "bg-blue-100",
  children,
  className = "",
  onClick,
}) {
  // Nếu value là số thì dùng AnimatedNumber, nếu là ReactNode thì render trực tiếp
  const renderValue =
    typeof value === "number" ? <AnimatedNumber value={value} /> : value;

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl shadow-xl hover:shadow-2xl px-7 py-7 min-w-[170px] min-h-[130px] ${bgColor} ${getDarkBg(
        bgColor
      )} transition-transform hover:scale-105 border-2 border-white dark:border-gray-700 relative animate-fade-in-up
        dark:text-white dark:drop-shadow-glow-all dark:animate-glow-all ${className}`}
      style={{ animationDelay: "0.07s" }}
      onClick={onClick}
    >
      <span
        className={`text-4xl ${iconBg} ${color} rounded-full p-3 mb-2 flex items-center justify-center transition-all
          dark:text-white dark:bg-opacity-10 dark:border-4 dark:border-white dark:drop-shadow-glow-all dark:animate-glow-all dark:animate-border-glow`}
        style={{
          boxShadow: "0 0 32px 8px #fff, 0 0 24px 4px #6366f1",
          borderStyle: "solid",
        }}
      >
        {icon}
      </span>
      <div
        className={`font-extrabold text-3xl mb-1 ${color} transition-all dark:text-white dark:drop-shadow-glow-all dark:animate-glow-all`}
      >
        {renderValue}
      </div>
      <div className="text-gray-500 text-sm font-medium text-center dark:text-white dark:drop-shadow-glow-all dark:animate-glow-all">
        {label}
      </div>
      {children}
      {/* Hiệu ứng phát sáng toàn bộ cho dark mode */}
      <style>{`
        @keyframes glow-all {
          0%, 100% { filter: drop-shadow(0 0 0 #fff); }
          50% { filter: drop-shadow(0 0 32px #fff) drop-shadow(0 0 16px #6366f1); }
        }
        .dark .drop-shadow-glow-all {
          filter: drop-shadow(0 0 16px #fff) drop-shadow(0 0 8px #6366f1) drop-shadow(0 0 2px #fff);
        }
        .dark .animate-glow-all {
          animation: glow-all 1.5s infinite;
        }
        @keyframes border-glow {
          0%, 100% { border-color: #fff; box-shadow: 0 0 0 #fff, 0 0 0 #6366f1; }
          50% { border-color: #fff; box-shadow: 0 0 24px 8px #fff, 0 0 16px 4px #6366f1; }
        }
        .dark .animate-border-glow {
          animation: border-glow 1.5s infinite;
        }
        /* Light mode không có viền trắng và không glow */
        .animate-border-glow:not(.dark .animate-border-glow) {
          border-width: 0;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}
