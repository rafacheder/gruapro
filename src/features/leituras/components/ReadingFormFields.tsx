import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CloudOff } from "lucide-react";

interface ReadingFormFieldsProps {
  contadorEntradaAtual: string;
  setContadorEntradaAtual: (v: string) => void;
  contadorSaidaAtual: string;
  setContadorSaidaAtual: (v: string) => void;
  valorPorCredito: string;
  setValorPorCredito: (v: string) => void;
  observacoes: string;
  setObservacoes: (v: string) => void;
  isOnline: boolean;
}

export function ReadingFormFields({
  contadorEntradaAtual,
  setContadorEntradaAtual,
  contadorSaidaAtual,
  setContadorSaidaAtual,
  valorPorCredito,
  setValorPorCredito,
  observacoes,
  setObservacoes,
  isOnline
}: ReadingFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="entrada">Contador Entrada *</Label>
        <Input
          id="entrada"
          type="number"
          inputMode="numeric"
          value={contadorEntradaAtual}
          onChange={(e) => setContadorEntradaAtual(e.target.value)}
          placeholder="0"
          className="text-lg font-medium"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="saida">Contador Saída *</Label>
        <Input
          id="saida"
          type="number"
          inputMode="numeric"
          value={contadorSaidaAtual}
          onChange={(e) => setContadorSaidaAtual(e.target.value)}
          placeholder="0"
          className="text-lg font-medium"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="valorCredito">Valor p/ Crédito</Label>
        <Input
          id="valorCredito"
          value={valorPorCredito}
          onChange={(e) => setValorPorCredito(e.target.value)}
          placeholder="1,00"
        />
      </div>
      <div className="sm:col-span-3 space-y-2">
        <Label htmlFor="obs">Observações</Label>
        {!isOnline && (
          <div className="flex items-center gap-1 text-[10px] text-amber-600 mb-1">
            <CloudOff className="h-3 w-3" /> Modo Offline: evite textos muito longos
          </div>
        )}
        <Textarea
          id="obs"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Opcional..."
          rows={2}
        />
      </div>
    </div>
  );
}
