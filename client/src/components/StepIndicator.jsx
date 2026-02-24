import { useLanguage } from '../i18n';

export default function StepIndicator({ currentStep }) {
    const { t } = useLanguage();
    const steps = [
        { num: 1, label: t('stepAssets') },
        { num: 2, label: t('stepMenu') },
        { num: 3, label: t('stepLocation') },
        { num: 4, label: t('stepReview') },
    ];

    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, i) => (
                <div key={step.num} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep === step.num
                                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-110'
                                : currentStep > step.num
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-[#1e1f2e] text-gray-500 border border-gray-700'
                                }`}
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
                            className={`text-xs mt-1.5 font-medium ${currentStep === step.num
                                ? 'text-brand-400'
                                : currentStep > step.num
                                    ? 'text-emerald-400'
                                    : 'text-gray-600'
                                }`}
                        >
                            {step.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div
                            className={`w-12 sm:w-20 h-0.5 mx-2 mb-5 rounded transition-all duration-300 ${currentStep > step.num ? 'bg-emerald-500/40' : 'bg-gray-700/50'
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
