import { useState } from 'react';

export default function Admin() {
    const [token, setToken] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cleanupMsg, setCleanupMsg] = useState('');

    const fetchSubmissions = async (adminToken) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/submissions?adminToken=${encodeURIComponent(adminToken)}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Unauthorized');
            }
            const data = await res.json();
            setSubmissions(data);
            setAuthenticated(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        fetchSubmissions(token);
    };

    const triggerCleanup = async () => {
        setCleanupMsg('');
        try {
            const res = await fetch('/admin/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminToken: token }),
            });
            const data = await res.json();
            if (res.ok) {
                setCleanupMsg(`Cleanup complete. Deleted ${data.deletedCount} submission(s).`);
                fetchSubmissions(token);
            } else {
                setCleanupMsg(data.error || 'Cleanup failed');
            }
        } catch {
            setCleanupMsg('Cleanup failed');
        }
    };

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Panel</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="bg-[#181924] rounded-2xl p-6 border border-gray-800/50">
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin Token</label>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Enter admin token"
                                className="w-full px-4 py-3 bg-[#0f1117] border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all"
                            />
                        </div>
                        {error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Access Admin'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pt-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <button
                    onClick={triggerCleanup}
                    className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-all"
                >
                    Run Cleanup
                </button>
            </div>

            {cleanupMsg && (
                <div className="px-4 py-3 mb-4 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400 text-sm">
                    {cleanupMsg}
                </div>
            )}

            <div className="bg-[#181924] rounded-2xl border border-gray-800/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800/50">
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Brand</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Created</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Expires</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Downloads</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                                        No submissions found
                                    </td>
                                </tr>
                            ) : (
                                submissions.map((s) => (
                                    <tr key={s.id} className="border-b border-gray-800/30 hover:bg-white/[0.02]">
                                        <td className="px-4 py-3">
                                            <div className="text-white font-medium">{s.brandName}</div>
                                            {s.phone && <div className="text-xs text-gray-500">{s.phone}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'submitted'
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-amber-500/10 text-amber-400'
                                                    }`}
                                            >
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {new Date(s.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {new Date(s.expiresAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {s.zipDownloadUrl ? (
                                                <div className="flex gap-2">
                                                    <a
                                                        href={s.zipDownloadUrl}
                                                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                                                    >
                                                        ZIP
                                                    </a>
                                                    <a
                                                        href={s.excelDownloadUrl}
                                                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                                                    >
                                                        Excel
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-600">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <button
                onClick={() => fetchSubmissions(token)}
                className="mt-4 px-4 py-2 text-gray-500 hover:text-white text-sm transition-colors"
            >
                ↻ Refresh
            </button>
        </div>
    );
}
