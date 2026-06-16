import { useState, useEffect } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type { PlatformRule, ImageRequirement, PlatformSettings } from '@/types';
import { NAMING_VARIABLES, DEFAULT_ANGLES, DEFAULT_NAMING_TEMPLATE } from '@/types/constants';
import { cn } from '@/lib/utils';

interface PlatformFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<PlatformRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingRule?: PlatformRule | null;
}

const defaultImageRequirements: ImageRequirement[] = [
  {
    type: 'main',
    minWidth: 800,
    maxWidth: 3000,
    minHeight: 800,
    maxHeight: 3000,
    maxFileSize: 5 * 1024 * 1024,
    aspectRatio: '1:1',
    requireWhiteBackground: true,
  },
  {
    type: 'detail',
    minWidth: 800,
    maxWidth: 3000,
    minHeight: 800,
    maxHeight: 3000,
    maxFileSize: 3 * 1024 * 1024,
    aspectRatio: 'any',
    requireWhiteBackground: false,
  },
  {
    type: 'scene',
    minWidth: 800,
    maxWidth: 3000,
    minHeight: 800,
    maxHeight: 3000,
    maxFileSize: 3 * 1024 * 1024,
    aspectRatio: 'any',
    requireWhiteBackground: false,
  },
];

const defaultSettings: PlatformSettings = {
  whiteBackgroundThreshold: 0.9,
  duplicateThreshold: 10,
  requiredAngles: ['正面', '侧面', '背面'],
};

const platformLogos = ['🛒', '🏪', '📱', '🎵', '💎', '👕', '👟', '💄', '🎮', '📷'];

export const PlatformForm = ({ isOpen, onClose, onSave, editingRule }: PlatformFormProps) => {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('🛒');
  const [enabled, setEnabled] = useState(true);
  const [namingTemplate, setNamingTemplate] = useState(DEFAULT_NAMING_TEMPLATE);
  const [imageRequirements, setImageRequirements] = useState<ImageRequirement[]>(defaultImageRequirements);
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [newAngle, setNewAngle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVariableHelp, setShowVariableHelp] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setLogo(editingRule.logo);
      setEnabled(editingRule.enabled);
      setNamingTemplate(editingRule.namingTemplate);
      setImageRequirements(editingRule.imageRequirements);
      setSettings(editingRule.settings);
    } else {
      setName('');
      setLogo('🛒');
      setEnabled(true);
      setNamingTemplate(DEFAULT_NAMING_TEMPLATE);
      setImageRequirements(defaultImageRequirements);
      setSettings(defaultSettings);
    }
    setErrors({});
  }, [editingRule, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = '平台名称不能为空';
    }
    
    if (!namingTemplate.trim()) {
      newErrors.namingTemplate = '命名模板不能为空';
    }
    
    if (!namingTemplate.includes('{商品编码}')) {
      newErrors.namingTemplate = '命名模板必须包含{商品编码}变量';
    }

    imageRequirements.forEach((req, index) => {
      if (req.minWidth > req.maxWidth) {
        newErrors[`req_${index}_width`] = '最小宽度不能大于最大宽度';
      }
      if (req.minHeight > req.maxHeight) {
        newErrors[`req_${index}_height`] = '最小高度不能大于最大高度';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    onSave({
      name: name.trim(),
      logo,
      enabled,
      namingTemplate: namingTemplate.trim(),
      imageRequirements,
      settings,
    });
    onClose();
  };

  const updateRequirement = (type: string, field: keyof ImageRequirement, value: any) => {
    setImageRequirements((reqs) =>
      reqs.map((req) => (req.type === type ? { ...req, [field]: value } : req)),
    );
  };

  const addAngle = () => {
    if (newAngle.trim() && !settings.requiredAngles.includes(newAngle.trim())) {
      setSettings((s) => ({
        ...s,
        requiredAngles: [...s.requiredAngles, newAngle.trim()],
      }));
      setNewAngle('');
    }
  };

  const removeAngle = (angle: string) => {
    setSettings((s) => ({
      ...s,
      requiredAngles: s.requiredAngles.filter((a) => a !== angle),
    }));
  };

  const insertVariable = (variable: string) => {
    setNamingTemplate((prev) => prev + variable);
  };

  const getTypeLabel = (type: string) => {
    return type === 'main' ? '主图' : type === 'detail' ? '细节图' : '场景图';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRule ? '编辑平台规则' : '新增平台规则'}
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              平台名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：淘宝、京东、拼多多"
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors',
                errors.name ? 'border-red-500' : 'border-gray-300',
              )}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">平台图标</label>
            <div className="flex gap-2 flex-wrap">
              {platformLogos.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLogo(l)}
                  className={cn(
                    'w-10 h-10 text-xl rounded-lg border-2 transition-all flex items-center justify-center',
                    logo === l ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="enabled" className="text-sm text-gray-700">启用此平台规则</label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              命名模板 <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowVariableHelp(!showVariableHelp)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              查看可用变量
            </button>
          </div>
          
          <input
            type="text"
            value={namingTemplate}
            onChange={(e) => setNamingTemplate(e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors font-mono text-sm',
              errors.namingTemplate ? 'border-red-500' : 'border-gray-300',
            )}
          />
          {errors.namingTemplate && <p className="text-red-500 text-xs mt-1">{errors.namingTemplate}</p>}
          
          {showVariableHelp && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">可用变量（点击插入）：</p>
              <div className="flex flex-wrap gap-2">
                {NAMING_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors font-mono"
                    title={v.description}
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">图片尺寸要求</h4>
          <div className="space-y-4">
            {imageRequirements.map((req, index) => (
              <div key={req.type} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{getTypeLabel(req.type)}</h5>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={req.requireWhiteBackground}
                      onChange={(e) => updateRequirement(req.type, 'requireWhiteBackground', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    要求白底
                  </label>
                </div>
                
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最小宽度</label>
                    <input
                      type="number"
                      value={req.minWidth}
                      onChange={(e) => updateRequirement(req.type, 'minWidth', parseInt(e.target.value) || 0)}
                      className={cn(
                        'w-full px-2 py-1.5 border rounded text-sm',
                        errors[`req_${index}_width`] ? 'border-red-500' : 'border-gray-300',
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最大宽度</label>
                    <input
                      type="number"
                      value={req.maxWidth}
                      onChange={(e) => updateRequirement(req.type, 'maxWidth', parseInt(e.target.value) || 0)}
                      className={cn(
                        'w-full px-2 py-1.5 border rounded text-sm',
                        errors[`req_${index}_width`] ? 'border-red-500' : 'border-gray-300',
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最小高度</label>
                    <input
                      type="number"
                      value={req.minHeight}
                      onChange={(e) => updateRequirement(req.type, 'minHeight', parseInt(e.target.value) || 0)}
                      className={cn(
                        'w-full px-2 py-1.5 border rounded text-sm',
                        errors[`req_${index}_height`] ? 'border-red-500' : 'border-gray-300',
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最大高度</label>
                    <input
                      type="number"
                      value={req.maxHeight}
                      onChange={(e) => updateRequirement(req.type, 'maxHeight', parseInt(e.target.value) || 0)}
                      className={cn(
                        'w-full px-2 py-1.5 border rounded text-sm',
                        errors[`req_${index}_height`] ? 'border-red-500' : 'border-gray-300',
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">宽高比</label>
                    <select
                      value={req.aspectRatio}
                      onChange={(e) => updateRequirement(req.type, 'aspectRatio', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="any">任意</option>
                      <option value="1:1">1:1</option>
                      <option value="3:4">3:4</option>
                      <option value="4:3">4:3</option>
                      <option value="9:16">9:16</option>
                      <option value="16:9">16:9</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">最大文件大小 (MB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={(req.maxFileSize / 1024 / 1024).toFixed(1)}
                    onChange={(e) => updateRequirement(req.type, 'maxFileSize', parseFloat(e.target.value) * 1024 * 1024)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">检测设置</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                白底检测阈值 ({(settings.whiteBackgroundThreshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.7"
                max="0.99"
                step="0.01"
                value={settings.whiteBackgroundThreshold}
                onChange={(e) => setSettings((s) => ({ ...s, whiteBackgroundThreshold: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">边缘白色像素占比超过此值判定为白底</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                重复检测阈值 ({Math.round((1 - settings.duplicateThreshold / 64) * 100)}%)
              </label>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={settings.duplicateThreshold}
                onChange={(e) => setSettings((s) => ({ ...s, duplicateThreshold: parseInt(e.target.value) }))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">汉明距离小于此值判定为重复</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">必填拍摄角度</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.requiredAngles.map((angle) => (
                <Badge key={angle} variant="info" className="flex items-center gap-1">
                  {angle}
                  <button
                    type="button"
                    onClick={() => removeAngle(angle)}
                    className="ml-1 hover:text-red-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAngle}
                onChange={(e) => setNewAngle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAngle()}
                placeholder="添加角度，如：正面、侧面..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <Button type="button" size="sm" onClick={addAngle}>
                <Plus className="w-4 h-4 mr-1" />
                添加
              </Button>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-400">快捷添加：</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {DEFAULT_ANGLES.filter((a) => !settings.requiredAngles.includes(a)).map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, requiredAngles: [...s.requiredAngles, angle] }))}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-blue-100 rounded text-xs text-gray-600 transition-colors"
                  >
                    + {angle}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          {editingRule ? '保存修改' : '创建平台'}
        </Button>
      </div>
    </Modal>
  );
};
