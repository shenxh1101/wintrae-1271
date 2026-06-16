import { AlertTriangle, X, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ISSUE_TYPE_LABELS, SEVERITY_LABELS } from '@/types/constants';
import { useProcessStore } from '@/store/processStore';
import { cn } from '@/lib/utils';

export const IssueSummary = () => {
  const { currentBatch, getIssueSummary } = useProcessStore();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!currentBatch) return null;

  const issueSummary = getIssueSummary();
  const totalIssues = issueSummary.reduce((sum, item) => sum + item.count, 0);
  const images = currentBatch.images;

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <X className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-700';
      case 'warning': return 'text-amber-700';
      default: return 'text-blue-700';
    }
  };

  return (
    <Card className="border-2 border-amber-200 bg-amber-50/50">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-amber-900">问题清单</CardTitle>
              <p className="text-sm text-amber-700">
                共检测到 <span className="font-bold">{totalIssues}</span> 个问题，涉及{' '}
                <span className="font-bold">
                  {images.filter((img) => img.issues.some((i) => !i.resolved)).length}
                </span>{' '}
                张图片
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">{totalIssues} 个待处理</Badge>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-amber-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-amber-600" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {issueSummary.map((item) => (
              <div
                key={item.type}
                className={cn(
                  'p-4 rounded-lg border transition-all hover:shadow-md',
                  getBgColor(item.severity),
                )}
              >
                <div className="flex items-center gap-3">
                  {getIcon(item.severity)}
                  <div>
                    <p className={cn('font-semibold', getTextColor(item.severity))}>
                      {ISSUE_TYPE_LABELS[item.type] || item.type}
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {item.count}
                      <span className={cn('text-sm font-normal ml-1', getTextColor(item.severity))}>
                        项
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-xs text-gray-500">严重程度:</span>
                  <span className={cn('text-xs font-medium', getTextColor(item.severity))}>
                    {SEVERITY_LABELS[item.severity]}
                  </span>
                </div>
              </div>
            ))}

            {issueSummary.length === 0 && (
              <div className="col-span-full py-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-emerald-700 font-medium text-lg">太棒了！没有检测到问题</p>
                <p className="text-emerald-600 text-sm mt-1">所有图片都符合平台规范</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
