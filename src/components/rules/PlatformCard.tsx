import { useState } from 'react';
import { Settings, Trash2, Edit3, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import type { PlatformRule } from '@/types';
import { formatFileSize } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface PlatformCardProps {
  platform: PlatformRule;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export const PlatformCard = ({ platform, isSelected, onSelect, onToggle, onDelete, onEdit }: PlatformCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const mainReq = platform.imageRequirements.find((r) => r.type === 'main');

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden transition-all',
          isSelected && 'ring-2 ring-blue-500 border-blue-200',
          !platform.enabled && 'opacity-60',
        )}
        onClick={onSelect}
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center text-3xl">
                {platform.logo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-gray-900">{platform.name}</h3>
                  {platform.enabled ? (
                    <Badge variant="success">已启用</Badge>
                  ) : (
                    <Badge variant="gray">已禁用</Badge>
                  )}
                  {isSelected && <Badge variant="info">当前使用</Badge>}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  命名模板: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{platform.namingTemplate}</code>
                </p>
                {mainReq && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>主图: {mainReq.minWidth}x{mainReq.minHeight}+</span>
                    <span>最大: {formatFileSize(mainReq.maxFileSize)}</span>
                    <span>角度: {platform.settings.requiredAngles.length}个</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onToggle}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={platform.enabled ? '禁用平台' : '启用平台'}
              >
                {platform.enabled ? (
                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="编辑规则"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="删除平台"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
            className="w-full mt-4 flex items-center justify-center gap-1 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>查看详细规则</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              {platform.imageRequirements.map((req) => (
                <div key={req.type} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {req.type === 'main' ? '主图' : req.type === 'detail' ? '细节图' : '场景图'}
                    {req.requireWhiteBackground && <Badge variant="info" className="ml-2">需白底</Badge>}
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">尺寸范围</p>
                      <p className="font-medium">{req.minWidth}-{req.maxWidth} x {req.minHeight}-{req.maxHeight}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">宽高比</p>
                      <p className="font-medium">{req.aspectRatio === 'any' ? '任意' : req.aspectRatio}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">最大文件</p>
                      <p className="font-medium">{formatFileSize(req.maxFileSize)}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">检测设置</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">白底阈值</p>
                    <p className="font-medium">{(platform.settings.whiteBackgroundThreshold * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">重复阈值</p>
                    <p className="font-medium">{Math.round((1 - platform.settings.duplicateThreshold / 64) * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">必填角度</p>
                    <p className="font-medium">{platform.settings.requiredAngles.join('、')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要删除平台 <span className="font-semibold text-gray-900">{platform.name}</span> 吗？
            此操作不可撤销。
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
            >
              确认删除
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
