import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setPageTitle } from '../store/themeConfigSlice';
import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { subscriptionApi, SubscriptionData } from '../services/subscription.service';
import { planApi, PlanData } from '../services/plan.service';
import { paymentApi } from '../services/payment.service';

const Subscription = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [upgradeModal, setUpgradeModal] = useState(false);
    const [upgradePlans, setUpgradePlans] = useState<PlanData[]>([]);
    const [upgradeStep, setUpgradeStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Abonnement'));
        subscriptionApi.get().then((data) => {
            setSubscription(data);
        }).catch((e) => console.error('Failed to fetch subscription', e));
    }, []);

    const handleUpgrade = async () => {
        const currentGrade = subscription?.plan?.grade ?? 0;
        const plans = await planApi.getUpgrades(currentGrade);
        setUpgradePlans(plans);
        setUpgradeModal(true);
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">
                        Subscription
                    </Link>
                </li>
            </ul>

            <div className="pt-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informations abonnement */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">{t('sub_info')}</h5>
                            <span className={`badge rounded-full ${subscription?.status === 'active' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                {subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : ''}
                            </span>
                        </div>

                        <div className="border-t border-white-light dark:border-[#1b2e4b] pt-4 mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-white-dark text-xs mb-1">{t('sub_start')}</div>
                                <div className="font-semibold">
                                    {subscription?.start_date ? new Date(subscription.start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-white-dark text-xs mb-1">{t('sub_renewal')}</div>
                                <div className="font-semibold">
                                    {subscription?.renewal_date
                                        ? new Date(subscription.renewal_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
                                        : t('sub_no_subscription')}
                                </div>
                            </div>
                            <div>
                                <div className="text-white-dark text-xs mb-1">{t('sub_plan')}</div>
                                <div className="font-semibold">{subscription?.plan?.nom ?? '-'}</div>
                            </div>
                            <div>
                                <div className="text-white-dark text-xs mb-1">{t('sub_price')}</div>
                                <div className="font-semibold">
                                    {subscription?.price
                                        ? `${subscription.price.montant} ${subscription.price.devise} / ${subscription.price.period}`
                                        : '-'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-6">
                            <button type="button" className="btn btn-primary" onClick={handleUpgrade}>
                                Upgrade
                            </button>
                            <button type="button" className="btn btn-outline-danger" onClick={() => navigate('/')}>
                                {t('back')}
                            </button>
                        </div>
                    </div>

                    {/* Statistiques hébergement */}
                    <div className="panel">
                        <div className="mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">{t('sub_usage')}</h5>
                        </div>
                        <div className="space-y-5">
                            {/* Stockage */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-white-dark text-sm">{t('sub_storage')}</div>
                                    <div className="text-sm font-semibold">
                                        {subscription?.storage
                                            ? `${subscription.storage.used} ${subscription.storage.unit} / ${subscription.storage.limit} ${subscription.storage.unit}`
                                            : '-'}
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-[#ebedf2] dark:bg-dark/40 rounded-full">
                                    <div
                                        className="bg-primary h-full rounded-full"
                                        style={{
                                            width: subscription?.storage
                                                ? `${Math.min((subscription.storage.used / subscription.storage.limit) * 100, 100)}%`
                                                : '0%',
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Bande passante */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-white-dark text-sm">{t('sub_bandwidth')}</div>
                                    <div className="text-sm font-semibold">
                                        {subscription?.bandwidth
                                            ? `${subscription.bandwidth.used} ${subscription.bandwidth.unit} / ${subscription.bandwidth.limit} ${subscription.bandwidth.unit}`
                                            : '-'}
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-[#ebedf2] dark:bg-dark/40 rounded-full">
                                    <div
                                        className="bg-success h-full rounded-full"
                                        style={{
                                            width: subscription?.bandwidth
                                                ? `${Math.min((subscription.bandwidth.used / subscription.bandwidth.limit) * 100, 100)}%`
                                                : '0%',
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Grille de stats */}
                            <div className="grid grid-cols-2 gap-4 border-t border-white-light dark:border-[#1b2e4b] pt-4">
                                <div className="rounded-md border border-white-light dark:border-[#1b2e4b] p-3">
                                    <div className="text-white-dark text-xs mb-1">{t('sub_visits')}</div>
                                    <div className="text-xl font-bold text-primary">
                                        {subscription?.visits
                                            ? `${subscription.visits.used.toLocaleString()} / ${subscription.visits.limit.toLocaleString()}`
                                            : '-'}
                                    </div>
                                </div>
                                <div className="rounded-md border border-white-light dark:border-[#1b2e4b] p-3">
                                    <div className="text-white-dark text-xs mb-1">{t('sub_events')}</div>
                                    <div className="text-xl font-bold text-success">
                                        {subscription?.hooks
                                            ? `${subscription.hooks.used.toLocaleString()} / ${subscription.hooks.limit.toLocaleString()}`
                                            : '-'}
                                    </div>
                                </div>
                                <div className="rounded-md border border-white-light dark:border-[#1b2e4b] p-3">
                                    <div className="text-white-dark text-xs mb-1">{t('sub_sites')}</div>
                                    <div className="text-xl font-bold text-info">
                                        {subscription?.sites
                                            ? `${subscription.sites.used} / ${subscription.sites.limit}`
                                            : '-'}
                                    </div>
                                </div>
                                <div className="rounded-md border border-white-light dark:border-[#1b2e4b] p-3">
                                    <div className="text-white-dark text-xs mb-1">{t('sub_ftp')}</div>
                                    <div className="text-xl font-bold text-warning">
                                        {subscription?.ftp
                                            ? `${subscription.ftp.used} / ${subscription.ftp.limit}`
                                            : '-'}
                                    </div>
                                </div>
                                <div className="rounded-md border border-white-light dark:border-[#1b2e4b] p-3">
                                    <div className="text-white-dark text-xs mb-1">Webhooks</div>
                                    <div className="text-xl font-bold text-success">
                                        {subscription?.webhooks
                                            ? `${subscription.webhooks.used} / ${subscription.webhooks.limit}`
                                            : '-'}
                                    </div>
                                </div>
                                <div className="rounded-md border border-white-light dark:border-[#1b2e4b] p-3">
                                    <div className="text-white-dark text-xs mb-1">{t('sub_queues')}</div>
                                    <div className="text-xl font-bold text-success">
                                        {subscription?.queue
                                            ? `${subscription.queue.used} / ${subscription.queue.limit}`
                                            : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Upgrade */}
            <Transition appear show={upgradeModal} as={Fragment}>
                <Dialog as="div" open={upgradeModal} onClose={() => setUpgradeModal(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                        leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
                        <div className="flex min-h-screen items-start justify-center px-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel my-8 w-full max-w-2xl overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <div className="text-lg font-bold">Upgrade</div>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => { setUpgradeModal(false); setUpgradeStep(1); setSelectedPlan(null); }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="p-5">
                                        <ul className="mb-6 grid grid-cols-2 text-center">
                                            <li>
                                                <div className={`rounded-full p-2.5 text-sm font-semibold cursor-pointer ${upgradeStep === 1 ? 'bg-primary text-white' : 'bg-[#f3f2ee] dark:bg-[#1b2e4b] text-white-dark'}`}
                                                    onClick={() => upgradeStep === 2 && setUpgradeStep(1)}>
                                                    {t('sub_step1')}
                                                </div>
                                            </li>
                                            <li>
                                                <div className={`rounded-full p-2.5 text-sm font-semibold ${upgradeStep === 2 ? 'bg-primary text-white' : 'bg-[#f3f2ee] dark:bg-[#1b2e4b] text-white-dark'}`}>
                                                    {t('sub_step2')}
                                                </div>
                                            </li>
                                        </ul>

                                        {/* Étape 1 */}
                                        {upgradeStep === 1 && (
                                            upgradePlans.length === 0 ? (
                                                <p className="text-center text-white-dark py-6">{t('sub_highest_plan')}</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {upgradePlans.map((plan) => (
                                                        <div key={plan.id} className="border border-white-light dark:border-[#1b2e4b] rounded-lg p-4 flex flex-col gap-2">
                                                            <div className="flex items-center justify-between">
                                                                <h6 className="font-bold text-base">{plan.nom}</h6>
                                                                {(() => {
                                                                    const mensuel = plan.prices.find(p => p.period === 'mensuel');
                                                                    const annuel = plan.prices.find(p => p.period === 'annuel');
                                                                    const price = mensuel ?? annuel;
                                                                    if (!price) return null;
                                                                    const monthly = price.period === 'annuel'
                                                                        ? (parseFloat(price.montant) / 12).toFixed(2)
                                                                        : parseFloat(price.montant).toFixed(2);
                                                                    return <span className="font-bold text-primary">{monthly} {price.devise}<span className="text-white-dark text-xs font-normal">/{t('sub_per_month')}</span></span>;
                                                                })()}
                                                            </div>
                                                            <p className="text-white-dark text-sm">{plan.description}</p>
                                                            <div className="mt-2 space-y-2">
                                                                {plan.prices.map((price) => (
                                                                    <div key={price.id} className="rounded-md border border-white-light dark:border-[#1b2e4b] p-2 text-sm">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-white-dark capitalize">
                                                                                {price.frequence === 'annuel' ? t('sub_annual_payment') : price.frequence === 'mensuel' ? t('sub_monthly_payment') : price.frequence}
                                                                            </span>
                                                                            <span className="font-semibold">
                                                                                {(parseFloat(price.montant) * 12).toFixed(2)} {price.devise}
                                                                                <span className="text-white-dark text-xs font-normal"> / {t('sub_per_year')}</span>
                                                                            </span>
                                                                        </div>
                                                                        {price.frequence === 'annuel' && (
                                                                            <div className="mt-1 text-xs text-warning">{t('sub_annual_commitment')}</div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <button type="button" className="btn btn-primary btn-sm mt-3 w-full" onClick={() => { setSelectedPlan(plan); setUpgradeStep(2); }}>
                                                                {t('sub_choose_plan')}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}

                                        {/* Étape 2 — Récapitulatif */}
                                        {upgradeStep === 2 && selectedPlan && (() => {
                                            const price = selectedPlan.prices[0];
                                            const newAnnualTotal = price ? parseFloat(price.montant) * 12 : 0;
                                            const monthly = price
                                                ? (price.period === 'annuel' ? (parseFloat(price.montant) / 12).toFixed(2) : parseFloat(price.montant).toFixed(2))
                                                : '—';

                                            let prorataCredit = 0;
                                            let prorataJoursRestants = 0;
                                            let prorataJoursTotal = 0;
                                            if (subscription?.start_date && subscription?.renewal_date && subscription?.price) {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const start = new Date(subscription.start_date);
                                                start.setHours(0, 0, 0, 0);
                                                const end = new Date(subscription.renewal_date);
                                                end.setHours(0, 0, 0, 0);
                                                const currentAnnualPrice = parseFloat(subscription.price.montant) * 12;
                                                prorataJoursTotal = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                prorataJoursRestants = Math.max(0, Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                                                if (prorataJoursTotal > 0) {
                                                    prorataCredit = (prorataJoursRestants / prorataJoursTotal) * currentAnnualPrice;
                                                }
                                            }

                                            const finalTotal = Math.max(0, newAnnualTotal - prorataCredit);
                                            const devise = price?.devise ?? '';

                                            return (
                                                <div className="space-y-4">
                                                    <h6 className="font-semibold text-base mb-2">{t('sub_order_summary')}</h6>
                                                    <div className="rounded-lg border border-white-light dark:border-[#1b2e4b] divide-y divide-white-light dark:divide-[#1b2e4b]">
                                                        <div className="flex items-center justify-between px-4 py-3">
                                                            <span className="text-white-dark text-sm">{t('sub_plan')}</span>
                                                            <span className="font-semibold">{selectedPlan.nom}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-4 py-3">
                                                            <span className="text-white-dark text-sm">{t('sub_price_month')}</span>
                                                            <span className="font-semibold">{monthly} {devise}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-4 py-3">
                                                            <span className="text-white-dark text-sm">{t('sub_frequency')}</span>
                                                            <span className="font-semibold capitalize">{price?.frequence === 'annuel' ? t('sub_annual') : t('sub_monthly')}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between px-4 py-3">
                                                            <span className="text-white-dark text-sm">{t('sub_subtotal')}</span>
                                                            <span className="font-semibold">{newAnnualTotal.toFixed(2)} {devise}<span className="text-white-dark text-xs font-normal"> / {t('sub_per_year')}</span></span>
                                                        </div>
                                                        {prorataCredit > 0 && (
                                                            <div className="flex flex-col px-4 py-3 bg-success/5">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-success text-sm font-medium">{t('sub_prorata')}</span>
                                                                    <span className="font-semibold text-success">− {prorataCredit.toFixed(2)} {subscription?.price?.devise}</span>
                                                                </div>
                                                                <div className="text-xs text-white-dark mt-1">
                                                                    {t('sub_days_left', { remaining: prorataJoursRestants, total: prorataJoursTotal, planName: subscription?.plan?.nom })}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between px-4 py-3 bg-[#f8f8f8] dark:bg-[#0e1726] rounded-b-lg">
                                                            <span className="font-bold">{t('sub_total')}</span>
                                                            <span className="font-bold text-primary text-lg">{finalTotal.toFixed(2)} {devise}<span className="text-white-dark text-xs font-normal"> / {t('sub_per_year')}</span></span>
                                                        </div>
                                                    </div>
                                                    {price?.frequence === 'annuel' && (
                                                        <div className="text-xs text-warning">{t('sub_annual_commitment')}</div>
                                                    )}
                                                    {paymentError && (
                                                        <div className="text-xs text-danger">{paymentError}</div>
                                                    )}
                                                    <div className="flex items-center justify-between mt-4">
                                                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setUpgradeStep(1)} disabled={paymentLoading}>
                                                            {t('back')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-success"
                                                            disabled={paymentLoading}
                                                            onClick={async () => {
                                                                if (!price) return;
                                                                setPaymentLoading(true);
                                                                setPaymentError('');
                                                                try {
                                                                    const { url } = await paymentApi.createCheckoutSession({
                                                                        plan_id: selectedPlan.id,
                                                                        price_id: price.id,
                                                                        prorata_credit: prorataCredit > 0 ? prorataCredit : undefined,
                                                                    });
                                                                    window.location.href = url;
                                                                } catch {
                                                                    setPaymentError(t('sub_payment_error'));
                                                                    setPaymentLoading(false);
                                                                }
                                                            }}
                                                        >
                                                            {paymentLoading ? t('sub_redirecting') : t('sub_pay')}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default Subscription;
