import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FieldWithTooltip } from '@/components/FieldWithTooltip';
import { ResultCard } from '@/components/ResultCard';
import { ComparisonChart } from '@/components/ComparisonChart';
import { DividendsTable } from '@/components/DividendsTable';
import { HistoryPanel } from '@/components/HistoryPanel';
import { PriceHistoryChart } from '@/components/PriceHistoryChart';
import { MethodInfoCard } from '@/components/MethodInfoCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { useI18n } from '@/i18n/i18n';
import {
  calculateGraham,
  calculateBarsi,
  calculateDCF,
  calculatePeterLynch,
  saveAnalysis,
  ValuationResult,
} from '@/lib/valuation';
import { lookupStock, stockToValuationPrefill, type Stock } from '@/lib/market';
import { Calculator, BarChart3, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { parseBRL } from '@/lib/currency';

type MethodKey = 'graham' | 'barsi' | 'dcf' | 'lynch';

export default function ValuationDashboard() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const queryClient = useQueryClient();
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
  const [currentDY, setCurrentDY] = useState('');
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


  const applyStock = useCallback((stock: Stock) => {
    const prefill = stockToValuationPrefill(stock);
    setTicker(prefill.ticker);
    if (prefill.company) setCompany(prefill.company);
    if (prefill.currentPrice) setCurrentPrice(prefill.currentPrice);
    if (prefill.lpa) setLpa(prefill.lpa);
    if (prefill.vpa) setVpa(prefill.vpa);
    if (prefill.currentDY) setCurrentDY(prefill.currentDY);
    if (prefill.lynchLpa) setLynchLpa(prefill.lynchLpa);
    if (prefill.lynchGrowth) setLynchGrowth(prefill.lynchGrowth);
    if (prefill.lynchPL) setLynchPL(prefill.lynchPL);
    if (prefill.totalShares) setTotalShares(prefill.totalShares);
  }, []);

  const handleGetData = useCallback(async (symbolOverride?: string) => {
    const input = (symbolOverride ?? ticker).trim().toUpperCase();
    if (!input) return;

    const cached = queryClient.getQueryData<Stock[]>(['screener-stocks']);
    const fromCache = cached?.find((item) => item.ticker === input);
    if (fromCache) {
      applyStock(fromCache);
      return;
    }

    try {
      const stock = await lookupStock(input);
      if (!stock) {
        toast.error(t('toast.fetchError'));
        return;
      }
      applyStock(stock);
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      toast.error(t('toast.fetchError'));
    }
  }, [ticker, t, queryClient, applyStock]);

  const prefilledTicker = useRef(false);
  useEffect(() => {
    if (prefilledTicker.current) return;

    const fromState = (location.state as { stock?: Stock } | null)?.stock;
    if (fromState?.ticker) {
      prefilledTicker.current = true;
      applyStock(fromState);
      return;
    }

    const fromQuery = searchParams.get('ticker')?.trim().toUpperCase();
    if (!fromQuery) return;
    prefilledTicker.current = true;
    setTicker(fromQuery);
    void handleGetData(fromQuery);
  }, [searchParams, location.state, handleGetData, applyStock]);

  const calculate = useCallback(() => {
    const price = parseBRL(currentPrice);
    const margin = parseFloat(safetyMargin);
    if (!price || !margin) {
      toast.error(t('toast.fillPriceMargin'));
      return;
    }

    const newResults: typeof results = [];

    if (activeMethod === 'graham') {
      const l = parseBRL(lpa);
      const v = parseBRL(vpa);
      if (l && v) {
        const r = calculateGraham({ lpa: l, vpa: v, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'graham', result: r, currentPrice: price });
      }
    }

    if (activeMethod === 'barsi') {
      const dyAtual = parseBRL(currentDY);
      const dyDesejado = parseBRL(desiredDY);
      if (dyAtual && dyDesejado) {
        const r = calculateBarsi({ currentDY: dyAtual, desiredDY: dyDesejado, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'barsi', result: r, currentPrice: price });
      }
    }

    if (activeMethod === 'dcf') {
      const f = parseBRL(fcf);
      const g = parseBRL(growthRate);
      const d = parseBRL(discountRate);
      const y = parseInt(projectionYears);
      const s = parseBRL(totalShares);
      if (f && g && d && y && s) {
        const r = calculateDCF({ freeCashFlow: f, growthRate: g, discountRate: d, projectionYears: y, totalShares: s, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'dcf', result: r, currentPrice: price });
      }
    }

    if (activeMethod === 'lynch') {
      const l = parseBRL(lynchLpa);
      const g = parseBRL(lynchGrowth);
      const pl = parseBRL(lynchPL) || undefined;
      if (l && g) {
        const r = calculatePeterLynch({ lpa: l, growthRate: g, plRatio: pl, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'lynch', result: r, currentPrice: price });
      }
    }

    if (newResults.length === 0) {
      toast.error(t('toast.fillMethodFields'));
      return;
    }

    setResults(newResults);
    toast.success(t('toast.calcSuccess'));
  }, [activeMethod, currentPrice, safetyMargin, lpa, vpa, currentDY, desiredDY, fcf, growthRate, discountRate, projectionYears, totalShares, lynchLpa, lynchGrowth, lynchPL, t]);

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
    toast.success(t('toast.saveSuccess'));
  };

  const handleReset = () => {
    setResults([]);
    setTicker('');
    setCompany('');
    setCurrentPrice('');
    setLpa('');
    setVpa('');
    setCurrentDY('');
    setFcf('');
    setTotalShares('');
    setLynchLpa('');
    setLynchGrowth('');
    setLynchPL('');
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <AppHeader
        historyActive={view === 'history'}
        onHistoryClick={() => setView('history')}
        onCalculateClick={() => setView('calc')}
      />

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
                  {t('common.stockData')}
                </h2>
                <FieldWithTooltip
                  id="ticker"
                  label={t('fields.ticker.label')}
                  tooltip={t('fields.ticker.tooltip')}
                  source="B3, Investidor10, Google Finance"
                  type="text"
                  placeholder={t('fields.ticker.placeholder')}
                  value={ticker}
                  onChange={(v) => setTicker(v.toUpperCase())}
                  onBlur={handleGetData}
                />
                <FieldWithTooltip
                  id="company"
                  label={t('fields.company.label')}
                  tooltip={t('fields.company.tooltip')}
                  type="text"
                  placeholder={t('fields.company.placeholder')}
                  value={company}
                  onChange={setCompany}
                />
                <FieldWithTooltip
                  id="price"
                  label={t('fields.price.label')}
                  tooltip={t('fields.price.tooltip')}
                  source="B3, Google Finance, Investidor10"
                  placeholder={t('fields.price.placeholder')}
                  value={currentPrice}
                  onChange={setCurrentPrice}
                  suffix="R$"
                />
                <FieldWithTooltip
                  id="margin"
                  label={t('fields.margin.label')}
                  tooltip={t('fields.margin.tooltip')}
                  placeholder={t('fields.margin.placeholder')}
                  value={safetyMargin}
                  onChange={setSafetyMargin}
                  suffix="%"
                />
              </div>

              {/* Method tabs */}
              <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as MethodKey)}>
                <TabsList className="w-full bg-secondary/30 border border-border/30">
                  <TabsTrigger value="graham" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    {t('tabs.graham')}
                  </TabsTrigger>
                  <TabsTrigger value="barsi" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    {t('tabs.barsi')}
                  </TabsTrigger>
                  <TabsTrigger value="dcf" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    {t('tabs.dcf')}
                  </TabsTrigger>
                  <TabsTrigger value="lynch" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    {t('tabs.lynch')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="graham" className="glass-card p-6 space-y-4 mt-3">
                  <h3 className="text-sm font-semibold">{t('graham.title')}</h3>
                  <p className="text-xs text-muted-foreground">{t('graham.formula')}</p>
                  <FieldWithTooltip
                    id="lpa"
                    label={t('graham.lpa.label')}
                    tooltip={t('graham.lpa.tooltip')}
                    source={t('graham.lpa.source')}
                    placeholder={t('graham.lpa.placeholder')}
                    value={lpa}
                    onChange={setLpa}
                    suffix="R$"
                  />
                  <FieldWithTooltip
                    id="vpa"
                    label={t('graham.vpa.label')}
                    tooltip={t('graham.vpa.tooltip')}
                    source={t('graham.vpa.source')}
                    placeholder={t('graham.vpa.placeholder')}
                    value={vpa}
                    onChange={setVpa}
                    suffix="R$"
                  />
                  <MethodInfoCard method="graham" />
                </TabsContent>

                <TabsContent value="barsi" className="glass-card p-6 space-y-4 mt-3">
                  <h3 className="text-sm font-semibold">{t('barsi.title')}</h3>
                  <p className="text-xs text-muted-foreground">{t('barsi.formula')}</p>
                  <FieldWithTooltip
                    id="dividend"
                    label={t('barsi.currentDY.label')}
                    tooltip={t('barsi.currentDY.tooltip')}
                    source={t('barsi.currentDY.source')}
                    placeholder={t('barsi.currentDY.placeholder')}
                    value={currentDY}
                    onChange={setCurrentDY}
                    suffix="%"
                  />
                  <FieldWithTooltip
                    id="dy"
                    label={t('barsi.desiredDY.label')}
                    tooltip={t('barsi.desiredDY.tooltip')}
                    placeholder={t('barsi.desiredDY.placeholder')}
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
                    placeholder="1.000.000.000"
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
                    placeholder="5,20"
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
                  {t('actions.calculate')}
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset} className="border-border/50">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-6">
              {ticker && (
                <>
                  <PriceHistoryChart ticker={ticker} />
                  <DividendsTable ticker={ticker} />
                </>
              )}
              {results.length === 0 ? (
                <div className={`glass-card text-center ${ticker ? 'p-8' : 'p-16'}`}>
                  <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    {t('results.empty')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5 text-xs border-border/50">
                      <Save className="h-3.5 w-3.5" />
                      {t('actions.save')}
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
