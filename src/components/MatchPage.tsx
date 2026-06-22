import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Match } from '../types';
import { getMatchTimeStatus } from './shared';
import { getMatchSlug, getServerSlugs } from '../utils';

export default function MatchPage({ data, loading, currentTime }: { data: any, loading: boolean, currentTime: number }) {
  const { matchSlug } = useParams<{ matchSlug: string }>();
  const navigate = useNavigate();

  // Find match
  const matchesArray = Array.isArray(data?.matches) ? data.matches : [];
  const match = matchesArray.find((m: Match) => getMatchSlug(m.homeTeam, m.awayTeam) === matchSlug);

  if (loading && !match) {
    return <div className="min-h-screen bg-[#07090e] text-slate-200 flex items-center justify-center">Loading match...</div>;
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col items-center justify-center">
         <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
         <button onClick={() => navigate('/')} className="px-6 py-2 bg-purple-600 rounded-full hover:bg-purple-700 transition font-medium">Go Back</button>
      </div>
    );
  }

  const serverSlugs = getServerSlugs(match.servers);

  return (
    <div className="min-h-screen bg-[#06080c] text-slate-200 font-sans pb-20">
      <header className="sticky top-0 z-50 bg-[#06080c]/90 backdrop-blur border-b border-purple-500/10 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-white/5 rounded-full transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Match Info Card */}
          <div className="bg-[#121622] rounded-xl p-4 border border-white/[0.05]">
             <div className="flex justify-between items-center mb-6">
               <div className="flex gap-2 items-center">
                  {(() => {
                    const matchStatus = getMatchTimeStatus(match, currentTime);
                    if (matchStatus.type === 'live') {
                       return (
                         <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-bold tracking-widest uppercase">
                           <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live
                         </span>
                       );
                    }
                    if (matchStatus.type === 'finished') {
                       return (
                         <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-full text-[10px] font-bold uppercase whitespace-nowrap">
                           FINISHED
                         </span>
                       );
                    }
                    return (
                       <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold uppercase whitespace-nowrap">
                         {matchStatus.text}
                       </span>
                    );
                  })()}
                  <span className="px-3 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                    {match.sport}
                  </span>
               </div>
               <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-xs font-medium transition text-white">
                 <Share2 className="w-3 h-3" /> Share
               </button>
             </div>

             <div className="flex items-center justify-between px-4 sm:px-12 mb-2">
               <div className="flex flex-col items-center gap-3">
                 {match.homeLogo ? (
                   <img src={match.homeLogo} alt={match.homeTeam} referrerPolicy="no-referrer" className="w-16 h-16 object-contain drop-shadow-md" />
                 ) : (
                   <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xl">{match.homeTeam.charAt(0)}</div>
                 )}
                 <span className="font-semibold text-sm text-center max-w-[80px] truncate">{match.homeTeam}</span>
               </div>

               <div className="text-slate-500 font-bold text-sm tracking-widest">VS</div>

               <div className="flex flex-col items-center gap-3">
                  {match.awayLogo ? (
                   <img src={match.awayLogo} alt={match.awayTeam} referrerPolicy="no-referrer" className="w-16 h-16 object-contain drop-shadow-md" />
                 ) : (
                   <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xl">{match.awayTeam.charAt(0)}</div>
                 )}
                 <span className="font-semibold text-sm text-center max-w-[80px] truncate">{match.awayTeam}</span>
               </div>
             </div>
             
             <div className="text-center text-xs text-slate-500 mt-4 font-medium opacity-80">
               {['TBA', 'Unknown Date', 'invalid', 'Invalid Date'].includes(new Date(match.time).toString()) 
                  ? 'TBA' 
                  : new Date(match.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
             </div>
          </div>

          {/* Servers List */}
          <div className="mt-6 mb-2">
            <h3 className="text-[16px] font-bold text-white mb-3 tracking-tight">Available Servers</h3>
            <div className="flex flex-col gap-3">
              {match.servers.map((server: any) => {
                 const serverSlug = serverSlugs[server.id];
                 return (
                   <Link
                     to={`/${matchSlug}/${serverSlug}`}
                     key={server.id}
                     className="flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden bg-[#151923] border-white/5 hover:bg-[#1a1f2b] hover:border-purple-600/80"
                   >
                     <div className="flex items-center gap-3">
                       <span className={`w-2.5 h-2.5 rounded-full shrink-0 bg-slate-600`} />
                       <div className="flex flex-col">
                         <span className="font-bold text-[14px] text-white tracking-wide">
                           {server.name}
                         </span>
                         <span className="text-[12px] text-slate-500 font-medium">{server.quality === 'auto' ? 'Auto Quality' : server.quality}</span>
                       </div>
                     </div>
                     <span className={`text-[11px] font-bold px-2 py-1.5 rounded-md bg-[#212631] text-slate-400`}>AQ</span>
                   </Link>
                 );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
