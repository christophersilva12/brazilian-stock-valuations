import { formatNumberToBRL } from "@/lib/currency";
import type { Stock } from "./types";

export interface ValuationPrefill {
  ticker: string;
  company: string;
  currentPrice: string;
  lpa: string;
  vpa: string;
  currentDY: string;
  lynchLpa: string;
  lynchGrowth: string;
  lynchPL: string;
  totalShares: string;
  payoutRatio: string;
  roe: string;
  freeCashflow: string;
}

function money(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "" : formatNumberToBRL(value);
}

export function formatShareCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "";
  return formatNumberToBRL(Math.round(value)).replace(/,00$/, "");
}

export function stockToValuationPrefill(stock: Stock): ValuationPrefill {
  const shares =
    stock.sharesOutstanding ??
    (stock.marketCap != null && stock.price != null && stock.price > 0
      ? stock.marketCap / stock.price
      : null);

  return {
    ticker: stock.ticker,
    company: stock.name,
    currentPrice: money(stock.price),
    lpa: money(stock.eps),
    vpa: money(stock.bookValue),
    currentDY: money(stock.dividendYield),
    lynchLpa: money(stock.eps),
    lynchGrowth: money(stock.revenueGrowth5y),
    lynchPL: money(stock.pe),
    totalShares: formatShareCount(shares),
    payoutRatio: money(stock.payoutRatio),
    roe: money(stock.roe),
    freeCashflow: money(stock.freeCashflow),
  };
}

export function valuationState(stock: Stock) {
  return { stock };
}
