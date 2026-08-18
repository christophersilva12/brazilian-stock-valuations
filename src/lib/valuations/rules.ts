import { MAX_PUBLIC_VALUATIONS, TICKER_PATTERN, type PublishBlockReason } from "./types";

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

export function isValidTicker(ticker: string): boolean {
  return TICKER_PATTERN.test(normalizeTicker(ticker));
}

export function canPublish(params: {
  existingPublic: { id: string; ticker: string }[];
  ticker: string;
  valuationId?: string;
}): { ok: true } | { ok: false; reason: PublishBlockReason } {
  const ticker = normalizeTicker(params.ticker);
  const others = params.existingPublic.filter((row) => row.id !== params.valuationId);

  if (others.length >= MAX_PUBLIC_VALUATIONS) {
    return { ok: false, reason: "max_public" };
  }

  if (others.some((row) => normalizeTicker(row.ticker) === ticker)) {
    return { ok: false, reason: "ticker_taken" };
  }

  return { ok: true };
}
