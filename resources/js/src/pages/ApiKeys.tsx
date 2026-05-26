import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../store/themeConfigSlice';
import siteApi, { SiteData, WcApiKey, WcApiKeyCreated } from '../services/site.service';

const ApiKeys = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sites, setSites] = useState<SiteData[]>([]);
    const [site, setSite] = useState<SiteData | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [wpPassword, setWpPassword] = useState<string | null>(null);
    const [wpPasswordVisible, setWpPasswordVisible] = useState(false);
    const [wpRegenerating, setWpRegenerating] = useState(false);

    const [wcKeys, setWcKeys] = useState<WcApiKey[]>([]);
    const [wcLoading, setWcLoading] = useState(false);
    const [wcRevealed, setWcRevealed] = useState<WcApiKeyCreated | null>(null);
    const [wcDeleting, setWcDeleting] = useState<number | null>(null);
    const [wcRegenerating, setWcRegenerating] = useState<number | null>(null);
    const [wcCreateOpen, setWcCreateOpen] = useState(false);
    const [wcCreateForm, setWcCreateForm] = useState({ user_id: '', description: '', permissions: 'read_write' });
    const [wcCreating, setWcCreating] = useState(false);
    const [wcCreateError, setWcCreateError] = useState<string | null>(null);

    const copyToClipboard = (text: string, label: string) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopied(label);
        setTimeout(() => setCopied(null), 1500);
    };

    useEffect(() => {
        dispatch(setPageTitle('API Keys'));

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
                } catch (e) {
                    console.error('Failed to fetch site', e);
                }
            };
            fetchSite();

            const fetchWcKeys = async () => {
                setWcLoading(true);
                try {
                    const data = await siteApi.listWcApiKeys(Number(id));
                    setWcKeys(data);
                } catch (e) {
                    console.error('Failed to fetch WC API keys', e);
                } finally {
                    setWcLoading(false);
                }
            };
            fetchWcKeys();
        } else {
            setWcKeys([]);
        }
    }, [id]);

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                {site && (
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link to={`/sites/${id}`} className="text-primary hover:underline">{site.nom}</Link>
                    </li>
                )}
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>API Keys</span>
                </li>
            </ul>

            <div className="pt-5">
                <div className="mb-6">
                    <label htmlFor="site-select" className="block text-sm font-medium mb-2 dark:text-white-light">{t('select_site')}</label>
                    <select
                        id="site-select"
                        className="form-select w-full max-w-md"
                        value={id || ''}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId) {
                                navigate(`/sites/${selectedId}/api-keys`);
                            } else {
                                navigate('/api-keys');
                            }
                        }}
                    >
                        <option value="">-- {t('wp_hooks_choose_site')} --</option>
                        {sites.map((s) => (
                            <option key={s.id} value={s.id}>{s.nom} ({s.nom_de_domaine})</option>
                        ))}
                    </select>
                </div>

                {!id ? (
                    <div className="panel py-10 text-center">
                        <div className="text-white-dark text-lg">{t('api_keys_select_site')}</div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* WordPress REST API */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white-light">WordPress REST API</h5>
                                <span className="badge bg-info/20 text-info rounded-full text-xs">REST</span>
                            </div>
                            <p className="text-white-dark text-sm mb-4">{t('api_keys_rest_desc')}</p>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <div className="text-white-dark text-xs mb-1">{t('api_keys_rest_url')}</div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono">https://{site?.nom_de_domaine || '...'}/wp-json/wp/v2/</code>
                                        <button type="button" className="btn btn-outline-dark btn-sm px-1.5 py-1" title={t('copy')} onClick={() => copyToClipboard(`https://${site?.nom_de_domaine || ''}/wp-json/wp/v2/`, 'wp-rest')}>
                                            {copied === 'wp-rest' ? '✓' : '⧉'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <div className="text-white-dark text-xs mb-1">Application Password (Username)</div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono">admin</code>
                                        <button type="button" className="btn btn-outline-dark btn-sm px-1.5 py-1" title={t('copy')} onClick={() => copyToClipboard('admin', 'wp-user')}>
                                            {copied === 'wp-user' ? '✓' : '⧉'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-white-dark text-xs mb-1">{t('api_keys_admin_pass')}</div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono">
                                            {wpPassword
                                                ? (wpPasswordVisible ? wpPassword : '••••••••••••••••')
                                                : '••••••••••••••••'}
                                        </code>
                                        {wpPassword && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm text-xs"
                                                    onClick={() => setWpPasswordVisible(v => !v)}
                                                >
                                                    {wpPasswordVisible ? t('hide') : t('show')}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-dark btn-sm px-1.5 py-1"
                                                    title={t('copy')}
                                                    onClick={() => copyToClipboard(wpPassword, 'wp-pass')}
                                                >
                                                    {copied === 'wp-pass' ? '✓' : '⧉'}
                                                </button>
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-outline-warning btn-sm text-xs"
                                            disabled={wpRegenerating}
                                            onClick={async () => {
                                                if (!confirm(t('api_keys_regen_wp_confirm'))) return;
                                                setWpRegenerating(true);
                                                try {
                                                    const res = await siteApi.regenerateWpPassword(Number(id));
                                                    setWpPassword(res.wp_admin_pass);
                                                    setWpPasswordVisible(true);
                                                } catch (e) {
                                                    console.error('Failed to regenerate WP password', e);
                                                } finally {
                                                    setWpRegenerating(false);
                                                }
                                            }}
                                        >
                                            {wpRegenerating ? '...' : t('regenerate')}
                                        </button>
                                    </div>
                                    {wpPassword && (
                                        <p className="text-warning text-xs mt-1">{t('api_keys_copy_now')}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* WooCommerce REST API */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white-light">WooCommerce API</h5>
                                <div className="flex items-center gap-3">
                                    <span className="badge bg-warning/20 text-warning rounded-full text-xs">E-commerce</span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        onClick={() => { setWcCreateOpen(true); setWcRevealed(null); }}
                                    >
                                        + {t('api_keys_new_key')}
                                    </button>
                                </div>
                            </div>
                            <p className="text-white-dark text-sm mb-4">{t('api_keys_wc_desc')}</p>

                            {/* URL */}
                            <div className="mb-4">
                                <div className="text-white-dark text-xs mb-1">{t('api_keys_wc_url')}</div>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono">https://{site?.nom_de_domaine || '...'}/wp-json/wc/v3/</code>
                                    <button type="button" className="btn btn-outline-dark btn-sm px-1.5 py-1" title={t('copy')} onClick={() => copyToClipboard(`https://${site?.nom_de_domaine || ''}/wp-json/wc/v3/`, 'wc-url')}>
                                        {copied === 'wc-url' ? '✓' : '⧉'}
                                    </button>
                                </div>
                            </div>

                            {/* Revealed keys */}
                            {wcRevealed && (
                                <div className="bg-warning/10 border border-warning/30 rounded p-4 mb-4 space-y-2">
                                    <p className="text-warning text-xs font-semibold">{t('api_keys_wc_copy_now')}</p>
                                    <div>
                                        <div className="text-white-dark text-xs mb-1">Consumer Key</div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono break-all">{wcRevealed.consumer_key}</code>
                                            <button type="button" className="btn btn-outline-dark btn-sm px-1.5 py-1 shrink-0" onClick={() => copyToClipboard(wcRevealed.consumer_key, 'wc-ck')}>
                                                {copied === 'wc-ck' ? '✓' : '⧉'}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-white-dark text-xs mb-1">Consumer Secret</div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono break-all">{wcRevealed.consumer_secret}</code>
                                            <button type="button" className="btn btn-outline-dark btn-sm px-1.5 py-1 shrink-0" onClick={() => copyToClipboard(wcRevealed.consumer_secret, 'wc-cs')}>
                                                {copied === 'wc-cs' ? '✓' : '⧉'}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="button" className="btn btn-outline-warning btn-sm text-xs mt-1" onClick={() => setWcRevealed(null)}>{t('close')}</button>
                                </div>
                            )}

                            {/* Create form */}
                            {wcCreateOpen && (
                                <div className="border border-white-light dark:border-[#1b2e4b] rounded p-4 mb-4 space-y-3">
                                    <h6 className="font-semibold text-sm dark:text-white-light">{t('api_keys_create')}</h6>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-white-dark text-xs mb-1 block">User ID</label>
                                            <input
                                                type="number"
                                                className="form-input text-sm"
                                                placeholder="Ex: 1"
                                                value={wcCreateForm.user_id}
                                                onChange={e => setWcCreateForm(f => ({ ...f, user_id: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white-dark text-xs mb-1 block">{t('api_keys_description')}</label>
                                            <input
                                                type="text"
                                                className="form-input text-sm"
                                                placeholder="Ex: Application mobile"
                                                value={wcCreateForm.description}
                                                onChange={e => setWcCreateForm(f => ({ ...f, description: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white-dark text-xs mb-1 block">{t('api_keys_permissions')}</label>
                                            <select
                                                className="form-select text-sm"
                                                value={wcCreateForm.permissions}
                                                onChange={e => setWcCreateForm(f => ({ ...f, permissions: e.target.value }))}
                                            >
                                                <option value="read">{t('api_keys_read_only')}</option>
                                                <option value="write">{t('api_keys_write_only')}</option>
                                                <option value="read_write">{t('api_keys_read_write')}</option>
                                            </select>
                                        </div>
                                    </div>
                                    {wcCreateError && (
                                        <div className="text-danger text-xs bg-danger/10 border border-danger/30 rounded px-3 py-2">{wcCreateError}</div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            disabled={wcCreating || !wcCreateForm.user_id || !wcCreateForm.description}
                                            onClick={async () => {
                                                setWcCreateError(null);
                                                setWcCreating(true);
                                                try {
                                                    const created = await siteApi.createWcApiKey(Number(id), {
                                                        user_id: Number(wcCreateForm.user_id),
                                                        description: wcCreateForm.description,
                                                        permissions: wcCreateForm.permissions,
                                                    });
                                                    setWcKeys(prev => [...prev, created]);
                                                    setWcRevealed(created);
                                                    setWcCreateOpen(false);
                                                    setWcCreateForm({ user_id: '', description: '', permissions: 'read_write' });
                                                } catch (e: any) {
                                                    const detail = e?.raw ? ` — ${String(e.raw).trim()}` : '';
                                                    setWcCreateError((e?.message || t('api_keys_unknown_error')) + detail);
                                                } finally {
                                                    setWcCreating(false);
                                                }
                                            }}
                                        >
                                            {wcCreating ? t('api_keys_creating') : t('create')}
                                        </button>
                                        <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => { setWcCreateOpen(false); setWcCreateError(null); }}>{t('cancel')}</button>
                                    </div>
                                </div>
                            )}

                            {/* Keys list */}
                            {wcLoading ? (
                                <div className="text-center py-6 text-white-dark text-sm">{t('loading')}</div>
                            ) : wcKeys.length === 0 ? (
                                <div className="text-center py-6 text-white-dark text-sm">{t('api_keys_no_wc')}</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table-hover">
                                        <thead>
                                            <tr>
                                                <th>{t('api_keys_description')}</th>
                                                <th>{t('api_keys_user')}</th>
                                                <th>{t('api_keys_role')}</th>
                                                <th>{t('api_keys_permissions')}</th>
                                                <th>{t('api_keys_truncated')}</th>
                                                <th>{t('api_keys_last_access')}</th>
                                                <th className="text-center">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {wcKeys.map((key) => (
                                                <tr key={key.key_id}>
                                                    <td className="text-sm">{key.description || <span className="text-white-dark italic">—</span>}</td>
                                                    <td className="text-sm">
                                                        <div>{key.display_name}</div>
                                                        <div className="text-white-dark text-xs">@{key.user_login}</div>
                                                    </td>
                                                    <td className="text-sm">
                                                        {key.roles.map(r => (
                                                            <span key={r} className="badge bg-dark/20 text-dark dark:bg-white/10 dark:text-white-light rounded text-xs mr-1">{r}</span>
                                                        ))}
                                                    </td>
                                                    <td className="text-sm">
                                                        <span className={`badge rounded text-xs ${key.permissions === 'read_write' ? 'bg-success/20 text-success' : key.permissions === 'write' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'}`}>
                                                            {key.permissions === 'read_write' ? 'R/W' : key.permissions === 'write' ? 'Write' : 'Read'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <code className="text-xs bg-[#ebedf2] dark:bg-dark/40 px-1.5 py-0.5 rounded font-mono">{key.truncated_key}</code>
                                                    </td>
                                                    <td className="text-sm text-white-dark">{key.last_access || '—'}</td>
                                                    <td className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary btn-sm text-xs"
                                                                disabled={wcRegenerating === key.key_id}
                                                                onClick={async () => {
                                                                    if (!confirm(t('api_keys_regen_wc_confirm', { desc: key.description }))) return;
                                                                    setWcRegenerating(key.key_id);
                                                                    try {
                                                                        const updated = await siteApi.regenerateWcApiKey(Number(id), key.key_id);
                                                                        setWcKeys(prev => prev.map(k => k.key_id === updated.key_id ? updated : k));
                                                                        setWcRevealed(updated);
                                                                    } catch (e) {
                                                                        console.error('Failed to regenerate WC key', e);
                                                                    } finally {
                                                                        setWcRegenerating(null);
                                                                    }
                                                                }}
                                                            >
                                                                {wcRegenerating === key.key_id ? '...' : t('regenerate')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm text-xs"
                                                                disabled={wcDeleting === key.key_id}
                                                                onClick={async () => {
                                                                    if (!confirm(t('api_keys_delete_confirm', { desc: key.description }))) return;
                                                                    setWcDeleting(key.key_id);
                                                                    try {
                                                                        await siteApi.deleteWcApiKey(Number(id), key.key_id);
                                                                        setWcKeys(prev => prev.filter(k => k.key_id !== key.key_id));
                                                                        if (wcRevealed?.key_id === key.key_id) setWcRevealed(null);
                                                                    } catch (e) {
                                                                        console.error('Failed to delete WC key', e);
                                                                    } finally {
                                                                        setWcDeleting(null);
                                                                    }
                                                                }}
                                                            >
                                                                {wcDeleting === key.key_id ? '...' : t('delete')}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* GraphQL */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white-light">WPGraphQL</h5>
                                <span className="badge bg-success/20 text-success rounded-full text-xs">GraphQL</span>
                            </div>
                            <p className="text-white-dark text-sm mb-4">{t('api_keys_graphql_desc')}</p>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <div className="text-white-dark text-xs mb-1">{t('api_keys_graphql_endpoint')}</div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono">https://{site?.nom_de_domaine || '...'}/graphql</code>
                                        <button type="button" className="btn btn-outline-dark btn-sm px-1.5 py-1" title={t('copy')} onClick={() => copyToClipboard(`https://${site?.nom_de_domaine || ''}/graphql`, 'graphql-url')}>
                                            {copied === 'graphql-url' ? '✓' : '⧉'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-white-light dark:border-[#1b2e4b] mt-5 pt-4">
                                <div className="text-white-dark text-xs mb-2">{t('api_keys_graphql_example')}</div>
                                <div className="flex items-center gap-2">
                                    <pre className="text-sm bg-[#ebedf2] dark:bg-dark/40 p-3 rounded font-mono overflow-x-auto flex-1">{`{
  posts {
    nodes {
      title
      slug
      content
    }
  }
}`}</pre>
                                    <button type="button" className="btn btn-outline-dark btn-sm px-1.5 py-1" title={t('copy')} onClick={() => copyToClipboard(`{\n  posts {\n    nodes {\n      title\n      slug\n      content\n    }\n  }\n}`, 'graphql-example')}>
                                        {copied === 'graphql-example' ? '✓' : '⧉'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiKeys;
