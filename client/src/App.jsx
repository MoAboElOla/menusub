import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './i18n';
import Landing from './pages/Landing';
import Assets from './pages/Assets';
import Menu from './pages/Menu';
import Location from './pages/Location';
import Review from './pages/Review';
import Success from './pages/Success';
import Admin from './pages/Admin';

function LanguageSwitcher() {
    const { t, toggleLang, isRtl } = useLanguage();
    return (
        <button
            onClick={toggleLang}
            className="fixed top-4 z-50 px-3 py-1.5 bg-[#181924] border border-gray-700/50 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:border-brand-500/50 transition-all"
            style={{ [isRtl ? 'left' : 'right']: '1rem' }}
        >
            {t('langSwitch')}
        </button>
    );
}

function AppRoutes() {
    return (
        <div className="min-h-screen bg-[#0f1117]">
            <LanguageSwitcher />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/submit/assets" element={<Assets />} />
                <Route path="/submit/menu" element={<Menu />} />
                <Route path="/submit/location" element={<Location />} />
                <Route path="/submit/review" element={<Review />} />
                <Route path="/submit/success" element={<Success />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <LanguageProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </LanguageProvider>
    );
}

export default App;
