import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar = ({
  progress,
  label,
  showPercentage = false,
  variant = 'primary',
  size = 'md',
  className,
}: ProgressBarProps) => {
  const variants = {
    primary: 'bg-blue-900',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-red-600',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between mb-1.5 text-sm">
          {label && <span className="text-gray-600">{label}</span>}
          {showPercentage && <span className="font-medium text-gray-900">{clampedProgress}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variants[variant],
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
