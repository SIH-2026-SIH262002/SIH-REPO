import React from 'react';

export default function RegisterForm({ onViewChange }) {
    return (
        <div className="space-y-5 text-center py-4">
            <div className="p-4 bg-slate-900/60 border border-slate-700/60 rounded-2xl text-slate-300 text-xs leading-relaxed">
                Public self-registration is disabled. NER LogiSense user accounts are provisioned exclusively by authorized platform administrators.
            </div>
            <button
                type="button"
                onClick={() => onViewChange('login')}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
                Return to Authorized Login
            </button>
        </div>
    );
}
