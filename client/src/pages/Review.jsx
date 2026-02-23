import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, getAuth } from '../api';
import StepIndicator from '../components/StepIndicator';

export default function Review() {
    const navigate = useNavigate();
    const { submissionId, accessToken } = getAuth();

    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!submissionId || !accessToken) {
            navigate('/');
            return;
        }
        apiGet('/api/submission/info')
            .then((data) => {
                setInfo(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const result = await apiPost('/api/submission/submit', {});
            // Store download URLs for success page
            localStorage.setItem('zipDownloadUrl', result.zipDownloadUrl);
            localStorage.setItem('excelDownloadUrl', result.excelDownloadUrl);
            navigate('/submit/success');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pt-8 max-w-2xl mx-auto">
            <StepIndicator currentStep={3} />

            <h2 className="text-2xl font-bold text-white mb-1">Review Submission</h2>
            <p className="text-gray-400 text-sm mb-6">Verify your information before submitting</p>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {info && (
                <div className="space-y-4 mb-8">
                    {/* Brand Info */}
                    <div className="bg-[#181924] rounded-2xl p-6 border border-gray-800/50">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Brand Information</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Brand Name</span>
                                <span className="text-white font-medium">{info.brandName}</span>
                            </div>
                            {info.phone && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Phone</span>
                                    <span className="text-white">{info.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assets Summary */}
                    <div className="bg-[#181924] rounded-2xl p-6 border border-gray-800/50">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Assets</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Logo</span>
                                {info.logoUploaded ? (
                                    <span className="flex items-center gap-1 text-emerald-400 text-sm">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Uploaded
                                    </span>
                                ) : (
                                    <span className="text-amber-400 text-sm">Not uploaded</span>
                                )}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Product Images</span>
                                <span className="text-white">{info.imageCount} image{info.imageCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>

                    {/* Menu Summary */}
                    <div className="bg-[#181924] rounded-2xl p-6 border border-gray-800/50">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Menu</h3>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Menu Items</span>
                            <span className="text-white">{info.menuItems?.length || 0} item{(info.menuItems?.length || 0) !== 1 ? 's' : ''}</span>
                        </div>
                        {info.menuItems && info.menuItems.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                                {info.menuItems.slice(0, 5).map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-gray-400 truncate mr-4">{item.item_name_en || item.item_name_ar || `Item ${i + 1}`}</span>
                                        <span className="text-gray-500 shrink-0">{item.price || '—'}</span>
                                    </div>
                                ))}
                                {info.menuItems.length > 5 && (
                                    <p className="text-xs text-gray-600">+{info.menuItems.length - 5} more items</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pb-8">
                <button
                    onClick={() => navigate('/submit/menu')}
                    className="px-6 py-3 text-gray-400 hover:text-white border border-gray-700/50 rounded-xl transition-all"
                >
                    ← Edit Menu
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-10 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                    {submitting ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Generating files...
                        </span>
                    ) : (
                        'Submit & Generate ✓'
                    )}
                </button>
            </div>
        </div>
    );
}
