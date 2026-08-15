function countDigits(value: string): number {
  return (value.match(/\d/g) || []).length;
}

/** Maps a digit count (from the start) to a caret index in a formatted string. */
export function mapDigitCursor(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) {
    return formatted.startsWith('-') ? 1 : 0;
  }

  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      count++;
      if (count === digitsBefore) return i + 1;
    }
  }

  return formatted.length;
}

export function countDigitsBefore(value: string, cursor: number): number {
  return countDigits(value.slice(0, Math.max(0, cursor)));
}

/**
 * Formats a partially typed value as Brazilian Real (1.234,56).
 * Accepts comma or dot as decimal separator while typing.
 */
export function formatBRLInput(raw: string): string {
  if (!raw) return '';

  const trimmed = raw.trim();
  const negative = trimmed.startsWith('-');
  const s = trimmed.replace(/[^\d.,]/g, '');
  if (!s) return negative ? '-' : '';

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  let integerRaw: string;
  let decimalRaw: string | undefined;
  let keepDecimalSep = false;

  if (hasComma) {
    const lastComma = s.lastIndexOf(',');
    integerRaw = s.slice(0, lastComma).replace(/\D/g, '');
    decimalRaw = s.slice(lastComma + 1).replace(/\D/g, '').slice(0, 2);
    keepDecimalSep = true;
  } else if (hasDot) {
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      integerRaw = parts[0].replace(/\D/g, '');
      decimalRaw = parts[1].replace(/\D/g, '');
      keepDecimalSep = true;
    } else {
      integerRaw = s.replace(/\D/g, '');
    }
  } else {
    integerRaw = s.replace(/\D/g, '');
  }

  integerRaw = integerRaw.replace(/^0+(?=\d)/, '');

  if (!integerRaw) {
    if (keepDecimalSep) integerRaw = '0';
    else return negative ? '-' : '';
  }

  const formattedInteger = integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatted = keepDecimalSep
    ? `${formattedInteger},${decimalRaw ?? ''}`
    : formattedInteger;

  return negative ? `-${formatted}` : formatted;
}

/** Parses a BRL-formatted string ("1.234,56" or "32.5") into a number. */
export function parseBRL(value: string): number {
  if (!value?.trim()) return NaN;

  const s = value.trim();
  const hasComma = s.includes(',');
  const dotCount = (s.match(/\./g) || []).length;

  if (!hasComma && dotCount === 1) {
    const dec = s.split('.')[1] ?? '';
    if (dec.length <= 2) {
      return parseFloat(s.replace(/[^\d.-]/g, ''));
    }
  }

  return parseFloat(s.replace(/\./g, '').replace(',', '.'));
}

/** Formats a numeric value as BRL for display (e.g. 1234.5 → "1.234,50"). */
export function formatNumberToBRL(value: number): string {
  if (!Number.isFinite(value)) return '';

  const negative = value < 0;
  const [int, dec] = Math.abs(value).toFixed(2).split('.');
  const formatted = formatBRLInput(`${int},${dec}`);
  return negative ? `-${formatted}` : formatted;
}
