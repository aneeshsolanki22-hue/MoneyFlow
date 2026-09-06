import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DarkColors, LightColors, type ThemeColors } from "../theme";
import { loadGradient, loadTheme, saveGradient, saveTheme } from "../utils/storage";
import type { GradientVariant } from "../types";

interface ThemeContextValue {
  theme: "dark" | "light";
  colors: ThemeColors;
  toggleTheme: () => void;
  /** Home-screen gradient look — a separate preference, independent of the theme. */
  gradient: GradientVariant;
  setGradient: (variant: GradientVariant) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  colors: DarkColors,
  toggleTheme: () => {},
  gradient: "ocean",
  setGradient: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [gradient, setGradientState] = useState<GradientVariant>('ocean');

  // Load persisted preferences on mount.
  useEffect(() => {
    loadTheme().then((t) => {
      if (t) setTheme(t);
    });
    loadGradient().then((g) => {
      if (g) setGradientState(g);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((cur) => {
      const next = cur === "dark" ? "light" : "dark";
      saveTheme(next);
      return next;
    });
  }, []);

  const setGradient = useCallback((variant: GradientVariant) => {
    setGradientState(variant);
    saveGradient(variant);
  }, []);

  const colors = theme === "dark" ? DarkColors : LightColors;

  // Stable value so consumers don't re-render on unrelated provider renders.
  const value = useMemo(
    () => ({ theme, colors, toggleTheme, gradient, setGradient }),
    [theme, colors, toggleTheme, gradient, setGradient],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
