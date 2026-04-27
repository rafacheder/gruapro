import { createContext, useContext, useEffect, useRef, useState, ReactNode, useMemo, useCallback } from "react";
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
  // Dedupe role/profile load per uid to prevent duplicate requests
  // (StrictMode double-mount + onAuthStateChange + getSession all firing).
  const loadedUidRef = useRef<string | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);

  const loadRoleAndProfile = useCallback(async (uid: string, force = false) => {
    if (!force && loadedUidRef.current === uid) return;
    if (inflightRef.current) return inflightRef.current;
    const p = (async () => {
      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase.rpc("get_user_role", { _user_id: uid }),
        supabase.from("profiles").select("nome_completo").eq("id", uid).maybeSingle(),
      ]);
      setRole((roleData as AppRole | null) ?? null);
      setNome(profileData?.nome_completo || "");
      loadedUidRef.current = uid;
    })();
    inflightRef.current = p;
    try { await p; } finally { inflightRef.current = null; }
  }, []);

  useEffect(() => {
    // Listener primeiro
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // defer ao próximo tick para evitar deadlock; dedupe interno evita duplicatas
        setTimeout(() => loadRoleAndProfile(sess.user.id), 0);
      } else {
        loadedUidRef.current = null;
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
  }, [loadRoleAndProfile]);

  const signOut = async () => {
    loadedUidRef.current = null;
    await supabase.auth.signOut();
  };

  const refreshRole = useCallback(async () => {
    if (user) await loadRoleAndProfile(user.id, true);
  }, [user, loadRoleAndProfile]);

  const value = useMemo(
    () => ({ user, session, role, nome, loading, signOut, refreshRole }),
    [user, session, role, nome, loading, refreshRole]
  );

  return (
    <AuthContext.Provider value={value}>
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
   return role === "master" || role === "admin" || role === "usuario";
 }
 
 export function canSeeFinancials(role: AppRole | null) {
   return role === "master" || role === "admin" || role === "usuario";
 }

export function isUser(role: AppRole | null) {
  return role === "usuario";
}