// Bridge between the native battle core and the web game: unit providers (hp/mp/level/fin stats),
// ScriptMgr (Lua) bindings and the hero unit identity. Mirrors Hero/MyPlayer/Monster getters of libMyGame.so 1.4.1.
import { DB } from '../../engine/db.js';
import { Lua } from '../../engine/lua.js';
import { P } from '../profile.js';
import { playerStats, UNIT_ATTR, perHitAttack, heroCharBase, expRow } from '../stats.js';
import { EQUIP_SLOTS } from '../items.js';
import { EQ, EquipEffect, setRawHeroMP, setRawHeroHP } from './equipfx.js';
import { f32, trunc, U, Script, Units, View } from './core.js';
import { useSkill } from './effects.js';
import './single.js';

// ---------------------------------------------------------------- hero identity
// The hero's native unit state (effect lists, abnormal counters, skill chain) lives on HERO.n and survives floors.
export const HERO = { isHero: true, type: 'MyPlayer' };
U.init(HERO);
// attach the persistent hero state to the tower's hero object (actor, position ...)
export function bindHero(obj) {
  if (!obj) { Units.set(HERO.n.uid, HERO); return HERO; }
  obj.n = HERO.n; obj.isHero = true;
  Units.set(HERO.n.uid, obj);
  return obj;
}
export const heroUnit = () => Units.get(HERO.n.uid) || HERO;

// ---------------------------------------------------------------- context (set by the tower)
export const Ctx = {
  tower: null,            // current Tower (null in camp)
  frame: 0,               // bumped every tower frame -> equipment-layer cache
  mapRow: null,           // MapTemplate row of the current floor
  resistMod: 0,           // GameMap +0x6c (endless resist modification)
  equipEffects: () => heroEquipEffects(), // Hero::forEachEquipment -> Equipment::forEachProperty (EquipEffect objects)
  itemBuffs: () => [],    // MyPlayer +0x4a0 / +0x4b8
  petAdd: null,           // MyPlayer getters + following pet (TODO P1)
};

// ---------------------------------------------------------------- providers
U.isHero = u => !!(u && u.isHero);
U.isMonster = u => !!(u && !u.isHero && !u.isPet);
U.hp = u => (u.isHero ? (P.data?.hp ?? 0) : (u.hp ?? 0));
U.setHp = (u, v) => { if (u.isHero) P.data.hp = v; else u.hp = v; };
U.mp = u => (u.isHero ? (P.data?.mp ?? 0) : (u.mp ?? 0));
U.setMp = (u, v) => { if (u.isHero) P.data.mp = v; else u.mp = v; };
U.level = u => (u.isHero || u.isPet ? (P.data?.level | 0) : (u.st?.lv | 0));   // Hero +0x13c / Monster +0x148
U.rank = u => (u.rank | 0);                                                  // Monster +0x144
U.equipEffects = u => (u.isHero ? Ctx.equipEffects(u) : []);
U.itemBuffs = u => (u.isHero ? Ctx.itemBuffs(u) : []);
// Hero::getEquipmentWithType(0) -> weapon template Type (10 light / 11 heavy / 12 polearm ...), -1 without weapon
U.weaponType = u => { const w = P.data?.equipped?.weapon; return w ? +(DB.equip.get(w.id)?.Type ?? -1) : -1; };
// Unit::getQTEState: QTE mini game is not implemented in the web build (TODO) -> state 0
U.qteState = u => 0;
// MapTemplate::isNormalMap: MapConType (Content) 0 or 5
U.isNormalMap = mapId => { const r = DB.map.get(+mapId); const c = r ? +r.Content : -1; return c === 0 || c === 5; };
// MyPlayer::addBottle(type, n): clamp [0, 20 + extra]
U.addBottle = (u, type, n) => {
  const p = P.data; if (!p) return;
  const k = type === 0 ? 'red' : 'blue';
  const lim = bottleLimit(type);
  const v = (p[k] | 0) + (n | 0);
  p[k] = v < 0 ? 0 : (v <= lim ? v : lim);
};
export function bottleLimit(type) { return 20 + (finAttr(heroUnit(), type === 0 ? 27 : 28) | 0); }   // MyPlayer::getBottleLimit

// ---------------------------------------------------------------- equipment properties (EquipEffect objects)
// Equipment lists: base (+0xb0), affix (+0xc8), special (+0xe0), gems (+0xf8.. Consumable::forEachAffix).
// One object per property and item, kept while the item is unchanged (per-object battle state lives in it).
let eqObjs = new WeakMap(), eqVer = 0;
const itemSig = it => JSON.stringify([it.base, it.affix, it.spec, (it.gems || []).map(g => g && g.attrs)]);
const mkEffect = (id, p1, p2) => { const C = EQ[+id] || EquipEffect; return new C(+id, p1 ?? 0, p2 ?? 0); };
function itemEffects(it) {
  let o = eqObjs.get(it);
  if (o && (o.frame !== Ctx.frame || !Ctx.tower)) { o.frame = Ctx.frame; if (o.sig !== itemSig(it)) o.ver = -1; }   // forge / inlay changed the item in place
  if (!o || o.ver !== eqVer) {
    const base = (it.base || []).map(b => mkEffect(b.a, b.v, b.v2));
    const others = [...(it.affix || []).map(b => mkEffect(b.a, b.v, b.v2)), ...(it.spec || []).map(x => mkEffect(x.id, x.p1, x.p2))];
    for (const g of it.gems || []) if (g) for (const b of g.attrs || []) others.push(mkEffect(b.a, b.v, b.v2));
    // keep live objects (battle state) of properties that did not change
    if (o) for (const list of [base, others]) list.forEach((e, i) => { const old = [...o.base, ...o.others].find(x => x.id === e.id && x.p1 === e.p1 && x.p2 === e.p2 && !x._kept); if (old) { old._kept = true; list[i] = old; } });
    for (const e of [...base, ...others]) delete e._kept;
    o = { ver: eqVer, frame: Ctx.frame, sig: itemSig(it), base, others, all: [...base, ...others] };
    eqObjs.set(it, o);
  }
  return o;
}
const equippedItems = () => { const eq = P.data?.equipped || {}; const r = []; for (const s of EQUIP_SLOTS) if (eq[s]) r.push(eq[s]); return r; };
export function heroEquipEffects() { const r = []; for (const it of equippedItems()) r.push(...itemEffects(it).all); return r; }
export function invalidateEquipEffects() { eqVer++; }
// Hero::calAttribWithEquipments(attr, v): base-list benefits join the base value, other lists give benefit + gain;
// attributes 1/2 also take attribute 3 (lambda 0117e8d8)
export function calAttribWithEquipments(u, attr, v) {
  let base = v | 0, bene = 0, gain = f32(0);
  const one = (o, a) => {
    for (const e of o.base) base += e.getAttribBenefit(u, a) | 0;
    let b = 0; for (const e of o.others) b += e.getAttribBenefit(u, a) | 0; bene += b;
    let g = f32(0); for (const e of o.others) g = f32(g + f32(+e.getAttribGain(u, a) || 0)); gain = f32(g + gain);
  };
  for (const it of equippedItems()) { const o = itemEffects(it); one(o, attr); if (attr === 1 || attr === 2) one(o, 3); }
  return bene + trunc(f32(f32(f32(gain + 100) * f32(base)) / 100));
}
setRawHeroMP(() => +(expRow(P.data?.level | 0)?.MaxMP) | 0);   // Unit+0x80 = HeroTemplate MaxMP
setRawHeroHP(() => +(expRow(P.data?.level | 0)?.MaxHP) | 0);   // Unit+0x78 = HeroTemplate MaxHP (VERIFY)

// ---------------------------------------------------------------- stats
let eqCache = { frame: -1, s: null };
export function equipStats() {             // Hero::calAttribWithEquipments for every attribute (doc-1 pipeline)
  if (eqCache.frame !== Ctx.frame || !eqCache.s) eqCache = { frame: Ctx.frame, s: playerStats(P.data) };
  return eqCache.s;
}
export function bumpStats() { Ctx.frame++; }
// Unit::calAttribWithBuffs / MyPlayer::calAttribWithBuffs
export function calAttribWithBuffs(u, attr, v) {
  U.init(u);
  const enemy = U.getEnemy(u);
  let bene = 0, gain = f32(0);
  const two = attr === 1 || attr === 2;
  const skill = e => {
    bene += e.getAttribBenefit(u, enemy, attr) | 0; gain = f32(gain + f32(+e.getAttribGain(u, enemy, attr) || 0));
    if (two) { bene += e.getAttribBenefit(u, enemy, 3) | 0; gain = f32(gain + f32(+e.getAttribGain(u, enemy, 3) || 0)); }
  };
  for (const e of [...u.n.perm]) skill(e);
  for (const e of [...u.n.battle]) skill(e);
  if (u.isHero) for (const e of U.itemBuffs(u)) {      // EquipEffect-style (unit, attr)
    bene += e.getAttribBenefit(u, attr) | 0; gain = f32(gain + f32(+e.getAttribGain(u, attr) || 0));
    if (two) { bene += e.getAttribBenefit(u, 3) | 0; gain = f32(gain + f32(+e.getAttribGain(u, 3) || 0)); }
  }
  return trunc(f32(f32(f32(f32(gain + 100) * f32(v)) / 100) + f32(bene)));
}
const inTower = () => !!Ctx.tower;
// per-attribute final value (Hero/MyPlayer/Monster::getFinX)
export function finAttr(u, attr) {
  if (u.isHero) {
    if (attr === 1 && U.isAbnormal(u, 4) && !U.isAbnormal(u, 5)) return finAttr(u, 2);
    if (attr === 2 && U.isAbnormal(u, 5) && !U.isAbnormal(u, 4)) return finAttr(u, 1);
    const cb = heroCharBase(P.data);
    let v = calAttribWithBuffs(u, attr, calAttribWithEquipments(u, attr, cb[attr] | 0));
    // MyPlayer::getFinXResist: + MapTemplate.ResInc + GameMap resist modification while in the tower
    if (attr >= 7 && attr <= 10 && inTower()) v = (+(Ctx.mapRow?.ResInc) || 0) + v + (Ctx.resistMod | 0);
    if (Ctx.petAdd) v += Ctx.petAdd(attr) | 0;   // TODO P1 (pet): MyPlayer adds following-pet fields to some getters
    return v;
  }
  const st = u.st || {};
  if (attr === 1 && U.isAbnormal(u, 4) && !U.isAbnormal(u, 5)) return finAttr(u, 2);
  if (attr === 2 && U.isAbnormal(u, 5) && !U.isAbnormal(u, 4)) return finAttr(u, 1);
  if (attr === 19) return calAttribWithBuffs(u, 19, st.raw_atk_speed | 0);
  const v = calAttribWithBuffs(u, attr, st[UNIT_ATTR[attr]] | 0);
  // Monster::getFinMin/MaxAttack + elemental attack getters: per-hit scaling by AtkTimes
  if (!u.isPet && ((attr >= 1 && attr <= 2) || (attr >= 11 && attr <= 14))) return perHitAttack(v, st.atk_times | 0);
  return v;
}
// lazy view: every read is one native getter call (getters may recurse into each other through effects)
const KEYS = Object.entries(UNIT_ATTR);
class Fin { constructor(u) { this.u = u; } }
for (const [a, k] of KEYS) Object.defineProperty(Fin.prototype, k, { get() { return finAttr(this.u, +a); } });
Object.defineProperty(Fin.prototype, 'avg_atk', { get() { return trunc((finAttr(this.u, 1) + finAttr(this.u, 2)) / 2); } });   // Unit::getFinAverageAttack
Object.defineProperty(Fin.prototype, 'raw_atk_speed', { get() { return this.u.isHero ? (equipStats().raw_atk_speed | 0) : (this.u.st?.raw_atk_speed | 0); } });
U.fin = u => new Fin(u);
// Hero::getFinMPCost(skill) / Hero::getFinSkillCooldown(skill)
export function finMPCost(id) {
  const r = DB.skill.get(+id); if (!r) return 0;
  const base = trunc(+r.ManaCost || 0);
  const eq = calAttribWithEquipments(heroUnit(), 29, base);
  return calAttribWithBuffs(heroUnit(), 29, eq);
}
export function finCooldown(id) {
  const r = DB.skill.get(+id); if (!r) return 0;
  const base = trunc(f32(f32(+r.Cooldown || 0) * 1000));
  const eq = calAttribWithEquipments(heroUnit(), 30, base);
  return f32(f32(calAttribWithBuffs(heroUnit(), 30, eq)) / 1000);
}
// MyPlayer::getFinSkillLevel = base level + sum EquipEffect::getSkillBenefit (min 0)
export function finSkillLevel(id) {
  const base = P.data?.skills?.[id] | 0; if (!base) return 0;
  let add = 0; const h = heroUnit();
  for (const e of Ctx.equipEffects(h)) if (e.getSkillBenefit) add += e.getSkillBenefit(h, +id) | 0;
  const v = base + add; return v < 0 ? 0 : v;
}
// snapshot of every final attribute (UI / legacy callers of profile.stats())
export function heroSnapshot(s) {
  const h = heroUnit();
  for (const [a, k] of KEYS) { if (+a === 29 || +a === 30) continue; s[k] = finAttr(h, +a); }
  s.avg_atk = trunc((s.min_atk + s.max_atk) / 2);
  return s;
}

// ---------------------------------------------------------------- ScriptMgr bindings
const keyOf = u => (u ? U.init(u).n.uid : 0);
const byKey = k => (k && Units.get(k)) || null;
// ScriptMgr::pushUnit(L, unit, bonus)
Script.pushUnit = (u, b) => {
  if (!u) return null;
  b = b || [];
  const f = U.fin(u), bo = i => b[i] | 0, z = v => (v < 0 ? 0 : v);
  return {
    id: keyOf(u), mon_id: U.isMonster(u) ? (+u.id | 0) : 0, quality: U.isMonster(u) ? U.rank(u) : 0,
    type: u.isHero ? 'MyPlayer' : u.isPet ? 'Pet' : 'Monster', lv: U.level(u),
    cur_hp: U.hp(u), max_hp: f.max_hp, cur_mp: U.mp(u), max_mp: f.max_mp,
    min_atk: z(bo(1) + f.min_atk), max_atk: z(bo(2) + f.max_atk), defense: bo(4) + f.defense,
    fire_atk: z(bo(11) + f.fire_atk), cold_atk: z(bo(12) + f.cold_atk), light_atk: z(bo(13) + f.light_atk), poison_atk: z(bo(14) + f.poison_atk),
    fire_res: bo(7) + f.fire_res, cold_res: bo(8) + f.cold_res, light_res: bo(9) + f.light_res, poison_res: bo(10) + f.poison_res,
    hit: f.hit, dodge: f.dodge, critical: f.critical, crit_dam: f.crit_dam,
    raw_atk_speed: f.raw_atk_speed, fin_atk_speed: f.fin_atk_speed, act_rate: U.actionRate(u),
  };
};
Script.calAttackDamage = (a, d, hit, crit) => Lua.call('CalAttackDamage', a, d, !!hit, !!crit);
Script.calPhysicalDamage = (lv, atk, def) => { const r = Lua.call('CalPhysicalDamage', lv | 0, atk | 0, def | 0); return r && typeof r[0] === 'number' ? trunc(r[0]) : 0; };
// ScriptMgr::calElementDamage(atk, res, lvA, lvB): levels below 2 -> 1
Script.calEleDmg = (atk, lva, res, lvb) => { const r = Lua.call('CalEleDmg', atk | 0, lva < 2 ? 1 : lva, res | 0, lvb < 2 ? 1 : lvb); return r && typeof r[0] === 'number' ? trunc(r[0]) : 0; };
Script.calCriticalDamage = (force, dmg, crit, cd) => { const r = Lua.call('CalCriticalDamage', !!force, dmg | 0, crit | 0, cd | 0); return r ? [typeof r[0] === 'number' ? trunc(r[0]) : 0, !!r[1]] : [dmg, false]; };
// ScriptMgr::skillUse: g_skills[id].use(caster, enemy, lv - 1), entries 1..100 until the first non-table
Script.skillUse = (id, lv, caster, enemy) => {
  const r = Lua.call('__nSkillUse', +id, Script.pushUnit(caster), Script.pushUnit(enemy), (lv | 0) - 1);
  const t = r?.[0]; if (!t || typeof t !== 'object') return [];
  const out = [];
  for (let i = 0; i < 100; i++) { const e = Array.isArray(t) ? t[i] : t[i + 1]; if (!e || typeof e !== 'object' || Array.isArray(e)) break; out.push(e); }
  return out;
};
// ScriptMgr::skillEffectCondition: missing function -> true, Lua error -> false
Script.skillEffectCondition = (id, lv, src, tgt, cond) => {
  const r = Lua.call('__nSkillCond', +id, String(cond), Script.pushUnit(byKey(src)), Script.pushUnit(byKey(tgt)), (lv | 0) - 1);
  if (!r) return false;
  return r[0] === 'none' ? true : !!r[1];
};
// ScriptMgr::skillCondition: g_skills[id].condition(caster, enemy) -> integer error code (0 ok); no g_skills -> 2
export function skillCondition(id, caster, enemy) {
  const r = Lua.call('__nSkillCondition', +id, Script.pushUnit(caster), Script.pushUnit(enemy));
  return r ? (r[0] | 0) : 0;
}
// ScriptMgr::monsterAIAction / onHit / beDamage (g_monster_ai[template id])
Script.monsterAIAction = (mon, enemy, info, t) => { const r = Lua.call('__nAI', 'action', +mon.id, Script.pushUnit(mon), Script.pushUnit(enemy), !!info?.hit, !!info?.crit, t); return !!(r && r[0]); };
Script.monsterAIOnHit = (mon, enemy, info) => { Lua.call('__nAI', 'onHit', +mon.id, Script.pushUnit(mon), Script.pushUnit(enemy), !!info?.hit, !!info?.crit, null); };
Script.monsterAIBeDamage = (mon, enemy, info) => { Lua.call('__nAI', 'beDamage', +mon.id, Script.pushUnit(mon), Script.pushUnit(enemy), !!info?.hit, !!info?.crit, null); };
export function resetBattle() { Lua.call('__nResetBattle'); }   // ScriptMgr::resetBattle
Script.triggerBeDamage = () => { Bridge.onBeDamage(); };

export const Bridge = {
  onBeDamage: () => { },      // story "be damage" trigger (set by the tower)
};

export function installNativeLua() {
  Lua.exec(`
    function __nSkillUse(id, caster, enemy, lv)
      local s = g_skills[id]; if type(s) ~= "table" or type(s.use) ~= "function" then return nil end
      return s.use(caster, enemy, lv)
    end
    function __nSkillCond(id, cond, src, tgt, lv)
      local s = g_skills[id]; if type(s) ~= "table" then return "none" end
      local f = s[cond]; if type(f) ~= "function" then return "none" end
      return "ok", f(src, tgt, lv)
    end
    function __nSkillCondition(id, caster, enemy)
      if type(g_skills) ~= "table" then return 2 end
      local s = g_skills[id]; if type(s) ~= "table" or type(s.condition) ~= "function" then return 0 end
      local r = s.condition(caster, enemy)
      if math.type(r) == "integer" then return r end
      return 0
    end
    _battle = { _time = 0 }
    function __nResetBattle() _battle = { _time = 0 } end
    function __nAI(kind, id, mon, enemy, hit, crit, t)
      local a = g_monster_ai and g_monster_ai[id]; if type(a) ~= "table" or type(a[kind]) ~= "function" then return false end
      _battle._hit = hit; _battle._critical = crit
      if t ~= nil then _battle._time = t end
      local r = a[kind](mon, enemy, _battle)
      return r and true or false
    end
  `, 'nativeglue');
}
// sw.UseSkill(id, caster, enemy) -> ScriptMgr::LUseSkill -> SkillMgr::use(id, 1, caster, enemy)
export function hostUseSkill(id, caster, enemy) {
  const c = byKey(caster?.id | 0), e = byKey(enemy?.id | 0);
  if (c && e) useSkill(+id, 1, c, e);
  return null;
}
