import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../store/themeConfigSlice';
import siteApi, { SiteData } from '../services/site.service';
import webhookApi, { WebhookData, AUTH_TYPES, AUTH_TYPE_FIELDS, AuthField, WebhookEventData } from '../services/webhook.service';
import siteHookApi, { SiteHookData } from '../services/site-hook.service';

const Webhooks = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sites, setSites] = useState<SiteData[]>([]);
    const [site, setSite] = useState<SiteData | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
    const [webhookLoading, setWebhookLoading] = useState(false);
    const [showWebhookModal, setShowWebhookModal] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null);
    const [webhookForm, setWebhookForm] = useState({
        name: '',
        endpoint_url: '',
        auth_type: 'none' as string,
        auth_config: {} as Record<string, string>,
        content_type: 'application/json',
        active: true,
    });
    const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
    const [regeneratingSecret, setRegeneratingSecret] = useState(false);
    const [regeneratedSecret, setRegeneratedSecret] = useState<string | null>(null);

    const [selectedWebhook, setSelectedWebhook] = useState<WebhookData | null>(null);
    const [webhookEvents, setWebhookEvents] = useState<WebhookEventData[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [hookSearch, setHookSearch] = useState('');
    const [siteHooks, setSiteHooks] = useState<SiteHookData[]>([]);

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
        dispatch(setPageTitle('Webhooks'));

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
            fetchWebhooks();
        }
    }, [id]);

    const fetchWebhooks = async () => {
        if (!id) return;
        setWebhookLoading(true);
        try {
            const data = await webhookApi.getAll(Number(id));
            setWebhooks(data);
        } catch (e) {
            console.error('Failed to fetch webhooks', e);
        } finally {
            setWebhookLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingWebhook(null);
        setWebhookForm({ name: '', endpoint_url: '', auth_type: 'none', auth_config: {}, content_type: 'application/json', active: true });
        setWebhookSecret(null);
        setRegeneratedSecret(null);
        setShowWebhookModal(true);
    };

    const openEditModal = (webhook: WebhookData) => {
        setEditingWebhook(webhook);
        setWebhookForm({
            name: webhook.name || '',
            endpoint_url: webhook.endpoint_url,
            auth_type: webhook.auth_type || 'none',
            auth_config: {},
            content_type: webhook.content_type || 'application/json',
            active: webhook.active,
        });
        setWebhookSecret(null);
        setRegeneratedSecret(null);
        setShowWebhookModal(true);
    };

    const handleWebhookSubmit = async () => {
        if (!id) return;
        if (!webhookForm.endpoint_url.startsWith('https://')) {
            alert(t('webhooks_url_alert'));
            return;
        }
        setWebhookLoading(true);
        try {
            if (editingWebhook) {
                await webhookApi.update(Number(id), editingWebhook.id, webhookForm);
                setShowWebhookModal(false);
            } else {
                const res = await webhookApi.create(Number(id), webhookForm);
                setWebhookSecret(res.secret);
            }
            await fetchWebhooks();
        } catch (e) {
            console.error('Failed to save webhook', e);
        } finally {
            setWebhookLoading(false);
        }
    };

    const handleRegenerateSecret = async () => {
        if (!id || !editingWebhook) return;
        if (!confirm(t('webhooks_regen_confirm'))) return;
        setRegeneratingSecret(true);
        try {
            const res = await webhookApi.regenerateSecret(Number(id), editingWebhook.id);
            setRegeneratedSecret(res.secret);
        } catch (e) {
            console.error('Failed to regenerate secret', e);
        } finally {
            setRegeneratingSecret(false);
        }
    };

    const handleWebhookDelete = async (webhookId: number) => {
        if (!id || !confirm(t('webhooks_delete_confirm'))) return;
        try {
            await webhookApi.delete(Number(id), webhookId);
            await fetchWebhooks();
        } catch (e) {
            console.error('Failed to delete webhook', e);
        }
    };

    const handleWebhookToggle = async (webhook: WebhookData) => {
        if (!id) return;
        try {
            await webhookApi.update(Number(id), webhook.id, { active: !webhook.active });
            await fetchWebhooks();
        } catch (e) {
            console.error('Failed to toggle webhook', e);
        }
    };

    const fetchSiteHooks = async () => {
        if (!id) return;
        try {
            const data = await siteHookApi.getAll(Number(id));
            setSiteHooks(data.filter(h => h.active));
        } catch (e) {
            console.error('Failed to fetch site hooks', e);
        }
    };

    const selectWebhookForEvents = async (webhook: WebhookData) => {
        setSelectedWebhook(webhook);
        setHookSearch('');
        setEventsLoading(true);
        try {
            const [eventsData] = await Promise.all([
                webhookApi.getEvents(Number(id), webhook.id),
                fetchSiteHooks(),
            ]);
            setWebhookEvents(eventsData);
        } catch (e) {
            console.error('Failed to fetch webhook events', e);
        } finally {
            setEventsLoading(false);
        }
    };

    const addHookEvent = async (hook: string) => {
        if (!id || !selectedWebhook) return;
        try {
            await webhookApi.addEvent(Number(id), selectedWebhook.id, hook);
            const data = await webhookApi.getEvents(Number(id), selectedWebhook.id);
            setWebhookEvents(data);
            await fetchWebhooks();
        } catch (e) {
            console.error('Failed to add hook event', e);
        }
    };

    const toggleHookEvent = async (event: WebhookEventData) => {
        if (!id || !selectedWebhook) return;
        try {
            await webhookApi.toggleEvent(Number(id), selectedWebhook.id, event.id, !event.active);
            setWebhookEvents(prev => prev.map(e => e.id === event.id ? { ...e, active: !e.active } : e));
        } catch (e) {
            console.error('Failed to toggle hook event', e);
        }
    };

    const removeHookEvent = async (event: WebhookEventData) => {
        if (!id || !selectedWebhook) return;
        try {
            await webhookApi.removeEvent(Number(id), selectedWebhook.id, event.id);
            setWebhookEvents(prev => prev.filter(e => e.id !== event.id));
            await fetchWebhooks();
        } catch (e) {
            console.error('Failed to remove hook event', e);
        }
    };

    const subscribedHooks = new Set(webhookEvents.map(e => e.hook));
    const availableSiteHooks = siteHooks.filter(h => h.hook.toLowerCase().includes(hookSearch.toLowerCase()));

    const formatTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return t('webhooks_never');
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t('webhooks_just_now');
        if (mins < 60) return t('webhooks_minutes_ago', { count: mins });
        const hours = Math.floor(mins / 60);
        if (hours < 24) return t('webhooks_hours_ago', { count: hours });
        const days = Math.floor(hours / 24);
        return t('webhooks_days_ago', { count: days });
    };

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
                    <span>Webhooks</span>
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
                                navigate(`/sites/${selectedId}/webhooks`);
                            } else {
                                navigate('/webhooks');
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
                        <div className="text-white-dark text-lg">{t('webhooks_please_select')}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                        {/* Left: Webhooks list */}
                        <div className={`panel ${selectedWebhook ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white-light">{t('webhooks_title')}</h5>
                                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>{t('webhooks_add')}</button>
                            </div>
                            <p className="text-white-dark text-sm mb-5">
                                {t('webhooks_description')}
                            </p>

                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('webhooks_col_name')}</th>
                                            <th>{t('webhooks_col_url')}</th>
                                            <th>{t('webhooks_col_auth')}</th>
                                            <th>{t('webhooks_col_hooks')}</th>
                                            <th>{t('webhooks_col_status')}</th>
                                            <th>{t('webhooks_col_last_call')}</th>
                                            <th>{t('webhooks_col_actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {webhookLoading && webhooks.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center text-white-dark">{t('webhooks_loading')}</td>
                                            </tr>
                                        ) : webhooks.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center text-white-dark">{t('webhooks_none')}</td>
                                            </tr>
                                        ) : (
                                            webhooks.map((webhook) => (
                                                <tr
                                                    key={webhook.id}
                                                    className={`cursor-pointer ${selectedWebhook?.id === webhook.id ? 'bg-primary/5' : ''}`}
                                                    onClick={() => selectWebhookForEvents(webhook)}
                                                >
                                                    <td className="font-semibold text-sm">{webhook.name || '-'}</td>
                                                    <td>
                                                        <code className="text-xs bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono">{webhook.endpoint_url}</code>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-dark/10 dark:bg-dark/40 rounded-full text-xs">
                                                            {AUTH_TYPES.find(a => a.value === webhook.auth_type)?.label || webhook.auth_type}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-info/20 text-info rounded-full text-xs">{webhook.events_count || 0}</span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleWebhookToggle(webhook); }}
                                                            className={`badge rounded-full text-xs cursor-pointer ${webhook.active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}
                                                        >
                                                            {webhook.active ? t('webhooks_active') : t('webhooks_inactive')}
                                                        </button>
                                                        {webhook.auto_disabled_at && (
                                                            <span className="badge bg-warning/20 text-warning rounded-full text-xs" title={t('webhooks_auto_disabled', { count: webhook.consecutive_failures })}>
                                                                ⚠ Auto
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-white-dark text-sm">
                                                        {formatTimeAgo(webhook.last_called_at)}
                                                        {webhook.last_status_code && (
                                                            <span className={`ml-2 text-xs ${webhook.last_status_code >= 200 && webhook.last_status_code < 300 ? 'text-success' : 'text-danger'}`}>
                                                                ({webhook.last_status_code})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <button type="button" className="btn btn-outline-primary btn-sm text-xs" onClick={() => openEditModal(webhook)}>{t('webhooks_edit')}</button>
                                                            <button type="button" className="btn btn-outline-danger btn-sm text-xs" onClick={() => handleWebhookDelete(webhook.id)}>{t('webhooks_delete')}</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Modal Webhook */}
                            {showWebhookModal && (
                                <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto flex items-center justify-center" onClick={() => { setShowWebhookModal(false); setWebhookSecret(null); setRegeneratedSecret(null); }}>
                                    <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] px-5 py-3">
                                            <h5 className="font-bold text-lg">{editingWebhook ? t('webhooks_modal_edit') : t('webhooks_modal_add')}</h5>
                                            <button type="button" className="text-white-dark hover:text-dark" onClick={() => { setShowWebhookModal(false); setWebhookSecret(null); setRegeneratedSecret(null); }}>✕</button>
                                        </div>
                                        <div className="p-5">
                                            {webhookSecret ? (
                                                <div>
                                                    <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4">
                                                        <p className="text-success font-semibold mb-1">{t('webhooks_created_success')}</p>
                                                        <p className="text-xs text-white-dark mb-3">{t('webhooks_copy_secret_now')}</p>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <code className="text-sm bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono flex-1 break-all">{webhookSecret}</code>
                                                            <button type="button" className="btn btn-outline-dark btn-sm px-1.5 py-1" onClick={() => copyToClipboard(webhookSecret, 'webhook-secret')}>
                                                                {copied === 'webhook-secret' ? '✓' : '⧉'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-[#f9fafb] dark:bg-[#0e1726] rounded-lg p-4 mb-4 text-xs space-y-2">
                                                        <p className="font-semibold text-white-dark uppercase tracking-wide mb-2">{t('webhooks_headers_title')}</p>
                                                        <div className="space-y-1 font-mono text-[11px]">
                                                            <div><span className="text-primary">X-Rxpress-Signature</span> : <span className="text-warning">sha256=&lt;HMAC-SHA256&gt;</span></div>
                                                            <div><span className="text-primary">X-Rxpress-Timestamp</span> : <span className="text-white-dark">1713000000</span> <span className="text-danger text-[10px]">{t('webhooks_hmac_reject')}</span></div>
                                                            <div><span className="text-primary">X-Rxpress-Delivery</span> : <span className="text-white-dark">uuid</span></div>
                                                        </div>
                                                        <p className="text-white-dark mt-2">{t('webhooks_hmac_calculated')} <code className="bg-dark/10 dark:bg-white/5 px-1 rounded">timestamp + "." + raw_body</code></p>
                                                        <details className="mt-2">
                                                            <summary className="cursor-pointer text-primary">{t('webhooks_verify_example')}</summary>
                                                            <pre className="mt-2 bg-dark/10 dark:bg-white/5 p-2 rounded text-[10px] overflow-x-auto">{`$secret    = 'votre_secret';
$timestamp = $_SERVER['HTTP_X_RXPRESS_TIMESTAMP'];
$body      = file_get_contents('php://input');
$expected  = 'sha256=' . hash_hmac('sha256', $timestamp . '.' . $body, $secret);
$received  = $_SERVER['HTTP_X_RXPRESS_SIGNATURE'];

if (time() - $timestamp > 300) { http_response_code(403); exit; }
if (!hash_equals($expected, $received)) { http_response_code(403); exit; }`}</pre>
                                                        </details>
                                                    </div>
                                                    <button type="button" className="btn btn-primary w-full" onClick={() => { setShowWebhookModal(false); setWebhookSecret(null); }}>{t('close')}</button>
                                                </div>
                                            ) : (
                                                <form onSubmit={(e) => { e.preventDefault(); handleWebhookSubmit(); }}>
                                                    <div className="mb-4">
                                                        <label htmlFor="webhook-name" className="block text-sm font-medium mb-1">{t('webhooks_field_name')}</label>
                                                        <input
                                                            id="webhook-name"
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="Ex: WordPress post events"
                                                            value={webhookForm.name}
                                                            onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="mb-4">
                                                        <label htmlFor="webhook-url" className="block text-sm font-medium mb-1">
                                                            {t('webhooks_field_url')}
                                                            <span className="ml-2 text-[10px] font-normal text-success bg-success/10 px-1.5 py-0.5 rounded">{t('webhooks_https_required')}</span>
                                                        </label>
                                                        <input
                                                            id="webhook-url"
                                                            type="url"
                                                            className={`form-input ${webhookForm.endpoint_url && !webhookForm.endpoint_url.startsWith('https://') ? 'border-danger' : ''}`}
                                                            placeholder="https://monsite.com/webhook"
                                                            value={webhookForm.endpoint_url}
                                                            onChange={(e) => setWebhookForm({ ...webhookForm, endpoint_url: e.target.value })}
                                                            required
                                                        />
                                                        {webhookForm.endpoint_url && !webhookForm.endpoint_url.startsWith('https://') && (
                                                            <p className="text-danger text-xs mt-1">{t('webhooks_url_https_error')}</p>
                                                        )}
                                                    </div>
                                                    <div className="mb-4">
                                                        <label htmlFor="webhook-content-type" className="block text-sm font-medium mb-1">{t('webhooks_field_content_type')}</label>
                                                        <select
                                                            id="webhook-content-type"
                                                            className="form-select"
                                                            value={webhookForm.content_type}
                                                            onChange={(e) => setWebhookForm({ ...webhookForm, content_type: e.target.value })}
                                                        >
                                                            <option value="application/json">application/json</option>
                                                            <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                                                        </select>
                                                    </div>
                                                    <div className="border-t border-white-light dark:border-[#1b2e4b] pt-4 mt-4 mb-4">
                                                        <label className="block text-sm font-semibold mb-1">{t('webhooks_outgoing_auth')}</label>
                                                        <p className="text-xs text-white-dark mb-3">{t('webhooks_outgoing_auth_desc')}</p>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                                                            {AUTH_TYPES.map((authType) => (
                                                                <button
                                                                    key={authType.value}
                                                                    type="button"
                                                                    className={`p-2 rounded-lg border text-xs text-center transition-all ${webhookForm.auth_type === authType.value
                                                                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                                        : 'border-white-light dark:border-[#1b2e4b] text-white-dark hover:border-primary/50'
                                                                        }`}
                                                                    onClick={() => setWebhookForm({ ...webhookForm, auth_type: authType.value, auth_config: {} })}
                                                                >
                                                                    {authType.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {AUTH_TYPE_FIELDS[webhookForm.auth_type]?.length > 0 && (
                                                            <div className="bg-[#f9fafb] dark:bg-[#0e1726] rounded-lg p-4 space-y-3">
                                                                <p className="text-xs text-white-dark mb-2">
                                                                    {webhookForm.auth_type === 'application_password' && t('webhooks_auth_app_password')}
                                                                    {webhookForm.auth_type === 'basic_auth' && t('webhooks_auth_basic')}
                                                                    {webhookForm.auth_type === 'bearer_token' && t('webhooks_auth_bearer')}
                                                                    {webhookForm.auth_type === 'api_key' && t('webhooks_auth_api_key')}
                                                                    {webhookForm.auth_type === 'oauth2' && t('webhooks_auth_oauth2')}
                                                                </p>
                                                                {AUTH_TYPE_FIELDS[webhookForm.auth_type].map((field: AuthField) => {
                                                                    if (field.dependsOn) {
                                                                        const depVal = webhookForm.auth_config[field.dependsOn.key] || 'client_credentials';
                                                                        if (depVal !== field.dependsOn.value) return null;
                                                                    }
                                                                    return (
                                                                        <div key={field.key}>
                                                                            <label htmlFor={`auth-${field.key}`} className="block text-xs font-medium mb-1">{field.label}</label>
                                                                            {field.type === 'select' ? (
                                                                                <select
                                                                                    id={`auth-${field.key}`}
                                                                                    className="form-select text-sm"
                                                                                    value={webhookForm.auth_config[field.key] || field.options?.[0]?.value || ''}
                                                                                    onChange={(e) => setWebhookForm({ ...webhookForm, auth_config: { ...webhookForm.auth_config, [field.key]: e.target.value } })}
                                                                                >
                                                                                    {field.options?.map((opt) => (
                                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                                    ))}
                                                                                </select>
                                                                            ) : (
                                                                                <input
                                                                                    id={`auth-${field.key}`}
                                                                                    type={field.type}
                                                                                    className="form-input text-sm"
                                                                                    placeholder={field.placeholder}
                                                                                    value={webhookForm.auth_config[field.key] || ''}
                                                                                    onChange={(e) => setWebhookForm({ ...webhookForm, auth_config: { ...webhookForm.auth_config, [field.key]: e.target.value } })}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="border-t border-white-light dark:border-[#1b2e4b] pt-4 mb-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <p className="text-sm font-semibold">{t('webhooks_hmac_title')}</p>
                                                                <p className="text-xs text-white-dark">{t('webhooks_hmac_desc')} <code className="bg-dark/10 dark:bg-white/5 px-1 rounded">X-Rxpress-Signature</code>.</p>
                                                            </div>
                                                            {editingWebhook && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-warning btn-sm text-xs shrink-0"
                                                                    onClick={handleRegenerateSecret}
                                                                    disabled={regeneratingSecret}
                                                                >
                                                                    {regeneratingSecret ? '...' : t('webhooks_regen_secret')}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {regeneratedSecret && (
                                                            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-2">
                                                                <p className="text-xs text-warning font-semibold mb-1">{t('webhooks_new_secret')}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <code className="text-xs bg-[#ebedf2] dark:bg-dark/40 px-2 py-1 rounded font-mono flex-1 break-all">{regeneratedSecret}</code>
                                                                    <button type="button" className="btn btn-outline-dark btn-sm px-1.5 py-1" onClick={() => copyToClipboard(regeneratedSecret, 'regen-secret')}>
                                                                        {copied === 'regen-secret' ? '✓' : '⧉'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="bg-[#f9fafb] dark:bg-[#0e1726] rounded-lg p-3 mt-2 text-[11px] font-mono space-y-1">
                                                            <div><span className="text-primary">X-Rxpress-Signature</span> : sha256=&lt;HMAC-SHA256(timestamp.body, secret)&gt;</div>
                                                            <div><span className="text-primary">X-Rxpress-Timestamp</span> : &lt;unix&gt; <span className="text-danger font-sans">(rejeter si &gt; 5 min)</span></div>
                                                            <div><span className="text-primary">X-Rxpress-Delivery</span> : &lt;uuid&gt;</div>
                                                        </div>
                                                    </div>
                                                    <div className="mb-5">
                                                        <label className="flex items-center cursor-pointer">
                                                            <input type="checkbox" className="form-checkbox" checked={webhookForm.active} onChange={(e) => setWebhookForm({ ...webhookForm, active: e.target.checked })} />
                                                            <span className="text-sm ml-2">{t('webhooks_field_active')}</span>
                                                        </label>
                                                    </div>
                                                    <div className="flex justify-end gap-3">
                                                        <button type="button" className="btn btn-outline-danger" onClick={() => { setShowWebhookModal(false); setRegeneratedSecret(null); }}>{t('cancel')}</button>
                                                        <button type="submit" className="btn btn-primary" disabled={webhookLoading || (!!webhookForm.endpoint_url && !webhookForm.endpoint_url.startsWith('https://'))}>
                                                            {webhookLoading ? t('webhooks_form_saving') : editingWebhook ? t('webhooks_form_edit') : t('webhooks_form_create')}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: WordPress Hook Events Panel */}
                        {selectedWebhook && (
                            <div className="panel xl:col-span-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h5 className="font-semibold text-base dark:text-white-light">{t('webhooks_hooks_panel')}</h5>
                                        <p className="text-xs text-white-dark mt-0.5">{selectedWebhook.name || selectedWebhook.endpoint_url}</p>
                                    </div>
                                    <button type="button" className="text-white-dark hover:text-danger text-lg" onClick={() => setSelectedWebhook(null)}>✕</button>
                                </div>
                                <div className="mb-4">
                                    <div className="text-xs font-semibold text-white-dark uppercase mb-2">{t('webhooks_active_hooks', { count: webhookEvents.length })}</div>
                                    {eventsLoading ? (
                                        <div className="text-center text-white-dark text-sm py-3">{t('webhooks_loading')}</div>
                                    ) : webhookEvents.length === 0 ? (
                                        <div className="text-center text-white-dark text-xs py-3 bg-[#f9fafb] dark:bg-[#0e1726] rounded-lg">
                                            {t('webhooks_no_hook_configured')}
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                            {webhookEvents.map((evt) => (
                                                <div key={evt.id} className="flex items-center justify-between bg-[#f9fafb] dark:bg-[#0e1726] rounded-lg px-3 py-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleHookEvent(evt)}
                                                            className={`w-3 h-3 rounded-full shrink-0 ${evt.active ? 'bg-success' : 'bg-danger'}`}
                                                            title={evt.active ? t('webhooks_active') : t('webhooks_inactive')}
                                                        />
                                                        <code className="text-xs font-mono truncate">{evt.hook}</code>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="text-danger hover:text-danger/80 text-xs shrink-0 ml-2"
                                                        onClick={() => removeHookEvent(evt)}
                                                        title={t('delete')}
                                                    >✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-white-light dark:border-[#1b2e4b] pt-4">
                                    <div className="text-xs font-semibold text-white-dark uppercase mb-2">{t('webhooks_hooks_listening', { count: siteHooks.length })}</div>
                                    <p className="text-[10px] text-white-dark mb-3">{t('webhooks_hooks_hint')} <Link to={id ? `/sites/${id}/wp-hooks` : '/wp-hooks'} className="text-primary hover:underline">WP Hooks</Link></p>
                                    {siteHooks.length > 0 && (
                                        <input
                                            type="text"
                                            className="form-input text-xs mb-3"
                                            placeholder={t('webhooks_search_hook')}
                                            value={hookSearch}
                                            onChange={(e) => setHookSearch(e.target.value)}
                                        />
                                    )}
                                    <div className="max-h-[350px] overflow-y-auto space-y-1">
                                        {siteHooks.length === 0 ? (
                                            <div className="text-center text-white-dark text-xs py-4 bg-[#f9fafb] dark:bg-[#0e1726] rounded-lg">
                                                {t('webhooks_no_hooks_listening')}<br />
                                                <Link to={id ? `/sites/${id}/wp-hooks` : '/wp-hooks'} className="text-primary hover:underline mt-1 inline-block">{t('webhooks_activate_hooks')}</Link>
                                            </div>
                                        ) : availableSiteHooks.length === 0 ? (
                                            <div className="text-center text-white-dark text-xs py-3">{t('webhooks_no_hook_found')}</div>
                                        ) : (
                                            availableSiteHooks.map((siteHook) => {
                                                const isSubscribed = subscribedHooks.has(siteHook.hook);
                                                return (
                                                    <button
                                                        key={siteHook.id}
                                                        type="button"
                                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${isSubscribed
                                                            ? 'bg-success/10 text-success cursor-default'
                                                            : 'bg-[#f9fafb] dark:bg-[#0e1726] hover:bg-primary/10 hover:text-primary'
                                                            }`}
                                                        onClick={() => !isSubscribed && addHookEvent(siteHook.hook)}
                                                        disabled={isSubscribed}
                                                    >
                                                        <code className="font-mono text-[11px]">{siteHook.hook}</code>
                                                        {isSubscribed ? (
                                                            <span className="text-[10px]">{t('webhooks_assigned')}</span>
                                                        ) : (
                                                            <span className="text-[10px] text-white-dark">{t('webhooks_assign')}</span>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Webhooks;
