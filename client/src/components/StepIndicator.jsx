import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { getAuth } from '../api';

export default function StepIndicator({ currentStep }) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { submissionId } = getAuth();

    const steps = [
        { num: 1, label: t('stepAssets'), path: '/submit/assets' },
        { num: 2, label: t('stepMenu'), path: '/submit/menu' },
        { num: 3, label: t('stepLocation'), path: '/submit/location' },
        { num: 4, label: t('stepReview'), path: '/submit/review' },
    ];

    const handleStepClick = (path) => {
        if (submissionId) {
            navigate(path);
        }
    };

    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, i) => (
                <div key={step.num} className="flex items-center">
                    <button
                        onClick={() => handleStepClick(step.path)}
                        disabled={!submissionId}
                        className={`group flex flex-col items-center focus:outline-none ${!submissionId ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep === step.num
                                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-110'
                                : currentStep > step.num
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40'
                                    : 'bg-gray-100 dark:bg-[#1e1f2e] text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-700'
                                } ${submissionId && currentStep !== step.num ? 'group-hover:ring-2 group-hover:ring-brand-500/50' : ''}`}
                        >
                            {currentStep > step.num ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                step.num
                            )}
                        </div>
                        <span
                            className={`text-xs mt-1.5 font-medium transition-colors ${currentStep === step.num
                                ? 'text-brand-600 dark:text-brand-400'
                                : currentStep > step.num
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-gray-400 dark:text-gray-600'
                                } ${submissionId && currentStep !== step.num ? 'group-hover:text-brand-500' : ''}`}
                        >
                            {step.label}
                        </span>
                    </button>
                    {i < steps.length - 1 && (
                        <div
                            className={`w-12 sm:w-20 h-0.5 mx-2 mb-5 rounded transition-all duration-300 ${currentStep > step.num ? 'bg-emerald-400/40 dark:bg-emerald-500/40' : 'bg-gray-300/50 dark:bg-gray-700/50'
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
