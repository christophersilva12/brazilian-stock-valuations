import { formatMarketCap, formatMultiple, formatPercent, formatPrice, formatRatio } from "@/lib/market";
import type { ScoredStock } from "@/lib/screener/query";
import { useI18n } from "@/i18n/i18n";
import { AdherenceCell } from "./AdherenceCell";
import { AnalyzeLink } from "./AnalyzeLink";
import { cn } from "@/lib/utils";

interface StockCardsProps {
  rows: ScoredStock[];
  showScore: boolean;
}

export function StockCards({ rows, showScore }: StockCardsProps) {
  const { t, lang } = useI18n();

  return (
    <div className="grid gap-3 md:hidden">
      {rows.map(({ stock, score }) => {
        const up = (stock.changePercent ?? 0) >= 0;
        return (
          <article key={stock.ticker} className="glass-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {stock.logo ? (
                  <img src={stock.logo} alt="" className="h-8 w-8 rounded-md bg-secondary object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded-md bg-secondary" />
                )}
                <div className="min-w-0">
                  <div className="font-mono font-semibold">{stock.ticker}</div>
                  <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{formatPrice(stock.price, lang)}</div>
                <div className={cn("font-mono text-xs", up ? "text-primary" : "text-destructive")}>
                  {formatPercent(stock.changePercent, lang)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Metric label={t("screener.col.dy")} value={formatPercent(stock.dividendYield, lang)} />
              <Metric label={t("screener.col.pe")} value={formatMultiple(stock.pe, lang)} />
              <Metric label={t("screener.col.pb")} value={formatMultiple(stock.pb, lang)} />
              <Metric label={t("screener.col.roe")} value={formatPercent(stock.roe, lang)} />
              <Metric label={t("screener.col.growth")} value={formatPercent(stock.revenueGrowth5y, lang)} />
              <Metric label={t("screener.col.debt")} value={formatRatio(stock.debtToEquity, lang)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">{formatMarketCap(stock.marketCap, lang)}</div>
              {showScore && <div className="flex-1 max-w-[140px]"><AdherenceCell score={score} compact /></div>}
              <AnalyzeLink stock={stock} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-xs">{value}</div>
    </div>
  );
}
