import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { getAuthStorage } from '../lib/authApi';

const getApiUrl = () => import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export default function LoginForm({ onViewChange, onLoginSuccess }) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${getApiUrl()}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to login');
            }

            getAuthStorage().setTokens({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                sessionId: data.sessionId
            });

            if (onLoginSuccess) {
                onLoginSuccess();
            } else {
                alert('Login Successful!');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300 ml-1">Email, Phone, or Username</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-400 transition-colors">
                        <Mail size={18} />
                    </div>
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-slate-100 placeholder-slate-500 transition-all shadow-inner"
                        placeholder="you@example.com / +1234567890"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-400 transition-colors">
                        <Lock size={18} />
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-slate-100 placeholder-slate-500 transition-all shadow-inner"
                        placeholder="••••••••"
                    />
                </div>
                <div className="text-right">
                    <button
                        type="button"
                        onClick={() => onViewChange('forgot')}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        Forgot password?
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-red-400 text-sm text-center font-medium bg-red-900/20 py-2 rounded-lg border border-red-500/20">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
            >
                {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <>
                        Sign In
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>

            <div className="text-center mt-6 pt-4 border-t border-slate-700/50">
                <span className="text-slate-400 text-xs">
                    Account access is provisioned by authorized platform administrators. Public self-registration is disabled.
                </span>
            </div>
        </form>
    );
}
