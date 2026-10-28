// SOURCE-EXACT battle core ported from libMyGame.so 1.4.1 (Unit / Effect / SkillEffect / Behavior / GameController).
// Every function names the native method it mirrors. Visual side effects go through `View` (set by the tower).
import { arc4random } from '../../engine/nativerng.js';

export const f32 = Math.fround;
export const trunc = Math.trunc;
// (arc4random() % 100001) * 1e-5f
export const rand01 = () => f32(f32(arc4random() % 100001) * f32(1e-5));
export const rand100 = () => arc4random() % 100;

// ---------------------------------------------------------------- view bridge (GameController::notify*)
export const View = {
  damage(u, mode, type, total, curHp, crit, absorbed) { }, // notifyDamage
  attackHit(src, tgt, info, absorbed) { },                 // notifyAttackHit
  recover(u, mode, hp, mp) { },                            // notifyRecover
  abnormal(u, status, on) { },                             // notifyAbnormalStatus
  bodyEffect(name, u, slot, tag) { },                      // notifyBodyEffect
  sceneEffect(file, root, u, slot) { },
  flyEffect(fx) { },
  action(u, idx, speed) { },                               // SkillAction -> unit plays skill-idx
  attrChanged(u) { },                                      // notifyUnitChangeAttrib / notifyPlayerAttribChange
  actionRate(u) { },
  bottle(kind, n) { },
  qteStart() { },
  sound(name) { },
  text(u, msg, color) { },
};

// ---------------------------------------------------------------- MyTimer
export class MyTimer {
  constructor() { this.delay = 0; this.interval = 0; this.count = 0; this.fired = 0; this.acc = 0; this.on = false; this.fn = null; }
  initWithDelay(delay, interval, count, fn) { this.count = count; this.fired = 0; this.acc = 0; this.on = true; this.delay = delay; this.interval = interval; this.fn = fn; return true; }
  initWithDelayOneShot(d, fn) { return this.initWithDelay(d, d, 1, fn); }
  initWithPeriodForever(p, fn) { return this.initWithDelay(p, p, 0, fn); }
  cancel() { this.on = false; this.count = 0; this.fired = 0; this.acc = 0; }
  update(dt) {
    if (!this.on) return;
    const a = f32(dt + this.acc); this.acc = a;
    const lim = this.fired > 0 ? this.interval : this.delay;
    if ((this.fired > 0 && this.interval <= a) || (this.fired === 0 && this.delay <= a)) { this.acc = f32(a - lim); this.trigger(); }
  }
  trigger() {
    const fn = this.fn;
    this.fired++;
    if (this.fired === this.count) this.cancel();
    if (fn) fn();
  }
}

// ---------------------------------------------------------------- DamageInfo
export const MODE = { ATTACK: 0, SKILL: 1, TRAP: 2 };
export function newInfo(mode = 0, type = 0) { return { mode, type, skill: 0, avg: 0, hit: false, crit: false, flag12: false, n: 0, dmg: [0, 0, 0, 0, 0] }; }
export const cloneInfo = i => ({ ...i, dmg: i.dmg.slice() });
export const sumDmg = i => i.dmg[0] + i.dmg[1] + i.dmg[2] + i.dmg[3] + i.dmg[4];

// ---------------------------------------------------------------- Effect base (vtable order)
let incID = 1;
export class Effect {
  onArriveFloor(player, floor, mapId) { }
  onAttackingEnemy(unit, enemy) { return false; }
  onHitEnemy(unit, enemy, dmg, info) { }
  onDodgeEnemy(unit, enemy, info) { }
  onUsedSkill(unit, enemy, skillId, lv) { }
  onUsingMedicine(unit, itemId) { return true; }
  onEnterBattle(unit, enemy) { }
  onLeaveBattle(unit, enemy, result) { }
  beDamaging(unit, info, flag) { }
  onDamagedByEnemy(unit, enemy, info, dmg) { }
  onRecovered(unit, mode, attr, real, raw) { }
  onKillEnemy(unit, enemy, kmode) { }
  beforeDamageCalculation(unit, enemy, atkB, defB, raw, info) { }
  afterDamageCalculation(unit, enemy, raw, info) { }
  beforeBeDamageCalculation(unit, enemy, defB, atkB, raw, info) { }
  afterBeDamageCalculation(unit, enemy, raw, info) { }
  afterRecoverCalculation(unit, mode, attr, raw, out) { }
  afterTrapDamageCalculation(unit, dmg, out) { }
  onTriggerEffect(unit, name) { }
}
// SkillEffect: 0x24 indexKey, 0x28 buffID, 0x2c attached, 0x2d flag
export class SkillEffect extends Effect {
  constructor() { super(); this.key = incID++; this.buffID = 0; this.attached = false; this.flag = false; }
  isBuff() { return false; } isDebuff() { return false; } isControl() { return false; }
  getAttribBenefit(unit, enemy, attr) { return 0; }
  getAttribGain(unit, enemy, attr) { return 0; }
  getSkillBenefit(unit, skillId) { return 0; }
  getActionRateBenefit(unit) { return 0; }
  // SkillEffect::onAttachingToUnit: same buffID -> remove previous ones from the battle list
  onAttachingToUnit(unit) {
    if (this.buffID) for (const e of [...unit.n.battle]) if (e.buffID === this.buffID) U.removeSkillBuff(unit, e);
    return true;
  }
  onAttachedToUnit(unit) { }
  onDetachedFromUnit(unit) { }
  onTriggered() { }
  update(dt) { }
  onArriveTile(unit, tile) { }
}
// SkillShortEffect(duration, sub): attaching adds `sub` to the unit's battle list; removed after `duration`
export class SkillShortEffect extends SkillEffect {
  constructor(duration, sub) { super(); this.duration = f32(duration); this.sub = sub; this.unit = null; this.timer = null; }
  isBuff() { return this.sub ? this.sub.isBuff() : false; }
  isDebuff() { return this.sub ? this.sub.isDebuff() : false; }
  isControl() { return this.sub ? this.sub.isControl() : false; }
  onAttachedToUnit(unit) {
    this.unit = unit;
    U.addSkillBuff(unit, this.sub, false);
    this.timer ||= new MyTimer();
    this.timer.initWithDelayOneShot(this.duration, () => { if (this.unit) U.removeSkillBuff(this.unit, this); });
  }
  onDetachedFromUnit(unit) {
    if (this.timer) this.timer.cancel();
    if (this.sub && this.unit) U.removeSkillBuff(this.unit, this.sub);
    this.unit = null;
  }
  update(dt) { if (this.timer) this.timer.update(dt); }
}
// SkillPeriodEffect(period, loop, sub): sub.onTriggered() every period (first after `period`, or immediately), `loop` times
export class SkillPeriodEffect extends SkillEffect {
  constructor(period, loop, sub) { super(); this.period = f32(period); this.loop = loop | 0; this.sub = sub; this.immediately = false; this.unit = null; this.timer = null; }
  onAttachedToUnit(unit) {
    this.unit = unit;
    this.timer ||= new MyTimer();
    this.timer.initWithDelay(this.immediately ? 0 : this.period, this.period, this.loop, () => {
      if (this.sub) this.sub.onTriggered();
      if (this.timer.fired === this.timer.count && this.unit) U.removeSkillBuff(this.unit, this);
    });
  }
  onDetachedFromUnit(unit) { if (this.timer) this.timer.cancel(); this.unit = null; }
  update(dt) { if (this.timer) this.timer.update(dt); }
}

// ---------------------------------------------------------------- Behaviors (mylib/common/behavior.cpp)
export class Behavior {
  constructor() { this.flags = 0; this.next = null; }
  init() { this.flags |= 1; return true; }
  update(dt) { if (this.flags & 4) this.end(); }
  end() { this.flags |= 2; }
  cancel() { this.flags |= 4; }
  isCanceled() { return !!(this.flags & 4); }
}
export class BehaviorIdle extends Behavior {
  update(dt) { if (this.next || (this.flags & 4)) this.end(); }
}
export class BehaviorSleep extends Behavior {
  constructor(t) { super(); this.t = f32(t); }
  update(dt) { this.t = f32(this.t - dt); if (0 < this.t && !(this.flags & 4)) return; this.end(); }
}
export class BehaviorChain {
  constructor() { this.cur = new BehaviorIdle(); }
  append(b) { let x = this.cur; while (x.next) x = x.next; x.next = b; return b; }
  cancelAll() { for (let x = this.cur; x; x = x.next) x.cancel(); }
  initBehavior() {
    if (this.cur.flags & 1) return;
    let ok = this.cur.init();
    while (!ok) {
      const nx = this.cur.next;
      if (!nx) { this.cur = new BehaviorIdle(); this.cur.flags = 1; return; }
      this.cur = nx; ok = this.cur.init();
    }
  }
  update(dt) {
    do {
      if (this.cur.flags & 2) this.cur = this.cur.next || new BehaviorIdle();
      this.initBehavior();
      this.cur.update(dt);
    } while (this.cur.flags & 2);
  }
}
// SkillAttach: addSkillBuff(src, effect, persistent) if the optional Lua condition passes
export class SkillAttach extends Behavior {
  constructor(persistent, unit, effect) { super(); this.persistent = persistent; this.unit = unit; this.effect = effect; this.cond = ''; }
  setCondition(src, tgt, skill, lv, cond) { Object.assign(this, { cs: src, ct: tgt, skill, lv, cond }); }
  init() {
    if (this.isCanceled()) return false;
    super.init();
    if (!this.unit || !this.effect) return false;
    if (this.cond && !Script.skillEffectCondition(this.skill, this.lv, this.cs, this.ct, this.cond)) return false;
    U.addSkillBuff(this.unit, this.effect, this.persistent);
    return false;
  }
}
export class SkillTakeEffect extends Behavior {
  constructor(effect) { super(); this.effect = effect; this.cond = ''; }
  setCondition(src, tgt, skill, lv, cond) { Object.assign(this, { cs: src, ct: tgt, skill, lv, cond }); }
  init() {
    if (this.isCanceled()) return false;
    super.init();
    if (this.cond && !Script.skillEffectCondition(this.skill, this.lv, this.cs, this.ct, this.cond)) return false;
    if (this.effect) this.effect.onTriggered();
    return false;
  }
}

// ---------------------------------------------------------------- Script bridge (filled by skills.js)
export const Script = {
  pushUnit: (u, bonus) => null,       // ScriptMgr::pushUnit -> Lua table
  calAttackDamage: (a, d, hit, crit) => null,
  skillUse: (id, lv, caster, enemy) => [],
  skillEffectCondition: (id, lv, src, tgt, cond) => true,
  calPhysicalDamage: (lv, atk, def) => 0,
  calEleDmg: (atk, lva, res, lvb) => 0,
  calCriticalDamage: (force, dmg, crit, cd) => [dmg, false],
  monsterAIAction: (mon, enemy, info, t) => false,
  monsterAIOnHit: (mon, enemy, info) => { },
  monsterAIBeDamage: (mon, enemy, info) => { },
  triggerBeDamage: () => { },
};

// ---------------------------------------------------------------- Unit runtime (Unit.cpp)
// unit.n = { uid, perm:[] (0x108), battle:[] (0xf0), abn:[_,faint,froze,death,upper,lower], chain }
let uidSeq = 1;
export const Units = new Map();
export const U = {
  init(u) {
    if (!u.n) { u.n = { uid: uidSeq++, perm: [], battle: [], abn: [0, 0, 0, 0, 0, 0], chain: new BehaviorChain(), enemy: null }; Units.set(u.n.uid, u); }
    return u;
  },
  // ---- providers (set by stats bridge)
  hp: u => 0, setHp: (u, v) => { }, mp: u => 0, setMp: (u, v) => { },
  fin: (u) => ({}),              // full final stat object (getFin*)
  level: u => 1,
  equipEffects: u => [],         // Hero::forEachEquipment -> forEachProperty
  itemBuffs: u => [],            // MyPlayer::forEachItemBuff
  isHero: u => !!u.isHero, isMonster: u => !u.isHero && !u.isPet,
  // ---- abnormal status
  addAbnormal(u, s) { U.init(u); return ++u.n.abn[s]; },
  removeAbnormal(u, s) { U.init(u); return --u.n.abn[s]; },
  isAbnormal(u, s) { return !!(u.n && u.n.abn[s] > 0); },
  isControlled(u) { return U.isAbnormal(u, 1) || U.isAbnormal(u, 2); },
  isDead(u) { return U.hp(u) < 1 || U.isAbnormal(u, 3); },
  getEnemy(u) { return u.n?.enemy || null; },
  isInFighting(u) { return !!u.n?.fighting; },
  // ---- effect lists
  forEachSkillBuff(u, fn) { U.init(u); for (const e of [...u.n.perm]) if (fn(e) === false) return; for (const e of [...u.n.battle]) if (fn(e) === false) return; },
  forEachEffect(u, fn) {
    U.init(u);
    if (U.isHero(u)) for (const e of U.equipEffects(u)) if (fn(e) === false) return;
    U.forEachSkillBuff(u, fn);
    if (U.isHero(u)) for (const e of U.itemBuffs(u)) if (fn(e) === false) return;
  },
  // Unit::addSkillBuff
  addSkillBuff(u, e, persistent) {
    if (!e) return false;
    U.init(u);
    let res = e.isDebuff() ? (U.fin(u).debuff_res | 0) : 0;
    if (e.isControl()) res = U.fin(u).control_res | 0;
    if (0 < res && rand100() < res) return false;
    if (!e.onAttachingToUnit(u)) return false;
    (persistent ? u.n.perm : u.n.battle).push(e);
    e.attached = true;
    e.onAttachedToUnit(u);
    return true;
  },
  removeSkillBuff(u, e) {
    if (!e || !u.n) return;
    let i = u.n.battle.indexOf(e), list = u.n.battle;
    if (i < 0) { i = u.n.perm.indexOf(e); list = u.n.perm; }
    if (i < 0) return;
    list.splice(i, 1);
    e.attached = false;
    e.onDetachedFromUnit(u);
  },
  removeAllSkillBuffs(u, battle, perm) {
    U.init(u); let any = false;
    if (battle && u.n.battle.length) { for (const e of [...u.n.battle]) U.removeSkillBuff(u, e); u.n.battle = []; any = true; }
    if (perm && u.n.perm.length) { const l = [...u.n.perm]; u.n.perm = []; for (const e of l) { e.attached = false; e.onDetachedFromUnit(u); } any = true; }
    return any;
  },
  // Unit::getFinActionRate
  actionRate(u) {
    U.init(u); let s = 0;
    for (const e of u.n.perm) s += e.getActionRateBenefit(u) | 0;
    for (const e of u.n.battle) s += e.getActionRateBenefit(u) | 0;
    const r = f32(f32(f32(s) / 100) + 1);
    return r <= 0 ? 0 : r;
  },
  // Unit::update(dt)
  update(u, dt) {
    U.init(u);
    if (!U.isAbnormal(u, 2)) u.n.chain.update(f32(U.actionRate(u) * dt));
    for (const e of [...u.n.perm]) e.update(dt);
    for (const e of [...u.n.battle]) e.update(dt);
    // EquipEffect MyTimers (+0x60/+0x70) are scheduler-driven in the original (not scaled by action rate)
    if (U.isHero(u)) for (const e of U.equipEffects(u)) e.update?.(dt);
  },
  // ---- hooks (Unit::xxx -> forEachEffect)
  onAttackingEnemy(u, enemy) { let r = false; U.forEachEffect(u, e => { r = e.onAttackingEnemy(u, enemy) || r; }); return r; },
  onHitEnemy(u, enemy, dmg, info) { U.forEachEffect(u, e => { e.onHitEnemy(u, enemy, dmg, info); }); if (U.isMonster(u)) Script.monsterAIOnHit(u, enemy, info); },
  onDodgeEnemy(u, enemy, info) { U.forEachEffect(u, e => { e.onDodgeEnemy(u, enemy, info); }); },
  onUsedSkill(u, enemy, id, lv) { U.forEachEffect(u, e => { e.onUsedSkill(u, enemy, id, lv); }); },
  onUsingMedicine(u, id) { let r = true; U.forEachEffect(u, e => { r = e.onUsingMedicine(u, id) && r; }); return r; },
  onEnterBattle(u, enemy) { U.forEachEffect(u, e => { e.onEnterBattle(u, enemy); }); },
  onLeaveBattle(u, enemy, result) {
    if (U.removeAllSkillBuffs(u, true, false)) View.attrChanged(u);
    u.n.chain.cancelAll();
    U.forEachEffect(u, e => { e.onLeaveBattle(u, enemy, result); });
  },
  beDamaging(u, info, flag) { U.forEachEffect(u, e => { e.beDamaging(u, info, flag); }); },
  onDamagedByEnemy(u, enemy, info, dmg) { U.forEachEffect(u, e => { e.onDamagedByEnemy(u, enemy, info, dmg); }); if (U.isMonster(u)) Script.monsterAIBeDamage(u, enemy, info); },
  onRecovered(u, mode, attr, real, raw) { U.forEachEffect(u, e => { e.onRecovered(u, mode, attr, real, raw); }); },
  onKillEnemy(u, enemy, kmode) { U.forEachEffect(u, e => { e.onKillEnemy(u, enemy, kmode); }); },
  beforeDamageCalculation(u, enemy, atkB, defB, raw, info) { U.forEachEffect(u, e => { e.beforeDamageCalculation(u, enemy, atkB, defB, raw, info); }); },
  afterDamageCalculation(u, enemy, raw, info) { U.forEachEffect(u, e => { e.afterDamageCalculation(u, enemy, raw, info); }); },
  beforeBeDamageCalculation(u, enemy, defB, atkB, raw, info) { U.forEachEffect(u, e => { e.beforeBeDamageCalculation(u, enemy, defB, atkB, raw, info); }); },
  afterBeDamageCalculation(u, enemy, raw, info) { U.forEachEffect(u, e => { e.afterBeDamageCalculation(u, enemy, raw, info); }); },
  afterRecoverCalculation(u, mode, attr, raw, out) { U.forEachEffect(u, e => { e.afterRecoverCalculation(u, mode, attr, raw, out); }); },
  afterTrapDamageCalculation(u, dmg, out) { U.forEachEffect(u, e => { e.afterTrapDamageCalculation(u, dmg, out); }); },
  triggerEffect(u, name) { U.forEachEffect(u, e => { e.onTriggerEffect(u, name); }); },

  // Unit::calAttackDamage(tgt, mode, forceHit, forceCrit, rate)
  calAttackDamage(u, tgt, mode, forceHit, forceCrit, rate = 1) {
    const info = newInfo(mode, 0);
    const a = U.fin(u);
    info.avg = a.avg_atk | 0;
    info.hit = !!forceHit; info.crit = !!forceCrit;
    const k = f32(rate - 1);
    const atkB = new Array(33).fill(0), defB = new Array(33).fill(0);
    atkB[1] = trunc(f32(k * a.min_atk)); atkB[2] = trunc(f32(k * a.max_atk));
    atkB[11] = trunc(f32(k * a.fire_atk)); atkB[12] = trunc(f32(k * a.cold_atk)); atkB[13] = trunc(f32(k * a.light_atk)); atkB[14] = trunc(f32(k * a.poison_atk));
    U.beforeDamageCalculation(u, tgt, atkB, defB, cloneInfo(info), info);
    U.beforeBeDamageCalculation(tgt, u, defB, atkB, cloneInfo(info), info);
    const r = Script.calAttackDamage(Script.pushUnit(u, atkB), Script.pushUnit(tgt, defB), info.hit, info.crit);
    info.hit = false;
    if (r && typeof r[0] === 'number') {
      for (let i = 0; i < 5; i++) info.dmg[i] = trunc(+r[i] || 0);
      info.hit = true; info.crit = !!r[5];
    }
    U.afterDamageCalculation(u, tgt, cloneInfo(info), info);
    U.afterBeDamageCalculation(tgt, u, cloneInfo(info), info);
    return info;
  },
  // Unit::calSkillDamage(tgt, skillId, mode, type, val, crit, hit)
  calSkillDamage(u, tgt, skill, mode, type, val, crit, hit) {
    const info = newInfo(mode, type); info.skill = skill; info.avg = val; info.crit = !!crit; info.flag12 = !!hit; // +0x12 = dot
    const atkB = new Array(33).fill(0), defB = new Array(33).fill(0);
    const def0 = U.fin(tgt).defense;              // read before the hooks (native order)
    U.beforeDamageCalculation(u, tgt, atkB, defB, cloneInfo(info), info);
    U.beforeBeDamageCalculation(tgt, u, defB, atkB, cloneInfo(info), info);
    const d = type === 0 ? null : U.fin(tgt);
    let atk, def;
    switch (type) {
      case 0: atk = trunc((atkB[1] + atkB[2]) / 2); def = defB[4] + def0; break;
      case 1: atk = atkB[11]; def = defB[7] + d.fire_res; break;
      case 2: atk = atkB[12]; def = defB[8] + d.cold_res; break;
      case 3: atk = atkB[13]; def = defB[9] + d.light_res; break;
      case 4: atk = atkB[14]; def = defB[10] + d.poison_res; break;
      default: atk = 0; def = 0;
    }
    atk = Math.max(0, atk + val); def = Math.max(0, def);
    const lva = U.level(u);
    let v = type === 0 ? Script.calPhysicalDamage(lva, atk, def) : Script.calEleDmg(atk, lva, def, U.level(tgt));
    const idx = type >= 0 && type <= 4 ? type : 0;
    info.dmg[idx] = trunc(v);
    const a = U.fin(u);
    const cr = Script.calCriticalDamage(info.crit, info.dmg[idx], a.critical | 0, a.crit_dam | 0);
    info.dmg[idx] = trunc(cr[0]); info.crit = !!cr[1];
    U.afterDamageCalculation(u, tgt, cloneInfo(info), info);
    U.afterBeDamageCalculation(tgt, u, cloneInfo(info), info);
    return info;
  },
  // Unit::calRecover
  calRecover(u, mode, attr, v) {
    if (v < 1) return 0;
    const out = { v };
    U.afterRecoverCalculation(u, mode, attr, v, out);
    return out.v | 0;
  },
  // Unit::beHurt (MyPlayer::beHurt also triggers the Lua "be damage" story hook)
  beHurt(u, mode, v) {
    const cur = U.hp(u);
    let nv = Math.max(0, cur - v);
    if (v < 0) nv = Math.min(nv, U.fin(u).max_hp);
    U.setHp(u, nv);
    if (U.isHero(u)) Script.triggerBeDamage();
  },
  recoverHP(u, v) { if (v < 1) return 0; const c = U.hp(u); const nv = Math.min(c + v, U.fin(u).max_hp); U.setHp(u, nv); return nv - c; },
  recoverMP(u, v) { if (v < 1) return 0; const c = U.mp(u); const nv = Math.min(c + v, U.fin(u).max_mp); U.setMp(u, nv); return nv - c; },
  drainMP(u, v) { const c = U.mp(u); let nv = Math.max(0, c - v); if (v < 0) nv = Math.min(nv, U.fin(u).max_mp); U.setMp(u, nv); },
  getHPRate(u) { const m = U.fin(u).max_hp; return m > 0 ? f32(f32(U.hp(u)) / f32(m)) : 0; },
  getMPRate(u) { const m = U.fin(u).max_mp; return m > 0 ? f32(f32(U.mp(u)) / f32(m)) : 0; },
};

// ---------------------------------------------------------------- GameController::deal*
export const GC = {
  killHandler: (killer, victim, kmode) => { },  // MyPlayer::onKillUnit + die (set by tower)
  deathClearing: () => { },                      // C_DEATH_CLEARING
  // dealDamageUnit(skill, srcKey, tgtKey, mode, type, val, crit, hit, passOn)
  dealDamageUnit(skill, src, tgt, mode, type, val, crit, hit, passOn) {
    if (!src || !tgt) return 0;
    const info = U.calSkillDamage(src, tgt, skill, mode, type, val, crit, hit);
    const flag = { v: false };
    U.beDamaging(tgt, info, flag);
    const total = sumDmg(info);
    if (total !== 0) U.beHurt(tgt, mode, total);
    View.damage(tgt, mode, type, total, U.hp(tgt), info.crit, flag.v);
    if (0 < total && passOn) U.onDamagedByEnemy(tgt, src, info, total);
    if (U.isDead(src) || U.isDead(tgt)) GC.deathClearing();
    return total;
  },
  // dealHurtUnit(mode, type, unit, val, flag)
  dealHurtUnit(mode, type, u, val, flag) {
    const info = newInfo(mode, type); info.hit = true; info.crit = !!flag; info.dmg[type] = val;
    const total = sumDmg(info);
    if (total !== 0) U.beHurt(u, mode, total);
    View.damage(u, mode, type, total, U.hp(u), !!flag, false);
    if (U.isDead(u)) GC.deathClearing();
    return total;
  },
  // dealRecoverUnit(unit, mode, hp, mp, passOn)
  dealRecoverUnit(u, mode, hp, mp, passOn) {
    const rh = U.calRecover(u, mode, 5, hp), rm = U.calRecover(u, mode, 6, mp);
    const ah = U.recoverHP(u, rh), am = U.recoverMP(u, rm);
    if (0 < ah || 0 < am) { View.recover(u, mode, ah, am); View.attrChanged(u); }
    if (passOn) { if (0 < rh) U.onRecovered(u, mode, 5, ah, rh); if (0 < rm) U.onRecovered(u, mode, 6, am, rm); }
  },
  // dealKillUnit(killer, victim, kmode)
  dealKillUnit(killer, victim, kmode = 0) {
    if (!killer || !victim) return;
    GC.killHandler(killer, victim, kmode);   // onKillUnit (rewards)
    U.onKillEnemy(killer, victim, kmode);
    if (victim.onDie) victim.onDie();          // Unit::die / Monster::die
  },
};
