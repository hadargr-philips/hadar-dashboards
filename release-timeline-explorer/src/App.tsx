import React, { useEffect, useState } from 'react';
import HomePage from './components/HomePage';
import GanttPage from './components/GanttPage';
import AdminPage from './components/AdminPage';

type Page = 'home' | 'gantt';

export default function App() {
  const [page,    setPage]    = useState<Page>('home');
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin');

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setIsAdmin(true);
      } else if (hash === '#gantt') {
        setPage('gantt');
        setIsAdmin(false);
      } else {
        setIsAdmin(false);
        setPage('home');
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goAdmin = () => {
    window.location.hash = '#admin';
    setIsAdmin(true);
  };

  const closeAdmin = () => {
    history.pushState('', document.title, window.location.pathname + window.location.search);
    setIsAdmin(false);
  };

  const goGantt = () => {
    window.location.hash = '#gantt';
    setPage('gantt');
    setIsAdmin(false);
  };

  const goHome = () => {
    history.pushState('', document.title, window.location.pathname + window.location.search);
    setPage('home');
    setIsAdmin(false);
  };

  if (isAdmin) {
    return <AdminPage onClose={closeAdmin} />;
  }

  return (
    <>
      {page === 'home' && <HomePage onCreateTimeline={goGantt} onAdmin={goAdmin} />}
      {page === 'gantt' && <GanttPage onBack={goHome} onAdmin={goAdmin} />}
    </>
  );
}
