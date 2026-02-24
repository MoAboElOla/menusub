import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUpload, apiDelete, getAuth } from '../api';
import { useLanguage } from '../i18n';
import StepIndicator from '../components/StepIndicator';

const MIN_DIM = 1000;

export default function Assets() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { submissionId, accessToken } = getAuth();

    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoWarning, setLogoWarning] = useState('');
    const [logoProgress, setLogoProgress] = useState(0);
    const [images, setImages] = useState([]);          // { filename, originalName, width, height, preview, rejected }
    const [imageProgress, setImageProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [logoDragOver, setLogoDragOver] = useState(false);
    const [imagesDragOver, setImagesDragOver] = useState(false);

    const logoInputRef = useRef(null);
    const imagesInputRef = useRef(null);

    useEffect(() => { if (!submissionId || !accessToken) navigate('/'); }, []);

    // Derived — are there any undersized images?
    const rejectedImages = images.filter(img => img.rejected);
    const hasRejected = rejectedImages.length > 0;

    // ── Logo upload ──
    const uploadLogo = async (file) => {
        if (!file) return;
        setLogoPreview(URL.createObjectURL(file));
        setLogoWarning(''); setUploading(true); setError('');
        try {
            const formData = new FormData();
            formData.append('logo', file);
            const result = await apiUpload('/api/submission/upload-logo', formData, setLogoProgress);
            setLogo(result);
            if (result.warning) setLogoWarning(result.warning);
            setLogoProgress(100);
        } catch (err) { setError(t('uploadFailed') + ': ' + err.message); setLogoPreview(null); }
        finally { setUploading(false); }
    };

    const handleLogoUpload = (e) => uploadLogo(e.target.files[0]);

    // ── Product images upload ──
    const uploadImages = async (files) => {
        if (files.length === 0) return;
        setUploading(true); setError(''); setImageProgress(0);
        try {
            const formData = new FormData();
            files.forEach((f) => formData.append('images', f));
            const results = await apiUpload('/api/submission/upload-images', formData, setImageProgress);
            const newImages = results.map((r, i) => ({
                ...r,
                preview: URL.createObjectURL(files[i]),
                rejected: (r.width < MIN_DIM || r.height < MIN_DIM),
            }));
            setImages((prev) => [...prev, ...newImages]);
            setImageProgress(100);
        } catch (err) { setError(t('uploadFailed') + ': ' + err.message); }
        finally { setUploading(false); }
    };

    const handleImagesUpload = (e) => uploadImages(Array.from(e.target.files));

    // ── Delete image ──
    const handleDeleteImage = async (idx) => {
        if (!window.confirm(t('confirmDeleteImage') || 'Are you sure you want to delete this image?')) return;
        const img = images[idx];
        try {
            await apiDelete('/api/submission/delete-image', { filename: img.filename });
            setImages(prev => prev.filter((_, i) => i !== idx));
        } catch (err) {
            setError(t('uploadFailed') + ': ' + err.message);
        }
    };

    // ── Drag helpers ──
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };

    const handleLogoDrop = (e) => {
        prevent(e); setLogoDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) uploadLogo(file);
    };

    const handleImagesDrop = (e) => {
        prevent(e); setImagesDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (droppedFiles.length > 0) uploadImages(droppedFiles);
    };

    return (
        <div className="min-h-screen p-4 pt-8 max-w-2xl mx-auto">
            <StepIndicator currentStep={1} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('assetsTitle')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t('assetsSubtitle')}</p>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {error}
                </div>
            )}

            {/* Rejected images banner */}
            {hasRejected && (
                <div className="flex items-start gap-3 px-5 py-4 mb-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-400 dark:border-red-500/40 rounded-xl text-red-700 dark:text-red-300">
                    <svg className="w-6 h-6 shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <div>
                        <p className="font-bold text-sm">{t('rejectedImagesTitle') || `${rejectedImages.length} image(s) will be rejected`}</p>
                        <p className="text-sm mt-0.5">{t('rejectedImagesMsg') || `Images must be at least ${MIN_DIM}×${MIN_DIM} pixels. Please delete the highlighted images below and re-upload higher resolution versions.`}</p>
                    </div>
                </div>
            )}

            {/* Logo */}
            <div className="bg-white dark:bg-[#181924] rounded-2xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-sm dark:shadow-none mb-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {t('logo')}
                </h3>
                {logoPreview ? (
                    <div className="flex items-start gap-4">
                        <img src={logoPreview} alt="Logo" className="w-24 h-24 object-contain rounded-xl bg-gray-100 dark:bg-[#0f1117] border border-gray-200 dark:border-gray-700/50 p-2" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{logo?.filename || t('uploading')}</p>
                            {logo && <p className="text-xs text-gray-500">{logo.width} × {logo.height}px</p>}
                            {logoWarning && <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">⚠ {logoWarning}</p>}
                            {logoProgress > 0 && logoProgress < 100 && (
                                <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${logoProgress}%` }} />
                                </div>
                            )}
                            <button onClick={() => { if (window.confirm(t('confirmReuploadLogo') || 'Remove current logo and upload a new one?')) { setLogo(null); setLogoPreview(null); setLogoWarning(''); } }}
                                className="mt-2 text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">{t('removeReupload')}</button>
                        </div>
                    </div>
                ) : (
                    <div
                        onDragOver={(e) => { prevent(e); setLogoDragOver(true); }}
                        onDragEnter={(e) => { prevent(e); setLogoDragOver(true); }}
                        onDragLeave={(e) => { prevent(e); setLogoDragOver(false); }}
                        onDrop={handleLogoDrop}
                        onClick={() => logoInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${logoDragOver
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 scale-[1.01]'
                            : 'border-gray-300 dark:border-gray-700/50 hover:border-brand-500/50 hover:bg-brand-50 dark:hover:bg-brand-500/5'
                            }`}
                    >
                        {logoDragOver ? (
                            <>
                                <svg className="w-8 h-8 text-brand-500 mb-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                <span className="text-sm text-brand-600 dark:text-brand-400 font-medium">{t('dropHere')}</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                <span className="text-sm text-gray-500">{t('uploadLogo')}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{t('logoFormats')}</span>
                                <span className="text-xs text-brand-500/70 dark:text-brand-400/50 mt-1">{t('dragDropHint')}</span>
                            </>
                        )}
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </div>
                )}
            </div>

            {/* Product Images */}
            <div className="bg-white dark:bg-[#181924] rounded-2xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-sm dark:shadow-none mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    {t('productImages')}
                    {images.length > 0 && <span className="text-xs bg-brand-100 dark:bg-brand-600/20 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full">{images.length}</span>}
                </h3>
                <div
                    onDragOver={(e) => { prevent(e); setImagesDragOver(true); }}
                    onDragEnter={(e) => { prevent(e); setImagesDragOver(true); }}
                    onDragLeave={(e) => { prevent(e); setImagesDragOver(false); }}
                    onDrop={handleImagesDrop}
                    onClick={() => imagesInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all mb-4 ${imagesDragOver
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 scale-[1.01]'
                        : 'border-gray-300 dark:border-gray-700/50 hover:border-brand-500/50 hover:bg-brand-50 dark:hover:bg-brand-500/5'
                        }`}
                >
                    {imagesDragOver ? (
                        <>
                            <svg className="w-7 h-7 text-brand-500 mb-1.5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                            <span className="text-sm text-brand-600 dark:text-brand-400 font-medium">{t('dropHere')}</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-7 h-7 text-gray-400 dark:text-gray-600 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-sm text-gray-500">{t('uploadImages')}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{t('selectMultiple')}</span>
                            <span className="text-xs text-brand-500/70 dark:text-brand-400/50 mt-1">{t('dragDropHint')}</span>
                        </>
                    )}
                    <input ref={imagesInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} />
                </div>

                {imageProgress > 0 && imageProgress < 100 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{t('uploading')}</span><span>{imageProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${imageProgress}%` }} />
                        </div>
                    </div>
                )}

                {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {images.map((img, i) => (
                            <div key={i} className={`relative group rounded-xl overflow-hidden border-2 transition-all ${img.rejected
                                ? 'border-red-500 ring-2 ring-red-500/30 shadow-lg shadow-red-500/10'
                                : 'border-gray-200 dark:border-gray-700/50'
                                }`}>
                                <img src={img.preview} alt={img.originalName} className={`w-full aspect-square object-cover ${img.rejected ? 'opacity-60' : ''}`} />

                                {/* Rejected overlay */}
                                {img.rejected && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-[1px]">
                                        <svg className="w-8 h-8 text-red-400 mb-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        <span className="text-[10px] text-red-200 font-bold px-1 text-center">{img.width}×{img.height}</span>
                                        <span className="text-[9px] text-red-300 px-1 text-center mt-0.5">Min {MIN_DIM}×{MIN_DIM}</span>
                                    </div>
                                )}

                                {/* Dimensions badge */}
                                {!img.rejected && img.width && (
                                    <div className="absolute top-1 left-1 bg-emerald-500/90 text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold">
                                        {img.width}×{img.height}
                                    </div>
                                )}

                                {/* Delete button */}
                                <button
                                    onClick={() => handleDeleteImage(i)}
                                    className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all ${img.rejected
                                        ? 'bg-red-500 text-white opacity-100'
                                        : 'bg-black/60 text-white opacity-0 group-hover:opacity-100'
                                        }`}
                                    title={t('deleteImage') || 'Delete'}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>

                                {/* Filename on hover */}
                                {!img.rejected && (
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-gray-300 truncate">{img.originalName}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => navigate('/submit/menu')}
                    disabled={uploading || hasRejected}
                    className={`px-8 py-3 font-semibold rounded-xl transition-all duration-200 shadow-lg active:scale-[0.98] ${hasRejected
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white shadow-brand-600/20'
                        } disabled:opacity-60`}
                >
                    {hasRejected ? (t('removeRejectedFirst') || 'Remove rejected images first') : t('nextMenu')}
                </button>
            </div>
        </div>
    );
}
