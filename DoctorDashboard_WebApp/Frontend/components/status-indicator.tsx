import { PatientStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: PatientStatus;
  showLabel?: boolean;
  className?: string;
  patient_status?: PatientStatus;
}

export function StatusIndicator({ status, showLabel = false, className, patient_status }: StatusIndicatorProps) {
  const statusLabels = {
    urgent: 'Urgent',
    warning: 'Needs Attention',
    stable: 'Stable',
  };

  return (
    <div className={cn('flex items-center', className)}>
      <span className={cn('status-dot', `status-${status}`)} />
      {showLabel && <span className="text-sm font-medium">{statusLabels[status]}</span>}
    </div>
  );
}