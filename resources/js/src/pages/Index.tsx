import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IRootState } from '../store';
import { setPageTitle } from '../store/themeConfigSlice';
import { useEffect, useRef, useState } from 'react';
import siteApi, { SiteData } from '../services/site.service';
import { subscriptionApi, SubscriptionData, UsageData } from '../services/subscription.service';

const Index = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [sites, setSites] = useState<SiteData[]>([]);

    // Modal création site
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [form, setForm] = useState({ nom: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [siteLimit, setSiteLimit] = useState(false);

    // Modal credentials site créé
    const [credentialsModal, setCredentialsModal] = useState<{ dbPass: string; wpAdminPass: string; siteName: string } | null>(null);
    const [copiedDb, setCopiedDb] = useState(false);
    const [copiedWp, setCopiedWp] = useState(false);

    // Modal désactivation site
    const [deactivateModal, setDeactivateModal] = useState<{ siteId: number; siteName: string } | null>(null);
    const [deactivateLoading, setDeactivateLoading] = useState(false);

    // Modal d'attente changement de statut
    const [statProcessing, setStatProcessing] = useState(false);

    const hooksPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchHooksCount = async () => {
        try {
            const res = await fetch('/api/hooks/events-count', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' },
            });
            if (!res.ok) return;
            const { count } = await res.json();
            setSubscription(prev => {
                if (!prev || !prev.hooks) return prev;
                return { ...prev, hooks: { ...prev.hooks, used: count } };
            });
        } catch {}
    };

    useEffect(() => {
        dispatch(setPageTitle('Dashboard'));

        const fetchData = async () => {
            try {
                const [sitesData, subData] = await Promise.all([siteApi.getAll(), subscriptionApi.get()]);
                setSites(sitesData);
                setSubscription(subData);
            } catch (e) {
                console.error('Failed to fetch data', e);
            }
        };
        fetchData();

        hooksPollingRef.current = setInterval(fetchHooksCount, 30000);
        return () => { if (hooksPollingRef.current) clearInterval(hooksPollingRef.current); };
    }, []);

    const openCreateModal = () => {
        const sitesUsage = subscription?.sites;
        if (sitesUsage && sitesUsage.used >= sitesUsage.limit) {
            setSiteLimit(true);
            return;
        }
        setSiteLimit(false);
        setShowCreateModal(true);
        setForm({ nom: '' });
        setFormError(null);
    };

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="#" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
            </ul>
            <div className="pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6 text-white"></div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Sites panel */}
                    <div>
                        <div className="panel">
                            <div className="mb-5 flex items-center justify-between">
                                <span className="text-lg font-bold">Sites</span>
                                <div className="flex flex-col items-end gap-1">
                                    <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>{t('index_create_site')}</button>
                                    {siteLimit && (
                                        <span className="text-danger text-xs">{t('index_site_limit', { limit: subscription?.sites?.limit })}</span>
                                    )}
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>NAME</th>
                                            <th>DOMAIN</th>
                                            <th className="text-center ltr:rounded-r-md rtl:rounded-l-md">STATUS</th>
                                            <th>STORAGE</th>
                                            <th>ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sites.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center text-white-dark">{t('index_no_sites')}</td>
                                            </tr>
                                        ) : (
                                            sites.map((site) => (
                                                <tr key={site.id}>
                                                    <td className="font-semibold">{site.nom}</td>
                                                    <td className="whitespace-nowrap">{site.nom_de_domaine}</td>
                                                    <td className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {site.stat === 'maintenance' ? (
                                                                <span className="badge rounded-full bg-info/20 text-info">{t('index_maintenance')}</span>
                                                            ) : (
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only peer"
                                                                        checked={site.stat === 'active'}
                                                                        onChange={async () => {
                                                                            if (site.stat === 'active') {
                                                                                setDeactivateModal({ siteId: site.id, siteName: site.nom });
                                                                            } else {
                                                                                setStatProcessing(true);
                                                                                try {
                                                                                    const updated = await siteApi.toggleStat(site.id, 'active');
                                                                                    setSites(prev => prev.map(s => s.id === site.id ? { ...s, stat: updated.stat } : s));
                                                                                } finally {
                                                                                    setStatProcessing(false);
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className="w-11 h-6 bg-danger/30 peer-checked:bg-success/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-danger peer-checked:after:bg-success after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                                    <span className={`ml-2 text-xs font-medium ${site.stat === 'active' ? 'text-success' : 'text-danger'}`}>
                                                                        {site.stat === 'active' ? t('active') : t('inactive')}
                                                                    </span>
                                                                </label>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>{site.storage}</td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <Link to={`/sites/${site.id}`} className="btn btn-primary btn-sm">Manage</Link>
                                                            <a href={import.meta.env.VITE_HESTIA_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">Control Panel</a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal création site */}
                        {showCreateModal && (
                            <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto flex items-center justify-center" onClick={() => setShowCreateModal(false)}>
                                <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] px-5 py-3">
                                        <h5 className="font-bold text-lg">{t('index_create_site')}</h5>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setShowCreateModal(false)}>✕</button>
                                    </div>
                                    <form className="p-5" onSubmit={async e => {
                                        e.preventDefault();
                                        setFormLoading(true);
                                        setFormError(null);
                                        try {
                                            const payload = { nom: form.nom };
                                            const response = await fetch('/api/sites', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                                body: JSON.stringify(payload),
                                            });
                                            if (!response.ok) {
                                                const json = await response.json();
                                                const firstError = json?.errors
                                                    ? Object.values(json.errors as Record<string, string[]>)[0][0]
                                                    : json?.message || t('index_create_error');
                                                setFormError(firstError);
                                                return;
                                            }
                                            const json = await response.json();
                                            setShowCreateModal(false);
                                            setForm({ nom: '' });
                                            const data = await siteApi.getAll();
                                            setSites(data);
                                            if (json?.db_pass_plain) {
                                                setCredentialsModal({ dbPass: json.db_pass_plain, wpAdminPass: json.wp_admin_pass ?? '', siteName: json.nom });
                                            }
                                        } catch (e: any) {
                                            setFormError(e?.message || t('index_create_error'));
                                        } finally {
                                            setFormLoading(false);
                                        }
                                    }}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-1">{t('index_site_name')}</label>
                                            <input type="text" className="form-input w-full" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
                                        </div>
                                        {formError && <div className="text-danger text-sm mb-2">{formError}</div>}
                                        <div className="flex justify-end gap-3">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => setShowCreateModal(false)}>{t('cancel')}</button>
                                            <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? t('index_creating') : t('index_create')}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resources panel */}
                    <div className="panel">
                        <div className="mb-5 flex items-center justify-between">
                            <span className="text-lg font-bold">{t('index_resources')}</span>
                            {subscription?.plan && (
                                <span className="badge bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">{subscription.plan.nom}</span>
                            )}
                        </div>
                        {!subscription ? (
                            <p className="text-white-dark text-sm text-center py-4">{t('loading')}</p>
                        ) : (
                            <div className="space-y-4">
                                {([
                                    { key: 'sites', label: 'Sites', icon: (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                    ), color: 'bg-primary' },
                                    { key: 'storage', label: t('sub_storage'), icon: (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                                    ), color: 'bg-info' },
                                    { key: 'bandwidth', label: t('index_bandwidth'), icon: (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                                    ), color: 'bg-success' },
                                    { key: 'hooks', label: t('index_wp_events'), icon: (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    ), color: 'bg-secondary' },
                                    { key: 'webhooks', label: 'Webhooks', icon: (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
                                    ), color: 'bg-danger' },
                                ] as { key: keyof SubscriptionData; label: string; icon: JSX.Element; color: string }[]).map(({ key, label, icon, color }) => {
                                    const usage = subscription[key] as UsageData | null;
                                    if (!usage) return null;
                                    const pct = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
                                    const isHigh = pct >= 90;
                                    const isMed = pct >= 70 && pct < 90;
                                    const barColor = isHigh ? 'bg-danger' : isMed ? 'bg-warning' : color;
                                    return (
                                        <div key={key}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <span className={`p-1 rounded ${barColor}/20 ${isHigh ? 'text-danger' : isMed ? 'text-warning' : 'text-primary'}`}>{icon}</span>
                                                    {label}
                                                </div>
                                                <span className="text-xs text-white-dark">
                                                    {usage.used.toLocaleString()}{usage.unit && usage.unit !== 'unit' ? ` ${usage.unit}` : ''} / {usage.limit.toLocaleString()}{usage.unit && usage.unit !== 'unit' ? ` ${usage.unit}` : ''}
                                                    <span className={`ml-1 font-semibold ${isHigh ? 'text-danger' : isMed ? 'text-warning' : 'text-white-dark'}`}>({pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-2 bg-[#ebedf2] dark:bg-dark/40 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {subscription && (
                            <div className="mt-5 pt-4 border-t border-[#ebedf2] dark:border-white/10 flex items-center justify-between text-xs text-white-dark">
                                <span>{t('index_renewal')} <span className="text-white font-medium">{subscription.renewal_date ?? '—'}</span></span>
                                <span className={`badge text-xs px-2 py-0.5 rounded-full ${subscription.status === 'active' ? 'bg-success/20 text-success' : subscription.status === 'expired' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
                                    {subscription.status === 'active' ? t('index_active') : subscription.status === 'expired' ? t('index_expired') : t('index_cancelled')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="grid gap-6 xl:grid-flow-row">
                        <div className="panel overflow-hidden"></div>
                    </div>
                </div>
            </div>

            {/* Modal credentials DB après création */}
            {credentialsModal && (
                <div className="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center">
                    <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-md">
                        <div className="flex items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] px-5 py-3">
                            <h5 className="font-bold text-lg flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t('index_site_created')}
                            </h5>
                        </div>
                        <div className="p-5">
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30 mb-5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                                <p className="text-sm text-white-dark">{t('index_db_warning')}</p>
                            </div>
                            <p className="text-sm text-white-dark mb-2">{t('index_site_label')} <span className="font-semibold text-white">{credentialsModal.siteName}</span></p>
                            <p className="text-sm text-white-dark mb-2">{t('index_db_pass')}</p>
                            <div className="flex items-center gap-2 mb-4">
                                <code className="flex-1 bg-dark/30 rounded px-3 py-2 text-sm font-mono select-all">{credentialsModal.dbPass}</code>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${copiedDb ? 'btn-success' : 'btn-outline-primary'}`}
                                    onClick={() => {
                                        navigator.clipboard.writeText(credentialsModal.dbPass);
                                        setCopiedDb(true);
                                        setTimeout(() => setCopiedDb(false), 2000);
                                    }}
                                >
                                    {copiedDb ? t('copied') : t('copy')}
                                </button>
                            </div>
                            <p className="text-sm text-white-dark mb-2">{t('index_wp_admin_pass')}</p>
                            <div className="flex items-center gap-2 mb-5">
                                <code className="flex-1 bg-dark/30 rounded px-3 py-2 text-sm font-mono select-all">{credentialsModal.wpAdminPass}</code>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${copiedWp ? 'btn-success' : 'btn-outline-primary'}`}
                                    onClick={() => {
                                        navigator.clipboard.writeText(credentialsModal.wpAdminPass);
                                        setCopiedWp(true);
                                        setTimeout(() => setCopiedWp(false), 2000);
                                    }}
                                >
                                    {copiedWp ? t('copied') : t('copy')}
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <button type="button" className="btn btn-primary" onClick={() => { setCredentialsModal(null); setCopiedDb(false); setCopiedWp(false); }}>
                                    {t('index_noted_passwords')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmation désactivation */}
            {deactivateModal && (
                <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto flex items-center justify-center" onClick={() => setDeactivateModal(null)}>
                    <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-md my-8" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] px-5 py-3">
                            <h5 className="font-bold text-lg flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                                {t('site_deactivate')}
                            </h5>
                            <button type="button" className="text-white-dark hover:text-dark" onClick={() => setDeactivateModal(null)}>✕</button>
                        </div>
                        <div className="p-5">
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30 mb-5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-warning mb-1">{t('index_warning')}</p>
                                    <p className="text-sm text-white-dark">
                                        {t('index_deactivate_detail', { name: deactivateModal.siteName })}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm mb-5">{t('index_deactivate_confirm')}</p>
                            <div className="flex justify-end gap-3">
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setDeactivateModal(null)}>{t('cancel')}</button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    disabled={deactivateLoading}
                                    onClick={async () => {
                                        setDeactivateLoading(true);
                                        setStatProcessing(true);
                                        setDeactivateModal(null);
                                        try {
                                            const updated = await siteApi.toggleStat(deactivateModal.siteId, 'inactive');
                                            setSites(prev => prev.map(s => s.id === deactivateModal.siteId ? { ...s, stat: updated.stat } : s));
                                        } finally {
                                            setDeactivateLoading(false);
                                            setStatProcessing(false);
                                        }
                                    }}
                                >
                                    {deactivateLoading ? t('index_deactivating') : t('index_deactivate_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'attente changement de statut */}
            {statProcessing && (
                <div className="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center">
                    <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xs">
                        <div className="flex items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] px-5 py-3">
                            <h5 className="font-bold text-base">{t('site_updating_title')}</h5>
                        </div>
                        <div className="p-6 flex items-center justify-center gap-4">
                            <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-8 h-8 inline-block"></span>
                            <p className="text-sm text-white-dark">{t('index_please_wait')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Index;
