import type { StockFundamentals } from "../types";

interface RawFundamentusRow {
  ticker: string;
  pe: number | null;
  pb: number | null;
  psr: number | null;
  dividendYield: number | null;
  evEbitda: number | null;
  evEbit: number | null;
  grossMargin: number | null;
  ebitMargin: number | null;
  netMargin: number | null;
  currentRatio: number | null;
  roic: number | null;
  roe: number | null;
  equity: number | null;
  debtToEquity: number | null;
  revenueGrowth5y: number | null;
  price: number | null;
}

export function mapFundamentusRow(row: RawFundamentusRow): StockFundamentals {
  return { ...row };
}

export async function loadFundamentusFundamentals(): Promise<StockFundamentals[]> {
  const urls = ["/api/market/fundamentals", "/market/fundamentals.json"];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as RawFundamentusRow[];
      if (!Array.isArray(data)) continue;
      return data.map(mapFundamentusRow);
    } catch {
      // try next source
    }
  }

  return [];
}

