import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';

export default function Gateway() {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-xl text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 mb-6 shadow-xl shadow-brand-600/30">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                    {t('gatewayTitle')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-10 leading-relaxed font-medium">
                    {t('gatewaySubtitle')}
                </p>

                <div className="flex flex-col gap-4 max-w-md mx-auto relative z-10">
                    {/* Step 1 Button */}
                    <button
                        onClick={() => navigate('/docs/info')}
                        className="group flex items-center justify-between p-5 sm:p-6 bg-white dark:bg-[#181924] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-md hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-500/50 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="flex-shrink-0 w-12 h-12 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                                <span className="font-bold text-lg">1</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                    {t('step1Docs')}
                                </h3>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {t('step1DocsHint')}
                                </p>
                            </div>
                        </div>
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-brand-500 transition-colors rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Step 2 Button */}
                    <button
                        onClick={() => navigate('/menu')}
                        className="group flex items-center justify-between p-5 sm:p-6 bg-white dark:bg-[#181924] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-md hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-500/50 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-50 dark:bg-[#0f1117] rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                <span className="font-bold text-lg">2</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                    {t('step2Menu')}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('step2MenuHint')}
                                </p>
                            </div>
                        </div>
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-brand-500 transition-colors rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
