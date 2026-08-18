import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listPublicValuations } from "@/lib/valuations/api";
import { formatNumberToBRL } from "@/lib/currency";
import { useI18n } from "@/i18n/i18n";

interface PublicComparisonsProps {
  ticker: string;
  excludeId?: string | null;
}

export function PublicComparisons({ ticker, excludeId }: PublicComparisonsProps) {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const enabled = Boolean(user && ticker);

  const query = useQuery({
    queryKey: ["public-valuations", ticker],
    queryFn: () => listPublicValuations(ticker),
    enabled,
  });

  if (loading || !user || !ticker) return null;

  const rows = (query.data ?? []).filter((row) => row.id !== excludeId && row.userId !== user.id);

  if (query.isLoading) {
    return (
      <div className="glass-card p-6">
        <p className="text-sm text-muted-foreground">{t("compare.loading")}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t("compare.title")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("compare.empty")}</p>
      </div>
    );
  }

  return (
    <div className="glass-card divide-y divide-border/30">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t("compare.title")}
        </h3>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.author?.avatarUrl ?? undefined} alt={row.author?.displayName} />
              <AvatarFallback className="text-xs">
                {(row.author?.displayName ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {t("compare.by", { name: row.author?.displayName ?? t("common.account") })}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.method.toUpperCase()} · {t("history.ceiling")}: R$ {formatNumberToBRL(row.result.ceilingPrice)}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate(`/valuation?id=${row.id}`)}>
            {t("actions.open")}
          </Button>
        </div>
      ))}
    </div>
  );
}
