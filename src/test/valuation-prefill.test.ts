import { describe, expect, it } from "vitest";
import { stockToValuationPrefill } from "@/lib/market/prefill";
import type { Stock } from "@/lib/market/types";

function stock(overrides: Partial<Stock> = {}): Stock {
  return {
    ticker: "PETR4",
    name: "Petrobras",
    sector: "Energy Minerals",
    subsector: null,
    price: 42.09,
    changePercent: 0.45,
    volume: 1,
    marketCap: 570_317_536_822,
    logo: null,
    pe: 4.07,
    pb: 1.13,
    psr: 0.99,
    dividendYield: 7.05,
    evEbitda: 2.66,
    evEbit: 3.65,
    grossMargin: 50.6,
    ebitMargin: 42.76,
    netMargin: 24.39,
    currentRatio: 0.85,
    roic: 19.69,
    roe: 27.73,
    equity: 480e9,
    debtToEquity: 0.65,
    revenueGrowth5y: -2.33,
    payoutRatio: 28.7,
    eps: 10.34,
    bookValue: 37.25,
    dividendYears: null,
    quoteSource: "brapi",
    fundamentalsSource: "fundamentus",
    ...overrides,
  };
}

describe("stockToValuationPrefill", () => {
  it("fills company, price and method inputs from the screener stock", () => {
    const prefill = stockToValuationPrefill(stock());

    expect(prefill.ticker).toBe("PETR4");
    expect(prefill.company).toBe("Petrobras");
    expect(prefill.currentPrice).toBe("42,09");
    expect(prefill.lpa).toBe("10,34");
    expect(prefill.vpa).toBe("37,25");
    expect(prefill.currentDY).toBe("7,05");
    expect(prefill.lynchPL).toBe("4,07");
    expect(prefill.lynchGrowth).toBe("-2,33");
    expect(prefill.totalShares).toMatch(/13\.549\./);
  });

  it("leaves unknown fields empty", () => {
    const prefill = stockToValuationPrefill(
      stock({ price: null, eps: null, bookValue: null, dividendYield: null, marketCap: null }),
    );
    expect(prefill.currentPrice).toBe("");
    expect(prefill.lpa).toBe("");
    expect(prefill.totalShares).toBe("");
  });
});
