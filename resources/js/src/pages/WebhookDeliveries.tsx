import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../store/themeConfigSlice';
import webhookDeliveryApi, {
    WebhookDeliveryData,
    WebhookDeliveryFilters,
    WebhookDeliveryStats,
} from '../services/webhook-delivery.service';

const WebhookDeliveries = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [deliveries, setDeliveries]   = useState<WebhookDeliveryData[]>([]);
    const [stats, setStats]             = useState<WebhookDeliveryStats | null>(null);
    const [total, setTotal]             = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage]       = useState(1);
    const [loading, setLoading]         = useState(false);
    const [selected, setSelected]       = useState<WebhookDeliveryData | null>(null);
    const [replayingId, setReplayingId] = useState<number | null>(null);

    const [filters, setFilters] = useState<WebhookDeliveryFilters>({
        status: '',
        from: '',
        to: '',
        per_page: 50,
    });

    useEffect(() => {
        dispatch(setPageTitle('Webhook Deliveries'));
        fetchStats();
    }, []);

    useEffect(() => {
        fetchDeliveries();
    }, [currentPage, filters]);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const res = await webhookDeliveryApi.getAll({ ...filters, page: currentPage });
            setDeliveries(res.data);
            setTotal(res.total);
            setLastPage(res.last_page);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setStats(await webhookDeliveryApi.getStats());
        } catch (e) {
            console.error(e);
        }
    };

    const handleReplay = async (delivery: WebhookDeliveryData) => {
        setReplayingId(delivery.id);
        try {
            await webhookDeliveryApi.replay(delivery.id);
            setTimeout(() => {
                fetchDeliveries();
                fetchStats();
            }, 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setReplayingId(null);
        }
    };

    const handleFilter = (key: keyof WebhookDeliveryFilters, value: string) => {
        setFilters(f => ({ ...f, [key]: value }));
        setCurrentPage(1);
    };

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
    };

    const successRate = stats && stats.total > 0
        ? Math.round((stats.success / stats.total) * 100)
        : null;

    const statusLabel = (status: string) => {
        if (status === 'success') return t('deliveries_success');
        if (status === 'skipped') return t('deliveries_skipped_label');
        return t('deliveries_failed_label');
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-5">
                <li className="text-primary">Dashboard</li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-black dark:text-white-dark">
                    Webhook Deliveries
                </li>
            </ul>

            <h1 className="text-2xl font-semibold mb-6 dark:text-white">{t('deliveries_title')}</h1>

            {/* Stats cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="panel text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                        <div className="text-3xl font-bold mt-1 dark:text-white">{stats.total.toLocaleString()}</div>
                    </div>
                    <div className="panel text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('deliveries_success')}</div>
                        <div className="text-3xl font-bold mt-1 text-success">{stats.success.toLocaleString()}</div>
                    </div>
                    <div className="panel text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('deliveries_failed')}</div>
                        <div className="text-3xl font-bold mt-1 text-danger">{stats.failed.toLocaleString()}</div>
                    </div>
                    <div className="panel text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('deliveries_skipped')}</div>
                        <div className="text-3xl font-bold mt-1 text-warning">{(stats.skipped ?? 0).toLocaleString()}</div>
                    </div>
                    <div className="panel text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('deliveries_success_rate')}</div>
                        <div className={`text-3xl font-bold mt-1 ${successRate !== null && successRate >= 90 ? 'text-success' : 'text-warning'}`}>
                            {successRate !== null ? `${successRate}%` : '—'}
                        </div>
                        {stats.avg_duration > 0 && (
                            <div className="text-xs text-gray-400 mt-1">{stats.avg_duration} {t('deliveries_avg_ms')}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="panel mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <select
                        className="form-select"
                        value={filters.status}
                        onChange={e => handleFilter('status', e.target.value)}
                    >
                        <option value="">{t('deliveries_all_statuses')}</option>
                        <option value="success">{t('deliveries_success')}</option>
                        <option value="failed">{t('deliveries_failed_label')}</option>
                        <option value="skipped">{t('deliveries_skipped_label')}</option>
                    </select>
                    <input
                        type="datetime-local"
                        className="form-input"
                        value={filters.from}
                        onChange={e => handleFilter('from', e.target.value)}
                    />
                    <input
                        type="datetime-local"
                        className="form-input"
                        value={filters.to}
                        onChange={e => handleFilter('to', e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="panel">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="font-semibold text-lg dark:text-white">
                        {t('deliveries_label')} <span className="text-sm text-gray-400">({total.toLocaleString()})</span>
                    </h5>
                    <button onClick={fetchDeliveries} className="btn btn-sm btn-outline-primary">
                        {t('refresh')}
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th>{t('status')}</th>
                                <th>Site</th>
                                <th>Webhook</th>
                                <th>URL</th>
                                <th>HTTP</th>
                                <th>{t('deliveries_attempts')}</th>
                                <th>{t('deliveries_duration')}</th>
                                <th>{t('date')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={9} className="text-center py-8 text-gray-400">{t('loading')}</td>
                                </tr>
                            )}
                            {!loading && deliveries.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="text-center py-8 text-gray-400">{t('deliveries_none')}</td>
                                </tr>
                            )}
                            {!loading && deliveries.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <span className={`badge ${d.status === 'success' ? 'bg-success/10 text-success' : d.status === 'skipped' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                                            {statusLabel(d.status)}
                                        </span>
                                    </td>
                                    <td className="text-xs dark:text-white-dark">
                                        {d.webhook?.site ? (
                                            <div>{d.webhook.site.nom}</div>
                                        ) : '—'}
                                    </td>
                                    <td className="text-xs font-medium dark:text-white">
                                        {d.webhook?.name ?? `#${d.webhook_id}`}
                                    </td>
                                    <td className="text-xs text-gray-500 max-w-[200px] truncate">{d.endpoint_url}</td>
                                    <td className="text-xs">
                                        {d.http_status_code ? (
                                            <span className={d.http_status_code >= 200 && d.http_status_code < 300 ? 'text-success' : 'text-danger'}>
                                                {d.http_status_code}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="text-xs text-center">{d.attempts}</td>
                                    <td className="text-xs">{d.duration_ms != null ? `${d.duration_ms} ms` : '—'}</td>
                                    <td className="text-xs">{formatDate(d.created_at)}</td>
                                    <td className="flex gap-1">
                                        <button
                                            className="btn btn-xs btn-outline-primary"
                                            onClick={() => setSelected(d)}
                                        >
                                            {t('details')}
                                        </button>
                                        <button
                                            className="btn btn-xs btn-outline-warning"
                                            disabled={replayingId === d.id}
                                            onClick={() => handleReplay(d)}
                                        >
                                            {replayingId === d.id ? '...' : '↺'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {lastPage > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <button
                            className="btn btn-sm btn-outline-primary"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            {t('previous')}
                        </button>
                        <span className="flex items-center text-sm text-gray-500 px-2">
                            {currentPage} / {lastPage}
                        </span>
                        <button
                            className="btn btn-sm btn-outline-primary"
                            disabled={currentPage === lastPage}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            {t('next')}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal détail */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h3 className="font-semibold text-lg dark:text-white">{t('deliveries_detail')}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-sm btn-outline-warning"
                                    disabled={replayingId === selected.id}
                                    onClick={() => handleReplay(selected)}
                                >
                                    {replayingId === selected.id ? t('deliveries_replaying') : `↺ ${t('deliveries_replay')}`}
                                </button>
                                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                            </div>
                        </div>
                        <div className="p-4 space-y-3 text-sm">
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-gray-400">{t('status')}</span>
                                <span className={`col-span-2 font-semibold ${selected.status === 'success' ? 'text-success' : selected.status === 'skipped' ? 'text-warning' : 'text-danger'}`}>
                                    {statusLabel(selected.status)}
                                </span>

                                <span className="text-gray-400">Site</span>
                                <span className="col-span-2 dark:text-white">
                                    {selected.webhook?.site ? `${selected.webhook.site.nom} (${selected.webhook.site.nom_de_domaine})` : '—'}
                                </span>

                                <span className="text-gray-400">Webhook</span>
                                <span className="col-span-2 dark:text-white">{selected.webhook?.name ?? `#${selected.webhook_id}`}</span>

                                <span className="text-gray-400">URL</span>
                                <span className="col-span-2 break-all text-xs text-gray-500">{selected.endpoint_url}</span>

                                <span className="text-gray-400">HTTP</span>
                                <span className="col-span-2 dark:text-white">{selected.http_status_code ?? '—'}</span>

                                <span className="text-gray-400">{t('deliveries_attempts')}</span>
                                <span className="col-span-2 dark:text-white">{selected.attempts}</span>

                                <span className="text-gray-400">{t('deliveries_duration')}</span>
                                <span className="col-span-2 dark:text-white">{selected.duration_ms != null ? `${selected.duration_ms} ms` : '—'}</span>

                                <span className="text-gray-400">{t('date')}</span>
                                <span className="col-span-2 dark:text-white">{formatDate(selected.created_at)}</span>
                            </div>

                            {selected.error_message && (
                                <div className="mt-3">
                                    <div className="text-gray-400 text-sm mb-1">{t('error')}</div>
                                    <pre className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                                        {selected.error_message}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebhookDeliveries;
