import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cpu, MapPin, Loader2, LogIn, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default function PublicMachine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [maquina, setMaquina] = useState<any>(null);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
     const load = async () => {
       if (!id) return;
       const { data, error } = await supabase.rpc("get_public_machine", { 
         machine_id: id 
       });
 
       if (error) {
         console.error("Erro ao carregar máquina pública:", error);
         setMaquina(null);
       } else if (data && data.length > 0) {
         setMaquina(data[0]);
       } else {
         setMaquina(null);
       }
       setLoading(false);
     };
     load();
   }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!maquina) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Máquina não encontrada</h1>
        <p className="text-muted-foreground mb-6">O QR Code pode estar inválido ou a máquina foi removida.</p>
        <Button onClick={() => navigate("/login")}>Ir para o Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 py-12 bg-gradient-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-accent items-center justify-center mb-4 shadow-accent">
            <Cpu className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold">
            Grua<span className="text-accent">Pro</span>
          </h1>
          <p className="text-muted-foreground mt-1">Perfil Público da Máquina</p>
        </div>

        <Card className="p-6 shadow-elevated bg-card border-t-4 border-t-accent">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Código</div>
              <h2 className="text-2xl font-bold">{maquina.codigo_identificacao}</h2>
            </div>
             <Badge variant={maquina.ativo ? "default" : "secondary"}>
               {maquina.ativo ? "Ativa" : "Inativa"}
            </Badge>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Localização</div>
                 <div className="font-medium">Localização protegida</div>
                 <div className="text-xs text-muted-foreground">Consulte o sistema</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Cpu className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Modelo</div>
                <div className="font-medium">{maquina.modelo || "Padrão"}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Button 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent"
              onClick={() => navigate(`/leituras/nova?maquina_id=${maquina.id}`)}
            >
              <Plus className="h-4 w-4 mr-2" /> Nova Leitura
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              <LogIn className="h-4 w-4 mr-2" /> Acessar Sistema
            </Button>
          </div>
        </Card>
        
      </div>
    </div>
  );
}