import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Receipt, CreditCard, Bell, Building2, Zap, BarChart3, Shield,
  Calculator, Settings, Droplets, Wifi, Clock, RefreshCw,
  MessageSquare, Smartphone, FileText, Database, Lock,
  Activity, TrendingUp, PieChart, ArrowLeft, Play, ArrowRight,
  CheckCircle2, XCircle, type LucideIcon,
} from "lucide-react";

interface FeatureItem { icon: LucideIcon; titleKey: string; descKey: string }
interface BenefitItem { titleKey: string; descKey: string }
interface StepItem { titleKey: string; descKey: string }
interface CompareItem { beforeKey: string; afterKey: string }
interface UseCaseItem { titleKey: string; descKey: string }

interface FeaturePageData {
  icon: LucideIcon;
  color: string;
  titleKey: string;
  subtitleKey: string;
  descKey: string;
  features: FeatureItem[];
  benefits: BenefitItem[];
  steps: StepItem[];
  comparisons: CompareItem[];
  useCases: UseCaseItem[];
}

const featureIcons: Record<string, LucideIcon[]> = {
  "bill-calculation": [Zap, Settings, Droplets, Wifi, RefreshCw, CreditCard],
  "payment-link": [Smartphone, CreditCard, Zap, PieChart, CheckCircle2, Activity],
  "sms-notification": [MessageSquare, FileText, Bell, Smartphone, Settings, Database],
  "room-management": [Building2, FileText, Activity, CreditCard, CheckCircle2, Clock],
  "smart-automation": [RefreshCw, MessageSquare, Bell, Settings, FileText, Zap],
  "analytics-insights": [PieChart, TrendingUp, FileText, Activity, FileText, BarChart3],
  "security-protection": [Lock, Database, RefreshCw, Lock, Activity, Shield],
  "tolet": [Smartphone, Building2, MessageSquare, FileText, Activity, RefreshCw],
  "buy-sell": [Building2, Smartphone, Database, CreditCard, CheckCircle2, RefreshCw],
  "lease-management": [FileText, Clock, Bell, CreditCard, Building2, Settings],
};

const featureColors: Record<string, string> = {
  "bill-calculation": "from-emerald-400 to-teal-500",
  "payment-link": "from-pink-400 to-rose-500",
  "sms-notification": "from-amber-400 to-orange-500",
  "room-management": "from-blue-400 to-cyan-500",
  "smart-automation": "from-purple-400 to-violet-500",
  "analytics-insights": "from-indigo-400 to-blue-500",
  "security-protection": "from-emerald-400 to-green-500",
  "tolet": "from-cyan-400 to-sky-500",
  "buy-sell": "from-orange-400 to-red-500",
  "lease-management": "from-violet-400 to-purple-500",
};

const featureBorderColors: Record<string, string> = {
  "bill-calculation": "border-t-emerald-400",
  "payment-link": "border-t-pink-400",
  "sms-notification": "border-t-amber-400",
  "room-management": "border-t-blue-400",
  "smart-automation": "border-t-purple-400",
  "analytics-insights": "border-t-indigo-400",
  "security-protection": "border-t-emerald-400",
  "tolet": "border-t-cyan-400",
  "buy-sell": "border-t-orange-400",
  "lease-management": "border-t-violet-400",
};

const mainIcons: Record<string, LucideIcon> = {
  "bill-calculation": Receipt,
  "payment-link": CreditCard,
  "sms-notification": Bell,
  "room-management": Building2,
  "smart-automation": Zap,
  "analytics-insights": BarChart3,
  "security-protection": Shield,
  "tolet": Building2,
  "buy-sell": TrendingUp,
  "lease-management": FileText,
};

const slugs = [
  "bill-calculation", "payment-link", "sms-notification",
  "room-management", "smart-automation", "analytics-insights", "security-protection",
  "tolet", "buy-sell", "lease-management",
];

const FeatureDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();

  if (!slug || !slugs.includes(slug)) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="max-w-4xl mx-auto py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Feature not found</h1>
          <Button asChild><Link to="/">Go Home</Link></Button>
        </div>
      </div>
    );
  }

  const prefix = `feat_${slug.replace("-", "_")}`;
  const MainIcon = mainIcons[slug];
  const icons = featureIcons[slug];
  const color = featureColors[slug];
  const borderColor = featureBorderColors[slug];

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link to="/#features" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {t("feat.back_all")}
        </Link>
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6`}>
            <MainIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t(`${prefix}.title`)}
          </h1>
          <p className={`text-lg sm:text-xl font-medium bg-gradient-to-r ${color} bg-clip-text text-transparent mb-4`}>
            {t(`${prefix}.subtitle`)}
          </p>
          <p className="text-muted-foreground text-lg max-w-3xl mb-8">
            {t(`${prefix}.desc`)}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="gap-2" asChild>
              <Link to="/register"><Play className="h-4 w-4" />{t("feat.start_now")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/#features">{t("feat.see_all")} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
              {t("feat.features_label")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t("feat.whats_included")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0,1,2,3,4,5].map((i) => {
              const Icon = icons[i];
              return (
                <Card key={i} className={`border-t-4 ${borderColor}`}>
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 opacity-80`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{t(`${prefix}.f${i+1}`)}</h3>
                    <p className="text-sm text-muted-foreground">{t(`${prefix}.f${i+1}_d`)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
              {t("feat.benefits_label")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t("feat.how_benefit")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0,1,2,3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-foreground mb-2">{t(`${prefix}.b${i+1}`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`${prefix}.b${i+1}_d`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">{t("feat.how_works")}</h2>
          <div className="space-y-6">
            {[0,1,2,3].map((i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t(`${prefix}.s${i+1}`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`${prefix}.s${i+1}_d`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
              {t("feat.compare_label")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t("feat.before_after")}</h2>
          </div>
          <div className="space-y-4">
            {[0,1,2].map((i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    <p className="text-sm text-foreground">{t(`${prefix}.cmp_b${i+1}`)}</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm text-foreground">{t(`${prefix}.cmp_a${i+1}`)}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
              {t("feat.use_cases_label")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t("feat.when_use")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0,1,2,3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-1">{t(`${prefix}.uc${i+1}`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`${prefix}.uc${i+1}_d`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{t("feat.cta_title")}</h2>
          <p className="text-muted-foreground mb-8">{t("feat.cta_desc")}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild><Link to="/login">{t("feat.cta_login")}</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/#features">{t("feat.see_all")}</Link></Button>
          </div>
        </div>
      </section>

      {/* Related Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">{t("feat.more_features")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {slugs.filter(s => s !== slug).slice(0, 4).map((s) => {
              const Icon = mainIcons[s];
              const p = `feat_${s.replace("-", "_")}`;
              return (
                <Link key={s} to={`/features/${s}`} className="group">
                  <Card className="transition-shadow group-hover:shadow-md h-full">
                    <CardContent className="p-6">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${featureColors[s]} flex items-center justify-center mb-3`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{t(`${p}.title`)}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{t(`${p}.subtitle`)}</p>
                      <span className="text-primary text-sm font-medium mt-2 inline-block">{t("feat.details")} →</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {t("app.name")}. {t("landing.rights")}
      </footer>
    </div>
  );
};

export default FeatureDetailPage;
