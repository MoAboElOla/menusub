import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, getAuth } from '../api';
import StepIndicator from '../components/StepIndicator';

const EMPTY_ITEM = {
    item_name_en: '',
    item_name_ar: '',
    description_en: '',
    description_ar: '',
    price: '',
    category: '',
    barcode: '',
    image: '',
};

export default function Menu() {
    const navigate = useNavigate();
    const { submissionId, accessToken } = getAuth();

    const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
    const [availableImages, setAvailableImages] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!submissionId || !accessToken) {
            navigate('/');
            return;
        }
        // Load available product images
        apiGet('/api/submission/images')
            .then(setAvailableImages)
            .catch(() => { });
        // Load existing menu items
        apiGet('/api/submission/info')
            .then((info) => {
                if (info.menuItems && info.menuItems.length > 0) {
                    setItems(info.menuItems);
                }
            })
            .catch(() => { });
    }, []);

    const updateItem = (index, field, value) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
        setSaved(false);
    };

    const addItem = () => {
        setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
    };

    const removeItem = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
        setSaved(false);
    };

    const duplicateItem = (index) => {
        setItems((prev) => {
            const copy = [...prev];
            copy.splice(index + 1, 0, { ...prev[index] });
            return copy;
        });
    };

    const saveMenu = async () => {
        setSaving(true);
        setError('');
        try {
            await apiPost('/api/submission/save-menu', { items });
            setSaved(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        await saveMenu();
        navigate('/submit/review');
    };

    return (
        <div className="min-h-screen p-4 pt-8 max-w-4xl mx-auto">
            <StepIndicator currentStep={2} />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Menu Items</h2>
                    <p className="text-gray-400 text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={addItem}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Item
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {saved && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Menu saved!
                </div>
            )}

            <div className="space-y-4">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-[#181924] rounded-2xl p-5 border border-gray-800/50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-brand-400">Item #{idx + 1}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => duplicateItem(idx)}
                                    className="text-xs text-gray-500 hover:text-brand-400 transition-colors"
                                    title="Duplicate"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                {items.length > 1 && (
                                    <button
                                        onClick={() => removeItem(idx)}
                                        className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                                        title="Remove"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Item Name (English)"
                                value={item.item_name_en}
                                onChange={(e) => updateItem(idx, 'item_name_en', e.target.value)}
                                className="px-3 py-2.5 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all"
                            />
                            <input
                                type="text"
                                placeholder="اسم المنتج (عربي)"
                                value={item.item_name_ar}
                                onChange={(e) => updateItem(idx, 'item_name_ar', e.target.value)}
                                dir="rtl"
                                className="px-3 py-2.5 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all"
                            />
                            <input
                                type="text"
                                placeholder="Description (English)"
                                value={item.description_en}
                                onChange={(e) => updateItem(idx, 'description_en', e.target.value)}
                                className="px-3 py-2.5 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all"
                            />
                            <input
                                type="text"
                                placeholder="الوصف (عربي)"
                                value={item.description_ar}
                                onChange={(e) => updateItem(idx, 'description_ar', e.target.value)}
                                dir="rtl"
                                className="px-3 py-2.5 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all"
                            />
                            <input
                                type="text"
                                placeholder="Price"
                                value={item.price}
                                onChange={(e) => updateItem(idx, 'price', e.target.value)}
                                className="px-3 py-2.5 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all"
                            />
                            <input
                                type="text"
                                placeholder="Category (optional)"
                                value={item.category}
                                onChange={(e) => updateItem(idx, 'category', e.target.value)}
                                className="px-3 py-2.5 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all"
                            />
                            <input
                                type="text"
                                placeholder="Barcode (optional)"
                                value={item.barcode}
                                onChange={(e) => updateItem(idx, 'barcode', e.target.value)}
                                className="px-3 py-2.5 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all"
                            />
                            <select
                                value={item.image}
                                onChange={(e) => updateItem(idx, 'image', e.target.value)}
                                className="px-3 py-2.5 bg-[#0f1117] border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
                            >
                                <option value="">Select image...</option>
                                {availableImages.map((img) => (
                                    <option key={img} value={img}>
                                        {img}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6 pb-8">
                <button
                    onClick={() => navigate('/submit/assets')}
                    className="px-6 py-3 text-gray-400 hover:text-white border border-gray-700/50 rounded-xl transition-all"
                >
                    ← Assets
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={saveMenu}
                        disabled={saving}
                        className="px-6 py-3 bg-[#181924] text-gray-300 border border-gray-700/50 rounded-xl hover:border-brand-500/50 transition-all text-sm font-medium disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-600/20 active:scale-[0.98]"
                    >
                        Next: Review →
                    </button>
                </div>
            </div>
        </div>
    );
}
