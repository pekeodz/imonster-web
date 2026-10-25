// Game modes: Hard mode (困难模式) and the Dark Lab (暗黑研究所, the endless mode: maps 10001..19917).
import { DB } from '../engine/db.js';
import { P, fullHeal } from './profile.js';
import { makeEquip } from './items.js';
import { invalidatePassives } from './skills.js';

export const HARD_UNLOCK_FLOOR = 50;
export const LAB_UNLOCK_FLOOR = 20;
export const LAB_START = 10001;
// lab keeps these item types when you are thrown out: gems, enhance beads, recipe scrolls, decorative gems, materials
const LAB_KEEP_TYPES = new Set([42, 43, 45, 47, 49]);

export const Modes = {
  hardUnlocked: () => (P.data.maxFloor || 1) >= HARD_UNLOCK_FLOOR || !!P.data.story?.fin?.[2210],
  labUnlocked: () => (P.data.maxFloor || 1) >= LAB_UNLOCK_FLOOR || !!P.data.story?.fin?.[2160],
  inLab: () => !!P.data.labBackup,
  // pick next map: NextMap may list several variants (lab)
  nextOf(row) {
    const list = String(row.NextMap || '').split(';').filter(Boolean).map(Number).filter(id => DB.map.has(id));
    return list.length ? list[Math.floor(Math.random() * list.length)] : 0;
  },
  enterLab() {
    const p = P.data;
    p.labBackup = JSON.parse(JSON.stringify({ level: p.level, exp: p.exp, skills: p.skills, skillPoints: p.skillPoints, inventory: p.inventory, equipped: p.equipped, gold: p.gold, power: p.power || 0, petActive: p.petActive }));
    p.level = 1; p.exp = 0; p.skills = {}; p.skillPoints = 0; p.inventory = []; p.equipped = {}; p.gold = 0; p.petActive = null;
    const w = makeEquip(100021, 1); if (w) p.equipped.weapon = w; // Lab Scalpel
    p.labRun = { floor: 1, start: Date.now() };
    invalidatePassives(); fullHeal();
  },
  // returns summary of what was kept
  leaveLab() {
    const p = P.data, b = p.labBackup; if (!b) return null;
    const floor = p.labRun?.floor || 1;
    const kept = p.inventory.filter(it => !it.eq && LAB_KEEP_TYPES.has(+DB.item.get(it.id)?.Type));
    Object.assign(p, { level: b.level, exp: b.exp, skills: b.skills, skillPoints: b.skillPoints, inventory: b.inventory, equipped: b.equipped, gold: b.gold, power: b.power, petActive: b.petActive });
    delete p.labBackup; delete p.labRun;
    let n = 0;
    for (const it of kept) { if (p.inventory.length < p.bagSize || p.inventory.some(x => x.id === it.id)) { const ex = p.inventory.find(x => !x.eq && x.id === it.id); if (ex) ex.n += it.n; else p.inventory.push(it); n += it.n || 1; } }
    const dia = Math.floor(floor / 2), gold = floor * 500;
    p.diamond = (p.diamond || 0) + dia; p.gold += gold;
    p.labBest = Math.max(p.labBest || 0, floor);
    invalidatePassives(); fullHeal();
    return { floor, items: n, dia, gold, best: p.labBest };
  },
  // hard-mode monster scaling
  hardScale(st) {
    st.lv += 10;
    for (const k of ['max_hp', 'min_atk', 'max_atk', 'fire_atk', 'cold_atk', 'light_atk', 'poison_atk']) st[k] = Math.round((st[k] || 0) * 1.6);
    st.defense = Math.round(st.defense * 1.3); st.hit += 5;
    st.exp = Math.round(st.exp * 1.6); st.gold = Math.round(st.gold * 1.6);
    st.cur_hp = st.max_hp;
    return st;
  },
};

// ---------------- Fashion (equip.csv rows with Fashion=1): cosmetic only, shown over the real gear
export const FASHION_PRICE = q => q >= 4 ? 300 : q === 3 ? 150 : 80; // diamonds
export function fashionRows() { return DB.equipRows.filter(r => +r.Fashion === 1); }
export function fashionSlot(type) { type = +type; return (type === 10 || type === 11 || type === 12) ? 'weapon' : ({ 20: 'helm', 21: 'chest', 22: 'glove', 23: 'cuish', 24: 'boot' })[type]; }
// visual equipment list for the paper doll: fashion overrides the slot's real gear
export function lookEquips(p) {
  const out = {};
  for (const [s, it] of Object.entries(p.equipped || {})) out[s] = DB.equip.get(it.id);
  for (const [s, id] of Object.entries(p.fashion || {})) if (id && DB.equip.has(id)) out[s] = DB.equip.get(id);
  return Object.values(out).filter(Boolean);
}
