import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "aj5_theme";

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(KEY) || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
    localStorage.setItem(KEY, mode);
  }, [mode]);

  function toggle() {
    setMode((m) => (m === "light" ? "dark" : "light"));
  }

  return <ThemeContext.Provider value={{ mode, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
