import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, getAuth } from '../api';
import { useLanguage } from '../i18n';
import StepIndicator from '../components/StepIndicator';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

function hasSubmissionAuth() {
    const { submissionId, accessToken } = getAuth();
    return Boolean(submissionId && accessToken);
}

export default function Location() {
    const { t, isRtl } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [schedule, setSchedule] = useState(() => {
        const initial = {};
        DAYS.forEach(day => {
            initial[day.toLowerCase()] = {
                from: { h: '09', m: '00', p: 'AM' },
                to: { h: '09', m: '00', p: 'PM' },
                closed: false,
                is24Hours: false
            };
        });
        return initial;
    });

    const [pickupLocation, setPickupLocation] = useState('');
    const [operationalPhone, setOperationalPhone] = useState('');
    const [isHoursModified, setIsHoursModified] = useState(false);

    useEffect(() => {
        if (!hasSubmissionAuth()) {
            navigate('/?error=missingAuth');
            return;
        }

        apiGet('/api/submission/info')
            .then(data => {
                if (data.locationDetails) {
                    if (data.locationDetails.schedule) {
                        setSchedule(data.locationDetails.schedule);
                        setIsHoursModified(true);
                    }
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
        setIsHoursModified(true);
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                closed: !prev[day].closed,
                is24Hours: false // If toggled to closed or open, reset 24h
            }
        }));
    };

    const handleSet24Hours = (day) => {
        setIsHoursModified(true);
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                closed: false,
                is24Hours: !prev[day].is24Hours
            }
        }));
    };

    const handleCopyToAll = (sourceDay) => {
        setIsHoursModified(true);
        const sourceData = JSON.parse(JSON.stringify(schedule[sourceDay]));
        setSchedule(prev => {
            const next = { ...prev };
            DAYS.forEach(d => {
                next[d.toLowerCase()] = { ...sourceData };
            });
            return next;
        });
    };

    const handleTimeChange = (day, type, field, value) => {
        setIsHoursModified(true);
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [type]: { ...prev[day][type], [field]: value },
                is24Hours: false
            }
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!pickupLocation.trim()) newErrors.pickupLocation = t('validationLocationRequired');
        if (!operationalPhone.trim()) newErrors.operationalPhone = t('validationPhoneRequired');
        if (!isHoursModified) newErrors.workingHours = t('validationHoursRequired');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!hasSubmissionAuth()) {
            navigate('/?error=missingAuth');
            return;
        }

        if (!validate()) return;

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

    const selectClasses = "bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md px-1.5 py-0.5 outline-none focus:border-brand-500 transition-colors text-sm appearance-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
    const periodClasses = "bg-white dark:bg-[#0f1117] text-brand-600 dark:text-brand-400 font-bold border border-gray-300 dark:border-gray-600 rounded-md px-1.5 py-0.5 ml-1 outline-none focus:border-brand-500 transition-colors text-sm appearance-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <StepIndicator currentStep={3} />

            <div className="bg-white dark:bg-[#181924] border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-xl mb-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('locationTitle')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{t('locationSubtitle')}</p>
                </div>

                {/* Working Hours */}
                <div className="space-y-6 mb-10">
                    <h2 className="text-lg font-semibold text-brand-600 dark:text-brand-400 border-b border-gray-200 dark:border-gray-700/50 pb-2">
                        {t('workingHours')} <span className="text-red-500">*</span>
                    </h2>

                    {errors.workingHours && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">
                            {errors.workingHours}
                        </p>
                    )}

                    <div className="space-y-4">
                        {DAYS.map(dayLabel => {
                            const dayKey = dayLabel.toLowerCase();
                            const dayData = schedule[dayKey];
                            const tDay = t('day' + dayLabel);

                            return (
                                <div key={dayKey} className={`flex flex-col p-4 rounded-xl transition-all ${dayData.closed ? 'bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10' : 'bg-gray-50 dark:bg-[#1e1f2e] border border-gray-200 dark:border-gray-800'}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 font-medium text-gray-900 dark:text-white">{tDay}</div>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className={`w-10 h-5 rounded-full relative transition-colors ${dayData.closed ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${dayData.closed ? (isRtl ? 'left-1' : 'right-1') : (isRtl ? 'right-1' : 'left-1')}`} />
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={dayData.closed}
                                                    onChange={() => handleToggleClosed(dayKey)}
                                                />
                                                <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                                    {t('closedAllDay')}
                                                </span>
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                            <button
                                                onClick={() => handleSet24Hours(dayKey)}
                                                className={`px-2.5 py-1 text-[10px] font-bold border rounded-lg transition-all uppercase tracking-wider ${dayData.is24Hours ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100'}`}
                                            >
                                                {t('set24Hours')}
                                            </button>
                                            <button
                                                onClick={() => handleCopyToAll(dayKey)}
                                                className="px-2.5 py-1 text-[10px] font-bold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20 rounded-lg hover:bg-brand-100 transition-all uppercase tracking-wider"
                                            >
                                                {t('copyToAll')}
                                            </button>
                                        </div>
                                    </div>

                                    {!dayData.closed && (
                                        <div className="flex items-center gap-2 text-sm mt-4 sm:ml-28 rtl:sm:mr-28 rtl:sm:ml-0">
                                            {dayData.is24Hours ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-500/10 font-bold text-xs">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {t('open24Hours')}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/20 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700/30">
                                                        <span className="text-[10px] text-gray-500 uppercase px-1">{t('from')}</span>
                                                        <select value={dayData.from.h} onChange={(e) => handleTimeChange(dayKey, 'from', 'h', e.target.value)} className={selectClasses} disabled={dayData.is24Hours}>
                                                            {HOURS.map(h => <option key={h} value={h < 10 ? '0' + h : h}>{h < 10 ? '0' + h : h}</option>)}
                                                        </select>
                                                        <span className="text-gray-400 dark:text-gray-600">:</span>
                                                        <select value={dayData.from.m} onChange={(e) => handleTimeChange(dayKey, 'from', 'm', e.target.value)} className={selectClasses} disabled={dayData.is24Hours}>
                                                            {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                        <select value={dayData.from.p} onChange={(e) => handleTimeChange(dayKey, 'from', 'p', e.target.value)} className={periodClasses} disabled={dayData.is24Hours}>
                                                            {PERIODS.map(p => <option key={p} value={p}>{t(p.toLowerCase())}</option>)}
                                                        </select>
                                                    </div>

                                                    <div className="w-4 h-px bg-gray-300 dark:bg-gray-700 mx-1" />

                                                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/20 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700/30">
                                                        <span className="text-[10px] text-gray-500 uppercase px-1">{t('to')}</span>
                                                        <select value={dayData.to.h} onChange={(e) => handleTimeChange(dayKey, 'to', 'h', e.target.value)} className={selectClasses} disabled={dayData.is24Hours}>
                                                            {HOURS.map(h => <option key={h} value={h < 10 ? '0' + h : h}>{h < 10 ? '0' + h : h}</option>)}
                                                        </select>
                                                        <span className="text-gray-400 dark:text-gray-600">:</span>
                                                        <select value={dayData.to.m} onChange={(e) => handleTimeChange(dayKey, 'to', 'm', e.target.value)} className={selectClasses} disabled={dayData.is24Hours}>
                                                            {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                        <select value={dayData.to.p} onChange={(e) => handleTimeChange(dayKey, 'to', 'p', e.target.value)} className={periodClasses} disabled={dayData.is24Hours}>
                                                            {PERIODS.map(p => <option key={p} value={p}>{t(p.toLowerCase())}</option>)}
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pickup Location */}
                <div className="space-y-6 mb-10">
                    <h2 className="text-lg font-semibold text-brand-600 dark:text-brand-400 border-b border-gray-200 dark:border-gray-700/50 pb-2">
                        {t('pickupLocation')} <span className="text-red-500">*</span>
                    </h2>
                    <input
                        type="text"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder={t('pickupLocationPlaceholder')}
                        className={`w-full bg-gray-50 dark:bg-[#1e1f2e] border ${errors.pickupLocation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500'} rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-1 outline-none transition-all`}
                    />
                    {errors.pickupLocation && <p className="text-xs text-red-500 mt-1">{errors.pickupLocation}</p>}
                </div>

                {/* Operational Phone */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-brand-600 dark:text-brand-400 border-b border-gray-200 dark:border-gray-700/50 pb-2">
                        {t('operationalPhone')} <span className="text-red-500">*</span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic">
                        {t('operationalPhoneHint')}
                    </p>
                    <input
                        type="tel"
                        value={operationalPhone}
                        onChange={(e) => setOperationalPhone(e.target.value)}
                        placeholder={t('operationalPhonePlaceholder')}
                        className={`w-full bg-gray-50 dark:bg-[#1e1f2e] border ${errors.operationalPhone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500'} rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-1 outline-none transition-all`}
                    />
                    {errors.operationalPhone && <p className="text-xs text-red-500 mt-1">{errors.operationalPhone}</p>}
                </div>
            </div>

            <div className="flex justify-between items-center gap-4">
                <button
                    onClick={() => navigate('/submit/menu')}
                    className="px-6 py-3 bg-white dark:bg-[#181924] text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-[#252836] hover:text-gray-900 dark:hover:text-white transition-all font-medium border border-gray-200 dark:border-gray-700/50"
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
