import { useContext, useCallback } from "react";
import { ThemeContext } from "../App";

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeContext.Provider");
  }

  const { theme, setTheme } = context;

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [theme, setTheme]);

  const isDark = theme === "dark";
  const isLight = theme === "light";

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    isLight,
  };
};
