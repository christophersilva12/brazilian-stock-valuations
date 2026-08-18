import { describe, expect, it } from "vitest";
import { calculateGraham } from "@/lib/valuation";
import { buildWritePayload, recordToSnapshot } from "@/lib/valuations/payload";
import { canPublish, isValidTicker, normalizeTicker } from "@/lib/valuations/rules";
import type { FormSnapshot, ValuationRecord } from "@/lib/valuations/types";

const snapshot: FormSnapshot = {
  ticker: "petr4",
  company: "Petrobras",
  currentPrice: "35,50",
  safetyMargin: "25",
  activeMethod: "graham",
  lpa: "5,20",
  vpa: "28,00",
  currentDY: "",
  desiredDY: "6,00",
  fcf: "",
  payout: "",
  roe: "",
  growthRate: "",
  discountRate: "14,00",
  projectionYears: "3",
  totalShares: "",
  perpetuityMethod: "buffett",
  lynchLpa: "",
  lynchGrowth: "",
  lynchPL: "",
};

describe("publication rules", () => {
  it("normalizes and validates tickers", () => {
    expect(normalizeTicker(" petr4 ")).toBe("PETR4");
    expect(isValidTicker("PETR4")).toBe(true);
    expect(isValidTicker("N/A")).toBe(false);
  });

  it("blocks a fourth public valuation", () => {
    const existing = [
      { id: "1", ticker: "VALE3" },
      { id: "2", ticker: "BBAS3" },
      { id: "3", ticker: "ITUB4" },
    ];
    expect(canPublish({ existingPublic: existing, ticker: "PETR4" })).toEqual({
      ok: false,
      reason: "max_public",
    });
  });

  it("blocks a second public valuation for the same ticker", () => {
    const existing = [{ id: "1", ticker: "PETR4" }];
    expect(canPublish({ existingPublic: existing, ticker: "petr4" })).toEqual({
      ok: false,
      reason: "ticker_taken",
    });
  });

  it("allows updating the same public valuation", () => {
    const existing = [
      { id: "1", ticker: "PETR4" },
      { id: "2", ticker: "VALE3" },
    ];
    expect(canPublish({ existingPublic: existing, ticker: "PETR4", valuationId: "1" })).toEqual({
      ok: true,
    });
  });
});

describe("valuation payload", () => {
  it("builds a persistable payload from the current form", () => {
    const result = calculateGraham({
      lpa: 5.2,
      vpa: 28,
      currentPrice: 35.5,
      safetyMargin: 25,
    });
    const payload = buildWritePayload({ snapshot, result, isPublic: false });
    expect(payload.ticker).toBe("PETR4");
    expect(payload.method).toBe("graham");
    expect(payload.inputs.lpa).toBeCloseTo(5.2);
    expect(payload.result.signal).toBe(result.signal);
    expect(payload.premises.safetyMargin).toBe(25);
  });

  it("rejects an invalid ticker", () => {
    const result = calculateGraham({
      lpa: 5.2,
      vpa: 28,
      currentPrice: 35.5,
      safetyMargin: 25,
    });
    expect(() =>
      buildWritePayload({
        snapshot: { ...snapshot, ticker: "X" },
        result,
        isPublic: true,
      }),
    ).toThrow("invalid_ticker");
  });

  it("restores a saved record into form fields", () => {
    const result = calculateGraham({
      lpa: 5.2,
      vpa: 28,
      currentPrice: 35.5,
      safetyMargin: 25,
    });
    const payload = buildWritePayload({ snapshot, result, isPublic: false });
    const record: ValuationRecord = {
      id: "abc",
      userId: "user-1",
      ticker: payload.ticker,
      company: payload.company,
      method: payload.method,
      premises: payload.premises,
      metrics: payload.metrics,
      inputs: payload.inputs,
      result: payload.result,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const restored = recordToSnapshot(record);
    expect(restored.ticker).toBe("PETR4");
    expect(restored.activeMethod).toBe("graham");
    expect(restored.company).toBe("Petrobras");
  });
});
