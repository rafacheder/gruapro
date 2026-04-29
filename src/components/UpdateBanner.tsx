import { useUpdatePrompt } from "@/hooks/use-update-prompt";
import { Button } from "@/components/ui/button";
import { RefreshCw, X, Loader2 } from "lucide-react";

export function UpdateBanner() {
  const { needRefresh, updating, updateApp, dismiss } = useUpdatePrompt();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 w-full bg-primary text-primary-foreground border-b border-primary-foreground/20"
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <RefreshCw className="h-4 w-4 shrink-0" />
          <span>Nova versão disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={updateApp}
            disabled={updating}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {updating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Atualizar agora
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={dismiss}
            disabled={updating}
            aria-label="Dispensar"
            className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}