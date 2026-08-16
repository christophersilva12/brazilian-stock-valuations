import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockScreener } from "@/hooks/useStockScreener";
import { useI18n } from "@/i18n/i18n";
import {
  applyScreener,
  emptyQuery,
  hasActiveFilters,
  paginate,
  sortRows,
  uniqueSectors,
  type ScreenerQuery,
  type SortKey,
  type SortState,
} from "@/lib/screener/query";
import { FilterPanel } from "./FilterPanel";
import { StockCards } from "./StockCards";
import { StockTable } from "./StockTable";
import { StrategyBar } from "./StrategyBar";

const PAGE_SIZES = [20, 50, 100];

export function StockScreener() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useStockScreener();
  const [query, setQuery] = useState<ScreenerQuery>(emptyQuery);
  const [sort, setSort] = useState<SortState>({ key: "marketCap", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sectors = useMemo(() => uniqueSectors(data ?? []), [data]);

  const filtered = useMemo(() => applyScreener(data ?? [], query), [data, query]);
  const sorted = useMemo(() => sortRows(filtered, sort), [filtered, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = useMemo(() => paginate(sorted, currentPage, pageSize), [sorted, currentPage, pageSize]);

  const updateQuery = (next: ScreenerQuery) => {
    setQuery(next);
    setPage(1);
    if (next.strategyId && sort.key !== "score") {
      setSort({ key: "score", direction: "desc" });
    }
  };

  const handleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "desc" },
    );
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <AppHeader />
      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{t("screener.title")}</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">{t("screener.subtitle")}</p>
          <p className="text-[11px] text-muted-foreground/80">{t("screener.source")}</p>
        </div>

        <StrategyBar
          value={query.strategyId}
          onChange={(strategyId) => updateQuery({ ...query, strategyId })}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query.search}
              onChange={(e) => updateQuery({ ...query, search: e.target.value })}
              placeholder={t("screener.search")}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-10" onClick={() => setFiltersOpen((open) => !open)}>
              <SlidersHorizontal className="h-4 w-4" />
              {t("screener.filters")}
            </Button>
            {hasActiveFilters(query) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10"
                onClick={() => {
                  updateQuery(emptyQuery());
                  setSort({ key: "marketCap", direction: "desc" });
                }}
              >
                <X className="h-4 w-4" />
                {t("screener.clear")}
              </Button>
            )}
          </div>
        </div>

        {filtersOpen && <FilterPanel query={query} sectors={sectors} onChange={updateQuery} />}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{t("screener.results", { count: sorted.length })}</span>
          <div className="flex items-center gap-2">
            <span>{t("screener.perPage")}</span>
            <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("screener.loading")}</p>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="glass-card p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t("screener.error")}</p>
            <Button size="sm" onClick={() => refetch()}>
              {t("screener.retry")}
            </Button>
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <div className="glass-card p-10 text-center text-sm text-muted-foreground">{t("screener.empty")}</div>
        )}

        {!isLoading && !isError && visible.length > 0 && (
          <>
            <StockTable rows={visible} sort={sort} onSort={handleSort} showScore={!!query.strategyId} />
            <StockCards rows={visible} showScore={!!query.strategyId} />
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
          </>
        )}
      </main>
    </div>
  );
}
