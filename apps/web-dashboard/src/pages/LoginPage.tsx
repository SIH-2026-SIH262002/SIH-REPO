import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, Phone, Truck, Shield, AlertCircle } from 'lucide-react';
import { UserRole } from '../types/auth';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/common/LanguageSelector';

const isPathAllowedForRole = (path: string, role?: UserRole): boolean => {
  if (!role) return false;
  const segment = path.split('/')[1] || '';
  const basePath = '/' + segment;

  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return true;
  }

  switch (basePath) {
    case '/logistics':
      return role === 'LOGISTICS_OPERATOR';
    case '/emergency':
      return role === 'EMERGENCY_OPERATOR' || role === 'DISTRICT_AUTHORITY';
    case '/field':
      return role === 'FIELD_OFFICER';
    case '/driver':
      return role === 'DRIVER';
    case '/profile':
      return true;
    default:
      return false;
  }
};

const getRedirectPath = (role?: UserRole) => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'DISTRICT_AUTHORITY':
    case 'EMERGENCY_OPERATOR':
      return '/emergency';
    case 'LOGISTICS_OPERATOR':
      return '/logistics';
    case 'FIELD_OFFICER':
      return '/field';
    case 'DRIVER':
      return '/driver';
    default:
      return '/profile';
  }
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [inputMode, setInputMode] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError(
        inputMode === 'email'
          ? t('auth.login.enterEmailError', 'Please enter your Email Address')
          : t('auth.login.enterPhoneError', 'Please enter your Phone Number')
      );
      return;
    }
    if (!password) {
      setError(t('auth.login.enterPasswordError', 'Please enter your password'));
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        [inputMode === 'email' ? 'email' : 'phone']: identifier.trim(),
        identifier: identifier.trim(),
        password,
        rememberMe,
      };

      const user = await login(payload);

      const from = (location.state as any)?.from?.pathname;
      const isValidFrom =
        from &&
        from !== '/login' &&
        from !== '/unauthorized' &&
        from !== '/register' &&
        from !== '/' &&
        isPathAllowedForRole(from, user.role);

      const targetPath = isValidFrom ? from : getRedirectPath(user.role);
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.error || err.message || t('auth.login.authFailed', 'Authentication failed. Please check credentials.');
      setError(msg === 'Invalid credentials' ? t('auth.login.invalidCredentials', 'Invalid email/phone or password.') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 font-sans relative">
      {/* Language Selector Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector variant="header" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Header */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 border border-emerald-500">
            <Truck className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">
          {t('auth.login.title', 'AUTHORIZED PERSONNEL LOGIN')}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          {t('auth.login.subtitle', 'NER Logistics & Accessibility Intelligence Platform — Authorized Access Only')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md border border-slate-200 sm:rounded-xl sm:px-10">
          {/* Input Type Selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setInputMode('email');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1.5 ${
                inputMode === 'email'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{t('auth.login.emailTab', 'Email Address')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('phone');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1.5 ${
                inputMode === 'phone'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t('auth.login.phoneTab', 'Phone Number')}</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start space-x-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email / Phone Field */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {inputMode === 'email'
                  ? t('auth.login.emailLabel', 'Email Address')
                  : t('auth.login.phoneLabel', 'Phone Number')}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {inputMode === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </div>
                <input
                  type={inputMode === 'email' ? 'email' : 'tel'}
                  required
                  placeholder={
                    inputMode === 'email' ? 'officer@ner.logistics.gov.in' : '+91 9876543210'
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  {t('auth.login.passwordLabel', 'Password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition"
                >
                  {t('auth.login.forgotPassword', 'Forgot Password?')}
                </Link>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-700">
                  {t('auth.login.rememberMe', 'Remember operational session')}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('auth.login.verifying', 'Verifying Credentials...')}</span>
                  </div>
                ) : (
                  t('auth.login.signInButton', 'Sign In to Platform')
                )}
              </button>
            </div>
          </form>

          {/* Operational Access Notice */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              {t('auth.login.provisioningNotice', 'Account provisioning is restricted to authorized platform administrators. Public self-registration is disabled.')}
            </p>
          </div>
        </div>

        {/* Operational Banner */}
        <div className="mt-6 bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between text-[11px] text-slate-600 shadow-xs">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>{t('auth.login.encryptedSession', 'Encrypted Session • Role Security Active')}</span>
          </div>
          <span className="text-slate-400">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

