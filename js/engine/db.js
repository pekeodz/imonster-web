// Game database: loads converted CSV tables (data/*.json) and localized strings.
export const DB = { lang: 'en' };
const TABLES = ['bptask', 'equip', 'item', 'monster', 'monsterstats', 'map', 'drop', 'exp', 'skill', 'shop', 'properties', 'recipe', 'trap', 'ornament', 'henchman', 'henchmanstats', 'tips', 'diary'];
export async function loadDB(onProgress) {
  const get = n => fetch('data/' + n + '.json').then(r => r.json());
  let done = 0; const total = TABLES.length + 3;
  const tick = () => onProgress && onProgress(++done / total);
  await Promise.all(TABLES.map(async t => {
    const rows = await get(t); tick();
    DB[t + 'Rows'] = rows;
    const byId = new Map();
    for (const r of rows) if (r.ID !== '' && r.ID != null) byId.set(r.ID, r);
    DB[t] = byId;
  }));
  DB.avatarIndex = await get('avatar_index'); tick();
  DB.frames = await get('frames'); tick();
  await setLang(DB.lang); tick();
  // monsterstats by level/rank
  DB.mstat = {};
  for (const r of DB.monsterstatsRows) DB.mstat[r.Level * 10 + r.Rank] = r;
  return DB;
}
export async function setLang(l) {
  DB.lang = l;
  DB.str = await fetch('data/strings_' + l + '.json').then(r => r.json());
  if (l !== 'en' && !DB.strEn) DB.strEn = await fetch('data/strings_en.json').then(r => r.json());
}
// Localized string with simple markup stripped.
export function S(key, ...args) {
  if (key == null || key === '') return '';
  let s = DB.str[key] ?? DB.strEn?.[key] ?? String(key);
  let i = 0;
  s = s.replace(/%[ds%]/g, m => m === '%%' ? '%' : (args[i++] ?? ''));
  return s;
}
export function richText(s) {
  // <cr=r,g,b>text<cr=def>  and <sp=...> icons
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;cr=(\d+),(\d+),(\d+)&gt;/g, '<span style="color:rgb($1,$2,$3)">')
    .replace(/&lt;cr=def&gt;/g, '</span>')
    .replace(/&lt;sp=[^&]*&gt;/g, '◆')
    .replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
}
