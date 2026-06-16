import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
}

export const QuickActionCard = ({ title, description, icon: Icon, gradient, onClick }: QuickActionCardProps) => {
  return (
    <Card hover onClick={onClick} className="group border-2 border-transparent hover:border-blue-200">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0',
              gradient,
            )}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-all group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Card>
  );
};
