import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, getAuth } from '../api';
import { useLanguage } from '../i18n';
import StepIndicator from '../components/StepIndicator';
import { TEMPLATE_CATEGORIES, TEMPLATE_ADDONS, TEMPLATE_EXAMPLES } from '../templateData';

const EMPTY_ITEM = {
    item_name_en: '', item_name_ar: '', description_en: '', description_ar: '',
    price: '', category: '', barcode: '', image: '', addons: [],
};
const EMPTY_ADDON = { name_en: '', name_ar: '', price: '' };

export default function Menu() {
    const { t, isRtl } = useLanguage();
    const navigate = useNavigate();
    const { submissionId, accessToken } = getAuth();

    const [items, setItems] = useState([{ ...EMPTY_ITEM, addons: [] }]);
    const [availableImages, setAvailableImages] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [draggedImage, setDraggedImage] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);
    const [activeAddonIdx, setActiveAddonIdx] = useState(null);
    const [copiedAddons, setCopiedAddons] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [businessType, setBusinessType] = useState('restaurants_cafes');
    const [customCategories, setCustomCategories] = useState([]);
    const [addingCategoryIdx, setAddingCategoryIdx] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        if (!submissionId || !accessToken) { navigate('/'); return; }
        apiGet('/api/submission/images').then(setAvailableImages).catch(() => { });
        apiGet('/api/submission/info').then((info) => {
            if (info.businessType) setBusinessType(info.businessType);
            if (info.menuItems && info.menuItems.length > 0) {
                setItems(info.menuItems.map((item) => ({ ...EMPTY_ITEM, ...item, addons: item.addons || [] })));
            }
        }).catch(() => { });
    }, []);

    // Derived config
    const templateCategories = TEMPLATE_CATEGORIES[businessType] || TEMPLATE_CATEGORIES.other;
    const allCategories = [...templateCategories.filter(c => c !== 'Other'), ...customCategories, 'Other'];
    const addonConfig = TEMPLATE_ADDONS[businessType] || TEMPLATE_ADDONS.other;
    const addonsEnabled = addonConfig.enabled;
    const example = TEMPLATE_EXAMPLES[businessType] || TEMPLATE_EXAMPLES.other;

    // ── Item management ──
    const updateItem = (idx, field, value) => {
        setItems((p) => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
        setSaved(false);
        if (validationErrors[idx]) {
            setValidationErrors((prev) => { const n = { ...prev }; delete n[idx]; return n; });
        }
    };

    const addItem = () => setItems((p) => [...p, { ...EMPTY_ITEM, addons: [] }]);

    const removeItem = (idx) => {
        setItems((p) => p.filter((_, i) => i !== idx));
        if (activeAddonIdx === idx) setActiveAddonIdx(null);
        else if (activeAddonIdx > idx) setActiveAddonIdx(activeAddonIdx - 1);
        setSaved(false);
    };

    const duplicateItem = (idx) => {
        setItems((p) => {
            const copy = [...p];
            copy.splice(idx + 1, 0, { ...p[idx], addons: p[idx].addons.map((a) => ({ ...a })) });
            return copy;
        });
    };

    // ── Drag & Drop ──
    const handleDragStart = (e, filename) => { e.dataTransfer.setData('text/plain', filename); setDraggedImage(filename); };
    const handleDragEnd = () => { setDraggedImage(null); setDropTarget(null); };
    const handleDragOver = (e, idx) => { e.preventDefault(); setDropTarget(idx); };
    const handleDragLeave = () => setDropTarget(null);
    const handleDrop = (e, idx) => {
        e.preventDefault();
        const filename = e.dataTransfer.getData('text/plain');
        if (filename) updateItem(idx, 'image', filename);
        setDraggedImage(null); setDropTarget(null);
    };

    // ── Add-ons ──
    const updateAddon = (itemIdx, addonIdx, field, value) => {
        setItems((p) => p.map((item, i) => {
            if (i !== itemIdx) return item;
            const newAddons = item.addons.map((a, j) => j === addonIdx ? { ...a, [field]: value } : a);
            return { ...item, addons: newAddons };
        }));
        setSaved(false);
    };
    const addAddon = (itemIdx) => {
        setItems((p) => p.map((item, i) => i === itemIdx ? { ...item, addons: [...item.addons, { ...EMPTY_ADDON }] } : item));
        setSaved(false);
    };
    const removeAddon = (itemIdx, addonIdx) => {
        setItems((p) => p.map((item, i) => i === itemIdx ? { ...item, addons: item.addons.filter((_, j) => j !== addonIdx) } : item));
        setSaved(false);
    };
    const copyAddons = (itemIdx) => setCopiedAddons(items[itemIdx].addons.map((a) => ({ ...a })));
    const pasteAddons = (itemIdx) => {
        if (!copiedAddons) return;
        setItems((p) => p.map((item, i) => i === itemIdx ? { ...item, addons: [...item.addons, ...copiedAddons.map((a) => ({ ...a }))] } : item));
        setSaved(false);
    };

    // ── Custom Category ──
    const handleAddCustomCategory = (idx) => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        if (!customCategories.includes(trimmed)) {
            setCustomCategories(prev => [...prev, trimmed]);
        }
        updateItem(idx, 'category', trimmed);
        setNewCategoryName('');
        setAddingCategoryIdx(null);
    };

    // ── Validation ──
    const validate = () => {
        const errors = {};
        items.forEach((item, idx) => {
            const itemErrors = [];
            if (!item.item_name_en?.trim() && !item.item_name_ar?.trim()) itemErrors.push('name');
            if (!item.price && item.price !== '0' && item.price !== 0) itemErrors.push('price');
            if (!item.image) itemErrors.push('image');
            if (itemErrors.length > 0) errors[idx] = itemErrors;
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ── Save & Navigate ──
    const saveMenu = async () => {
        setSaving(true); setError('');
        try {
            await apiPost('/api/submission/save-menu', { items });
            setSaved(true);
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };
    const handleNext = async () => {
        if (!validate()) return;
        await saveMenu();
        navigate('/submit/location');
    };

    // Get assigned images for checkmark display
    const assignedImages = new Set(items.map((i) => i.image).filter(Boolean));

    return (
        <div className="min-h-screen p-4 pt-8 max-w-[1400px] mx-auto">
            <StepIndicator currentStep={2} />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{t('menuTitle')}</h2>
                    <p className="text-gray-400 text-sm">{t('menuSubtitle')}</p>
                </div>
                <button onClick={addItem}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    {t('addItem')}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
            )}
            {saved && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {t('menuSaved')}
                </div>
            )}
            {Object.keys(validationErrors).length > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {t('validationErrors')}
                </div>
            )}
            {copiedAddons && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400 text-sm animate-pulse">{t('addonsCopied')}</div>
            )}

            {/* ── Main 3-column layout ── */}
            <div className="flex gap-4" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>

                {/* LEFT: Image Gallery */}
                <div className="w-48 shrink-0 hidden lg:block">
                    <div className="sticky top-4 bg-[#181924] rounded-2xl border border-gray-800/50 p-3">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {t('imageGallery')}
                        </h3>
                        <p className="text-[10px] text-gray-600 mb-3">{t('dragHint')}</p>

                        {availableImages.length === 0 ? (
                            <p className="text-xs text-gray-600 text-center py-4">{t('noImages')}</p>
                        ) : (
                            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                                {availableImages.map((img) => (
                                    <div
                                        key={img}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, img)}
                                        onDragEnd={handleDragEnd}
                                        className={`relative group cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border transition-all ${draggedImage === img ? 'border-brand-500 opacity-50 scale-95' : assignedImages.has(img) ? 'border-emerald-500/30' : 'border-gray-700/50 hover:border-brand-500/50'
                                            }`}
                                    >
                                        <img
                                            src={`/download/${submissionId}/image/${img}?accessToken=${accessToken}`}
                                            alt={img}
                                            className="w-full aspect-square object-cover"
                                        />
                                        {assignedImages.has(img) && (
                                            <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[9px] text-gray-300 truncate">{img}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER: Item Cards */}
                <div className="flex-1 min-w-0">
                    <div className="space-y-4">
                        {items.map((item, idx) => {
                            const errors = validationErrors[idx] || [];
                            const isAddonActive = activeAddonIdx === idx;

                            return (
                                <div
                                    key={idx}
                                    className={`bg-[#181924] rounded-2xl p-5 border transition-all ${dropTarget === idx ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/10' :
                                        errors.length > 0 ? 'border-red-500/50' : 'border-gray-800/50'
                                        }`}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, idx)}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-semibold text-brand-400">
                                            #{idx + 1} {item.item_name_en || item.item_name_ar || ''}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => duplicateItem(idx)} className="text-xs text-gray-500 hover:text-brand-400 transition-colors" title={t('duplicateItem')}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            </button>
                                            {items.length > 1 && (
                                                <button onClick={() => removeItem(idx)} className="text-xs text-gray-500 hover:text-red-400 transition-colors" title={t('remove')}>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Image + Fields Row */}
                                    <div className="flex gap-4">
                                        {/* Image Drop Zone */}
                                        <div className="w-24 shrink-0">
                                            {item.image ? (
                                                <div className="relative group">
                                                    <img
                                                        src={`/download/${submissionId}/image/${item.image}?accessToken=${accessToken}`}
                                                        alt=""
                                                        className="w-24 h-24 object-cover rounded-xl border border-gray-700/50"
                                                    />
                                                    <button
                                                        onClick={() => updateItem(idx, 'image', '')}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${dropTarget === idx ? 'border-brand-500 bg-brand-500/10' :
                                                    errors.includes('image') ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700/50'
                                                    }`}>
                                                    {dropTarget === idx ? (
                                                        <span className="text-xs text-brand-400 text-center px-1">{t('dropImageHere')}</span>
                                                    ) : (
                                                        <>
                                                            <span className="text-lg mb-0.5">📷</span>
                                                            <span className="text-[10px] text-gray-600 text-center px-1">{t('dragImageHere')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Mobile: Image selector fallback */}
                                            <select
                                                value={item.image}
                                                onChange={(e) => updateItem(idx, 'image', e.target.value)}
                                                className="lg:hidden w-24 mt-1 text-[10px] bg-[#0f1117] border border-gray-700/50 rounded text-gray-500 p-1"
                                            >
                                                <option value="">Select...</option>
                                                {availableImages.map((img) => <option key={img} value={img}>{img.substring(0, 15)}</option>)}
                                            </select>
                                        </div>

                                        {/* Fields */}
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div>
                                                <input type="text" value={item.item_name_en} onChange={(e) => updateItem(idx, 'item_name_en', e.target.value)}
                                                    placeholder={example.nameEn}
                                                    className={`w-full px-3 py-2 bg-[#0f1117] border rounded-lg text-white text-sm placeholder-gray-600/80 focus:outline-none focus:border-brand-500 transition-all ${errors.includes('name') && !item.item_name_en && !item.item_name_ar ? 'border-red-500/50' : 'border-gray-700/50'}`}
                                                />
                                                <span className="text-[10px] text-gray-600 mt-0.5 block">{t('itemNameEn')}</span>
                                            </div>
                                            <div>
                                                <input type="text" value={item.item_name_ar} onChange={(e) => updateItem(idx, 'item_name_ar', e.target.value)}
                                                    placeholder={example.nameAr} dir="rtl"
                                                    className={`w-full px-3 py-2 bg-[#0f1117] border rounded-lg text-white text-sm placeholder-gray-600/80 focus:outline-none focus:border-brand-500 transition-all ${errors.includes('name') && !item.item_name_en && !item.item_name_ar ? 'border-red-500/50' : 'border-gray-700/50'}`}
                                                />
                                                <span className="text-[10px] text-gray-600 mt-0.5 block">{t('itemNameAr')}</span>
                                            </div>
                                            <div>
                                                <input type="text" value={item.description_en} onChange={(e) => updateItem(idx, 'description_en', e.target.value)}
                                                    placeholder={example.descEn}
                                                    className="w-full px-3 py-2 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-600/80 focus:outline-none focus:border-brand-500 transition-all"
                                                />
                                                <span className="text-[10px] text-gray-600 mt-0.5 block">{t('descriptionEn')} ({t('optional')})</span>
                                            </div>
                                            <div>
                                                <input type="text" value={item.description_ar} onChange={(e) => updateItem(idx, 'description_ar', e.target.value)}
                                                    placeholder={example.descAr} dir="rtl"
                                                    className="w-full px-3 py-2 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-600/80 focus:outline-none focus:border-brand-500 transition-all"
                                                />
                                                <span className="text-[10px] text-gray-600 mt-0.5 block">{t('descriptionAr')} ({t('optional')})</span>
                                            </div>
                                            <div>
                                                <input type="text" value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)}
                                                    placeholder={example.price}
                                                    className={`w-full px-3 py-2 bg-[#0f1117] border rounded-lg text-white text-sm placeholder-gray-600/80 focus:outline-none focus:border-brand-500 transition-all ${errors.includes('price') ? 'border-red-500/50' : 'border-gray-700/50'}`}
                                                />
                                                <span className="text-[10px] text-gray-600 mt-0.5 block">{t('price')} *</span>
                                            </div>
                                            <div>
                                                {addingCategoryIdx === idx ? (
                                                    <div className="flex gap-1.5">
                                                        <input
                                                            type="text"
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory(idx); } }}
                                                            placeholder={t('customCategoryPlaceholder')}
                                                            autoFocus
                                                            className="flex-1 px-3 py-2 bg-[#0f1117] border border-brand-500/50 rounded-lg text-white text-sm placeholder-gray-600/80 focus:outline-none focus:border-brand-500 transition-all"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddCustomCategory(idx)}
                                                            className="px-2.5 py-2 bg-brand-500/20 text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-500/30 transition-all border border-brand-500/30"
                                                        >✓</button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setAddingCategoryIdx(null); setNewCategoryName(''); }}
                                                            className="px-2.5 py-2 bg-gray-800/50 text-gray-500 rounded-lg text-xs hover:text-gray-300 transition-all"
                                                        >✕</button>
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={item.category}
                                                        onChange={(e) => {
                                                            if (e.target.value === '__custom__') {
                                                                setAddingCategoryIdx(idx);
                                                                setNewCategoryName('');
                                                            } else {
                                                                updateItem(idx, 'category', e.target.value);
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 transition-all appearance-none cursor-pointer"
                                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                                                    >
                                                        <option value="" className="bg-[#0f1117]">{t('categoryPlaceholder')}</option>
                                                        {allCategories.map((cat) => (
                                                            <option key={cat} value={cat} className="bg-[#0f1117]">{cat}</option>
                                                        ))}
                                                        <option value="__custom__" className="bg-[#0f1117] text-brand-400">{t('addCustomCategory')}</option>
                                                    </select>
                                                )}
                                                <span className="text-[10px] text-gray-600 mt-0.5 block">{t('category')} ({t('optional')})</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Validation Hints */}
                                    {errors.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            {errors.includes('name') && <p className="text-xs text-red-400">⚠ {t('validationNameRequired')}</p>}
                                            {errors.includes('price') && <p className="text-xs text-red-400">⚠ {t('validationPriceRequired')}</p>}
                                            {errors.includes('image') && <p className="text-xs text-red-400">⚠ {t('validationImageRequired')}</p>}
                                        </div>
                                    )}

                                    {/* Add-ons Toggle — only when enabled for this business type */}
                                    {addonsEnabled && (
                                        <div className="mt-4 pt-3 border-t border-gray-800/30">
                                            <button
                                                onClick={() => setActiveAddonIdx(isAddonActive ? null : idx)}
                                                className={`flex items-center gap-1.5 text-sm font-medium transition-all ${isAddonActive ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                <svg className={`w-3.5 h-3.5 transition-transform ${isAddonActive ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                {t('addons')} {item.addons.length > 0 && <span className="text-xs bg-brand-600/20 text-brand-400 px-1.5 py-0.5 rounded-full">{item.addons.length}</span>}
                                            </button>

                                            {isAddonActive && (
                                                <div className="mt-3 bg-[#0f1117] rounded-xl p-4 border border-gray-800/50">
                                                    <p className="text-xs text-gray-500 mb-3">{t('addonsHint')}</p>
                                                    <p className="text-xs text-amber-400/70 mb-3">{t('priceZeroHint')}</p>

                                                    {/* Example row (always shown as ghost) */}
                                                    {item.addons.length === 0 && (
                                                        <div className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 mb-2 opacity-40 pointer-events-none">
                                                            <input value={addonConfig.exampleEn || 'Variant'} readOnly className="px-2.5 py-1.5 bg-[#181924] border border-gray-700/30 rounded-lg text-gray-500 text-xs" />
                                                            <input value={addonConfig.exampleAr || 'النوع'} readOnly dir="rtl" className="px-2.5 py-1.5 bg-[#181924] border border-gray-700/30 rounded-lg text-gray-500 text-xs" />
                                                            <input value={addonConfig.examplePrice || '+0 QAR'} readOnly className="px-2.5 py-1.5 bg-[#181924] border border-gray-700/30 rounded-lg text-gray-500 text-xs" />
                                                            <div />
                                                        </div>
                                                    )}

                                                    {/* Addon header */}
                                                    {item.addons.length > 0 && (
                                                        <div className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 mb-1.5">
                                                            <span className="text-[10px] text-gray-600 font-medium">{t('addonNameEn')}</span>
                                                            <span className="text-[10px] text-gray-600 font-medium">{t('addonNameAr')}</span>
                                                            <span className="text-[10px] text-gray-600 font-medium">{t('addonPrice')}</span>
                                                            <span />
                                                        </div>
                                                    )}

                                                    {item.addons.map((addon, ai) => (
                                                        <div key={ai} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 mb-2">
                                                            <input type="text" value={addon.name_en} onChange={(e) => updateAddon(idx, ai, 'name_en', e.target.value)}
                                                                placeholder={t('addonNameEnPlaceholder')}
                                                                className="px-2.5 py-1.5 bg-[#181924] border border-gray-700/50 rounded-lg text-white text-xs placeholder-gray-600/70 focus:outline-none focus:border-brand-500 transition-all"
                                                            />
                                                            <input type="text" value={addon.name_ar} onChange={(e) => updateAddon(idx, ai, 'name_ar', e.target.value)}
                                                                placeholder={t('addonNameArPlaceholder')} dir="rtl"
                                                                className="px-2.5 py-1.5 bg-[#181924] border border-gray-700/50 rounded-lg text-white text-xs placeholder-gray-600/70 focus:outline-none focus:border-brand-500 transition-all"
                                                            />
                                                            <input type="text" value={addon.price} onChange={(e) => updateAddon(idx, ai, 'price', e.target.value)}
                                                                placeholder={t('addonPricePlaceholder')}
                                                                className="px-2.5 py-1.5 bg-[#181924] border border-gray-700/50 rounded-lg text-white text-xs placeholder-gray-600/70 focus:outline-none focus:border-brand-500 transition-all"
                                                            />
                                                            <button onClick={() => removeAddon(idx, ai)} className="text-gray-600 hover:text-red-400 transition-colors flex items-center justify-center">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}

                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={() => addAddon(idx)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-lg text-xs font-medium hover:bg-brand-500/20 transition-all">
                                                            {t('addAddon')}
                                                        </button>
                                                        {item.addons.length > 0 && (
                                                            <button onClick={() => copyAddons(idx)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800/50 text-gray-400 border border-gray-700/50 rounded-lg text-xs hover:text-white hover:border-gray-600 transition-all">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                {t('copyAddons')}
                                                            </button>
                                                        )}
                                                        {copiedAddons && (
                                                            <button onClick={() => pasteAddons(idx)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-all animate-pulse">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                                {t('pasteAddons')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Add more button at bottom */}
                    <button onClick={addItem}
                        className="w-full mt-4 py-3 border-2 border-dashed border-gray-700/50 rounded-2xl text-gray-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-sm font-medium">
                        {t('addItem')}
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pb-8">
                <button onClick={() => navigate('/submit/assets')} className="px-6 py-3 text-gray-400 hover:text-white border border-gray-700/50 rounded-xl transition-all">{t('backAssets')}</button>
                <div className="flex gap-3">
                    <button onClick={saveMenu} disabled={saving}
                        className="px-6 py-3 bg-[#181924] text-gray-300 border border-gray-700/50 rounded-xl hover:border-brand-500/50 transition-all text-sm font-medium disabled:opacity-50">
                        {saving ? t('saving') : t('save')}
                    </button>
                    <button onClick={handleNext} disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-600/20 active:scale-[0.98]">
                        {t('nextLocation')}
                    </button>
                </div>
            </div>
        </div>
    );
}
