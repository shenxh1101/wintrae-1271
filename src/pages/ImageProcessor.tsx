import { useState } from 'react';
import { Upload, FolderOpen, Download, RotateCcw, Filter, CheckSquare, Square, Eye, EyeOff, Radar, StopCircle, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { ProcessingOverlay } from '@/components/processor/ProcessingOverlay';
import { IssueSummary } from '@/components/processor/IssueSummary';
import { ProductGroups } from '@/components/processor/ProductGroups';
import { ImageCard } from '@/components/processor/ImageCard';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { useProcessStore } from '@/store/processStore';
import { useAppStore } from '@/store/appStore';
import { useFileWatcher } from '@/hooks/useFileWatcher';
import { formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { ImageItem } from '@/types';

export default function ImageProcessor() {
  const {
    handleSelectFiles,
    handleSelectFolder,
    handleExport,
    handleReset,
    handleResolveIssue,
    handleUpdateImage,
    isProcessing,
  } = useImageProcessor();

  const {
    currentBatch,
    progress,
    currentStep,
    filterType,
    selectedImageIds,
    setFilterType,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages,
    getFilteredImages,
    removeImage,
  } = useProcessStore();

  const { selectedPlatformId, platformRules, exportConfig, setExportConfig } = useAppStore();
  const { isWatching, startWatching, stopWatching, checkForNewFiles } = useFileWatcher();

  const [showProductGroups, setShowProductGroups] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const selectedPlatform = platformRules.find((p) => p.id === selectedPlatformId);
  const filteredImages = getFilteredImages();
  const filteredImageIds = filteredImages.map((img) => img.id);
  const selectedInFilter = filteredImages.filter((img) => selectedImageIds.includes(img.id));
  const allSelected = filteredImages.length > 0 && selectedInFilter.length === filteredImages.length;

  const handleSelectAll = () => {
    if (allSelected) {
      deselectAllImages(filteredImageIds);
    } else {
      selectAllImages(filteredImageIds);
    }
  };

  const filterOptions = [
    { value: 'all', label: '全部' },
    { value: 'withIssues', label: '有问题' },
    { value: 'main', label: '主图' },
    { value: 'detail', label: '细节图' },
    { value: 'scene', label: '场景图' },
  ];

  const handleRemoveImage = (imageId: string) => {
    if (confirm('确定要移除这张图片吗？')) {
      removeImage(imageId);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">图片处理</h1>
            <p className="text-gray-500 mt-1">
              批量整理商品图片，自动检测问题，一键生成上传素材
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedPlatform && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <span className="text-xl">{selectedPlatform.logo}</span>
                <span className="text-sm font-medium text-blue-700">{selectedPlatform.name}</span>
              </div>
            )}
          </div>
        </div>

        {!currentBatch ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-16 h-16 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">开始处理图片</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              选择文件夹或图片文件，工具将自动进行尺寸检查、白底检测、去重和分组整理
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={startWatching} disabled={!selectedPlatformId}>
                <Radar className="w-5 h-5 mr-2" />
                启动监控目录
              </Button>
              <Button size="lg" variant="secondary" onClick={handleSelectFolder} disabled={!selectedPlatformId}>
                <FolderOpen className="w-5 h-5 mr-2" />
                选择文件夹
              </Button>
              <Button size="lg" variant="secondary" onClick={handleSelectFiles} disabled={!selectedPlatformId}>
                <Upload className="w-5 h-5 mr-2" />
                选择图片
              </Button>
            </div>
            {!selectedPlatformId && (
              <p className="text-amber-600 text-sm mt-4">请先在仪表盘或规则配置中选择一个平台</p>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">筛选：</span>
                    <div className="flex gap-1">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setFilterType(option.value as any)}
                          className={cn(
                            'px-3 py-1 text-sm rounded-full transition-colors',
                            filterType === option.value
                              ? 'bg-blue-900 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-6 w-px bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      {allSelected ? '取消全选' : '全选'}
                    </button>
                    <span className="text-sm text-gray-400">
                      已选 {formatNumber(selectedInFilter.length)} / {formatNumber(filteredImages.length)}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-gray-200" />
                  <button
                    onClick={() => setShowProductGroups(!showProductGroups)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {showProductGroups ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {showProductGroups ? '隐藏分组' : '显示分组'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isWatching ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        监控中
                      </span>
                      <div className="h-4 w-px bg-emerald-200" />
                      <button
                        onClick={checkForNewFiles}
                        disabled={isProcessing}
                        className="flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        检测新文件
                      </button>
                      <button
                        onClick={stopWatching}
                        disabled={isProcessing}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        停止
                      </button>
                    </div>
                  ) : null}
                  <Button variant="secondary" size="sm" onClick={handleReset} disabled={isProcessing}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    重置
                  </Button>
                  <div className="relative">
                    <Button size="sm" onClick={() => setShowExportOptions(!showExportOptions)} disabled={isProcessing}>
                      <Download className="w-4 h-4 mr-1" />
                      导出结果
                    </Button>
                    {showExportOptions && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
                        <h4 className="font-medium text-gray-900 mb-3">导出选项</h4>
                        <div className="space-y-2">
                          {[
                            { key: 'generateUploadFolder', label: '生成待上传文件夹' },
                            { key: 'generateCompressed', label: '生成压缩副本' },
                            { key: 'generateIssueReport', label: '生成问题报告' },
                            { key: 'generateReviewList', label: '生成人工复核列表' },
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={exportConfig[item.key as keyof typeof exportConfig] as boolean}
                                onChange={(e) => setExportConfig({ [item.key]: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{item.label}</span>
                            </label>
                          ))}
                          <div className="pt-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              压缩质量: {Math.round(exportConfig.compressionQuality * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="1"
                              step="0.05"
                              value={exportConfig.compressionQuality}
                              onChange={(e) => setExportConfig({ compressionQuality: parseFloat(e.target.value) })}
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <Button size="sm" className="w-full" onClick={handleExport} disabled={isProcessing}>
                            <Download className="w-4 h-4 mr-1" />
                            开始导出
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {showProductGroups && currentBatch.productGroups.length > 0 && (
              <ProductGroups />
            )}

            <IssueSummary />

            {filteredImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {filteredImages.map((image: ImageItem) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    selected={selectedImageIds.includes(image.id)}
                    onSelect={() => toggleImageSelection(image.id)}
                    onRemove={() => handleRemoveImage(image.id)}
                    onUpdate={(updates) => handleUpdateImage(image.id, updates)}
                    onResolveIssue={(issueId) => handleResolveIssue(image.id, issueId)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">当前筛选条件下没有图片</p>
              </Card>
            )}
          </>
        )}

        <ProcessingOverlay />
      </div>
    </AppLayout>
  );
}
