import type { Stock } from "@/lib/market/types";
import { isFinancialSector } from "@/lib/market/types";
import { buildScore, type Strategy, type StrategyReason } from "./types";
import { bandScore, debtIsAcceptable, fmt, hasFundamentals, reason } from "./helpers";

const BARSI_SECTORS = new Set(["Utilities", "Finance", "Energy Minerals"]);

export const barsiStrategy: Strategy = {
  id: "barsi",
  score(stock: Stock) {
    const reasons: StrategyReason[] = [];
    if (!hasFundamentals(stock)) {
      return buildScore("barsi", 0, [reason("strategy.reason.noFundamentals", "negative")]);
    }

    let score = 0;

    const dy = stock.dividendYield;
    const dyWeight = 25 * bandScore(dy, 6, 4);
    score += dyWeight;
    if (dy != null && dy >= 6) reasons.push(reason("strategy.reason.dyStrong", "positive", { value: fmt(dy) }));
    else if (dy != null && dy >= 4) reasons.push(reason("strategy.reason.dyOk", "neutral", { value: fmt(dy) }));
    else reasons.push(reason("strategy.reason.dyWeak", "negative", { value: dy == null ? "—" : fmt(dy) }));

    const pe = stock.pe;
    if (pe != null && pe > 0 && pe <= 15) {
      score += 15;
      reasons.push(reason("strategy.reason.peAttractive", "positive", { value: fmt(pe) }));
    } else if (pe != null && pe > 0 && pe <= 20) {
      score += 10;
      reasons.push(reason("strategy.reason.peOk", "neutral", { value: fmt(pe) }));
    } else {
      reasons.push(reason("strategy.reason.peWeak", "negative", { value: pe == null ? "—" : fmt(pe) }));
    }

    const roe = stock.roe;
    score += 15 * bandScore(roe, 15, 10);
    if (roe != null && roe >= 12) reasons.push(reason("strategy.reason.roeStrong", "positive", { value: fmt(roe) }));
    else if (roe == null || roe < 8) reasons.push(reason("strategy.reason.roeWeak", "negative", { value: roe == null ? "—" : fmt(roe) }));

    const debtOk = debtIsAcceptable(stock, 1.2);
    if (debtOk) {
      score += 15;
      if (isFinancialSector(stock.sector)) reasons.push(reason("strategy.reason.debtBank", "neutral"));
      else reasons.push(reason("strategy.reason.debtLow", "positive", { value: fmt(stock.debtToEquity ?? 0, 2) }));
    } else if (debtOk === null) {
      score += 6;
    } else {
      reasons.push(reason("strategy.reason.debtHigh", "negative", { value: fmt(stock.debtToEquity ?? 0, 2) }));
    }

    const payout = stock.payoutRatio;
    if (payout != null && payout >= 20 && payout <= 80) {
      score += 10;
      reasons.push(reason("strategy.reason.payoutSustainable", "positive", { value: fmt(payout) }));
    } else if (payout != null && payout > 0 && payout <= 100) {
      score += 5;
    } else if (payout != null && payout > 100) {
      reasons.push(reason("strategy.reason.payoutHigh", "negative", { value: fmt(payout) }));
    }

    if ((stock.netMargin ?? 0) > 0 && (stock.roe ?? 0) > 0) {
      score += 10;
      reasons.push(reason("strategy.reason.profitConsistent", "positive"));
    } else {
      reasons.push(reason("strategy.reason.profitWeak", "negative"));
    }

    if (stock.sector && BARSI_SECTORS.has(stock.sector)) {
      score += 10;
      reasons.push(reason("strategy.reason.sectorBarsi", "positive"));
    }

    return buildScore("barsi", score, reasons);
  },
};
