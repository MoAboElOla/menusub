import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiUpload, apiDelete, apiPost } from '../api';
import { useLanguage } from '../i18n';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// Reusable Document Uploader Block
function DocUploader({ title, docType, isUploaded, onUpload, onDelete, warningText, extraNote }) {
    const { t } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setError('File size must be less than 20MB');
            return;
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only PDF, JPG, or PNG files are allowed');
            return;
        }

        setError('');
        setUploading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('docType', docType); // Append metadata before the file!
            formData.append('document', file);

            await apiUpload('/api/docs/upload', formData, setProgress);
            onUpload(docType);
            setProgress(100);
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Fake an event object to reuse handleFileChange
            handleFileChange({ target: { files: e.dataTransfer.files } });
            e.dataTransfer.clearData();
        }
    };

    const handleDelete = async () => {
        try {
            await apiDelete('/api/docs/delete', { docType });
            onDelete(docType);
        } catch (err) {
            setError('Failed to delete file');
        }
    };

    return (
        <div
            className={`p-4 rounded-xl border-2 transition-all ${isUploaded
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/5'
                : isDragging
                    ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-500/10'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181924]'
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {isUploaded && (
                        <svg className="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )}
                    {title}
                </h3>
                {isUploaded ? (
                    <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 bg-red-50 dark:bg-red-500/10 rounded-lg transition-colors">
                        {t('remove')}
                    </button>
                ) : (
                    <span className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">{t('required')}</span>
                )}
            </div>

            {warningText && (
                <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 leading-snug">
                        {warningText}
                    </p>
                </div>
            )}

            {extraNote && (
                <div className="mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg">
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 leading-snug">
                        {extraNote}
                    </p>
                </div>
            )}

            {!isUploaded ? (
                <div className="mt-3">
                    <input type="file" ref={inputRef} accept="application/pdf,image/jpeg,image/png,image/jpg" className="hidden" onChange={handleFileChange} />
                    <button onClick={() => inputRef.current?.click()} disabled={uploading}
                        className="w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all flex justify-center items-center gap-2">
                        {uploading ? (
                            <>
                                <svg className="animate-spin w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                {progress > 0 ? `${progress}%` : t('uploading')}
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                                {t('uploadFile') || 'Upload File'}
                            </>
                        )}
                    </button>
                    <p className="text-[11px] text-gray-400 mt-2 text-center">{t('uploadLimitHint')}</p>
                    {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
                </div>
            ) : (
                <div className="mt-2 p-2 bg-white dark:bg-[#0f1117] rounded-lg border border-brand-200 dark:border-brand-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <svg className="w-4 h-4 text-green-500 min-w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{docType} {t('docUploadSuccess')}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DocsUpload() {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        apiGet('/api/docs/info')
            .then(data => setInfo(data))
            .catch(err => {
                console.error(err);
                navigate('/docs/info');
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">{t('loading')}</div>;
    }

    if (!info) return null;

    const isHome = info.businessType === 'home';
    const ibanWarningText = t('docsIbanWarning');
    const ibanOwnerNote = isHome ? t('docsIbanOwnerHome') : t('docsIbanOwnerCommercial');

    const requiredDocs = isHome
        ? [
            { key: 'Home_License', title: t('docHomeLicense') },
            { key: 'IBAN_Stamped', title: t('docIban'), warning: ibanWarningText, extraNote: ibanOwnerNote },
            { key: 'QID', title: t('docQid') }
        ]
        : [
            { key: 'CR', title: t('docCR') },
            { key: 'Trade_License', title: t('docTradeLicense') },
            { key: 'Computer_Card', title: t('docComputerCard') },
            { key: 'IBAN_Stamped', title: t('docIban'), warning: ibanWarningText, extraNote: ibanOwnerNote },
            { key: 'QID', title: t('docQid') }
        ];

    const handleUploadComplete = (docType) => {
        setInfo(prev => ({ ...prev, uploadedDocs: [...prev.uploadedDocs, docType] }));
    };

    const handleDeleteComplete = (docType) => {
        setInfo(prev => ({ ...prev, uploadedDocs: prev.uploadedDocs.filter(d => d !== docType) }));
    };

    const allUploaded = requiredDocs.every(d => info.uploadedDocs.includes(d.key));

    const handleSubmit = async () => {
        if (!allUploaded) return;
        setSubmitting(true);
        setError('');
        try {
            await apiPost('/api/docs/submit', {});
            navigate('/docs/success');
        } catch (err) {
            setError(err.message || 'Failed to submit documents');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen p-4 py-10 relative">
            {/* Back Button */}
            <div className="absolute top-6 left-6 rtl:right-6 rtl:left-auto pt-2">
                <button
                    onClick={() => navigate('/docs/info')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('back') || 'Back'}
                </button>
            </div>

            <div className="w-full max-w-5xl mx-auto mt-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('docsUploadTitle')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('docsUploadSubtitle')} ({isHome ? t('homeBusiness') : t('commercialBusiness')})</p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Document Uploads */}
                    <div className="flex-1 space-y-4">
                        {requiredDocs.map(doc => (
                            <DocUploader
                                key={doc.key}
                                docType={doc.key}
                                title={doc.title}
                                warningText={doc.warning}
                                extraNote={doc.extraNote}
                                isUploaded={info.uploadedDocs.includes(doc.key)}
                                onUpload={handleUploadComplete}
                                onDelete={handleDeleteComplete}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex border-t border-gray-200 dark:border-gray-800 pt-6">
                    <button onClick={handleSubmit} disabled={!allUploaded || submitting}
                        className="w-full lg:w-auto lg:min-w-[300px] py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/20 active:scale-[0.98] flex items-center justify-center gap-2">
                        {submitting ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                {t('submitting') || 'Submitting...'}
                            </>
                        ) : t('submitDocs')}
                    </button>
                </div>
            </div>
        </div>
    );
}
