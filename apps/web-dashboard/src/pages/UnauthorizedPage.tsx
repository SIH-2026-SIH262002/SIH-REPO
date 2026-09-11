import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 text-slate-100 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        {t('auth.unauthorized.title', '403 - ACCESS DENIED')}
      </h1>

      <p className="mt-2 text-xs text-slate-400 max-w-md">
        {t('auth.unauthorized.message', 'You do not have permission to view this page.')} ({t('common.role', 'Role')}: <span className="text-rose-400 font-bold">{user?.role || 'GUEST'}</span>)
      </p>

      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>{t('auth.unauthorized.backButton', 'Return to Authorized Dashboard')}</span>
        </Link>
      </div>
    </div>
  );
};

