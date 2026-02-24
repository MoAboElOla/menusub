import { useState } from 'react';
import { useLanguage } from '../i18n';

export default function Admin() {
    const { t } = useLanguage();
    const [token, setToken] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cleanupMsg, setCleanupMsg] = useState('');

    const fetchSubmissions = async (adminToken) => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`/api/admin/submissions?adminToken=${encodeURIComponent(adminToken)}`);
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unauthorized');
            setSubmissions(await res.json()); setAuthenticated(true);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const triggerCleanup = async () => {
        setCleanupMsg('');
        try {
            const res = await fetch('/admin/cleanup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminToken: token }) });
            const data = await res.json();
            setCleanupMsg(res.ok ? `Cleanup complete. Deleted ${data.deletedCount} submission(s).` : data.error || 'Failed');
            if (res.ok) fetchSubmissions(token);
        } catch { setCleanupMsg('Failed'); }
    };

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">{t('adminTitle')}</h1>
                    <form onSubmit={(e) => { e.preventDefault(); fetchSubmissions(token); }} className="space-y-4">
                        <div className="bg-white dark:bg-[#181924] rounded-2xl p-6 border border-gray-200 dark:border-gray-800/50 shadow-sm dark:shadow-none">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('adminToken')}</label>
                            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={t('adminTokenPlaceholder')}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f1117] border border-gray-300 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all" />
                        </div>
                        {error && <div className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}
                        <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
                            {loading ? t('verifying') : t('accessAdmin')}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pt-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('adminTitle')}</h1>
                <button onClick={triggerCleanup} className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">{t('runCleanup')}</button>
            </div>
            {cleanupMsg && <div className="px-4 py-3 mb-4 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl text-brand-600 dark:text-brand-400 text-sm">{cleanupMsg}</div>}

            <div className="bg-white dark:bg-[#181924] rounded-2xl border border-gray-200 dark:border-gray-800/50 overflow-hidden shadow-sm dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-200 dark:border-gray-800/50">
                            <th className="text-start px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{t('brand')}</th>
                            <th className="text-start px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{t('status')}</th>
                            <th className="text-start px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{t('created')}</th>
                            <th className="text-start px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{t('expires')}</th>
                            <th className="text-start px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{t('downloads')}</th>
                        </tr></thead>
                        <tbody>
                            {submissions.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-600">{t('noSubmissions')}</td></tr>
                            ) : submissions.map((s) => (
                                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800/30 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <td className="px-4 py-3"><div className="text-gray-900 dark:text-white font-medium">{s.brandName}</div>{s.phone && <div className="text-xs text-gray-500">{s.phone}</div>}</td>
                                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'submitted' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>{s.status}</span></td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(s.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(s.expiresAt).toLocaleString()}</td>
                                    <td className="px-4 py-3">{s.zipDownloadUrl ? <div className="flex gap-2"><a href={s.zipDownloadUrl} className="text-xs text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">ZIP</a><a href={s.excelDownloadUrl} className="text-xs text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">Excel</a></div> : <span className="text-xs text-gray-400 dark:text-gray-600">—</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <button onClick={() => fetchSubmissions(token)} className="mt-4 px-4 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">{t('refresh')}</button>
        </div>
    );
}
