export type QuoteSource = "brapi";
export type FundamentalsSource = "fundamentus" | "brapi";

export interface Stock {
  ticker: string;
  name: string;
  sector: string | null;
  subsector: string | null;
  price: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  logo: string | null;
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
  payoutRatio: number | null;
  eps: number | null;
  bookValue: number | null;
  dividendYears: number | null;
  quoteSource: QuoteSource;
  fundamentalsSource: FundamentalsSource | null;
}

export interface StockFundamentals {
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

export interface ListingStock {
  ticker: string;
  name: string;
  sector: string | null;
  subsector: string | null;
  price: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  logo: string | null;
}

export const FINANCIAL_SECTORS = new Set(["Finance"]);

/** B3 odd-lot market: PETR4F, VALE3F, TAEE11F. */
export function isFractionalTicker(ticker: string): boolean {
  return /^[A-Z]{4}\d{1,2}F$/.test(ticker.trim().toUpperCase());
}

export function isFinancialSector(sector: string | null | undefined): boolean {
  return !!sector && FINANCIAL_SECTORS.has(sector);
}

export function computePayoutRatio(dividendYield: number | null, pe: number | null): number | null {
  if (dividendYield == null || pe == null || pe <= 0) return null;
  return (dividendYield * pe) / 100;
}

export function derivePerShare(price: number | null, multiple: number | null): number | null {
  if (price == null || multiple == null || multiple <= 0) return null;
  return price / multiple;
}

export function mergeStock(listing: ListingStock, fundamentals?: StockFundamentals | null): Stock {
  const pe = fundamentals?.pe ?? null;
  const pb = fundamentals?.pb ?? null;
  const dy = fundamentals?.dividendYield ?? null;
  const price = listing.price ?? fundamentals?.price ?? null;

  return {
    ticker: listing.ticker,
    name: listing.name,
    sector: listing.sector,
    subsector: listing.subsector,
    price,
    changePercent: listing.changePercent,
    volume: listing.volume,
    marketCap: listing.marketCap,
    logo: listing.logo,
    pe,
    pb,
    psr: fundamentals?.psr ?? null,
    dividendYield: dy,
    evEbitda: fundamentals?.evEbitda ?? null,
    evEbit: fundamentals?.evEbit ?? null,
    grossMargin: fundamentals?.grossMargin ?? null,
    ebitMargin: fundamentals?.ebitMargin ?? null,
    netMargin: fundamentals?.netMargin ?? null,
    currentRatio: fundamentals?.currentRatio ?? null,
    roic: fundamentals?.roic ?? null,
    roe: fundamentals?.roe ?? null,
    equity: fundamentals?.equity ?? null,
    debtToEquity: fundamentals?.debtToEquity ?? null,
    revenueGrowth5y: fundamentals?.revenueGrowth5y ?? null,
    payoutRatio: computePayoutRatio(dy, pe),
    eps: derivePerShare(price, pe),
    bookValue: derivePerShare(price, pb),
    dividendYears: null,
    quoteSource: "brapi",
    fundamentalsSource: fundamentals ? "fundamentus" : null,
  };
}
