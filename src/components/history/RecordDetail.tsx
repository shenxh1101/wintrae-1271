import { useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import {
  FolderOpen, Clock, AlertTriangle, CheckCircle, FileText, Package, FolderKanban, Image, Search, ChevronDown, ChevronRight, ChevronUp,
} from 'lucide-react';
import type { ProcessRecord, ImageRecord, ProductGroup } from '@/types';
import {
  formatDate, formatDuration, formatNumber, formatFileSize
} from '@/utils/formatters';
import {
  STATUS_LABELS, SEVERITY_COLORS, IMAGE_TYPE_LABELS, ISSUE_TYPE_LABELS, SEVERITY_LABELS,
} from '@/types/constants';
import { cn } from '@/lib/utils';

interface RecordDetailProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProcessRecord | null;
}

type TabType = 'overview' | 'images' | 'issues' | 'groups' | 'exports';

export const RecordDetail = ({ isOpen, onClose, record }: RecordDetailProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [issueFilter, setIssueFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const issueStats = useMemo(() => {
    if (!record?.images) return { total: 0, byType: {} as Record<string, number>, bySeverity: {} as Record<string, number> };
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let total = 0;
    for (const img of record.images) {
      for (const issue of img.issues) {
        if (issue.resolved) continue;
        total++;
        byType[issue.type] = (byType[issue.type] || 0) + 1;
        bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
      }
    }
    return { total, byType, bySeverity };
  }, [record]);

  if (!record) return null;

  const getPlatformLogo = (name: string) => {
    switch (name) {
      case '淘宝': return '🛒';
      case '京东': return '📦';
      case '拼多多': return '🍎';
      case '抖音小店': return '🎵';
      default: return '📷';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'success' : 'danger';
  };

  const stats = [
    { label: '处理图片', value: formatNumber(record.totalImages), icon: Image, color: 'bg-blue-100 text-blue-600' },
    { label: '发现问题', value: formatNumber(record.issueCount), icon: AlertTriangle, color: record.issueCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600' },
    { label: '处理耗时', value: formatDuration(record.endTime - record.startTime), icon: Clock, color: 'bg-purple-100 text-purple-600' },
    { label: '处理状态', value: STATUS_LABELS[record.status], icon: record.status === 'completed' ? CheckCircle : AlertTriangle, color: record.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600' },
  ];

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'overview', label: '概览', icon: FileText },
    { key: 'images', label: `图片清单 (${record.images?.length || 0})`, icon: Image },
    { key: 'issues', label: `问题明细 (${issueStats.total})`, icon: AlertTriangle },
    { key: 'groups', label: `商品分组 (${record.groups?.length || 0})`, icon: FolderKanban },
    { key: 'exports', label: '导出文件', icon: Package },
  ];

  const filteredImages = (record.images || []).filter(
    (img: ImageRecord) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        img.productCode.toLowerCase().includes(term) ||
        img.originalName.toLowerCase().includes(term) ||
        img.newName.toLowerCase().includes(term)
      );
    },
  );

  const filteredIssues = useMemo(() => {
    if (!record.images) return [] as { img: ImageRecord; issue: any }[];
    const list: { img: ImageRecord; issue: any }[] = [];
    for (const img of record.images) {
      for (const issue of img.issues) {
        if (issue.resolved) continue;
        if (issueFilter !== 'all' && issue.type !== issueFilter) continue;
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          if (
            !img.productCode.toLowerCase().includes(term) &&
            !img.originalName.toLowerCase().includes(term) &&
            !issue.description.toLowerCase().includes(term)
          ) continue;
        }
        list.push({ img, issue });
      }
    }
    return list;
  }, [record, issueFilter, searchTerm]);

  const filteredGroups = useMemo(() => {
    if (!record.groups) return [] as ProductGroup[];
    return record.groups.filter((g: ProductGroup) => {
      if (groupFilter === 'missing' && g.missingAngles.length === 0) return false;
      if (groupFilter === 'hasIssues') {
        const groupImages = record.images?.filter((im: ImageRecord) => g.imageIds.includes(im.id)) || [];
        const hasIssue = groupImages.some((im) => im.issues.some((i) => !i.resolved));
        if (!hasIssue) return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!g.productCode.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [record, groupFilter, searchTerm]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="处理记录详情" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
            {getPlatformLogo(record.platformName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900">{record.platformName}</h3>
              <Badge variant={getStatusColor(record.status)}>{STATUS_LABELS[record.status]}</Badge>
              {record.exportContent && <Badge variant="info">已导出</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <FolderOpen className="w-4 h-4 flex-shrink-0" />
              <span className="font-mono truncate">{record.folderPath}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {stats.map((s, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg text-center">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2', s.color)}>
                <s.icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
              <p className="text-base font-semibold text-gray-900 truncate">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                activeTab === t.key
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px max-h-[50vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm">处理摘要</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">平台名称</span>
                      <span className="font-medium">{record.platformName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">记录ID</span>
                      <span className="font-mono text-xs">{record.id}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">图片总数</span>
                      <span className="font-medium">{formatNumber(record.totalImages)} 张</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">问题图片数</span>
                      <span className={cn('font-medium', record.issueCount > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                        {formatNumber(record.issueCount)} 张
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">合格率</span>
                      <span className="font-medium">
                        {record.totalImages > 0
                          ? (((record.totalImages - record.issueCount) / record.totalImages) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">处理速度</span>
                      <span className="font-medium">
                        {record.endTime > record.startTime
                          ? ((record.totalImages / (record.endTime - record.startTime)) * 1000).toFixed(1)
                          : 0} 张/秒
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {record.groups && record.groups.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm flex items-center gap-1.5">
                      <FolderKanban className="w-4 h-4" />
                      商品完整性统计
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-2 bg-blue-50 rounded text-center">
                        <p className="text-gray-500">商品总数</p>
                        <p className="text-lg font-bold text-blue-700">{record.groups.length}</p>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded text-center">
                        <p className="text-gray-500">有主图</p>
                        <p className="text-lg font-bold text-emerald-700">
                          {record.groups.filter((g: ProductGroup) => g.hasMainImage).length}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded text-center">
                        <p className="text-gray-500">有细节图</p>
                        <p className="text-lg font-bold text-purple-700">
                          {record.groups.filter((g: ProductGroup) => g.hasDetailImages).length}
                        </p>
                      </div>
                      <div className="p-2 bg-amber-50 rounded text-center">
                        <p className="text-gray-500">缺角度</p>
                        <p className="text-lg font-bold text-amber-700">
                          {record.groups.filter((g: ProductGroup) => g.missingAngles.length > 0).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {issueStats.total > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      问题类型分布
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(issueStats.byType).map(([type, count]) => {
                        const pct = (count / issueStats.total) * 100;
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">
                                {ISSUE_TYPE_LABELS[type as keyof typeof ISSUE_TYPE_LABELS] || type}
                              </span>
                              <span className="font-medium text-gray-900">
                                {formatNumber(count)} ({pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  SEVERITY_COLORS[
                                    Object.keys(issueStats.bySeverity).length > 0
                                      ? (Object.keys(issueStats.bySeverity)[0] as any)
                                      : 'warning'
                                  ],
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'images' && record.images && (
            <div className="space-y-3">
              {record.images.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索商品编码、文件名..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">商品编码</th>
                    <th className="px-3 py-2 text-left">文件名</th>
                    <th className="px-3 py-2 text-center">类型</th>
                    <th className="px-3 py-2 text-center">尺寸</th>
                    <th className="px-3 py-2 text-center">大小</th>
                    <th className="px-3 py-2 text-center">白底</th>
                    <th className="px-3 py-2 text-center">状态</th>
                    <th className="px-3 py-2 text-center">问题数</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredImages.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-gray-400 text-xs">
                          无匹配图片
                        </td>
                      </tr>
                    ) : (
                      filteredImages.map((img: ImageRecord) => (
                        <tr key={img.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs text-blue-600">{img.productCode}</td>
                          <td className="px-3 py-2">
                            <div className="truncate max-w-[180px]" title={img.originalName}>
                              {img.newName}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant="info">{IMAGE_TYPE_LABELS[img.imageType] || '未知'}</Badge>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600 font-mono text-xs">
                            {img.width}x{img.height}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600 text-xs">
                            {formatFileSize(img.fileSize)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={cn(
                                'text-xs font-medium',
                                img.whiteBackgroundRatio >= 0.9
                                  ? 'text-emerald-600'
                                  : img.whiteBackgroundRatio >= 0.85
                                    ? 'text-amber-600'
                                    : 'text-gray-400',
                              )}
                            >
                              {(img.whiteBackgroundRatio * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant={img.status === 'completed' ? 'success' : 'warning'}>
                              {img.status === 'completed' ? '合格' : '有问题'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={cn(
                              'font-semibold',
                              img.issues.filter((i) => !i.resolved).length > 0 ? 'text-amber-600' : 'text-emerald-600',
                            )}>
                              {formatNumber(img.issues.filter((i) => !i.resolved).length)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索..."
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <select
                  value={issueFilter}
                  onChange={(e) => setIssueFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">全部问题类型</option>
                  {Object.keys(ISSUE_TYPE_LABELS).map((k) => (
                    <option key={k} value={k}>
                      {ISSUE_TYPE_LABELS[k as keyof typeof ISSUE_TYPE_LABELS]}
                    </option>
                  ))}
                </select>
              </div>

              {filteredIssues.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm border border-dashed rounded-lg">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  没有问题记录
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredIssues.map(({ img, issue }, i) => (
                    <div
                      key={`${img.id}-${issue.id}`}
                      className="p-3 rounded-lg border border-gray-200 bg-white"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={(issue.severity === 'error' ? 'danger' : issue.severity) as any}>
                            {SEVERITY_LABELS[issue.severity] || issue.severity}
                          </Badge>
                          <Badge variant="gray">{ISSUE_TYPE_LABELS[issue.type] || issue.type}</Badge>
                          <span className="text-xs font-mono text-blue-600">{img.productCode}</span>
                          <span className="text-xs text-gray-500">{img.originalName}</span>
                        </div>
                        <span className="text-xs text-gray-400">#{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1">{issue.description}</p>
                      {issue.suggestion && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="text-emerald-600 font-medium">建议：</span>
                          {issue.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'groups' && record.groups && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {[
                    { value: 'all', label: '全部' },
                    { value: 'missing', label: '缺图' },
                    { value: 'hasIssues', label: '有问题' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGroupFilter(opt.value)}
                      className={cn(
                        'px-3 py-1 text-xs rounded-md transition-colors',
                        groupFilter === opt.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  共 {formatNumber(filteredGroups.length)} 个商品
                </span>
              </div>

              {filteredGroups.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm border border-dashed rounded-lg">
                  <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  没有符合条件的商品
                </div>
              ) : (
                filteredGroups.map((g: ProductGroup) => {
                  const groupImages = record.images?.filter((im: ImageRecord) => g.imageIds.includes(im.id)) || [];
                  const issueCount = groupImages.reduce((s, im) => s + im.issues.filter((i) => !i.resolved).length, 0);
                  const presentAngles = Array.from(new Set(groupImages.map((im) => im.angle).filter(Boolean)));

                  return (
                    <div key={g.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedGroup(expandedGroup === g.id ? null : g.id)}
                        className="w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          {expandedGroup === g.id ? (
                            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          )}
                          <span className="font-mono text-sm text-blue-600 font-medium">{g.productCode}</span>
                          <span className="text-xs text-gray-500">
                            {formatNumber(g.imageIds.length)} 张图
                          </span>
                          {issueCount > 0 && (
                            <Badge variant="warning">{formatNumber(issueCount)} 个问题</Badge>
                          )}
                          {g.missingAngles.length > 0 ? (
                            <Badge variant="danger">缺 {g.missingAngles.length} 个角度</Badge>
                          ) : (
                            <Badge variant="success">套图完整</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {g.hasMainImage && <Badge variant="success">主图</Badge>}
                          {g.hasDetailImages && <Badge variant="info">细节</Badge>}
                          {g.hasSceneImages && <Badge variant="gray">场景</Badge>}
                        </div>
                      </button>

                      {expandedGroup === g.id && record.images && (
                        <div className="p-3 bg-white border-t border-gray-100 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">已覆盖角度</span>
                              <div className="flex flex-wrap gap-1">
                                {presentAngles.length > 0 ? (
                                  presentAngles.map((a) => (
                                    <Badge key={a} variant="success">{a}</Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400">无</span>
                                )}
                              </div>
                            </div>
                            {g.missingAngles.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">缺失角度</span>
                                <div className="flex flex-wrap gap-1">
                                  {g.missingAngles.map((a) => (
                                    <Badge key={a} variant="danger">{a}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {(['main', 'detail', 'scene'] as const).map((type) => {
                              const typeImages = groupImages.filter((im) => im.imageType === type);
                              if (typeImages.length === 0) return null;
                              return (
                                <div key={type} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={type === 'main' ? 'success' : type === 'detail' ? 'info' : 'gray'}>
                                      {IMAGE_TYPE_LABELS[type]} ({formatNumber(typeImages.length)})
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 pl-2 border-l-2 border-gray-100 ml-2">
                                    {typeImages.map((im) => (
                                      <div key={im.id} className="py-1 px-2 rounded hover:bg-gray-50">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-gray-700 truncate max-w-[60%]">
                                            {im.newName}
                                          </span>
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            {im.angle && (
                                              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {im.angle}
                                              </span>
                                            )}
                                            {im.issues.filter((i) => !i.resolved).length > 0 ? (
                                              <span className="text-amber-600 font-medium">
                                                {formatNumber(im.issues.filter((i) => !i.resolved).length)} 个问题
                                              </span>
                                            ) : (
                                              <span className="text-emerald-600 text-[10px]">正常</span>
                                            )}
                                          </div>
                                        </div>
                                        {im.issues.filter((i) => !i.resolved).length > 0 && (
                                          <div className="mt-1 space-y-0.5 pl-2 border-l border-amber-200">
                                            {im.issues.filter((i) => !i.resolved).slice(0, 3).map((issue) => (
                                              <p key={issue.id} className="text-[10px] text-gray-500 truncate">
                                                <span className="text-amber-600">•</span> {issue.description}
                                              </p>
                                            ))}
                                            {im.issues.filter((i) => !i.resolved).length > 3 && (
                                              <p className="text-[10px] text-gray-400">
                                                还有 {formatNumber(im.issues.filter((i) => !i.resolved).length - 3)} 个问题...
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            {groupImages.filter((im) => im.imageType === 'unknown').length > 0 && (
                              <div className="space-y-1">
                                <Badge variant="gray">未知类型 ({formatNumber(groupImages.filter((im) => im.imageType === 'unknown').length)})</Badge>
                                <div className="space-y-1 pl-2 border-l-2 border-gray-100 ml-2">
                                  {groupImages.filter((im) => im.imageType === 'unknown').map((im) => (
                                    <div key={im.id} className="py-1 px-2 rounded hover:bg-gray-50 text-xs text-gray-500">
                                      {im.newName}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'exports' && (
            <div className="space-y-3">
              {!record.exportContent && !record.reportPath ? (
                <div className="p-12 text-center text-gray-400 text-sm border border-dashed rounded-lg">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  该批次尚未导出文件
                </div>
              ) : (
                <div className="space-y-2">
                  {record.reportPath && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">ZIP 导出包</p>
                          <p className="text-xs font-mono text-blue-700 mt-0.5">{record.reportPath}</p>
                        </div>
                        <Badge variant="success">已生成</Badge>
                      </div>
                    </div>
                  )}
                  {record.exportContent && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">待上传文件夹</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatNumber(record.exportContent.uploadFileCount)}
                        </p>
                        <p className="text-xs text-gray-400">张图片</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">压缩副本</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatNumber(record.exportContent.compressedFileCount)}
                        </p>
                        <p className="text-xs text-gray-400">张图片</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">问题报告条目</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatNumber(record.exportContent.issueFileCount)}
                        </p>
                        <p className="text-xs text-gray-400">条记录</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">人工复核列表</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatNumber(record.exportContent.reviewFileCount)}
                        </p>
                        <p className="text-xs text-gray-400">张需复核</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose}>
          关闭
        </Button>
      </div>
    </Modal>
  );
};
