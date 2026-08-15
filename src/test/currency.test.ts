import { describe, it, expect } from "vitest";
import {
  countDigitsBefore,
  formatBRLInput,
  formatNumberToBRL,
  mapDigitCursor,
  parseBRL,
} from "@/lib/currency";

describe("formatBRLInput", () => {
  it("returns empty for empty input", () => {
    expect(formatBRLInput("")).toBe("");
  });

  it("adds thousand separators while typing", () => {
    expect(formatBRLInput("1")).toBe("1");
    expect(formatBRLInput("12")).toBe("12");
    expect(formatBRLInput("123")).toBe("123");
    expect(formatBRLInput("1234")).toBe("1.234");
    expect(formatBRLInput("1234567")).toBe("1.234.567");
  });

  it("keeps comma decimals with at most 2 digits", () => {
    expect(formatBRLInput("1234,")).toBe("1.234,");
    expect(formatBRLInput("1234,5")).toBe("1.234,5");
    expect(formatBRLInput("1234,56")).toBe("1.234,56");
    expect(formatBRLInput("1234,567")).toBe("1.234,56");
  });

  it("treats a single dot with up to 2 decimals as decimal separator", () => {
    expect(formatBRLInput("32.")).toBe("32,");
    expect(formatBRLInput("32.5")).toBe("32,5");
    expect(formatBRLInput("32.50")).toBe("32,50");
  });

  it("treats multiple dots as thousand separators", () => {
    expect(formatBRLInput("1.234.567")).toBe("1.234.567");
  });

  it("is idempotent for already formatted values", () => {
    expect(formatBRLInput("1.234,56")).toBe("1.234,56");
    expect(formatBRLInput("32,50")).toBe("32,50");
  });

  it("supports negative values", () => {
    expect(formatBRLInput("-1234,5")).toBe("-1.234,5");
  });

  it("strips leading zeros", () => {
    expect(formatBRLInput("0001234")).toBe("1.234");
  });
});

describe("parseBRL", () => {
  it("parses Brazilian formatted values", () => {
    expect(parseBRL("1.234,56")).toBe(1234.56);
    expect(parseBRL("32,50")).toBe(32.5);
    expect(parseBRL("1.000.000")).toBe(1000000);
  });

  it("parses US-style decimals", () => {
    expect(parseBRL("32.5")).toBe(32.5);
    expect(parseBRL("32.50")).toBe(32.5);
  });

  it("returns NaN for empty values", () => {
    expect(parseBRL("")).toBeNaN();
    expect(parseBRL("   ")).toBeNaN();
  });
});

describe("formatNumberToBRL", () => {
  it("formats numbers with two decimal places", () => {
    expect(formatNumberToBRL(32.5)).toBe("32,50");
    expect(formatNumberToBRL(1234.5)).toBe("1.234,50");
    expect(formatNumberToBRL(1000000000)).toBe("1.000.000.000,00");
  });

  it("returns empty for non-finite numbers", () => {
    expect(formatNumberToBRL(NaN)).toBe("");
  });
});

describe("cursor helpers", () => {
  it("counts digits before the caret", () => {
    expect(countDigitsBefore("1.234,56", 3)).toBe(2);
  });

  it("maps digit count back to caret index", () => {
    expect(mapDigitCursor("1.234,56", 4)).toBe(5);
    expect(mapDigitCursor("1.234,56", 6)).toBe(8);
  });
});
