import { useNavigate } from 'react-router-dom';
import { Image, AlertTriangle, CheckCircle, Clock, Upload, Settings, History, FolderOpen } from 'lucide-react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { RecentRecords } from '@/components/dashboard/RecentRecords';
import { useAppStore } from '@/store/appStore';
import { formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { processRecords, platformRules, selectedPlatformId } = useAppStore();

  const totalImages = processRecords.reduce((sum, r) => sum + r.totalImages, 0);
  const totalIssues = processRecords.reduce((sum, r) => sum + r.issueCount, 0);
  const totalRecords = processRecords.length;
  const successRate = totalImages > 0 ? (((totalImages - totalIssues) / totalImages) * 100).toFixed(1) : '0';

  const selectedPlatform = platformRules.find((p) => p.id === selectedPlatformId);

  const quickActions = [
    {
      title: '开始处理',
      description: '选择文件夹或图片开始批量处理',
      icon: Upload,
      gradient: 'from-blue-500 to-blue-700',
      onClick: () => navigate('/processor'),
    },
    {
      title: '规则配置',
      description: '管理各平台的图片规则',
      icon: Settings,
      gradient: 'from-purple-500 to-purple-700',
      onClick: () => navigate('/rules'),
    },
    {
      title: '历史记录',
      description: '查看过往处理记录',
      icon: History,
      gradient: 'from-emerald-500 to-emerald-700',
      onClick: () => navigate('/history'),
    },
  ];

  const stats = [
    {
      title: '累计处理图片',
      value: formatNumber(totalImages),
      icon: Image,
      trend: 12,
      gradient: 'from-blue-500 to-blue-700',
      iconBg: 'bg-white/20',
    },
    {
      title: '累计发现问题',
      value: formatNumber(totalIssues),
      icon: AlertTriangle,
      trend: -5,
      gradient: 'from-amber-500 to-amber-700',
      iconBg: 'bg-white/20',
    },
    {
      title: '平均合格率',
      value: `${successRate}%`,
      icon: CheckCircle,
      trend: 3,
      gradient: 'from-emerald-500 to-emerald-700',
      iconBg: 'bg-white/20',
    },
    {
      title: '处理批次',
      value: formatNumber(totalRecords),
      icon: Clock,
      gradient: 'from-purple-500 to-purple-700',
      iconBg: 'bg-white/20',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-500 mt-1">
            当前使用平台：
            {selectedPlatform ? (
              <span className="font-medium text-blue-600">
                {selectedPlatform.logo} {selectedPlatform.name}
              </span>
            ) : (
              <span className="text-gray-400">未选择</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <QuickActionCard key={index} {...action} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <RecentRecords />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">已配置平台</h3>
              <div className="space-y-3">
                {platformRules.map((platform) => (
                  <div
                    key={platform.id}
                    onClick={() => {
                      if (platform.enabled) {
                        useAppStore.getState().setSelectedPlatformId(platform.id);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                      platform.id === selectedPlatformId
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent',
                      !platform.enabled && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <span className="text-2xl">{platform.logo}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{platform.name}</p>
                      <p className="text-xs text-gray-500">
                        {platform.settings.requiredAngles.length}个必填角度
                      </p>
                    </div>
                    {platform.id === selectedPlatformId && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">监控文件夹</h3>
                  <p className="text-white/70 text-sm">实时监控，自动处理</p>
                </div>
              </div>
              <p className="text-sm text-white/80 mb-4">
                将图片拖入指定文件夹，工具将自动识别并处理。
                <span className="text-amber-300 ml-1">（浏览器限制：需手动刷新）</span>
              </p>
              <button
                onClick={() => navigate('/processor')}
                className="w-full py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                前往处理
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
