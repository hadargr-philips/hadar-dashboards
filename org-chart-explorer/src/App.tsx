import React from 'react';
import { Moon, Sun, Network } from 'lucide-react';
import { useEmployeeStore } from './store/useEmployeeStore';
import HomePage from './components/HomePage';
import OrgChartPage from './components/OrgChartPage';

function Header() {
  const { currentPage, darkMode, toggleDarkMode, goHome } = useEmployeeStore(s => ({
    currentPage: s.currentPage,
    darkMode: s.darkMode,
    toggleDarkMode: s.toggleDarkMode,
    goHome: s.goHome,
  }));

  // Don't show the shared header on the org chart page (it has its own)
  if (currentPage === 'orgchart') return null;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3
                       bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
                       border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <button
        onClick={goHome}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
      >
        <div className="p-1.5 rounded-lg bg-blue-600 group-hover:bg-blue-700 transition-colors">
          <Network className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm hidden sm:inline">Philips R&amp;D Org Chart</span>
      </button>

      <button
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className="p-2 rounded-full text-gray-500 dark:text-gray-400
                   hover:bg-gray-100 dark:hover:bg-gray-800
                   hover:text-gray-700 dark:hover:text-gray-200 transition-all"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
}

export default function App() {
  const { currentPage, darkMode, toggleDarkMode } = useEmployeeStore(s => ({
    currentPage: s.currentPage,
    darkMode: s.darkMode,
    toggleDarkMode: s.toggleDarkMode,
  }));

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen`}>
      {/* Dark mode toggle available on org chart page too */}
      {currentPage === 'orgchart' && (
        <div className="fixed bottom-4 right-4 z-50">
          {/* Dark mode handled in OrgChartPage header */}
        </div>
      )}

      <Header />

      {currentPage === 'home' && <HomePage />}
      {currentPage === 'orgchart' && <OrgChartPage />}

      {/* Dark mode floating button on org chart page */}
      {currentPage === 'orgchart' && (
        <button
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="fixed bottom-20 right-4 z-50 p-2.5 rounded-full shadow-lg
                     bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                     hover:shadow-xl transition-all"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
