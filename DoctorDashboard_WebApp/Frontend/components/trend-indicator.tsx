import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'neutral';
  className?: string;
}

export function TrendIndicator({ trend, className }: TrendIndicatorProps) {
  return (
    <span className={className}>
      {trend === 'up' && <ArrowUp className="inline h-4 w-4 text-destructive" />}
      {trend === 'down' && <ArrowDown className="inline h-4 w-4 text-success" />}
      {trend === 'neutral' && <Minus className="inline h-4 w-4 text-muted-foreground" />}
    </span>
  );
}