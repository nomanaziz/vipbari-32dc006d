import type { ColorPreset } from "@/contexts/ThemeContext";

export const navbarGradients: Record<ColorPreset, string> = {
  pink: "from-pink-600 to-purple-700",
  green: "from-emerald-600 to-teal-700",
  blue: "from-blue-600 to-indigo-700",
  yellow: "from-amber-500 to-orange-600",
};

export const heroGradients: Record<ColorPreset, string> = {
  pink: "from-slate-900 via-purple-950 to-slate-900",
  green: "from-slate-900 via-emerald-950 to-slate-900",
  blue: "from-slate-900 via-blue-950 to-slate-900",
  yellow: "from-slate-900 via-amber-950 to-slate-900",
};

export const heroGlowColors: Record<ColorPreset, { glow1: string; glow2: string }> = {
  pink: { glow1: "bg-pink-500/10", glow2: "bg-purple-500/10" },
  green: { glow1: "bg-emerald-500/10", glow2: "bg-teal-500/10" },
  blue: { glow1: "bg-blue-500/10", glow2: "bg-indigo-500/10" },
  yellow: { glow1: "bg-amber-500/10", glow2: "bg-orange-500/10" },
};

export const ctaGradients: Record<ColorPreset, string> = {
  pink: "from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-pink-500/25",
  green: "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25",
  blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25",
  yellow: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25",
};

export const dashboardButtonText: Record<ColorPreset, string> = {
  pink: "text-pink-600",
  green: "text-emerald-600",
  blue: "text-blue-600",
  yellow: "text-amber-600",
};

export const brandBgColor: Record<ColorPreset, string> = {
  pink: "bg-purple-600",
  green: "bg-emerald-600",
  blue: "bg-blue-600",
  yellow: "bg-amber-600",
};

export const accentIconColor: Record<ColorPreset, string> = {
  pink: "text-pink-400",
  green: "text-emerald-400",
  blue: "text-blue-400",
  yellow: "text-amber-400",
};

export const phoneShadow: Record<ColorPreset, string> = {
  pink: "shadow-purple-500/20",
  green: "shadow-emerald-500/20",
  blue: "shadow-indigo-500/20",
  yellow: "shadow-orange-500/20",
};
