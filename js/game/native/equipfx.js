// Equipment properties: EquipEffect_<id> classes (EquipEffect.cpp, libMyGame.so 1.4.1).
// Every base / affix / specialization / gem property of an equipped item is one EquipEffect object.
// p1 = +0x34, p2 = +0x38 (ints), +0x40 / +0x60 = per-object state.
import { DB } from '../../engine/db.js';
import { P } from '../profile.js';
import {
  f32, trunc, rand01, rand100, View, U, GC, Effect, SkillShortEffect, SkillPeriodEffect, Units, MyTimer,
} from './core.js';
import {
  SkillFaint, SkillFroze, SkillRecover, SkillDamage, SkillHurt, SkillShield, SkillAttribGain, SkillAttribBenefit,
  SkillSceneEffect, SkillFlyEffect, SkillBodyEffect, SkillSpeedUp, SkillMPLoss, SkillAttack, SkillSuckDamage, SkillProtect,
  SkillFreeEffect, SkillDamageChange, SkillBeDamageChange, SkillAction,
} from './effects.js';

const keyOf = u => (u ? U.init(u).n.uid : 0);
const pc = v => f32(f32(v) / 100);                       // (float)p / 100.0
const mulT = (a, b) => trunc(f32(f32(a) * f32(b)));       // (int)(a * b)
const lv100 = u => { const l = U.level(u); return l < 101 ? f32(l) : f32(100); };
const addRaw = (info, raw, k, from = 0) => { for (let i = from; i < 5; i++) info.dmg[i] += mulT(k, raw.dmg[i]); };
const subAbs = (info, raw, k) => { for (let i = 0; i < 5; i++) { const d = mulT(k, raw.dmg[i]), c = info.dmg[i]; info.dmg[i] = Math.abs(c) <= Math.abs(d) ? 0 : c - d; } };
const subAbsI = (c, d) => (Math.abs(c) <= Math.abs(d) ? 0 : c - d);
const hasBuff = u => { U.init(u); return u.n.battle.some(e => e.isBuff()); };       // Unit::hasBuff (battle list)
const hasDebuff = u => { U.init(u); return u.n.battle.some(e => e.isDebuff()); };
const isMon = u => !!u && U.isMonster(u);
const rank = u => U.rank(u);
const chance = p => rand100() < (p | 0);                  // (int)(arc4random() % 100) < p
const dmgUnit = (src, tgt, mode, type, val, crit = false, dot = false, pass = false) => GC.dealDamageUnit(0, src, tgt, mode, type, val | 0, crit, dot, pass);
const recoverNow = (mode, u, hp, mp) => { const r = new SkillRecover(mode, keyOf(u), hp, mp); r.onTriggered(); };
const shortFaint = (u, t) => U.addSkillBuff(u, new SkillShortEffect(t, new SkillFaint()), false);
// SkillDamage(0, src, tgt, mode 4, type, val, false, dot=true) with passOn=false, as a SkillPeriodEffect(1, 3)
const dot3 = (src, tgt, type, val) => { const d = new SkillDamage(0, keyOf(src), keyOf(tgt), 4, type, val, false, true); d.flag = false; U.addSkillBuff(tgt, new SkillPeriodEffect(1, 3, d), false); };
const fxPeriod = (u, fx) => { const p = new SkillPeriodEffect(1, 3, fx); p.immediately = true; U.addSkillBuff(u, p, false); };

// ---------------------------------------------------------------- base class
export class EquipEffect extends Effect {
  constructor(id, p1, p2) { super(); this.id = id; this.p1 = p1 | 0; this.p2 = p2 | 0; this.s40 = 0; this.s60 = 0; }
  isFffective() { return true; }
  getAttribBenefit(unit, attr) { return 0; }
  getAttribGain(unit, attr) { return 0; }
  getSkillBenefit(unit, skill) { return 0; }
}
export const EQ = {};
const def = (id, methods) => { EQ[id] = class extends EquipEffect { }; Object.assign(EQ[id].prototype, methods); };
// simple attribute properties
const bene = (attrs, k = 1) => ({ getAttribBenefit(u, a) { return attrs.includes(a) ? k * this.p1 : 0; } });
const gain = (attrs, k = 1) => ({ getAttribGain(u, a) { return attrs.includes(a) ? f32(k * this.p1) : 0; } });
const B = { 1: [3], 3: [1], 4: [2], 5: [5], 7: [6], 9: [4], 11: [7], 12: [8], 13: [9], 14: [10], 15: [7, 8, 9, 10], 21: [16], 22: [15], 23: [17], 24: [18],
  26: [11], 27: [12], 28: [13], 29: [14], 35: [23], 37: [25], 39: [24], 41: [26], 56: [21], 57: [22], 58: [20], 102: [27], 103: [28], 104: [27, 28], 639: [20] };
const G = { 2: [3], 6: [5], 8: [6], 10: [4], 25: [19] };
for (const id in B) def(+id, bene(B[id]));
for (const id in G) def(+id, gain(G[id]));
def(49, gain([29], -1)); def(52, gain([30], -1)); def(611, gain([29], -1));
// skill level properties (getSkillBenefit + isFffective = skill learned) are generated from SKILL_PROPS below

// ---------------------------------------------------------------- 1xx / 2xx
def(112, {   // trap damage -p1%
  afterTrapDamageCalculation(u, dmg, out) { const d = trunc((this.p1 * dmg) / 100); out.v = subAbsI(out.v, d); },
});
def(200, { beforeDamageCalculation(u, e, atkB, defB, raw, info) { if (raw.mode === 0 && U.getHPRate(u) <= pc(this.p1)) info.crit = true; } });
def(201, { getAttribBenefit(u, a) { return u && a === 16 && U.getHPRate(u) <= pc(this.p1) ? this.p2 : 0; } });
def(202, { afterRecoverCalculation(u, mode, attr, raw, out) { if (U.getHPRate(u) <= pc(this.p1)) out.v += trunc((this.p2 * raw) / 100); } });
def(203, {
  afterBeDamageCalculation(u, e, raw, info) {
    if (!(U.getHPRate(u) <= pc(this.p1))) return;
    const c = info.dmg[0], d = f32(pc(this.p2) * f32(raw.dmg[0]));
    info.dmg[0] = f32(Math.abs(c)) <= Math.abs(d) ? 0 : trunc(f32(f32(c) - d));
  },
});
def(204, { getAttribGain(u, a) { return u && a === 30 && U.getHPRate(u) <= pc(this.p1) ? f32(-this.p2) : 0; } });
def(205, { beforeDamageCalculation(u, e, atkB, defB, raw, info) { if (raw.mode === 0 && pc(this.p1) <= U.getHPRate(u)) info.hit = true; } });
def(206, { afterDamageCalculation(u, e, raw, info) { if (pc(this.p1) <= U.getHPRate(u)) for (let i = 0; i < 5; i++) info.dmg[i] += trunc((raw.dmg[i] * 12) / 100); } });
def(210, { afterDamageCalculation(u, e, raw, info) { if (raw.mode === 1 && U.getMPRate(u) <= pc(this.p1)) addRaw(info, raw, pc(this.p2)); } });
def(211, { afterDamageCalculation(u, e, raw, info) { if (raw.mode === 0 && pc(this.p1) <= U.getMPRate(u)) addRaw(info, raw, pc(this.p2)); } });
def(217, {   // potion over-heal -> shield p1% of the excess for 2 s
  onRecovered(u, mode, attr, real, raw) { if (mode === 3 && attr === 5 && 0 < raw - real) U.addSkillBuff(u, new SkillShortEffect(2, new SkillShield(trunc((this.p1 * (raw - real)) / 100))), false); },
});
def(218, {
  afterRecoverCalculation(u, mode, attr, raw, out) {
    if (attr !== 5) return;
    const a = f32(this.p1), hp = f32(U.hp(u)), mx = U.fin(u).max_hp;
    if (rand01() <= f32(f32(a / 100) * f32(f32(1 - f32(hp / f32(mx))) + 1))) out.v += trunc((this.p2 * raw) / 100);
  },
});
def(219, { onRecovered(u, mode) { if (mode === 3 && U.isInFighting(u)) U.addSkillBuff(u, new SkillShortEffect(3, new SkillAttribGain(3, f32(this.p1))), false); } });
def(220, { beforeDamageCalculation(u, e, atkB, defB, raw, info) { if (raw.mode === 0 && U.fin(e).max_hp <= U.hp(e)) info.crit = true; } });
def(221, {
  beforeDamageCalculation(u, e, atkB, defB, raw) { if (raw.mode === 0 && U.fin(e).max_hp <= U.hp(e)) this.s60 = 1; },
  onHitEnemy(u, e) { if (this.s60) { this.s60 = 0; shortFaint(e, 2); } },
});
def(222, { afterDamageCalculation(u, e, raw, info) { if (U.getHPRate(e) <= pc(this.p1)) addRaw(info, raw, pc(this.p2)); } });
def(223, { beforeDamageCalculation(u, e, atkB) { if (!e) return; const a = U.getHPRate(u), b = U.getHPRate(e); if (b <= a) atkB[17] += this.p1; } });
def(224, { afterDamageCalculation(u, e, raw, info) { if (hasBuff(e) || hasDebuff(e)) addRaw(info, raw, pc(this.p1)); } });
def(226, { onDamagedByEnemy(u, e, info, dmg) { if (e && !info.flag12) { const v = trunc(f32(f32(this.p1 * dmg) / 100)); if (0 < v) GC.dealHurtUnit(4, 0, e, v, false); } } });
def(227, { onKillEnemy(u) { recoverNow(4, u, 0, mulT(pc(this.p1), U.fin(u).max_mp)); } });
def(228, { onKillEnemy(u) { recoverNow(4, u, mulT(pc(this.p1), U.fin(u).max_hp), 0); } });
def(229, { onKillEnemy(u) { recoverNow(4, u, mulT(pc(this.p1), U.fin(u).max_hp), 0); recoverNow(4, u, 0, mulT(pc(this.p2), U.fin(u).max_mp)); } });
for (const [id, i] of [[230, 1], [231, 2], [232, 3], [233, 4]]) def(id, {   // element damage taken -p1%
  afterBeDamageCalculation(u, e, raw, info) { const r = raw.dmg[i]; if (0 < r && 0 < info.dmg[i]) info.dmg[i] = subAbsI(info.dmg[i], mulT(pc(this.p1), r)); },
});
for (const [id, t, idx] of [[235, 1, 11], [236, 2, 12], [237, 3, 13], [238, 4, 14]]) def(id, {   // + p1% avg attack as element (attack, or skill of that element)
  beforeDamageCalculation(u, e, atkB, defB, raw) { const avg = U.fin(u).avg_atk; if (raw.mode === 0 || (raw.mode === 1 && raw.type === t)) atkB[idx] += mulT(pc(this.p1), avg); },
});
def(239, { beforeDamageCalculation(u, e, atkB, defB, raw) { const avg = U.fin(u).avg_atk; if (raw.mode >>> 0 < 2) { const v = mulT(pc(this.p1), avg); for (let i = 11; i <= 14; i++) atkB[i] += v; } } });
def(240, { getAttribBenefit(u, a) { return a === 3 ? mulT(pc(this.p1), U.mp(u)) : 0; } });
def(241, { getAttribBenefit(u, a) { return a === 16 ? mulT(pc(this.p1), U.fin(u).critical) : 0; } });
def(242, { getAttribBenefit(u, a) { return u && a === 21 && U.isHero(u) ? mulT(pc(this.p1), U.fin(u).gold_bonus) : 0; } });
def(243, {
  getAttribBenefit(u, a) { return (a - 7) >>> 0 < 4 ? -this.p2 : 0; },
  getAttribGain(u, a) { return a === 4 ? f32(-this.p2) : a === 3 ? f32(this.p1) : 0; },
});
def(244, { getAttribBenefit(u, a) { return a === 15 ? -this.p2 : a === 18 ? this.p1 : 0; } });
def(245, {
  getAttribGain(u, a) { return a === 29 ? f32(this.p2) : 0; },
  afterDamageCalculation(u, e, raw, info) { if (raw.mode === 1) addRaw(info, raw, pc(this.p1)); },
  afterRecoverCalculation(u, mode, attr, raw, out) { if (mode === 1) out.v += mulT(pc(this.p1), raw); },
});
def(246, {
  beforeBeDamageCalculation(u, e, defB, atkB) { atkB[17] -= this.p1; },
  afterBeDamageCalculation(u, e, raw, info) { if (raw.crit) subAbs(info, raw, pc(this.p2)); },
});
def(247, {
  beforeDamageCalculation(u, e, atkB, defB, raw) { if (raw.mode === 0) atkB[17] += this.s60; },
  onHitEnemy(u, e, dmg, info) { if (info.mode === 0) { if (!info.crit) this.s60 += this.p1; else this.s60 = 0; } },
});
def(250, { beforeDamageCalculation(u, e, atkB, defB, raw, info) { if (raw.mode === 0) { const m = U.fin(u).max_hp; if (0 < m && f32(f32(U.hp(u)) / f32(m)) < f32(0.99)) info.hit = true; } } });
def(251, {   // chance p1%: normal-attack damage taken halved
  afterBeDamageCalculation(u, e, raw, info) { if (raw.mode === 0 && chance(this.p1)) for (let i = 0; i < 5; i++) info.dmg[i] = subAbsI(info.dmg[i], trunc(raw.dmg[i] / 2)); },
});
def(254, { afterDamageCalculation(u, e, raw, info) { if (raw.mode === 0) addRaw(info, raw, pc(this.p1)); } });
def(255, { getAttribBenefit(u, a) { return a === 32 ? 10000000 : 0; } });

// equipped items with quality > 3 (Equipment +0x60)
const highQualityCount = () => { let n = 0; for (const it of Object.values(P.data?.equipped || {})) if (it && (it.q | 0) > 3) n++; return n; };
def(257, {
  afterBeDamageCalculation(u, e, raw, info) { if (!U.isHero(u)) return; const k = f32(f32(f32(this.p2) * f32(highQualityCount())) / 100); subAbs(info, raw, k); },
  afterDamageCalculation(u, e, raw, info) { if (!U.isHero(u)) return; const k = f32(f32(highQualityCount() * this.p1) / 100); addRaw(info, raw, k); },
});
for (const [id, i] of [[30, 0], [31, 1], [32, 2], [33, 3], [34, 4]]) def(id, {   // skill damage +p1% for one element
  afterDamageCalculation(u, e, raw, info) { if (raw.mode === 1) info.dmg[i] += trunc((raw.dmg[i] * this.p1) / 100); },
});
const lvRate = (u, p) => f32(f32(p * Math.min(U.level(u), 100)) / 10000);
def(284, {   // damaged (not dot): hurt the enemy lv% * p1
  onDamagedByEnemy(u, e, info) { if (info && !info.flag12) GC.dealHurtUnit(4, 0, e, mulT(f32(lv100(u) / 100), f32(this.p1)), false); },
});
def(288, { afterDamageCalculation(u, e, raw, info) { if (isMon(e) && 1 < rank(e)) addRaw(info, raw, lvRate(u, this.p1)); } });
for (let c = 1; c <= 8; c++) def(288 + c, {   // vs monster category c
  afterDamageCalculation(u, e, raw, info) { if (isMon(e) && monCategory(e, c)) addRaw(info, raw, lvRate(u, this.p1)); },
});
// MonsterTemplate::isCategroyOf(cat)
function monCategory(m, c) { return String(m.rec?.Category ?? '').split(/[;,]/).filter(x => x !== '').map(Number).includes(c); }
const sceneFx = (file, root, u, slot) => View.sceneEffect(file, root, u, slot);
const bodyFx = (file, u, slot = '', tag = '') => View.bodyEffect(file, u, slot, tag);
for (const [id, t, fx] of [[300, 1, 'pe-9-1-1'], [301, 2, 'pe-9-2-1'], [302, 3, 'pe-3-1-1']]) def(id, {
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    dmgUnit(u, e, 4, t, mulT(pc(this.p2), U.fin(u).avg_atk));
    sceneFx(fx, t === 3 ? 'scene_orna' : 'scene_unit', e, t === 3 ? '' : 'dp-1');
  },
});
def(303, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && chance(this.p1)) { GC.dealHurtUnit(4, 0, e, trunc(f32(pc(this.p2) * f32(U.hp(e)))), false); bodyFx('pe-3-4-2', e); } } });
def(304, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && chance(this.p1)) { GC.dealHurtUnit(4, 0, e, mulT(pc(this.p2), U.fin(u).max_hp), false); bodyFx('pe-3-4-2', e); } } });
for (const [id, t, kind, fx] of [[305, 1, 'fly', 'pe-9-1-2'], [306, 2, 'fly', 'pe-9-2-2'], [307, 3, 'scene', 'pe-9-6-1'], [308, 4, 'notify', 'pe-9-7-1'], [309, 0, 'notify', 'pe-9-8-1'], [312, 4, '', '']]) def(id, {
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    dot3(u, e, t, mulT(pc(this.p2), U.fin(u).avg_atk));
    if (kind === 'fly') fxPeriod(e, new SkillFlyEffect({ file: fx, mode: 1, track: 0, dir: 0, src: keyOf(u), srcSlot: 'fx-3', tgt: keyOf(e), tgtSlot: 'dp-1', time: 1 }));
    else if (kind === 'scene') fxPeriod(e, new SkillSceneEffect(fx, 'scene_unit', keyOf(e), ''));
    else if (kind === 'notify') sceneFx(fx, 'scene_unit', e, 'dp-1');
  },
});
def(310, {
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    dot3(u, e, 4, mulT(pc(this.p2), U.fin(u).avg_atk));
    U.addSkillBuff(e, new SkillShortEffect(3, new SkillAttribGain(4, f32(-10))), false);
  },
});
def(311, {
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, 1, mulT(pc(this.p2), U.fin(u).avg_atk), false, true); d.flag = false;
    U.addSkillBuff(e, new SkillPeriodEffect(1, 1, d), false);
  },
});
def(313, {   // gold steal on normal hits, paid when the battle is won
  onEnterBattle() { this.gold = 0; },
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    if (!U.isHero(u) || !isMon(e)) return;
    let k = 30 - this.p1; if (k < 11) k = 10;
    let g = trunc(((e.st?.gold | 0) * k) / 100); if (g < 2) g = 1;
    this.gold = (this.gold | 0) + g;
    View.text(e, `+${g}`, '#ffd34d');
  },
  onLeaveBattle(u, e, res) { if (u && res === 0 && U.isHero(u) && 0 < (this.gold | 0)) { P.data.gold += this.gold; View.attrChanged(u); this.gold = 0; } },
});
def(314, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && chance(this.p1)) U.addSkillBuff(e, new SkillShortEffect(2, new SkillFroze(false)), false); } });
def(315, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && chance(this.p1)) shortFaint(e, 2); } });
const abn = (u, s, on) => { const n = on ? U.addAbnormal(u, s) : U.removeAbnormal(u, s); View.abnormal(u, s, on, n); View.attrChanged(u); };
def(320, {   // chance: 3 s of guaranteed hit + critical
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    U.addSkillBuff(u, new SkillShortEffect(3, new SkillFreeEffect({ before: (a, b, c, d, raw, inf) => { inf.hit = true; inf.crit = true; } })), false);
    bodyFx('pe-9-5-2', u, 'ap-4', 'euqeff320');
  },
});
def(321, {   // chance: 4 s of upper attack (min = max)
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    U.addSkillBuff(u, new SkillShortEffect(4, new SkillFreeEffect({ attached: x => abn(x, 4, true), detached: x => abn(x, 4, false) })), false);
    bodyFx('pe-9-6-1', u, 'ap-4', 'euqeff321');
  },
});
for (const [id, i, fx] of [[323, 1, 'pe-9-6-1'], [324, 2, 'pe-9-13-1'], [325, 3, 'pe-9-14-1'], [326, 4, 'pe-9-18-1']]) def(id, {   // chance: element damage +p2% for 4 s
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    const el = [0, 0, 0, 0, 0]; el[i] = f32(this.p2);
    U.addSkillBuff(u, new SkillShortEffect(4, new SkillDamageChange(null, el)), false);
    bodyFx(fx, u, 'ap-4');
  },
});
def(330, {
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    U.addSkillBuff(e, new SkillShortEffect(4, new SkillAttribGain(4, f32(-this.p2))), false);
    bodyFx('pe-9-9-1', e, 'dp-1');
  },
});
for (const [id, attr] of [[331, 7], [332, 8], [333, 9], [334, 10], [335, 16], [336, 15], [337, 19], [338, 3]]) def(id, {   // chance: enemy attribute -p2% for 4 s
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    U.addSkillBuff(e, new SkillShortEffect(4, new SkillAttribGain(attr, f32(-this.p2))), false);
    bodyFx('pe-9-9-1', e, 'dp-1');
  },
});
def(339, {   // chance: for 4 s every damage the enemy takes adds p2% avg attack lightning
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    const v = mulT(pc(this.p2), U.fin(u).avg_atk);
    U.addSkillBuff(e, new SkillShortEffect(4, new SkillFreeEffect({ beDamaged: (a, b) => GC.dealDamageUnit(0, b, a, 4, 3, v, false, true, false) })), false);
    bodyFx('pe-9-9-1', e, 'dp-1');
  },
});
def(340, {   // chance: enemy takes +p2% normal-attack damage for 4 s
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    U.addSkillBuff(e, new SkillShortEffect(4, new SkillBeDamageChange([f32(this.p2), 0, 0, 0, 0, 0], null)), false);
    bodyFx('pe-9-9-1', e, 'dp-1');
  },
});
def(341, {   // chance: for 4 s each enemy hit heals the attacker p2% of max HP
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    const v = mulT(pc(this.p2), U.fin(u).max_hp);
    U.addSkillBuff(e, new SkillShortEffect(4, new SkillFreeEffect({ hit: (a, b) => recoverNow(4, b, v, 0) })), false);
    bodyFx('pe-9-9-1', e, 'dp-1');
  },
});
def(360, {   // chance: for 4 s each enemy hit hurts itself p2
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !chance(this.p1)) return;
    const v = this.p2;
    U.addSkillBuff(e, new SkillShortEffect(4, new SkillFreeEffect({ hit: a => GC.dealHurtUnit(4, 0, a, v, false) })), false);
    bodyFx('pe-9-9-1', e, 'dp-1');
  },
});
def(361, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0) { U.addSkillBuff(u, new SkillShortEffect(3, new SkillShield(trunc(f32(pc(this.p1) * f32(dmg))))), false); bodyFx('pe-9-3-1', u); } } });
def(36, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0) GC.dealRecoverUnit(u, 4, trunc((info.dmg[0] * this.p1) / 100), 0, false); } });
def(370, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && info.crit) { const p = f32(this.p1); U.addSkillBuff(u, new SkillShortEffect(4, new SkillDamageChange(null, [0, p, p, p, p])), false); bodyFx('pe-9-13-1', u, 'ap-4'); } } });
def(371, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && info.crit) { U.addSkillBuff(u, new SkillShortEffect(4, new SkillAttribGain(19, f32(this.p1))), false); bodyFx('pe-9-12-1', u, 'ap-4'); } } });
def(372, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && info.crit) { U.addSkillBuff(u, new SkillShortEffect(4, new SkillAttribGain(3, f32(this.p1))), false); bodyFx('pe-9-6-1', u, 'ap-4'); } } });
def(373, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && info.crit) { U.addSkillBuff(u, new SkillShortEffect(4, new SkillDamageChange([0, f32(this.p1), 0, 0, 0, 0], null)), false); bodyFx('pe-9-14-1', u, 'ap-4'); } } });
def(374, {   // critical: 4 s of upper attack
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !info.crit) return;
    U.addSkillBuff(u, new SkillShortEffect(4, new SkillFreeEffect({ attached: x => abn(x, 4, true), detached: x => abn(x, 4, false) })), false);
    bodyFx('pe-9-6-1', u, 'ap-4', 'euqeff374');
  },
});
def(375, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && info.crit) dmgUnit(u, e, 4, 0, mulT(pc(this.p1), U.fin(u).avg_atk)); } });
def(376, {   // critical: 2 x cold damage every 2 s (first immediately)
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !info.crit) return;
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, 2, mulT(pc(this.p1), U.fin(u).avg_atk), false, false); d.flag = false;
    const p = new SkillPeriodEffect(2, 2, d); p.immediately = true;
    U.addSkillBuff(e, p, false); bodyFx('pe-3-4-2', e);
  },
});
def(38, { onDamagedByEnemy(u) { const v = U.recoverMP(u, this.p1); if (0 < v) View.recover(u, 4, 0, v); } });
def(390, { onDodgeEnemy(u, e) { dmgUnit(u, e, 4, 0, mulT(pc(this.p1), U.fin(u).avg_atk)); bodyFx('pe-3-4-2', e); } });
const DODGE_KILL = { 2: 50, 3: 25, 4: 10 };   // DAT_00efbac0
def(391, {
  onDodgeEnemy(u, e) {
    const ok = chance(this.p1);
    if (!e || !ok || !isMon(e)) return;
    const f = f32(DODGE_KILL[rank(e)] ?? 100);
    GC.dealHurtUnit(4, 0, e, mulT(f32(f / 100), U.fin(e).max_hp), false); bodyFx('pe-3-4-2', e);
  },
});
def(392, { onDodgeEnemy(u) { U.addSkillBuff(u, new SkillShortEffect(4, new SkillAttribGain(17, f32(this.p1))), false); bodyFx('pe-9-6-1', u, 'ap-4'); } });
def(393, { onDodgeEnemy(u) { const r = new SkillRecover(4, keyOf(u), mulT(pc(this.p1), U.fin(u).max_hp), 0); U.addSkillBuff(u, new SkillPeriodEffect(1, 3, r), false); bodyFx('pe-9-4-1', u); } });
def(400, { onDamagedByEnemy(u) { if (chance(this.p1)) { recoverNow(4, u, mulT(pc(this.p2), U.fin(u).max_hp), 0); bodyFx('pe-9-4-1', u); } } });
def(401, { onDamagedByEnemy(u, e, info) { if (info && !info.flag12 && chance(this.p1)) U.addSkillBuff(e, new SkillShortEffect(2, new SkillFroze(false)), false); } });
def(402, { onDamagedByEnemy(u, e, info) { if (info && !info.flag12 && chance(this.p1)) shortFaint(e, 2); } });
def(403, {   // chance: enemy burns 4 x (heals you 50 MP, deals p2% avg attack lightning)
  onDamagedByEnemy(u, e, info) {
    if (!info || info.flag12 || !chance(this.p1)) return;
    const uk = keyOf(u), ek = keyOf(e), v = mulT(pc(this.p2), U.fin(u).avg_atk);
    U.addSkillBuff(e, new SkillPeriodEffect(1, 4, new SkillFreeEffect({ trigger: () => { recoverNow(4, Units.get(uk), 0, 50); GC.dealDamageUnit(0, Units.get(uk), Units.get(ek), 4, 3, v, false, true, false); } })), false);
    bodyFx('pe-9-16-1', u, 'ap-4');
  },
});
def(404, {
  onDamagedByEnemy(u) {
    if (!chance(this.p1)) return;
    U.addSkillBuff(u, new SkillShortEffect(4, new SkillAttribBenefit(17, 10)), false);
    U.addSkillBuff(u, new SkillShortEffect(4, new SkillAttribGain(3, f32(this.p2))), false);
    bodyFx('pe-9-6-1', u, 'ap-4');
  },
});
def(405, {
  onDamagedByEnemy(u) {
    if (!chance(this.p1)) return;
    const g = new SkillAttribGain(19, f32(15)); g.buffID = 40500; U.addSkillBuff(u, new SkillShortEffect(4, g), false);
    for (const [a, id] of [[7, 40507], [8, 40508], [9, 40509], [10, 40510]]) { const b = new SkillAttribBenefit(a, this.p2); b.buffID = id; U.addSkillBuff(u, new SkillShortEffect(4, b), false); }
    bodyFx('pe-9-12-1', u, 'ap-4');
  },
});
def(406, { onDamagedByEnemy(u) { if (chance(this.p1)) { U.addSkillBuff(u, new SkillShortEffect(2, new SkillProtect()), false); bodyFx('pe-9-3-2', u); } } });
for (const [id, t, fx] of [[407, 1, 'pe-9-1-2'], [408, 2, 'pe-9-2-2']]) def(id, {   // damaged: chance of a delayed element strike back
  onDamagedByEnemy(u, e, info) {
    if (!info || info.flag12 || !chance(this.p1)) return;
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, t, mulT(pc(this.p2), U.fin(u).avg_atk), false, false); d.flag = false;
    U.addSkillBuff(e, new SkillPeriodEffect(1, 1, d), false);
    const p = new SkillPeriodEffect(1, 1, new SkillFlyEffect({ file: fx, mode: 1, track: 0, dir: 0, src: keyOf(u), srcSlot: 'fx-3', tgt: keyOf(e), tgtSlot: 'dp-1', time: 1 })); p.immediately = true;
    U.addSkillBuff(e, p, false);
  },
});
def(409, {
  onDamagedByEnemy(u, e, info) {
    if (!info || info.flag12 || !chance(this.p1)) return;
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, 3, mulT(pc(this.p2), U.fin(u).avg_atk), false, false); d.flag = false;
    U.addSkillBuff(e, new SkillPeriodEffect(1, 1, d), false);
    const p = new SkillPeriodEffect(1, 1, new SkillSceneEffect('pe-9-6-1', 'scene_unit', keyOf(e), '')); p.immediately = true; U.addSkillBuff(e, p, false);
  },
});
def(40, { onKillEnemy(u) { recoverNow(4, u, trunc((this.p1 * U.fin(u).max_hp) / 100), 0); } });
def(42, { onKillEnemy(u) { recoverNow(4, u, 0, mulT(pc(this.p1), U.fin(u).max_mp)); } });
def(410, {
  onDamagedByEnemy(u, e, info) {
    if (!info || info.flag12 || !chance(this.p1)) return;
    U.addSkillBuff(e, new SkillShortEffect(4, new SkillAttribGain(4, f32(-15))), false);
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, 4, mulT(pc(this.p2), U.fin(u).avg_atk), false, true); d.flag = false;
    U.addSkillBuff(e, new SkillPeriodEffect(1, 4, d), false);
    sceneFx('pe-9-7-1', 'scene_unit', e, 'dp-1');
  },
});
def(411, { onDamagedByEnemy(u, e, info) { if (info && !info.flag12 && chance(this.p1)) { U.addSkillBuff(e, new SkillShortEffect(4, new SkillAttribGain(3, f32(-this.p2))), false); bodyFx('pe-9-9-1', e, 'dp-1'); } } });
def(412, { onDamagedByEnemy(u, e, info) { if (info && !info.flag12 && chance(this.p1)) { U.addSkillBuff(e, new SkillShortEffect(4, new SkillAttribBenefit(15, -this.p2)), false); bodyFx('pe-9-9-1', e, 'dp-1'); } } });
def(413, {   // damaged: chance the enemy gets 4 s of lower attack (min damage only)
  onDamagedByEnemy(u, e, info) {
    if (!info || info.flag12 || !chance(this.p1)) return;
    U.addSkillBuff(e, new SkillShortEffect(4, new SkillFreeEffect({ attached: x => abn(x, 5, true), detached: x => abn(x, 5, false) })), false);
    bodyFx('pe-9-9-1', e, 'dp-1');
  },
});
def(420, {
  onDamagedByEnemy(u, e, info) {
    if (!info || info.flag12) return;
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, 3, mulT(pc(this.p1), U.fin(u).avg_atk), false, false); d.flag = false; d.onTriggered();
    sceneFx('pe-3-1-1', 'scene_orna', e, '');
  },
});
const stack5 = s => (s < 5 ? s + 1 : 5);
def(421, {   // stacks (max 5) on being damaged: defense gain s * p1; the first stack slows the enemy -p2% for the battle
  getAttribGain(u, a) { return a === 4 && 0 < this.s60 ? f32(this.s60 * this.p1) : 0; },
  onDamagedByEnemy(u, e, info) { if (!info) return; if (this.s60 === 0) U.addSkillBuff(e, new SkillAttribGain(19, f32(-this.p2)), false); this.s60 = stack5(this.s60); },
  onLeaveBattle() { this.s60 = 0; },
});
def(422, {
  getAttribBenefit(u, a) { return a === 16 && 0 < this.s60 ? this.s60 * this.p1 : 0; },
  afterRecoverCalculation(u, mode, attr, raw, out) { if (0 < this.s60) out.v += trunc((this.p2 * raw * this.s60) / 100); },
  onDamagedByEnemy() { this.s60 = stack5(this.s60); },
  onLeaveBattle() { this.s60 = 0; },
});
def(423, { getAttribGain(u, a) { return a === 19 && 0 < this.s60 ? f32(this.s60 * this.p1) : 0; }, onDamagedByEnemy() { this.s60 = stack5(this.s60); }, onLeaveBattle() { this.s60 = 0; } });
def(424, { getAttribGain(u, a) { return a === 3 && 0 < this.s60 ? f32(this.s60 * this.p1) : 0; }, onDamagedByEnemy() { this.s60 = stack5(this.s60); }, onLeaveBattle() { this.s60 = 0; } });
def(425, { onDamagedByEnemy(u, e, info) { const t = info.type; if ((t - 1) >>> 0 < 4) U.addSkillBuff(u, new SkillShortEffect(3, new SkillAttribBenefit(t + 6, this.p1)), false); } });
def(430, {   // critical taken: 5 s immune to critical hits
  onDamagedByEnemy(u, e, info) {
    if (!info.crit) return;
    U.addSkillBuff(u, new SkillShortEffect(5, new SkillFreeEffect({ beDamaging: (x, inf, flag) => { if (inf.crit) { inf.dmg = [0, 0, 0, 0, 0]; flag.v = true; } } })), false);
    bodyFx('pe-9-3-3', e);
  },
});
def(431, { onDamagedByEnemy(u, e, info) { if (info.crit) { const r = new SkillRecover(4, keyOf(u), mulT(f32(f32(this.p1) / 300), U.fin(u).max_hp), 0); U.addSkillBuff(u, new SkillPeriodEffect(1, 3, r), false); bodyFx('pe-9-4-1', e); } } });
def(432, { onDamagedByEnemy(u, e, info) { if (info.crit && chance(this.p1)) { U.addSkillBuff(u, new SkillShortEffect(2, new SkillProtect()), false); bodyFx('pe-9-3-2', u); } } });
def(43, { beforeDamageCalculation(u, e, atkB, defB) { defB[4] -= this.p1; } });
def(440, { onEnterBattle() { this.s60 = 0; }, afterBeDamageCalculation(u, e, raw, info) { if (this.s60) return; info.hit = false; this.s60 = 1; } });
def(441, { onEnterBattle(u, e) { U.addSkillBuff(u, new SkillShortEffect(3, new SkillAttribGain(19, f32(this.p1))), false); bodyFx('pe-9-12-2', e, 'ap-4'); } });
def(442, { onEnterBattle(u) { U.addSkillBuff(u, new SkillShield(mulT(pc(this.p1), U.fin(u).max_mp)), false); bodyFx('pe-9-3-1', u); } });
def(443, { onEnterBattle(u) { U.addSkillBuff(u, new SkillShortEffect(4, new SkillFreeEffect({ attached: x => abn(x, 4, true), detached: x => abn(x, 4, false) })), false); bodyFx('pe-9-6-1', u, 'ap-4'); } });
def(444, { onEnterBattle(u) { U.addSkillBuff(u, new SkillAttribGain(3, f32(this.p1)), false); U.addSkillBuff(u, new SkillAttribGain(19, f32(this.p2)), false); } });
def(445, { onEnterBattle(u) { U.addSkillBuff(u, new SkillAttribGain(4, f32(this.p1)), false); for (let a = 7; a <= 10; a++) U.addSkillBuff(u, new SkillAttribBenefit(a, this.p2), false); } });
def(446, {   // battle: max HP -p1%, recovery -p2%
  onEnterBattle(u) {
    U.addSkillBuff(u, new SkillAttribGain(5, f32(-this.p1)), false);
    const mx = U.fin(u).max_hp; if (mx < U.hp(u)) U.setHp(u, mx);   // Unit::adjustAttrib
    const k = pc(this.p2);
    U.addSkillBuff(u, new SkillFreeEffect({ afterRecover: (x, mode, attr, raw, out) => { out.v = trunc(f32(f32(out.v) - f32(k * f32(raw)))); } }), false);
  },
});
def(447, { onEnterBattle(u, e) { U.addSkillBuff(e, new SkillAttribGain(4, f32(-this.p1)), false); for (let a = 7; a <= 10; a++) U.addSkillBuff(e, new SkillAttribBenefit(a, -this.p2), false); } });
def(448, { onEnterBattle(u, e) { U.addSkillBuff(e, new SkillAttribGain(15, f32(-this.p1)), false); U.addSkillBuff(e, new SkillAttribGain(19, f32(-this.p2)), false); } });
def(449, { onEnterBattle(u, e) { U.addSkillBuff(e, new SkillAttribGain(3, f32(-this.p1)), false); U.addSkillBuff(e, new SkillAttribBenefit(17, -this.p2), false); } });
for (const [id, i] of [[44, 7], [45, 8], [46, 9], [47, 10]]) def(id, { beforeDamageCalculation(u, e, atkB, defB) { defB[i] -= this.p1; } });
def(450, {   // the first skill of each battle refunds its MP cost
  onEnterBattle() { this.s60 = 0; },
  onUsedSkill(u, e, id, cost) { if (!this.s60) { this.s60 = 1; recoverNow(4, u, 0, cost); bodyFx('pe-9-10-1', u, 'ap-1'); } },
});
def(451, { onEnterBattle(u) { U.addSkillBuff(u, new SkillShortEffect(2, new SkillProtect()), false); bodyFx('pe-9-3-2', u); } });
for (const [id, t] of [[460, 1], [461, 2], [462, 3], [463, 4]]) def(id, {   // battle: element damage every second, element damage +p2%
  onEnterBattle(u, e) {
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, t, mulT(pc(this.p1), U.fin(u).avg_atk), false, false); d.flag = false;
    U.addSkillBuff(u, new SkillPeriodEffect(1, 0, d), false);
    const el = [0, 0, 0, 0, 0]; el[t] = f32(this.p2);
    U.addSkillBuff(u, new SkillDamageChange(null, el), false);
  },
});
const lostK = u => f32(f32(1 - f32(f32(U.hp(u)) / f32(U.fin(u).max_hp))) + 1);
def(464, {   // battle: every 2 s heal p1% defense x (2 - HP rate)
  onEnterBattle(u) {
    const k = pc(this.p1), def = U.fin(u).defense;
    U.addSkillBuff(u, new SkillPeriodEffect(2, 0, new SkillFreeEffect({ trigger: () => recoverNow(4, u, trunc(f32(f32(k * f32(def)) * lostK(u))), 0) })), false);
  },
});
def(465, {   // battle: every 2 s MP p1% avg attack x (2 - HP rate)
  onEnterBattle(u) {
    const k = pc(this.p1), avg = U.fin(u).avg_atk;
    U.addSkillBuff(u, new SkillPeriodEffect(2, 0, new SkillFreeEffect({ trigger: () => recoverNow(4, u, 0, trunc(f32(f32(k * f32(avg)) * lostK(u)))) })), false);
  },
});
def(466, {   // battle: every 2 s drain p1 HP from the enemy
  onEnterBattle(u, e) {
    const ek = keyOf(e), v = this.p1;
    U.addSkillBuff(u, new SkillPeriodEffect(2, 0, new SkillFreeEffect({ trigger: () => { const x = Units.get(ek); if (!x) return; GC.dealHurtUnit(4, 0, x, v, false); GC.dealRecoverUnit(u, 4, v, 0, false); } })), false);
  },
});
def(467, {   // battle: every 2 s (5 x) enemy resistances -p1
  onEnterBattle(u, e) {
    const ek = keyOf(e), v = this.p1;
    U.addSkillBuff(u, new SkillPeriodEffect(2, 5, new SkillFreeEffect({ trigger: () => { const x = Units.get(ek); if (!x) return; for (let a = 7; a <= 10; a++) U.addSkillBuff(x, new SkillAttribBenefit(a, -v), false); } })), false);
  },
});
def(468, {
  onEnterBattle(u, e) {
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, 2, mulT(pc(this.p1), U.fin(u).avg_atk), false, false); d.flag = false;
    U.addSkillBuff(u, new SkillPeriodEffect(1, 0, d), false);
    U.addSkillBuff(e, new SkillAttribGain(19, f32(-this.p2)), false);
  },
});
def(485, { onHitEnemy(u, e, dmg, info) { if (info.mode !== 0) return; const v = trunc(f32(f32(pc(this.p1) * f32(1 - f32(f32(U.hp(u)) / f32(U.fin(u).max_hp)))) * f32(dmg))); if (0 < v) GC.dealRecoverUnit(u, 4, v, 0, false); } });
def(48, { onDamagedByEnemy(u, e, info) { if (info && !info.flag12) GC.dealHurtUnit(4, 0, e, this.p1, false); } });
def(500, { afterDamageCalculation(u, e, raw, info) { if (raw.mode === 1 && raw.crit) info.dmg[1] += mulT(pc(this.p1), raw.dmg[1]); } });
def(501, { onUsedSkill(u, e, id) { if (id === 102001 || id === 114001 || id === 105001) U.addSkillBuff(u, new SkillShortEffect(4, new SkillAttribBenefit(17, this.p1)), false); } });
const SK1 = [102001, 114001, 105001], SK2 = [102002, 114002, 105002], SK3 = [102003, 114003, 105003], SK4 = [102004, 114004, 105004];
const intAdd = (info, raw, p, from = 0, to = 5) => { for (let i = from; i < to; i++) info.dmg[i] = trunc((raw.dmg[i] * p) / 100) + info.dmg[i]; };
const intSub = (info, raw, p) => { for (let i = 0; i < 5; i++) info.dmg[i] = subAbsI(info.dmg[i], trunc((p * raw.dmg[i]) / 100)); };
def(502, { onUsedSkill(u, e, id) { if (SK2.includes(id)) { recoverNow(4, u, 0, mulT(pc(this.p1), U.fin(u).max_mp)); bodyFx('pe-9-15-1', u); } } });
def(503, { onUsedSkill(u, e, id) { if (SK1.includes(id)) U.addSkillBuff(u, new SkillShortEffect(4, new SkillAttribBenefit(18, this.p1)), false); } });
def(50, { afterDamageCalculation(u, e, raw, info) { if (raw.mode === 1) intAdd(info, raw, this.p1); } });
def(510, { onUsedSkill(u, e, id) { if (SK2.includes(id) && chance(this.p1)) U.addSkillBuff(e, new SkillShortEffect(2, new SkillFroze(false)), false); } });
def(511, { beforeDamageCalculation(u, e, atkB, defB, raw) { if (raw.mode === 1 && raw.type === 2) defB[8] -= this.p1; } });
def(512, { onUsedSkill(u, e, id) { if (SK2.includes(id)) U.addSkillBuff(u, new SkillShortEffect(4, new SkillAttribBenefit(18, this.p1)), false); } });
def(51, { afterBeDamageCalculation(u, e, raw, info) { info.dmg[0] = subAbsI(info.dmg[0], trunc((raw.dmg[0] * this.p1) / 100)); } });
def(520, { beforeDamageCalculation(u, e, atkB, defB, raw) { if (raw.mode === 1 && raw.type === 3) defB[17] += this.p1; } });
def(521, { onUsedSkill(u, e, id) { if (SK3.includes(id)) recoverNow(4, u, mulT(pc(this.p1), U.fin(u).max_hp), mulT(pc(this.p2), U.fin(u).max_mp)); } });
def(522, { onUsedSkill(u, e, id) { if (SK3.includes(id) && chance(this.p1)) shortFaint(e, 2); } });
def(530, {
  afterDamageCalculation(u, e, raw, info) {
    if (raw.mode !== 1 || raw.type !== 4) return;
    if (f32(this.p1) <= f32(f32(f32(U.hp(u)) / f32(U.fin(u).max_hp)) * 100)) info.dmg[4] = trunc(f32(f32(pc(this.p2) * f32(raw.dmg[4])) + f32(info.dmg[4])));
  },
});
def(531, { onUsedSkill(u, e, id) { if (SK4.includes(id)) U.addSkillBuff(e, new SkillShortEffect(4, new SkillBeDamageChange([this.p1, 0, 0, 0, 0, 0], null)), false); } });   // VERIFY: modes[2]/[4] stack slots not shown in decomp
def(532, { onUsedSkill(u, e, id) { if (SK4.includes(id)) U.addSkillBuff(e, new SkillShortEffect(3, new SkillDamageChange([-this.p1, -this.p1, 0, 0, 0, 0], null)), false); } });
def(53, { afterRecoverCalculation(u, mode, attr, raw, out) { out.v += trunc((this.p1 * raw) / 100); } });
def(550, { beforeDamageCalculation(u, e, atkB, defB, raw) { if (raw.skill === 114000) atkB[18] += this.p1; } });
def(551, { beforeDamageCalculation(u, e, atkB, defB, raw) { if (raw.skill === 114001) defB[7] -= this.p1; } });
def(552, {
  beforeDamageCalculation(u, e, atkB, defB, raw) {
    if (raw.skill !== 114002) return;
    let v = U.fin(e).fin_atk_speed < 100 ? this.p1 : 0;
    if (U.isAbnormal(e, 2)) v = U.fin(u).critical + v;
    atkB[17] += v;
  },
});
def(553, {
  onUsedSkill(u, e, id) {
    if (id !== 114003) return;
    const sk = keyOf(u), ek = keyOf(e), v = mulT(pc(this.p1), U.fin(u).avg_atk);
    const hit = () => GC.dealDamageUnit(0, Units.get(sk), Units.get(ek), 4, 3, v, false, false, false);
    U.addSkillBuff(e, new SkillShortEffect(4, new SkillFreeEffect({ trigger: hit, beDamaged: (x, y, info) => { if (info && info.mode === 0) hit(); } })), false);
  },
});
def(554, { onHitEnemy(u, e, dmg, info) { if (info.skill === 114004) recoverNow(4, u, mulT(pc(this.p1), dmg), 0); } });
def(555, {   // after skill 114005: next 3 hits taken... (s60 = 3) each -33% and normal attacks heal p1% max HP
  afterDamageCalculation(u, e, raw, info) {
    if (!(0 < this.s60)) return;
    const k = f32(f32(this.s60) * f32(0.33));
    for (let i = 0; i < 5; i++) info.dmg[i] -= mulT(k, raw.dmg[i]);
    if (raw.mode === 0) { recoverNow(4, u, mulT(pc(this.p1), U.fin(u).max_hp), 0); this.s60 -= 1; }
  },
  onLeaveBattle() { this.s60 = 0; },
  onUsedSkill(u, e, id) { if (id === 114005) this.s60 = 3; },
});
def(59, { afterDamageCalculation(u, e, raw, info) { if (isMon(e) && 1 < rank(e)) intAdd(info, raw, this.p1); } });
def(600, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && chance(this.p1)) new SkillAction(keyOf(u), 3).onTriggered(); } });
def(601, {
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0) return;
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, 0, mulT(pc(this.p1), U.fin(u).avg_atk), false, true); d.flag = false;
    U.addSkillBuff(e, new SkillPeriodEffect(1, 5, d), false);
    sceneFx('pe-9-8-1', 'scene_unit', e, 'dp-1');
  },
});
def(602, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0) { U.addSkillBuff(e, new SkillShortEffect(3, new SkillAttribGain(19, f32(-this.p1))), false); bodyFx('pe-9-9-1', e, 'dp-1'); } } });
def(603, {   // once per battle: hit by an attack while HP < p1% -> shield p2% max HP
  onEnterBattle() { this.s60 = 0; },
  onDamagedByEnemy(u, e, info) {
    if (this.s60 || !e || !info || info.mode !== 0) return;
    const mx = U.fin(u).max_hp;
    if (f32(U.hp(u)) < f32(f32(this.p1 * mx) / 100) && !U.isDead(u)) {
      this.s60 = 1; U.addSkillBuff(u, new SkillShield(mulT(pc(this.p2), mx)), false); bodyFx('pe-9-3-1', u);
    }
  },
});
const thorn = { onDamagedByEnemy(u, e, info, dmg) { if (e && !info.flag12) { const v = trunc(f32(f32(this.p1 * dmg) / 100)); if (0 < v) GC.dealHurtUnit(4, 0, e, v, false); } } };
def(604, thorn); def(614, thorn);
def(606, {   // chance p1% when hit: monster loses 100% max HP (elite 25%, boss rank 4 immune)
  onDamagedByEnemy(u, e, info) {
    if (!info || info.flag12 || !chance(this.p1) || !isMon(e)) return;
    const r = rank(e), k = r === 3 ? 25 : r !== 4 ? 100 : 0;
    if (k) { GC.dealHurtUnit(4, 0, e, mulT(pc(k), U.fin(e).max_hp), false); bodyFx('pe-3-4-2', e); }
  },
});
def(607, { afterDamageCalculation(u, e, raw, info) { if (raw.type === 3 && raw.crit) intAdd(info, raw, this.p1); } });
def(608, { onKillEnemy(u) { const f = U.fin(u); recoverNow(4, u, trunc((this.p1 * f.max_hp) / 100), trunc((this.p2 * f.max_mp) / 100)); } });
def(609, { onDamagedByEnemy(u) { if (chance(this.p1)) recoverNow(4, u, trunc((this.p2 * U.fin(u).max_hp) / 100), 0); } });
def(60, { afterDamageCalculation(u, e, raw, info) { if (isMon(e) && monCategory(e, 1)) intAdd(info, raw, this.p1); } });
def(61, { afterDamageCalculation(u, e, raw, info) { if (isMon(e) && monCategory(e, 2)) intAdd(info, raw, this.p1); } });
def(612, { afterDamageCalculation(u, e, raw, info) { intAdd(info, raw, this.p1, 1, 5); } });
def(615, {
  onEnterBattle(u, e) {
    const d = new SkillDamage(0, keyOf(u), keyOf(e), 4, 3, mulT(pc(this.p1), U.fin(u).avg_atk), false, true); d.flag = false;
    U.addSkillBuff(e, new SkillPeriodEffect(1, 0, d), false);
    const p = new SkillPeriodEffect(1, 0, new SkillSceneEffect('pe-9-6-1', 'scene_unit', keyOf(e), '')); p.immediately = true; U.addSkillBuff(e, p, false);
  },
});
def(616, {   // chance on any non-dot hit: kill a monster (rank 1: p1%, rank 2: p2%, rank 3: 2%)
  onHitEnemy(u, e, dmg, info) {
    if (!e || info.flag12 || !isMon(e)) return;
    const r = rank(e); let c;
    if (r === 3) c = 2; else if (r === 2) c = this.p2; else if (r === 1) c = this.p1; else return;
    if (chance(c)) { GC.dealHurtUnit(4, 0, e, U.fin(e).max_hp, false); bodyFx('pe-3-4-2', e); }
  },
});
def(617, {   // battle: +1 stack every 2 s (max 3)
  onEnterBattle() { this.s60 = 0; (this.timer ||= new MyTimer()).initWithDelay(2, 2, 3, () => { this.s60 += 1; }); },
  onLeaveBattle() { this.s60 = 0; this.timer?.cancel(); },
  update(dt) { this.timer?.update(dt); },
  getAttribBenefit(u, a) { return a === 18 && 0 < this.s60 ? this.s60 * this.p2 : 0; },
  // getAttribGain: see hard-attrib section
});
def(618, {
  onUsedSkill(u, e, id) {
    if (!SK3.includes(id) || !chance(this.p1)) return;
    dmgUnit(u, e, 4, 3, mulT(pc(this.p2), U.fin(u).avg_atk));
    sceneFx('pe-3-1-1', 'scene_orna', e, '');
  },
});
def(619, {   // once per battle: skill used with MP < p1% -> MP + p2% max MP
  onEnterBattle() { this.s60 = 0; },
  onUsedSkill(u) {
    if (this.s60 || !(U.getMPRate(u) < pc(this.p1))) return;
    this.s60 = 1; recoverNow(4, u, 0, trunc((this.p2 * U.fin(u).max_mp) / 100)); bodyFx('pe-9-10-1', u, 'ap-1');   // VERIFY: Unit+0x80 read as max MP
  },
});
def(620, {
  onEnterBattle() { this.s60 = 0; },
  onDamagedByEnemy(u, e) {
    if (this.s60 === 0) { U.addSkillBuff(e, new SkillShortEffect(3600, new SkillAttribGain(19, f32(-this.p2))), false); bodyFx('pe-9-9-1', e, 'dp-1'); }
    this.s60 = this.s60 < 3 ? this.s60 + 1 : 3;
  },
  afterBeDamageCalculation(u, e, raw, info) { if (0 < this.s60) intSub(info, raw, this.s60 * this.p1); },
});
def(622, { onEnterBattle(u) { U.addSkillBuff(u, new SkillPeriodEffect(1, 0, new SkillRecover(4, keyOf(u), 0, mulT(pc(this.p1), U.fin(u).max_mp))), false); bodyFx('pe-9-4-1', u); } });
def(623, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && chance(this.p1)) shortFaint(e, 2); } });
// MyPlayer receives C_UNIT_TRIGGER {ek} and forwards it to its effects (onTriggerEffect). VERIFY: MsgCenter::postMsg delivery is synchronous
const postTrigger = ek => { for (const x of [...Units.values()]) if (U.isHero(x)) U.triggerEffect(x, ek); };
// MyPlayer::getFashion(..., slot) / Hero::getEquipmentWithType(t): template id of that item, 0 if none.
// TODO: fashion system not in the web build -> 0. Equipment type index t -> EQUIP_SLOTS[t] (VERIFY)
const fashionTpl = (u, slot) => 0;
const EQ_SLOT_ORDER = ['weapon', 'helm', 'chest', 'glove', 'cuish', 'boot', 'necklace', 'ring1', 'spirit'];
const equipTplOfType = (u, t) => { if (!U.isHero(u)) return 0; const it = P.data?.equipped?.[EQ_SLOT_ORDER[t]]; return it ? +it.id : 0; };
def(625, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && chance(this.p1)) { shortFaint(e, 2); postTrigger('625'); } } });
def(626, { onDamagedByEnemy(u, e, info) { if (info && info.mode === 0 && chance(this.p1)) { U.addSkillBuff(u, new SkillShortEffect(2, new SkillProtect()), false); bodyFx('pe-9-3-2', u); postTrigger('626'); } } });
def(627, { onTriggerEffect(u, name) { if (name === '626') { recoverNow(4, u, mulT(pc(this.p1), U.fin(u).max_hp), 0); bodyFx('pe-9-4-1', u); } } });
def(628, { onTriggerEffect(u, name) { if (name === '625') { U.addSkillBuff(u, new SkillShortEffect(3, new SkillAttribGain(19, f32(this.p1))), false); bodyFx('pe-9-12-1', u, 'ap-4'); } } });
def(629, {   // once per battle: HP < p1% when hit -> protect 2 s
  onEnterBattle() { this.sF0 = 0; }, onLeaveBattle() { this.sF0 = 0; },
  onDamagedByEnemy(u) {
    if (this.sF0) return;
    const r = U.getHPRate(u); let t = this.p1;
    if (fashionTpl(u, 3) === 229032) { const sp = null; if (sp) t = sp.p1; }   // fashion 0x37ea8 special #0 p1 (TODO fashion)
    if (r < f32(f32(t) / 100)) { this.sF0 = 1; U.addSkillBuff(u, new SkillShortEffect(2, new SkillProtect()), false); bodyFx('pe-9-3-2', u); }
  },
});
def(62, { afterDamageCalculation(u, e, raw, info) { if (isMon(e) && monCategory(e, 3)) intAdd(info, raw, this.p1); } });
def(630, {   // first 5 s (7 with fashion 0x37ea9) of a battle: attacks always hit while HP >= p1%
  onEnterBattle(u) { this.sF0 = 0; const t = fashionTpl(u, 3) === 229033 ? 7 : 5; (this.timer ||= new MyTimer()).initWithDelayOneShot(t, () => { this.sF0 = 1; }); },
  onLeaveBattle() { this.sF0 = 0; this.timer?.cancel(); },
  update(dt) { this.timer?.update(dt); },
  beforeDamageCalculation(u, e, atkB, defB, raw, info) { if (!this.sF0 && raw.mode === 0 && pc(this.p1) <= U.getHPRate(u)) info.hit = true; },
});
def(631, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && info.crit && chance(this.p1)) dmgUnit(u, e, 4, 0, mulT(pc(this.p2), U.fin(u).avg_atk)); } });
def(632, {   // fashion 0x35793 only: first attack taken each battle is reduced by 99.99%
  onEnterBattle(u) { this.s60 = -1; if (fashionTpl(u, 2) === 219027) this.s60 = 0; },
  beDamaging(u, info) { if (this.s60 === 0 && info.mode === 0) { this.s60 = 1; for (let i = 0; i < 5; i++) info.dmg[i] = subAbsI(info.dmg[i], trunc(f32(f32(info.dmg[i]) * f32(0.9999)))); } },
});
def(638, {
  beforeDamageCalculation(u, e, atkB, defB, raw) { if (raw.mode === 0 && U.fin(e).max_hp <= U.hp(e)) this.s60 = 1; },
  onHitEnemy(u, e) { if (this.s60) { this.s60 = 0; shortFaint(e, 2.5); } },
});
def(63, { afterDamageCalculation(u, e, raw, info) { if (isMon(e) && monCategory(e, 4)) intAdd(info, raw, this.p1); } });
def(640, {   // hits deal p1% own max HP; lose p2% max HP per second in battle
  onEnterBattle(u) { (this.timer ||= new MyTimer()).initWithPeriodForever(1, () => GC.dealHurtUnit(4, 0, u, trunc((this.p2 * U.fin(u).max_hp) / 100), false)); },
  onLeaveBattle() { this.timer?.cancel(); },
  update(dt) { this.timer?.update(dt); },
  onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && info.hit) dmgUnit(u, e, 4, 0, trunc((this.p1 * U.fin(u).max_hp) / 100)); },
});
def(641, {   // every p1-th hit: fire damage p2% avg attack
  onEnterBattle() { this.s60 = 0; },
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !info.hit) return;
    const n = ++this.s60, k = this.p1 !== 0 ? trunc(n / this.p1) : 0;
    if (n === k * this.p1) { dmgUnit(u, e, 4, 1, trunc((this.p2 * U.fin(u).avg_atk) / 100)); sceneFx('pe-9-1-1', 'scene_unit', e, 'dp-1'); }
  },
});
// Unit+0x80: base max MP (hero: HeroTemplate MaxMP of the level row). VERIFY monsters (Monster::initWithData)
const rawMaxMP = u => (U.isHero(u) ? (rawHeroMP(u) | 0) : U.fin(u).max_mp);
let rawHeroMP = u => U.fin(u).max_mp;
export const setRawHeroMP = fn => { rawHeroMP = fn; };
def(642, {   // hits with MP >= p2%: cold damage p1% current MP, drain p2% base max MP
  onHitEnemy(u, e, dmg, info) {
    if (info.mode !== 0 || !info.hit) return;
    const k = f32(this.p2);
    if (f32(k / 100) <= U.getMPRate(u)) {
      dmgUnit(u, e, 4, 2, trunc((this.p1 * U.mp(u)) / 100));
      U.drainMP(u, trunc(f32(f32(k / 100) * f32(rawMaxMP(u))))); View.attrChanged(u);
    }
    if (equipTplOfType(u, 6) === 303117 && rand100() < 20) {
      U.addSkillBuff(e, new SkillShortEffect(1, new SkillFroze(false)), false);
      U.addSkillBuff(e, new SkillShortEffect(3, new SkillAttribGain(19, f32(-0.1))), false);
    }
    sceneFx('pe-9-2-1', 'scene_unit', e, 'dp-1');
  },
});
def(643, {   // after 5 s in battle: p1% chance to dodge (hit flag cleared)
  onEnterBattle() { this.sF0 = 0; (this.timer ||= new MyTimer()).initWithPeriodForever(5, () => { this.sF0 = 1; this.timer.cancel(); }); },
  onLeaveBattle() { this.sF0 = 0; this.timer?.cancel(); },
  update(dt) { this.timer?.update(dt); },
  afterBeDamageCalculation(u, e, raw, info) { if (this.sF0 && chance(this.p1)) info.hit = false; },
});
def(644, {   // each second: attack speed +n*(p1/100) (permanent), after p2 (+4 with item 0x4c71d) seconds the wearer dies
  onEnterBattle(u) {
    this.sF0 = 0;
    (this.timer ||= new MyTimer()).initWithPeriodForever(1, () => {
      const lim = equipTplOfType(u, 7) === 313117 ? this.p2 + 4 : this.p2;
      if (this.sF0 < lim) U.addSkillBuff(u, new SkillAttribGain(19, f32(this.sF0 * trunc(this.p1 / 100))), false);
      else { GC.dealHurtUnit(4, 0, u, U.fin(u).max_hp + 100, false); bodyFx('pe-3-4-2', u); this.timer.cancel(); }
      this.sF0 += 1;
    });
  },
  onLeaveBattle() { this.timer?.cancel(); },
  update(dt) { this.timer?.update(dt); },
});
def(645, {   // once per battle when HP < p1%. VERIFY: decomp adds the change to the enemy (param_3) with -(p2/100) int division
  onEnterBattle() { this.s60 = 0; },
  onDamagedByEnemy(u, e) {
    if (!(U.getHPRate(u) < pc(this.p1)) || this.s60) return;
    this.s60 = 1; const v = f32(-trunc(this.p2 / 100));
    U.addSkillBuff(e, new SkillShortEffect(6, new SkillBeDamageChange([v, v, v, v, v, 0], null)), false); bodyFx('pe-9-3-1', u);
  },
});
def(646, {   // battle: attack +p1% decaying by 15 each second (exact clamp: x-15 >= 30 ? x-15 : -30)
  onEnterBattle(u) {
    this.sF0 = f32(this.p1);
    (this.timer ||= new MyTimer()).initWithPeriodForever(1, () => {
      const v = f32(this.sF0 - 15); this.sF0 = 30 <= v ? v : -30;
      U.addSkillBuff(u, new SkillShortEffect(1, new SkillAttribGain(3, this.sF0)), false);
    });
    U.addSkillBuff(u, new SkillShortEffect(1, new SkillAttribGain(3, this.sF0)), false);
  },
  onLeaveBattle() { this.timer?.cancel(); },
  update(dt) { this.timer?.update(dt); },
});
for (const [id, c] of [[64, 5], [65, 6], [66, 7], [67, 8]]) def(id, { afterDamageCalculation(u, e, raw, info) { if (isMon(e) && monCategory(e, c)) intAdd(info, raw, this.p1); } });
def(661, {   // battle: enemy attack speed -10% per second (max -30%)
  onEnterBattle(u, e) {
    this.sF0 = 0;
    (this.timer ||= new MyTimer()).initWithPeriodForever(1, () => { if (this.sF0 < 3) this.sF0 += 1; U.addSkillBuff(e, new SkillShortEffect(1, new SkillAttribGain(19, f32(this.sF0 * -10))), false); });
  },
  onLeaveBattle() { this.timer?.cancel(); },
  update(dt) { this.timer?.update(dt); },
});
// Unit+0x78: base max HP (hero: HeroTemplate MaxHP). VERIFY monsters
let rawHeroHP = u => U.fin(u).max_hp;
export const setRawHeroHP = fn => { rawHeroHP = fn; };
def(662, {   // 50% when hit: shield 10% base max HP for 3 s, then 8 s cooldown
  onDamagedByEnemy(u) {
    if (this.sF0 || !(rand100() < 50)) return;
    this.sF0 = 1;
    const mx = U.isHero(u) ? rawHeroHP(u) | 0 : U.fin(u).max_hp;
    U.addSkillBuff(u, new SkillShortEffect(3, new SkillShield(trunc(f32(f32(mx) * f32(0.1))))), false); bodyFx('pe-9-3-3', u);
    (this.timer ||= new MyTimer()).initWithPeriodForever(8, () => { this.sF0 = 0; this.timer.cancel(); });
  },
  onLeaveBattle() { this.sF0 = 0; this.timer?.cancel(); },
  update(dt) { this.timer?.update(dt); },
});
def(663, { afterDamageCalculation(u, e, raw, info) { if (raw.type === 2) intAdd(info, raw, 30); } });
def(664, { beforeDamageCalculation(u, e, atkB, defB, raw, info) { if (U.isAbnormal(e, 2)) info.hit = true; } });
def(665, {   // battle: cold damage 10% max attack every second (passOn)
  onEnterBattle(u, e) {
    (this.timer ||= new MyTimer()).initWithPeriodForever(1, () => {
      dmgUnit(u, e, 4, 2, trunc(f32(f32(U.fin(u).max_atk) * f32(0.1))), false, false, true);
      sceneFx('pe-9-2-1', 'scene_unit', e, 'dp-1');
    });
  },
  onLeaveBattle() { this.timer?.cancel(); },
  update(dt) { this.timer?.update(dt); },
});
def(666, { onHitEnemy(u, e, dmg, info) { if (info.mode === 0 && info.hit && rand100() < 15) { U.addSkillBuff(e, new SkillShortEffect(3, new SkillFroze(false)), false); sceneFx('pe-9-2-1', 'scene_unit', e, 'dp-1'); } } });
for (const [id, t] of [[68, 1], [69, 2], [70, 3], [71, 4]]) def(id, { afterDamageCalculation(u, e, raw, info) { if (raw.type === t) intAdd(info, raw, this.p1); } });
def(99, { getSkillBenefit(u, skill) { return (skill - 108000) >>> 0 < 3 ? 0 : this.p1; } });
// skill level properties 1000..1092: getSkillBenefit(skill) = p1 for that skill; isFffective = MyPlayer::getOwnSkill(skill) != 0
const SKILL_PROPS = { 1000: 100000, 1001: 101000, 1002: 101100, 1003: 102000, 1004: 102001, 1005: 102002, 1006: 102003, 1007: 102004, 1008: 102005, 1009: 103000, 1010: 103001, 1011: 103002, 1012: 103003, 1013: 103100, 1014: 103101, 1015: 103102, 1016: 103103, 1017: 104000, 1018: 104001, 1019: 104002, 1020: 104100, 1021: 104101, 1022: 104102, 1023: 105000, 1024: 105001, 1025: 105002, 1026: 105003, 1027: 105004, 1028: 105005, 1029: 106000, 1030: 106001, 1031: 106002, 1032: 106003, 1033: 106100, 1034: 106101, 1035: 106102, 1036: 107000, 1037: 107001, 1038: 107002, 1039: 107003, 1040: 107004, 1041: 107005, 1042: 107100, 1043: 107101, 1044: 107102, 1045: 108000, 1046: 108001, 1047: 108002, 1048: 109000, 1049: 109001, 1050: 109100, 1051: 109101, 1052: 109102, 1053: 110000, 1054: 110001, 1055: 110002, 1056: 110003, 1057: 110004, 1058: 110005, 1059: 110100, 1060: 110101, 1061: 110102, 1062: 111000, 1063: 111001, 1064: 111002, 1065: 111003, 1066: 111004, 1067: 111005, 1068: 112000, 1069: 112001, 1070: 112002, 1071: 112100, 1072: 112101, 1073: 113000, 1074: 113001, 1075: 113002, 1076: 113003, 1077: 113004, 1078: 113005, 1079: 113101, 1080: 113102, 1081: 113103, 1082: 113104, 1083: 114000, 1084: 114001, 1085: 114002, 1086: 114003, 1087: 114004, 1088: 114005, 1089: 109002, 1090: 112102, 1091: 113100, 1092: 113105 };
for (const id in SKILL_PROPS) {
  const sk = SKILL_PROPS[id];
  def(+id, { getSkillBenefit(u, skill) { return skill === sk ? this.p1 : 0; }, isFffective() { return (P.data?.skills?.[sk] | 0) > 0; } });
}
// level-scaled attributes: (min(level,100)/100) * p1
for (const [id, a] of [[270, 3], [271, 4], [277, 5], [278, 6], [279, 2]]) def(id, { getAttribGain(u, x) { return x === a ? f32(f32(lv100(u) / 100) * f32(this.p1)) : 0; } });
for (const [id, a] of [[272, [7]], [273, [8]], [274, [9]], [275, [10]], [276, [7, 8, 9, 10]], [280, [16]], [281, [15]], [282, [17]], [283, [18]], [285, [21]], [286, [22]], [287, [20]]])
  def(id, { getAttribBenefit(u, x) { return a.includes(x) ? trunc(f32(f32(lv100(u) / 100) * f32(this.p1))) : 0; } });
// lost-HP scaled: (1 - hp/maxHP) * p1
const lostRate = u => f32(1 - f32(f32(U.hp(u)) / f32(U.fin(u).max_hp)));
for (const [id, a] of [[480, 3], [481, 4], [483, 19]]) def(id, { getAttribGain(u, x) { return x === a ? f32(lostRate(u) * f32(this.p1)) : 0; } });
for (const [id, a] of [[482, [7, 8, 9, 10]], [484, [18]]]) def(id, { getAttribBenefit(u, x) { return a.includes(x) ? trunc(f32(lostRate(u) * f32(this.p1))) : 0; } });
def(490, { getAttribGain(u, x) { return x === 29 ? f32(-f32(lostRate(u) * f32(this.p1))) : 0; } });
for (const [id, a] of [[605, 5], [624, 16], [651, 2]]) def(id, { getAttribBenefit(u, x) { return x === a ? trunc(f32(f32(lv100(u) / 100) * f32(this.p1))) : 0; } });
for (const [id, a] of [[610, 4], [621, 19]]) def(id, { getAttribGain(u, x) { return x === a ? f32(f32(lv100(u) / 100) * f32(this.p1)) : 0; } });
EQ[617].prototype.getAttribGain = function (u, a) { return a === 19 && 0 < this.s60 ? f32(this.s60 * this.p1) : 0; };
def(647, {
  getAttribGain(u, a) {
    if (a !== 19) return 0;
    const k = f32(this.p2), r = U.getHPRate(u);
    if (f32(k / 100) <= r) return f32(f32(f32(f32(this.p1) / f32(100 - k)) * f32(1 - r)) * 100);
    return f32(this.p1);
  },
});
// fashion-item properties (value doubled when the matching fashion is worn). TODO fashion system: fashionTpl() = 0
const lvInt100 = u => { const l = U.level(u); return l < 101 ? l : 100; };
for (const [id, a, slot, tpl] of [[634, 21, 1, 0x3308a], [636, 21, 1, 0x3308b]]) def(id, { getAttribBenefit(u, x) { if (!u || !U.isHero(u) || x !== a) return 0; return this.p1 << (fashionTpl(u, slot) === tpl ? 1 : 0); } });
for (const [id, a, slot, tpl] of [[635, 20, 0, 0x1d0fa], [637, 20, 0, 0x1d0fb]]) def(id, {
  getAttribBenefit(u, x) { if (!u || !U.isHero(u) || x !== a) return 0; const v = trunc(f32(f32(this.p1 * lvInt100(u)) / 100)); return v << (fashionTpl(u, slot) === tpl ? 1 : 0); },
});
def(650, { getAttribBenefit(u, a) { this.s60 = 0; return 0; } });   // sums gems of worn fashions (lambda 0117d3e8/0117d458). TODO fashion system
for (const [id, a, slot, k, c, tpl] of [[652, 21, 5, 0.05, 20, 0x1d107], [653, 20, 0, 0.3, 70, 0x1d106], [654, 20, 2, 0.3, 70, 0x1d105], [655, 22, 1, 0.05, 20, 0x1d104],
  [656, 21, 5, 0.1, 40, 0x1d10b], [657, 20, 0, 0.6, 140, 0x1d10a], [658, 20, 2, 0.6, 140, 0x1d109], [659, 22, 1, 0.1, 40, 0x1d108]]) def(id, {
  getAttribBenefit(u, x) { if (!u || !U.isHero(u) || x !== a) return 0; const v = trunc(f32(f32(U.level(u)) * f32(k))) + c; return v << (fashionTpl(u, slot) === tpl ? 1 : 0); },
});
def(660, { getAttribBenefit(u, a) { if (a !== 20) return 0; const l = U.level(u); return l < 101 ? l * 5 : 500; } });
