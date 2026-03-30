import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Detects OAuth callback tokens in URL hash and redirects to dashboard.
 */
export const OAuthCallbackHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      // Supabase client auto-picks up the token from the hash.
      // We just need to wait for session to be established, then redirect.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Clean the hash from URL
          window.history.replaceState(null, "", window.location.pathname);
          // Check role to decide where to go
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .then(({ data: roles }) => {
              const isAdmin = roles?.some((r) =>
                ["admin", "employee"].includes(r.role)
              );
              navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
            });
        }
      });
    }
  }, [navigate]);

  return null;
};
