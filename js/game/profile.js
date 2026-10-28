// Player profile (persistent) + save/load (localStorage, optional Firebase cloud save).
import { DB } from '../engine/db.js';
import { makeEquip, makeItem, slotsForType, EQUIP_SLOTS, ensureSpec } from './items.js';
import { playerStats, expRow, MAX_LEVEL } from './stats.js';
import { Cloud } from './cloud.js';

const KEY = 'imonster_save_v1';
export const P = { data: null };

export function newProfile(name, look) {
  const p = {
    v: 1, name: name || 'Goblin', look: look || { tone: 1, style: 2 },
    level: 1, exp: 0, gold: 200, diamond: 0,
    maxFloor: 1, curFloor: 1,
    red: 10, blue: 10, maxRed: 10, maxBlue: 10,
    inventory: [], equipped: {}, bagSize: 40,
    skillPoints: 0, skills: {},
    stats: { kills: 0, deaths: 0, chests: 0 },
    settings: { music: 0.6, sound: 0.8, lang: 'en' },
    created: Date.now(), updated: Date.now(),
  };
  // InitNewPlayer(): starting weapon 110000 (Hard Stick)
  const stick = makeEquip(110000, 1);
  if (stick) p.equipped.weapon = stick;
  migrate(p);
  P.data = p;
  fullHeal();
  return p;
}
export function fullHeal() { const s = stats(); P.data.hp = s.max_hp; P.data.mp = s.max_mp; }
let statHook = null;
export function setStatHook(f) { statHook = f; }
export function stats() { const s = playerStats(P.data); return statHook ? statHook(s) : s; }

export function addExp(n) {
  const p = P.data; let ups = 0;
  if (p.level >= MAX_LEVEL) return 0;
  p.exp += Math.round(n);
  while (p.level < MAX_LEVEL && p.exp >= expRow(p.level).NextExp) {
    p.exp -= expRow(p.level).NextExp; p.level++; ups++; p.skillPoints++;
  }
  if (ups) fullHeal();
  return ups;
}
export function bagFull() { return P.data.inventory.length >= P.data.bagSize; }
export function addItem(it) {
  const p = P.data;
  if (!it) return false;
  if (!it.eq) {
    const r = DB.item.get(it.id);
    const cap = +r?.CanStack || 1;
    let n = it.n || 1;
    for (const x of p.inventory) {
      if (!x.eq && x.id === it.id && x.n < cap) { const add = Math.min(cap - x.n, n); x.n += add; n -= add; if (!n) return true; }
    }
    while (n > 0) { if (bagFull()) return false; const take = Math.min(cap, n); p.inventory.push({ ...it, uid: it.uid + '_' + n, n: take }); n -= take; }
    return true;
  }
  if (bagFull()) return false;
  p.inventory.push(it); return true;
}
export function removeItem(uid, n = Infinity) {
  const inv = P.data.inventory; const i = inv.findIndex(x => x.uid === uid); if (i < 0) return null;
  const it = inv[i];
  if (!it.eq && it.n > n) { it.n -= n; return { ...it, n }; }
  inv.splice(i, 1); return it;
}
export function canEquip(it) {
  const r = DB.equip.get(it.id); return r && P.data.level >= (+r.LevelReq || 1);
}
export function equip(uid) {
  const p = P.data; const it = p.inventory.find(x => x.uid === uid); if (!it || !it.eq) return false;
  const r = DB.equip.get(it.id); const slots = slotsForType(r.Type); if (!slots.length) return false;
  let slot = slots.find(s => !p.equipped[s]) || slots[0];
  removeItem(uid);
  const old = p.equipped[slot];
  p.equipped[slot] = it;
  if (old) p.inventory.push(old);
  clampHP();
  return true;
}
export function unequip(slot) {
  const p = P.data; const it = p.equipped[slot]; if (!it) return false;
  if (bagFull()) return false;
  delete p.equipped[slot]; p.inventory.push(it); clampHP(); return true;
}
export function clampHP() { const s = stats(); P.data.hp = Math.min(P.data.hp ?? s.max_hp, s.max_hp); P.data.mp = Math.min(P.data.mp ?? s.max_mp, s.max_mp); }

export function save() {
  if (!P.data) return;
  P.data.updated = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(P.data)); } catch (e) { }
  Cloud.save(P.data);
}
export function loadLocal() {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { }
  return null;
}
export async function loadBest() {
  const local = loadLocal();
  let cloud = null;
  try { cloud = await Cloud.load(); } catch (e) { }
  const pick = (!local) ? cloud : (!cloud ? local : (cloud.updated > local.updated ? cloud : local));
  if (pick) { P.data = pick; migrate(pick); }
  return pick;
}
function migrate(p) {
  p.inventory ||= []; p.equipped ||= {}; p.skills ||= {}; p.stats ||= { kills: 0, deaths: 0, chests: 0 };
  p.settings ||= { music: 0.6, sound: 0.8, lang: 'en' };
  for (const s of EQUIP_SLOTS) if (p.equipped[s] === null) delete p.equipped[s];
  // the original has one ring slot and 20-cell bag pages
  if (p.equipped.ring2) { if (!p.equipped.ring1) p.equipped.ring1 = p.equipped.ring2; else p.inventory.push(p.equipped.ring2); delete p.equipped.ring2; }
  if (p.equipped.offhand) { p.inventory.push(p.equipped.offhand); delete p.equipped.offhand; }
  p.bagSize = Math.max(40, Math.ceil((p.bagSize || 40) / 20) * 20);
  p.diamond ||= 0; p.diaries ||= []; p.pets ||= {}; p.wardrobe ||= []; p.fashion ||= {}; p.maxFloorHard ||= 0; p.labBest ||= 0;
  for (const it of [...p.inventory, ...Object.values(p.equipped), ...Object.values(p.equippedAlt || {})]) ensureSpec(it);
  if (!Object.keys(p.pets).length) { p.pets[100000] = { lv: 1, star: 1, exp: 0 }; p.petActive = 100000; } // Lina is free
}
export { migrate };
export function wipe() { try { localStorage.removeItem(KEY); } catch (e) { } P.data = null; }
