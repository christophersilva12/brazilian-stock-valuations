import { describe, expect, it } from "vitest";
import { BUFFETT_PERPETUITY_RATE, calculateDCF, expectedGrowthRate } from "@/lib/valuation";

describe("expectedGrowthRate", () => {
  it("uses the sustainable growth formula (1 - payout) × ROE", () => {
    expect(expectedGrowthRate(30.01, 6)).toBeCloseTo(4.2, 2);
    expect(expectedGrowthRate(0, 10)).toBeCloseTo(10);
    expect(expectedGrowthRate(100, 15)).toBeCloseTo(0);
  });
});

describe("calculateDCF", () => {
  const base = {
    freeCashFlow: 100,
    growthRate: 10,
    discountRate: 20,
    projectionYears: 1,
    totalShares: 10,
    currentPrice: 50,
    safetyMargin: 25,
  };

  it("discounts the perpetuity at the same rate as projected years by default", () => {
    const classic = calculateDCF(base);
    const explicit = calculateDCF({ ...base, perpetuityDiscountRate: 20 });
    expect(classic.intrinsicValue).toBeCloseTo(explicit.intrinsicValue);
  });

  it("uses a 10% perpetuity discount in the Buffett method", () => {
    const classic = calculateDCF(base);
    const buffett = calculateDCF({ ...base, perpetuityDiscountRate: BUFFETT_PERPETUITY_RATE });
    expect(buffett.intrinsicValue).toBeGreaterThan(classic.intrinsicValue);
  });
});
