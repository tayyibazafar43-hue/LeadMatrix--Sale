import React, { useState, useEffect } from 'react';
import { Sidebar, NavPage } from './components/Sidebar';
import { GalaxyBackground } from './components/GalaxyBackground';
import { CursorStars } from './components/CursorStars';
import { DashboardView } from './views/DashboardView';
import { LeadsDirectoryView } from './views/LeadsDirectoryView';
import { AddLeadView } from './views/AddLeadView';
import { BulkUploadView } from './views/BulkUploadView';
import { AnalyticsView } from './views/AnalyticsView';
import { ReviewQueueView } from './views/ReviewQueueView';
import { DriftMonitorView } from './views/DriftMonitorView';
import { SettingsView } from './views/SettingsView';
import { fetchReviewQueue, fetchSettings } from './lib/api';
import { Lead } from './types';
import { Menu, Sparkles } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [storageType, setStorageType] = useState<'supabase' | 'local_persistent'>('local_persistent');
  const [inspectLead, setInspectLead] = useState<Lead | null>(null);

  // Load telemetry & review queue badge count
  const refreshTelemetry = async () => {
    try {
      const queueRes = await fetchReviewQueue().catch(() => ({ total: 0 }));
      setReviewCount(queueRes.total || 0);

      const settingsRes = await fetchSettings().catch(() => null);
      if (settingsRes) {
        setStorageType(settingsRes.storage_type);
      }
    } catch (e) {
      console.warn('Telemetry load notice:', e);
    }
  };

  useEffect(() => {
    refreshTelemetry();
  }, [currentPage]);

  const handleNavigate = (page: NavPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewLeadFromDashboard = (lead: Lead) => {
    setInspectLead(lead);
    setCurrentPage('leads-directory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Universal Galaxy Background Canvas */}
      <GalaxyBackground />

      {/* 2. Universal Multicolor Cursor-following Stars */}
      <CursorStars />

      {/* 3. Fixed Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        reviewQueueCount={reviewCount}
        storageType={storageType}
      />

      {/* 4. Main Content Area to the RIGHT of the Sidebar */}
      <div
        className={`min-h-screen flex flex-col relative z-10 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header Bar for Mobile / Tablet */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-[#060b19]/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-bold text-sm text-white">
                Lead<span className="text-emerald-400">Matrix</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              v2.4
            </span>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onViewLead={handleViewLeadFromDashboard}
            />
          )}

          {currentPage === 'leads-directory' && (
            <LeadsDirectoryView
              initialSelectedLead={inspectLead}
              onClearInitialLead={() => setInspectLead(null)}
            />
          )}

          {currentPage === 'add-lead' && (
            <AddLeadView
              onLeadCreated={() => {
                refreshTelemetry();
              }}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'bulk-upload' && (
            <BulkUploadView
              onNavigate={handleNavigate}
              onRefreshData={refreshTelemetry}
            />
          )}

          {currentPage === 'analytics' && <AnalyticsView />}

          {currentPage === 'review-queue' && (
            <ReviewQueueView
              onQueueUpdated={refreshTelemetry}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'drift-monitor' && <DriftMonitorView />}

          {currentPage === 'settings' && (
            <SettingsView onRefreshData={refreshTelemetry} />
          )}
        </main>
      </div>
    </div>
  );
}
