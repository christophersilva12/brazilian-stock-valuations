import type { Stock } from "@/lib/market/types";
import { buildScore, type Strategy, type StrategyReason } from "./types";
import { bandScore, debtIsAcceptable, fmt, hasFundamentals, reason } from "./helpers";

export const qualityStrategy: Strategy = {
  id: "quality",
  score(stock: Stock) {
    const reasons: StrategyReason[] = [];
    if (!hasFundamentals(stock)) {
      return buildScore("quality", 0, [reason("strategy.reason.noFundamentals", "negative")]);
    }

    let score = 0;
    const roe = stock.roe;
    score += 25 * bandScore(roe, 18, 12);
    if (roe != null && roe >= 15) reasons.push(reason("strategy.reason.roeStrong", "positive", { value: fmt(roe) }));
    else if (roe == null || roe < 10) reasons.push(reason("strategy.reason.roeWeak", "negative", { value: roe == null ? "—" : fmt(roe) }));

    const net = stock.netMargin;
    const gross = stock.grossMargin;
    if ((net != null && net >= 10) || (gross != null && gross >= 30)) {
      score += 20;
      reasons.push(reason("strategy.reason.marginsStrong", "positive", { value: fmt(net ?? gross ?? 0) }));
    } else if ((net != null && net >= 5) || (gross != null && gross >= 20)) {
      score += 10;
      reasons.push(reason("strategy.reason.marginsOk", "neutral", { value: fmt(net ?? gross ?? 0) }));
    } else {
      reasons.push(reason("strategy.reason.marginsWeak", "negative", { value: net == null ? "—" : fmt(net) }));
    }

    const growth = stock.revenueGrowth5y;
    score += 25 * bandScore(growth, 10, 5);
    if (growth != null && growth >= 8) reasons.push(reason("strategy.reason.growthStrong", "positive", { value: fmt(growth) }));
    else if (growth != null && growth >= 0) reasons.push(reason("strategy.reason.growthStable", "neutral", { value: fmt(growth) }));
    else reasons.push(reason("strategy.reason.growthWeak", "negative", { value: growth == null ? "—" : fmt(growth) }));

    const debtOk = debtIsAcceptable(stock, 1.5);
    if (debtOk) {
      score += 15;
      reasons.push(reason("strategy.reason.debtLow", "positive", { value: fmt(stock.debtToEquity ?? 0, 2) }));
    } else if (debtOk === null) {
      score += 6;
    } else {
      reasons.push(reason("strategy.reason.debtHigh", "negative", { value: fmt(stock.debtToEquity ?? 0, 2) }));
    }

    if (stock.roic != null && stock.roic >= 12) {
      score += 15;
      reasons.push(reason("strategy.reason.roicStrong", "positive", { value: fmt(stock.roic) }));
    } else if (stock.roic != null && stock.roic >= 8) {
      score += 8;
    } else if (stock.roic != null) {
      reasons.push(reason("strategy.reason.roicWeak", "negative", { value: fmt(stock.roic) }));
    } else {
      score += 5;
    }

    return buildScore("quality", score, reasons);
  },
};
