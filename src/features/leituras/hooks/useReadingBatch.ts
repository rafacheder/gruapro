import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SESSION_KEY = "session_leituras";

export function useReadingBatch() {
  const navigate = useNavigate();
  const [leiturasRealizadas, setLeiturasRealizadas] = useState<string[]>([]);

  const registerOnline = (maquinaId: string, leituraId: string) => {
    setLeiturasRealizadas((prev) => [...prev, maquinaId]);
    const ids = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    ids.push(leituraId);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(ids));
  };

  const registerOffline = (maquinaId: string) => {
    setLeiturasRealizadas((prev) => [...prev, maquinaId]);
  };

  const finalizeOnline = (lastLeituraId: string) => {
    const ids: string[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    sessionStorage.removeItem(SESSION_KEY);
    if (ids.length > 1) navigate(`/leituras/consolidado?ids=${ids.join(",")}`);
    else navigate(`/leituras/${lastLeituraId}?new=true`);
  };

  const finalizeOffline = () => {
    navigate("/leituras");
  };

  return { leiturasRealizadas, registerOnline, registerOffline, finalizeOnline, finalizeOffline };
}