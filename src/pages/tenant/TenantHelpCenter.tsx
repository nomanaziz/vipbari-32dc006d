import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Shield, Flame, HeartPulse, Building2, HelpCircle } from "lucide-react";

const TenantHelpCenter = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("owner_id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: landlordProfile } = useQuery({
    queryKey: ["landlord-profile", tenant?.owner_id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone, email").eq("user_id", tenant!.owner_id).maybeSingle();
      return data;
    },
    enabled: !!tenant?.owner_id,
  });

  const emergencyContacts = [
    { label: language === "bn" ? "পুলিশ" : "Police", number: "999", icon: Shield, color: "text-blue-500" },
    { label: language === "bn" ? "ফায়ার সার্ভিস" : "Fire Service", number: "199", icon: Flame, color: "text-orange-500" },
    { label: language === "bn" ? "অ্যাম্বুলেন্স" : "Ambulance", number: "199", icon: HeartPulse, color: "text-red-500" },
    { label: language === "bn" ? "জাতীয় হেল্পলাইন" : "National Helpline", number: "333", icon: Phone, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("tenant.help_center")}</h1>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{language === "bn" ? "জরুরি যোগাযোগ" : "Emergency Contacts"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {emergencyContacts.map((c) => (
              <a key={c.number + c.label} href={`tel:${c.number}`} className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <c.icon className={`h-8 w-8 ${c.color}`} />
                <span className="font-semibold text-lg">{c.number}</span>
                <span className="text-xs text-muted-foreground text-center">{c.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Landlord Contact */}
      {landlordProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {language === "bn" ? "বাড়িওয়ালার যোগাযোগ" : "Landlord Contact"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{landlordProfile.full_name}</p>
            {landlordProfile.phone && (
              <a href={`tel:${landlordProfile.phone}`} className="text-sm text-primary flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {landlordProfile.phone}
              </a>
            )}
            {landlordProfile.email && (
              <p className="text-sm text-muted-foreground">{landlordProfile.email}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {language === "bn" ? "সাধারণ জিজ্ঞাসা" : "FAQ"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { q: language === "bn" ? "কিভাবে অভিযোগ জানাবো?" : "How do I file a complaint?", a: language === "bn" ? "অভিযোগ পেজে গিয়ে 'অভিযোগ যোগ করুন' বোতামে ক্লিক করুন।" : "Go to the Complaints page and click 'Add Complaint'." },
            { q: language === "bn" ? "বিল কিভাবে দেখবো?" : "How do I view my bills?", a: language === "bn" ? "পেমেন্ট পেজে আপনার সকল বিল ও পেমেন্ট দেখতে পারবেন।" : "Visit the Payments page to see all your bills and payment history." },
            { q: language === "bn" ? "পরিবারের সদস্য কিভাবে যোগ করবো?" : "How do I add family members?", a: language === "bn" ? "পরিবার পেজে গিয়ে 'সদস্য যোগ করুন' বোতামে ক্লিক করুন।" : "Go to the Family page and click 'Add Member'." },
          ].map((faq, i) => (
            <div key={i} className="space-y-1">
              <p className="font-medium text-sm">{faq.q}</p>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantHelpCenter;
