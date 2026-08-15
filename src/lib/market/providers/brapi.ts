import type { ListingStock } from "../types";

const BRAPI_BASE = "https://brapi.dev/api";
const PAGE_SIZE = 100;

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
  const url = `${BRAPI_BASE}/quote/list?type=stock&limit=${PAGE_SIZE}&page=${page}`;
  const res = await fetch(url);
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
      if (!item.stock || seen.has(item.stock)) continue;
      seen.add(item.stock);
      stocks.push(mapListing(item));
    }
  }

  return stocks;
}
