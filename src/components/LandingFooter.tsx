import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Building2, Calculator, LinkIcon, MessageSquare, DoorOpen,
  Zap, BarChart3, ShieldCheck, Phone, Mail, MapPin,
  Smartphone, Shield, Clock, Heart,
} from "lucide-react";

const featureLinks = [
  { slug: "bill-calculation", icon: Calculator, key: "feat_bill_calculation.title" },
  { slug: "payment-link", icon: LinkIcon, key: "feat_payment_link.title" },
  { slug: "sms-notification", icon: MessageSquare, key: "feat_sms_notification.title" },
  { slug: "room-management", icon: DoorOpen, key: "feat_room_management.title" },
  { slug: "smart-automation", icon: Zap, key: "feat_smart_automation.title" },
  { slug: "analytics-insights", icon: BarChart3, key: "feat_analytics_insights.title" },
  { slug: "security-protection", icon: ShieldCheck, key: "feat_security_protection.title" },
];

const quickLinks = [
  { to: "/#features", key: "landing.nav_features" },
  { to: "/#how", key: "landing.nav_how" },
  { to: "/#pricing", key: "landing.nav_pricing" },
  { to: "/tutorials", key: "footer.tutorials" },
  { to: "/login", key: "auth.login" },
  { to: "/register", key: "landing.get_started" },
];

export const LandingFooter = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">{t("app.name")}</span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed mb-4">
              {t("footer.desc")}
            </p>
            <div className="flex flex-col gap-2 text-sm opacity-70">
              <a href="mailto:support@vipbari.com" className="flex items-center gap-2 hover:opacity-100 transition-opacity">
                <Mail className="h-4 w-4" /> support@vipbari.com
              </a>
              <a href="tel:+8801700000000" className="flex items-center gap-2 hover:opacity-100 transition-opacity">
                <Phone className="h-4 w-4" /> +880 1700-000000
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {t("footer.location")}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-90">
              {t("footer.quick_links")}
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <Link to={link.to} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Feature Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-90">
              {t("footer.features")}
            </h4>
            <ul className="space-y-2.5">
              {featureLinks.map((f) => (
                <li key={f.slug}>
                  <Link
                    to={`/features/${f.slug}`}
                    className="text-sm opacity-70 hover:opacity-100 transition-opacity flex items-center gap-2"
                  >
                    <f.icon className="h-3.5 w-3.5" />
                    {t(f.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-90">
              {t("footer.support")}
            </h4>
            <ul className="space-y-2.5 text-sm opacity-70">
              <li><Link to="/page/about-us" className="hover:opacity-100 transition-opacity">{t("footer.about_us")}</Link></li>
              <li><Link to="/page/privacy-policy" className="hover:opacity-100 transition-opacity">{t("footer.privacy")}</Link></li>
              <li><Link to="/page/terms-and-conditions" className="hover:opacity-100 transition-opacity">{t("footer.terms")}</Link></li>
              <li><Link to="/page/payment-and-refund" className="hover:opacity-100 transition-opacity">{t("footer.refund")}</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-background/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-xs opacity-70">{t("footer.badge_bd")}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-xs opacity-70">{t("footer.badge_support")}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xs opacity-70">{t("footer.badge_secure")}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Smartphone className="h-5 w-5 text-primary" />
              <span className="text-xs opacity-70">{t("footer.badge_mobile")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-60">
          <p>© {new Date().getFullYear()} {t("app.name")}. {t("landing.rights")}</p>
          <p>{t("footer.made_with")}</p>
        </div>
      </div>
    </footer>
  );
};
