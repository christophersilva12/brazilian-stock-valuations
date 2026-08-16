import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/i18n";
import { parseBRL, formatNumberToBRL } from "@/lib/currency";
import { expectedGrowthRate } from "@/lib/valuation";
import { cn } from "@/lib/utils";

interface DcfPremissasCardProps {
  payout: string;
  onPayoutChange: (value: string) => void;
  roe: string;
  onRoeChange: (value: string) => void;
  growthRate: string;
  onGrowthRateChange: (value: string) => void;
  discountRate: string;
  onDiscountRateChange: (value: string) => void;
}

export function suggestedGrowthRate(payout: string, roe: string): string {
  const payoutNum = parseBRL(payout);
  const roeNum = parseBRL(roe);
  if (!Number.isFinite(payoutNum) || !Number.isFinite(roeNum)) return "";
  return formatNumberToBRL(expectedGrowthRate(payoutNum, roeNum));
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-popover border-border">
        <p className="text-sm">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function AssumptionRow({
  label,
  tooltip,
  value,
  onChange,
  highlighted,
}: {
  label: string;
  tooltip?: string;
  value: string;
  onChange: (value: string) => void;
  highlighted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm text-foreground/80">{label}</span>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
      <div className="relative w-28 shrink-0">
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-9 bg-secondary/50 border-border/50 text-right font-mono pr-8",
            highlighted && "border-primary/70 ring-1 ring-primary/30",
          )}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
          %
        </span>
      </div>
    </div>
  );
}

export function DcfPremissasCard({
  payout,
  onPayoutChange,
  roe,
  onRoeChange,
  growthRate,
  onGrowthRateChange,
  discountRate,
  onDiscountRateChange,
}: DcfPremissasCardProps) {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border border-border/40 bg-secondary/20 p-4 space-y-3">
      <h4 className="text-sm font-semibold">{t("dcf.premissas.title")}</h4>
      <AssumptionRow
        label={t("dcf.premissas.payout")}
        tooltip={t("dcf.premissas.payout.tooltip")}
        value={payout}
        onChange={(value) => {
          onPayoutChange(value);
          onGrowthRateChange(suggestedGrowthRate(value, roe));
        }}
      />
      <AssumptionRow
        label={t("dcf.premissas.roe")}
        tooltip={t("dcf.premissas.roe.tooltip")}
        value={roe}
        onChange={(value) => {
          onRoeChange(value);
          onGrowthRateChange(suggestedGrowthRate(payout, value));
        }}
      />
      <AssumptionRow
        label={t("dcf.premissas.growth")}
        tooltip={t("dcf.premissas.growth.tooltip")}
        value={growthRate}
        onChange={onGrowthRateChange}
      />
      <AssumptionRow
        label={t("dcf.premissas.discount")}
        tooltip={t("dcf.premissas.discount.tooltip")}
        value={discountRate}
        onChange={onDiscountRateChange}
        highlighted
      />
      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-1">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        <span>{t("dcf.premissas.selicNote")}</span>
      </p>
    </div>
  );
}
