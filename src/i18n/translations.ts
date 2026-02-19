export type Lang = "en" | "pt" | "es";

export const translations: Record<Lang, Record<string, string>> = {
  en: {
    "common.subtitle": "B3 Stock Valuation",
    "common.stockData": "Stock Data",
    "common.calculateTab": "Calculate",
    "common.historyTab": "History",

    "fields.ticker.label": "Ticker",
    "fields.ticker.tooltip": "Stock ticker in the Brazilian exchange (e.g., PETR4, BBAS3)",
    "fields.ticker.placeholder": "PETR4",

    "fields.company.label": "Company",
    "fields.company.tooltip": "Company name",
    "fields.company.placeholder": "Petrobras",

    "fields.price.label": "Current Price",
    "fields.price.tooltip": "Current market price of the stock",
    "fields.price.placeholder": "35.50",

    "fields.margin.label": "Safety Margin",
    "fields.margin.tooltip": "Discount desired by the investor over the intrinsic value. Usually between 20% and 50%.",
    "fields.margin.placeholder": "25",

    "actions.calculate": "Calculate Valuation",
    "actions.save": "Save Analysis",

    "results.empty": "Fill the data and click \"Calculate Valuation\" to see the results.",

    "toast.fillPriceMargin": "Fill current price and safety margin.",
    "toast.fillMethodFields": "Fill all fields of the selected method.",
    "toast.calcSuccess": "Calculation done successfully!",
    "toast.saveSuccess": "Analysis saved to history!",
    "toast.fetchError": "Could not fetch ticker data.",

    "tabs.graham": "Graham",
    "tabs.barsi": "Barsi",
    "tabs.dcf": "DCF",
    "tabs.lynch": "Lynch",

    "graham.title": "Benjamin Graham Method",
    "graham.formula": "IV = √(22.5 × EPS × BVPS)",
    "graham.lpa.label": "EPS (Earnings per Share)",
    "graham.lpa.tooltip": "Net income divided by the number of shares.",
    "graham.lpa.source": "Investidor10, Fundamentus, Status Invest",
    "graham.lpa.placeholder": "5.20",
    "graham.vpa.label": "BVPS (Book Value per Share)",
    "graham.vpa.tooltip": "Equity divided by the number of shares.",
    "graham.vpa.source": "Investidor10 or company statements",
    "graham.vpa.placeholder": "28.00",

    "barsi.title": "Luiz Barsi Method",
    "barsi.formula": "Ceiling Price = (Current DY / Desired DY) × Price",
    "barsi.currentDY.label": "Current Dividend Yield",
    "barsi.currentDY.tooltip": "Current Dividend Yield in percentage.",
    "barsi.currentDY.source": "Investidor10, Status Invest, Google Finance",
    "barsi.currentDY.placeholder": "8",
    "barsi.desiredDY.label": "Desired Dividend Yield",
    "barsi.desiredDY.tooltip": "Annual return desired in dividends. Usually between 6% and 10%.",
    "barsi.desiredDY.placeholder": "6",
  },
  pt: {
    "common.subtitle": "Valuation de Ações B3",
    "common.stockData": "Dados da Ação",
    "common.calculateTab": "Calcular",
    "common.historyTab": "Histórico",

    "fields.ticker.label": "Ticker",
    "fields.ticker.tooltip": "Código da ação na bolsa brasileira (ex: PETR4, BBAS3)",
    "fields.ticker.placeholder": "PETR4",

    "fields.company.label": "Empresa",
    "fields.company.tooltip": "Nome da empresa",
    "fields.company.placeholder": "Petrobras",

    "fields.price.label": "Cotação Atual",
    "fields.price.tooltip": "Preço atual da ação no mercado",
    "fields.price.placeholder": "35.50",

    "fields.margin.label": "Margem de Segurança",
    "fields.margin.tooltip": "Percentual de desconto desejado pelo investidor sobre o valor intrínseco. Geralmente entre 20% e 50%.",
    "fields.margin.placeholder": "25",

    "actions.calculate": "Calcular Valuation",
    "actions.save": "Salvar Análise",

    "results.empty": "Preencha os dados e clique em \"Calcular Valuation\" para ver os resultados.",

    "toast.fillPriceMargin": "Preencha cotação atual e margem de segurança.",
    "toast.fillMethodFields": "Preencha todos os campos do método selecionado.",
    "toast.calcSuccess": "Cálculo realizado com sucesso!",
    "toast.saveSuccess": "Análise salva no histórico!",
    "toast.fetchError": "Não foi possível buscar dados do ticker.",

    "tabs.graham": "Graham",
    "tabs.barsi": "Barsi",
    "tabs.dcf": "DCF",
    "tabs.lynch": "Lynch",

    "graham.title": "Método Benjamin Graham",
    "graham.formula": "VI = √(22.5 × LPA × VPA)",
    "graham.lpa.label": "LPA (Lucro por Ação)",
    "graham.lpa.tooltip": "Lucro líquido dividido pelo número de ações.",
    "graham.lpa.source": "Investidor10, Fundamentus, Status Invest",
    "graham.lpa.placeholder": "5.20",
    "graham.vpa.label": "VPA (Valor Patrimonial por Ação)",
    "graham.vpa.tooltip": "Patrimônio líquido dividido pelo número de ações.",
    "graham.vpa.source": "Investidor10 ou balanço da empresa",
    "graham.vpa.placeholder": "28.00",

    "barsi.title": "Método Luiz Barsi",
    "barsi.formula": "Preço Teto = (DY atual / DY desejado) × Cotação",
    "barsi.currentDY.label": "Dividend Yield Atual",
    "barsi.currentDY.tooltip": "Dividend Yield atual da ação em percentual.",
    "barsi.currentDY.source": "Investidor10, Status Invest, Google Finance",
    "barsi.currentDY.placeholder": "8",
    "barsi.desiredDY.label": "Dividend Yield Desejado",
    "barsi.desiredDY.tooltip": "Retorno anual desejado em dividendos. Geralmente entre 6% e 10%.",
    "barsi.desiredDY.placeholder": "6",
  },
  es: {
    "common.subtitle": "Valoración de Acciones B3",
    "common.stockData": "Datos de la Acción",
    "common.calculateTab": "Calcular",
    "common.historyTab": "Historial",

    "fields.ticker.label": "Ticker",
    "fields.ticker.tooltip": "Código de la acción en la bolsa brasileña (ej.: PETR4, BBAS3)",
    "fields.ticker.placeholder": "PETR4",

    "fields.company.label": "Empresa",
    "fields.company.tooltip": "Nombre de la empresa",
    "fields.company.placeholder": "Petrobras",

    "fields.price.label": "Precio Actual",
    "fields.price.tooltip": "Precio actual de la acción en el mercado",
    "fields.price.placeholder": "35.50",

    "fields.margin.label": "Margen de Seguridad",
    "fields.margin.tooltip": "Descuento deseado sobre el valor intrínseco. Usualmente entre 20% y 50%.",
    "fields.margin.placeholder": "25",

    "actions.calculate": "Calcular Valoración",
    "actions.save": "Guardar Análisis",

    "results.empty": "Complete los datos y haga clic en \"Calcular Valoración\" para ver los resultados.",

    "toast.fillPriceMargin": "Complete el precio actual y el margen de seguridad.",
    "toast.fillMethodFields": "Complete todos los campos del método seleccionado.",
    "toast.calcSuccess": "¡Cálculo realizado con éxito!",
    "toast.saveSuccess": "¡Análisis guardado en el historial!",
    "toast.fetchError": "No fue posible obtener datos del ticker.",

    "tabs.graham": "Graham",
    "tabs.barsi": "Barsi",
    "tabs.dcf": "DCF",
    "tabs.lynch": "Lynch",

    "graham.title": "Método Benjamin Graham",
    "graham.formula": "VI = √(22.5 × BPA × VPPA)",
    "graham.lpa.label": "BPA (Beneficio por Acción)",
    "graham.lpa.tooltip": "Beneficio neto dividido por el número de acciones.",
    "graham.lpa.source": "Investidor10, Fundamentus, Status Invest",
    "graham.lpa.placeholder": "5.20",
    "graham.vpa.label": "VPPA (Valor Patrimonial por Acción)",
    "graham.vpa.tooltip": "Patrimonio dividido por el número de acciones.",
    "graham.vpa.source": "Investidor10 o estados de la empresa",
    "graham.vpa.placeholder": "28.00",

    "barsi.title": "Método Luiz Barsi",
    "barsi.formula": "Precio Techo = (DY actual / DY deseado) × Precio",
    "barsi.currentDY.label": "Dividend Yield Actual",
    "barsi.currentDY.tooltip": "Dividend Yield actual en porcentaje.",
    "barsi.currentDY.source": "Investidor10, Status Invest, Google Finance",
    "barsi.currentDY.placeholder": "8",
    "barsi.desiredDY.label": "Dividend Yield Deseado",
    "barsi.desiredDY.tooltip": "Retorno anual deseado en dividendos. Usualmente entre 6% y 10%.",
    "barsi.desiredDY.placeholder": "6",
  },
};
