import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUpload, getAuth } from '../api';
import StepIndicator from '../components/StepIndicator';

export default function Assets() {
    const navigate = useNavigate();
    const { submissionId, accessToken } = getAuth();

    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoWarning, setLogoWarning] = useState('');
    const [logoProgress, setLogoProgress] = useState(0);

    const [images, setImages] = useState([]);
    const [imageProgress, setImageProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!submissionId || !accessToken) {
            navigate('/');
        }
    }, []);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLogoPreview(URL.createObjectURL(file));
        setLogoWarning('');
        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('logo', file);
            const result = await apiUpload('/api/submission/upload-logo', formData, setLogoProgress);
            setLogo(result);
            if (result.warning) setLogoWarning(result.warning);
            setLogoProgress(100);
        } catch (err) {
            setError('Failed to upload logo: ' + err.message);
            setLogoPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const handleImagesUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setError('');
        setImageProgress(0);

        try {
            const formData = new FormData();
            files.forEach((f) => formData.append('images', f));
            const results = await apiUpload('/api/submission/upload-images', formData, setImageProgress);
            setImages((prev) => [
                ...prev,
                ...results.map((r, i) => ({
                    ...r,
                    preview: URL.createObjectURL(files[i]),
                })),
            ]);
            setImageProgress(100);
        } catch (err) {
            setError('Failed to upload images: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 pt-8 max-w-2xl mx-auto">
            <StepIndicator currentStep={1} />

            <h2 className="text-2xl font-bold text-white mb-1">Brand Assets</h2>
            <p className="text-gray-400 text-sm mb-6">Upload your logo and product images</p>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Logo Upload */}
            <div className="bg-[#181924] rounded-2xl p-6 border border-gray-800/50 mb-5">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Logo
                </h3>

                {logoPreview ? (
                    <div className="flex items-start gap-4">
                        <img src={logoPreview} alt="Logo" className="w-24 h-24 object-contain rounded-xl bg-[#0f1117] border border-gray-700/50 p-2" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-300">{logo?.filename || 'Uploading...'}</p>
                            {logo && <p className="text-xs text-gray-500">{logo.width} × {logo.height}px</p>}
                            {logoWarning && (
                                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {logoWarning}
                                </p>
                            )}
                            {logoProgress > 0 && logoProgress < 100 && (
                                <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${logoProgress}%` }} />
                                </div>
                            )}
                            <button
                                onClick={() => { setLogo(null); setLogoPreview(null); setLogoWarning(''); }}
                                className="mt-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
                            >
                                Remove & re-upload
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700/50 rounded-xl cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all">
                        <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm text-gray-500">Click to upload logo</span>
                        <span className="text-xs text-gray-600 mt-0.5">PNG, JPG, SVG</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                )}
            </div>

            {/* Product Images Upload */}
            <div className="bg-[#181924] rounded-2xl p-6 border border-gray-800/50 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Product Images
                    {images.length > 0 && (
                        <span className="text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">{images.length}</span>
                    )}
                </h3>

                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-700/50 rounded-xl cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all mb-4">
                    <svg className="w-7 h-7 text-gray-600 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">Click to upload product images</span>
                    <span className="text-xs text-gray-600 mt-0.5">Select multiple files</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} />
                </label>

                {imageProgress > 0 && imageProgress < 100 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Uploading...</span>
                            <span>{imageProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${imageProgress}%` }} />
                        </div>
                    </div>
                )}

                {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {images.map((img, i) => (
                            <div key={i} className="relative group">
                                <img
                                    src={img.preview}
                                    alt={img.originalName}
                                    className="w-full aspect-square object-cover rounded-xl border border-gray-700/50"
                                />
                                {img.warning && (
                                    <div className="absolute top-1 right-1 w-5 h-5 bg-amber-500/90 rounded-full flex items-center justify-center" title={img.warning}>
                                        <span className="text-xs font-bold text-black">!</span>
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[10px] text-gray-300 truncate">{img.originalName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-end">
                <button
                    onClick={() => navigate('/submit/menu')}
                    disabled={uploading}
                    className="px-8 py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-600/20 active:scale-[0.98]"
                >
                    Next: Menu →
                </button>
            </div>
        </div>
    );
}
