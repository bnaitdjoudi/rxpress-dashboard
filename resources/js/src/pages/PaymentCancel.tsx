import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PaymentCancel = () => {
    const { t } = useTranslation();
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#060818] px-4">
            <div className="panel max-w-md w-full text-center space-y-6 py-10 px-8">
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-danger" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-danger mb-2">{t('payment_cancel_title')}</h1>
                    <p className="text-white-dark text-sm">
                        {t('payment_cancel_desc')}
                    </p>
                </div>
                <Link to="/subscriptions" className="btn btn-outline-primary w-full">
                    {t('payment_cancel_back')}
                </Link>
            </div>
        </div>
    );
};

export default PaymentCancel;
