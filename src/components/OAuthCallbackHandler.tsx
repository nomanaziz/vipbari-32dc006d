import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const OAuthCallbackHandler = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [processing, setProcessing] = useState(false);

  const hasOAuthHash = useMemo(() => {
    const hash = window.location.hash;
    return (
      (hash.includes("access_token") || hash.includes("refresh_token")) &&
      !hash.includes("type=recovery")
    );
  }, []);

  useEffect(() => {
    if (!hasOAuthHash || loading || !user || processing) return;

    const handleOAuth = async () => {
      setProcessing(true);

      // Check if user already has a role (existing user)
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roles && roles.length > 0) {
        // Existing user — redirect based on role
        const userRole = roles[0].role;
        const target = userRole === "admin" || userRole === "employee" ? "/admin" : "/dashboard";
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        if (window.location.pathname !== target) {
          navigate(target, { replace: true });
        }
        setProcessing(false);
        return;
      }

      // New OAuth user — check for pending role from registration
      const pendingRole = localStorage.getItem("oauth_pending_role");
      if (!pendingRole || !["landlord", "tenant"].includes(pendingRole)) {
        // No role selected — sign out and redirect to register
        await supabase.auth.signOut();
        localStorage.removeItem("oauth_pending_role");
        window.history.replaceState(null, "", "/register");
        toast.error("Please register first by choosing your account type.");
        navigate("/register", { replace: true });
        setProcessing(false);
        return;
      }

      // Call edge function to complete registration
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
  }, [hasOAuthHash, loading, user, navigate, processing]);

  return null;
};
