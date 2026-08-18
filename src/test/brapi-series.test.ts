import { describe, expect, it } from "vitest";
import { mapCashDividends, mapHistoricalPrices, mapQuoteDetails, ratioToPercent } from "@/lib/market/providers/brapi";
import { formatDate } from "@/lib/market/format";

describe("mapHistoricalPrices", () => {
  it("keeps valid closes, prefers adjusted close and sorts by date", () => {
    const points = mapHistoricalPrices([
      { date: 200, close: 41, adjustedClose: 40.5, open: 40, high: 42, low: 39, volume: 10 },
      { date: 100, close: 38, open: 37, high: 39, low: 36, volume: 8 },
      { date: 300, close: null },
    ]);

    expect(points).toHaveLength(2);
    expect(points[0].date).toBe(100);
    expect(points[0].close).toBe(38);
    expect(points[1].close).toBe(40.5);
  });
});

describe("mapCashDividends", () => {
  it("maps payment, ex-date and cash amount", () => {
    const rows = mapCashDividends([
      {
        paymentDate: "2026-10-01T03:00:00.000Z",
        lastDatePrior: "2026-08-31T03:00:00.000Z",
        rate: 0.024242,
        label: "JCP",
        relatedTo: "2T26",
      },
      { rate: Number.NaN },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("JCP");
    expect(rows[0].rate).toBeCloseTo(0.024242);
    expect(formatDate(rows[0].paymentDate, "pt")).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe("ratioToPercent", () => {
  it("converts decimal ratios and keeps values already in percent", () => {
    expect(ratioToPercent(0.2781079)).toBeCloseTo(27.81079);
    expect(ratioToPercent(0.06)).toBeCloseTo(6);
    expect(ratioToPercent(27.81)).toBeCloseTo(27.81);
    expect(ratioToPercent(null)).toBeNull();
  });
});

describe("mapQuoteDetails", () => {
  it("reads ROE, payout, FCF and share counts from brapi modules", () => {
    const details = mapQuoteDetails({
      regularMarketPrice: 42.09,
      marketCap: 570_317_536_822,
      priceEarnings: 4.067,
      defaultKeyStatistics: {
        sharesOutstanding: 12_888_733_000,
        marketCap: 542_486_760_000,
        trailingPE: 4.5253973,
        dividendYield: 0.06,
      },
      financialData: {
        returnOnEquity: 0.2781079,
        freeCashflow: 85_795_000_000,
      },
    });

    expect(details).not.toBeNull();
    expect(details?.roe).toBeCloseTo(27.81079);
    expect(details?.payoutRatio).toBeCloseTo(27.15, 1);
    expect(details?.freeCashflow).toBe(85_795_000_000);
    expect(details?.sharesOutstanding).toBe(12_888_733_000);
  });
});
