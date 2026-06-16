import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  gradient: string;
  iconBg: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, gradient, iconBg }: StatCardProps) => {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className={cn('p-6 bg-gradient-to-br', gradient)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-white text-3xl font-bold mt-2">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-3">
                {trend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-300" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend >= 0 ? 'text-emerald-300' : 'text-red-300',
                  )}
                >
                  {trend >= 0 ? '+' : ''}
                  {trend}%
                </span>
                <span className="text-white/60 text-sm">较昨日</span>
              </div>
            )}
          </div>
          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', iconBg)}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
    </Card>
  );
};
