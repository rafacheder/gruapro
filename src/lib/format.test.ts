import { describe, it, expect } from "vitest";
import { formatDateTime, formatDate, formatTime, formatDateTimeWithSeconds } from "./format";

describe("Formatação de data e hora (Timezone America/Sao_Paulo)", () => {
  // 2026-04-29T18:00:00Z é 2026-04-29T15:00:00 no Brasil (BRT, UTC-3)
  const utcDateStr = "2026-04-29T18:00:00Z";
  
  it("formatDateTime deve converter UTC para BRT (18:00 UTC -> 15:00 BRT)", () => {
    const result = formatDateTime(utcDateStr);
    // Formato pt-BR short: "29/04/2026 15:00" ou similar dependendo da engine
    // O ponto principal é o "15:00"
    expect(result).toMatch(/29\/04\/(20)?26/);
    expect(result).toMatch(/15:00/);
  });

  it("formatDate deve mostrar a data correta no Brasil", () => {
    // Se for 01:00 UTC do dia 30, no Brasil ainda é dia 29 (22:00)
    const earlyUtc = "2026-04-30T01:00:00Z";
    const result = formatDate(earlyUtc);
    expect(result).toMatch(/29\/04\/(20)?26/);
  });

  it("formatTime deve mostrar apenas a hora no Brasil", () => {
    const result = formatTime(utcDateStr);
    expect(result).toBe("15:00");
  });

  it("formatDateTimeWithSeconds deve incluir segundos", () => {
    const result = formatDateTimeWithSeconds(utcDateStr);
    // 15:00:00
    expect(result).toContain("15:00:00");
  });

  it("deve lidar com valores nulos ou indefinidos", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("Audit Log Timezone Consistency", () => {
  it("deve garantir que o formato usado no AuditLog reflete o horário de Brasília", () => {
    const auditCreatedAt = "2024-01-01T03:00:00Z"; // 00:00 em Brasília
    const formatted = formatDateTime(auditCreatedAt);
    expect(formatted).toContain("00:00");
  });
});

describe("Pagamentos e Leituras Timezone Consistency", () => {
  it("deve garantir que datas de leitura (geralmente salvas como timestamptz) sejam exibidas corretamente", () => {
    const leituraData = "2024-05-15T12:00:00Z"; // 09:00 BRT
    expect(formatDateTime(leituraData)).toContain("09:00");
  });
});