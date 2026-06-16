import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { FolderOpen, Clock, AlertTriangle, CheckCircle, Image, FileText } from 'lucide-react';
import type { ProcessRecord } from '@/types';
import { formatDate, formatDuration, formatNumber, formatFileSize } from '@/utils/formatters';
import { STATUS_LABELS } from '@/types/constants';
import { cn } from '@/lib/utils';

interface RecordDetailProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProcessRecord | null;
}

export const RecordDetail = ({ isOpen, onClose, record }: RecordDetailProps) => {
  if (!record) return null;

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'success' : 'danger';
  };

  const getPlatformLogo = (name: string) => {
    switch (name) {
      case '淘宝': return '🛒';
      case '京东': return '📦';
      case '拼多多': return '🍎';
      case '抖音小店': return '🎵';
      default: return '📷';
    }
  };

  const stats = [
    {
      label: '处理图片',
      value: formatNumber(record.totalImages),
      icon: Image,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: '发现问题',
      value: formatNumber(record.issueCount),
      icon: AlertTriangle,
      color: record.issueCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600',
    },
    {
      label: '处理耗时',
      value: formatDuration(record.endTime - record.startTime),
      icon: Clock,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: '处理状态',
      value: STATUS_LABELS[record.status],
      icon: record.status === 'completed' ? CheckCircle : AlertTriangle,
      color: record.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="处理记录详情"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl">
            {getPlatformLogo(record.platformName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-900">{record.platformName}</h3>
              <Badge variant={getStatusColor(record.status)}>
                {STATUS_LABELS[record.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <FolderOpen className="w-4 h-4" />
              <span className="font-mono">{record.folderPath}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg text-center">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <Card>
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              处理时间线
            </h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="w-0.5 h-full bg-gray-200" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-gray-900">开始处理</p>
                  <p className="text-xs text-gray-500">{formatDate(record.startTime)}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">处理完成</p>
                  <p className="text-xs text-gray-500">{formatDate(record.endTime)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">处理摘要</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">平台名称</span>
                <span className="font-medium text-gray-900">{record.platformName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">记录ID</span>
                <span className="font-mono text-gray-900">{record.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">处理图片数</span>
                <span className="font-medium text-gray-900">{formatNumber(record.totalImages)} 张</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">问题图片数</span>
                <span className={cn('font-medium', record.issueCount > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                  {formatNumber(record.issueCount)} 张
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">合格率</span>
                <span className="font-medium text-gray-900">
                  {record.totalImages > 0
                    ? (((record.totalImages - record.issueCount) / record.totalImages) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">平均处理速度</span>
                <span className="font-medium text-gray-900">
                  {record.endTime > record.startTime
                    ? ((record.totalImages / (record.endTime - record.startTime)) * 1000).toFixed(1)
                    : 0} 张/秒
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose}>
          关闭
        </Button>
        {record.reportPath && (
          <Button variant="primary">
            下载报告
          </Button>
        )}
      </div>
    </Modal>
  );
};
