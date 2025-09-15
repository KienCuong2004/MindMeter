import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import ScrollToTop from "./ScrollToTop";
import "./App.css";
import { THEME_CONSTANTS } from "./constants/theme";
import "./utils/cleanupAllData"; // Tự động cleanup dữ liệu cũ

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

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
