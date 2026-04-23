import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useRef } from "react";

interface ReadingPhotoUploadProps {
  fotos: File[];
  previews: string[];
  handleFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFoto: (i: number) => void;
}

export function ReadingPhotoUpload({
  fotos,
  previews,
  handleFiles,
  removeFoto
}: ReadingPhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>Fotos (opcional, máx 5)</Label>
      <div className="flex flex-wrap gap-2">
        {previews.map((p, i) => (
          <div key={i} className="relative w-20 h-20 group">
            <img src={p} className="w-full h-full object-cover rounded-md border" alt="" />
            <button
              type="button"
              onClick={() => removeFoto(i)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {fotos.length < 5 && (
          <Button
            type="button"
            variant="outline"
            className="w-20 h-20 border-dashed"
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="h-6 w-6 text-muted-foreground" />
          </Button>
        )}
      </div>
      <input
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        ref={fileRef}
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}
