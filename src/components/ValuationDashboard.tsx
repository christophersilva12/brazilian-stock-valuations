import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FieldWithTooltip } from '@/components/FieldWithTooltip';
import { ResultCard } from '@/components/ResultCard';
import { ComparisonChart } from '@/components/ComparisonChart';
import { HistoryPanel } from '@/components/HistoryPanel';
import { MethodInfoCard } from '@/components/MethodInfoCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n/i18n';
import type { Lang } from '@/i18n/translations';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import {
  calculateGraham,
  calculateBarsi,
  calculateDCF,
  calculatePeterLynch,
  saveAnalysis,
  ValuationResult,
} from '@/lib/valuation';
import { Calculator, History, BarChart3, Save, RotateCcw, Menu } from 'lucide-react';
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
  const { t, lang, setLang } = useI18n();
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


  const handleGetData = async () => {
    const input = ticker.trim().toUpperCase();
    if (!input) return;
    const cancelled = false;
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
      toast.error(t('toast.fetchError'));
    }
  };

  const calculate = useCallback(() => {
    const price = parseFloat(currentPrice);
    const margin = parseFloat(safetyMargin);
    if (!price || !margin) {
      toast.error(t('toast.fillPriceMargin'));
      return;
    }

    const newResults: typeof results = [];

    if (activeMethod === 'graham') {
      const l = parseFloat(lpa);
      const v = parseFloat(vpa);
      if (l && v) {
        const r = calculateGraham({ lpa: l, vpa: v, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'graham', result: r, currentPrice: price });
      }
    }

    if (activeMethod === 'barsi') {
      console.log(currentDY, desiredDY);
      const dyAtual = parseFloat(currentDY);
      const dyDesejado = parseFloat(desiredDY);
      console.log(dyAtual, dyDesejado);
      if (dyAtual && dyDesejado) {
        const r = calculateBarsi({ currentDY: dyAtual, desiredDY: dyDesejado, currentPrice: price, safetyMargin: margin });
        newResults.push({ method: 'barsi', result: r, currentPrice: price });
      }
    }

    if (activeMethod === 'dcf') {
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

    if (activeMethod === 'lynch') {
      const l = parseFloat(lynchLpa);
      const g = parseFloat(lynchGrowth);
      const pl = parseFloat(lynchPL) || undefined;
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
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight">ValorAção</h1>
              <p className="text-xs text-muted-foreground">{t('common.subtitle')}</p>
            </div>
          </div>
          <div className="hidden sm:flex flex-wrap gap-2 items-center w-full sm:w-auto justify-end">
            <Button
              variant={view === 'calc' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('calc')}
              className="gap-1.5 text-xs"
            >
              <Calculator className="h-3.5 w-3.5" />
              {t('common.calculateTab')}
            </Button>
            <Button
              variant={view === 'history' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('history')}
              className="gap-1.5 text-xs"
            >
              <History className="h-3.5 w-3.5" />
              {t('common.historyTab')}
            </Button>
            <div className="w-full sm:w-36">
              <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex sm:hidden items-center justify-end">
            <Drawer>
              <DrawerTrigger>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Menu</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-3">
                  <Button
                    variant={view === 'calc' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setView('calc')}
                    className="w-full justify-center gap-1.5 text-xs"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    {t('common.calculateTab')}
                  </Button>
                  <Button
                    variant={view === 'history' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setView('history')}
                    className="w-full justify-center gap-1.5 text-xs"
                  >
                    <History className="h-3.5 w-3.5" />
                    {t('common.historyTab')}
                  </Button>
                  <div className="w-full">
                    <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                      <SelectTrigger className="h-9 text-xs w-full">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DrawerFooter />
              </DrawerContent>
            </Drawer>
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
                  {t('actions.calculate')}
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
