import { useTheme } from '../ThemeContext';

export default function ThemeToggle() {
    const { dark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-0 p-0.5 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full transition-colors duration-300 shadow-sm"
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
        >
            {/* Sun icon */}
            <span className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${!dark ? 'bg-amber-400 text-white shadow-md scale-105' : 'text-gray-500'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="5" />
                    <path strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
            </span>
            {/* Moon icon */}
            <span className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${dark ? 'bg-brand-600 text-white shadow-md scale-105' : 'text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            </span>
        </button>
    );
}
