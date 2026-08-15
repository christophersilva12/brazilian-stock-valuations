import { mergeStock, type ListingStock, type Stock } from "./types";
import { listBrapiStocks, searchBrapiStock } from "./providers/brapi";
import { loadFundamentusFundamentals } from "./providers/fundamentus";

export async function loadScreenerStocks(): Promise<Stock[]> {
  const [listed, fundamentals] = await Promise.all([
    listBrapiStocks(),
    loadFundamentusFundamentals().catch(() => []),
  ]);

  const fundMap = new Map(fundamentals.map((item) => [item.ticker, item]));

  return listed
    .filter((item) => item.price != null && item.price > 0)
    .map((item) => mergeStock(item, fundMap.get(item.ticker)));
}

export async function lookupStock(ticker: string): Promise<Stock | null> {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) return null;

  const [listing, fundamentals] = await Promise.all([
    searchBrapiStock(symbol).catch(() => null),
    loadFundamentusFundamentals().catch(() => []),
  ]);

  const fund = fundamentals.find((item) => item.ticker === symbol);
  if (!listing && !fund) return null;

  const fallback: ListingStock = {
    ticker: symbol,
    name: listing?.name ?? symbol,
    sector: listing?.sector ?? null,
    subsector: listing?.subsector ?? null,
    price: listing?.price ?? fund?.price ?? null,
    changePercent: listing?.changePercent ?? null,
    volume: listing?.volume ?? null,
    marketCap: listing?.marketCap ?? null,
    logo: listing?.logo ?? null,
  };

  return mergeStock(listing ?? fallback, fund);
}
