import React from "react";
import { useSavedArticles } from "../contexts/SavedArticlesContext";

const SavedArticlesBadge = ({ className = "" }) => {
  const { getSavedArticlesCount } = useSavedArticles();
  const count = getSavedArticlesCount();

  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full ${className}`}
    >
      {count}
    </span>
  );
};

export default SavedArticlesBadge;
