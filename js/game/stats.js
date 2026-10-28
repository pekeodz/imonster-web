// Player & monster stat computation.
import { DB } from '../engine/db.js';
import { EQUIP_SLOTS } from './items.js';

export const MAX_LEVEL = 100;
export function expRow(lv) { return DB.exp.get(Math.max(1, Math.min(MAX_LEVEL, lv))); }

// ---------------------------------------------------------------------------
// SOURCE-EXACT stat pipeline (reversed from libMyGame.so 1.4.1):
//   Hero::getFinX()            = Unit::calAttribWithBuffs(attr, Hero::calAttribWithEquipments(attr, charBase))
//   calAttribWithEquipments    = int(f32(base + itemBaseBenefit) * (100 + affixGain) / 100) + affixBenefit
//                                (affix layer = affixes + 3 inlaid gems; attr 3 "ATK" also feeds attr 1/2)
//   calAttribWithBuffs         = int(f32(v) * (100 + gain) / 100 + benefit)   (skill buffs + passive effects)
// UnitAttrib enum (native) — same numbering as the Lua skill effects' `attr`.
export const UNIT_ATTR = {
  1: 'min_atk', 2: 'max_atk', 4: 'defense', 5: 'max_hp', 6: 'max_mp',
  7: 'fire_res', 8: 'cold_res', 9: 'light_res', 10: 'poison_res',
  11: 'fire_atk', 12: 'cold_atk', 13: 'light_atk', 14: 'poison_atk',
  15: 'hit', 16: 'dodge', 17: 'critical', 18: 'crit_dam', 19: 'fin_atk_speed', 20: 'luck',
  21: 'exp_bonus', 22: 'gold_bonus', 23: 'hit_hp', 24: 'kill_hp', 25: 'hit_mp', 26: 'kill_mp',
  27: 'extra_red', 28: 'extra_blue', 29: 'mp_cost', 30: 'skill_cd', 31: 'debuff_res', 32: 'control_res',
};
// property id -> [UnitAttrib(s), 'b' = getAttribBenefit (flat int) | 'g' = getAttribGain (percent)]
// from EquipEffect_<id>::getAttribBenefit/getAttribGain (cmp w2,#attr)
export const PROP_ATTR = {
  1: [[3], 'b'], 2: [[3], 'g'], 3: [[1], 'b'], 4: [[2], 'b'], 5: [[5], 'b'], 6: [[5], 'g'], 7: [[6], 'b'], 8: [[6], 'g'],
  9: [[4], 'b'], 10: [[4], 'g'], 11: [[7], 'b'], 12: [[8], 'b'], 13: [[9], 'b'], 14: [[10], 'b'], 15: [[7, 8, 9, 10], 'b'],
  21: [[16], 'b'], 22: [[15], 'b'], 23: [[17], 'b'], 24: [[18], 'b'], 25: [[19], 'g'],
  26: [[11], 'b'], 27: [[12], 'b'], 28: [[13], 'b'], 29: [[14], 'b'],
  35: [[23], 'b'], 37: [[25], 'b'], 39: [[24], 'b'], 41: [[26], 'b'], 49: [[29], 'g', -1], 52: [[30], 'g', -1],   // EquipEffect_49/52 return -p1
  56: [[21], 'b'], 57: [[22], 'b'], 58: [[20], 'b'],
};
const f32 = Math.fround;
// native: fcvtzs(f32(f32(f32(100 + gain) * f32(base)) / 100)) + benefit
export function equipLayer(base, gain, bene) { return Math.trunc(f32(f32(f32(f32(gain) + 100) * f32(base)) / 100)) + (bene | 0); }
// native: fcvtzs(f32(f32(f32(f32(gain) + 100) * f32(v)) / 100) + f32(bene))
export function buffLayer(v, gain, bene) { return Math.trunc(f32(f32(f32(f32(f32(gain) + 100) * f32(v)) / 100) + f32(bene))); }

// per-UnitAttrib sums from the equipped items: { base, bene, gain, raw } (raw = by property id, for non-attrib hooks)
export function equipSums(equipped) {
  const base = {}, bene = {}, gain = {}, raw = {};
  const add = (pid, v, isBase) => {
    raw[pid] = (raw[pid] || 0) + v;
    const m = PROP_ATTR[pid]; if (!m) return;
    for (const a of m[0]) {
      if (m[1] === 'g') { if (!isBase) gain[a] = f32((gain[a] || 0) + f32(m[2] === -1 ? -v : v)); }   // TODO VERIFY: base-attr gains (none exist in equip.json)
      else if (isBase) base[a] = (base[a] || 0) + v; else bene[a] = (bene[a] || 0) + v;
    }
  };
  for (const s of EQUIP_SLOTS) {
    const it = equipped[s]; if (!it) continue;
    for (const b of it.base) add(b.a, b.v, true);
    for (const b of it.affix) add(b.a, b.v, false);
    for (const g of it.gems || []) if (g) for (const b of g.attrs || []) add(b.a, b.v, false);
    // legacy flat sums (UI compare / non-hero callers). The hero's live layer is bridge.calAttribWithEquipments (all EquipEffect objects incl. specialization)
  }
  return { base, bene, gain, raw };
}
// kept for older callers: flat sum by property id
export function equipAttrs(equipped) { return equipSums(equipped).raw; }

// Hero character base per UnitAttrib (second argument of Hero::calAttribWithEquipments)
export function heroCharBase(p) {
  const e = expRow(p.level), weapon = p.equipped?.weapon;
  return { 1: e.Attack, 2: e.Attack, 4: e.Defense, 5: e.MaxHP, 6: e.MaxMP, 7: e.FireRes, 8: e.ColdRes, 9: e.LightRes, 10: e.PoisonRes,
    15: e.Hit, 16: e.Dodge, 17: e.Critical, 18: e.CritDam, 19: weapon ? weapon.spd : 100 };
}
export function playerStats(p) {
  const e = expRow(p.level);
  const E = equipSums(p.equipped);
  const weapon = p.equipped.weapon;
  // character base per UnitAttrib (Unit stats from exp table). TODO VERIFY: Hero extra fields 0x154..0x170
  // (second addend in Hero::getFinX) are not reversed yet -> 0.
  const charBase = heroCharBase(p);
  const s = { type: 'MyPlayer', lv: p.level, raw_atk_speed: weapon ? weapon.spd : 100 };
  for (const k in UNIT_ATTR) {
    const a = +k;
    const feeds3 = a === 1 || a === 2;
    const base = (charBase[a] || 0) + (E.base[a] || 0) + (feeds3 ? (E.base[3] || 0) : 0);
    const gain = f32((E.gain[a] || 0) + (feeds3 ? (E.gain[3] || 0) : 0));
    const bene = (E.bene[a] || 0) + (feeds3 ? (E.bene[3] || 0) : 0);
    s[UNIT_ATTR[a]] = equipLayer(base, gain, bene);
  }
  // runtime-hook properties (36 steal, 40, 48 thorn, 51, 53 ...) are EquipEffect objects (native/equipfx.js), not stats
  s.cur_hp = p.hp ?? s.max_hp; s.cur_mp = p.mp ?? s.max_mp;
  // attr 29/30 are not stats but modifiers of a per-skill base (Hero::getFinMPCost / getFinSkillCooldown)
  delete s.mp_cost; delete s.skill_cd;
  Object.defineProperty(s, '_E', { value: E, enumerable: false, writable: true });
  return s;
}
function sums3(src, a) { return src[a] || 0; }
// Hero::getFinMPCost(skill): buff(equip(ManaCost, attr 29))
export function heroFinMPCost(s, cost) {
  const E = s._E || { gain: {}, bene: {} }, B = s._B || { gain: {}, bene: {} };
  const v = equipLayer(Math.trunc(cost), sums3(E.gain, 29), sums3(E.bene, 29));
  return buffLayer(v, sums3(B.gain, 29), sums3(B.bene, 29));
}
// Hero::getFinSkillCooldown(skill): buff(equip(int(Cooldown*1000), attr 30)) / 1000
export function heroFinCooldown(s, cdSec) {
  const E = s._E || { gain: {}, bene: {} }, B = s._B || { gain: {}, bene: {} };
  const v = equipLayer(Math.trunc(f32(f32(cdSec) * 1000)), sums3(E.gain, 30), sums3(E.bene, 30));
  return f32(f32(buffLayer(v, sums3(B.gain, 30), sums3(B.bene, 30))) / 1000);
}
// Unit::calAttribWithBuffs over a stat object (effects = Lua 'attrib benefit' / 'attrib gain' tables)
export function applyBuffLayer(st, effs) {
  const bene = {}, gain = {};
  for (const e of effs || []) {
    const a = +e.attr; if (!a) continue;
    if (e.type === 'attrib benefit') bene[a] = (bene[a] || 0) + (Math.trunc(+e.bene) || 0);
    else if (e.type === 'attrib gain') gain[a] = f32((gain[a] || 0) + f32(+e.gain || 0));
  }
  Object.defineProperty(st, '_B', { value: { bene, gain }, enumerable: false, writable: true });
  for (const k in UNIT_ATTR) {
    const a = +k, key = UNIT_ATTR[a];
    if (a === 29 || a === 30) continue;
    const feeds3 = a === 1 || a === 2;
    const b = (bene[a] || 0) + (feeds3 ? (bene[3] || 0) : 0);
    const gn = f32((gain[a] || 0) + (feeds3 ? (gain[3] || 0) : 0));
    if (!b && !gn) continue;              // identity: int(v*100/100+0) == v for int v
    st[key] = buffLayer(st[key] || 0, gn, b);
  }
  return st;
}
// gear score
export function weaponStance(p) {
  const w = p.equipped.weapon; if (!w) return 4;
  const t = +DB.equip.get(w.id).Type;
  return t === 10 ? 1 : t === 11 ? 2 : t === 12 ? 3 : 1;
}

// Monster::initWithData (native):
//   stat = int(rate * f32(MonsterStatTemplate[(lv + MonsterLevel)*10 + rank].X * MonsterTemplate.X))
//   for Life, Mana, Min/MaxDam, 4 elem dam, Defense, Hit, Dodge, Critical, CritDam;
//   resists = int(stat * factor + extraRes)    (no rate);   AttackSpeed / Exp / Gold = int(stat * factor) (no rate)
//   extraRes = rate > 2.2 ? clamp(int((rate - 2.2) * 50), 0, 80) : 0
//   rate = 1 unless GameMap::genRandomMap gives lv>=21 maps the (server) bonus — see monsterRate()
const MAP = { min_atk: 'MinDam', max_atk: 'MaxDam', fire_atk: 'FireDam', cold_atk: 'ColdDam', light_atk: 'LightDam', poison_atk: 'PoisonDam', defense: 'Defense', fire_res: 'FireRes', cold_res: 'ColdRes', light_res: 'LightRes', poison_res: 'PoisonRes', max_hp: 'Life', max_mp: 'Mana', raw_atk_speed: 'AttackSpeed', hit: 'Hit', dodge: 'Dodge', critical: 'Critical', crit_dam: 'CritDam', exp: 'Exp', gold: 'Gold' };
const RES_KEYS = ['fire_res', 'cold_res', 'light_res', 'poison_res'];
const NO_RATE = ['raw_atk_speed', 'exp', 'gold'];
export function monsterStats(mon, level, rank, resInc = 0, rate = 1) {
  level = level + (+mon.MonsterLevel || 0);
  // native has no clamp here (template lookup fails -> error). Web keeps a fallback row only to avoid a crash.
  const base = DB.mstat[level * 10 + rank] || DB.mstat[Math.min(Math.max(level, 1), 200) * 10 + rank] || DB.mstat[10 + rank];
  const s = { type: 'Monster', lv: level, rank };
  rate = f32(rate);
  const extraRes = rate > f32(2.2) ? Math.max(0, Math.min(80, Math.trunc(f32(f32(rate - f32(2.2)) * 50)))) : 0;
  for (const k in MAP) {
    const f = mon[MAP[k]]; const fv = f32((f === '' || f == null) ? 1 : +f);
    const prod = f32(f32(base[MAP[k]] || 0) * fv);
    if (RES_KEYS.includes(k)) s[k] = Math.trunc(f32(prod + extraRes));
    else if (NO_RATE.includes(k)) s[k] = Math.trunc(prod);
    else s[k] = Math.trunc(f32(rate * prod));
  }
  // TODO VERIFY: map ResInc — the native consumer is not reversed yet; web adds it to resists (no clamp).
  if (resInc) for (const k of RES_KEYS) s[k] += resInc;
  s.cur_hp = s.max_hp; s.cur_mp = s.max_mp;
  s.fin_atk_speed = s.raw_atk_speed;
  s.atk_times = +mon.AtkTimes || 1;
  return s;
}
// Monster::getFinMin/MaxAttack & elemental attack getters: buffed value scaled per hit
//   int(f32(1 + 0.2*(AtkTimes-1)) * buffed / AtkTimes)
export function perHitAttack(v, times) {
  times = times | 0; if (times <= 1) return v;
  const k = f32(f32(f32(times - 1) * f32(0.2)) + 1);
  return Math.trunc(f32(f32(k * f32(v)) / f32(times)));
}

// UI value of ATK SPD. Native shows (value / 2) truncated toward zero everywhere a speed is displayed:
// Equipment::getBasicDescription (AtkSpdMult 333 -> "ATK SPD: 166") and PackageView::updatePlayerInfo
// (getFinAttackSpeed() / 2). Combat keeps the raw value (attack anim, 2 s long, plays at speed/100).
export function atkSpdText(v) { return String(Math.trunc((v | 0) / 2)); }
