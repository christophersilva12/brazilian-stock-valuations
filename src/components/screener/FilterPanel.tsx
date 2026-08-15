import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RangeFilter, ScreenerQuery } from "@/lib/screener/query";
import { useI18n } from "@/i18n/i18n";

interface FilterPanelProps {
  query: ScreenerQuery;
  sectors: string[];
  onChange: (query: ScreenerQuery) => void;
}

function parseBound(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function RangeInputs({
  label,
  range,
  onChange,
}: {
  label: string;
  range: RangeFilter;
  onChange: (range: RangeFilter) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          inputMode="decimal"
          placeholder={t("screener.filter.min")}
          className="h-8 text-xs"
          value={range.min ?? ""}
          onChange={(e) => onChange({ ...range, min: parseBound(e.target.value) })}
        />
        <Input
          inputMode="decimal"
          placeholder={t("screener.filter.max")}
          className="h-8 text-xs"
          value={range.max ?? ""}
          onChange={(e) => onChange({ ...range, max: parseBound(e.target.value) })}
        />
      </div>
    </div>
  );
}

export function FilterPanel({ query, sectors, onChange }: FilterPanelProps) {
  const { t } = useI18n();

  return (
    <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("screener.filter.sector")}</Label>
        <Select
          value={query.sector ?? "all"}
          onValueChange={(value) => onChange({ ...query, sector: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("screener.filter.allSectors")}</SelectItem>
            {sectors.map((sector) => (
              <SelectItem key={sector} value={sector}>
                {t(`sector.${sector}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <RangeInputs
        label={t("screener.filter.price")}
        range={query.price}
        onChange={(price) => onChange({ ...query, price })}
      />
      <RangeInputs
        label={t("screener.filter.dy")}
        range={query.dividendYield}
        onChange={(dividendYield) => onChange({ ...query, dividendYield })}
      />
      <RangeInputs label={t("screener.filter.pe")} range={query.pe} onChange={(pe) => onChange({ ...query, pe })} />
      <RangeInputs label={t("screener.filter.pb")} range={query.pb} onChange={(pb) => onChange({ ...query, pb })} />
      <RangeInputs label={t("screener.filter.roe")} range={query.roe} onChange={(roe) => onChange({ ...query, roe })} />
      <RangeInputs
        label={t("screener.filter.growth")}
        range={query.growth}
        onChange={(growth) => onChange({ ...query, growth })}
      />
      <RangeInputs
        label={t("screener.filter.mcap")}
        range={{
          min: query.marketCap.min != null ? query.marketCap.min / 1e9 : undefined,
          max: query.marketCap.max != null ? query.marketCap.max / 1e9 : undefined,
        }}
        onChange={(range) =>
          onChange({
            ...query,
            marketCap: {
              min: range.min != null ? range.min * 1e9 : undefined,
              max: range.max != null ? range.max * 1e9 : undefined,
            },
          })
        }
      />
    </div>
  );
}
