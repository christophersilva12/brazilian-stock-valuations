import { isFinancialSector, type Stock } from "@/lib/market/types";
import type { StrategyReason } from "./types";

export function hasFundamentals(stock: Stock): boolean {
  return stock.fundamentalsSource != null && (stock.pe != null || stock.pb != null || stock.roe != null);
}

export function debtIsAcceptable(stock: Stock, maxRatio: number): boolean | null {
  if (isFinancialSector(stock.sector)) return true;
  if (stock.debtToEquity == null) return null;
  return stock.debtToEquity <= maxRatio;
}

export function fmt(value: number, digits = 1): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function reason(key: string, tone: StrategyReason["tone"], params?: Record<string, string | number>): StrategyReason {
  return { key, tone, params };
}

export function bandScore(value: number | null, good: number, ok: number, higherIsBetter = true): number {
  if (value == null) return 0.35;
  if (higherIsBetter) {
    if (value >= good) return 1;
    if (value >= ok) return 0.65;
    if (value > 0) return 0.3;
    return 0;
  }
  if (value <= good) return 1;
  if (value <= ok) return 0.65;
  return 0.15;
}
