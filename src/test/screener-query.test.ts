import { describe, expect, it } from "vitest";
import type { Stock } from "@/lib/market/types";
import { applyScreener, emptyQuery, inRange, paginate, sortRows } from "@/lib/screener/query";

function stock(overrides: Partial<Stock> = {}): Stock {
  return {
    ticker: "PETR4",
    name: "Petrobras",
    sector: "Energy Minerals",
    subsector: null,
    price: 42,
    changePercent: 1,
    volume: 10,
    marketCap: 500e9,
    logo: null,
    pe: 4,
    pb: 1.1,
    psr: 1,
    dividendYield: 7,
    evEbitda: 3,
    evEbit: 4,
    grossMargin: 50,
    ebitMargin: 40,
    netMargin: 24,
    currentRatio: 0.9,
    roic: 19,
    roe: 27,
    equity: 400e9,
    debtToEquity: 0.6,
    revenueGrowth5y: 2,
    payoutRatio: 28,
    eps: 10,
    bookValue: 38,
    dividendYears: null,
    freeCashflow: null,
    sharesOutstanding: null,
    quoteSource: "brapi",
    fundamentalsSource: "fundamentus",
    ...overrides,
  };
}

describe("screener query", () => {
  it("filters by search, sector and ranges", () => {
    const rows = applyScreener(
      [
        stock(),
        stock({ ticker: "MGLU3", name: "Magazine Luiza", sector: "Retail Trade", pe: 36, dividendYield: 1, roe: 1 }),
      ],
      { ...emptyQuery(), search: "petr", sector: "Energy Minerals", pe: { max: 10 } },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].stock.ticker).toBe("PETR4");
  });

  it("keeps only strategy matches when a strategy is selected", () => {
    const rows = applyScreener(
      [stock(), stock({ ticker: "WEAK3", dividendYield: 0.2, pe: 80, roe: 1, netMargin: -5, payoutRatio: 2 })],
      { ...emptyQuery(), strategyId: "barsi" },
    );
    expect(rows.every((row) => (row.score?.score ?? 0) >= 50)).toBe(true);
    expect(rows.some((row) => row.stock.ticker === "PETR4")).toBe(true);
  });

  it("sorts nulls last and paginates", () => {
    const sorted = sortRows(
      [
        { stock: stock({ ticker: "A", pe: null }), score: null },
        { stock: stock({ ticker: "B", pe: 5 }), score: null },
        { stock: stock({ ticker: "C", pe: 12 }), score: null },
      ],
      { key: "pe", direction: "asc" },
    );
    expect(sorted.map((row) => row.stock.ticker)).toEqual(["B", "C", "A"]);
    expect(paginate(sorted, 2, 2)).toHaveLength(1);
  });

  it("rejects missing values when a range is set", () => {
    expect(inRange(null, { min: 1 })).toBe(false);
    expect(inRange(8, { min: 4, max: 10 })).toBe(true);
  });
});
