import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../store/themeConfigSlice';
import siteApi, { SiteData } from '../services/site.service';

const Sites = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sites, setSites] = useState<SiteData[]>([]);
    const [site, setSite] = useState<SiteData | null>(null);
    const [nom, setNom] = useState('');
    const [nomDeDomaine, setNomDeDomaine] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [deactivateModal, setDeactivateModal] = useState<{ siteId: number; siteName: string } | null>(null);
    const [deactivateLoading, setDeactivateLoading] = useState(false);
    const [statProcessing, setStatProcessing] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Sites'));

        const fetchSites = async () => {
            try {
                const data = await siteApi.getAll();
                setSites(data);
            } catch (e) {
                console.error('Failed to fetch sites', e);
            }
        };
        fetchSites();

        if (id) {
            const fetchSite = async () => {
                try {
                    const data = await siteApi.getOne(Number(id));
                    setSite(data);
                    setNom(data.nom);
                    setNomDeDomaine(data.nom_de_domaine);
                } catch (e) {
                    console.error('Failed to fetch site', e);
                }
            };
            fetchSite();
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const updated = await siteApi.update(Number(id), { nom, nom_de_domaine: nomDeDomaine });
            setSite(updated);
            setSuccess(t('profile_success'));
        } catch (err: any) {
            setError(err?.message || t('error_label'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>{id ? `${t('manage_site')} : ${site?.nom || '...'}` : 'Sites'}</span>
                </li>
            </ul>

            <div className="pt-5">
                <div className="panel mb-5">
                    <label htmlFor="site-selector" className="block text-sm font-semibold mb-2 dark:text-white-light">{t('select_site')}</label>
                    <select
                        id="site-selector"
                        className="form-select"
                        value={id || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val) navigate(`/sites/${val}`);
                            else navigate('/sites');
                        }}
                    >
                        <option value="">{t('choose_site')}</option>
                        {sites.map((s) => (
                            <option key={s.id} value={s.id}>{s.nom} ({s.nom_de_domaine})</option>
                        ))}
                    </select>
                </div>
            </div>

            {!id ? (
                <div className="panel p-10 text-center text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M9 17.25H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    </svg>
                    <p className="text-lg font-semibold">{t('site_select_placeholder_title')}</p>
                    <p className="text-sm mt-1">{t('site_select_placeholder_desc')}</p>
                </div>
            ) : (
                <div className="pt-5">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white-light">{t('site_info')}</h5>
                                {site?.stat === 'maintenance' ? (
                                    <span className="badge rounded-full bg-info/20 text-info">{t('maintenance')}</span>
                                ) : (
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={site?.stat === 'active'}
                                            onChange={async () => {
                                                if (!site) return;
                                                if (site.stat === 'active') {
                                                    setDeactivateModal({ siteId: site.id, siteName: site.nom });
                                                } else {
                                                    setStatProcessing(true);
                                                    try {
                                                        const updated = await siteApi.toggleStat(site.id, 'active');
                                                        setSite(prev => prev ? { ...prev, stat: updated.stat } : prev);
                                                    } finally {
                                                        setStatProcessing(false);
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="w-11 h-6 bg-danger/30 peer-checked:bg-success/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-danger peer-checked:after:bg-success after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                        <span className={`ml-2 text-xs font-medium ${site?.stat === 'active' ? 'text-success' : 'text-danger'}`}>
                                            {site?.stat === 'active' ? t('active') : t('inactive')}
                                        </span>
                                    </label>
                                )}
                            </div>

                            {success && (
                                <div className="flex items-center p-3.5 rounded text-success bg-success-light dark:bg-success-dark-light mb-5">
                                    <span className="ltr:pr-2 rtl:pl-2">
                                        <strong className="ltr:mr-1 rtl:ml-1">{t('site_success_label')}</strong>{success}
                                    </span>
                                </div>
                            )}
                            {error && (
                                <div className="flex items-center p-3.5 rounded text-danger bg-danger-light dark:bg-danger-dark-light mb-5">
                                    <span className="ltr:pr-2 rtl:pl-2">
                                        <strong className="ltr:mr-1 rtl:ml-1">{t('site_error_label')}</strong>{error}
                                    </span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="nom" className="dark:text-white-light">{t('site_name')}</label>
                                    <input id="nom" type="text" className="form-input" placeholder="Mon site" value={nom} onChange={(e) => setNom(e.target.value)} required />
                                </div>
                                <div>
                                    <label htmlFor="domain" className="dark:text-white-light">{t('site_domain')}</label>
                                    <input id="domain" type="text" className="form-input" placeholder="monsite.com" value={nomDeDomaine} onChange={(e) => setNomDeDomaine(e.target.value)} required />
                                </div>

                                <div className="border-t border-white-light dark:border-[#1b2e4b] pt-4 mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-white-dark text-xs mb-1">{t('site_created_at')}</div>
                                        <div className="font-semibold">
                                            {site?.created_at ? new Date(site.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-white-dark text-xs mb-1">{t('site_updated_at')}</div>
                                        <div className="font-semibold">
                                            {site?.updated_at ? new Date(site.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? t('site_updating') : t('site_save')}
                                    </button>
                                    <button type="button" className="btn btn-outline-danger" onClick={() => navigate('/')}>
                                        {t('back')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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
                                    <p className="font-semibold text-warning mb-1">{t('site_deactivate_warning_title')}</p>
                                    <p className="text-sm text-white-dark">
                                        {t('site_deactivate_detail', { name: deactivateModal.siteName })}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm mb-5">{t('site_deactivate_confirm')}</p>
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
                                            setSite(prev => prev ? { ...prev, stat: updated.stat } : prev);
                                        } finally {
                                            setDeactivateLoading(false);
                                            setStatProcessing(false);
                                        }
                                    }}
                                >
                                    {deactivateLoading ? t('site_deactivating') : t('site_deactivate')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {statProcessing && (
                <div className="fixed inset-0 bg-[black]/60 z-[999] flex items-center justify-center">
                    <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xs">
                        <div className="flex items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] px-5 py-3">
                            <h5 className="font-bold text-base">{t('site_updating_title')}</h5>
                        </div>
                        <div className="p-6 flex items-center justify-center gap-4">
                            <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-8 h-8 inline-block"></span>
                            <p className="text-sm text-white-dark">{t('site_please_wait')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sites;
