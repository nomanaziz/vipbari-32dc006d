import { LucideIcon } from "lucide-react";

const colorMap: Record<string, string> = {
  blue: "from-blue-400 to-blue-600",
  green: "from-emerald-400 to-emerald-600",
  orange: "from-orange-400 to-orange-600",
  purple: "from-purple-400 to-purple-600",
  red: "from-red-400 to-red-600",
  pink: "from-pink-400 to-pink-600",
  teal: "from-teal-400 to-teal-600",
  yellow: "from-yellow-400 to-yellow-600",
  indigo: "from-indigo-400 to-indigo-600",
  cyan: "from-cyan-400 to-cyan-600",
  rose: "from-rose-400 to-rose-600",
  lime: "from-lime-400 to-lime-600",
};

interface AppIconProps {
  icon: LucideIcon;
  color: string;
  size?: "sm" | "md";
}

const AppIcon = ({ icon: Icon, color, size = "md" }: AppIconProps) => {
  const sizeClasses = size === "sm" ? "w-10 h-10 rounded-xl" : "w-14 h-14 rounded-2xl";
  const iconSize = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <div className={`${sizeClasses} bg-gradient-to-br ${colorMap[color] || colorMap.blue} flex items-center justify-center shadow-lg`}>
      <Icon className={`${iconSize} text-white`} />
    </div>
  );
};

export default AppIcon;
