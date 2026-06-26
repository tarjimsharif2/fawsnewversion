import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ScrapeResponse } from './types';
import Home from './components/Home';
import MatchPage from './components/MatchPage';
import ServerStreamPage from './components/ServerStreamPage';

import { ErrorBoundary } from './ErrorBoundary';

const useCurrentTime = () => {
    const [time, setTime] = useState(Date.now());
    useEffect(() => {
      const i = setInterval(() => setTime(Date.now()), 1000);
      return () => clearInterval(i);
    }, []);
    return time;
};

export default function App() {
  const [data, setData] = useState<ScrapeResponse>({ lastScraped: null, matches: [] });
  const [loading, setLoading] = useState(true);
  
  // Home states
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const [activeBottomNav, setActiveBottomNav] = useState('Home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentTime = useCurrentTime();

  const fetchMatches = async (silent = false) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/matches`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText || 'Server Error'}`);
      }
      const json = await res.json();
      if (json.error || !json.matches) {
         throw new Error(json.error || 'Invalid API Response');
      }
      setData(json);
    } catch (error: any) {
      setData(prev => ({
        ...prev,
        error: error.message || 'Network error occurred while fetching matches.',
        matches: prev.matches || []
      }));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // Auto-refresh every 30 seconds for instant updates
    const interval = setInterval(() => {
        fetchMatches(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualScrape = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await fetch(`${apiUrl}/api/scrape`, { method: 'POST' });
      await fetchMatches();
    } catch (error) {
      // Ignored
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Routes>
         <Route path="/" element={
             <Home 
                data={data}
                loading={loading}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                activeLeague={activeLeague}
                setActiveLeague={setActiveLeague}
                activeBottomNav={activeBottomNav}
                setActiveBottomNav={setActiveBottomNav}
                handleManualScrape={handleManualScrape}
                currentTime={currentTime}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
             />
         } />
         <Route path="/:matchSlug" element={<MatchPage data={data} loading={loading} currentTime={currentTime} />} />
         <Route path="/:matchSlug/:serverSlug" element={<ServerStreamPage data={data} loading={loading} />} />
         <Route path="*" element={<div className="min-h-screen bg-black text-white flex items-center justify-center text-xl font-bold">404: Page Not Found</div>} />
      </Routes>
    </ErrorBoundary>
  );
}
