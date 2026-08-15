import type { Stock } from "@/lib/market/types";
import { STRATEGY_MATCH_MIN, scoreStock, type StrategyId, type StrategyScore } from "@/lib/strategies";

export interface RangeFilter {
  min?: number;
  max?: number;
}

export interface ScreenerQuery {
  search: string;
  sector?: string;
  price: RangeFilter;
  dividendYield: RangeFilter;
  pe: RangeFilter;
  pb: RangeFilter;
  roe: RangeFilter;
  growth: RangeFilter;
  marketCap: RangeFilter;
  strategyId?: StrategyId;
}

export type SortKey =
  | "ticker"
  | "name"
  | "price"
  | "changePercent"
  | "dividendYield"
  | "pe"
  | "pb"
  | "roe"
  | "revenueGrowth5y"
  | "debtToEquity"
  | "marketCap"
  | "score";

export interface SortState {
  key: SortKey;
  direction: "asc" | "desc";
}

export interface ScoredStock {
  stock: Stock;
  score: StrategyScore | null;
}

export function emptyQuery(): ScreenerQuery {
  return {
    search: "",
    price: {},
    dividendYield: {},
    pe: {},
    pb: {},
    roe: {},
    growth: {},
    marketCap: {},
  };
}

export function inRange(value: number | null, range: RangeFilter): boolean {
  if (range.min == null && range.max == null) return true;
  if (value == null || !Number.isFinite(value)) return false;
  if (range.min != null && value < range.min) return false;
  if (range.max != null && value > range.max) return false;
  return true;
}

function matchesSearch(stock: Stock, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return stock.ticker.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q);
}

export function applyScreener(stocks: Stock[], query: ScreenerQuery): ScoredStock[] {
  const rows: ScoredStock[] = [];

  for (const stock of stocks) {
    if (!matchesSearch(stock, query.search)) continue;
    if (query.sector && stock.sector !== query.sector) continue;
    if (!inRange(stock.price, query.price)) continue;
    if (!inRange(stock.dividendYield, query.dividendYield)) continue;
    if (!inRange(stock.pe, query.pe)) continue;
    if (!inRange(stock.pb, query.pb)) continue;
    if (!inRange(stock.roe, query.roe)) continue;
    if (!inRange(stock.revenueGrowth5y, query.growth)) continue;
    if (!inRange(stock.marketCap, query.marketCap)) continue;

    const score = query.strategyId ? scoreStock(stock, query.strategyId) : null;
    if (query.strategyId && (!score || score.score < STRATEGY_MATCH_MIN)) continue;

    rows.push({ stock, score });
  }

  return rows;
}

function sortValue(row: ScoredStock, key: SortKey): number | string | null {
  if (key === "score") return row.score?.score ?? null;
  const value = row.stock[key];
  return value ?? null;
}

export function sortRows(rows: ScoredStock[], sort: SortState): ScoredStock[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = sortValue(a, sort.key);
    const bv = sortValue(b, sort.key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string" && typeof bv === "string") {
      const cmp = av.localeCompare(bv, "pt-BR");
      return sort.direction === "asc" ? cmp : -cmp;
    }
    const cmp = Number(av) - Number(bv);
    return sort.direction === "asc" ? cmp : -cmp;
  });
  return copy;
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = Math.max(0, (page - 1) * pageSize);
  return items.slice(start, start + pageSize);
}

export function uniqueSectors(stocks: Stock[]): string[] {
  return [...new Set(stocks.map((s) => s.sector).filter((s): s is string => !!s))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

export function hasActiveFilters(query: ScreenerQuery): boolean {
  if (query.search.trim()) return true;
  if (query.sector) return true;
  if (query.strategyId) return true;
  const ranges = [query.price, query.dividendYield, query.pe, query.pb, query.roe, query.growth, query.marketCap];
  return ranges.some((range) => range.min != null || range.max != null);
}
