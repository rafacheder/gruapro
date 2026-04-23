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
   const [identifier, setIdentifier] = useState("");
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
       const email = identifier.includes("@") ? identifier : `${identifier}@system.local`;
       const { error } = await supabase.auth.signInWithPassword({ email, password });
       if (error) throw error;
       toast.success("Bem-vindo!");
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
             <h2 className="text-xl font-semibold">Entrar</h2>
             <div className="space-y-2">
               <Label htmlFor="identifier">Usuário ou Email</Label>
               <Input
                 id="identifier"
                 value={identifier}
                 onChange={(e) => setIdentifier(e.target.value)}
                 required
                 placeholder="Ex: joao ou joao@email.com"
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
               Entrar
             </Button>
          </form>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Primeiro acesso master: <span className="text-foreground font-medium">rafatcheder@gmail.com</span>
        </p>
      </div>
    </div>
  );
}