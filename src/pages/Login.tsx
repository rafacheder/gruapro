import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Cpu } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
       const from = (location.state as { from?: string } | null)?.from || "/";
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { nome_completo: nome },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode entrar.");
        setMode("login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 bg-gradient-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-accent items-center justify-center mb-4 shadow-accent">
            <Cpu className="h-7 w-7 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold">
            Grua<span className="text-accent">Pro</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestão de máquinas de pelúcias</p>
        </div>
        <Card className="p-6 shadow-elevated bg-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
            </button>
          </form>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Primeiro acesso master: <span className="text-foreground font-medium">rafatcheder@gmail.com</span>
        </p>
      </div>
    </div>
  );
}