import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../store/themeConfigSlice';
import siteApi, { SiteData } from '../services/site.service';
import siteHookApi, { SiteHookData } from '../services/site-hook.service';
import hookApi, { HookCategory, HookData } from '../services/hook.service';

const WpHooks = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sites, setSites] = useState<SiteData[]>([]);
    const [site, setSite] = useState<SiteData | null>(null);

    const [siteHooks, setSiteHooks] = useState<SiteHookData[]>([]);
    const [catalogue, setCatalogue] = useState<HookCategory[]>([]);
    const [myHooks, setMyHooks] = useState<HookData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hookSearch, setHookSearch] = useState('');
    const [customHook, setCustomHook] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('WordPress Hooks'));

        const fetchSites = async () => {
            try {
                const data = await siteApi.getAll();
                setSites(data);
            } catch (e) {
                console.error('Failed to fetch sites', e);
            }
        };

        const fetchCatalogue = async () => {
            try {
                const hooks = await hookApi.getListed();
                setCatalogue(hookApi.groupByCategory(hooks));
            } catch (e) {
                console.error('Failed to fetch hooks catalogue', e);
            }
        };

        const fetchMyHooks = async () => {
            try {
                const hooks = await hookApi.getMine();
                setMyHooks(hooks);
            } catch (e) {
                console.error('Failed to fetch personal hooks', e);
            }
        };

        fetchSites();
        fetchCatalogue();
        fetchMyHooks();

        if (id) {
            const fetchSite = async () => {
                try {
                    const data = await siteApi.getOne(Number(id));
                    setSite(data);
                } catch (e) {
                    console.error('Failed to fetch site', e);
                }
            };
            fetchSite();
            fetchSiteHooks();
        }
    }, [id]);

    const fetchSiteHooks = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await siteHookApi.getAll(Number(id));
            setSiteHooks(data);
        } catch (e) {
            console.error('Failed to fetch hooks', e);
        } finally {
            setLoading(false);
        }
    };

    const addFromCatalogue = async (hookId: number) => {
        if (!id) return;
        try {
            const created = await siteHookApi.addById(Number(id), hookId);
            setSiteHooks((prev) => [...prev, created]);
        } catch (e) {
            console.error('Failed to add hook', e);
        }
    };

    const addCustomHook = async () => {
        if (!id || !customHook.trim()) return;
        try {
            const created = await siteHookApi.addCustom(Number(id), customHook.trim());
            setSiteHooks((prev) => [...prev, created]);
            setMyHooks((prev) => prev.some((h) => h.id === created.hook_id) ? prev : [
                ...prev,
                { id: created.hook_id, hook: created.hook, label: created.label, category: created.category, origine: 'externe' },
            ]);
            setCustomHook('');
        } catch (e) {
            console.error('Failed to add custom hook', e);
        }
    };

    const toggleHook = async (siteHook: SiteHookData) => {
        if (!id) return;
        try {
            const updated = await siteHookApi.toggle(Number(id), siteHook.id, !siteHook.active);
            setSiteHooks((prev) => prev.map((h) => (h.id === siteHook.id ? updated : h)));
        } catch (e) {
            console.error('Failed to toggle hook', e);
        }
    };

    const removeHook = async (siteHook: SiteHookData) => {
        if (!id) return;
        try {
            await siteHookApi.remove(Number(id), siteHook.id);
            setSiteHooks((prev) => prev.filter((h) => h.id !== siteHook.id));
        } catch (e) {
            console.error('Failed to remove hook', e);
        }
    };

    const activatedHookIds = new Set(siteHooks.map((h) => h.hook_id));

    const filteredCatalogue = catalogue
        .map((cat) => ({
            ...cat,
            hooks: cat.hooks.filter(
                (h) =>
                    h.hook.toLowerCase().includes(hookSearch.toLowerCase()) ||
                    (h.label ?? '').toLowerCase().includes(hookSearch.toLowerCase())
            ),
        }))
        .filter((cat) => cat.hooks.length > 0);

    const filteredMyHooks = myHooks.filter((h) =>
        h.hook.toLowerCase().includes(hookSearch.toLowerCase())
    );

    const activeHooks = siteHooks.filter((h) => h.active);
    const inactiveHooks = siteHooks.filter((h) => !h.active);

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                {site && (
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link to={`/sites/${id}`} className="text-primary hover:underline">
                            {site.nom}
                        </Link>
                    </li>
                )}
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>WordPress Hooks</span>
                </li>
            </ul>

            <div className="pt-5">
                {/* Site selector */}
                <div className="mb-6">
                    <label htmlFor="site-select" className="block text-sm font-medium mb-2 dark:text-white-light">
                        {t('select_site')}
                    </label>
                    <select
                        id="site-select"
                        className="form-select w-full max-w-md"
                        value={id || ''}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId) {
                                navigate(`/sites/${selectedId}/wp-hooks`);
                            } else {
                                navigate('/wp-hooks');
                            }
                        }}
                    >
                        <option value="">-- {t('wp_hooks_choose_site')} --</option>
                        {sites.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.nom} ({s.nom_de_domaine})
                            </option>
                        ))}
                    </select>
                </div>

                {!id ? (
                    <div className="panel py-10 text-center">
                        <div className="text-white-dark text-lg">{t('wp_hooks_select_site_msg')}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                        {/* Left: Activated hooks */}
                        <div className="panel xl:col-span-2">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white-light">{t('wp_hooks_listened')}</h5>
                                <span className="badge bg-primary/20 text-primary rounded-full">{siteHooks.length} hook(s)</span>
                            </div>
                            <p className="text-white-dark text-sm mb-5">
                                {t('wp_hooks_info')}
                            </p>

                            {loading ? (
                                <div className="text-center text-white-dark py-8">{t('loading')}</div>
                            ) : siteHooks.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="text-white-dark mb-2">{t('wp_hooks_none')}</div>
                                    <p className="text-white-dark text-sm">{t('wp_hooks_browse')}</p>
                                </div>
                            ) : (
                                <div>
                                    {activeHooks.length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-xs font-semibold text-success uppercase mb-2">{t('wp_hooks_active')} ({activeHooks.length})</div>
                                            <div className="space-y-1.5">
                                                {activeHooks.map((h) => (
                                                    <div key={h.id} className="flex items-center justify-between bg-success/5 border border-success/20 rounded-lg px-4 py-2.5">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleHook(h)}
                                                                className="w-3 h-3 rounded-full shrink-0 bg-success"
                                                                title={t('wp_hooks_active_tooltip')}
                                                            />
                                                            <div className="min-w-0">
                                                                <code className="text-sm font-mono truncate block">{h.hook}</code>
                                                                {h.label && <div className="text-[10px] text-white-dark">{h.label}</div>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                                            <button type="button" className="text-white-dark hover:text-warning text-xs" onClick={() => toggleHook(h)}>
                                                                {t('deactivate')}
                                                            </button>
                                                            <button type="button" className="text-danger hover:text-danger/80 text-xs" onClick={() => removeHook(h)}>
                                                                {t('delete')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {inactiveHooks.length > 0 && (
                                        <div>
                                            <div className="text-xs font-semibold text-danger uppercase mb-2">{t('wp_hooks_inactive')} ({inactiveHooks.length})</div>
                                            <div className="space-y-1.5">
                                                {inactiveHooks.map((h) => (
                                                    <div key={h.id} className="flex items-center justify-between bg-[#f9fafb] dark:bg-[#0e1726] rounded-lg px-4 py-2.5 opacity-60">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleHook(h)}
                                                                className="w-3 h-3 rounded-full shrink-0 bg-danger"
                                                                title={t('wp_hooks_inactive_tooltip')}
                                                            />
                                                            <div className="min-w-0">
                                                                <code className="text-sm font-mono truncate block">{h.hook}</code>
                                                                {h.label && <div className="text-[10px] text-white-dark">{h.label}</div>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                                            <button type="button" className="text-white-dark hover:text-success text-xs" onClick={() => toggleHook(h)}>
                                                                {t('activate')}
                                                            </button>
                                                            <button type="button" className="text-danger hover:text-danger/80 text-xs" onClick={() => removeHook(h)}>
                                                                {t('delete')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: Catalog + custom hook */}
                        <div className="panel xl:col-span-1">
                            <h5 className="font-semibold text-base dark:text-white-light mb-4">{t('wp_hooks_catalogue')}</h5>

                            {/* Custom hook input */}
                            <div className="mb-4">
                                <div className="text-xs font-semibold text-white-dark uppercase mb-2">{t('wp_hooks_custom')}</div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="form-input text-xs flex-1"
                                        placeholder="mon_hook_custom"
                                        value={customHook}
                                        onChange={(e) => setCustomHook(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addCustomHook();
                                            }
                                        }}
                                    />
                                    <button type="button" className="btn btn-primary btn-sm text-xs px-3" onClick={addCustomHook} disabled={!customHook.trim()}>
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="border-t border-white-light dark:border-[#1b2e4b] pt-4">
                                <input
                                    type="text"
                                    className="form-input text-xs mb-3"
                                    placeholder={t('wp_hooks_search')}
                                    value={hookSearch}
                                    onChange={(e) => setHookSearch(e.target.value)}
                                />
                                <div className="max-h-[500px] overflow-y-auto space-y-3">
                                    {filteredMyHooks.length > 0 && (
                                        <div>
                                            <div className="text-xs font-semibold text-warning mb-1.5">{t('wp_hooks_my_custom')}</div>
                                            <div className="space-y-1">
                                                {filteredMyHooks.map((hook) => {
                                                    const isActivated = activatedHookIds.has(hook.id);
                                                    return (
                                                        <button
                                                            key={hook.id}
                                                            type="button"
                                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                                                                isActivated
                                                                    ? 'bg-success/10 text-success cursor-default'
                                                                    : 'bg-warning/5 border border-warning/20 hover:bg-primary/10 hover:text-primary'
                                                            }`}
                                                            onClick={() => !isActivated && addFromCatalogue(hook.id)}
                                                            disabled={isActivated}
                                                        >
                                                            <code className="font-mono text-[11px]">{hook.hook}</code>
                                                            {isActivated ? (
                                                                <span className="text-[10px]">✓ {t('wp_hooks_activated')}</span>
                                                            ) : (
                                                                <span className="text-[10px] text-white-dark">+ {t('wp_hooks_activate_btn')}</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {filteredCatalogue.map((cat) => (
                                        <div key={cat.category}>
                                            <div className="text-xs font-semibold text-primary mb-1.5">{cat.category}</div>
                                            <div className="space-y-1">
                                                {cat.hooks.map((hook) => {
                                                    const isActivated = activatedHookIds.has(hook.id);
                                                    return (
                                                        <button
                                                            key={hook.id}
                                                            type="button"
                                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                                                                isActivated
                                                                    ? 'bg-success/10 text-success cursor-default'
                                                                    : 'bg-[#f9fafb] dark:bg-[#0e1726] hover:bg-primary/10 hover:text-primary'
                                                            }`}
                                                            onClick={() => !isActivated && addFromCatalogue(hook.id)}
                                                            disabled={isActivated}
                                                        >
                                                            <div>
                                                                <code className="font-mono text-[11px]">{hook.hook}</code>
                                                                {hook.label && <div className="text-[10px] text-white-dark mt-0.5">{hook.label}</div>}
                                                            </div>
                                                            {isActivated ? (
                                                                <span className="text-[10px]">✓ {t('wp_hooks_activated')}</span>
                                                            ) : (
                                                                <span className="text-[10px] text-white-dark">+ {t('wp_hooks_activate_btn')}</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredCatalogue.length === 0 && (
                                        <div className="text-center text-white-dark text-xs py-3">{t('wp_hooks_not_found')}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WpHooks;
