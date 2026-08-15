import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMarketCap, formatMultiple, formatPercent, formatPrice, formatRatio } from "@/lib/market";
import type { ScoredStock, SortKey, SortState } from "@/lib/screener/query";
import { useI18n } from "@/i18n/i18n";
import { AdherenceCell } from "./AdherenceCell";
import { cn } from "@/lib/utils";

interface StockTableProps {
  rows: ScoredStock[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  showScore: boolean;
}

function SortableHead({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === column;
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={cn("whitespace-nowrap", className)}>
      <button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  );
}

export function StockTable({ rows, sort, onSort, showScore }: StockTableProps) {
  const { t, lang } = useI18n();

  return (
    <div className="glass-card hidden md:block overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHead label={t("screener.col.ticker")} column="ticker" sort={sort} onSort={onSort} className="sticky left-0 bg-card z-10" />
            <SortableHead label={t("screener.col.price")} column="price" sort={sort} onSort={onSort} />
            <SortableHead label={t("screener.col.change")} column="changePercent" sort={sort} onSort={onSort} />
            <SortableHead label={t("screener.col.dy")} column="dividendYield" sort={sort} onSort={onSort} />
            <SortableHead label={t("screener.col.pe")} column="pe" sort={sort} onSort={onSort} />
            <SortableHead label={t("screener.col.pb")} column="pb" sort={sort} onSort={onSort} />
            <SortableHead label={t("screener.col.roe")} column="roe" sort={sort} onSort={onSort} />
            <SortableHead label={t("screener.col.growth")} column="revenueGrowth5y" sort={sort} onSort={onSort} />
            <SortableHead label={t("screener.col.debt")} column="debtToEquity" sort={sort} onSort={onSort} />
            <SortableHead label={t("screener.col.mcap")} column="marketCap" sort={sort} onSort={onSort} />
            {showScore && <SortableHead label={t("screener.col.fit")} column="score" sort={sort} onSort={onSort} />}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ stock, score }) => {
            const up = (stock.changePercent ?? 0) >= 0;
            return (
              <TableRow key={stock.ticker}>
                <TableCell className="sticky left-0 bg-card z-10 min-w-[160px]">
                  <div className="flex items-center gap-2">
                    {stock.logo ? (
                      <img src={stock.logo} alt="" className="h-7 w-7 rounded-md bg-secondary object-contain" />
                    ) : (
                      <div className="h-7 w-7 rounded-md bg-secondary" />
                    )}
                    <div>
                      <div className="font-mono text-sm font-semibold">{stock.ticker}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{stock.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs whitespace-nowrap">{formatPrice(stock.price, lang)}</TableCell>
                <TableCell className={cn("font-mono text-xs", up ? "text-primary" : "text-destructive")}>
                  {formatPercent(stock.changePercent, lang)}
                </TableCell>
                <TableCell className="font-mono text-xs">{formatPercent(stock.dividendYield, lang)}</TableCell>
                <TableCell className="font-mono text-xs">{formatMultiple(stock.pe, lang)}</TableCell>
                <TableCell className="font-mono text-xs">{formatMultiple(stock.pb, lang)}</TableCell>
                <TableCell className="font-mono text-xs">{formatPercent(stock.roe, lang)}</TableCell>
                <TableCell className="font-mono text-xs">{formatPercent(stock.revenueGrowth5y, lang)}</TableCell>
                <TableCell className="font-mono text-xs">{formatRatio(stock.debtToEquity, lang)}</TableCell>
                <TableCell className="font-mono text-xs whitespace-nowrap">{formatMarketCap(stock.marketCap, lang)}</TableCell>
                {showScore && (
                  <TableCell className="min-w-[120px]">
                    <AdherenceCell score={score} />
                  </TableCell>
                )}
                <TableCell>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link to={`/valuation?ticker=${stock.ticker}`}>{t("screener.analyze")}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
