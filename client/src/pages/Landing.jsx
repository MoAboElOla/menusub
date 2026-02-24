import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost, setAuth, clearAuth } from '../api';
import { useLanguage } from '../i18n';
import { BUSINESS_TYPES } from '../templateData';

export default function Landing() {
    const { t } = useLanguage();
    const [brandName, setBrandName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!brandName.trim()) { setError(t('brandNameRequired')); return; }
        if (!businessType) { setError(t('businessTypeRequired')); return; }
        setLoading(true); setError('');
        try {
            clearAuth();
            const data = await apiPost('/api/submission/create', { brandName: brandName.trim(), businessType });
            setAuth(data.submissionId, data.accessToken);
            navigate('/submit/assets');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 mb-5 shadow-xl shadow-brand-600/20">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('landingTitle')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">{t('landingSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="bg-white dark:bg-[#181924] rounded-2xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-xl dark:shadow-none">
                        <div className="space-y-5">
                            {/* Brand Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('brandName')} <span className="text-red-400">*</span>
                                </label>
                                <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                                    placeholder={t('brandNamePlaceholder')}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f1117] border border-gray-300 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all" />
                            </div>

                            {/* Business Type Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                                    {t('businessType')} <span className="text-red-400">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {BUSINESS_TYPES.map((bt) => {
                                        const isSelected = businessType === bt.id;
                                        return (
                                            <button
                                                key={bt.id}
                                                type="button"
                                                onClick={() => setBusinessType(bt.id)}
                                                className={`flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center
                                                    ${isSelected
                                                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-lg shadow-brand-500/10 scale-[1.02]'
                                                        : 'border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-[#0f1117] hover:border-gray-300 dark:hover:border-gray-500/60 hover:bg-gray-100 dark:hover:bg-[#14151f]'
                                                    }`}
                                            >
                                                <span className="text-2xl">{bt.emoji}</span>
                                                <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {t('bt_' + bt.id)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30 active:scale-[0.98]">
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {t('creating')}
                            </span>
                        ) : t('getStarted')}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">{t('filesDeletedNotice')}</p>
            </div>
        </div>
    );
}
