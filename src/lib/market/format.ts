const localeMap = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
} as const;

export function formatPrice(value: number | null | undefined, lang: keyof typeof localeMap = "pt"): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(localeMap[lang], {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number | null | undefined, lang: keyof typeof localeMap = "pt", digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString(localeMap[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatMultiple(value: number | null | undefined, lang: keyof typeof localeMap = "pt"): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const digits = Math.abs(value) >= 100 ? 0 : 1;
  return value.toLocaleString(localeMap[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatMarketCap(value: number | null | undefined, lang: keyof typeof localeMap = "pt"): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";

  const abs = Math.abs(value);
  const locale = localeMap[lang];
  const sign = value < 0 ? "-" : "";

  if (abs >= 1e12) {
    return `${sign}R$ ${(abs / 1e12).toLocaleString(locale, { maximumFractionDigits: 1 })} tri`;
  }
  if (abs >= 1e9) {
    return `${sign}R$ ${(abs / 1e9).toLocaleString(locale, { maximumFractionDigits: 1 })} bi`;
  }
  if (abs >= 1e6) {
    return `${sign}R$ ${(abs / 1e6).toLocaleString(locale, { maximumFractionDigits: 1 })} mi`;
  }
  return `${sign}R$ ${abs.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
}

export function formatRatio(value: number | null | undefined, lang: keyof typeof localeMap = "pt"): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(localeMap[lang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
