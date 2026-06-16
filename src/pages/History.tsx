import { useState } from 'react';
import { History as HistoryIcon, Trash2, Download, AlertTriangle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { HistoryTable } from '@/components/history/HistoryTable';
import { RecordDetail } from '@/components/history/RecordDetail';
import { useAppStore } from '@/store/appStore';
import type { ProcessRecord } from '@/types';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { formatNumber } from '@/utils/formatters';

export default function History() {
  const { processRecords, setProcessRecords } = useAppStore();
  const [selectedRecord, setSelectedRecord] = useState<ProcessRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleViewDetail = (record: ProcessRecord) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  const handleClearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      setProcessRecords([]);
      setShowClearConfirm(false);
    }
  };

  const totalImages = processRecords.reduce((sum, r) => sum + r.totalImages, 0);
  const totalIssues = processRecords.reduce((sum, r) => sum + r.issueCount, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">历史记录</h1>
            <p className="text-gray-500 mt-1">
              查看过往的图片处理记录，支持追溯和重新导出报告
            </p>
          </div>
          {processRecords.length > 0 && (
            <Button variant="danger" onClick={() => setShowClearConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              清空记录
            </Button>
          )}
        </div>

        {processRecords.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">总处理批次</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(processRecords.length)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">总处理图片</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(totalImages)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">总发现问题</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(totalIssues)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <HistoryTable records={processRecords} onViewDetail={handleViewDetail} />

        <RecordDetail
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          record={selectedRecord}
        />

        <Modal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          title="确认清空"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              确定要清空所有 <span className="font-semibold text-gray-900">{formatNumber(processRecords.length)}</span> 条历史记录吗？
              此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
                取消
              </Button>
              <Button variant="danger" onClick={handleClearHistory}>
                确认清空
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
