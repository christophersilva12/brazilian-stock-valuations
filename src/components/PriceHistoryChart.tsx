import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockHistory } from "@/hooks/useStockHistory";
import { useI18n } from "@/i18n/i18n";
import { formatDate, formatPrice, type HistoryRange } from "@/lib/market";

const RANGES: HistoryRange[] = ["6mo", "1y", "5y"];

interface PriceHistoryChartProps {
  ticker: string;
}

export function PriceHistoryChart({ ticker }: PriceHistoryChartProps) {
  const { t, lang } = useI18n();
  const [range, setRange] = useState<HistoryRange>("1y");
  const { data, isLoading, isError } = useStockHistory(ticker, range);

  const chartData = (data ?? []).map((point) => ({
    ...point,
    label: formatDate(point.date, lang),
  }));

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("valuation.priceHistory")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{ticker}</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={range === item ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setRange(item)}
            >
              {t(`valuation.range.${item}`)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && <Skeleton className="h-[220px] w-full" />}

      {isError && <p className="text-sm text-muted-foreground">{t("valuation.priceHistory.error")}</p>}

      {!isLoading && !isError && chartData.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("valuation.priceHistory.empty")}</p>
      )}

      {!isLoading && !isError && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={72}
              tickFormatter={(value: number) => formatPrice(value, lang)}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(222, 44%, 9%)",
                border: "1px solid hsl(222, 30%, 18%)",
                borderRadius: "8px",
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(210, 40%, 96%)" }}
              formatter={(value: number) => [formatPrice(value, lang), t("screener.col.price")]}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="hsl(160, 84%, 39%)"
              fill="url(#priceFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
