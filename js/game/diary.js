// Diary pages (diary.csv): found in the tower between MinFloor..MaxFloor, Percent chance per floor,
// Condition = a page that must have been found first.
import { DB, S } from '../engine/db.js';
import { P } from './profile.js';

export function pickDiary(floor, rng) {
  const got = new Set(P.data.diaries || []);
  const rows = DB.diaryRows.filter(r => !got.has(r.ID) && floor >= +r.MinFloor && floor <= +r.MaxFloor && (r.Condition === '' || got.has(+r.Condition)));
  for (const r of rows) if (rng.next() * 100 < (+r.Percent || 0)) return r.ID;
  return null;
}
export const diaryTitle = id => S(DB.diary.get(+id)?.Title) || '';
export const diaryText = id => S(DB.diary.get(+id)?.Content) || '';
// books grouped by title, in csv order
export function diaryBooks() {
  const books = new Map();
  for (const r of DB.diaryRows) { const t = S(r.Title); if (!books.has(t)) books.set(t, []); books.get(t).push(r.ID); }
  return [...books.entries()].map(([title, ids]) => ({ title, ids }));
}
