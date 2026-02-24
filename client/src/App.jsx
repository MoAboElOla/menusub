import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './i18n';
import { ThemeProvider } from './ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Landing from './pages/Landing';
import Assets from './pages/Assets';
import Menu from './pages/Menu';
import Location from './pages/Location';
import Review from './pages/Review';
import Success from './pages/Success';
import Admin from './pages/Admin';

function TopBar() {
    const { t, toggleLang, isRtl } = useLanguage();
    return (
        <div
            className="fixed top-4 z-50 flex items-center gap-2"
            style={{ [isRtl ? 'left' : 'right']: '1rem' }}
        >
            <ThemeToggle />
            <button
                onClick={toggleLang}
                className="px-3 py-1.5 bg-gray-200 dark:bg-[#181924] border border-gray-300 dark:border-gray-700/50 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white hover:border-brand-500/50 transition-all"
            >
                {t('langSwitch')}
            </button>
        </div>
    );
}

function AppRoutes() {
    return (
        <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f1117] transition-colors duration-300">
            <TopBar />
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
        <ThemeProvider>
            <LanguageProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </LanguageProvider>
        </ThemeProvider>
    );
}

export default App;
