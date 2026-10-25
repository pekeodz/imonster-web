// Player & monster stat computation.
import { DB } from '../engine/db.js';
import { EQUIP_SLOTS } from './items.js';

export const MAX_LEVEL = 100;
export function expRow(lv) { return DB.exp.get(Math.max(1, Math.min(MAX_LEVEL, lv))); }

// Sum of attributes from equipped items: attrId -> total
export function equipAttrs(equipped) {
  const t = {};
  for (const s of EQUIP_SLOTS) {
    const it = equipped[s]; if (!it) continue;
    for (const b of it.base) t[b.a] = (t[b.a] || 0) + b.v;
    for (const b of it.affix) t[b.a] = (t[b.a] || 0) + b.v;
    for (const g of it.gems || []) if (g) for (const b of g.attrs || []) t[b.a] = (t[b.a] || 0) + b.v;
  }
  return t;
}

export function playerStats(p) {
  const e = expRow(p.level);
  const A = equipAttrs(p.equipped);
  const buffs = p.buffs || {};
  const g = id => (A[id] || 0) + (buffs[id] || 0);
  const pct = id => 1 + g(id) / 100;
  const weapon = p.equipped.weapon;
  const atkPts = g(1);
  let minAtk = (e.Attack + atkPts + g(3)) * pct(2);
  let maxAtk = (e.Attack + atkPts + g(4)) * pct(2);
  if (weapon) { minAtk = Math.max(1, minAtk); }
  const allRes = g(15);
  const s = {
    type: 'MyPlayer',
    lv: p.level,
    max_hp: Math.round((e.MaxHP + g(5)) * pct(6)),
    max_mp: Math.round((e.MaxMP + g(7)) * pct(8)),
    min_atk: Math.round(minAtk),
    max_atk: Math.round(Math.max(minAtk, maxAtk)),
    defense: Math.round((e.Defense + g(9)) * pct(10)),
    fire_res: Math.min(75, e.FireRes + g(11) + allRes),
    cold_res: Math.min(75, e.ColdRes + g(12) + allRes),
    light_res: Math.min(75, e.LightRes + g(13) + allRes),
    poison_res: Math.min(75, e.PoisonRes + g(14) + allRes),
    hit: e.Hit + g(22),
    dodge: e.Dodge + g(21),
    critical: e.Critical + g(23),
    crit_dam: e.CritDam + g(24),
    fire_atk: g(26), cold_atk: g(27), light_atk: g(28), poison_atk: g(29),
    raw_atk_speed: weapon ? weapon.spd : 100,
    luck: g(58),
    exp_bonus: g(56), gold_bonus: g(57),
    hit_hp: g(35), steal_hp: g(36), hit_mp: g(37), kill_hp: g(39), kill_hp_pct: g(40), kill_mp: g(41),
    thorn: g(48), phys_reduce: g(51), heal_bonus: g(53),
  };
  s.fin_atk_speed = Math.round(s.raw_atk_speed * pct(25));
  s.cur_hp = p.hp ?? s.max_hp; s.cur_mp = p.mp ?? s.max_mp;
  return s;
}
// gear score
export function weaponStance(p) {
  const w = p.equipped.weapon; if (!w) return 4;
  const t = +DB.equip.get(w.id).Type;
  return t === 10 ? 1 : t === 11 ? 2 : t === 12 ? 3 : 1;
}

// Monster stats = monsterstats[level][rank] * monster factor
const MAP = { min_atk: 'MinDam', max_atk: 'MaxDam', fire_atk: 'FireDam', cold_atk: 'ColdDam', light_atk: 'LightDam', poison_atk: 'PoisonDam', defense: 'Defense', fire_res: 'FireRes', cold_res: 'ColdRes', light_res: 'LightRes', poison_res: 'PoisonRes', max_hp: 'Life', max_mp: 'Mana', raw_atk_speed: 'AttackSpeed', hit: 'Hit', dodge: 'Dodge', critical: 'Critical', crit_dam: 'CritDam', exp: 'Exp', gold: 'Gold' };
export function monsterStats(mon, level, rank, resInc = 0) {
  level = Math.max(1, Math.min(200, level + (+mon.MonsterLevel || 0)));
  const base = DB.mstat[Math.min(level, 200) * 10 + rank] || DB.mstat[10 + rank];
  const s = { type: 'Monster', lv: level, rank };
  for (const k in MAP) {
    const f = mon[MAP[k]]; const fv = (f === '' || f == null) ? 1 : +f;
    s[k] = (base[MAP[k]] || 0) * fv;
  }
  for (const k of ['min_atk', 'max_atk', 'max_hp', 'defense', 'exp', 'gold', 'fire_atk', 'cold_atk', 'light_atk', 'poison_atk']) s[k] = Math.round(s[k]);
  for (const k of ['fire_res', 'cold_res', 'light_res', 'poison_res']) s[k] = Math.min(90, Math.round(s[k] + resInc));
  if (s.max_atk < s.min_atk) [s.min_atk, s.max_atk] = [s.max_atk, s.min_atk];
  s.max_hp = Math.max(1, s.max_hp);
  s.cur_hp = s.max_hp; s.cur_mp = s.max_mp;
  s.fin_atk_speed = s.raw_atk_speed;
  s.atk_times = +mon.AtkTimes || 1;
  return s;
}
