import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Image, Settings, History, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/processor', label: '图片处理', icon: Image },
  { path: '/rules', label: '规则配置', icon: Settings },
  { path: '/history', label: '历史记录', icon: History },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-950 to-blue-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">图智整理</h1>
            <p className="text-blue-300 text-xs">电商图片管理工具</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-white/10 text-white shadow-lg shadow-black/20'
                  : 'text-blue-200 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-blue-300 text-xs mb-2">今日处理</p>
          <p className="text-white text-2xl font-bold">156</p>
          <p className="text-emerald-400 text-xs mt-1">↑ 12% 较昨日</p>
        </div>
      </div>
    </aside>
  );
};
