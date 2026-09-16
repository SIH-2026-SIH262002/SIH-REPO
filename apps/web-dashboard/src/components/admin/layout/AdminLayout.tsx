import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import '../../../admin.css';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

/**
 * Root shell for the entire /admin/* route tree. Scoped under .admin-console
 * so the light institutional theme applies regardless of the rest of the
 * app's dark/light toggle (the Admin Console is light-only, always).
 */
export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-console flex min-h-screen">
      <AdminSidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[rgba(22,32,44,0.35)] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopBar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 min-w-0 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
