import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLeituraForm } from "./hooks/useLeituraForm";
import { ReadingSummary } from "./components/ReadingSummary";
import { MachineSelector } from "./components/MachineSelector";
import { ReadingFormFields } from "./components/ReadingFormFields";
import { ReadingCalculationsPanel } from "./components/ReadingCalculationsPanel";
import { ReadingPhotoUpload } from "./components/ReadingPhotoUpload";

export default function NovaLeitura() {
  const navigate = useNavigate();
  const {
    maquinas, maquinaId, setMaquinaId, isScanning, setIsScanning,
    contadorEntradaAtual, setContadorEntradaAtual,
    contadorSaidaAtual, setContadorSaidaAtual,
    valorPorCredito, setValorPorCredito,
    observacoes, setObservacoes,
    fotos, previews, handleFiles, removeFoto,
    saving, ultimaLeitura, variacao,
    showConfirm, setShowConfirm,
    currentClienteId, setCurrentClienteId,
    leiturasRealizadas, isSubmitNext,
    handleSubmit, maquinaSel, percentual,
    saidaPeriodo, valorFaturadoNum,
    comissao, liquido, isOnline
  } = useLeituraForm();

  return (
    <div className="pb-10">
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>
      <PageHeader title="Nova leitura" description="Coleta em campo" />

      <ReadingSummary ultimaLeitura={ultimaLeitura} />

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
        <Card className="p-5 space-y-4 bg-card">
          <MachineSelector
            maquinas={maquinas}
            maquinaId={maquinaId}
            setMaquinaId={setMaquinaId}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
            leiturasRealizadas={leiturasRealizadas}
            currentClienteId={currentClienteId}
            setCurrentClienteId={setCurrentClienteId}
          />

          <ReadingFormFields
            contadorEntradaAtual={contadorEntradaAtual}
            setContadorEntradaAtual={setContadorEntradaAtual}
            contadorSaidaAtual={contadorSaidaAtual}
            setContadorSaidaAtual={setContadorSaidaAtual}
            valorPorCredito={valorPorCredito}
            setValorPorCredito={setValorPorCredito}
            observacoes={observacoes}
            setObservacoes={setObservacoes}
            isOnline={isOnline}
          />

          <ReadingCalculationsPanel
            valorFaturadoNum={valorFaturadoNum}
            comissao={comissao}
            liquido={liquido}
            percentual={percentual}
            saidaPeriodo={saidaPeriodo}
            variacao={variacao}
          />

          <ReadingPhotoUpload
            fotos={fotos}
            previews={previews}
            handleFiles={handleFiles}
            removeFoto={removeFoto}
          />
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12"
            disabled={saving || !maquinaSel}
            onClick={(e) => handleSubmit(e, true)}
          >
            {saving && isSubmitNext ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar e Próxima
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 bg-primary hover:bg-primary/90"
            disabled={saving || !maquinaSel}
          >
            {saving && !isSubmitNext ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Finalizar Coleta"}
          </Button>
        </div>
      </form>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              Confirmação de Queda Brusca
            </AlertDialogTitle>
            <AlertDialogDescription>
              A variação diária desta máquina caiu <span className="font-bold text-destructive">{variacao?.variacaoDiaria.toFixed(1)}%</span>.
              Isso pode indicar algum problema técnico ou local. Deseja registrar mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit(undefined, isSubmitNext)}>Confirmar e Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
