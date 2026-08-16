import type { Stock } from "@/lib/market/types";
import { buildScore, type Strategy, type StrategyReason } from "./types";
import { bandScore, fmt, hasFundamentals, reason } from "./helpers";

export const dividendsStrategy: Strategy = {
  id: "dividends",
  score(stock: Stock) {
    const reasons: StrategyReason[] = [];
    if (!hasFundamentals(stock)) {
      return buildScore("dividends", 0, [reason("strategy.reason.noFundamentals", "negative")]);
    }

    let score = 0;
    const dy = stock.dividendYield;
    score += 30 * bandScore(dy, 6, 4);
    if (dy != null && dy >= 6) reasons.push(reason("strategy.reason.dyStrong", "positive", { value: fmt(dy) }));
    else if (dy != null && dy >= 4) reasons.push(reason("strategy.reason.dyOk", "neutral", { value: fmt(dy) }));
    else reasons.push(reason("strategy.reason.dyWeak", "negative", { value: dy == null ? "—" : fmt(dy) }));

    const payout = stock.payoutRatio;
    if (payout != null && payout >= 25 && payout <= 75) {
      score += 25;
      reasons.push(reason("strategy.reason.payoutSustainable", "positive", { value: fmt(payout) }));
    } else if (payout != null && payout > 0 && payout <= 90) {
      score += 12;
      reasons.push(reason("strategy.reason.payoutOk", "neutral", { value: fmt(payout) }));
    } else if (payout != null && payout > 90) {
      reasons.push(reason("strategy.reason.payoutHigh", "negative", { value: fmt(payout) }));
    } else {
      reasons.push(reason("strategy.reason.payoutUnknown", "neutral"));
    }

    if (stock.pe != null && stock.pe > 0 && stock.pe <= 20) {
      score += 15;
      reasons.push(reason("strategy.reason.profitForDividends", "positive"));
    } else {
      reasons.push(reason("strategy.reason.profitWeak", "negative"));
    }

    score += 15 * bandScore(stock.roe, 12, 8);
    if (stock.roe != null && stock.roe >= 10) {
      reasons.push(reason("strategy.reason.roeStrong", "positive", { value: fmt(stock.roe) }));
    }

    const growth = stock.revenueGrowth5y;
    if (growth != null && growth >= 0) {
      score += 10;
      reasons.push(reason("strategy.reason.growthStable", "positive", { value: fmt(growth) }));
    } else if (growth != null && growth > -15) {
      score += 5;
    } else if (growth != null) {
      reasons.push(reason("strategy.reason.growthWeak", "negative", { value: fmt(growth) }));
    }

    if ((stock.netMargin ?? 0) > 0) score += 5;

    if (stock.dividendYears != null && stock.dividendYears >= 8) {
      score += 8;
      reasons.push(reason("strategy.reason.dividendHistory", "positive", { value: stock.dividendYears }));
    } else if (stock.dividendYears != null && stock.dividendYears >= 5) {
      score += 4;
      reasons.push(reason("strategy.reason.dividendHistory", "positive", { value: stock.dividendYears }));
    }

    return buildScore("dividends", score, reasons);
  },
};
