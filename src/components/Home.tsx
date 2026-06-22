import React, { useMemo } from 'react';
import { Tv, Play, Share2, Server, ArrowLeft, MoreHorizontal, Trophy, Pin, RefreshCw, Menu, Radio, X } from 'lucide-react';
import { Match, ScrapeResponse } from '../types';
import { getMatchTimeStatus } from './shared';
import { getMatchSlug } from '../utils';
import { Link } from 'react-router-dom';

export default function Home({
  data,
  loading,
  activeFilter,
  setActiveFilter,
  activeLeague,
  setActiveLeague,
  activeBottomNav,
  setActiveBottomNav,
  handleManualScrape,
  currentTime,
  isMenuOpen,
  setIsMenuOpen
}: any) {
  const filteredMatches = useMemo(() => {
    return data.matches.filter((m: any) => {
      if (activeBottomNav === 'Live' && !m.isLive) return false;
      
      if (activeFilter !== 'All') {
          const sport = (m.sport || '').toLowerCase();
          const filter = activeFilter.toLowerCase();
          
          let matchesFilter = false;
          if (filter === 'nba') {
             matchesFilter = sport.includes('nba') || sport.includes('basket');
          } else if (filter === 'mlb') {
             matchesFilter = sport.includes('mlb') || sport.includes('base');
          } else {
             matchesFilter = sport.includes(filter);
          }
          
          if (!matchesFilter) return false;
      }

      if (activeLeague && m.competition !== activeLeague) return false;
      return true;
    });
  }, [data.matches, activeBottomNav, activeFilter, activeLeague]);

  const getLeagues = () => {
    const leaguesMap = new Map<string, number>();
    data.matches.forEach((m: any) => {
       const comp = m.competition || 'Other';
       leaguesMap.set(comp, (leaguesMap.get(comp) || 0) + 1);
    });
    return Array.from(leaguesMap.entries()).sort((a,b) => b[1] - a[1]);
  };

  if (!loading && data.matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-200 font-sans p-6 md:p-12 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-2 text-white">No Streams found</h1>
        {data.error && (
          <p className="text-red-400 bg-red-950/20 border border-red-500/20 px-4 py-2 rounded-lg text-xs max-w-md text-center mb-6 font-mono">
            Error: {data.error}
          </p>
        )}
        <button onClick={handleManualScrape} className="px-6 py-2 bg-purple-600 rounded-full hover:bg-purple-700 transition font-medium mt-2">Refresh</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080c] text-slate-200 font-sans pb-20">
      <header className="sticky top-0 z-50 bg-[#06080c]/90 backdrop-blur border-b border-purple-500/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter flex items-center">
            <span className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white mr-1 shadow shadow-red-600/50">
              <Tv className="w-5 h-5 absolute opacity-30" />
              <span className="z-10 italic">e</span>
            </span>
            <span className="text-emerald-700">Play</span>
            <span className="bg-red-600 text-white text-sm px-1 py-0.5 ml-1 rounded">HD</span>
          </span>
        </div>
        
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-400 hover:text-white transition">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute top-0 right-0 w-64 h-full bg-[#0c0f17] border-l border-white/10 p-5 shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-black text-white">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
               <button onClick={() => { setIsMenuOpen(false); setActiveBottomNav('Home'); setActiveFilter('All'); setActiveLeague(null); }} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white text-left font-medium">
                  <Tv className="w-5 h-5" /> Home
               </button>
               <button onClick={() => { setIsMenuOpen(false); setActiveBottomNav('Live'); setActiveLeague(null); }} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white text-left font-medium">
                  <Radio className="w-5 h-5" /> Live Matches
               </button>
               <button onClick={() => { setIsMenuOpen(false); setActiveBottomNav('Channels'); setActiveLeague(null); }} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white text-left font-medium">
                  <Play className="w-5 h-5" /> Channels
               </button>
               <button onClick={() => { setIsMenuOpen(false); setActiveBottomNav('Leagues'); setActiveLeague(null); }} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white text-left font-medium">
                  <Trophy className="w-5 h-5" /> Leagues
               </button>
            </div>
            
            <div className="mt-8 border-t border-white/10 pt-6">
              <button onClick={() => { setIsMenuOpen(false); handleManualScrape(); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg bg-white/5 hover:bg-white/10 transition text-slate-300 hover:text-white text-left font-medium">
                 <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> Force Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-4">
        {activeBottomNav === 'Channels' ? (
           <div className="flex flex-col items-center justify-center p-12 text-slate-500 min-h-[40vh]">
             <Tv className="w-16 h-16 mb-4 opacity-20" />
             <h2 className="text-xl font-bold text-white mb-2">Live Channels</h2>
             <p className="text-center text-sm max-w-xs">No independent channels available right now. Please watch the designated matches.</p>
           </div>
        ) : activeBottomNav === 'Leagues' ? (
           <div className="space-y-4">
             <h2 className="text-xl font-bold text-white mb-6">Competitions</h2>
             <div className="grid gap-3">
                {getLeagues().map(([league, count]) => (
                   <button 
                     key={league}
                     onClick={() => {
                        setActiveFilter('All');
                        setActiveLeague(league);
                        setActiveBottomNav('Home');
                     }}
                     className="flex items-center justify-between p-4 bg-[#121622] rounded-xl border border-white/[0.05] hover:border-purple-500/30 transition shadow-lg group text-left"
                   >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                          <Trophy className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="font-bold text-white group-hover:text-purple-300 transition">{league}</span>
                     </div>
                     <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400">
                       {count} Matches
                     </span>
                   </button>
                ))}
             </div>
           </div>
        ) : (
          <div className="space-y-6">
            {activeLeague && (
              <div className="flex items-center justify-between bg-purple-900/20 border border-purple-500/20 p-4 rounded-xl">
                 <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">{activeLeague}</h2>
                 </div>
                 <button onClick={() => setActiveLeague(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition">
                    <X className="w-4 h-4 text-slate-400" />
                 </button>
              </div>
            )}
            <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-1 ${activeLeague ? 'opacity-50 pointer-events-none' : ''}`}>
              {['All', 'Football', 'Cricket', 'MLB', 'NBA'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)} 
                  className={`px-5 py-2 whitespace-nowrap rounded-lg font-bold text-sm transition ${activeFilter === filter ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {filteredMatches.map((match: any) => {
                const matchSlug = getMatchSlug(match.homeTeam, match.awayTeam);
                return (
                <Link
                  to={`/${matchSlug}`}
                  key={match.id} 
                  className="block bg-[#121622] rounded-xl p-4 border border-white/[0.05] cursor-pointer hover:border-purple-500/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/5 group flex flex-col"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2 items-center">
                      {(() => {
                         const matchStatus = getMatchTimeStatus(match, currentTime);
                         if (matchStatus.type === 'live') {
                           return (
                             <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[11px] font-bold tracking-widest uppercase">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live
                             </span>
                           );
                         } else if (matchStatus.type === 'finished') {
                           return (
                             <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-full text-[10px] font-bold uppercase whitespace-nowrap">
                                FINISHED
                             </span>
                           );
                         } else {
                           return (
                             <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold uppercase whitespace-nowrap">
                                {matchStatus.text}
                             </span>
                           );
                         }
                      })()}
                      
                      <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[11px] font-medium tracking-wide">
                        {match.sport}
                      </span>
                    </div>

                    {match.isPinned && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                        <Pin className="w-3.5 h-3.5 fill-yellow-500" /> Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-2 sm:px-6 mb-8 mt-2 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] flex items-center justify-center text-slate-500 font-black text-sm tracking-widest">
                       VS
                    </div>

                    <div className="flex flex-col items-center gap-3 z-10 flex-1">
                      {match.homeLogo ? (
                        <div className="w-16 h-16 bg-[#181d29] rounded-2xl p-3 shadow-inner border border-white/5 flex items-center justify-center">
                           <img src={match.homeLogo} alt={match.homeTeam} referrerPolicy="no-referrer" className="w-full h-full object-contain drop-shadow" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#181d29] border border-white/5 flex items-center justify-center font-bold text-xl text-white">{match.homeTeam.charAt(0)}</div>
                      )}
                      <span className="font-bold text-sm text-center max-w-[120px] truncate text-white group-hover:text-purple-400 transition-colors">{match.homeTeam}</span>
                    </div>

                    <div className="flex flex-col items-center gap-3 z-10 flex-1">
                      {match.awayLogo ? (
                        <div className="w-16 h-16 bg-[#181d29] rounded-2xl p-3 shadow-inner border border-white/5 flex items-center justify-center">
                           <img src={match.awayLogo} alt={match.awayTeam} referrerPolicy="no-referrer" className="w-full h-full object-contain drop-shadow" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#181d29] border border-white/5 flex items-center justify-center font-bold text-xl text-white">{match.awayTeam.charAt(0)}</div>
                      )}
                      <span className="font-bold text-sm text-center max-w-[120px] truncate text-white group-hover:text-purple-400 transition-colors">{match.awayTeam}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/5 pb-1">
                    <span className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Trophy className="w-3.5 h-3.5" />
                      {match.competition}
                    </span>
                    
                    <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-xs text-slate-300 font-bold border border-white/5">
                       <Server className="w-3.5 h-3.5 text-purple-400" />
                       {match.servers.length}
                    </span>
                  </div>
                </Link>
              )})}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0c0f17] border-t border-white/5 py-3 px-6 flex justify-between items-center z-50 pb-safe">
        <button 
          onClick={() => { setActiveBottomNav('Home'); setActiveFilter('All'); setActiveLeague(null); }}
          className={`flex flex-col items-center gap-1.5 transition ${activeBottomNav === 'Home' ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => { setActiveBottomNav('Live'); setActiveLeague(null); }}
          className={`flex flex-col items-center gap-1.5 transition ${activeBottomNav === 'Live' ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <span className="relative">
            {activeBottomNav === 'Live' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
            <Radio className="w-5 h-5" />
          </span>
          <span className="text-[10px] font-bold">Live</span>
        </button>
        <button 
          onClick={() => { setActiveBottomNav('Channels'); setActiveLeague(null); }}
          className={`flex flex-col items-center gap-1.5 transition ${activeBottomNav === 'Channels' ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold">Channels</span>
        </button>
        <button 
          onClick={() => { setActiveBottomNav('All Sports'); setActiveFilter('All'); setActiveLeague(null); }}
          className={`flex flex-col items-center gap-1.5 transition ${activeBottomNav === 'All Sports' ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
             <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
           </svg>
          <span className="text-[10px] font-bold">All Sports</span>
        </button>
        <button 
          onClick={() => { setActiveBottomNav('Leagues'); }}
          className={`flex flex-col items-center gap-1.5 transition ${activeBottomNav === 'Leagues' ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
             <path d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm1 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z" />
           </svg>
          <span className="text-[10px] font-bold">Leagues</span>
        </button>
      </div>

    </div>
  );
}
