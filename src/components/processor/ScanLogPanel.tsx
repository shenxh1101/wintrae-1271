import { useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { getScanLogs } from '@/services/fileService';
import type { ScanLog } from '@/types';
import { formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const STATUS_META: Record<ScanLog['status'], { label: string; variant: any; icon: any; color: string }> = {
  success: { label: '成功', variant: 'success', icon: CheckCircle2, color: 'text-emerald-600' },
  warning: { label: '警告', variant: 'warning', icon: AlertTriangle, color: 'text-amber-600' },
  error: { label: '失败', variant: 'danger', icon: XCircle, color: 'text-red-600' },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface ScanLogPanelProps {
  visible: boolean;
}

export const ScanLogPanel = ({ visible }: ScanLogPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);

  useEffect(() => {
    if (!visible) return;
    setLogs(getScanLogs());
    const timer = setInterval(() => setLogs(getScanLogs()), 2000);
    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  const latest = logs[0];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">监控扫描记录</span>
          <Badge variant="info">{formatNumber(logs.length)} 条</Badge>
          {latest && (
            <span className="text-xs text-gray-500">
              最近: {formatTime(latest.timestamp)}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-400">暂无扫描记录</div>
          ) : (
            logs.map((log) => {
              const meta = STATUS_META[log.status];
              const Icon = meta.icon;
              return (
                <div
                  key={log.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded text-xs',
                    log.status === 'error'
                      ? 'bg-red-50'
                      : log.status === 'warning'
                      ? 'bg-amber-50'
                      : 'bg-gray-50',
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', meta.color)} />
                  <span className="text-gray-500 font-mono flex-shrink-0 w-16">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className="text-gray-800 flex-1 truncate">{log.message}</span>
                  {log.newFileCount > 0 && (
                    <Badge variant="warning">+{formatNumber(log.newFileCount)} 张</Badge>
                  )}
                  {log.totalFileCount > 0 && (
                    <span className="text-gray-500 whitespace-nowrap">
                      共 {formatNumber(log.totalFileCount)} 张
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
