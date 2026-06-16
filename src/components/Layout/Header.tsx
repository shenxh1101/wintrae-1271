import { Bell, Search, User, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

export const Header = () => {
  const { platformRules, selectedPlatformId, setSelectedPlatformId } = useAppStore();

  const selectedPlatform = platformRules.find((p) => p.id === selectedPlatformId);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索图片、商品编码..."
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-72 transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={selectedPlatformId || ''}
            onChange={(e) => setSelectedPlatformId(e.target.value)}
            className={cn(
              'appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all',
            )}
          >
            {platformRules
              .filter((p) => p.enabled)
              .map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.logo} {platform.name}
                </option>
              ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {selectedPlatform && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span>命名模板:</span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{selectedPlatform.namingTemplate}</code>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">运营账号</p>
            <p className="text-xs text-gray-500">管理员</p>
          </div>
        </div>
      </div>
    </header>
  );
};
