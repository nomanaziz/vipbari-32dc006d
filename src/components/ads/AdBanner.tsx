import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdBannerProps {
  placement: string;
  className?: string;
}

const AdBanner = ({ placement, className = "" }: AdBannerProps) => {
  const { data: ads } = useQuery({
    queryKey: ["ads", placement],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("placement", placement)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleClick = async (ad: any) => {
    // Track click
    try { await supabase.from("ads").update({ clicks: (ad.clicks || 0) + 1 }).eq("id", ad.id); } catch {}
    if (ad.link_url) window.open(ad.link_url, "_blank", "noopener");
  };

  if (!ads || ads.length === 0) {
    // Google Ads placeholder
    return (
      <div className={`bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center min-h-[90px] text-xs text-muted-foreground/40 ${className}`}>
        <span>Ad Space</span>
      </div>
    );
  }

  const ad = ads[Math.floor(Math.random() * ads.length)];

  return (
    <div
      className={`rounded-lg overflow-hidden cursor-pointer ${className}`}
      onClick={() => handleClick(ad)}
    >
      {ad.image_url ? (
        <img
          src={ad.image_url}
          alt={ad.title || "Advertisement"}
          className="w-full h-auto object-cover rounded-lg"
          loading="lazy"
        />
      ) : (
        <div className="bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center min-h-[90px] text-xs text-muted-foreground/40">
          <span>{ad.title || "Ad"}</span>
        </div>
      )}
    </div>
  );
};

export default AdBanner;
