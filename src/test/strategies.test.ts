import { describe, expect, it } from "vitest";
import type { Stock } from "@/lib/market/types";
import { barsiStrategy } from "@/lib/strategies/barsi";
import { grahamStrategy } from "@/lib/strategies/graham";
import { dividendsStrategy } from "@/lib/strategies/dividends";
import { qualityStrategy } from "@/lib/strategies/quality";

function stock(overrides: Partial<Stock> = {}): Stock {
  return {
    ticker: "TEST3",
    name: "Teste",
    sector: "Utilities",
    subsector: null,
    price: 20,
    changePercent: 1,
    volume: 1_000_000,
    marketCap: 20e9,
    logo: null,
    pe: 8,
    pb: 1.1,
    psr: 1,
    dividendYield: 8,
    evEbitda: 6,
    evEbit: 7,
    grossMargin: 40,
    ebitMargin: 25,
    netMargin: 18,
    currentRatio: 1.8,
    roic: 16,
    roe: 20,
    equity: 10e9,
    debtToEquity: 0.4,
    revenueGrowth5y: 12,
    payoutRatio: 64,
    eps: 2.5,
    bookValue: 18,
    dividendYears: 10,
    freeCashflow: null,
    sharesOutstanding: null,
    quoteSource: "brapi",
    fundamentalsSource: "fundamentus",
    ...overrides,
  };
}

describe("strategies", () => {
  it("scores a Barsi-like utility highly", () => {
    const result = barsiStrategy.score(stock());
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.level).toBe("high");
    expect(result.reasons.some((r) => r.key === "strategy.reason.dyStrong")).toBe(true);
  });

  it("scores a Graham-like cheap stock highly", () => {
    const result = grahamStrategy.score(stock({ pe: 10, pb: 1.2, debtToEquity: 0.5 }));
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.reasons.some((r) => r.key === "strategy.reason.grahamProduct")).toBe(true);
  });

  it("penalizes a growth stock on the dividend strategy", () => {
    const result = dividendsStrategy.score(
      stock({
        dividendYield: 0.4,
        payoutRatio: 4,
        pe: 38,
        roe: 6,
        netMargin: 3,
        revenueGrowth5y: 28,
        dividendYears: null,
      }),
    );
    expect(result.score).toBeLessThan(50);
  });

  it("rewards consistent ROE, margins and growth on quality", () => {
    const result = qualityStrategy.score(stock());
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.reasons.some((r) => r.key === "strategy.reason.growthStrong")).toBe(true);
  });

  it("returns no-fundamentals when data is missing", () => {
    const result = grahamStrategy.score(stock({ fundamentalsSource: null, pe: null, pb: null, roe: null }));
    expect(result.score).toBe(0);
    expect(result.reasons[0]?.key).toBe("strategy.reason.noFundamentals");
  });
});
