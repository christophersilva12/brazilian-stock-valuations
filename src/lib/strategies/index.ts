import type { Stock } from "@/lib/market/types";
import { barsiStrategy } from "./barsi";
import { grahamStrategy } from "./graham";
import { dividendsStrategy } from "./dividends";
import { qualityStrategy } from "./quality";
import type { Strategy, StrategyId, StrategyScore } from "./types";

export type { Strategy, StrategyId, StrategyReason, StrategyScore } from "./types";

export const STRATEGIES: Strategy[] = [barsiStrategy, grahamStrategy, dividendsStrategy, qualityStrategy];

export const STRATEGY_MAP: Record<StrategyId, Strategy> = {
  barsi: barsiStrategy,
  graham: grahamStrategy,
  dividends: dividendsStrategy,
  quality: qualityStrategy,
};

export const STRATEGY_MATCH_MIN = 50;

export function scoreStock(stock: Stock, strategyId: StrategyId): StrategyScore {
  return STRATEGY_MAP[strategyId].score(stock);
}

export function scoreAllStrategies(stock: Stock): Record<StrategyId, StrategyScore> {
  return {
    barsi: barsiStrategy.score(stock),
    graham: grahamStrategy.score(stock),
    dividends: dividendsStrategy.score(stock),
    quality: qualityStrategy.score(stock),
  };
}
