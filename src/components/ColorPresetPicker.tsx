import { useTheme, type ColorPreset } from "@/contexts/ThemeContext";
import { Check } from "lucide-react";

const presets: { id: ColorPreset; label: string; color: string }[] = [
  { id: "pink", label: "Pink", color: "bg-pink-500" },
  { id: "green", label: "Green", color: "bg-emerald-500" },
  { id: "blue", label: "Blue", color: "bg-blue-500" },
  { id: "yellow", label: "Yellow", color: "bg-amber-500" },
];

export const ColorPresetPicker = () => {
  const { colorPreset, setColorPreset } = useTheme();

  return (
    <div className="flex items-center gap-3">
      {presets.map((p) => (
        <button
          key={p.id}
          onClick={() => setColorPreset(p.id)}
          className={`relative h-10 w-10 rounded-full ${p.color} transition-all ring-offset-background ${
            colorPreset === p.id ? "ring-2 ring-ring ring-offset-2 scale-110" : "hover:scale-105"
          }`}
          title={p.label}
        >
          {colorPreset === p.id && (
            <Check className="h-5 w-5 text-white absolute inset-0 m-auto" />
          )}
        </button>
      ))}
    </div>
  );
};
