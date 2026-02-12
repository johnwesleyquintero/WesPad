import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "../constants";

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as
      | "light"
      | "dark";
    return savedTheme || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    // Sync meta theme-color for PWA/Mobile interface
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#0a0a0a" : "#ffffff",
      );
    }
  }, [theme]);

  return { theme, setTheme };
};
