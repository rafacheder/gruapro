import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, CheckCircle2 } from "lucide-react";
import { MaquinaOpt } from "../hooks/useLeituraForm";

interface MachineSelectorProps {
  maquinas: MaquinaOpt[];
  maquinaId: string;
  setMaquinaId: (id: string) => void;
  isScanning: boolean;
  setIsScanning: (s: boolean) => void;
  leiturasRealizadas: string[];
  currentClienteId: string | null;
  setCurrentClienteId: (id: string | null) => void;
}

export function MachineSelector({
  maquinas,
  maquinaId,
  setMaquinaId,
  isScanning,
  setIsScanning,
  leiturasRealizadas,
  currentClienteId,
  setCurrentClienteId
}: MachineSelectorProps) {
  const clientesUnicos = Array.from(new Set(maquinas.map(m => m.cliente_id)))
    .map(cid => maquinas.find(m => m.cliente_id === cid))
    .filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Máquina *</Label>
        <Button
          type="button"
          variant={isScanning ? "destructive" : "default"}
          className={!isScanning ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
          size="sm"
          onClick={() => setIsScanning(!isScanning)}
        >
          <QrCode className="h-4 w-4 mr-1" />
          {isScanning ? "Cancelar" : "Escanear QR"}
        </Button>
      </div>

      {isScanning && (
        <div id="qr-reader" className="overflow-hidden rounded-lg border-2 border-dashed border-primary/50" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Filtrar por Cliente</Label>
          <Select value={currentClienteId || "all"} onValueChange={(v) => setCurrentClienteId(v === "all" ? null : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clientesUnicos.map((m) => (
                <SelectItem key={m?.cliente_id} value={m?.cliente_id || ""}>
                  {m?.clientes.nome_ponto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Selecionar Máquina</Label>
          <Select value={maquinaId} onValueChange={setMaquinaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {maquinas
                .filter(m => !currentClienteId || m.cliente_id === currentClienteId)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{m.codigo_identificacao} - {m.clientes.nome_ponto}</span>
                      {leiturasRealizadas.includes(m.id) && (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
