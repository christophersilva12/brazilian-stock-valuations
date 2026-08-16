import { describe, expect, it } from "vitest";
import { mapCashDividends, mapHistoricalPrices } from "@/lib/market/providers/brapi";
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
