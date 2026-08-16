import type { Stock } from "@/lib/market/types";
import { buildScore, type Strategy, type StrategyReason } from "./types";
import { debtIsAcceptable, fmt, hasFundamentals, reason } from "./helpers";

export const grahamStrategy: Strategy = {
  id: "graham",
  score(stock: Stock) {
    const reasons: StrategyReason[] = [];
    if (!hasFundamentals(stock)) {
      return buildScore("graham", 0, [reason("strategy.reason.noFundamentals", "negative")]);
    }

    let score = 0;
    const pe = stock.pe;
    const pb = stock.pb;

    if (pe != null && pe > 0 && pe <= 15) {
      score += 25;
      reasons.push(reason("strategy.reason.peGraham", "positive", { value: fmt(pe) }));
    } else if (pe != null && pe > 0 && pe <= 20) {
      score += 12;
      reasons.push(reason("strategy.reason.peOk", "neutral", { value: fmt(pe) }));
    } else {
      reasons.push(reason("strategy.reason.peWeak", "negative", { value: pe == null ? "—" : fmt(pe) }));
    }

    if (pb != null && pb > 0 && pb <= 1.5) {
      score += 25;
      reasons.push(reason("strategy.reason.pbGraham", "positive", { value: fmt(pb, 2) }));
    } else if (pb != null && pb > 0 && pb <= 2) {
      score += 12;
      reasons.push(reason("strategy.reason.pbOk", "neutral", { value: fmt(pb, 2) }));
    } else {
      reasons.push(reason("strategy.reason.pbWeak", "negative", { value: pb == null ? "—" : fmt(pb, 2) }));
    }

    if (pe != null && pb != null && pe > 0 && pb > 0) {
      const product = pe * pb;
      if (product <= 22.5) {
        score += 20;
        reasons.push(reason("strategy.reason.grahamProduct", "positive", { value: fmt(product) }));
      } else if (product <= 30) {
        score += 8;
        reasons.push(reason("strategy.reason.grahamProductOk", "neutral", { value: fmt(product) }));
      } else {
        reasons.push(reason("strategy.reason.grahamProductHigh", "negative", { value: fmt(product) }));
      }
    }

    const debtOk = debtIsAcceptable(stock, 1);
    if (debtOk) {
      score += 15;
      reasons.push(reason("strategy.reason.debtLow", "positive", { value: fmt(stock.debtToEquity ?? 0, 2) }));
    } else if (debtOk === null) {
      score += 6;
    } else {
      reasons.push(reason("strategy.reason.debtHigh", "negative", { value: fmt(stock.debtToEquity ?? 0, 2) }));
    }

    if (stock.currentRatio != null && stock.currentRatio >= 1.5) {
      score += 10;
      reasons.push(reason("strategy.reason.currentRatioStrong", "positive", { value: fmt(stock.currentRatio, 2) }));
    } else if (stock.currentRatio != null && stock.currentRatio >= 1) {
      score += 5;
    } else if (stock.currentRatio != null) {
      reasons.push(reason("strategy.reason.currentRatioWeak", "negative", { value: fmt(stock.currentRatio, 2) }));
    }

    if ((stock.eps ?? 0) > 0 || (stock.roe ?? 0) > 0) {
      score += 5;
    } else {
      reasons.push(reason("strategy.reason.noProfit", "negative"));
    }

    return buildScore("graham", score, reasons);
  },
};
