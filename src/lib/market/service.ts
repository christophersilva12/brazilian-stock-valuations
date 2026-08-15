import { mergeStock, type Stock } from "./types";
import { listBrapiStocks } from "./providers/brapi";
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
