import { describe, expect, it } from "vitest";
import { parseBRNumber } from "@/lib/market/parse";
import { computePayoutRatio, isFractionalTicker, mergeStock } from "@/lib/market/types";
import { parseFundamentusHtml } from "../../vite/fundamentus";

describe("parseBRNumber", () => {
  it("parses Brazilian thousands and decimals", () => {
    expect(parseBRNumber("1.470.570.000,00")).toBe(1_470_570_000);
    expect(parseBRNumber("42,09")).toBe(42.09);
    expect(parseBRNumber("7,05%")).toBe(7.05);
    expect(parseBRNumber("-2,33%")).toBeCloseTo(-2.33);
  });

  it("returns null for empty values", () => {
    expect(parseBRNumber("")).toBeNull();
    expect(parseBRNumber("-")).toBeNull();
  });
});

describe("isFractionalTicker", () => {
  it("detects B3 odd-lot tickers and keeps the regular share", () => {
    expect(isFractionalTicker("PETR4F")).toBe(true);
    expect(isFractionalTicker("vale3f")).toBe(true);
    expect(isFractionalTicker("TAEE11F")).toBe(true);
    expect(isFractionalTicker("PETR4")).toBe(false);
    expect(isFractionalTicker("TAEE11")).toBe(false);
  });
});

describe("mergeStock", () => {
  it("keeps live quotes and derives payout, EPS and book value", () => {
    const stock = mergeStock(
      {
        ticker: "PETR4",
        name: "Petrobras",
        sector: "Energy Minerals",
        subsector: null,
        price: 42.09,
        changePercent: 0.45,
        volume: 1,
        marketCap: 570e9,
        logo: null,
      },
      {
        ticker: "PETR4",
        pe: 4.07,
        pb: 1.13,
        psr: 0.99,
        dividendYield: 7.05,
        evEbitda: 2.66,
        evEbit: 3.65,
        grossMargin: 50.6,
        ebitMargin: 42.76,
        netMargin: 24.39,
        currentRatio: 0.85,
        roic: 19.69,
        roe: 27.73,
        equity: 480e9,
        debtToEquity: 0.65,
        revenueGrowth5y: -2.33,
        price: 40,
      },
    );

    expect(stock.price).toBe(42.09);
    expect(stock.fundamentalsSource).toBe("fundamentus");
    expect(stock.payoutRatio).toBeCloseTo(computePayoutRatio(7.05, 4.07) ?? 0);
    expect(stock.payoutRatio).toBeCloseTo(28.69, 1);
    expect(stock.eps).toBeCloseTo(42.09 / 4.07);
    expect(stock.bookValue).toBeCloseTo(42.09 / 1.13);
  });
});

describe("parseFundamentusHtml", () => {
  it("reads the resultado table", () => {
    const html = `
      <table id="resultado">
        <tr>
          <th>Papel</th><th>Cotação</th><th>P/L</th><th>P/VP</th><th>PSR</th><th>Div.Yield</th>
          <th>P/Ativo</th><th>P/Cap.Giro</th><th>P/EBIT</th><th>P/Ativ Circ.Liq</th>
          <th>EV/EBIT</th><th>EV/EBITDA</th><th>Mrg Bruta</th><th>Mrg Ebit</th><th>Mrg. Líq.</th>
          <th>Liq. Corr.</th><th>ROIC</th><th>ROE</th><th>Liq.2meses</th><th>Patrim. Líq</th>
          <th>Dív.Líq/ Patrim.</th><th>Cresc. Rec.5a</th>
        </tr>
        <tr>
          <td>PETR4</td><td>42,09</td><td>4,07</td><td>1,13</td><td>0,989</td><td>7,05%</td>
          <td>0,424</td><td>-20,55</td><td>2,31</td><td>-0,84</td>
          <td>3,65</td><td>2,66</td><td>50,60%</td><td>42,76%</td><td>24,39%</td>
          <td>0,85</td><td>19,69%</td><td>27,73%</td><td>1.470.570.000,00</td><td>480.950.000.000,00</td>
          <td>0,65</td><td>-2,33%</td>
        </tr>
      </table>
    `;

    const [row] = parseFundamentusHtml(html);
    expect(row.ticker).toBe("PETR4");
    expect(row.pe).toBe(4.07);
    expect(row.dividendYield).toBe(7.05);
    expect(row.roe).toBe(27.73);
    expect(row.revenueGrowth5y).toBeCloseTo(-2.33);
  });
});
