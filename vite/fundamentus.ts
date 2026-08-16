import { parseBRNumber } from "../src/lib/market/parse";

export interface FundamentusSnapshotRow {
  ticker: string;
  price: number | null;
  pe: number | null;
  pb: number | null;
  psr: number | null;
  dividendYield: number | null;
  evEbit: number | null;
  evEbitda: number | null;
  grossMargin: number | null;
  ebitMargin: number | null;
  netMargin: number | null;
  currentRatio: number | null;
  roic: number | null;
  roe: number | null;
  equity: number | null;
  debtToEquity: number | null;
  revenueGrowth5y: number | null;
}

const COLUMN_INDEX = {
  ticker: 0,
  price: 1,
  pe: 2,
  pb: 3,
  psr: 4,
  dividendYield: 5,
  evEbit: 10,
  evEbitda: 11,
  grossMargin: 12,
  ebitMargin: 13,
  netMargin: 14,
  currentRatio: 15,
  roic: 16,
  roe: 17,
  equity: 19,
  debtToEquity: 20,
  revenueGrowth5y: 21,
} as const;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function extractCellText(cell: string): string {
  const withoutTags = cell.replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();
}

export function parseFundamentusHtml(html: string): FundamentusSnapshotRow[] {
  const tableMatch = html.match(/<table[^>]*id=["']resultado["'][^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return [];

  const rowMatches = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const rows: FundamentusSnapshotRow[] = [];

  for (const rowMatch of rowMatches) {
    const cells = [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      extractCellText(cell[1]),
    );
    if (cells.length < 22) continue;
    if (cells[0].toLowerCase() === "papel") continue;

    const ticker = cells[COLUMN_INDEX.ticker].toUpperCase();
    if (!/^[A-Z0-9]{4}\d{1,2}$/.test(ticker)) continue;

    rows.push({
      ticker,
      price: parseBRNumber(cells[COLUMN_INDEX.price]),
      pe: parseBRNumber(cells[COLUMN_INDEX.pe]),
      pb: parseBRNumber(cells[COLUMN_INDEX.pb]),
      psr: parseBRNumber(cells[COLUMN_INDEX.psr]),
      dividendYield: parseBRNumber(cells[COLUMN_INDEX.dividendYield]),
      evEbit: parseBRNumber(cells[COLUMN_INDEX.evEbit]),
      evEbitda: parseBRNumber(cells[COLUMN_INDEX.evEbitda]),
      grossMargin: parseBRNumber(cells[COLUMN_INDEX.grossMargin]),
      ebitMargin: parseBRNumber(cells[COLUMN_INDEX.ebitMargin]),
      netMargin: parseBRNumber(cells[COLUMN_INDEX.netMargin]),
      currentRatio: parseBRNumber(cells[COLUMN_INDEX.currentRatio]),
      roic: parseBRNumber(cells[COLUMN_INDEX.roic]),
      roe: parseBRNumber(cells[COLUMN_INDEX.roe]),
      equity: parseBRNumber(cells[COLUMN_INDEX.equity]),
      debtToEquity: parseBRNumber(cells[COLUMN_INDEX.debtToEquity]),
      revenueGrowth5y: parseBRNumber(cells[COLUMN_INDEX.revenueGrowth5y]),
    });
  }

  return rows;
}

export async function fetchFundamentusSnapshot(): Promise<FundamentusSnapshotRow[]> {
  const res = await fetch("https://www.fundamentus.com.br/resultado.php", {
    headers: {
      "User-Agent": "ValorAcao/1.0 (screener; +local)",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`Fundamentus request failed (${res.status})`);
  }

  const buffer = await res.arrayBuffer();
  const html = new TextDecoder("latin1").decode(buffer);
  return parseFundamentusHtml(html);
}
