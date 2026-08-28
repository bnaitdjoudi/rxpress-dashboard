import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [errorSubMenu, setErrorSubMenu] = useState(false);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-8 ml-[5px] flex-none" src="/assets/images/logo.svg" alt="logo" />
                            <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline dark:text-white-light">{t('Rxpress')}</span>
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 m-auto">
                                <path d="M13 19L7 12L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            {/* Menu Dashboard non déroulant */}
                            <li className="menu nav-item">
                                <div className="flex items-center px-3 py-2 text-xs uppercase text-gray-400 tracking-wider select-none">
                                    <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.5" d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" fill="currentColor" />
                                        <path d="M9 17.25C8.58579 17.25 8.25 17.5858 8.25 18C8.25 18.4142 8.58579 18.75 9 18.75H15C15.4142 18.75 15.75 18.4142 15.75 18C15.75 17.5858 15.4142 17.25 15 17.25H9Z" fill="currentColor" />
                                    </svg>
                                    {t('dashboard')}
                                </div>
                            </li>
                            <li className="menu nav-item">
                                <NavLink to="/" className="nav-link group w-full before:hidden">
                                    <div className="flex items-center pl-8">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                            <path d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                            <path d="M9 17.25H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                        </svg>
                                        <span className="ltr:pl-2 rtl:pr-2">{t('Overview')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink to="/webhooks" className={({ isActive }) => 'nav-link group w-full before:hidden' + (isActive || location.pathname.includes('/webhooks') ? ' active' : '')}>
                                    <div className="flex items-center pl-8">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                            <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                                            <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                                            <path d="M19 5L21 3M21 3L19 1M21 3H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                        </svg>
                                        <span className="ltr:pl-2 rtl:pr-2">{t('Webhooks')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink to="/wp-hooks" className={({ isActive }) => 'nav-link group w-full before:hidden' + (isActive || location.pathname.includes('/wp-hooks') ? ' active' : '')}>
                                    <div className="flex items-center pl-8">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                            <path d="M10 13.5H3C2.44772 13.5 2 13.0523 2 12.5V3C2 2.44772 2.44772 2 3 2H13.5C14.0523 2 14.5 2.44772 14.5 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                            <path d="M14 22H21C21.5523 22 22 21.5523 22 21V10.5C22 9.94772 21.5523 9.5 21 9.5H10.5C9.94772 9.5 9.5 9.94772 9.5 10.5V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                            <path d="M5 7.5L8 10.5L13.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        </svg>
                                        <span className="ltr:pl-2 rtl:pr-2">{t('WP Hooks')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink to="/wp-events" className={({ isActive }) => 'nav-link group w-full before:hidden' + (isActive ? ' active' : '')}>
                                    <div className="flex items-center pl-8">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        </svg>
                                        <span className="ltr:pl-2 rtl:pr-2">{t('WP Events')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink to="/webhook-deliveries" className={({ isActive }) => 'nav-link group w-full before:hidden' + (isActive ? ' active' : '')}>
                                    <div className="flex items-center pl-8">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                            <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                                            <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                                            <path d="M19 5L21 3M21 3L19 1M21 3H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                        </svg>
                                        <span className="ltr:pl-2 rtl:pr-2">{t('Livraisons')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink to="/sites" end className={({ isActive }) => 'nav-link group w-full before:hidden' + (isActive || (location.pathname.startsWith('/sites') && !location.pathname.includes('/wp-hooks') && !location.pathname.includes('/webhooks')) ? ' active' : '')}>
                                    <div className="flex items-center pl-8">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                            <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                            <path d="M3.5 9H20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                            <path d="M3.5 15H20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                            <path d="M12 3C14.2091 3 16 7.02944 16 12C16 16.9706 14.2091 21 12 21C9.79086 21 8 16.9706 8 12C8 7.02944 9.79086 3 12 3Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                        </svg>
                                        <span className="ltr:pl-2 rtl:pr-2">{t('Sites')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            {/* Menu Compte non déroulant */}
                            <li className="menu nav-item">
                                <div className="flex items-center px-3 py-2 text-xs uppercase text-gray-400 tracking-wider select-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-2"><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M2 21c0-3.866 4.477-7 10-7s10 3.134 10 7" stroke="currentColor" strokeWidth="1.5" /></svg>
                                    {t('nav_account')}
                                </div>
                            </li>
                            <li className="menu nav-item">
                                <NavLink to="/profile" className="nav-link group w-full before:hidden">
                                    <div className="flex items-center pl-8">
                                        <span className="ltr:pl-2 rtl:pr-2">{t('nav_my_profile')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink to="/subscriptions" className="nav-link group w-full before:hidden">
                                    <div className="flex items-center pl-8">
                                        <span className="ltr:pl-2 rtl:pr-2">{t('nav_subscription')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="menu nav-item">
                                <NavLink to="/account/settings" className="nav-link group w-full before:hidden">
                                    <div className="flex items-center pl-8">
                                        <span className="ltr:pl-2 rtl:pr-2">{t('nav_settings')}</span>
                                    </div>
                                </NavLink>
                            </li>


                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav >
        </div >
    );
};

export default Sidebar;
