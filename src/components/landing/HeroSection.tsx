import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Users, Building2, CreditCard, BarChart3, MessageSquare, Receipt,
  Clock, TrendingDown, Smartphone, TrendingUp, Home,
} from "lucide-react";
import { heroGradients, heroGlowColors, ctaGradients, accentIconColor, phoneShadow } from "@/lib/presetColors";

const BuildingSkyline = () => (
  <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <svg viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Buildings silhouette */}
      <rect x="0" y="60" width="80" height="140" fill="rgba(255,255,255,0.04)" />
      <rect x="85" y="30" width="60" height="170" fill="rgba(255,255,255,0.06)" />
      <rect x="150" y="80" width="90" height="120" fill="rgba(255,255,255,0.03)" />
      <rect x="250" y="40" width="70" height="160" fill="rgba(255,255,255,0.05)" />
      <rect x="330" y="70" width="50" height="130" fill="rgba(255,255,255,0.04)" />
      <rect x="390" y="20" width="80" height="180" fill="rgba(255,255,255,0.06)" />
      <rect x="480" y="50" width="60" height="150" fill="rgba(255,255,255,0.03)" />
      <rect x="550" y="90" width="100" height="110" fill="rgba(255,255,255,0.05)" />
      <rect x="660" y="35" width="55" height="165" fill="rgba(255,255,255,0.04)" />
      <rect x="725" y="60" width="85" height="140" fill="rgba(255,255,255,0.06)" />
      <rect x="820" y="25" width="65" height="175" fill="rgba(255,255,255,0.03)" />
      <rect x="895" y="55" width="75" height="145" fill="rgba(255,255,255,0.05)" />
      <rect x="980" y="80" width="90" height="120" fill="rgba(255,255,255,0.04)" />
      <rect x="1080" y="15" width="70" height="185" fill="rgba(255,255,255,0.06)" />
      <rect x="1160" y="45" width="80" height="155" fill="rgba(255,255,255,0.03)" />
      <rect x="1250" y="65" width="60" height="135" fill="rgba(255,255,255,0.05)" />
      <rect x="1320" y="30" width="120" height="170" fill="rgba(255,255,255,0.04)" />
      {/* Windows - small dots on buildings */}
      {[100, 290, 420, 750, 1110].map((x, i) => (
        <g key={i}>
          <rect x={x} y={60 + i * 8} width="4" height="4" rx="1" fill="rgba(255,200,100,0.3)" />
          <rect x={x + 12} y={70 + i * 8} width="4" height="4" rx="1" fill="rgba(255,200,100,0.2)" />
          <rect x={x + 6} y={90 + i * 6} width="4" height="4" rx="1" fill="rgba(255,200,100,0.25)" />
          <rect x={x + 18} y={80 + i * 5} width="4" height="4" rx="1" fill="rgba(255,200,100,0.15)" />
        </g>
      ))}
    </svg>
  </div>
);

const HeroSection = () => {
  const { t } = useLanguage();
  const { colorPreset } = useTheme();
  const glows = heroGlowColors[colorPreset];
  const iconColor = accentIconColor[colorPreset];

  return (
    <section className={`relative py-16 sm:py-24 px-4 overflow-hidden bg-gradient-to-br ${heroGradients[colorPreset]}`}>
      {/* Subtle glow effects */}
      <div className={`absolute top-20 left-1/4 w-96 h-96 ${glows.glow1} rounded-full blur-3xl pointer-events-none`} />
      <div className={`absolute bottom-20 right-1/4 w-80 h-80 ${glows.glow2} rounded-full blur-3xl pointer-events-none`} />

      <BuildingSkyline />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left — Text */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white leading-tight mb-6 animate-fade-in-up">
            {t("landing.hero_title")}
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-xl mx-auto lg:mx-0 mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            {t("landing.hero_sub")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" className={`text-base px-8 bg-gradient-to-r ${ctaGradients[colorPreset]} text-white shadow-lg`} asChild>
              <Link to="/register">{t("landing.cta_trial")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 border-white/30 text-white bg-transparent hover:bg-white/10" asChild>
              <Link to="/login">{t("auth.login")}</Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-white/60 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
            <span className="flex items-center gap-1.5"><Clock className={`h-4 w-4 ${iconColor}`} />{t("landing.badge_time")}</span>
            <span className="flex items-center gap-1.5"><TrendingDown className={`h-4 w-4 ${iconColor}`} />{t("landing.badge_cost")}</span>
            <span className="flex items-center gap-1.5"><Smartphone className={`h-4 w-4 ${iconColor}`} />{t("landing.badge_digital")}</span>
          </div>
        </div>

        {/* Right — Animated Phone Mockup */}
        <div className="hidden lg:flex justify-center relative" aria-hidden="true">
          {/* Floating cards */}
          <FloatingCard className="-top-2 -left-4" delay="0.4s" icon={<Users className={`h-4 w-4 ${iconColor}`} />} label="ভাড়াটিয়া ২৪ জন" />
          <FloatingCard className="top-4 -right-2" delay="0.7s" icon={<TrendingUp className={`h-4 w-4 ${iconColor}`} />} label="আদায় ৳৮৫K" />
          <FloatingCard className="bottom-24 -left-8" delay="1s" icon={<MessageSquare className={`h-4 w-4 ${iconColor}`} />} label="SMS ১-ক্লিক" />
          <FloatingCard className="bottom-32 -right-6" delay="1.2s" icon={<Receipt className={`h-4 w-4 ${iconColor}`} />} label="বিল অটো" />
          <FloatingCard className="-bottom-2 left-1/2 -translate-x-1/2" delay="1.4s" icon={<Home className={`h-4 w-4 ${iconColor}`} />} label="১০০০+ ব্যবহারকারী" />

          {/* Phone */}
          <div className="animate-float">
            <div className={`w-[280px] h-[540px] rounded-[2.5rem] border-[6px] border-white/15 bg-slate-800 shadow-2xl ${phoneShadow[colorPreset]} overflow-hidden relative`}>
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-white/10 rounded-b-2xl z-10" />

              {/* Screen content */}
              <div className="pt-8 px-4 pb-4 h-full flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-lg bg-pink-500 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-white">VIP Bari</span>
                </div>

                {/* Stat cards row */}
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat icon={<Users className="h-3 w-3" />} value="24" label="ভাড়াটিয়া" color="text-pink-400" />
                  <MiniStat icon={<Building2 className="h-3 w-3" />} value="8" label="রুম" color="text-purple-400" />
                  <MiniStat icon={<CreditCard className="h-3 w-3" />} value="৳85K" label="আদায়" color="text-amber-400" />
                </div>

                {/* Chart area */}
                <div className="flex-1 bg-white/5 rounded-xl p-3 flex flex-col justify-end">
                  <p className="text-[10px] text-white/50 mb-2">মাসিক আদায়</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-pink-500 to-purple-500 rounded-t-sm opacity-70" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { icon: <Users className="h-4 w-4" />, label: "ভাড়াটিয়া" },
                    { icon: <Receipt className="h-4 w-4" />, label: "বিল" },
                    { icon: <CreditCard className="h-4 w-4" />, label: "পেমেন্ট" },
                    { icon: <BarChart3 className="h-4 w-4" />, label: "রিপোর্ট" },
                  ].map((a, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-white/5">
                      <div className="text-pink-400">{a.icon}</div>
                      <span className="text-[8px] text-white/50">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------- sub-components ---------- */

const MiniStat = ({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) => (
  <div className="bg-white/5 rounded-lg p-2 flex flex-col items-center gap-0.5">
    <div className={color}>{icon}</div>
    <span className="text-sm font-bold text-white">{value}</span>
    <span className="text-[8px] text-white/50">{label}</span>
  </div>
);

const FloatingCard = ({ className, delay, icon, label }: { className: string; delay: string; icon: React.ReactNode; label: string }) => (
  <div
    className={`absolute z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg ${className}`}
    style={{
      opacity: 0,
      animation: `fade-in-up 0.6s ease-out ${delay} forwards, float-delayed 3.5s ease-in-out ${delay} infinite`,
    }}
  >
    {icon}
    <span className="text-xs font-medium text-white whitespace-nowrap">{label}</span>
  </div>
);

export default HeroSection;
