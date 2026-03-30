import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
export type ColorPreset = "pink" | "green" | "blue" | "yellow";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  effectiveTheme: "light" | "dark";
  colorPreset: ColorPreset;
  setColorPreset: (p: ColorPreset) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): "light" | "dark" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("app-theme");
    return (stored as Theme) || "light";
  });

  const [colorPreset, setColorPresetState] = useState<ColorPreset>(() => {
    const stored = localStorage.getItem("app-color-preset");
    return (stored as ColorPreset) || "pink";
  });

  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(() =>
    theme === "system" ? getSystemTheme() : theme
  );

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("app-theme", t);
  };

  const setColorPreset = (p: ColorPreset) => {
    setColorPresetState(p);
    localStorage.setItem("app-color-preset", p);
  };

  // Apply dark/light
  useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setEffectiveTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [theme]);

  // Apply color preset
  useEffect(() => {
    if (colorPreset === "pink") {
      document.documentElement.removeAttribute("data-color-preset");
    } else {
      document.documentElement.setAttribute("data-color-preset", colorPreset);
    }
  }, [colorPreset]);

  // Dynamic theme-color meta tag for Android browser bar
  useEffect(() => {
    const lightColors: Record<ColorPreset, string> = {
      pink: "#9333ea",
      green: "#059669",
      blue: "#2563eb",
      yellow: "#d97706",
    };
    const darkColors: Record<ColorPreset, string> = {
      pink: "#1e1b4b",
      green: "#022c22",
      blue: "#1e1b4b",
      yellow: "#451a03",
    };
    const hex = effectiveTheme === "dark" ? darkColors[colorPreset] : lightColors[colorPreset];
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", hex);
  }, [colorPreset, effectiveTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = getSystemTheme();
      setEffectiveTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme, colorPreset, setColorPreset }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
