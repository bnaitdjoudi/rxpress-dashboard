import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import themeConfig from './theme.config';

const RTL_LANGS = ['ar', 'ae', 'he', 'fa', 'ur'];

const applyDirection = (lang: string) => {
    const isRtl = RTL_LANGS.includes(lang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
};

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: themeConfig.locale || 'en',
        debug: false,
        load: 'languageOnly',
    });

i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language || themeConfig.locale || 'en');

export default i18n;
