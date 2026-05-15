import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function compressImage(file: File, maxWidth = 1600, quality = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality));
}

export function useReadingPhotos() {
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const remaining = 5 - fotos.length;
    const accepted = list.slice(0, remaining);
    if (list.length > remaining) toast.warning(`Máximo de 5 fotos. ${remaining} aceita(s).`);
    setFotos((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
  };

  const removeFoto = (i: number) => {
    setFotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const reset = () => {
    setFotos([]);
    setPreviews([]);
  };

  const uploadAllPhotos = async (leituraId: string) => {
    for (let i = 0; i < fotos.length; i++) {
      const blob = await compressImage(fotos[i]);
      const path = `${leituraId}/${i + 1}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("leitura-fotos")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) {
        console.error(upErr);
        continue;
      }
      await supabase.from("leitura_fotos").insert({ leitura_id: leituraId, foto_url: path, ordem: i + 1 });
    }
  };

  const getCompressedPhotosForOffline = async () => {
    const data: { campo: string; blob: Blob; fileName: string }[] = [];
    for (let i = 0; i < fotos.length; i++) {
      const blob = await compressImage(fotos[i]);
      data.push({ campo: `foto_${i + 1}`, blob, fileName: `${i + 1}-${Date.now()}.jpg` });
    }
    return data;
  };

  return { fotos, previews, handleFiles, removeFoto, reset, uploadAllPhotos, getCompressedPhotosForOffline };
}