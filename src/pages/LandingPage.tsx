import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLandingContent } from "@/hooks/useLandingContent";
import { PublicNavbar } from "@/components/PublicNavbar";
import { LandingFooter } from "@/components/LandingFooter";
import HeroSection from "@/components/landing/HeroSection";
import WhySection from "@/components/landing/WhySection";
import WhoUsesSection from "@/components/landing/WhoUsesSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import PaymentMethodsSection from "@/components/landing/PaymentMethodsSection";
import InstallSection from "@/components/landing/InstallSection";
import ToLetHighlight from "@/components/landing/ToLetHighlight";
import AppIcon from "@/components/landing/AppIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Building2, Users, Receipt, CreditCard, BarChart3, Send,
  Zap, Droplets, Flame, Wifi, Bell, Shield, FileText, Database,
  Share2, History, CheckCircle2, XCircle, Star, ArrowRight,
  Smartphone, Link as LinkIcon, Warehouse, Rocket, Eye, ParkingCircle,
} from "lucide-react";

const LandingPage = () => {
  const { t } = useLanguage();
  const { lc, getGroup } = useLandingContent();
  const location = useLocation();

  useEffect(() => {
    const scrollTo = (location.state as any)?.scrollTo;
    if (scrollTo) {
      setTimeout(() => {
        const el = document.getElementById(scrollTo);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const mainFeatures = [
    { icon: Users, dbTitle: "feat_1_title", dbDesc: "feat_1_desc", slug: "room-management", color: "blue" },
    { icon: Building2, dbTitle: "feat_2_title", dbDesc: "feat_2_desc", slug: "room-management", color: "green" },
    { icon: Receipt, dbTitle: "feat_3_title", dbDesc: "feat_3_desc", slug: "bill-calculation", color: "orange" },
    { icon: Send, dbTitle: "feat_4_title", dbDesc: "feat_4_desc", slug: "sms-notification", color: "purple" },
    { icon: CreditCard, dbTitle: "feat_5_title", dbDesc: "feat_5_desc", slug: "payment-link", color: "pink" },
    { icon: BarChart3, dbTitle: "feat_6_title", dbDesc: "feat_6_desc", slug: "analytics-insights", color: "teal" },
    { icon: Warehouse, dbTitle: "feat_7_title", dbDesc: "feat_7_desc", slug: "garage-management", color: "cyan" },
    { icon: Rocket, dbTitle: "feat_8_title", dbDesc: "feat_8_desc", slug: "listing-boosting", color: "violet" },
  ];

  const miniFeatureIcons = [LinkIcon, Smartphone, Zap, Droplets, Flame, Wifi, Bell, Shield, FileText, Database, Share2, History, Eye, ParkingCircle];
  const miniFeatureColors = ["blue", "green", "yellow", "cyan", "orange", "indigo", "red", "purple", "rose", "teal", "pink", "lime", "emerald", "slate"];

  const miniFeatures = getGroup("mini_features");

  const problems = getGroup("problems").filter(s => s.section_key.includes("_problem") || s.section_key.includes("_solution"));
  const problemPairs: { problem: string; solution: string }[] = [];
  for (let i = 1; i <= 4; i++) {
    problemPairs.push({
      problem: lc(`prob_${i}_problem`, `landing.prob${i}`),
      solution: lc(`prob_${i}_solution`, `landing.sol${i}`),
    });
  }

  const testimonialItems = [1, 2, 3].map(i => ({
    name: lc(`test_${i}_name`, `landing.test${i}_name`),
    loc: lc(`test_${i}_loc`, `landing.test${i}_loc`),
    text: lc(`test_${i}_text`, `landing.test${i}_text`),
  }));

  const faqItems = getGroup("faq").filter(s => s.section_key.endsWith("_q"));

  // Stats
  const stats = [
    { value: lc("stat_1_value") || "64+", label: lc("stat_1_label", "landing.stat_districts") },
    { value: lc("stat_2_value") || "99.9%", label: lc("stat_2_label", "landing.stat_uptime") },
    { value: lc("stat_3_value") || "24/7", label: lc("stat_3_label", "landing.stat_support") },
    { value: lc("stat_4_value") || "100%", label: lc("stat_4_label", "landing.stat_secure") },
  ];

  // Landlord/Tenant benefits
  const landlordBenefits = [1, 2, 3, 4, 5].map(i => lc(`landlord_${i}`, `landing.landlord_${i}`)).filter(Boolean);
  const tenantBenefits = [1, 2, 3, 4, 5].map(i => lc(`tenant_${i}`, `landing.tenant_${i}`)).filter(Boolean);

  // Comparison rows
  const cmpRows = [1, 2, 3, 4, 5, 6].map(i => lc(`cmp_row_${i}`, `landing.cmp_row${i}`)).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <HeroSection />

      {/* Stats Bar */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i}><p className="text-3xl font-bold">{s.value}</p><p className="text-sm opacity-80">{s.label}</p></div>
          ))}
        </div>
      </section>

      <WhySection />
      <ToLetHighlight />
      <WhoUsesSection />
      <BenefitsSection />

      {/* Problem / Solution */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{lc("prob_title", "landing.prob_title")}</h2>
          <div className="grid gap-4">
            {problemPairs.map((p, i) => (
              <div key={i} className="grid sm:grid-cols-2 gap-4">
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-5 flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-sm">{p.problem}</span>
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-5 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{p.solution}</span>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">{lc("feat_badge", "landing.feat_badge")}</span>
          </div>
          <h2 className="text-3xl font-bold text-center mb-4">{lc("feat_title", "landing.feat_title")}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">{lc("feat_sub", "landing.feat_sub")}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {mainFeatures.map((f) => (
              <Link key={f.dbTitle} to={`/features/${f.slug}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <AppIcon icon={f.icon} color={f.color} />
                    <h3 className="font-semibold mt-4 mb-2">{lc(f.dbTitle)}</h3>
                    <p className="text-sm text-muted-foreground">{lc(f.dbDesc)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {miniFeatures.length > 0 ? miniFeatures.map((f, i) => {
              const Icon = miniFeatureIcons[i] || Bell;
              const color = miniFeatureColors[i] || "blue";
              const val = lc(f.section_key);
              return (
                <div key={f.id} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background border hover:border-primary/40 transition-colors">
                  <AppIcon icon={Icon} color={color} size="sm" />
                  <span className="text-xs text-center">{val}</span>
                </div>
              );
            }) : Array.from({ length: 14 }, (_, i) => {
              const Icon = miniFeatureIcons[i];
              return (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background border hover:border-primary/40 transition-colors">
                  <AppIcon icon={Icon} color={miniFeatureColors[i]} size="sm" />
                  <span className="text-xs text-center">{lc(`mini_${i + 1}`)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Landlords & Tenants */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-8">
          <Card className="border-primary/30">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4 text-primary">{lc("for_landlord", "landing.for_landlord")}</h3>
              <ul className="space-y-3">
                {landlordBenefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-accent-foreground/30">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4 text-accent-foreground">{lc("for_tenant", "landing.for_tenant")}</h3>
              <ul className="space-y-3">
                {tenantBenefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">{lc("how_title", "landing.how_title")}</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">{i}</div>
                <h3 className="font-semibold mb-2">{lc(`step_${i}`, `landing.step${i}`)}</h3>
                <p className="text-sm text-muted-foreground">{lc(`step_${i}_desc`, `landing.step${i}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{lc("price_title", "landing.price_title")}</h2>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="font-semibold text-lg mb-2">{lc("price_free", "landing.price_free")}</h3>
                <p className="text-4xl font-bold mb-1">৳০</p>
                <p className="text-sm text-muted-foreground mb-6">{lc("price_free_desc", "landing.price_free_desc")}</p>
                <ul className="text-sm space-y-2 text-left mb-6">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{lc(`free_${i}`, `landing.free_${i}`)}</li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild><Link to="/register">{lc("", "landing.get_started") || t("landing.get_started")}</Link></Button>
              </CardContent>
            </Card>
            <Card className="border-primary shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">{lc("popular", "landing.popular")}</div>
              <CardContent className="p-8 text-center">
                <h3 className="font-semibold text-lg mb-2">{lc("price_premium", "landing.price_premium")}</h3>
                <p className="text-4xl font-bold mb-1">৳১০<span className="text-base font-normal text-muted-foreground">/{lc("per_room", "landing.per_room")}</span></p>
                <p className="text-sm text-muted-foreground mb-6">{lc("price_prem_desc", "landing.price_prem_desc")}</p>
                <ul className="text-sm space-y-2 text-left mb-6">
                  {[1, 2, 3, 4].map(i => (
                    <li key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{lc(`prem_${i}`, `landing.prem_${i}`)}</li>
                  ))}
                </ul>
                <Button className="w-full" asChild><Link to="/register">{t("landing.get_started")}</Link></Button>
              </CardContent>
            </Card>
            <Card className="border-accent-foreground/30">
              <CardContent className="p-8 text-center">
                <h3 className="font-semibold text-lg mb-2">{lc("price_tolet", "landing.price_tolet") || "টু-লেট / To-Let"}</h3>
                <p className="text-4xl font-bold mb-1">৳৫০<span className="text-base font-normal text-muted-foreground">/{lc("per_month", "landing.per_month") || "month"}</span></p>
                <p className="text-sm text-muted-foreground mb-6">{lc("price_tolet_desc", "landing.price_tolet_desc")}</p>
                <ul className="text-sm space-y-2 text-left mb-6">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{lc(`tolet_${i}`, `landing.tolet_${i}`)}</li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild><Link to="/register">{t("landing.get_started")}</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <PaymentMethodsSection />

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">{lc("compare_title", "landing.compare_title")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="p-3 text-left">{lc("compare_feature", "landing.compare_feature")}</th>
                  <th className="p-3 text-center">{t("app.name")}</th>
                  <th className="p-3 text-center">{lc("compare_manual", "landing.compare_manual")}</th>
                  <th className="p-3 text-center">{lc("compare_excel", "landing.compare_excel")}</th>
                </tr>
              </thead>
              <tbody className="bg-background">
                {cmpRows.map((row, i) => {
                  // Excel column: rows 0-1 = X, rows 2-4 = ~, row 5 = ~
                  const excelCell = i <= 1
                    ? <XCircle className="h-4 w-4 text-destructive mx-auto" />
                    : <span className="text-muted-foreground">~</span>;
                  return (
                    <tr key={i} className="border-t">
                      <td className="p-3">{row}</td>
                      <td className="p-3 text-center"><CheckCircle2 className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="p-3 text-center"><XCircle className="h-4 w-4 text-destructive mx-auto" /></td>
                      <td className="p-3 text-center">{excelCell}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{lc("test_title", "landing.test_title")}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonialItems.map((te, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">{[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}</div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{te.text}"</p>
                  <p className="font-semibold text-sm">{te.name}</p>
                  <p className="text-xs text-muted-foreground">{te.loc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">{lc("faq_title", "landing.faq_title")}</h2>
          <Accordion type="single" collapsible>
            {(faqItems.length > 0 ? faqItems : [1, 2, 3, 4, 5].map(i => ({ section_key: `faq_${i}_q`, id: String(i) }))).map((faq, i) => {
              const num = faq.section_key.replace("faq_", "").replace("_q", "");
              return (
                <AccordionItem key={faq.id || i} value={`faq-${i}`}>
                  <AccordionTrigger>{lc(`faq_${num}_q`, `landing.faq${num}_q`)}</AccordionTrigger>
                  <AccordionContent>{lc(`faq_${num}_a`, `landing.faq${num}_a`)}</AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>

      <InstallSection />

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">{lc("cta_title", "landing.cta_title")}</h2>
          <p className="mb-8 opacity-90">{lc("cta_sub", "landing.cta_sub")}</p>
          <Button size="lg" variant="secondary" className="text-base px-8" asChild>
            <Link to="/register">{lc("cta_btn", "landing.cta_btn")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
