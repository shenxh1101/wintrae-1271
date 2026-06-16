import { useState } from 'react';
import { Check, X, AlertTriangle, Info, Maximize2, Trash2, Edit } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import type { ImageItem } from '@/types';
import { ISSUE_TYPE_LABELS, IMAGE_TYPE_LABELS } from '@/types/constants';
import { formatFileSize, formatPercentage, truncateString } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface ImageCardProps {
  image: ImageItem;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<ImageItem>) => void;
  onResolveIssue: (issueId: string) => void;
}

export const ImageCard = ({ image, selected, onSelect, onRemove, onUpdate, onResolveIssue }: ImageCardProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(image.newName);

  const hasUnresolvedIssues = image.issues.some((i) => !i.resolved);
  const worstSeverity = image.issues.reduce((worst, issue) => {
    if (issue.resolved) return worst;
    if (issue.severity === 'error') return 'error';
    if (issue.severity === 'warning' && worst !== 'error') return 'warning';
    return worst || 'info';
  }, '' as string);

  const handleSaveName = () => {
    onUpdate({ newName: editName });
    setIsEditing(false);
  };

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden group',
          selected && 'ring-2 ring-blue-500',
          hasUnresolvedIssues && worstSeverity === 'error' && 'border-red-200',
          image.isDuplicate && 'opacity-60',
        )}
      >
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>

        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowPreview(true)}
            className="p-1.5 bg-white/90 hover:bg-white rounded-md text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
            title="预览大图"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 bg-white/90 hover:bg-red-50 rounded-md text-gray-600 hover:text-red-600 shadow-sm transition-colors"
            title="移除图片"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-12 left-2 z-10 flex flex-col gap-1">
          <Badge variant={image.imageType === 'main' ? 'success' : image.imageType === 'detail' ? 'info' : 'warning'}>
            {IMAGE_TYPE_LABELS[image.imageType]}
          </Badge>
          {image.isDuplicate && (
            <Badge variant="danger">重复</Badge>
          )}
        </div>

        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={image.preview}
            alt={image.originalName}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            {isEditing ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <button onClick={handleSaveName} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsEditing(false); setEditName(image.newName); }} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {truncateString(image.newName, 20)}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-0.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 truncate">{image.originalName}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{image.width}x{image.height}</span>
            <span>{formatFileSize(image.fileSize)}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">白底:</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  image.whiteBackgroundRatio >= 0.95 ? 'bg-emerald-500' :
                  image.whiteBackgroundRatio >= 0.85 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${image.whiteBackgroundRatio * 100}%` }}
              />
            </div>
            <span className={cn(
              'font-medium',
              image.whiteBackgroundRatio >= 0.95 ? 'text-emerald-600' :
              image.whiteBackgroundRatio >= 0.85 ? 'text-amber-600' : 'text-red-600'
            )}>
              {formatPercentage(image.whiteBackgroundRatio, 0)}
            </span>
          </div>

          {image.issues.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-gray-100">
              {image.issues.filter(i => !i.resolved).slice(0, 2).map((issue) => (
                <div key={issue.id} className="flex items-start gap-1.5">
                  {issue.severity === 'error' ? (
                    <X className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : issue.severity === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-xs text-gray-600 line-clamp-1">
                    {ISSUE_TYPE_LABELS[issue.type]}
                  </span>
                  <button
                    onClick={() => onResolveIssue(issue.id)}
                    className="ml-auto p-0.5 text-emerald-600 hover:bg-emerald-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="标记已解决"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {image.issues.filter(i => !i.resolved).length > 2 && (
                <p className="text-xs text-gray-400">+{image.issues.filter(i => !i.resolved).length - 2} 个问题</p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={image.originalName}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={image.preview}
              alt={image.originalName}
              className="w-full h-auto max-h-[60vh] object-contain"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">商品编码</p>
              <p className="font-medium">{image.productCode}</p>
            </div>
            <div>
              <p className="text-gray-500">图片类型</p>
              <p className="font-medium">{IMAGE_TYPE_LABELS[image.imageType]}</p>
            </div>
            <div>
              <p className="text-gray-500">尺寸</p>
              <p className="font-medium">{image.width} x {image.height}</p>
            </div>
            <div>
              <p className="text-gray-500">文件大小</p>
              <p className="font-medium">{formatFileSize(image.fileSize)}</p>
            </div>
            <div>
              <p className="text-gray-500">白底占比</p>
              <p className="font-medium">{formatPercentage(image.whiteBackgroundRatio)}</p>
            </div>
            <div>
              <p className="text-gray-500">拍摄角度</p>
              <p className="font-medium">{image.angle || '未识别'}</p>
            </div>
          </div>

          {image.issues.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-2">问题列表</h4>
              <div className="space-y-2">
                {image.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg',
                      issue.resolved ? 'bg-gray-50 opacity-60' : 'bg-red-50',
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {issue.severity === 'error' && <X className="w-5 h-5 text-red-500" />}
                      {issue.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                      {issue.severity === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {ISSUE_TYPE_LABELS[issue.type]}
                        </span>
                        {issue.resolved && <Badge variant="success">已解决</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                      <p className="text-sm text-gray-500 mt-1">建议: {issue.suggestion}</p>
                    </div>
                    {!issue.resolved && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onResolveIssue(issue.id)}
                      >
                        标记解决
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              关闭
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
