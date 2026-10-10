import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ThemeContext = createContext({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }) {
  const location = useLocation();

  const isLandscape =
    location.pathname.startsWith("/landscapemastery") ||
    location.pathname === "/login" ||
    location.pathname === "/portal" ||
    location.pathname === "/dashboard" ||
    location.pathname === "/courses" ||
    location.pathname === "/portal-admin" ||
    location.pathname === "/portal/admin";

  const [theme, setTheme] = useState(isLandscape ? "light" : "dark");

  useEffect(() => {
    const activeTheme = isLandscape ? "light" : "dark";
    setTheme(activeTheme);
    const root = document.documentElement;
    if (activeTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [location.pathname, isLandscape]);

  const toggle = () => {
    // Retained for API compatibility if needed
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
