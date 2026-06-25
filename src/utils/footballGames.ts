const FOOTBALL_GAME_PATTERN = /\b(football|soccer|penalty|free kick|world cup|fifa)\b|head ball|goal finger|kickups/i;

export function isFootballGame(game: any): boolean {
  const searchable = [
    game?.title,
    game?.slug,
    game?.category,
    game?.subcategory,
    ...(game?.tags || [])
  ].filter(Boolean).join(' ');

  return game?.category === 'sports' && FOOTBALL_GAME_PATTERN.test(searchable);
}

export function compareHomePriority(a: any, b: any): number {
  const scoreA = (a?.isNew ? 100 : 0) + (a?.featured ? 40 : 0) + (a?.trending ? 20 : 0);
  const scoreB = (b?.isNew ? 100 : 0) + (b?.featured ? 40 : 0) + (b?.trending ? 20 : 0);
  if (scoreA !== scoreB) return scoreB - scoreA;

  const dateA = new Date(a?.lastUpdated || '2000-01-01').getTime();
  const dateB = new Date(b?.lastUpdated || '2000-01-01').getTime();
  return dateB - dateA;
}
