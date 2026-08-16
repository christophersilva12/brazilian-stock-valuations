import { useQuery } from "@tanstack/react-query";
import { loadScreenerStocks } from "@/lib/market";

export function useStockScreener() {
  return useQuery({
    queryKey: ["screener-stocks"],
    queryFn: loadScreenerStocks,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
