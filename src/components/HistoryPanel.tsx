import { SavedAnalysis, getAnalyses, deleteAnalysis } from '@/lib/valuation';
import { Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface HistoryPanelProps {
  refreshKey: number;
}

export function HistoryPanel({ refreshKey }: HistoryPanelProps) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);

  useEffect(() => {
    setAnalyses(getAnalyses());
  }, [refreshKey]);

  const handleDelete = (id: string) => {
    deleteAnalysis(id);
    setAnalyses(getAnalyses());
  };

  if (analyses.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground text-sm">Nenhuma análise salva ainda.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Realize um cálculo e salve para ver o histórico aqui.
        </p>
      </div>
    );
  }

  const signalIcon = {
    comprar: <TrendingUp className="h-3.5 w-3.5 text-primary" />,
    neutro: <Minus className="h-3.5 w-3.5 text-warning" />,
    caro: <TrendingDown className="h-3.5 w-3.5 text-destructive" />,
  };

  const signalClass = {
    comprar: 'text-primary',
    neutro: 'text-warning',
    caro: 'text-destructive',
  };

  return (
    <div className="glass-card divide-y divide-border/30">
      {analyses.map((a) => (
        <div key={a.id} className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            {signalIcon[a.result.signal]}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm">{a.ticker}</span>
                <span className="text-xs text-muted-foreground">{a.method}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>R$ {a.currentPrice.toFixed(2)}</span>
                <span>→ Teto: R$ {a.result.ceilingPrice.toFixed(2)}</span>
                <span className={signalClass[a.result.signal]}>
                  {a.result.upsidePercent > 0 ? '+' : ''}{a.result.upsidePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60 hidden sm:block">
              {new Date(a.date).toLocaleDateString('pt-BR')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(a.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
