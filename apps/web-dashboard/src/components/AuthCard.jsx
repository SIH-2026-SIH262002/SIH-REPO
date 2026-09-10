import React, { useState } from 'react';
import LoginForm from './LoginForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';

export default function AuthCard({ onViewChange }) {
    const [view, setView] = useState('login');

    const titles = {
        login: 'Authorized Login',
        forgot: 'Forgot password',
        reset: 'Reset password'
    };

    return (
        <div className="relative z-10 w-full max-w-md p-8 pt-10 pb-10 mx-auto glass-panel rounded-3xl overflow-hidden transition-all duration-500 transform hover:scale-[1.02] pointer-events-auto">
            <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse"></div>
            <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="relative z-20">
                <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-8 tracking-tight">
                    {titles[view] || 'Auth'}
                </h2>

                <div className="transition-all duration-300">
                    {view === 'login' && (
                        <LoginForm onViewChange={setView} onLoginSuccess={() => onViewChange('dashboard')} />
                    )}
                    {view === 'forgot' && (
                        <ForgotPasswordForm onViewChange={setView} />
                    )}
                    {view === 'reset' && (
                        <ResetPasswordForm onViewChange={setView} />
                    )}
                </div>
            </div>
        </div>
    );
}
