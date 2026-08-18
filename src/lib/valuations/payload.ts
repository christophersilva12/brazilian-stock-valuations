import { formatNumberToBRL, parseBRL } from "@/lib/currency";
import { BUFFETT_PERPETUITY_RATE, type ValuationResult } from "@/lib/valuation";
import type { DcfPerpetuityMethod } from "@/lib/dcf-settings";
import type { ValuationMethod } from "@/lib/supabase/types";
import type { FormSnapshot, ValuationInputs, ValuationPremises, ValuationRecord, ValuationWritePayload } from "./types";
import { isValidTicker, normalizeTicker } from "./rules";

function num(value: string): number {
  return parseBRL(value);
}

function optionalNum(value: string): number | undefined {
  const parsed = parseBRL(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asString(value: number | undefined, fallback = ""): string {
  if (value == null || !Number.isFinite(value)) return fallback;
  return formatNumberToBRL(value);
}

function asIntString(value: number | undefined, fallback = ""): string {
  if (value == null || !Number.isFinite(value)) return fallback;
  return String(Math.round(value));
}

export function buildWritePayload(params: {
  snapshot: FormSnapshot;
  result: ValuationResult;
  isPublic: boolean;
}): ValuationWritePayload {
  const ticker = normalizeTicker(params.snapshot.ticker);
  if (!isValidTicker(ticker)) {
    throw new Error("invalid_ticker");
  }

  const currentPrice = num(params.snapshot.currentPrice);
  const safetyMargin = num(params.snapshot.safetyMargin);
  if (!Number.isFinite(currentPrice) || !Number.isFinite(safetyMargin)) {
    throw new Error("invalid_inputs");
  }

  const method = params.snapshot.activeMethod;
  const premises = buildPremises(params.snapshot, method, safetyMargin);
  const inputs = buildInputs(params.snapshot, method, currentPrice, safetyMargin);

  return {
    ticker,
    company: params.snapshot.company.trim() || null,
    method,
    premises,
    metrics: {
      company: params.snapshot.company.trim() || undefined,
      currentPrice,
      intrinsicValue: params.result.intrinsicValue,
      ceilingPrice: params.result.ceilingPrice,
      safetyMarginPercent: params.result.safetyMarginPercent,
      upsidePercent: params.result.upsidePercent,
      signal: params.result.signal,
    },
    inputs,
    result: params.result,
    isPublic: params.isPublic,
  };
}

function buildPremises(
  snapshot: FormSnapshot,
  method: ValuationMethod,
  safetyMargin: number,
): ValuationPremises {
  if (method === "dcf") {
    return {
      safetyMargin,
      payout: optionalNum(snapshot.payout),
      roe: optionalNum(snapshot.roe),
      growthRate: optionalNum(snapshot.growthRate),
      discountRate: optionalNum(snapshot.discountRate),
      projectionYears: optionalNum(snapshot.projectionYears),
      perpetuityMethod: snapshot.perpetuityMethod,
    };
  }
  if (method === "barsi") {
    return {
      safetyMargin,
      desiredDY: optionalNum(snapshot.desiredDY),
    };
  }
  if (method === "lynch") {
    return {
      safetyMargin,
      growthRate: optionalNum(snapshot.lynchGrowth),
    };
  }
  return { safetyMargin };
}

function buildInputs(
  snapshot: FormSnapshot,
  method: ValuationMethod,
  currentPrice: number,
  safetyMargin: number,
): ValuationInputs {
  const base: ValuationInputs = { currentPrice, safetyMargin };

  if (method === "graham") {
    return { ...base, lpa: num(snapshot.lpa), vpa: num(snapshot.vpa) };
  }
  if (method === "barsi") {
    return { ...base, currentDY: num(snapshot.currentDY), desiredDY: num(snapshot.desiredDY) };
  }
  if (method === "dcf") {
    const discountRate = num(snapshot.discountRate);
    return {
      ...base,
      freeCashFlow: num(snapshot.fcf),
      growthRate: num(snapshot.growthRate),
      discountRate,
      projectionYears: num(snapshot.projectionYears),
      totalShares: num(snapshot.totalShares),
      perpetuityDiscountRate:
        snapshot.perpetuityMethod === "buffett" ? BUFFETT_PERPETUITY_RATE : discountRate,
    };
  }
  return {
    ...base,
    lynchLpa: num(snapshot.lynchLpa),
    lynchGrowth: num(snapshot.lynchGrowth),
    lynchPL: optionalNum(snapshot.lynchPL),
  };
}

export function recordToSnapshot(record: ValuationRecord): FormSnapshot {
  const inputs = record.inputs;
  const premises = record.premises;
  const perpetuityMethod: DcfPerpetuityMethod =
    premises.perpetuityMethod === "classic" ? "classic" : "buffett";

  return {
    ticker: record.ticker,
    company: record.company ?? record.metrics.company ?? "",
    currentPrice: asString(inputs.currentPrice),
    safetyMargin: asString(inputs.safetyMargin ?? premises.safetyMargin, "25,00"),
    activeMethod: record.method,
    lpa: asString(inputs.lpa),
    vpa: asString(inputs.vpa),
    currentDY: asString(inputs.currentDY),
    desiredDY: asString(inputs.desiredDY ?? premises.desiredDY, "6,00"),
    fcf: asString(inputs.freeCashFlow),
    payout: asString(premises.payout),
    roe: asString(premises.roe),
    growthRate: asString(inputs.growthRate ?? premises.growthRate),
    discountRate: asString(inputs.discountRate ?? premises.discountRate, "14,00"),
    projectionYears: asIntString(inputs.projectionYears ?? premises.projectionYears, "3"),
    totalShares: asString(inputs.totalShares),
    perpetuityMethod,
    lynchLpa: asString(inputs.lynchLpa),
    lynchGrowth: asString(inputs.lynchGrowth ?? premises.growthRate),
    lynchPL: asString(inputs.lynchPL),
  };
}
