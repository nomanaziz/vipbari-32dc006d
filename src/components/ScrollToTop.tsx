import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = document.querySelector("main");

    const onMainScroll = () => setVisible((container?.scrollTop ?? 0) > 300);
    const onWindowScroll = () => setVisible(window.scrollY > 300);

    if (container) {
      container.addEventListener("scroll", onMainScroll, { passive: true });
    }
    window.addEventListener("scroll", onWindowScroll, { passive: true });

    return () => {
      container?.removeEventListener("scroll", onMainScroll);
      window.removeEventListener("scroll", onWindowScroll);
    };
  }, []);

  const scrollUp = () => {
    const container = document.querySelector("main");
    if (container && container.scrollTop > 0) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={scrollUp}
      className={cn(
        "fixed bottom-20 md:bottom-6 right-4 z-40 rounded-full shadow-lg transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
