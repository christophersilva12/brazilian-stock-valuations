import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Lock, Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/i18n/i18n";
import { formatNumberToBRL } from "@/lib/currency";
import { useAuth } from "@/lib/auth/AuthProvider";
import { deleteValuation, listMyValuations, listPublicValuations, setValuationPublic } from "@/lib/valuations/api";
import { mapPersistenceError } from "@/lib/valuations/errors";
import type { ValuationRecord } from "@/lib/valuations/types";

export function HistoryPanel() {
  const { t } = useI18n();
  const { user, loading, openAuth, configured } = useAuth();
  const [tab, setTab] = useState("mine");

  if (!configured) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground text-sm">{t("persist.error.supabase_not_configured")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-card p-8 text-center space-y-3">
        <p className="text-muted-foreground text-sm">{t("auth.required.history")}</p>
        <Button onClick={() => openAuth("login")}>{t("history.loginCta")}</Button>
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full bg-secondary/30 border border-border/30 mb-4">
        <TabsTrigger value="mine" className="flex-1">{t("history.mine")}</TabsTrigger>
        <TabsTrigger value="public" className="flex-1">{t("history.public")}</TabsTrigger>
      </TabsList>
      <TabsContent value="mine">
        <MineList />
      </TabsContent>
      <TabsContent value="public">
        <PublicList currentUserId={user.id} />
      </TabsContent>
    </Tabs>
  );
}

function MineList() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["my-valuations"], queryFn: listMyValuations });

  if (query.isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (query.isError) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted-foreground">
        {t(`persist.error.${mapPersistenceError(query.error).code}`)}
      </div>
    );
  }

  const rows = query.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground text-sm">{t("history.empty.title")}</p>
        <p className="text-muted-foreground/60 text-xs mt-1">{t("history.empty.subtitle")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <ValuationRow
          key={row.id}
          row={row}
          mine
          onChanged={() => {
            void queryClient.invalidateQueries({ queryKey: ["my-valuations"] });
            void queryClient.invalidateQueries({ queryKey: ["public-valuations"] });
          }}
        />
      ))}
    </div>
  );
}

function PublicList({ currentUserId }: { currentUserId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["public-valuations", "all"], queryFn: () => listPublicValuations() });

  if (query.isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (query.isError) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted-foreground">
        {t(`persist.error.${mapPersistenceError(query.error).code}`)}
      </div>
    );
  }

  const rows = query.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground text-sm">{t("history.empty.public")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <ValuationRow
          key={row.id}
          row={row}
          mine={row.userId === currentUserId}
          onChanged={() => {
            void queryClient.invalidateQueries({ queryKey: ["my-valuations"] });
            void queryClient.invalidateQueries({ queryKey: ["public-valuations"] });
          }}
        />
      ))}
    </div>
  );
}

function ValuationRow({
  row,
  mine,
  onChanged,
}: {
  row: ValuationRecord;
  mine?: boolean;
  onChanged?: () => void;
}) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR";
  const signalIcon = useMemo(
    () => ({
      comprar: <TrendingUp className="h-3.5 w-3.5 text-primary" />,
      neutro: <Minus className="h-3.5 w-3.5 text-warning" />,
      caro: <TrendingDown className="h-3.5 w-3.5 text-destructive" />,
    }),
    [],
  );
  const signalClass = {
    comprar: "text-primary",
    neutro: "text-warning",
    caro: "text-destructive",
  } as const;

  const publish = useMutation({
    mutationFn: (next: boolean) => setValuationPublic(row.id, next),
    onSuccess: (updated) => {
      toast.success(updated.isPublic ? t("toast.published") : t("toast.unpublished"));
      onChanged?.();
    },
    onError: (error) => {
      toast.error(t(`persist.error.${mapPersistenceError(error).code}`));
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteValuation(row.id),
    onSuccess: () => {
      toast.success(t("toast.deleted"));
      setConfirmOpen(false);
      onChanged?.();
    },
    onError: (error) => {
      toast.error(t(`persist.error.${mapPersistenceError(error).code}`));
    },
  });

  return (
    <div className="glass-card p-4 flex items-center justify-between gap-4">
      <button
        type="button"
        className="flex items-center gap-3 min-w-0 text-left"
        onClick={() => navigate(`/valuation?id=${row.id}`)}
      >
        {signalIcon[row.result.signal]}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold text-sm">{row.ticker}</span>
            <span className="text-xs text-muted-foreground">{row.method}</span>
            <Badge variant={row.isPublic ? "default" : "secondary"} className="text-[10px]">
              {row.isPublic ? t("persist.public") : t("persist.private")}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
            {row.author && (
              <span className="inline-flex items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={row.author.avatarUrl ?? undefined} alt={row.author.displayName} />
                  <AvatarFallback className="text-[8px]">{row.author.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {row.author.displayName}
              </span>
            )}
            <span>R$ {formatNumberToBRL(row.inputs.currentPrice ?? row.metrics.currentPrice ?? 0)}</span>
            <span>
              → {t("history.ceiling")}: R$ {formatNumberToBRL(row.result.ceilingPrice)}
            </span>
            <span className={signalClass[row.result.signal]}>
              {row.result.upsidePercent > 0 ? "+" : ""}
              {row.result.upsidePercent.toFixed(1)}%
            </span>
            <span className="text-muted-foreground/60 hidden sm:inline">
              {new Date(row.updatedAt).toLocaleDateString(locale)}
            </span>
          </div>
        </div>
      </button>
      {mine && (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => publish.mutate(!row.isPublic)}
            aria-label={row.isPublic ? t("actions.unpublish") : t("actions.publish")}
          >
            {row.isPublic ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("actions.delete")}</AlertDialogTitle>
                <AlertDialogDescription>{t("history.confirmDelete")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("dcf.settings.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => remove.mutate()}>{t("actions.delete")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
