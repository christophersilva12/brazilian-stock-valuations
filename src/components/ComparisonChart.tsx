import { ValuationResult } from '@/lib/valuation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

interface ComparisonChartProps {
  results: { method: string; result: ValuationResult; currentPrice: number }[];
}

export function ComparisonChart({ results }: ComparisonChartProps) {
  if (results.length === 0) return null;

  const currentPrice = results[0].currentPrice;

  const data = results.map((r) => ({
    method: r.result.method.split(' ').slice(-1)[0], // Short name
    fullMethod: r.result.method,
    valorIntrinseco: Number(r.result.intrinsicValue.toFixed(2)),
    precoTeto: Number(r.result.ceilingPrice.toFixed(2)),
  }));

  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Comparação de Métodos
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barGap={8}>
          <XAxis
            dataKey="method"
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(222, 44%, 9%)',
              border: '1px solid hsl(222, 30%, 18%)',
              borderRadius: '8px',
              fontSize: 12,
            }}
            labelStyle={{ color: 'hsl(210, 40%, 96%)' }}
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
          />
          <ReferenceLine
            y={currentPrice}
            stroke="hsl(190, 90%, 50%)"
            strokeDasharray="5 5"
            label={{
              value: `Cotação: R$${currentPrice.toFixed(2)}`,
              position: 'right',
              fill: 'hsl(190, 90%, 50%)',
              fontSize: 11,
            }}
          />
          <Bar dataKey="valorIntrinseco" name="Valor Intrínseco" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="hsl(217, 91%, 60%)" fillOpacity={0.7} />
            ))}
          </Bar>
          <Bar dataKey="precoTeto" name="Preço Teto" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.precoTeto > currentPrice ? 'hsl(160, 84%, 39%)' : 'hsl(0, 72%, 51%)'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
