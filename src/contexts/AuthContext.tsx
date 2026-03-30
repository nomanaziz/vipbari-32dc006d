import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProfileData {
  full_name: string;
  phone: string;
  language: string;
  avatar_url: string | null;
  email: string;
  auto_tolet: boolean;
}

interface StaffAssignment {
  preset_id: string | null;
  scope: string;
  landlord_id: string | null;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  profile: ProfileData | null;
  permissions: string[];
  staffAssignment: StaffAssignment | null;
  effectiveOwnerId: string | null;
  hasPermission: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
  signIn: (phone: string, pin: string) => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, pin: string) => Promise<{ error: string | null }>;
  signUp: (phone: string, pin: string, fullName: string, role: AppRole, email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [staffAssignment, setStaffAssignment] = useState<StaffAssignment | null>(null);

  const fetchUserData = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("full_name, phone, language, avatar_url, email, auto_tolet").eq("user_id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (roleRes.data && roleRes.data.length > 0) {
      const rolePriority: AppRole[] = ["admin", "employee", "landlord", "landlord_staff", "staff", "tenant"];
      const userRoles = roleRes.data.map((r) => r.role as AppRole);
      const highestRole = rolePriority.find((r) => userRoles.includes(r)) || userRoles[0];
      setRole(highestRole);

      // Fetch staff assignment & permissions for employee or landlord_staff
      if (highestRole === "employee" || highestRole === "landlord_staff") {
        const { data: assignments } = await supabase
          .from("staff_assignments")
          .select("preset_id, scope, landlord_id, permission_presets(permissions)")
          .eq("user_id", userId) as any;

        if (assignments && assignments.length > 0) {
          const assignment = assignments[0];
          const perms = (assignment.permission_presets?.permissions as string[]) || [];
          setPermissions(perms);
          setStaffAssignment({
            preset_id: assignment.preset_id,
            scope: assignment.scope,
            landlord_id: assignment.landlord_id,
            permissions: perms,
          });
        } else {
          setPermissions([]);
          setStaffAssignment(null);
        }
      } else if (highestRole === "admin") {
        // Admin has all permissions
        setPermissions(["*"]);
        setStaffAssignment(null);
      } else {
        setPermissions([]);
        setStaffAssignment(null);
      }
    }
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (role === "admin") return true;
    if (role === "landlord") return true; // Landlords have full access to their own data
    return permissions.includes(permission) || permissions.includes("*");
  }, [role, permissions]);

  const effectiveOwnerId = useMemo(() => {
    if (role === "landlord_staff" && staffAssignment?.landlord_id) {
      return staffAssignment.landlord_id;
    }
    return user?.id ?? null;
  }, [role, staffAssignment, user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setRole(null);
        setProfile(null);
        setPermissions([]);
        setStaffAssignment(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (phone: string, pin: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("login-with-phone", {
        body: { phone },
      });
      if (fnError || !data?.email) {
        return { error: data?.error || "No account found with this phone number" };
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: pin,
      });
      if (error) {
        // Check if account exists but is unverified
        try {
          const { data: statusData } = await supabase.functions.invoke("check-email-status", {
            body: { email: data.email },
          });
          if (statusData?.exists && !statusData?.verified) {
            return { error: "EMAIL_NOT_VERIFIED" };
          }
        } catch {}
        return { error: error.message || null };
      }
      return { error: null };
    } catch {
      return { error: "Login failed. Please try again." };
    }
  };

  const signInWithEmail = async (email: string, pin: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });
    if (error) {
      // Check if account exists but is unverified
      try {
        const { data } = await supabase.functions.invoke("check-email-status", {
          body: { email },
        });
        if (data?.exists && !data?.verified) {
          return { error: "EMAIL_NOT_VERIFIED" };
        }
      } catch {}
      return { error: error.message || null };
    }
    return { error: null };
  };

  const signUp = async (phone: string, pin: string, fullName: string, role: AppRole, email: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pin,
      options: {
        data: { full_name: fullName, role, phone, email },
      },
    });
    return { error: error?.message || null };
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, profile, permissions, staffAssignment, effectiveOwnerId, hasPermission, refreshProfile, signIn, signInWithEmail, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
