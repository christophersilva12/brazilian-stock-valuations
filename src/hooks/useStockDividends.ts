import { useQuery } from "@tanstack/react-query";
import { fetchStockDividends } from "@/lib/market";

export function useStockDividends(ticker: string) {
  const symbol = ticker.trim().toUpperCase();

  return useQuery({
    queryKey: ["stock-dividends", symbol],
    queryFn: () => fetchStockDividends(symbol),
    enabled: symbol.length >= 5,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
