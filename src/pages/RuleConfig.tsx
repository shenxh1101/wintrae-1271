import { useState } from 'react';
import { Plus, Settings, Code } from 'lucide-react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PlatformCard } from '@/components/rules/PlatformCard';
import { PlatformForm } from '@/components/rules/PlatformForm';
import { useAppStore } from '@/store/appStore';
import type { PlatformRule } from '@/types';

export default function RuleConfig() {
  const {
    platformRules,
    selectedPlatformId,
    customSkuPattern,
    addPlatformRule,
    updatePlatformRule,
    deletePlatformRule,
    setSelectedPlatformId,
    setCustomSkuPattern,
  } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PlatformRule | null>(null);
  const [showSkuSettings, setShowSkuSettings] = useState(false);

  const handleSelectPlatform = (id: string) => {
    const platform = platformRules.find((p) => p.id === id);
    if (platform?.enabled) {
      setSelectedPlatformId(id);
    }
  };

  const handleTogglePlatform = (id: string) => {
    const platform = platformRules.find((p) => p.id === id);
    if (platform) {
      updatePlatformRule(id, { enabled: !platform.enabled });
    }
  };

  const handleEditPlatform = (platform: PlatformRule) => {
    setEditingRule(platform);
    setShowForm(true);
  };

  const handleDeletePlatform = (id: string) => {
    deletePlatformRule(id);
  };

  const handleSaveRule = (rule: Omit<PlatformRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingRule) {
      updatePlatformRule(editingRule.id, rule);
    } else {
      addPlatformRule(rule);
    }
    setShowForm(false);
    setEditingRule(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">规则配置</h1>
            <p className="text-gray-500 mt-1">
              管理各电商平台的图片规则，包括尺寸、文件大小、白底要求等
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setShowSkuSettings(!showSkuSettings)}>
              <Code className="w-4 h-4 mr-2" />
              SKU规则
            </Button>
            <Button onClick={() => { setEditingRule(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              新增平台
            </Button>
          </div>
        </div>

        {showSkuSettings && (
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Code className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">SKU识别规则</h3>
                <p className="text-sm text-gray-500 mt-1">
                  自定义商品编码(SKU)的正则表达式，用于从文件名中提取商品编码。
                  留空则使用默认规则（匹配字母数字组合，长度6-20）。
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自定义正则表达式
                </label>
                <input
                  type="text"
                  value={customSkuPattern}
                  onChange={(e) => setCustomSkuPattern(e.target.value)}
                  placeholder="例如：[A-Z]{2}\d{6,}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  默认识别规则：匹配文件名中的字母数字组合，如 SKU12345、ABC-001、PROD2024
                </p>
              </div>
              {customSkuPattern && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">当前正则表达式：</p>
                  <code className="text-sm text-purple-600 font-mono">{customSkuPattern}</code>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {platformRules.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无平台规则</h3>
              <p className="text-gray-500 mb-4">点击右上角按钮添加第一个平台规则</p>
              <Button onClick={() => { setEditingRule(null); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                新增平台
              </Button>
            </Card>
          ) : (
            platformRules.map((platform) => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                isSelected={platform.id === selectedPlatformId}
                onSelect={() => handleSelectPlatform(platform.id)}
                onToggle={() => handleTogglePlatform(platform.id)}
                onDelete={() => handleDeletePlatform(platform.id)}
                onEdit={() => handleEditPlatform(platform)}
              />
            ))
          )}
        </div>

        <PlatformForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSave={handleSaveRule}
          editingRule={editingRule}
        />
      </div>
    </AppLayout>
  );
}
