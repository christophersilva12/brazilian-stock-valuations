import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStockDividends } from "@/hooks/useStockDividends";
import { useI18n } from "@/i18n/i18n";
import { formatDate, formatPrice } from "@/lib/market";

const PAGE_SIZE = 8;

interface DividendsTableProps {
  ticker: string;
}

export function DividendsTable({ ticker }: DividendsTableProps) {
  const { t, lang } = useI18n();
  const { data, isLoading, isError } = useStockDividends(ticker);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [ticker]);

  const rows = data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="glass-card p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t("valuation.dividends")}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t("valuation.dividends.count", { count: rows.length })}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-muted-foreground">{t("valuation.dividends.error")}</p>}

      {!isLoading && !isError && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("valuation.dividends.empty")}</p>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("valuation.dividends.payment")}</TableHead>
                <TableHead>{t("valuation.dividends.exDate")}</TableHead>
                <TableHead>{t("valuation.dividends.type")}</TableHead>
                <TableHead className="text-right">{t("valuation.dividends.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row, index) => (
                <TableRow key={`${row.paymentDate}-${row.rate}-${index}`}>
                  <TableCell className="font-mono text-xs">{formatDate(row.paymentDate, lang)}</TableCell>
                  <TableCell className="font-mono text-xs">{formatDate(row.exDate, lang)}</TableCell>
                  <TableCell className="text-xs">{row.label}</TableCell>
                  <TableCell className="font-mono text-xs text-right">{formatPrice(row.rate, lang)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                {t("screener.prev")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("screener.page", { page: currentPage, pages: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("screener.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
