import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FieldWithTooltip } from '@/components/FieldWithTooltip';
import { ResultCard } from '@/components/ResultCard';
import { ComparisonChart } from '@/components/ComparisonChart';
import { HistoryPanel } from '@/components/HistoryPanel';
import { MethodInfoCard } from '@/components/MethodInfoCard';
import {
  calculateGraham,
  calculateBarsi,
  calculateDCF,
  calculatePeterLynch,
  saveAnalysis,
  ValuationResult,
} from '@/lib/valuation';
import { Calculator, History, BarChart3, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

type MethodKey = 'graham' | 'barsi' | 'dcf' | 'lynch';

export interface Quotes {
  symbol: string
  name: string
  exchange: string
  mic_code: string
  currency: string
  datetime: string
  timestamp: number
  last_quote_at: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  previous_close: string
  change: string
  percent_change: string
  average_volume: string
  is_market_open: boolean
}

export default function ValuationDashboard() {
  const [ticker, setTicker] = useState('');
  const [company, setCompany] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [safetyMargin, setSafetyMargin] = useState('25');
  const [activeMethod, setActiveMethod] = useState<MethodKey>('graham');
  const [historyKey, setHistoryKey] = useState(0);
  const [view, setView] = useState<'calc' | 'history'>('calc');

  // Graham fields
  const [lpa, setLpa] = useState('');
  const [vpa, setVpa] = useState('');

  // Barsi fields
  const [annualDividend, setAnnualDividend] = useState('');
  const [desiredDY, setDesiredDY] = useState('6');

  // DCF fields
  const [fcf, setFcf] = useState('');
  const [growthRate, setGrowthRate] = useState('10');
  const [discountRate, setDiscountRate] = useState('12');
  const [projectionYears, setProjectionYears] = useState('10');
  const [totalShares, setTotalShares] = useState('');

  // Lynch fields
  const [lynchLpa, setLynchLpa] = useState('');
  const [lynchGrowth, setLynchGrowth] = useState('');
  const [lynchPL, setLynchPL] = useState('');

  // Results
  const [results, setResults] = useState<{ method: string; result: ValuationResult; currentPrice: number }[]>([]);


  const handleGetData = async () => {
    const input = ticker.trim().toUpperCase();
    if (!input) return;
    let cancelled = false;
    try {
      const res = await fetch(
        `https://api.twelvedata.com/quote?symbol=${input}&apikey=${import.meta.env.VITE_TWELVEDATA_KEY}`
      );
      const quote = await res.json();
      
      if (cancelled || !quote) return;
      const { name:longName, symbol, open  } = quote as Quotes;
      const name = longName || '';

      if (name) setCompany((prev) => prev || name);
      const price = parseFloat(open);
      if (price !== undefined) setCurrentPrice(String(price));
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      toast.error('Não foi possível buscar dados do ticker.');
    }
  };

  const calculate = useCallback(() => {
    const price = parseFloat(currentPrice);
    const margin = parseFloat(safetyMargin);
    if (!price || !margin) {
      toast.error('Preencha cotação atual e margem de segurança.');
      return;
    }

    const newResults: typeof results = [];

    if (activeMethod === 'graham' || activeMethod === 'all' as any) {
      const l = parseFloat(lpa);
      const v = parseFloat(vpa);
      if (l && v) {
        const r = calculateGraham({ lpa: l, vpa: v, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'graham', result: r, currentPrice: price });
      }
    }

    if (activeMethod === 'barsi' || activeMethod === 'all' as any) {
      const div = parseFloat(annualDividend);
      const dy = parseFloat(desiredDY);
      if (div && dy) {
        const r = calculateBarsi({ annualDividend: div, desiredDY: dy, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'barsi', result: r, currentPrice: price });
      }
    }

    if (activeMethod === 'dcf' || activeMethod === 'all' as any) {
      const f = parseFloat(fcf);
      const g = parseFloat(growthRate);
      const d = parseFloat(discountRate);
      const y = parseInt(projectionYears);
      const s = parseFloat(totalShares);
      if (f && g && d && y && s) {
        const r = calculateDCF({ freeCashFlow: f, growthRate: g, discountRate: d, projectionYears: y, totalShares: s, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'dcf', result: r, currentPrice: price });
      }
    }

    if (activeMethod === 'lynch' || activeMethod === 'all' as any) {
      const l = parseFloat(lynchLpa);
      const g = parseFloat(lynchGrowth);
      const pl = parseFloat(lynchPL) || undefined;
      if (l && g) {
        const r = calculatePeterLynch({ lpa: l, growthRate: g, plRatio: pl, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'lynch', result: r, currentPrice: price });
      }
    }

    if (newResults.length === 0) {
      toast.error('Preencha todos os campos do método selecionado.');
      return;
    }

    setResults(newResults);
    toast.success('Cálculo realizado com sucesso!');
  }, [activeMethod, currentPrice, safetyMargin, lpa, vpa, annualDividend, desiredDY, fcf, growthRate, discountRate, projectionYears, totalShares, lynchLpa, lynchGrowth, lynchPL]);

  const handleSave = () => {
    if (results.length === 0) return;
    results.forEach((r) => {
      saveAnalysis({
        id: crypto.randomUUID(),
        ticker: ticker.toUpperCase() || 'N/A',
        company: company || 'N/A',
        date: new Date().toISOString(),
        method: r.result.method,
        result: r.result,
        currentPrice: r.currentPrice,
      });
    });
    setHistoryKey((k) => k + 1);
    toast.success('Análise salva no histórico!');
  };

  const handleReset = () => {
    setResults([]);
    setTicker('');
    setCompany('');
    setCurrentPrice('');
    setLpa('');
    setVpa('');
    setAnnualDividend('');
    setFcf('');
    setTotalShares('');
    setLynchLpa('');
    setLynchGrowth('');
    setLynchPL('');
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight">ValorAção</h1>
              <p className="text-xs text-muted-foreground">Valuation de Ações B3</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant={view === 'calc' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('calc')}
              className="gap-1.5 text-xs"
            >
              <Calculator className="h-3.5 w-3.5" />
              Calcular
            </Button>
            <Button
              variant={view === 'history' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('history')}
              className="gap-1.5 text-xs"
            >
              <History className="h-3.5 w-3.5" />
              Histórico
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        {view === 'history' ? (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Histórico de Análises</h2>
            <HistoryPanel refreshKey={historyKey} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Common fields */}
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Dados da Ação
                </h2>
                <FieldWithTooltip
                  id="ticker"
                  label="Ticker"
                  tooltip="Código da ação na bolsa brasileira (ex: PETR4, BBAS3)"
                  source="B3, Investidor10, Google Finance"
                  type="text"
                  placeholder="PETR4"
                  value={ticker}
                  onChange={(v) => setTicker(v.toUpperCase())}
                  onBlur={handleGetData}
                />
                <FieldWithTooltip
                  id="company"
                  label="Empresa"
                  tooltip="Nome da empresa"
                  type="text"
                  placeholder="Petrobras"
                  value={company}
                  onChange={setCompany}
                />
                <FieldWithTooltip
                  id="price"
                  label="Cotação Atual"
                  tooltip="Preço atual da ação no mercado"
                  source="B3, Google Finance, Investidor10"
                  placeholder="35.50"
                  value={currentPrice}
                  onChange={setCurrentPrice}
                  suffix="R$"
                />
                <FieldWithTooltip
                  id="margin"
                  label="Margem de Segurança"
                  tooltip="Percentual de desconto desejado pelo investidor sobre o valor intrínseco. Geralmente entre 20% e 50%."
                  placeholder="25"
                  value={safetyMargin}
                  onChange={setSafetyMargin}
                  suffix="%"
                />
              </div>

              {/* Method tabs */}
              <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as MethodKey)}>
                <TabsList className="w-full bg-secondary/30 border border-border/30">
                  <TabsTrigger value="graham" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    Graham
                  </TabsTrigger>
                  <TabsTrigger value="barsi" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    Barsi
                  </TabsTrigger>
                  <TabsTrigger value="dcf" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    DCF
                  </TabsTrigger>
                  <TabsTrigger value="lynch" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    Lynch
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="graham" className="glass-card p-6 space-y-4 mt-3">
                  <h3 className="text-sm font-semibold">Método Benjamin Graham</h3>
                  <p className="text-xs text-muted-foreground">VI = √(22.5 × LPA × VPA)</p>
                  <FieldWithTooltip
                    id="lpa"
                    label="LPA (Lucro por Ação)"
                    tooltip="Lucro líquido dividido pelo número de ações. Indica quanto cada ação gerou de lucro."
                    source="Investidor10, Fundamentus, Status Invest"
                    placeholder="5.20"
                    value={lpa}
                    onChange={setLpa}
                    suffix="R$"
                  />
                  <FieldWithTooltip
                    id="vpa"
                    label="VPA (Valor Patrimonial por Ação)"
                    tooltip="Patrimônio líquido dividido pelo número de ações. Representa o valor contábil por ação."
                    source="Investidor10 ou balanço da empresa"
                    placeholder="28.00"
                    value={vpa}
                    onChange={setVpa}
                    suffix="R$"
                  />
                  <MethodInfoCard method="graham" />
                </TabsContent>

                <TabsContent value="barsi" className="glass-card p-6 space-y-4 mt-3">
                  <h3 className="text-sm font-semibold">Método Luiz Barsi</h3>
                  <p className="text-xs text-muted-foreground">Preço Teto = Dividendo Anual / DY desejado</p>
                  <FieldWithTooltip
                    id="dividend"
                    label="Dividendo Anual por Ação"
                    tooltip="Total de dividendos pagos nos últimos 12 meses por ação."
                    source="Investidor10, Status Invest, RI da empresa"
                    placeholder="3.50"
                    value={annualDividend}
                    onChange={setAnnualDividend}
                    suffix="R$"
                  />
                  <FieldWithTooltip
                    id="dy"
                    label="Dividend Yield Desejado"
                    tooltip="Retorno anual desejado pelo investidor em dividendos. Geralmente entre 6% e 10%."
                    placeholder="6"
                    value={desiredDY}
                    onChange={setDesiredDY}
                    suffix="%"
                  />
                  <MethodInfoCard method="barsi" />
                </TabsContent>

                <TabsContent value="dcf" className="glass-card p-6 space-y-4 mt-3">
                  <h3 className="text-sm font-semibold">Fluxo de Caixa Descontado</h3>
                  <p className="text-xs text-muted-foreground">Valor presente dos fluxos de caixa futuros</p>
                  <FieldWithTooltip
                    id="fcf"
                    label="Fluxo de Caixa Livre Atual"
                    tooltip="Dinheiro gerado pela empresa após investimentos operacionais."
                    source="DFC no RI da empresa"
                    placeholder="1000000000"
                    value={fcf}
                    onChange={setFcf}
                    suffix="R$"
                  />
                  <FieldWithTooltip
                    id="growth"
                    label="Taxa de Crescimento Anual"
                    tooltip="Crescimento esperado do fluxo de caixa. Baseado no histórico ou estimativa."
                    placeholder="10"
                    value={growthRate}
                    onChange={setGrowthRate}
                    suffix="%"
                  />
                  <FieldWithTooltip
                    id="discount"
                    label="Taxa de Desconto (WACC)"
                    tooltip="Retorno mínimo esperado pelo investidor. Pode usar a Selic + prêmio de risco."
                    placeholder="12"
                    value={discountRate}
                    onChange={setDiscountRate}
                    suffix="%"
                  />
                  <FieldWithTooltip
                    id="years"
                    label="Anos Projetados"
                    tooltip="Período da projeção de fluxos de caixa. Geralmente 5 a 10 anos."
                    placeholder="10"
                    value={projectionYears}
                    onChange={setProjectionYears}
                  />
                  <FieldWithTooltip
                    id="shares"
                    label="Número Total de Ações"
                    tooltip="Quantidade de ações em circulação da empresa."
                    source="Investidor10 ou RI da empresa"
                    placeholder="5000000000"
                    value={totalShares}
                    onChange={setTotalShares}
                  />
                  <MethodInfoCard method="dcf" />
                </TabsContent>

                <TabsContent value="lynch" className="glass-card p-6 space-y-4 mt-3">
                  <h3 className="text-sm font-semibold">Peter Lynch — Crescimento (PEG)</h3>
                  <p className="text-xs text-muted-foreground">Preço Justo = LPA × Taxa de Crescimento</p>
                  <FieldWithTooltip
                    id="lynch-lpa"
                    label="LPA (Lucro por Ação)"
                    tooltip="Lucro líquido dividido pelo número total de ações da empresa."
                    source="Investidor10, Status Invest, Fundamentus"
                    placeholder="5.20"
                    value={lynchLpa}
                    onChange={setLynchLpa}
                    suffix="R$"
                  />
                  <FieldWithTooltip
                    id="lynch-growth"
                    label="Taxa de Crescimento Anual do Lucro"
                    tooltip="Crescimento médio anual do lucro nos últimos anos ou projeção futura."
                    source="Investidor10 (aba crescimento), Status Invest"
                    placeholder="15"
                    value={lynchGrowth}
                    onChange={setLynchGrowth}
                    suffix="%"
                  />
                  <FieldWithTooltip
                    id="lynch-pl"
                    label="P/L Atual (opcional)"
                    tooltip="Relação entre preço da ação e lucro por ação. Usado para calcular o PEG automaticamente."
                    source="Investidor10, Fundamentus, Status Invest"
                    placeholder="12.5"
                    value={lynchPL}
                    onChange={setLynchPL}
                  />
                  <MethodInfoCard method="lynch" />
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={calculate} className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  <Calculator className="h-4 w-4" />
                  Calcular Valuation
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset} className="border-border/50">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-6">
              {results.length === 0 ? (
                <div className="glass-card p-16 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    Preencha os dados e clique em "Calcular Valuation" para ver os resultados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5 text-xs border-border/50">
                      <Save className="h-3.5 w-3.5" />
                      Salvar Análise
                    </Button>
                  </div>
                  {results.map((r, i) => (
                    <ResultCard key={i} result={r.result} currentPrice={r.currentPrice} ticker={ticker || 'N/A'} />
                  ))}
                  {results.length > 1 && (
                    <ComparisonChart results={results} />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
