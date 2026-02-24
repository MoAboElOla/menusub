import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, getAuth } from '../api';
import { useLanguage } from '../i18n';
import StepIndicator from '../components/StepIndicator';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

export default function Location() {
    const { t, isRtl } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [schedule, setSchedule] = useState(() => {
        const initial = {};
        DAYS.forEach(day => {
            initial[day.toLowerCase()] = {
                from: { h: '09', m: '00', p: 'AM' },
                to: { h: '09', m: '00', p: 'PM' },
                closed: false
            };
        });
        return initial;
    });

    const [pickupLocation, setPickupLocation] = useState('');
    const [operationalPhone, setOperationalPhone] = useState('');

    useEffect(() => {
        const auth = getAuth();
        if (!auth) {
            navigate('/');
            return;
        }

        apiGet('/api/submission/info')
            .then(data => {
                if (data.locationDetails) {
                    setSchedule(data.locationDetails.schedule || schedule);
                    setPickupLocation(data.locationDetails.pickupLocation || '');
                    setOperationalPhone(data.locationDetails.operationalPhone || '');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load location details:', err);
                setLoading(false);
            });
    }, [navigate]);

    const handleToggleClosed = (day) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], closed: !prev[day].closed }
        }));
    };

    const handleTimeChange = (day, type, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [type]: { ...prev[day][type], [field]: value }
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiPost('/api/submission/save-location', {
                schedule,
                pickupLocation,
                operationalPhone
            });
            navigate('/submit/review');
        } catch (err) {
            alert(t('error') + ': ' + (err.message || 'Failed to save location details'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <StepIndicator currentStep={3} />

            <div className="bg-[#181924] border border-gray-700/50 rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">{t('locationTitle')}</h1>
                    <p className="text-gray-400">{t('locationSubtitle')}</p>
                </div>

                {/* Working Hours */}
                <div className="space-y-6 mb-10">
                    <h2 className="text-lg font-semibold text-brand-400 border-b border-gray-700/50 pb-2">
                        {t('workingHours')}
                    </h2>

                    <div className="space-y-4">
                        {DAYS.map(dayLabel => {
                            const dayKey = dayLabel.toLowerCase();
                            const dayData = schedule[dayKey];
                            const tDay = t('day' + dayLabel);

                            return (
                                <div key={dayKey} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all ${dayData.closed ? 'bg-red-500/5 border border-red-500/10' : 'bg-[#1e1f2e] border border-gray-800'}`}>
                                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                        <div className="w-24 font-medium text-white">{tDay}</div>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${dayData.closed ? 'bg-red-500' : 'bg-gray-700'}`}>
                                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${dayData.closed ? 'right-1' : 'left-1'}`} />
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={dayData.closed}
                                                onChange={() => handleToggleClosed(dayKey)}
                                            />
                                            <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                                {t('closedAllDay')}
                                            </span>
                                        </label>
                                    </div>

                                    {!dayData.closed && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-gray-700/30">
                                                <span className="text-[10px] text-gray-500 uppercase px-1">{t('from')}</span>
                                                <select value={dayData.from.h} onChange={(e) => handleTimeChange(dayKey, 'from', 'h', e.target.value)} className="bg-transparent text-white outline-none">
                                                    {HOURS.map(h => <option key={h} value={h < 10 ? '0' + h : h}>{h < 10 ? '0' + h : h}</option>)}
                                                </select>
                                                <span className="text-gray-600">:</span>
                                                <select value={dayData.from.m} onChange={(e) => handleTimeChange(dayKey, 'from', 'm', e.target.value)} className="bg-transparent text-white outline-none">
                                                    {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                                <select value={dayData.from.p} onChange={(e) => handleTimeChange(dayKey, 'from', 'p', e.target.value)} className="bg-transparent text-brand-400 font-bold ml-1 outline-none">
                                                    {PERIODS.map(p => <option key={p} value={p}>{t(p.toLowerCase())}</option>)}
                                                </select>
                                            </div>

                                            <div className="w-4 h-px bg-gray-700 mx-1" />

                                            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-gray-700/30">
                                                <span className="text-[10px] text-gray-500 uppercase px-1">{t('to')}</span>
                                                <select value={dayData.to.h} onChange={(e) => handleTimeChange(dayKey, 'to', 'h', e.target.value)} className="bg-transparent text-white outline-none">
                                                    {HOURS.map(h => <option key={h} value={h < 10 ? '0' + h : h}>{h < 10 ? '0' + h : h}</option>)}
                                                </select>
                                                <span className="text-gray-600">:</span>
                                                <select value={dayData.to.m} onChange={(e) => handleTimeChange(dayKey, 'to', 'm', e.target.value)} className="bg-transparent text-white outline-none">
                                                    {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                                <select value={dayData.to.p} onChange={(e) => handleTimeChange(dayKey, 'to', 'p', e.target.value)} className="bg-transparent text-brand-400 font-bold ml-1 outline-none">
                                                    {PERIODS.map(p => <option key={p} value={p}>{t(p.toLowerCase())}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pickup Location */}
                <div className="space-y-6 mb-10">
                    <h2 className="text-lg font-semibold text-brand-400 border-b border-gray-700/50 pb-2">
                        {t('pickupLocation')}
                    </h2>
                    <input
                        type="url"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder={t('pickupLocationPlaceholder')}
                        className="w-full bg-[#1e1f2e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                    />
                </div>

                {/* Operational Phone */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-brand-400 border-b border-gray-700/50 pb-2">
                        {t('operationalPhone')}
                    </h2>
                    <p className="text-sm text-gray-400 leading-relaxed italic">
                        {t('operationalPhoneHint')}
                    </p>
                    <input
                        type="tel"
                        value={operationalPhone}
                        onChange={(e) => setOperationalPhone(e.target.value)}
                        placeholder={t('operationalPhonePlaceholder')}
                        className="w-full bg-[#1e1f2e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex justify-between items-center gap-4">
                <button
                    onClick={() => navigate('/submit/menu')}
                    className="px-6 py-3 bg-[#181924] text-gray-400 rounded-xl hover:bg-[#252836] hover:text-white transition-all font-medium border border-gray-700/50"
                >
                    {t('backMenu')}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 max-w-xs px-8 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all font-bold shadow-lg shadow-brand-600/20 disabled:opacity-50"
                >
                    {saving ? t('saving') : t('nextReview')}
                </button>
            </div>
        </div>
    );
}
