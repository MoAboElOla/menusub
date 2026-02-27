import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiUpload, apiDelete, apiPost } from '../api';
import { useLanguage } from '../i18n';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// Reusable Document Uploader Block
function DocUploader({ title, docType, uploadedFiles = [], onUpload, onDelete, warningText, extraNote }) {
    const { t } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const [localPreviews, setLocalPreviews] = useState({}); // { filename: blobUrl }

    const isLimitReached = uploadedFiles.length >= 3;

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (uploadedFiles.length + files.length > 3) {
            setError(t('uploadLimitError') || 'Maximum 3 files allowed per document.');
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const invalidFile = files.find(f => !allowedTypes.includes(f.type));
        if (invalidFile) {
            setError('Only PDF, JPG, or PNG files are allowed');
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        const largeFile = files.find(f => f.size > MAX_FILE_SIZE);
        if (largeFile) {
            setError('File size must be less than 20MB');
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        setError('');
        setUploading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('docType', docType);
            files.forEach(f => formData.append('documents', f));

            const res = await apiUpload('/api/docs/upload', formData, setProgress);

            // Map NEW filenames to local blob URLs for instant preview
            const newLocalPreviews = {};
            res.filenames.forEach((fname, i) => {
                if (files[i].type.startsWith('image/')) {
                    newLocalPreviews[fname] = URL.createObjectURL(files[i]);
                }
            });
            setLocalPreviews(prev => ({ ...prev, ...newLocalPreviews }));

            onUpload(docType, res.filenames);
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
        if (!isLimitReached) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (isLimitReached) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
            e.dataTransfer.clearData();
        }
    };

    const handleDelete = async (filename) => {
        try {
            await apiDelete('/api/docs/delete', { filename });
            // Cleanup local preview if it exists
            if (localPreviews[filename]) {
                URL.revokeObjectURL(localPreviews[filename]);
                const next = { ...localPreviews };
                delete next[filename];
                setLocalPreviews(next);
            }
            onDelete(docType, filename);
        } catch (err) {
            setError('Failed to delete file');
        }
    };

    const getPreviewUrl = (filename) => {
        // Prefer local blob URL if available
        if (localPreviews[filename]) {
            return localPreviews[filename];
        }

        // Fallback to server secure URL
        const { submissionId, accessToken } = getAuth();
        return `/api/docs/preview/${filename}?accessToken=${accessToken}&submissionId=${submissionId}`;
    };

    return (
        <div
            className={`p-4 rounded-xl border-2 transition-all ${uploadedFiles.length > 0
                ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-500/5'
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
                    {uploadedFiles.length > 0 && (
                        <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )}
                    {title}
                </h3>
                {uploadedFiles.length === 0 && (
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

            {/* Display list of uploaded files */}
            {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2 mb-3">
                    {uploadedFiles.map((filename, idx) => {
                        const isPdf = filename.toLowerCase().endsWith('.pdf');
                        return (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-[#0f1117] rounded-lg border border-brand-200 dark:border-brand-800">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {isPdf ? (
                                        <div className="w-10 h-10 rounded shrink-0 bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </div>
                                    ) : (
                                        <img src={getPreviewUrl(filename)} alt="preview" className="w-10 h-10 object-cover rounded shadow-sm border border-gray-200 dark:border-gray-700" />
                                    )}
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate text-left dir-ltr" dir="ltr" title={filename}>{filename}</span>
                                </div>
                                <button onClick={() => handleDelete(filename)} className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1" title={t('remove') || 'Remove'}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLimitReached && (
                <div className="mt-2">
                    <input type="file" ref={inputRef} multiple accept="application/pdf,image/jpeg,image/png,image/jpg" className="hidden" onChange={handleFileChange} />
                    <button onClick={() => inputRef.current?.click()} disabled={uploading}
                        className="w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all flex justify-center items-center gap-2">
                        {uploading ? (
                            <>
                                <svg className="animate-spin w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                {progress > 0 ? `${progress}%` : t('uploading')}
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                                {t('uploadFile') || 'Upload Document'}
                            </>
                        )}
                    </button>
                    <p className="text-[11px] text-gray-400 mt-2 text-center">{t('uploadLimitHint') || 'Upload up to 3 files. Supported formats: PDF, JPG, PNG. Max 20MB per file.'}</p>
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-2 text-center bg-red-50 dark:bg-red-500/10 py-1.5 rounded">{error}</p>}
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

    const handleUploadComplete = (docType, newFilenames) => {
        setInfo(prev => {
            const current = prev.uploadedDocs[docType] || [];
            return {
                ...prev,
                uploadedDocs: { ...prev.uploadedDocs, [docType]: [...current, ...newFilenames] }
            };
        });
    };

    const handleDeleteComplete = (docType, deletedFilename) => {
        setInfo(prev => {
            const current = prev.uploadedDocs[docType] || [];
            return {
                ...prev,
                uploadedDocs: { ...prev.uploadedDocs, [docType]: current.filter(f => f !== deletedFilename) }
            };
        });
    };

    const allUploaded = requiredDocs.every(d => info.uploadedDocs[d.key] && info.uploadedDocs[d.key].length > 0);

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
                                uploadedFiles={info.uploadedDocs[doc.key] || []}
                                onUpload={handleUploadComplete}
                                onDelete={handleDeleteComplete}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex border-t border-gray-200 dark:border-gray-800 pt-6">
                    <button onClick={handleSubmit} disabled={!allUploaded || submitting}
                        className="w-full lg:w-auto lg:min-w-[300px] py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/20 active:scale-[0.98] flex items-center justify-center gap-2">
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
