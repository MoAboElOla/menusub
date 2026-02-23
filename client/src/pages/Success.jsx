import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../api';

export default function Success() {
    const navigate = useNavigate();
    const [zipUrl, setZipUrl] = useState('');
    const [excelUrl, setExcelUrl] = useState('');

    useEffect(() => {
        const { submissionId } = getAuth();
        if (!submissionId) {
            navigate('/');
            return;
        }
        setZipUrl(localStorage.getItem('zipDownloadUrl') || '');
        setExcelUrl(localStorage.getItem('excelDownloadUrl') || '');
    }, []);

    const handleNewSubmission = () => {
        clearAuth();
        localStorage.removeItem('zipDownloadUrl');
        localStorage.removeItem('excelDownloadUrl');
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                {/* Success Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mb-6">
                    <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Submission Complete!</h1>
                <p className="text-gray-400 mb-8">Your menu package has been generated and is ready to download.</p>

                {/* Download Buttons */}
                <div className="space-y-3 mb-8">
                    {zipUrl && (
                        <a
                            href={zipUrl}
                            className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-brand-600/20 active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Package (ZIP)
                        </a>
                    )}
                    {excelUrl && (
                        <a
                            href={excelUrl}
                            className="flex items-center justify-center gap-3 w-full py-4 bg-[#181924] text-gray-200 border border-gray-700/50 hover:border-emerald-500/50 hover:text-emerald-400 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Menu (Excel)
                        </a>
                    )}
                </div>

                {/* Retention Notice */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-8">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-amber-300/80 text-left">
                            These files will be automatically deleted after <strong className="text-amber-300">72 hours</strong>. Make sure to download them now.
                        </p>
                    </div>
                </div>

                {/* New Submission */}
                <button
                    onClick={handleNewSubmission}
                    className="text-gray-500 hover:text-brand-400 text-sm transition-colors"
                >
                    ← Start New Submission
                </button>
            </div>
        </div>
    );
}
