import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface AdminTopBarProps {
  onToggleSidebar: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--adm-surface)] border-b border-[var(--adm-border)]">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-[var(--adm-radius)] text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--adm-primary)]" aria-hidden="true" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-[var(--adm-ink)]">NER LogiSense</div>
              <div className="text-[11px] text-[var(--adm-ink-3)] hidden sm:block">Administration Console</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-[var(--adm-ink)]">{user?.fullName || 'Administrator'}</div>
            <div className="text-[11px] text-[var(--adm-ink-3)]">{user?.district || 'Global scope'}</div>
          </div>
          <span className="inline-flex items-center rounded-sm bg-[var(--adm-primary-wash)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--adm-primary)]">
            Admin
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] px-3 py-1.5 text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
