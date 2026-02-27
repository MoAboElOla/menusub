import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { clearAuth } from '../api';

export default function DocsSuccess() {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-[#181924] rounded-2xl shadow-xl w-full max-w-md p-8 text-center border border-transparent dark:border-gray-800">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('docsSuccessTitle')}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">{t('docsSuccessMessage')}</p>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 font-medium">{t('docsSuccessSpeedUp')}</p>
                    <button
                        onClick={() => {
                            clearAuth();
                            navigate('/menu');
                        }}
                        className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        {t('docsSuccessStartMenu')}
                        <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                    <button
                        onClick={() => {
                            clearAuth();
                            navigate('/');
                        }}
                        className="w-full mt-4 py-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
                    >
                        {t('returnHome')}
                    </button>
                </div>
            </div>
        </div>
    );
}
