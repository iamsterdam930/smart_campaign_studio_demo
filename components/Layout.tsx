
import React from 'react';
import { 
  LayoutDashboard, 
  FileCheck, 
  Settings, 
  LogOut, 
  User, 
  Bell,
  CheckCircle2,
  Users,
  Database,
  Layers,
  Gift
} from 'lucide-react';
import { translations } from '../i18n';
import { Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'activities' | 'approvals' | 'create' | 'monitor' | 'report' | 'audience' | 'datacenter' | 'features' | 'rights';
  onTabChange: (tab: 'activities' | 'approvals' | 'create' | 'audience' | 'datacenter' | 'features' | 'rights') => void;
  onLogout: () => void;
  notifications?: Notification[]; 
  onReadNotification?: (id: string) => void; 
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout, notifications = [], onReadNotification }) => {
  const t = translations;
  const [showNotifPanel, setShowNotifPanel] = React.useState(false);

  // Added Data Center & Feature Store & Rights Management
  // Reordered as per request: Activities, Rights, Audience, Features, Datacenter, Approvals
  const menuItems = [
    { id: 'activities', label: t["menu.activities"], icon: LayoutDashboard },
    { id: 'rights', label: t["menu.rights"], icon: Gift },
    { id: 'audience', label: t["menu.audience"], icon: Users },
    { id: 'features', label: t["menu.features"], icon: Layers },
    { id: 'datacenter', label: t["menu.datacenter"], icon: Database },
    { id: 'approvals', label: t["menu.approvals"], icon: FileCheck },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans" onClick={() => setShowNotifPanel(false)}>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/50">AI</div>
          <span className="text-lg font-bold tracking-wide">{t["app.title"]}</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Highlight activities tab if in monitor/create/report mode
            const isActive = activeTab === item.id || 
                             (item.id === 'activities' && ['create', 'monitor', 'report'].includes(activeTab));
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-brand-blue text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'animate-pulse-slow' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          {/* Settings button removed as requested */}
          <div className="text-[10px] text-slate-600 font-mono pt-2 pl-2">
            ©2026 Deepzero
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4 text-gray-500">
                 {/* Breadcrumbs */}
                 <span className="text-sm font-medium">
                    {activeTab === 'activities' && `${t["menu.activities"]} / ${t["activity.list.title"]}`}
                    {activeTab === 'create' && `${t["menu.activities"]} / ${t["common.create"]}`}
                    {activeTab === 'approvals' && `${t["menu.approvals"]}`}
                    {activeTab === 'monitor' && `${t["menu.activities"]} / ${t["monitor.title"]}`}
                    {activeTab === 'report' && `${t["menu.activities"]} / ${t["report.title"]}`}
                    {activeTab === 'audience' && `${t["menu.audience"]}`}
                    {activeTab === 'datacenter' && `${t["menu.datacenter"]}`}
                    {activeTab === 'features' && `${t["menu.features"]}`}
                    {activeTab === 'rights' && `${t["menu.rights"]}`}
                 </span>
            </div>

            <div className="flex items-center gap-6">
                
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={`relative text-gray-500 hover:text-brand-blue transition-colors ${showNotifPanel ? 'text-brand-blue' : ''}`}
                            onClick={() => setShowNotifPanel(!showNotifPanel)}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>

                        {/* Notification Panel */}
                        {showNotifPanel && (
                            <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in-up">
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800 text-sm">通知</h4>
                                    <span className="text-xs text-gray-500">{unreadCount} 未读</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div 
                                                key={n.id} 
                                                className={`p-4 border-b border-gray-50 hover:bg-blue-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                                                onClick={() => onReadNotification && onReadNotification(n.id)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="mt-1 text-green-500"><CheckCircle2 size={16} /></div>
                                                    <div>
                                                        <h5 className="text-sm font-bold text-gray-800 mb-1">{n.title}</h5>
                                                        <p className="text-xs text-gray-500">{n.message}</p>
                                                        <span className="text-[10px] text-gray-400 mt-2 block">{n.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-xs">暂无通知</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 pl-2">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-gray-800">Admin User</span>
                            <span className="text-xs text-gray-500">{t["header.role"]}</span>
                        </div>
                        <div className="h-9 w-9 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue border border-brand-blue/20">
                            <User size={18} />
                        </div>
                    </div>

                    <button 
                        onClick={onLogout}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors" 
                        title={t["common.delete"]} 
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50/50 relative">
            {children}
        </main>
      </div>
    </div>
  );
};
