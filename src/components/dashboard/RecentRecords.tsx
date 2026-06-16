import { useNavigate } from 'react-router-dom';
import { Clock, Download, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { useAppStore } from '@/store/appStore';
import { formatDate, formatDuration } from '@/utils/formatters';

export const RecentRecords = () => {
  const navigate = useNavigate();
  const { processRecords } = useAppStore();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-900" />
            <CardTitle>最近处理记录</CardTitle>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {processRecords.slice(0, 5).map((record, index) => (
            <div
              key={record.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <span className="text-blue-800 font-semibold text-sm">{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{record.platformName === '淘宝' ? '🛒' : record.platformName === '京东' ? '📦' : '🍎'}</span>
                  <p className="font-medium text-gray-900 truncate">{record.folderPath}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>{formatDate(record.startTime)}</span>
                  <span>{formatDuration(record.endTime - record.startTime)}</span>
                  <span>{record.totalImages} 张图片</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {record.issueCount > 0 ? (
                  <Badge variant="warning">{record.issueCount} 个问题</Badge>
                ) : (
                  <Badge variant="success">无问题</Badge>
                )}

                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
