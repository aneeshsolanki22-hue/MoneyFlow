import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DarkColors, LightColors, type ThemeColors } from "../theme";
import { loadTheme, saveTheme } from "../utils/storage";

interface ThemeContextValue {
  theme: "dark" | "light";
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  colors: DarkColors,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load persisted preference on mount.
  useEffect(() => {
    loadTheme().then((t) => {
      if (t) setTheme(t);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((cur) => {
      const next = cur === "dark" ? "light" : "dark";
      saveTheme(next);
      return next;
    });
  }, []);

  const colors = theme === "dark" ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
