import React, { createContext, useContext, useState, useEffect } from "react";
import logger from "../utils/logger";

const SavedArticlesContext = createContext();

export const useSavedArticles = () => {
  const context = useContext(SavedArticlesContext);
  if (!context) {
    throw new Error(
      "useSavedArticles must be used within a SavedArticlesProvider"
    );
  }
  return context;
};

export const SavedArticlesProvider = ({ children }) => {
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load saved articles from localStorage on mount
  useEffect(() => {
    const loadSavedArticles = () => {
      try {
        const saved = localStorage.getItem("savedArticles");
        if (saved) {
          setSavedArticles(JSON.parse(saved));
        }
      } catch (error) {
        logger.error("Error loading saved articles:", error);
        setSavedArticles([]);
      }
    };

    loadSavedArticles();
  }, []);

  // Save articles to localStorage whenever savedArticles changes
  useEffect(() => {
    try {
      localStorage.setItem("savedArticles", JSON.stringify(savedArticles));
    } catch (error) {
      logger.error("Error saving articles to localStorage:", error);
    }
  }, [savedArticles]);

  const saveArticle = (article) => {
    setSavedArticles((prev) => {
      // Check if article is already saved
      const isAlreadySaved = prev.some((item) => item.id === article.id);
      if (isAlreadySaved) {
        return prev; // Don't add if already saved
      }

      // Add timestamp when saved
      const articleWithTimestamp = {
        ...article,
        savedAt: new Date().toISOString(),
      };

      return [...prev, articleWithTimestamp];
    });
  };

  const unsaveArticle = (articleId) => {
    setSavedArticles((prev) =>
      prev.filter((article) => article.id !== articleId)
    );
  };

  const toggleSaveArticle = (article) => {
    const isSaved = savedArticles.some((item) => item.id === article.id);
    if (isSaved) {
      unsaveArticle(article.id);
    } else {
      saveArticle(article);
    }
    return !isSaved; // Return new saved state
  };

  const isArticleSaved = (articleId) => {
    return savedArticles.some((article) => article.id === articleId);
  };

  const getSavedArticlesCount = () => {
    return savedArticles.length;
  };

  const clearAllSavedArticles = () => {
    setSavedArticles([]);
  };

  const value = {
    savedArticles,
    loading,
    setLoading,
    saveArticle,
    unsaveArticle,
    toggleSaveArticle,
    isArticleSaved,
    getSavedArticlesCount,
    clearAllSavedArticles,
  };

  return (
    <SavedArticlesContext.Provider value={value}>
      {children}
    </SavedArticlesContext.Provider>
  );
};

export default SavedArticlesContext;
