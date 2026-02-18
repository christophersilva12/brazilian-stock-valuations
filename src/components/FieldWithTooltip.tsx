import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
}: FieldWithTooltipProps) {
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
          id={id}
          type={type}
          step="any"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className="bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 font-mono"
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
