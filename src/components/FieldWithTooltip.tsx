import { useLayoutEffect, useRef, type ChangeEvent } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  countDigitsBefore,
  formatBRLInput,
  mapDigitCursor,
} from '@/lib/currency';
import { cn } from '@/lib/utils';

interface FieldWithTooltipProps {
  label: string;
  tooltip: string;
  source?: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  suffix?: string;
  disabled?: boolean;
  onBlur?: () => void;
  currency?: boolean;
}

export function FieldWithTooltip({
  label,
  tooltip,
  source,
  id,
  type = 'number',
  placeholder,
  value,
  onChange,
  suffix,
  disabled,
  onBlur,
  currency = suffix === 'R$',
}: FieldWithTooltipProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (currency && cursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  }, [value, currency]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!currency) {
      onChange(e.target.value);
      return;
    }

    const raw = e.target.value;
    const cursor = e.target.selectionStart ?? raw.length;
    const formatted = formatBRLInput(raw);
    const digitsBefore = countDigitsBefore(raw, cursor);
    const typedSep = raw[cursor - 1] === ',' || raw[cursor - 1] === '.';

    let nextCursor = mapDigitCursor(formatted, digitsBefore);
    if (typedSep) {
      const sepPos = formatted.indexOf(',');
      const integerDigits = countDigitsBefore(formatted, sepPos === -1 ? formatted.length : sepPos);
      if (sepPos !== -1 && digitsBefore === integerDigits) {
        nextCursor = sepPos + 1;
      }
    }

    cursorRef.current = nextCursor;
    onChange(formatted);
  };

  const displayValue = currency ? formatBRLInput(String(value ?? '')) : value;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
          {label}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs bg-popover border-border">
            <p className="text-sm">{tooltip}</p>
            {source && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {source}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type={currency ? 'text' : type}
          inputMode={currency ? 'decimal' : undefined}
          autoComplete={currency ? 'off' : undefined}
          step={currency ? undefined : 'any'}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          className={cn(
            'bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 font-mono',
            suffix && 'pr-10',
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
