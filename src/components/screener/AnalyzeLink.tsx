import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n";
import type { Stock } from "@/lib/market";
import { valuationState } from "@/lib/market/prefill";

export function AnalyzeLink({ stock }: { stock: Stock }) {
  const { t } = useI18n();

  return (
    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
      <Link to={`/valuation?ticker=${encodeURIComponent(stock.ticker)}`} state={valuationState(stock)}>
        {t("screener.analyze")}
      </Link>
    </Button>
  );
}
