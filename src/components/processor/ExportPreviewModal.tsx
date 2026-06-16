import { useState, useMemo } from 'react';
import { FileImage, Archive, FileSpreadsheet, FileCheck, Package, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, FolderTree, Image as ImageIcon } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { calculateExportPreview } from '@/services/exportService';
import { useAppStore } from '@/store/appStore';
import { useProcessStore } from '@/store/processStore';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import type { ProcessBatch } from '@/types';
import { formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPreviewModal = ({ isOpen, onClose }: ExportPreviewModalProps) => {
  const { exportConfig, setExportConfig } = useAppStore();
  const { currentBatch, isProcessing } = useProcessStore();
  const { handleExport } = useImageProcessor();
  const [isExporting, setIsExporting] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [showUploadDetail, setShowUploadDetail] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!currentBatch) return null;
    return calculateExportPreview(currentBatch as ProcessBatch, exportConfig);
  }, [currentBatch, exportConfig]);

  const toggleOption = (key: keyof typeof exportConfig) => {
    if (key === 'compressionQuality') return;
    setExportConfig({ [key]: !(exportConfig[key] as boolean) });
  };

  const handleConfirm = async () => {
    setIsExporting(true);
    try {
      await handleExport();
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  if (!preview || !currentBatch) return null;

  const items = [
    {
      key: 'generateUploadFolder' as const,
      enabled: exportConfig.generateUploadFolder,
      title: '待上传文件夹',
      description: '按商品编码分文件夹整理，规范命名后的原图',
      icon: Package,
      iconBg: 'bg-blue-100 text-blue-600',
      badge: `共 ${formatNumber(preview.upload.products)} 个商品 / ${formatNumber(preview.upload.count)} 张图片`,
      badgeColor: 'info',
    },
    {
      key: 'generateCompressed' as const,
      enabled: exportConfig.generateCompressed,
      title: '压缩副本',
      description: `质量 ${Math.round(exportConfig.compressionQuality * 100)}%，预计节省约 ${preview.compressed.sizeSaved}`,
      icon: Archive,
      iconBg: 'bg-purple-100 text-purple-600',
      badge: `共 ${formatNumber(preview.compressed.count)} 张图片`,
      badgeColor: 'gray',
    },
    {
      key: 'generateIssueReport' as const,
      enabled: exportConfig.generateIssueReport,
      title: '问题报告',
      description: '问题报告.xlsx + 问题清单.csv，包含完整问题明细',
      icon: FileSpreadsheet,
      iconBg: 'bg-amber-100 text-amber-600',
      badge: `${formatNumber(preview.issue.count)} 个问题条目`,
      badgeColor: 'warning',
    },
    {
      key: 'generateReviewList' as const,
      enabled: exportConfig.generateReviewList,
      title: '人工复核列表',
      description: 'TXT 格式，列出临界、未知类型等需人工确认的图片',
      icon: FileCheck,
      iconBg: 'bg-emerald-100 text-emerald-600',
      badge: `${formatNumber(preview.review.count)} 张需复核`,
      badgeColor: 'success',
    },
  ];

  const enabledCount = items.filter((i) => i.enabled).length;
  const totalFileCount =
    preview.upload.count +
    preview.compressed.count +
    (exportConfig.generateIssueReport ? 2 : 0) +
    (exportConfig.generateReviewList ? 1 : 0) +
    1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="导出预览" size="lg">
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <FileImage className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">本次导出内容</h3>
            <p className="text-sm text-gray-500">
              处理批次：{currentBatch.id} · 共 {formatNumber(currentBatch.images.length)} 张图片
            </p>
          </div>
          <Badge variant="info">
            {formatNumber(enabledCount)} / 4 项已启用
          </Badge>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.key}
              className={cn(
                'p-4 border rounded-lg transition-all',
                item.enabled
                  ? 'border-blue-200 bg-blue-50/30'
                  : 'border-gray-200 bg-gray-50/50 opacity-70',
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleOption(item.key)}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors',
                    item.enabled
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300 hover:border-gray-400',
                  )}
                >
                  {item.enabled && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', item.iconBg)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    {item.enabled && (
                      <Badge variant={item.badgeColor as any}>{item.badge}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>

                  {item.key === 'generateCompressed' && item.enabled && (
                    <div className="mt-3 bg-white rounded p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">压缩质量</label>
                        <span className="text-xs font-semibold text-blue-600">
                          {Math.round(exportConfig.compressionQuality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.05"
                        value={exportConfig.compressionQuality}
                        onChange={(e) =>
                          setExportConfig({ compressionQuality: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>小文件（50%）</span>
                        <span>高质量（100%）</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-amber-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowValidation(!showValidation)}
            className="w-full p-3 bg-amber-50 hover:bg-amber-100/70 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-900">批次校验结果</span>
              <Badge variant="warning">
                {preview.validation.missingProducts > 0
                ? `${formatNumber(preview.validation.missingProducts)} 个商品缺图`
                : '套图完整'}
              </Badge>
            </div>
            {showValidation ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {showValidation && (
            <div className="p-3 bg-white border-t border-amber-100 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-gray-50 rounded text-center">
                  <p className="text-lg font-bold text-gray-900">{formatNumber(preview.validation.totalProducts)}</p>
                  <p className="text-xs text-gray-500">商品总数</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded text-center">
                  <p className="text-lg font-bold text-emerald-600">{formatNumber(preview.validation.completeProducts)}</p>
                  <p className="text-xs text-gray-500">套图完整</p>
                </div>
                <div className="p-2 bg-amber-50 rounded text-center">
                  <p className="text-lg font-bold text-amber-600">{formatNumber(preview.validation.missingProducts)}</p>
                  <p className="text-xs text-gray-500">缺少角度</p>
                </div>
              </div>

              {preview.validation.missingList.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-600">缺图商品清单：</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {(showAllMissing ? preview.validation.missingList : preview.validation.missingList.slice(0, 5)).map((item) => (
                      <div
                        key={item.productCode}
                        className="flex items-center justify-between py-1.5 px-2 bg-amber-50/50 rounded text-xs"
                      >
                        <span className="font-mono text-blue-600">{item.productCode}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">{formatNumber(item.imageCount)} 张</span>
                          <Badge variant="danger">缺 {item.missingAngles.length} 个</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  {preview.validation.missingList.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMissing(!showAllMissing)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      {showAllMissing ? '收起' : `查看全部 ${formatNumber(preview.validation.missingList.length)} 个商品 →`}
                    </button>
                  )}
                </div>
              )}

              {preview.validation.missingList.length === 0 && (
                <div className="text-center py-3 text-emerald-600 text-sm">
                  所有商品套图完整，可以直接导出 ✅
                </div>
              )}
            </div>
          )}
        </div>

        {exportConfig.generateUploadFolder && preview.uploadByProduct.length > 0 && (
          <div className="border border-blue-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowUploadDetail(!showUploadDetail)}
              className="w-full p-3 bg-blue-50 hover:bg-blue-100/70 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">待上传包内容明细</span>
                <Badge variant="info">
                  {formatNumber(preview.uploadByProduct.length)} 个商品 · {formatNumber(preview.upload.count)} 张有效
                  {preview.uploadByProduct.reduce((s, p) => s + p.excludedCount, 0) > 0 && (
                    <span className="ml-1">· {formatNumber(preview.uploadByProduct.reduce((s, p) => s + p.excludedCount, 0))} 张被排除</span>
                  )}
                </Badge>
              </div>
              {showUploadDetail ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showUploadDetail && (
              <div className="p-3 bg-white border-t border-blue-100 space-y-2 max-h-80 overflow-y-auto">
                {preview.uploadByProduct.map((pg) => (
                  <div key={pg.productCode} className="border border-gray-100 rounded">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedProduct(expandedProduct === pg.productCode ? null : pg.productCode)
                      }
                      className="w-full p-2 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {expandedProduct === pg.productCode ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="font-mono text-sm font-semibold text-blue-700">{pg.productCode}</span>
                        <Badge variant="gray">{formatNumber(pg.images.length)} 张</Badge>
                        {pg.excludedCount > 0 && (
                          <Badge variant="danger">{formatNumber(pg.excludedCount)} 张被排除</Badge>
                        )}
                      </div>
                    </button>

                    {expandedProduct === pg.productCode && (
                      <div className="px-2 pb-2 space-y-1 border-t border-gray-100 pt-2">
                        {pg.images.map((img, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded text-xs',
                              img.excluded ? 'bg-red-50' : 'bg-gray-50',
                            )}
                          >
                            <ImageIcon className={cn('w-4 h-4 flex-shrink-0', img.excluded ? 'text-red-400' : 'text-blue-400')} />
                            <span className="font-mono text-gray-900 flex-1 truncate">{img.fileName}</span>
                            <Badge variant="gray">
                              {img.imageType === 'main' ? '主图' : img.imageType === 'detail' ? '细节' : img.imageType === 'scene' ? '场景' : '未知'}
                              {img.angle ? ` · ${img.angle}` : ''}
                            </Badge>
                            {img.fileSize != null && (
                              <span className="text-gray-500 whitespace-nowrap">
                                {img.fileSize < 1024 * 1024
                                  ? `${Math.round(img.fileSize / 1024)} KB`
                                  : `${(img.fileSize / 1024 / 1024).toFixed(1)} MB`}
                              </span>
                            )}
                            {img.excluded && (
                              <Badge variant="danger">{img.excludedReason}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                导出后将生成 <span className="font-semibold text-gray-900">{formatNumber(totalFileCount)}</span> 个文件，
                打包为 ZIP 压缩包下载
              </p>
              <p className="text-xs text-gray-400 mt-1">
                * 始终包含「处理总结.txt」说明文件
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">ZIP 根目录</p>
              <p className="text-sm font-mono text-blue-700">平台名_图片处理_时间戳/</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose} disabled={isExporting}>
          取消
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isExporting || isProcessing || enabledCount === 0}
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              正在导出...
            </>
          ) : (
            <>
              <Archive className="w-4 h-4 mr-2" />
              确认导出 ZIP
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};
