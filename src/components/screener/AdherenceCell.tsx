import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { StrategyScore } from "@/lib/strategies";
import { useI18n } from "@/i18n/i18n";

interface AdherenceCellProps {
  score: StrategyScore | null;
  compact?: boolean;
}

export function AdherenceCell({ score, compact }: AdherenceCellProps) {
  const { t } = useI18n();
  if (!score) return <span className="text-muted-foreground">—</span>;

  const tone =
    score.level === "high" ? "text-primary" : score.level === "medium" ? "text-amber-400" : "text-destructive";

  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>
        <button type="button" className={cn("text-left min-w-[88px]", compact && "w-full")}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={cn("text-xs font-semibold", tone)}>{t(`strategy.fit.${score.level}`)}</span>
            <span className="font-mono text-xs">{score.score}</span>
          </div>
          <Progress value={score.score} className="h-1.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 space-y-2">
        <p className="text-xs font-semibold">
          {t(`strategy.${score.strategyId}.name`)} · {score.score}/100
        </p>
        <ul className="space-y-1.5">
          {score.reasons.map((item) => (
            <li key={item.key} className="text-xs leading-relaxed flex gap-2">
              <span
                className={cn(
                  "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
                  item.tone === "positive" && "bg-primary",
                  item.tone === "negative" && "bg-destructive",
                  item.tone === "neutral" && "bg-amber-400",
                )}
              />
              <span className="text-muted-foreground">{t(item.key, item.params)}</span>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}
