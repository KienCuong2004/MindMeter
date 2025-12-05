import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import AppRoutes from "./AppRoutes";
import ScrollToTop from "./ScrollToTop";
import "./App.css";
import { THEME_CONSTANTS } from "./constants/theme";
import "./utils/cleanupAllData"; // Tự động cleanup dữ liệu cũ
import { SavedArticlesProvider } from "./contexts/SavedArticlesContext";

export const ThemeContext = createContext();

function App() {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem(THEME_CONSTANTS.STORAGE_KEY) ||
      THEME_CONSTANTS.DEFAULT_THEME
  );

  useEffect(() => {
    if (theme === THEME_CONSTANTS.DARK) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, theme);
  }, [theme]);

  // Register service worker for PWA (only in production)
  useEffect(() => {
    // Don't register service worker in development mode to avoid issues with OAuth callbacks
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      // Unregister any existing service workers first
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });

      // Register new service worker after a short delay
      setTimeout(() => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then(() => {
            // Service Worker registered successfully
          })
          .catch(() => {
            // Service Worker registration failed - silently fail
          });
      }, 1000);
    } else if (process.env.NODE_ENV === "development") {
      // Unregister service workers in development mode
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        });
      }
    }
  }, []);

  return (
    <HelmetProvider>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <SavedArticlesProvider>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
        </SavedArticlesProvider>
      </ThemeContext.Provider>
    </HelmetProvider>
  );
}

export default App;
