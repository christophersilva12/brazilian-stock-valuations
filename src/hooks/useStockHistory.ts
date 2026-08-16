import { useQuery } from "@tanstack/react-query";
import { fetchStockHistory, type HistoryRange } from "@/lib/market";

export function useStockHistory(ticker: string, range: HistoryRange = "1y") {
  const symbol = ticker.trim().toUpperCase();

  return useQuery({
    queryKey: ["stock-history", symbol, range],
    queryFn: () => fetchStockHistory(symbol, range),
    enabled: symbol.length >= 5,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
