// Items & equipment: generation (using original Lua formulas), drops, naming.
import { DB, S } from '../engine/db.js';
import { Lua } from '../engine/lua.js';

export const QUALITY_COLORS = { 0: '#ddd', 1: '#f2f2f2', 2: '#5ab4ff', 3: '#c77dff', 4: '#ffae2b', 5: '#ff4d4d' };
export const EQUIP_SLOTS = ['weapon', 'offhand', 'helm', 'chest', 'glove', 'cuish', 'boot', 'necklace', 'ring1', 'ring2', 'spirit'];
export const SLOT_NAMES_VI = { weapon: 'Vũ khí', offhand: 'Tay phụ', helm: 'Mũ', chest: 'Áo', glove: 'Găng', cuish: 'Quần', boot: 'Giày', necklace: 'Dây chuyền', ring1: 'Nhẫn', ring2: 'Nhẫn', spirit: 'Tinh linh' };
export function slotsForType(t) {
  t = +t;
  if (t === 10 || t === 11 || t === 12) return ['weapon'];
  if (t === 13 || t === 45) return ['offhand'];
  return { 20: ['helm'], 21: ['chest'], 22: ['glove'], 23: ['cuish'], 24: ['boot'], 30: ['necklace'], 31: ['ring1', 'ring2'], 32: ['spirit'] }[t] || [];
}
export const isEquipId = id => DB.equip.has(+id);
let uidSeq = Date.now() % 1e6;
const newUid = () => (++uidSeq).toString(36) + Math.random().toString(36).slice(2, 6);

export function iconUrl(iconId) {
  const n = String(iconId).padStart(6, '0');
  return `assets/img/icon/item-${n}.webp`;
}
export function itemRecord(it) { return it.eq ? DB.equip.get(it.id) : DB.item.get(it.id); }
export function itemName(it) { const r = itemRecord(it); return r ? S(r.ItemName) : '???'; }
export function itemIcon(it) { const r = itemRecord(it); return r ? iconUrl(r.IconID) : ''; }
export function itemQuality(it) { return it.eq ? it.q : (itemRecord(it)?.Quality || 1); }

// Create an equipment instance. level = map level (attribute level)
export function makeEquip(id, level, opts = {}) {
  const r = DB.equip.get(+id); if (!r) return null;
  const lvMin = +r.LevelReq || 1;
  const lvMax = +r.AttrLvUpLmt || 100;
  const attrLv = Math.max(lvMin, Math.min(lvMax, Math.max(1, level | 0)));
  const equ = { id: r.ID, type: +r.Type, quality: +r.Quality || 1, attr_lv: attrLv, attack_speed: +r.AtkSpdMult || 100, inte_lv: 0 };
  const base = [];
  for (const k of ['Base1', 'Base2']) {
    if (r[k] === '' || r[k] == null) continue;
    const aid = +String(r[k]).split(';')[0];
    const v = Lua.call('CalEquipmentAttrib', equ, aid);
    base.push({ a: aid, v: v ? Math.round(v[0]) : 1 });
  }
  const affix = [];
  for (const k of ['Affix1', 'Affix2', 'Affix3', 'Affix4', 'Affix5']) {
    if (r[k] === '' || r[k] == null) continue;
    const opts = String(r[k]).split(';').filter(Boolean).map(Number);
    const aid = opts[Math.floor(Math.random() * opts.length)];
    if (!aid) continue;
    const v = Lua.call('CalEquipmentAffix', equ, aid);
    if (!v) continue;
    affix.push({ a: aid, v: Math.round(v[0] ?? 1), v2: v[1] != null ? Math.round(v[1]) : undefined });
  }
  return { uid: newUid(), eq: 1, id: r.ID, q: equ.quality, lv: attrLv, spd: equ.attack_speed, base, affix, inte: 0 };
}
export function makeItem(id, n = 1) {
  const r = DB.item.get(+id); if (!r) return null;
  return { uid: newUid(), id: r.ID, n };
}
export function makeAny(id, level) {
  id = +id;
  if (DB.equip.has(id)) return makeEquip(id, level);
  if (DB.item.has(id)) return makeItem(id, 1);
  return null;
}

export function attrText(a, v) {
  const p = DB.properties.get(+a);
  let s = p ? S(p.Property) : ('#' + a);
  return s.replace('<p1>', v).replace('<p2>', '').replace(/<[^>]+>/g, '').trim();
}
// percent-type attributes produced by Lua are scaled ×100 for some ids (see tExtendAttrFactor[2]==0)
export function equipScore(it) {
  const r = Lua.call('CalEquipmentScore', toLuaEqu(it));
  return r ? Math.round(r[0] || 0) : 0;
}
export function toLuaEqu(it) {
  const base = it.base.map(b => ({ id: b.a, p1: b.v }));
  const affix = it.affix.map(b => ({ id: b.a, p1: b.v, p2: b.v2 }));
  return { id: it.id, type: +DB.equip.get(it.id).Type, quality: it.q, attr_lv: it.lv, attack_speed: it.spd, inte_lv: it.inte || 0, base, affix, gems: [] };
}
export function sellPrice(it) {
  if (it.eq) {
    const r = Lua.call('CalEquipmentSellGold', toLuaEqu(it));
    return r ? Math.max(1, r[0] | 0) : 1;
  }
  const r = DB.item.get(it.id); return (+r?.Price || 0) * (it.n || 1);
}

// --------- Drops ----------
// dropField: "id,weight;id,weight" (map.csv columns)
export function parseDropField(f) {
  if (f === '' || f == null) return [];
  return String(f).split(';').filter(Boolean).map(s => { const [id, p] = s.split(','); return { id: +id, p: p === undefined ? 1 : +p }; });
}
export function rollDropSet(field, luck = 0) {
  const set = parseDropField(field); if (!set.length) return 0;
  const r = Lua.call('CalDropID', set, luck);
  return r ? (r[0] | 0) : 0;
}
// resolve drop id -> concrete item id
export function resolveDrop(dropId) {
  const d = DB.drop.get(+dropId); if (!d) return 0;
  const g = String(d.DropGroup).split(';').filter(Boolean);
  return +g[Math.floor(Math.random() * g.length)];
}
