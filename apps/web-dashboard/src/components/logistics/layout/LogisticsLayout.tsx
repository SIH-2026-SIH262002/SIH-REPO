import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import '../../../admin.css';
import { LogisticsSidebar } from './LogisticsSidebar';
import { LogisticsTopBar } from './LogisticsTopBar';

/**
 * Root shell for the entire /logistics/* route tree. Scoped under .logistics-console
 * so the light institutional government command theme applies consistently.
 */
export const LogisticsLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="logistics-console flex min-h-screen">
      <LogisticsSidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[rgba(22,32,44,0.35)] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <LogisticsTopBar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 min-w-0 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
