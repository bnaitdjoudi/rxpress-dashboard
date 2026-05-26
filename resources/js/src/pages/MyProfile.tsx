import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../store/themeConfigSlice';
import { useEffect, useState } from 'react';
import profileApi, { UserWithProfile, ProfileUpdatePayload } from '../services/profile.service';

const MyProfile = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [user, setUser] = useState<UserWithProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'infos' | 'securite' | 'hestia'>('infos');

    const [form, setForm] = useState<ProfileUpdatePayload>({
        name: '',
        email: '',
        phone: '',
        bio: '',
        address: '',
        city: '',
        country: '',
        postal_code: '',
        company: '',
        website: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        password: '',
        password_confirmation: '',
    });

    const [hestiaForm, setHestiaForm] = useState({
        password: '',
        password_confirmation: '',
    });
    const [hestiaLoading, setHestiaLoading] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Mon Profil'));
        const fetchProfile = async () => {
            try {
                const data = await profileApi.get();
                setUser(data);
                setForm({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.profile?.phone || '',
                    bio: data.profile?.bio || '',
                    address: data.profile?.address || '',
                    city: data.profile?.city || '',
                    country: data.profile?.country || '',
                    postal_code: data.profile?.postal_code || '',
                    company: data.profile?.company || '',
                    website: data.profile?.website || '',
                });
            } catch (e) {
                console.error('Failed to fetch profile', e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleInfosSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess('');
        setError('');
        try {
            const updated = await profileApi.update(form);
            setUser(updated);
            setSuccess(t('profile_update_success'));
        } catch (err: any) {
            setError(err?.message || t('profile_update_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleHestiaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hestiaForm.password !== hestiaForm.password_confirmation) {
            setError(t('profile_pass_mismatch'));
            return;
        }
        setHestiaLoading(true);
        setSuccess('');
        setError('');
        try {
            const res = await profileApi.setHestiaPassword(hestiaForm.password, hestiaForm.password_confirmation);
            setSuccess(res.message);
            setHestiaForm({ password: '', password_confirmation: '' });
        } catch (err: any) {
            setError(err?.message || t('profile_hestia_error'));
        } finally {
            setHestiaLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.password !== passwordForm.password_confirmation) {
            setError(t('profile_pass_mismatch'));
            return;
        }
        setSaving(true);
        setSuccess('');
        setError('');
        try {
            await profileApi.update(passwordForm);
            setSuccess(t('profile_pass_success'));
            setPasswordForm({ password: '', password_confirmation: '' });
        } catch (err: any) {
            setError(err?.message || t('profile_update_error'));
        } finally {
            setSaving(false);
        }
    };

    const field = (key: keyof ProfileUpdatePayload) => ({
        value: (form[key] as string) || '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value })),
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block"></span>
            </div>
        );
    }

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li className=" ltr:before:mr-2 rtl:before:ml-2">
                    <span>{t('profile_title')}</span>
                </li>
            </ul>

            <div className="pt-5">
                {/* En-tête profil */}
                <div className="panel mb-5">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold dark:text-white">{user?.name}</h2>
                            <p className="text-white-dark text-sm">{user?.email}</p>
                            {user?.profile?.company && (
                                <p className="text-white-dark text-sm">{user.profile.company}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <ul className="flex flex-wrap border-b border-white-light dark:border-[#191e3a] mb-5">
                    {([
                        { key: 'infos',    label: t('profile_tab_infos') },
                        { key: 'securite', label: t('profile_tab_security') },
                        { key: 'hestia',   label: t('profile_tab_hestia') },
                    ] as const).map(({ key, label }) => (
                        <li key={key}>
                            <button
                                type="button"
                                className={`p-4 py-3 -mb-[1px] block border-b-2 hover:text-primary ${activeTab === key ? 'border-primary text-primary' : 'border-transparent'}`}
                                onClick={() => { setActiveTab(key); setSuccess(''); setError(''); }}
                            >
                                {label}
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Alertes */}
                {success && (
                    <div className="flex items-center p-3.5 rounded text-success bg-success-light dark:bg-success-dark-light mb-5">
                        <strong className="ltr:mr-1 rtl:ml-1">{t('success_label')}</strong>{success}
                    </div>
                )}
                {error && (
                    <div className="flex items-center p-3.5 rounded text-danger bg-danger-light dark:bg-danger-dark-light mb-5">
                        <strong className="ltr:mr-1 rtl:ml-1">{t('error_label')}</strong>{error}
                    </div>
                )}

                {/* Tab Infos */}
                {activeTab === 'infos' && (
                    <form onSubmit={handleInfosSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="panel">
                                <h5 className="font-semibold text-lg dark:text-white-light mb-5">{t('profile_account')}</h5>
                                <div className="space-y-4">
                                    <div>
                                        <label className="dark:text-white-light text-sm font-medium">{t('profile_name')}</label>
                                        <input type="text" className="form-input mt-1" placeholder="Jean Dupont" {...field('name')} />
                                    </div>
                                    <div>
                                        <label className="dark:text-white-light text-sm font-medium">{t('email')}</label>
                                        <input type="email" className="form-input mt-1" placeholder="jean@exemple.com" {...field('email')} />
                                    </div>
                                    <div>
                                        <label className="dark:text-white-light text-sm font-medium">{t('profile_phone')}</label>
                                        <input type="tel" className="form-input mt-1" placeholder="+33 6 00 00 00 00" {...field('phone')} />
                                    </div>
                                    <div>
                                        <label className="dark:text-white-light text-sm font-medium">{t('profile_company')}</label>
                                        <input type="text" className="form-input mt-1" placeholder="Mon entreprise" {...field('company')} />
                                    </div>
                                    <div>
                                        <label className="dark:text-white-light text-sm font-medium">{t('profile_website')}</label>
                                        <input type="text" className="form-input mt-1" placeholder="https://monsite.com" {...field('website')} />
                                    </div>
                                    <div>
                                        <label className="dark:text-white-light text-sm font-medium">{t('profile_bio')}</label>
                                        <textarea className="form-textarea mt-1" rows={3} placeholder="..." {...field('bio')} />
                                    </div>
                                </div>
                            </div>

                            <div className="panel">
                                <h5 className="font-semibold text-lg dark:text-white-light mb-5">{t('profile_address_section')}</h5>
                                <div className="space-y-4">
                                    <div>
                                        <label className="dark:text-white-light text-sm font-medium">{t('profile_address')}</label>
                                        <input type="text" className="form-input mt-1" placeholder="12 rue de la Paix" {...field('address')} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="dark:text-white-light text-sm font-medium">{t('profile_city')}</label>
                                            <input type="text" className="form-input mt-1" placeholder="Paris" {...field('city')} />
                                        </div>
                                        <div>
                                            <label className="dark:text-white-light text-sm font-medium">{t('profile_postal')}</label>
                                            <input type="text" className="form-input mt-1" placeholder="75000" {...field('postal_code')} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="dark:text-white-light text-sm font-medium">{t('profile_country')}</label>
                                        <input type="text" className="form-input mt-1" placeholder="France" {...field('country')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? t('saving') : t('save')}
                            </button>
                        </div>
                    </form>
                )}

                {/* Tab HestiaCP */}
                {activeTab === 'hestia' && (
                    <div className="panel max-w-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                            <div>
                                <h5 className="font-semibold text-lg dark:text-white-light">{t('profile_hestia_account')}</h5>
                                {user?.hestia_user
                                    ? <p className="text-sm text-white-dark">{t('profile_hestia_id')} <span className="font-mono text-primary">{user.hestia_user}</span></p>
                                    : <p className="text-sm text-danger">{t('profile_no_hestia')}</p>
                                }
                            </div>
                        </div>

                        {user?.hestia_user ? (
                            <form onSubmit={handleHestiaSubmit} className="space-y-4">
                                <div>
                                    <label className="dark:text-white-light text-sm font-medium">{t('profile_hestia_new_pass')}</label>
                                    <input
                                        type="password"
                                        className="form-input mt-1"
                                        placeholder="••••••••"
                                        value={hestiaForm.password}
                                        onChange={e => setHestiaForm(p => ({ ...p, password: e.target.value }))}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div>
                                    <label className="dark:text-white-light text-sm font-medium">{t('profile_confirm_pass')}</label>
                                    <input
                                        type="password"
                                        className="form-input mt-1"
                                        placeholder="••••••••"
                                        value={hestiaForm.password_confirmation}
                                        onChange={e => setHestiaForm(p => ({ ...p, password_confirmation: e.target.value }))}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <button type="submit" className="btn btn-warning" disabled={hestiaLoading}>
                                    {hestiaLoading ? t('profile_hestia_updating') : t('profile_hestia_update_btn')}
                                </button>
                            </form>
                        ) : (
                            <p className="text-sm text-white-dark">
                                {t('profile_hestia_auto_create')}
                            </p>
                        )}
                    </div>
                )}

                {/* Tab Sécurité */}
                {activeTab === 'securite' && (
                    <div className="panel max-w-lg">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-5">{t('profile_change_pass')}</h5>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="dark:text-white-light text-sm font-medium">{t('profile_new_pass')}</label>
                                <input
                                    type="password"
                                    className="form-input mt-1"
                                    placeholder="••••••••"
                                    value={passwordForm.password}
                                    onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div>
                                <label className="dark:text-white-light text-sm font-medium">{t('profile_confirm_pass')}</label>
                                <input
                                    type="password"
                                    className="form-input mt-1"
                                    placeholder="••••••••"
                                    value={passwordForm.password_confirmation}
                                    onChange={e => setPasswordForm(p => ({ ...p, password_confirmation: e.target.value }))}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? t('updating') : t('profile_update_pass_btn')}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProfile;
