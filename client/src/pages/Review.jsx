import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, getAuth } from '../api';
import { useLanguage } from '../i18n';
import StepIndicator from '../components/StepIndicator';

export default function Review() {
    const { t, isRtl } = useLanguage();
    const navigate = useNavigate();
    const { submissionId, accessToken } = getAuth();
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!submissionId || !accessToken) { navigate('/'); return; }
        apiGet('/api/submission/info').then((d) => { setInfo(d); setLoading(false); }).catch((e) => { setError(e.message); setLoading(false); });
    }, []);

    const handleSubmit = async () => {
        setSubmitting(true); setError('');
        try {
            const result = await apiPost('/api/submission/submit', {});
            localStorage.setItem('zipDownloadUrl', result.zipDownloadUrl);
            localStorage.setItem('excelDownloadUrl', result.excelDownloadUrl);
            navigate('/submit/success');
        } catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="min-h-screen p-4 pt-8 max-w-2xl mx-auto pb-12">
            <StepIndicator currentStep={4} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('reviewTitle')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t('reviewSubtitle')}</p>

            {error && <div className="px-4 py-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}

            {info && (
                <div className="space-y-4 mb-8">
                    <div className="bg-white dark:bg-[#181924] rounded-2xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-sm dark:shadow-none">
                        <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">{t('brandInfo')}</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('brandName')}</span><span className="text-gray-900 dark:text-white font-medium">{info.brandName}</span></div>
                            {info.businessType && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('businessType')}</span><span className="text-gray-900 dark:text-white font-medium">{t(info.businessType)}</span></div>}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#181924] rounded-2xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-sm dark:shadow-none">
                        <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">{t('assets')}</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">{t('logo')}</span>
                                {info.logoUploaded
                                    ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('logoUploaded')}</span>
                                    : <span className="text-amber-500 dark:text-amber-400 text-sm">{t('logoNotUploaded')}</span>}
                            </div>
                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('productImages')}</span><span className="text-gray-900 dark:text-white">{info.imageCount} {t('images')}</span></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#181924] rounded-2xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-sm dark:shadow-none">
                        <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">{t('menuItems')}</h3>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('menuItems')}</span><span className="text-gray-900 dark:text-white">{info.menuItems?.length || 0} {t('items')}</span></div>
                    </div>

                    <div className="bg-white dark:bg-[#181924] rounded-2xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-sm dark:shadow-none">
                        <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">{t('locationHours')}</h3>
                        {info.locationDetails ? (
                            <div className="space-y-4">
                                <div className="space-y-1.5 border-b border-gray-200 dark:border-gray-800 pb-4">
                                    {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => {
                                        const d = info.locationDetails.schedule[day];
                                        return (
                                            <div key={day} className="flex justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">{t('day' + day.charAt(0).toUpperCase() + day.slice(1))}</span>
                                                <span className={d.closed ? 'text-red-500 dark:text-red-400/70' : (d.is24Hours ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-700 dark:text-gray-300')}>
                                                    {d.closed ? t('closedAllDay') : (d.is24Hours ? t('open24Hours') : `${d.from.h}:${d.from.m} ${t(d.from.p.toLowerCase())} - ${d.to.h}:${d.to.m} ${t(d.to.p.toLowerCase())}`)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">{t('pickupLocation')}</span>
                                        <span className="text-gray-900 dark:text-white text-sm break-all font-mono bg-gray-100 dark:bg-black/20 p-2 rounded-lg border border-gray-200 dark:border-gray-800">{info.locationDetails.pickupLocation || '—'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 dark:text-gray-400 text-sm">{t('operationalPhone')}</span>
                                        <span className="text-brand-600 dark:text-brand-400 font-medium">{info.locationDetails.operationalPhone || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-amber-500 dark:text-amber-400/70">{t('noLocationDetails') || 'Missing information'}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="flex justify-between mt-auto">
                <button onClick={() => navigate('/submit/location')} className="px-6 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700/50 rounded-xl transition-all">{t('editLocation')}</button>
                <button onClick={handleSubmit} disabled={submitting}
                    className="px-10 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
                    {submitting ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            {t('generatingFiles')}
                        </span>
                    ) : t('submitGenerate')}
                </button>
            </div>
        </div>
    );
}
