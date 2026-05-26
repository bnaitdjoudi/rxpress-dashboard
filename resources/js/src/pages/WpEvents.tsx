import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { setPageTitle } from '../store/themeConfigSlice';
import wpEventApi, { WpEventData, WpEventFilters, WpEventStats } from '../services/wp-event.service';
import siteApi, { SiteData } from '../services/site.service';

interface SiteOption {
    value: string;
    label: string;
}

const WpEvents = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [events, setEvents]           = useState<WpEventData[]>([]);
    const [stats, setStats]             = useState<WpEventStats | null>(null);
    const [sites, setSites]             = useState<SiteData[]>([]);
    const [total, setTotal]             = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage]       = useState(1);
    const [loading, setLoading]         = useState(false);
    const [selectedSites, setSelectedSites] = useState<SiteOption[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<WpEventData | null>(null);

    const [filters, setFilters] = useState<WpEventFilters>({
        hook: '',
        site_urls: undefined,
        from: '',
        to: '',
        per_page: 50,
    });

    useEffect(() => {
        dispatch(setPageTitle('WP Events'));
        fetchStats();
        siteApi.getAll().then(setSites).catch(console.error);
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [currentPage, filters]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await wpEventApi.getAll({ ...filters, page: currentPage });
            setEvents(res.data);
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
            setStats(await wpEventApi.getStats());
        } catch (e) {
            console.error(e);
        }
    };

    const handleFilterChange = (key: keyof WpEventFilters, value: string) => {
        setFilters(f => ({ ...f, [key]: value }));
        setCurrentPage(1);
    };

    const handleSiteSelect = (options: readonly SiteOption[]) => {
        const selected = [...options];
        setSelectedSites(selected);
        const urls = selected.map(o => o.value).join(',');
        setFilters(f => ({ ...f, site_urls: urls }));
        setCurrentPage(1);
    };

    const resolveSiteName = (siteUrl: string): string | null => {
        const match = sites.find(s => siteUrl.includes(s.nom_de_domaine));
        return match?.nom ?? null;
    };

    const siteOptions: SiteOption[] = sites.map(s => ({
        value: s.nom_de_domaine,
        label: s.nom,
    }));

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-5">
                <li className="text-primary">Dashboard</li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-black dark:text-white-dark">
                    WP Events
                </li>
            </ul>

            <h1 className="text-2xl font-semibold mb-6 dark:text-white">WordPress Events</h1>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="panel">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('wp_events_total')}</div>
                        <div className="text-3xl font-bold mt-1 dark:text-white">{stats.total.toLocaleString()}</div>
                    </div>
                    <div className="panel">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('wp_events_top_hooks')}</div>
                        {stats.by_hook.slice(0, 5).map(h => (
                            <div key={h.hook} className="flex justify-between text-sm py-0.5">
                                <span className="font-mono text-xs dark:text-white">{h.hook}</span>
                                <span className="text-primary font-semibold">{h.count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="panel">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('wp_events_by_site')}</div>
                        {stats.by_site.slice(0, 5).map(s => {
                            const name = resolveSiteName(s.site_url);
                            return (
                                <div key={s.site_url} className="flex justify-between text-sm py-0.5">
                                    <span className="text-xs truncate max-w-[160px] dark:text-white">
                                        {name ? `${name}` : s.site_url.replace(/https?:\/\//, '')}
                                    </span>
                                    <span className="text-primary font-semibold">{s.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="panel mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('wp_events_hook_placeholder')}
                        value={filters.hook}
                        onChange={e => handleFilterChange('hook', e.target.value)}
                    />
                    <Select
                        isMulti
                        options={siteOptions}
                        value={selectedSites}
                        onChange={handleSiteSelect}
                        placeholder={t('wp_events_filter_site')}
                        noOptionsMessage={() => t('wp_events_no_site')}
                        classNamePrefix="react-select"
                        formatOptionLabel={(option, { context }) =>
                            context === 'menu'
                                ? <div><span className="font-medium">{option.label}</span><span className="text-gray-400 text-xs ml-2">{option.value}</span></div>
                                : option.label
                        }
                        styles={{
                            control: (base) => ({ ...base, minHeight: '42px', borderColor: '#e0e6ed' }),
                            menu: (base) => ({ ...base, zIndex: 50 }),
                        }}
                    />
                    <input
                        type="datetime-local"
                        className="form-input"
                        value={filters.from}
                        onChange={e => handleFilterChange('from', e.target.value)}
                    />
                    <input
                        type="datetime-local"
                        className="form-input"
                        value={filters.to}
                        onChange={e => handleFilterChange('to', e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="panel">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="font-semibold text-lg dark:text-white">
                        {t('wp_events_title')} <span className="text-sm text-gray-400">({total.toLocaleString()})</span>
                    </h5>
                    <button onClick={fetchEvents} className="btn btn-sm btn-outline-primary">
                        {t('refresh')}
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Hook</th>
                                <th>Site</th>
                                <th>User ID</th>
                                <th>{t('wp_events_date_wp')}</th>
                                <th>{t('wp_events_received')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">
                                        {t('loading')}
                                    </td>
                                </tr>
                            )}
                            {!loading && events.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">
                                        {t('wp_events_no_event')}
                                    </td>
                                </tr>
                            )}
                            {!loading && events.map(e => {
                                const siteName = resolveSiteName(e.site_url);
                                return (
                                    <tr key={e.id}>
                                        <td>
                                            <span className="badge bg-primary/10 text-primary font-mono text-xs">
                                                {e.hook}
                                            </span>
                                        </td>
                                        <td>
                                            {siteName && (
                                                <div className="text-xs font-medium dark:text-white">{siteName}</div>
                                            )}
                                            <div className="text-xs text-gray-400">
                                                {e.site_url.replace(/https?:\/\//, '')}
                                            </div>
                                        </td>
                                        <td className="text-xs">{e.user_id || '—'}</td>
                                        <td className="text-xs">{formatDate(e.wp_timestamp)}</td>
                                        <td className="text-xs">{formatDate(e.created_at)}</td>
                                        <td>
                                            <button
                                                className="btn btn-xs btn-outline-primary"
                                                onClick={() => setSelectedEvent(e)}
                                            >
                                                {t('details')}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h3 className="font-semibold text-lg dark:text-white">{t('wp_events_detail')}</h3>
                            <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-3 gap-1 text-sm">
                                <span className="text-gray-400">Hook</span>
                                <span className="col-span-2 font-mono font-medium text-primary dark:text-primary">{selectedEvent.hook}</span>

                                <span className="text-gray-400">Site</span>
                                <span className="col-span-2 dark:text-white">
                                    {resolveSiteName(selectedEvent.site_url) && (
                                        <span className="font-medium">{resolveSiteName(selectedEvent.site_url)} — </span>
                                    )}
                                    {selectedEvent.site_url}
                                </span>

                                <span className="text-gray-400">User ID</span>
                                <span className="col-span-2 dark:text-white">{selectedEvent.user_id || '—'}</span>

                                <span className="text-gray-400">Event ID</span>
                                <span className="col-span-2 font-mono text-xs text-gray-500">{selectedEvent.event_id || '—'}</span>

                                <span className="text-gray-400">{t('wp_events_date_wp')}</span>
                                <span className="col-span-2 dark:text-white">{formatDate(selectedEvent.wp_timestamp)}</span>

                                <span className="text-gray-400">{t('wp_events_received')}</span>
                                <span className="col-span-2 dark:text-white">{formatDate(selectedEvent.created_at)}</span>
                            </div>

                            <div className="mt-3">
                                <div className="text-gray-400 text-sm mb-1">{t('wp_events_args')}</div>
                                <pre className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {JSON.stringify(selectedEvent.args, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WpEvents;
