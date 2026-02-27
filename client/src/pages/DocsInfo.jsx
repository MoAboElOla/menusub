import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost, setAuth, clearAuth } from '../api';
import { useLanguage } from '../i18n';
import { BUSINESS_TYPES } from '../templateData';

export default function DocsInfo() {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [brandName, setBrandName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [businessType, setBusinessType] = useState(''); // 'home' or 'commercial'

    // Categories
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [categoriesDescription, setCategoriesDescription] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const needsDescription = selectedCategories.includes('cat_other');

    const toggleCategory = (catId) => {
        setSelectedCategories(prev =>
            prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !brandName.trim() ||
            !contactEmail.trim() ||
            !contactPhone.trim() ||
            !businessType ||
            selectedCategories.length === 0 ||
            (needsDescription && !categoriesDescription.trim())
        ) {
            setError(t('docsValidationErrors') || 'Please fill in all mandatory fields before proceeding to the next step.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            clearAuth(); // Start fresh

            const data = await apiPost('/api/docs/create', {
                brandName: brandName.trim(),
                businessType,
                contactEmail: contactEmail.trim(),
                contactPhone: contactPhone.trim(),
                categories: selectedCategories,
                categoriesDescription: categoriesDescription.trim()
            });
            setAuth(data.submissionId, data.accessToken);
            navigate('/docs/upload');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 py-8 flex items-center justify-center relative bg-gray-50 dark:bg-[#0f1117] transition-colors duration-300">
            {/* Back Button */}
            <div className="absolute top-6 left-6 rtl:right-6 rtl:left-auto pt-2">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('back') || 'Back'}
                </button>
            </div>

            <div className="w-full max-w-2xl mt-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('docsInfoTitle')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm whitespace-pre-line">{t('docsInfoSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-[#181924] rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-none border border-transparent dark:border-gray-800 space-y-8">
                    {/* Brand Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('brandName')} <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                            placeholder={t('brandNamePlaceholder')}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f1117] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all" />
                    </div>

                    {/* Contact Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Official Contact Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('contactEmail')} <span className="text-red-500">*</span>
                            </label>
                            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                                placeholder={t('contactEmailPlaceholder')}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f1117] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all" />
                        </div>

                        {/* Official Contact Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('contactPhone')} <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                                placeholder="+974 5555 1234"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f1117] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all" />
                            <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-1.5 font-medium leading-tight">
                                {t('docsPhoneWarning')}
                            </p>
                        </div>
                    </div>

                    {/* Business Type (Single Select) */}
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            {t('businessType')} <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setBusinessType('home')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center
                                    ${businessType === 'home'
                                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-lg shadow-brand-500/10 scale-[1.02]'
                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1117] hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className={`font-bold text-lg ${businessType === 'home' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {t('homeBusiness')}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setBusinessType('commercial')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center
                                    ${businessType === 'commercial'
                                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-lg shadow-brand-500/10 scale-[1.02]'
                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1117] hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className={`font-bold text-lg ${businessType === 'commercial' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {t('commercialBusiness')}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Categories Multi-Select UI Blocks */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="mb-4 text-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('docsCategoriesTitle')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('docsCategoriesSubtitle')} <span className="text-red-400 font-bold">*</span></p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {BUSINESS_TYPES.map((cat) => {
                                const isSelected = selectedCategories.includes(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => toggleCategory(cat.id)}
                                        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center
                                            ${isSelected
                                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-md shadow-brand-500/10 scale-[1.02]'
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1117] hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <span className="text-3xl">{cat.emoji}</span>
                                        <span className={`text-xs font-semibold leading-snug ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {t(cat.id)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Categories Description */}
                    {needsDescription && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('docsCategoriesDesc')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={categoriesDescription}
                                onChange={(e) => setCategoriesDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f1117] border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all resize-none"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <button type="button" onClick={() => navigate('/')} className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium transition-colors">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={loading}
                            className="px-8 py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/20 active:scale-[0.98] flex items-center justify-center min-w-[160px] text-lg">
                            {loading ? (
                                <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : t('nextDocs')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
