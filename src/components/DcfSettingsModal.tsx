import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/i18n";
import { cn } from "@/lib/utils";
import type { DcfPerpetuityMethod, DcfSettings } from "@/lib/dcf-settings";

interface DcfSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: DcfSettings;
  onApply: (settings: DcfSettings) => void;
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex" onClick={(e) => e.preventDefault()}>
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-popover border-border">
        <p className="text-sm">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function OptionCard({
  value,
  selected,
  title,
  description,
  tooltip,
}: {
  value: string;
  selected: boolean;
  title: string;
  description: string;
  tooltip?: string;
}) {
  const id = `dcf-opt-${value}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border/50 hover:border-border",
      )}
    >
      <RadioGroupItem id={id} value={value} className="mt-0.5" />
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{title}</span>
          {tooltip && <InfoTip text={tooltip} />}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}

export function DcfSettingsModal({ open, onOpenChange, settings, onApply }: DcfSettingsModalProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dcf.settings.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("dcf.settings.method")}
            </p>
            <RadioGroup
              value={draft.perpetuityMethod}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, perpetuityMethod: value as DcfPerpetuityMethod }))
              }
              className="gap-2"
            >
              <OptionCard
                value="buffett"
                selected={draft.perpetuityMethod === "buffett"}
                title={t("dcf.settings.buffett")}
                description={t("dcf.settings.buffett.desc")}
                tooltip={t("dcf.settings.buffett.tooltip")}
              />
              <OptionCard
                value="classic"
                selected={draft.perpetuityMethod === "classic"}
                title={t("dcf.settings.classic")}
                description={t("dcf.settings.classic.desc")}
                tooltip={t("dcf.settings.classic.tooltip")}
              />
            </RadioGroup>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("dcf.settings.cancel")}
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            {t("dcf.settings.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
