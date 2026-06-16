import { Loader2 } from 'lucide-react';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useProcessStore } from '@/store/processStore';
import { cn } from '@/lib/utils';

export const ProcessingOverlay = () => {
  const { isProcessing, progress, currentStep, currentBatch } = useProcessStore();

  if (!isProcessing) return null;

  const steps = [
    { label: '加载图片', threshold: 0 },
    { label: '分析图片', threshold: 50 },
    { label: '检测问题', threshold: 70 },
    { label: '分组整理', threshold: 90 },
    { label: '处理完成', threshold: 100 },
  ];

  const currentStepIndex = steps.findIndex((s, i) => {
    const nextThreshold = steps[i + 1]?.threshold || 100;
    return progress >= s.threshold && progress < nextThreshold;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {currentBatch?.totalImages || 0}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">正在处理图片</h2>
          <p className="text-gray-500">{currentStep || '准备中...'}</p>
        </div>

        <ProgressBar
          progress={progress}
          showPercentage
          size="lg"
          className="mb-8"
        />

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = progress >= step.threshold && index !== steps.length - 1;
            const isFinalCompleted = progress >= 100 && index === steps.length - 1;

            return (
              <div
                key={step.label}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-all',
                  isActive && 'bg-blue-50 ring-1 ring-blue-200',
                  (isCompleted || isFinalCompleted) && 'bg-emerald-50',
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    isActive && 'bg-blue-600 text-white',
                    (isCompleted || isFinalCompleted) && 'bg-emerald-600 text-white',
                    !isActive && !isCompleted && !isFinalCompleted && 'bg-gray-200 text-gray-500',
                  )}
                >
                  {isCompleted || isFinalCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'font-medium',
                    isActive && 'text-blue-700',
                    (isCompleted || isFinalCompleted) && 'text-emerald-700',
                    !isActive && !isCompleted && !isFinalCompleted && 'text-gray-400',
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            请勿关闭页面，处理完成后会自动提示
          </p>
        </div>
      </div>
    </div>
  );
};
