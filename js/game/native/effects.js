// Generic skill effects (SkillEffectSub.cpp) + SkillMgr::parseSkillUse / use.
import { DB } from '../../engine/db.js';
import {
  f32, trunc, rand01, rand100, View, Script, U, GC, SkillEffect, SkillShortEffect, SkillPeriodEffect,
  BehaviorSleep, SkillAttach, SkillTakeEffect, sumDmg, Units,
} from './core.js';

const unitByKey = k => (k && Units.get(k)) || null;
const keyOf = u => (u ? U.init(u).n.uid : 0);

// ---------------------------------------------------------------- control
export class SkillFaint extends SkillEffect {
  isControl() { return true; }
  onAttachedToUnit(u) { const n = U.addAbnormal(u, 1); View.abnormal(u, 1, true, n); View.bodyEffect('pe-3-3-1', u, 'dp-2', 'faint'); }
  onDetachedFromUnit(u) { const n = U.removeAbnormal(u, 1); View.abnormal(u, 1, false, n); }
}
export class SkillFroze extends SkillEffect {
  constructor(qte) { super(); this.flag = !!qte; }
  isControl() { return true; }
  onAttachedToUnit(u) {
    if (!this.flag || U.qteState(u) !== 1) { const n = U.addAbnormal(u, 2); View.abnormal(u, 2, true, n); View.bodyEffect('pe-3-2-1', u, 'dp-3', 'froze'); }
  }
  onDetachedFromUnit(u) { const n = U.removeAbnormal(u, 2); View.abnormal(u, 2, false, n); }   // native: always removes
}
// ---------------------------------------------------------------- instant
export class SkillSteal extends SkillEffect {
  constructor(rate) { super(); this.rate = f32(rate); }
  onTriggered() { if (rand100() < trunc(this.rate)) View.bottle('red', -1); }
}
export class SkillAction extends SkillEffect {
  constructor(unitKey, idx) { super(); this.unitKey = unitKey; this.idx = idx; this.flag = false; }
  onTriggered() {
    const u = unitByKey(this.unitKey); if (!u) return;
    const spd = this.flag ? f32(U.fin(u).fin_atk_speed) : 100;
    View.action(u, this.idx, f32(f32(spd * U.actionRate(u)) / 100));
  }
}
// SkillDoubleAttack : SkillAction (idx 3, uses attack speed)
export class SkillDoubleAttack extends SkillAction {
  constructor(unitKey, perc) { super(unitKey, 3); this.flag = true; this.perc = f32(f32(perc) / 100); }
  onAttackingEnemy(unit, enemy) { const ok = rand01() <= this.perc; if (ok) this.onTriggered(); return ok; }
}
export class SkillMPLoss extends SkillEffect {
  constructor(src, tgt, loss) { super(); this.src = src; this.tgt = tgt; this.loss = loss | 0; }
  onTriggered() { const u = unitByKey(this.src); if (!u) return; U.drainMP(u, this.loss); View.attrChanged(unitByKey(this.tgt) || u); }
}
export class SkillHurt extends SkillEffect {
  constructor(tgt, mode, type, val) { super(); this.tgt = tgt; this.mode = mode; this.type = type; this.val = val | 0; }
  onTriggered() { const u = unitByKey(this.tgt); if (u) GC.dealHurtUnit(this.mode, this.type, u, this.val, false); }
}
export class SkillRecover extends SkillEffect {
  constructor(mode, unit, hp, mp) { super(); this.mode = mode; this.unit = unit; this.hp = hp | 0; this.mp = mp | 0; this.flag = true; }
  onTriggered() { const u = unitByKey(this.unit); if (u) GC.dealRecoverUnit(u, this.mode, this.hp, this.mp, this.flag); }
}
export class SkillDamage extends SkillEffect {
  constructor(skill, src, tgt, mode, type, val, crit, dot) { super(); Object.assign(this, { skill, src, tgt, mode, type, val: val | 0, crit: !!crit, dot: !!dot }); this.flag = true; }
  onTriggered() { GC.dealDamageUnit(this.skill, unitByKey(this.src), unitByKey(this.tgt), this.mode, this.type, this.val, this.crit, this.dot, this.flag); }
}
export class SkillSuckDamage extends SkillEffect {
  constructor(skill, src, tgt, type, val, suck, crit, dot) { super(); Object.assign(this, { skill, src, tgt, type, val: val | 0, suck: f32(f32(suck) / 100), crit: !!crit, dot: !!dot }); }
  onTriggered() {
    const s = unitByKey(this.src), t = unitByKey(this.tgt); if (!s || !t) return;
    const info = U.calSkillDamage(s, t, this.skill, 1, this.type, this.val, this.crit, this.dot);
    const flag = { v: false };
    U.beDamaging(t, info, flag);
    const total = sumDmg(info);
    if (total !== 0) U.beHurt(t, 1, total);
    View.damage(t, 1, this.type, total, U.hp(t), info.crit, flag.v);
    if (0 < total) { U.onDamagedByEnemy(t, s, info, total); GC.dealRecoverUnit(s, 1, trunc(f32(this.suck * total)), 0, false); }
    if (U.isDead(s) || U.isDead(t)) GC.deathClearing();
  }
}
// SkillAttack(src, tgt, perc, hit, crit, qte, passOn): a normal attack with rate = perc
export class SkillAttack extends SkillEffect {
  constructor(src, tgt, perc, hit, crit, qte, pass) { super(); Object.assign(this, { src, tgt, perc: f32(f32(perc) / 100), hit: !!hit, crit: !!crit, qte: !!qte }); this.flag = !!pass; }
  onTriggered() {
    const s = unitByKey(this.src), t = unitByKey(this.tgt); if (!s || !t) return;
    const qs = U.qteState(s);
    let rate = this.perc;
    if (qs === -1 && this.qte) rate = f32(rate * f32(1.1));
    const info = U.calAttackDamage(s, t, 1, this.hit, this.crit, rate);
    const flag = { v: false };
    let total = 0;
    if (qs === 1 && this.qte) { info.hit = false; }
    else if (info.hit) { U.beDamaging(t, info, flag); total = sumDmg(info); if (total !== 0) U.beHurt(t, 0, total); }
    View.attackHit(s, t, info, flag.v, total);
    if (U.isHero(s) && info.hit) { const f = U.fin(s); if (0 < f.hit_hp || 0 < f.hit_mp) GC.dealRecoverUnit(s, 0, f.hit_hp | 0, f.hit_mp | 0, true); }
    if (info.hit) { U.onHitEnemy(s, t, total, info); if (0 < total && this.flag) U.onDamagedByEnemy(t, s, info, total); }
    if (U.isDead(s) || U.isDead(t)) GC.deathClearing();
  }
}
export class SkillQTE extends SkillEffect {
  constructor(perc) { super(); this.perc = perc | 0; }
  onTriggered() { if (rand100() < this.perc) View.qteStart(); }
}
export class SkillBodyEffect extends SkillEffect {
  constructor(file, unit, slot) { super(); Object.assign(this, { file, unit, slot }); }
  onTriggered() { if (this.unit && this.file) View.bodyEffect(this.file, unitByKey(this.unit), this.slot, ''); }
}
export class SkillSceneEffect extends SkillEffect {
  constructor(file, root, unit, slot) { super(); Object.assign(this, { file, root, unit, slot }); }
  onTriggered() { if (this.file) View.sceneEffect(this.file, this.root, unitByKey(this.unit), this.slot); }
}
export class SkillFlyEffect extends SkillEffect {
  constructor(o) { super(); this.o = o; }
  onTriggered() { if (this.o.file) View.flyEffect({ ...this.o, src: unitByKey(this.o.src), tgt: unitByKey(this.o.tgt) }); }
}
// ---------------------------------------------------------------- attached
export class SkillShield extends SkillEffect {
  constructor(v) { super(); this.v = v | 0; }
  beDamaging(unit, info, flag) {
    if (!(0 < this.v)) return;
    for (let i = 0; i < 5; i++) {
      const d = info.dmg[i];
      if (0 < d) {
        if (this.v < d) { info.dmg[i] = d - this.v; this.v = 0; return; }
        this.v -= d; info.dmg[i] = 0;
      }
    }
  }
}
export class SkillProtect extends SkillEffect {
  beDamaging(unit, info, flag) { info.dmg = [0, 0, 0, 0, 0]; flag.v = true; }
}
export class SkillSpeedUp extends SkillEffect {
  constructor(v) { super(); this.v = v | 0; }
  getActionRateBenefit() { return this.v; }
  onAttachedToUnit(u) { View.actionRate(u); }
  onDetachedFromUnit(u) { View.actionRate(u); }
}
export class SkillSuckRed extends SkillEffect {
  constructor(perc) { super(); this.rate = f32(f32(perc) / 100); }
  onHitEnemy(unit, enemy, dmg) { const v = trunc(f32(this.rate * f32(dmg))); if (0 < v) GC.dealRecoverUnit(unit, 0, v, 0, false); }
}
export class SkillRecoverChange extends SkillEffect {
  constructor(perc) { super(); this.perc = f32(f32(perc) / 100); }
  afterRecoverCalculation(unit, mode, attr, raw, out) { let v = f32(f32(this.perc * f32(raw)) + f32(out.v)); if (v <= 0) v = 0; out.v = trunc(v); }
}
export class SkillDamageBack extends SkillEffect {
  constructor(mode, perc, dam) { super(); this.mode = mode | 0; this.rate = f32(f32(perc) / 100); this.dam = dam | 0; }
  onDamagedByEnemy(unit, enemy, info, dmg) {
    if (info.mode !== this.mode || info.flag12) return;
    let v = trunc(f32(this.rate * f32(dmg))); if (v === 0) v = this.dam;
    if (0 < v) GC.dealHurtUnit(1, 0, enemy, v, false);
  }
}
export class SkillAdditionalAttack extends SkillEffect {
  constructor(a) { super(); this.a = a.map(x => x | 0); }
  beforeDamageCalculation(unit, enemy, atkB) { atkB[1] += this.a[0]; atkB[2] += this.a[0]; atkB[11] += this.a[1]; atkB[12] += this.a[2]; atkB[13] += this.a[3]; atkB[14] += this.a[4]; }
}
// SkillDamageChange / SkillBeDamageChange: per-mode (attack/skill/trap) + per-element percent
function dmgChange(modeF, elemF, raw, info) {
  const fm = modeF[raw.mode] || 0;
  for (let e = 0; e < 5; e++) {
    if (elemF[e] === 0 || raw.dmg[e] === 0) continue;
    const cur = info.dmg[e];
    const d = trunc(f32(f32(-elemF[e] - fm) * f32(raw.dmg[e])));
    info.dmg[e] = Math.abs(cur) <= Math.abs(d) ? 0 : cur - d;
  }
}
const pct6 = a => [0, 1, 2, 3, 4, 5].map(i => f32(f32((a || [])[i] || 0) / 100));
export class SkillDamageChange extends SkillEffect {
  constructor(modes, elems) { super(); this.m = pct6(modes); this.e = pct6(elems).slice(0, 5); }
  afterDamageCalculation(unit, enemy, raw, info) { dmgChange(this.m, this.e, raw, info); }
}
export class SkillBeDamageChange extends SkillEffect {
  constructor(modes, elems) { super(); this.m = pct6(modes); this.e = pct6(elems).slice(0, 5); }
  afterBeDamageCalculation(unit, enemy, raw, info) { dmgChange(this.m, this.e, raw, info); }
}
// attrib benefit / gain (+ weapon condition)
const condOk = (e, unit, attr) => !e.cond || e.cond(unit, attr);
export class SkillAttribBenefit extends SkillEffect {
  constructor(attr, bene) { super(); this.attr = attr | 0; this.bene = bene | 0; this.cond = null; }
  getAttribBenefit(unit, enemy, attr) { return this.attr === attr && condOk(this, unit, attr) ? this.bene : 0; }
  isBuff() { return this.attr - 1 >>> 0 < 20 ? 0 < this.bene : false; }
  isDebuff() { return this.attr - 1 >>> 0 < 20 ? this.bene < 0 : false; }
  onAttachedToUnit(u) { View.attrChanged(u); }
  onDetachedFromUnit(u) { View.attrChanged(u); }
}
export class SkillAttribGain extends SkillEffect {
  constructor(attr, gain) { super(); this.attr = attr | 0; this.gain = f32(gain); this.cond = null; }
  getAttribGain(unit, enemy, attr) { return this.attr === attr && condOk(this, unit, attr) ? this.gain : 0; }
  isBuff() { return this.attr - 1 >>> 0 < 20 ? 0 < this.gain : false; }
  isDebuff() { return this.attr - 1 >>> 0 < 20 ? this.gain < 0 : false; }
  onAttachedToUnit(u) { View.attrChanged(u); }
  onDetachedFromUnit(u) { View.attrChanged(u); }
}
export class SkillBenefit extends SkillEffect {
  constructor(skill, bene) { super(); this.skill = skill >>> 0; this.bene = bene | 0; }
  getSkillBenefit(unit, id) { return this.skill !== 0 && this.skill !== id ? 0 : this.bene; }
}
// weapon gain/benefit condition lambda: unit is the player and its weapon type == weap
const weaponCond = weap => (unit) => !!(unit && unit.isHero && U.weaponType(unit) === weap);

// ---------------------------------------------------------------- single skills registry (filled by single.js)
export const SingleSkills = {};

// ---------------------------------------------------------------- SkillMgr::parseSkillUse
const num = (v, d = 0) => (v == null ? d : +v);
const asInt = (v, d = 0) => (v == null ? d : trunc(+v) | 0);
const asF = (v, d = 0) => (v == null ? d : f32(+v));
const asB = (v, d = false) => (v == null ? d : !!v);
function parseIK(s, caster, enemy) { return s === 'caster' ? keyOf(caster) : s === 'enemy' ? keyOf(enemy) : 0; }

export function parseSkillUse(id, lv, caster, enemy) {
  return parseEffects(Script.skillUse(id, lv, caster, enemy) || [], id, lv, caster, enemy);
}
// the body of SkillMgr::parseSkillUse after the Lua call (also used by web-side callers that build effect lists)
export function parseEffects(list, id, lv, caster, enemy) {
  const tpl = DB.skill.get(+id);
  const persistent = !!(tpl && caster && caster.isHero && +tpl.Type === 3);
  let root = null, last = null;
  const chain = b => { if (!b) return; if (!root) root = b; else last.next = b; last = b; };
  for (const e of list) {
    if (!e || !e.type) continue;
    const src = parseIK(e.src, caster, enemy), tgt = parseIK(e.tgt, caster, enemy);
    const duration = asF(e.duration), period = asF(e.period), loop = asInt(e.loop), uid = asInt(e.unique_id) >>> 0;
    let fx = null, take = false;
    switch (e.type) {
      case 'delay': chain(new BehaviorSleep(asF(e.time))); continue;
      case 'steal': fx = new SkillSteal(asInt(e.rate)); take = true; break;
      case 'froze': fx = new SkillFroze(asB(e.qte)); break;
      case 'faint': fx = new SkillFaint(); break;
      case 'action': fx = new SkillAction(src, asInt(e.idx)); take = true; break;
      case 'shield': fx = new SkillShield(asInt(e.val)); break;
      case 'mp loss': fx = new SkillMPLoss(src, tgt, asInt(e.loss)); take = true; break;
      case 'suck red': fx = new SkillSuckRed(asF(e.perc)); break;
      case 'speed up': fx = new SkillSpeedUp(asInt(e.val)); break;
      case 'qte start': fx = new SkillQTE(asInt(e.perc, 100)); take = true; break;
      case 'fly effect': fx = new SkillFlyEffect({ file: e.file, mode: asInt(e.mode), track: asInt(e.track), dir: asInt(e.dir), src, srcSlot: e.src_slot, tgt, tgtSlot: e.tgt_slot, time: asF(e.time) }); take = true; break;
      case 'skill hurt': fx = new SkillHurt(tgt, 1, asInt(e.elem), asInt(e.val)); take = true; break;
      case 'body effect': fx = new SkillBodyEffect(e.file, src, e.slot); take = true; break;
      case 'suck damage': fx = new SkillSuckDamage(+id, src, tgt, asInt(e.elem), asInt(e.val), asF(e.suck), asB(e.crit), asB(e.dot)); take = true; break;
      case 'attrib gain': fx = new SkillAttribGain(asInt(e.attr), asF(e.gain)); break;
      case 'weapon gain': fx = new SkillAttribGain(asInt(e.attr), asF(e.gain)); fx.cond = weaponCond(asInt(e.weap)); break;
      case 'damage back': fx = new SkillDamageBack(asInt(e.mode), asF(e.perc), asInt(e.dam)); break;
      case 'scene effect': fx = new SkillSceneEffect(e.file, e.root, src, e.slot); take = true; break;
      case 'skill damage': fx = new SkillDamage(+id, src, tgt, 1, asInt(e.elem), asInt(e.val), asB(e.crit), asB(e.dot)); take = true; break;
      case 'skill attack': fx = new SkillAttack(src, tgt, asF(e.perc, 100), asB(e.hit), asB(e.crit), asB(e.qte), asB(e.pass, true)); take = true; break;
      case 'single skill': {
        const C = SingleSkills[asInt(e.id) >>> 0];
        if (!C) { console.warn('single skill, unknown id:', e.id); continue; }
        const r = C.make(e, { id: +id, src, tgt, caster, enemy });
        fx = r.fx; take = !!r.take; break;
      }
      case 'skill recover': fx = new SkillRecover(1, src, asInt(e.hp), asInt(e.mp)); take = true; break;
      case 'double attack': fx = new SkillDoubleAttack(src, asF(e.perc)); break;
      case 'skill benefit': fx = new SkillBenefit(asInt(e.skill) >>> 0, asInt(e.bene)); break;
      case 'attrib benefit': fx = new SkillAttribBenefit(asInt(e.attr), asInt(e.bene)); break;
      case 'recover change': fx = new SkillRecoverChange(asF(e.perc)); break;
      case 'weapon benefit': fx = new SkillAttribBenefit(asInt(e.attr), asInt(e.bene)); fx.cond = weaponCond(asInt(e.weap)); break;
      case 'be damage change': fx = new SkillBeDamageChange([asF(e.attack), asF(e.skill), asF(e.trap)], [asInt(e.physics), asF(e.fire), asF(e.cold), asF(e.light), asF(e.poison)]); break;
      case 'additional attack': fx = new SkillAdditionalAttack([asInt(e.physics), asInt(e.fire), asInt(e.cold), asInt(e.light), asInt(e.poison)]); break;
      case 'cause damage change': fx = new SkillDamageChange([asF(e.attack), asF(e.skill), asF(e.trap)], [asInt(e.physics), asF(e.fire), asF(e.cold), asF(e.light), asF(e.poison)]); break;
      default: console.warn('parse skill, unknown type:', e.type); continue;
    }
    let b;
    const srcU = unitByKey(src);
    if (0 < duration) {
      const w = new SkillShortEffect(duration, fx); w.buffID = uid;
      b = new SkillAttach(false, srcU, w);
    } else if (0 < period) {
      const w = new SkillPeriodEffect(period, loop, fx); w.buffID = uid;
      b = new SkillAttach(false, srcU, w);
    } else if (take) {
      b = new SkillTakeEffect(fx);
    } else {
      fx.buffID = uid;
      b = new SkillAttach(persistent, srcU, fx);
    }
    b.setCondition(keyOf(caster), keyOf(enemy), +id, lv, e.cond || '');
    chain(b);
  }
  return root;
}
// SkillMgr::use(id, lv, caster, enemy)
export function useSkill(id, lv, caster, enemy) {
  if (!caster) return;
  U.init(caster);
  const b = parseSkillUse(id, lv, caster, enemy);
  if (b) caster.n.chain.append(b);
}

// SkillFreeEffect: a SkillEffect whose hooks are std::function callbacks (only the ones that are set run)
export class SkillFreeEffect extends SkillEffect {
  constructor(calls = {}) { super(); this.calls = calls; }
  onAttachingToUnit(u) { const ok = super.onAttachingToUnit(u); return this.calls.attaching ? !!this.calls.attaching(u) : ok; }
  onAttachedToUnit(u) { this.calls.attached?.(u); }
  onDetachedFromUnit(u) { this.calls.detached?.(u); }
  onTriggered() { this.calls.trigger?.(); }
  update(dt) { this.calls.update?.(dt); }
  onArriveFloor(p, f, m) { this.calls.floor?.(); }
  onArriveTile(u, t) { this.calls.tile?.(); }
  beforeDamageCalculation(u, e, a, d, raw, info) { this.calls.before?.(u, e, a, d, raw, info); }
  beforeBeDamageCalculation(u, e, d, a, raw, info) { this.calls.beBefore?.(u, e, d, a, raw, info); }
  afterDamageCalculation(u, e, raw, info) { this.calls.after?.(u, e, raw, info); }
  afterBeDamageCalculation(u, e, raw, info) { this.calls.beAfter?.(u, e, raw, info); }
  beDamaging(u, info, flag) { this.calls.beDamaging?.(u, info, flag); }
  onDamagedByEnemy(u, e, info, dmg) { this.calls.beDamaged?.(u, e, info, dmg); }
  onHitEnemy(u, e, dmg, info) { this.calls.hit?.(u, e, dmg, info); }
  afterRecoverCalculation(u, mode, attr, raw, out) { this.calls.afterRecover?.(u, mode, attr, raw, out); }
}
