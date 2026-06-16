import { useState } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import type { ProcessRecord } from '@/types';
import { formatDate, formatDuration, formatNumber } from '@/utils/formatters';
import { STATUS_LABELS, SEVERITY_COLORS } from '@/types/constants';
import { cn } from '@/lib/utils';

interface HistoryTableProps {
  records: ProcessRecord[];
  onViewDetail: (record: ProcessRecord) => void;
}

export const HistoryTable = ({ records, onViewDetail }: HistoryTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredRecords = records.filter(
    (record) =>
      record.platformName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.folderPath.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'success' : 'danger';
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="搜索平台名称或路径..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="text-sm text-gray-500">
            共 <span className="font-medium text-gray-900">{formatNumber(filteredRecords.length)}</span> 条记录
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                平台
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                处理路径
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                图片数量
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                问题数量
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                处理耗时
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                处理时间
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  暂无处理记录
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {record.platformName === '淘宝' && '🛒'}
                        {record.platformName === '京东' && '📦'}
                        {record.platformName === '拼多多' && '🍎'}
                        {record.platformName === '抖音小店' && '🎵'}
                        {!['淘宝', '京东', '拼多多', '抖音小店'].includes(record.platformName) && '📷'}
                      </span>
                      <span className="font-medium text-gray-900">{record.platformName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 font-mono" title={record.folderPath}>
                      {record.folderPath.length > 40
                        ? record.folderPath.substring(0, 40) + '...'
                        : record.folderPath}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-gray-900">{formatNumber(record.totalImages)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'font-medium',
                        record.issueCount > 0 ? 'text-amber-600' : 'text-emerald-600',
                      )}
                    >
                      {formatNumber(record.issueCount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-600">
                      {formatDuration(record.endTime - record.startTime)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-600 text-sm">
                      {formatDate(record.startTime)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={getStatusColor(record.status)}>
                      {STATUS_LABELS[record.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(record)}
                        className="px-2 py-1"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {record.reportPath && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 py-1 text-emerald-600 hover:text-emerald-700"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded text-sm font-medium transition-colors',
                    currentPage === pageNum
                      ? 'bg-blue-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
