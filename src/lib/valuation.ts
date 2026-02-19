export interface GrahamInput {
  lpa: number;
  vpa: number;
  currentPrice: number;
  safetyMargin: number; // 0-100
}

export interface BarsiInput {
  currentDY: number; // 0-100
  desiredDY: number; // 0-100
  currentPrice: number;
  safetyMargin: number;
}

export interface DCFInput {
  freeCashFlow: number;
  growthRate: number; // 0-100
  discountRate: number; // 0-100
  projectionYears: number;
  totalShares: number;
  currentPrice: number;
  safetyMargin: number;
}

export interface PeterLynchInput {
  lpa: number;
  growthRate: number; // 0-100
  plRatio?: number; // optional P/L
  currentPrice: number;
  safetyMargin: number;
}

export interface ValuationResult {
  intrinsicValue: number;
  ceilingPrice: number;
  safetyMarginPercent: number;
  upsidePercent: number;
  signal: 'comprar' | 'neutro' | 'caro';
  method: string;
}

export function calculateGraham(input: GrahamInput): ValuationResult {
  const { lpa, vpa, currentPrice, safetyMargin } = input;
  const product = 22.5 * lpa * vpa;
  const intrinsicValue = product > 0 ? Math.sqrt(product) : 0;
  const ceilingPrice = intrinsicValue * (1 - safetyMargin / 100);
  const safetyMarginPercent = intrinsicValue > 0
    ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100
    : 0;
  const upsidePercent = currentPrice > 0
    ? ((ceilingPrice - currentPrice) / currentPrice) * 100
    : 0;

  return {
    intrinsicValue,
    ceilingPrice,
    safetyMarginPercent,
    upsidePercent,
    signal: getSignal(currentPrice, ceilingPrice),
    method: 'Benjamin Graham',
  };
}

export function calculateBarsi(input: BarsiInput): ValuationResult {
  const { currentDY, desiredDY, currentPrice, safetyMargin } = input;
  console.log(currentDY, desiredDY, currentPrice, safetyMargin);
  const intrinsicValue =
    desiredDY > 0 && currentDY > 0
      ? currentPrice * (currentDY / desiredDY)
      : 0;
  const ceilingPrice = intrinsicValue * (1 - safetyMargin / 100);
  const safetyMarginPercent = intrinsicValue > 0
    ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100
    : 0;
  const upsidePercent = currentPrice > 0
    ? ((ceilingPrice - currentPrice) / currentPrice) * 100
    : 0;

  return {
    intrinsicValue,
    ceilingPrice,
    safetyMarginPercent,
    upsidePercent,
    signal: getSignal(currentPrice, ceilingPrice),
    method: 'Luiz Barsi',
  };
}

export function calculateDCF(input: DCFInput): ValuationResult {
  const { freeCashFlow, growthRate, discountRate, projectionYears, totalShares, currentPrice, safetyMargin } = input;
  
  let totalPV = 0;
  for (let year = 1; year <= projectionYears; year++) {
    const futureCF = freeCashFlow * Math.pow(1 + growthRate / 100, year);
    const pv = futureCF / Math.pow(1 + discountRate / 100, year);
    totalPV += pv;
  }

  // Terminal value (perpetuity growth of 3%)
  const terminalGrowth = 0.03;
  const lastCF = freeCashFlow * Math.pow(1 + growthRate / 100, projectionYears);
  const terminalValue = (lastCF * (1 + terminalGrowth)) / (discountRate / 100 - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + discountRate / 100, projectionYears);
  totalPV += pvTerminal;

  const intrinsicValue = totalShares > 0 ? totalPV / totalShares : 0;
  const ceilingPrice = intrinsicValue * (1 - safetyMargin / 100);
  const safetyMarginPercent = intrinsicValue > 0
    ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100
    : 0;
  const upsidePercent = currentPrice > 0
    ? ((ceilingPrice - currentPrice) / currentPrice) * 100
    : 0;

  return {
    intrinsicValue,
    ceilingPrice,
    safetyMarginPercent,
    upsidePercent,
    signal: getSignal(currentPrice, ceilingPrice),
    method: 'Fluxo de Caixa Descontado',
  };
}

export function calculatePeterLynch(input: PeterLynchInput): ValuationResult & { peg?: number; pegClassification?: string } {
  const { lpa, growthRate, plRatio, currentPrice, safetyMargin } = input;
  const intrinsicValue = lpa * growthRate;
  const ceilingPrice = intrinsicValue * (1 - safetyMargin / 100);
  const safetyMarginPercent = intrinsicValue > 0
    ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100
    : 0;
  const upsidePercent = currentPrice > 0
    ? ((ceilingPrice - currentPrice) / currentPrice) * 100
    : 0;

  let peg: number | undefined;
  let pegClassification: string | undefined;
  if (plRatio && growthRate > 0) {
    peg = plRatio / growthRate;
    pegClassification = peg < 1 ? 'Barato' : peg <= 1.5 ? 'Justo' : 'Caro';
  }

  return {
    intrinsicValue,
    ceilingPrice,
    safetyMarginPercent,
    upsidePercent,
    signal: getSignal(currentPrice, ceilingPrice),
    method: 'Peter Lynch (PEG)',
    peg,
    pegClassification,
  };
}

function getSignal(currentPrice: number, ceilingPrice: number): 'comprar' | 'neutro' | 'caro' {
  if (currentPrice <= ceilingPrice * 0.95) return 'comprar';
  if (currentPrice <= ceilingPrice * 1.1) return 'neutro';
  return 'caro';
}
export interface SavedAnalysis {
  id: string;
  ticker: string;
  company: string;
  date: string;
  method: string;
  result: ValuationResult;
  currentPrice: number;
}

export function saveAnalysis(analysis: SavedAnalysis) {
  const saved = getAnalyses();
  saved.unshift(analysis);
  localStorage.setItem('valuation-analyses', JSON.stringify(saved.slice(0, 50)));
}

export function getAnalyses(): SavedAnalysis[] {
  try {
    return JSON.parse(localStorage.getItem('valuation-analyses') || '[]');
  } catch {
    return [];
  }
}

export function deleteAnalysis(id: string) {
  const saved = getAnalyses().filter(a => a.id !== id);
  localStorage.setItem('valuation-analyses', JSON.stringify(saved));
}
