import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/i18n";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listMyValuations } from "@/lib/valuations/api";
import { mapPersistenceError } from "@/lib/valuations/errors";
import { canPublish } from "@/lib/valuations/rules";
import { MAX_PUBLIC_VALUATIONS } from "@/lib/valuations/types";

interface SaveValuationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticker: string;
  valuationId?: string | null;
  initialPublic?: boolean;
  saving?: boolean;
  onConfirm: (isPublic: boolean) => Promise<void>;
}

export function SaveValuationDialog({
  open,
  onOpenChange,
  ticker,
  valuationId,
  initialPublic = false,
  saving = false,
  onConfirm,
}: SaveValuationDialogProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(initialPublic);
  const isUpdate = Boolean(valuationId);

  useEffect(() => {
    if (open) setIsPublic(initialPublic);
  }, [open, initialPublic]);

  const handleConfirm = async () => {
    if (isPublic) {
      try {
        const mine = await listMyValuations();
        const check = canPublish({
          existingPublic: mine.filter((row) => row.isPublic).map((row) => ({ id: row.id, ticker: row.ticker })),
          ticker,
          valuationId: valuationId ?? undefined,
        });
        if (check.ok === false) {
          toast.error(t(check.reason === "max_public" ? "persist.error.max_public_valuations" : "persist.error.ticker_already_public"));
          return;
        }
      } catch (error) {
        toast.error(t(`persist.error.${mapPersistenceError(error).code}`));
        return;
      }
    }

    await onConfirm(isPublic);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isUpdate ? t("persist.updateTitle") : t("persist.saveTitle")}</DialogTitle>
          <DialogDescription>{t("persist.public.help", { max: MAX_PUBLIC_VALUATIONS })}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/20 px-3 py-2">
          <div>
            <Label htmlFor="valuation-public">{t("persist.public")}</Label>
            <p className="text-xs text-muted-foreground">{ticker || t("fields.ticker.label")}</p>
          </div>
          <Switch
            id="valuation-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            disabled={!user}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("dcf.settings.cancel")}
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={saving}>
            {isUpdate ? t("actions.update") : t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
