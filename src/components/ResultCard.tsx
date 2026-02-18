import { ValuationResult } from '@/lib/valuation';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ResultCardProps {
  result: ValuationResult;
  currentPrice: number;
  ticker: string;
}

export function ResultCard({ result, currentPrice, ticker }: ResultCardProps) {
  const signalConfig = {
    comprar: {
      label: 'COMPRAR',
      className: 'bg-primary/10 text-primary border-primary/30 glow-green',
      icon: TrendingUp,
    },
    neutro: {
      label: 'NEUTRO',
      className: 'bg-warning/10 text-warning border-warning/30 glow-amber',
      icon: Minus,
    },
    caro: {
      label: 'CARO',
      className: 'bg-destructive/10 text-destructive border-destructive/30 glow-red',
      icon: TrendingDown,
    },
  };

  const config = signalConfig[result.signal];
  const Icon = config.icon;
  const isPositive = result.upsidePercent > 0;

  return (
    <div className="glass-card p-6 animate-slide-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {result.method}
          </p>
          <p className="text-lg font-semibold mt-1">{ticker}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border font-semibold text-sm flex items-center gap-2 ${config.className}`}>
          <Icon className="h-4 w-4" />
          {config.label}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricBox
          label="Cotação Atual"
          value={`R$ ${currentPrice.toFixed(2)}`}
          className="text-foreground"
        />
        <MetricBox
          label="Valor Intrínseco"
          value={`R$ ${result.intrinsicValue.toFixed(2)}`}
          className="text-accent"
        />
        <MetricBox
          label="Preço Teto"
          value={`R$ ${result.ceilingPrice.toFixed(2)}`}
          className={result.ceilingPrice > currentPrice ? 'text-primary' : 'text-destructive'}
        />
        <MetricBox
          label="Margem de Segurança"
          value={`${result.safetyMarginPercent.toFixed(1)}%`}
          className={result.safetyMarginPercent > 0 ? 'text-primary' : 'text-destructive'}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
        <span className="text-sm text-muted-foreground">Potencial de Valorização</span>
        <div className={`flex items-center gap-1 font-mono font-semibold text-lg ${isPositive ? 'text-primary' : 'text-destructive'}`}>
          {isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
          {isPositive ? '+' : ''}{result.upsidePercent.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/20 border border-border/20">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-mono font-semibold text-lg ${className}`}>{value}</p>
    </div>
  );
}
