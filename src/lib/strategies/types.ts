import type { Stock } from "@/lib/market/types";

export type StrategyId = "barsi" | "graham" | "dividends" | "quality";

export type ReasonTone = "positive" | "negative" | "neutral";

export interface StrategyReason {
  key: string;
  tone: ReasonTone;
  params?: Record<string, string | number>;
}

export interface StrategyScore {
  strategyId: StrategyId;
  score: number;
  level: "high" | "medium" | "low";
  reasons: StrategyReason[];
}

export interface Strategy {
  id: StrategyId;
  score: (stock: Stock) => StrategyScore;
}

export function scoreLevel(score: number): StrategyScore["level"] {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildScore(strategyId: StrategyId, score: number, reasons: StrategyReason[]): StrategyScore {
  const clamped = clampScore(score);
  return {
    strategyId,
    score: clamped,
    level: scoreLevel(clamped),
    reasons: reasons.slice(0, 4),
  };
}
