import { computePayoutRatio, isFractionalTicker, type ListingStock, type QuoteDetails } from "../types";

const BRAPI_BASE = "https://brapi.dev/api";
const PAGE_SIZE = 100;

export function getBrapiKey(): string | undefined {
  const key = import.meta.env.VITE_BRAPI_KEY?.trim();
  return key || undefined;
}

function brapiUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${BRAPI_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const token = getBrapiKey();
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

function brapiHeaders(): HeadersInit {
  const token = getBrapiKey();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface BrapiListItem {
  stock: string;
  name: string;
  close?: number | null;
  change?: number | null;
  volume?: number | null;
  market_cap?: number | null;
  logo?: string | null;
  sector?: string | null;
  subsector?: string | null;
  type?: string | null;
}

interface BrapiListResponse {
  stocks?: BrapiListItem[];
  currentPage?: number;
  totalPages?: number;
  error?: boolean;
  message?: string;
}

function mapListing(item: BrapiListItem): ListingStock {
  return {
    ticker: item.stock,
    name: item.name,
    sector: item.sector ?? null,
    subsector: item.subsector ?? null,
    price: Number.isFinite(item.close) ? Number(item.close) : null,
    changePercent: Number.isFinite(item.change) ? Number(item.change) : null,
    volume: Number.isFinite(item.volume) ? Number(item.volume) : null,
    marketCap: Number.isFinite(item.market_cap) ? Number(item.market_cap) : null,
    logo: item.logo ?? null,
  };
}

async function fetchListPage(page: number): Promise<BrapiListResponse> {
  const url = brapiUrl("/quote/list", {
    type: "stock",
    limit: String(PAGE_SIZE),
    page: String(page),
  });
  const res = await fetch(url, { headers: brapiHeaders() });
  if (!res.ok) {
    throw new Error(`brapi list failed (${res.status})`);
  }
  return res.json();
}

export async function listBrapiStocks(): Promise<ListingStock[]> {
  const first = await fetchListPage(1);
  if (first.error) {
    throw new Error(first.message || "brapi list error");
  }

  const totalPages = Math.max(1, first.totalPages ?? 1);
  const pages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetchListPage(i + 2)),
  );

  const seen = new Set<string>();
  const stocks: ListingStock[] = [];

  for (const page of [first, ...pages]) {
    for (const item of page.stocks ?? []) {
      if (!item.stock || seen.has(item.stock) || isFractionalTicker(item.stock)) continue;
      seen.add(item.stock);
      stocks.push(mapListing(item));
    }
  }

  return stocks;
}

export async function searchBrapiStock(ticker: string): Promise<ListingStock | null> {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) return null;

  const url = brapiUrl("/quote/list", { search: symbol, limit: "20" });
  const res = await fetch(url, { headers: brapiHeaders() });
  if (!res.ok) {
    throw new Error(`brapi search failed (${res.status})`);
  }

  const data = (await res.json()) as BrapiListResponse;
  const match = (data.stocks ?? []).find((item) => item.stock.toUpperCase() === symbol);
  return match ? mapListing(match) : null;
}

export type HistoryRange = "3mo" | "1mo" | "5d" | "1d";

export interface PricePoint {
  date: number;
  close: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
}

export interface CashDividend {
  paymentDate: string | null;
  exDate: string | null;
  rate: number;
  label: string;
  relatedTo: string;
}

interface BrapiHistoricalPrice {
  date?: number;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  adjustedClose?: number | null;
  volume?: number | null;
}

interface BrapiCashDividend {
  paymentDate?: string | null;
  lastDatePrior?: string | null;
  rate?: number;
  label?: string;
  relatedTo?: string;
}

export function mapHistoricalPrices(rows: BrapiHistoricalPrice[] | undefined): PricePoint[] {
  return (rows ?? [])
    .map((row) => {
      const close = row.adjustedClose ?? row.close;
      if (row.date == null || close == null || !Number.isFinite(close)) return null;
      return {
        date: row.date,
        close,
        open: row.open ?? null,
        high: row.high ?? null,
        low: row.low ?? null,
        volume: row.volume ?? null,
      };
    })
    .filter((row): row is PricePoint => row != null)
    .sort((a, b) => a.date - b.date);
}

export function mapCashDividends(rows: BrapiCashDividend[] | undefined): CashDividend[] {
  return (rows ?? [])
    .filter((row) => row.rate != null && Number.isFinite(row.rate))
    .map((row) => ({
      paymentDate: row.paymentDate ?? null,
      exDate: row.lastDatePrior ?? null,
      rate: Number(row.rate),
      label: row.label || "DIVIDENDO",
      relatedTo: row.relatedTo ?? "",
    }));
}

export async function fetchStockHistory(ticker: string, range: HistoryRange = "3mo"): Promise<PricePoint[]> {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) return [];

  const url = brapiUrl("/v2/stocks/historical", {
    symbols: symbol,
    range,
    interval: "1d",
    sortOrder: "asc",
  });
  const res = await fetch(url, { headers: brapiHeaders() });
  if (!res.ok) {
    throw new Error(`brapi history failed (${res.status})`);
  }

  const data = (await res.json()) as {
    results?: Array<{ data?: { historicalDataPrice?: BrapiHistoricalPrice[] } }>;
    error?: boolean;
    message?: string;
  };
  if (data.error) {
    throw new Error(data.message || "brapi history error");
  }

  return mapHistoricalPrices(data.results?.[0]?.data?.historicalDataPrice);
}

export async function fetchStockDividends(ticker: string): Promise<CashDividend[]> {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) return [];

  const url = brapiUrl("/v2/stocks/dividends", {
    symbols: symbol,
    sortBy: "paymentDate",
    sortOrder: "desc",
  });
  const res = await fetch(url, { headers: brapiHeaders() });
  if (!res.ok) {
    throw new Error(`brapi dividends failed (${res.status})`);
  }

  const data = (await res.json()) as {
    results?: Array<{ data?: { cashDividends?: BrapiCashDividend[] } }>;
    error?: boolean;
    message?: string;
  };
  if (data.error) {
    throw new Error(data.message || "brapi dividends error");
  }

  return mapCashDividends(data.results?.[0]?.data?.cashDividends);
}

interface BrapiKeyStatistics {
  sharesOutstanding?: number | null;
  marketCap?: number | null;
  trailingPE?: number | null;
  dividendYield?: number | null;
  yield?: number | null;
}

interface BrapiFinancialData {
  returnOnEquity?: number | null;
  freeCashflow?: number | null;
}

interface BrapiQuoteResult {
  regularMarketPrice?: number | null;
  marketCap?: number | null;
  priceEarnings?: number | null;
  defaultKeyStatistics?: BrapiKeyStatistics | null;
  financialData?: BrapiFinancialData | null;
}

function finiteNumber(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

/** Converts a decimal ratio (0.18) to percent (18). Leaves values already in percent unchanged. */
export function ratioToPercent(value: number | null | undefined): number | null {
  const n = finiteNumber(value);
  if (n == null) return null;
  return Math.abs(n) <= 1 ? n * 100 : n;
}

export function mapQuoteDetails(quote: BrapiQuoteResult | null | undefined): QuoteDetails | null {
  if (!quote) return null;

  const stats = quote.defaultKeyStatistics ?? {};
  const financials = quote.financialData ?? {};
  const price = finiteNumber(quote.regularMarketPrice);
  const marketCap = finiteNumber(quote.marketCap) ?? finiteNumber(stats.marketCap);
  const outstanding = finiteNumber(stats.sharesOutstanding);
  const fromMarketCap = price != null && price > 0 && marketCap != null ? marketCap / price : null;

  const dy = ratioToPercent(stats.dividendYield ?? stats.yield);
  const pe = finiteNumber(stats.trailingPE) ?? finiteNumber(quote.priceEarnings);

  return {
    roe: ratioToPercent(financials.returnOnEquity),
    payoutRatio: computePayoutRatio(dy, pe),
    freeCashflow: finiteNumber(financials.freeCashflow),
    sharesOutstanding: outstanding ?? fromMarketCap,
  };
}

export async function fetchQuoteDetails(ticker: string): Promise<QuoteDetails | null> {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) return null;

  const url = brapiUrl(`/quote/${encodeURIComponent(symbol)}`, {
    modules: "defaultKeyStatistics,financialData",
  });
  const res = await fetch(url, { headers: brapiHeaders() });
  if (!res.ok) {
    throw new Error(`brapi quote details failed (${res.status})`);
  }

  const data = (await res.json()) as {
    results?: BrapiQuoteResult[];
    error?: boolean;
    message?: string;
  };
  if (data.error) {
    throw new Error(data.message || "brapi quote details error");
  }

  return mapQuoteDetails(data.results?.[0]);
}
