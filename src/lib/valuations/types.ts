import type { ValuationMethod, ValuationSignal } from "@/lib/supabase/types";
import type { DcfPerpetuityMethod } from "@/lib/dcf-settings";
import type { ValuationResult } from "@/lib/valuation";

export const MAX_PUBLIC_VALUATIONS = 3;
export const TICKER_PATTERN = /^[A-Z0-9]{4,8}$/;

export interface ValuationPremises {
  safetyMargin?: number;
  payout?: number;
  roe?: number;
  growthRate?: number;
  discountRate?: number;
  projectionYears?: number;
  perpetuityMethod?: DcfPerpetuityMethod;
  desiredDY?: number;
}

export interface ValuationMetrics {
  company?: string;
  currentPrice?: number;
  intrinsicValue?: number;
  ceilingPrice?: number;
  safetyMarginPercent?: number;
  upsidePercent?: number;
  signal?: ValuationSignal;
}

export interface ValuationInputs {
  currentPrice: number;
  safetyMargin: number;
  lpa?: number;
  vpa?: number;
  currentDY?: number;
  desiredDY?: number;
  freeCashFlow?: number;
  growthRate?: number;
  discountRate?: number;
  projectionYears?: number;
  totalShares?: number;
  perpetuityDiscountRate?: number;
  lynchLpa?: number;
  lynchGrowth?: number;
  lynchPL?: number;
}

export interface ValuationRecord {
  id: string;
  userId: string;
  ticker: string;
  company: string | null;
  method: ValuationMethod;
  premises: ValuationPremises;
  metrics: ValuationMetrics;
  inputs: ValuationInputs;
  result: ValuationResult;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface ValuationWritePayload {
  ticker: string;
  company: string | null;
  method: ValuationMethod;
  premises: ValuationPremises;
  metrics: ValuationMetrics;
  inputs: ValuationInputs;
  result: ValuationResult;
  isPublic: boolean;
}

export interface FormSnapshot {
  ticker: string;
  company: string;
  currentPrice: string;
  safetyMargin: string;
  activeMethod: ValuationMethod;
  lpa: string;
  vpa: string;
  currentDY: string;
  desiredDY: string;
  fcf: string;
  payout: string;
  roe: string;
  growthRate: string;
  discountRate: string;
  projectionYears: string;
  totalShares: string;
  perpetuityMethod: DcfPerpetuityMethod;
  lynchLpa: string;
  lynchGrowth: string;
  lynchPL: string;
}

export type PublishBlockReason = "max_public" | "ticker_taken";
