import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const OAuthCallbackHandler = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  const hasOAuthHash = useMemo(() => {
    const hash = window.location.hash;
    return (
      (hash.includes("access_token") || hash.includes("refresh_token")) &&
      !hash.includes("type=recovery")
    );
  }, []);

  useEffect(() => {
    if (!hasOAuthHash || loading || !user) return;

    const target = role === "admin" || role === "employee" ? "/admin" : "/dashboard";
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    if (window.location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [hasOAuthHash, loading, navigate, role, user]);

  return null;
};
