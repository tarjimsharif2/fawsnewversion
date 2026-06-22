import { Match, ScrapeResponse, ServerLink } from '../types';

export const getMatchTimeStatus = (match: Match, currentTime: number) => {
    if (match.status?.toLowerCase() === 'finished' || match.status?.toLowerCase() === 'ended') {
       return { text: 'FINISHED', type: 'finished' };
    }
    if (match.isLive) {
       return { text: 'Live', type: 'live' };
    }
    
    const startTime = new Date(match.time).getTime();
    if (startTime > currentTime) {
        const diff = startTime - currentTime;
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / 1000 / 60 / 60));
        const days = Math.floor(hours / 24);
        
        let countdown = '';
        if (days > 0) {
            countdown = `${days}d ${hours % 24}h ${minutes}m`;
        } else if (hours > 0) {
            countdown = `${hours}h ${minutes}m ${seconds}s`;
        } else {
            countdown = `${minutes}m ${seconds}s`;
        }
        
        return { text: `Starts in ${countdown}`, type: 'upcoming' };
    }
    
    return { text: match.status?.toUpperCase() || 'UPCOMING', type: 'upcoming' };
};
