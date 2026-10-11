import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UploadCloud,
  BarChart3,
  Clock,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Database,
  X,
} from 'lucide-react';

export type NavPage =
  | 'dashboard'
  | 'leads-directory'
  | 'add-lead'
  | 'bulk-upload'
  | 'analytics'
  | 'review-queue'
  | 'drift-monitor'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  reviewQueueCount?: number;
  storageType?: 'supabase' | 'local_persistent';
}

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  reviewQueueCount = 0,
  storageType = 'local_persistent',
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads-directory', label: 'Leads Directory', icon: Users },
    { id: 'add-lead', label: 'Add Lead', icon: UserPlus },
    { id: 'bulk-upload', label: 'Bulk Upload', icon: UploadCloud },
    { id: 'analytics', label: 'Analytics & Models', icon: BarChart3 },
    {
      id: 'review-queue',
      label: 'Review Queue',
      icon: Clock,
      badge: reviewQueueCount > 0 ? reviewQueueCount : undefined,
    },
    { id: 'drift-monitor', label: 'Drift Monitor', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: NavPage) => {
    onSelectPage(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out border-r border-white/10 bg-[#060b19]/90 backdrop-blur-xl ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Main Navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo Emblem */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-900/40 border border-emerald-500/40 text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#060b19]" />
            </div>

            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  Lead<span className="text-emerald-400">Matrix</span>
                </span>
                <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                  ML Qualification
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_-3px_rgba(16,185,129,0.25)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors shrink-0 ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 truncate text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {collapsed && item.badge !== undefined && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#060b19]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom System Telemetry / Database status */}
        <div className="p-3 border-t border-white/10 shrink-0">
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Model v2.4
                </span>
                <span className="text-emerald-400 font-mono text-[10px]">91.4% Prec</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  {storageType === 'supabase' ? 'Supabase' : 'Persistent File'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-1 text-slate-400">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-full mt-2 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Navigation</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
