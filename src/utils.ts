export const createSlug = (text: string) => {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

export const getMatchSlug = (home: string, away: string) => {
   return createSlug(`${home || 'unknown'}-vs-${away || 'unknown'}`);
};

export const getServerSlugs = (servers: any[]) => {
   const slugs: Record<string, string> = {};
   const nameCount: Record<string, number> = {};
   servers.forEach(s => {
       const baseSlug = createSlug(s.name) || 'server';
       nameCount[baseSlug] = (nameCount[baseSlug] || 0) + 1;
       if (nameCount[baseSlug] === 1) {
           slugs[s.id] = baseSlug;
       } else {
           slugs[s.id] = `${baseSlug}-${nameCount[baseSlug]}`;
       }
   });
   return slugs;
};
