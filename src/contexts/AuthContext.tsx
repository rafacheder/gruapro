import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "master" | "admin" | "usuario";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  nome: string;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRoleAndProfile = async (uid: string) => {
    const [{ data: roleData }, { data: profileData }] = await Promise.all([
      supabase.rpc("get_user_role", { _user_id: uid }),
      supabase.from("profiles").select("nome_completo").eq("id", uid).maybeSingle(),
    ]);
    setRole((roleData as AppRole | null) ?? null);
    setNome(profileData?.nome_completo || "");
  };

  useEffect(() => {
    // Listener primeiro
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // defer ao próximo tick para evitar deadlock
        setTimeout(() => loadRoleAndProfile(sess.user.id), 0);
      } else {
        setRole(null);
        setNome("");
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadRoleAndProfile(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshRole = async () => {
    if (user) await loadRoleAndProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, nome, loading, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa de <AuthProvider>");
  return ctx;
}

export function canManageData(role: AppRole | null) {
  return role === "master" || role === "admin";
}

export function canSeeFinancials(role: AppRole | null) {
  return role === "master" || role === "admin";
}