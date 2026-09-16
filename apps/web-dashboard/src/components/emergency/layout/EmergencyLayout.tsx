/**
 * EmergencyLayout.tsx — Root shell for the Emergency Operator console.
 *
 * Light institutional design (slate-50 background, white panels, dark text).
 * Includes EmergencyTopBar + EmergencySidebar + main outlet area.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { EmergencyTopBar } from './EmergencyTopBar';
import { EmergencySidebar } from './EmergencySidebar';

export const EmergencyLayout: React.FC = () => {
  return (
    <div className="emergency-shell">
      <EmergencyTopBar />
      <div className="emergency-body">
        <EmergencySidebar />
        <main className="emergency-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
