import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const OAuthCallbackHandler = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [processing, setProcessing] = useState(false);

  const hashType = useMemo(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) return "recovery";
    if (hash.includes("type=signup") && hash.includes("access_token")) return "signup";
    if (hash.includes("access_token") || hash.includes("refresh_token")) return "oauth";
    return null;
  }, []);

  // Handle email verification (type=signup)
  useEffect(() => {
    if (hashType !== "signup" || loading || !user) return;

    toast.success("Email verified successfully!");
    localStorage.removeItem("pending_verification_email");
    window.history.replaceState(null, "", "/dashboard");
    navigate("/dashboard", { replace: true });
  }, [hashType, loading, user, navigate]);

  // Handle OAuth callback
  useEffect(() => {
    if (hashType !== "oauth" || loading || !user || processing) return;

    const handleOAuth = async () => {
      setProcessing(true);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roles && roles.length > 0) {
        const userRole = roles[0].role;
        const target = userRole === "admin" || userRole === "employee" ? "/admin" : "/dashboard";
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        if (window.location.pathname !== target) {
          navigate(target, { replace: true });
        }
        setProcessing(false);
        return;
      }

      const pendingRole = localStorage.getItem("oauth_pending_role");
      if (!pendingRole || !["landlord", "tenant"].includes(pendingRole)) {
        await supabase.auth.signOut();
        localStorage.removeItem("oauth_pending_role");
        window.history.replaceState(null, "", "/register");
        toast.error("Please register first by choosing your account type.");
        navigate("/register", { replace: true });
        setProcessing(false);
        return;
      }

      const { error } = await supabase.functions.invoke("complete-oauth-registration", {
        body: { role: pendingRole },
      });

      localStorage.removeItem("oauth_pending_role");

      if (error) {
        console.error("OAuth registration error:", error);
        toast.error("Registration failed. Please try again.");
        await supabase.auth.signOut();
        window.history.replaceState(null, "", "/register");
        navigate("/register", { replace: true });
        setProcessing(false);
        return;
      }

      toast.success("Account created successfully!");
      window.history.replaceState(null, "", "/dashboard");
      navigate("/dashboard", { replace: true });
      setProcessing(false);
    };

    handleOAuth();
  }, [hashType, loading, user, navigate, processing]);

  return null;
};
