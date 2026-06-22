export interface ServerLink {
  id: string;
  name: string;
  url: string;
  streamUrl: string;
  externalUrl: string;
  type: string;
  quality: string;
  headers: Record<string, string>;
  drm?: any;
  drmKey?: string;
}

export interface Match {
  id: string;
  title: string;
  shortTitle: string;
  slug: string;
  sport: string;
  competition: string;
  time: string;
  status: string;
  isLive: boolean;
  isPinned: boolean;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  servers: ServerLink[];
}

export interface ScrapeResponse {
  lastScraped: string | null;
  matches: Match[];
  error?: string | null;
}
