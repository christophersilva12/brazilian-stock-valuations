import { Coins, Landmark, Sprout, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StrategyId } from "@/lib/strategies";
import { useI18n } from "@/i18n/i18n";

const STRATEGIES: { id: StrategyId; icon: typeof Wallet }[] = [
  { id: "barsi", icon: Wallet },
  { id: "graham", icon: Landmark },
  { id: "dividends", icon: Coins },
  { id: "quality", icon: Sprout },
];

interface StrategyBarProps {
  value?: StrategyId;
  onChange: (id?: StrategyId) => void;
}

export function StrategyBar({ value, onChange }: StrategyBarProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {STRATEGIES.map(({ id, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(active ? undefined : id)}
            className={cn(
              "glass-card p-4 text-left transition-all hover:border-primary/40",
              active && "border-primary/60 glow-green bg-primary/5",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold">{t(`strategy.${id}.name`)}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t(`strategy.${id}.summary`)}</p>
          </button>
        );
      })}
    </div>
  );
}
