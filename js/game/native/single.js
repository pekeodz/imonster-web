// "single skill" effects: SkillEffect_<id> classes (SkillEffectSingle.cpp, libMyGame.so 1.4.1).
// Constructor field mapping follows SkillMgr::parseSkillUse case "single skill" exactly (A = +0x30, B = +0x34).
import {
  f32, trunc, rand01, rand100, View, U, GC, SkillEffect, SkillShortEffect, SkillPeriodEffect, MyTimer, Units,
} from './core.js';
import { SingleSkills, SkillFaint, SkillRecover, SkillDamage, SkillMPLoss } from './effects.js';

const keyOf = u => (u ? U.init(u).n.uid : 0);
const byKey = k => (k && Units.get(k)) || null;
const fl = (e, k) => f32(e[k] == null ? 0 : +e[k]);            // Value::asFloat(0)
const it = (e, k) => (e[k] == null ? 0 : trunc(+e[k]) | 0);     // Value::asInt(0)
const mul = (a, b) => trunc(f32(f32(a) * f32(b)));               // (int)(float*float)
const notify = { onAttachedToUnit(u) { View.attrChanged(u); }, onDetachedFromUnit(u) { View.attrChanged(u); } };
// stack-built SkillRecover(mode 1, unit, hp, mp) with passOn=1, triggered at once
const recoverNow = (u, hp, mp) => { const r = new SkillRecover(1, keyOf(u), hp, mp); r.flag = true; r.onTriggered(); };
// new = |cur| <= |d| ? 0 : cur + d   (the "abs clamp" form used by several afterDamage hooks)
const absAdd = (cur, d) => (Math.abs(cur) <= Math.abs(d) ? 0 : cur + d);
const addScaled = (info, raw, k, from = 0) => { for (let i = from; i < 5; i++) info.dmg[i] += mul(k, raw.dmg[i]); };
const monRank = u => (U.isMonster(u) ? U.rank(u) : null);
const lvChance = (a, unit, enemy) => (U.level(enemy) <= U.level(unit) + 3 ? a : f32(a * f32(0.5)));

class S101000 extends SkillEffect {   // arrive floor (normal map): recover A*maxHP, +B red and +B blue bottles
  constructor(A, B) { super(); this.A = A; this.B = B; }
  onArriveFloor(player, floor, mapId) {
    if (!U.isNormalMap(mapId)) return;
    recoverNow(player, mul(this.A, U.fin(player).max_hp), 0);
    U.addBottle(player, 0, this.B); U.addBottle(player, 1, this.B);
    View.bottle(0, 0); View.bottle(1, 0); View.attrChanged(player);
  }
}
class S103000 extends SkillEffect {   // attack += A * defense
  constructor(A) { super(); this.A = A; }
  getAttribBenefit(unit, enemy, attr) { return attr === 3 ? mul(this.A, U.fin(unit).defense) : 0; }
  isBuff() { return true; }
}
Object.assign(S103000.prototype, notify);
class S103103 extends SkillEffect {   // damaged (not dot): hurt enemy A * own defense
  constructor(A) { super(); this.A = A; }
  onDamagedByEnemy(unit, enemy, info) { if (info && !info.flag12) GC.dealHurtUnit(1, 0, enemy, mul(this.A, U.fin(unit).defense), false); }
}
class S104000 extends SkillEffect {   // normal attack: chance A (halved vs enemy lv > lv+3) ignore half defense
  constructor(A) { super(); this.A = A; this.flag34 = false; }
  beforeDamageCalculation(unit, enemy, atkB, defB, raw) {
    if (!unit || !enemy || raw.mode !== 0) return;
    this.flag34 = false;
    if (rand100() < trunc(lvChance(this.A, unit, enemy))) { defB[4] -= trunc(U.fin(enemy).defense / 2); this.flag34 = true; }
  }
  onHitEnemy(unit, enemy) { if (this.flag34) View.bodyEffect('pe-3-5-1', enemy, 'dp-1', ''); }
}
class S104001 extends SkillEffect {   // normal hit: chance A -> 4 elemental hits of 15% avg attack
  constructor(A) { super(); this.A = A; }
  onHitEnemy(unit, enemy, dmg, info) {
    if (!unit || !enemy || info.mode !== 0) return;
    if (!(rand100() < trunc(lvChance(this.A, unit, enemy)))) return;
    const v = trunc(f32(f32(U.fin(unit).avg_atk) * f32(0.15)));
    for (let t = 1; t <= 4; t++) GC.dealDamageUnit(0x19641, unit, enemy, 1, t, v, false, false, false);
    View.bodyEffect('pe-3-4-1', enemy, '', '');
  }
}
class S104002 extends SkillEffect {   // normal hit: chance A -> enemy faint 2s
  constructor(A) { super(); this.A = A; }
  onHitEnemy(unit, enemy, dmg, info) {
    if (!unit || !enemy || info.mode !== 0) return;
    if (rand100() < trunc(lvChance(this.A, unit, enemy))) U.addSkillBuff(enemy, new SkillShortEffect(2, new SkillFaint()), false);
  }
}
class S104100 extends SkillEffect {   // max MP gain A
  constructor(A) { super(); this.A = A; }
  getAttribGain(unit, enemy, attr) { return attr === 6 ? this.A : 0; }
  isBuff() { return true; }
}
Object.assign(S104100.prototype, notify);
class S104101 extends SkillEffect {   // potion (mode 3) recover while fighting: MP potion -> A*maxHP HP, HP potion -> A*maxMP MP
  constructor(A) { super(); this.A = A; }
  onRecovered(unit, mode, attr) {
    if (mode !== 3 || !U.isInFighting(unit)) return;
    if (attr === 6) recoverNow(unit, mul(this.A, U.fin(unit).max_hp), 0);
    else if (attr === 5) recoverNow(unit, 0, mul(this.A, U.fin(unit).max_mp));
  }
}
class S104102 extends SkillEffect {   // damaged while fighting: recover A*maxMP MP
  constructor(A) { super(); this.A = A; }
  onDamagedByEnemy(unit) { if (U.isInFighting(unit)) recoverNow(unit, 0, mul(this.A, U.fin(unit).max_mp)); }
}
class S106000 extends SkillEffect {   // own HP > 70%: deal +A; own HP < 35%: take -A
  constructor(A, B) { super(); this.A = A; this.B = B; }
  afterDamageCalculation(unit, enemy, raw, info) { if (trunc(f32(U.fin(unit).max_hp * f32(0.7))) < U.hp(unit)) addScaled(info, raw, this.A); }
  afterBeDamageCalculation(unit, enemy, raw, info) {
    if (!(U.hp(unit) < trunc(f32(U.fin(unit).max_hp * f32(0.35))))) return;
    for (let i = 0; i < 5; i++) { const d = mul(this.A, raw.dmg[i]); const c = info.dmg[i]; info.dmg[i] = Math.abs(c) <= Math.abs(d) ? 0 : c - d; }
  }
}
class S106001 extends SkillEffect {   // enemy HP > 80%: crit +A; enemy HP < 35%: deal +B
  constructor(A, B) { super(); this.A = A; this.B = B; }
  beforeDamageCalculation(unit, enemy, atkB) { if (enemy && trunc(f32(U.fin(enemy).max_hp * f32(0.8))) < U.hp(enemy)) atkB[17] += this.A; }
  afterDamageCalculation(unit, enemy, raw, info) { if (enemy && U.hp(enemy) < trunc(f32(U.fin(enemy).max_hp * f32(0.35)))) addScaled(info, raw, this.B); }
}
class S106002 extends SkillEffect {   // own HP% <= enemy HP%: hit +A, else enemy defense -B*def
  constructor(A, B) { super(); this.A = A; this.B = B; }
  beforeDamageCalculation(unit, enemy, atkB, defB) {
    if (!enemy) return;
    const a = f32(f32(U.hp(unit)) / f32(U.fin(unit).max_hp)), b = f32(f32(U.hp(enemy)) / f32(U.fin(enemy).max_hp));
    if (a <= b) atkB[15] += this.A; else defB[4] -= mul(this.B, U.fin(enemy).defense);
  }
}
class S106003 extends SkillEffect {   // vs monster rank > 1: hit +A, deal +B
  constructor(A, B) { super(); this.A = A; this.B = B; }
  beforeDamageCalculation(unit, enemy, atkB) { const r = monRank(enemy); if (r != null && 1 < r) atkB[15] += this.A; }
  afterDamageCalculation(unit, enemy, raw, info) { const r = monRank(enemy); if (r != null && 1 < r) addScaled(info, raw, this.B); }
}
class S107100 extends SkillEffect {   // attack speed gain A * lostHP%
  constructor(A) { super(); this.A = A; }
  getAttribGain(unit, enemy, attr) { if (attr !== 19) return 0; const m = U.fin(unit).max_hp; return f32(this.A * f32(f32(m - U.hp(unit)) / f32(m))); }
  isBuff() { return true; }
}
Object.assign(S107100.prototype, notify);
class S107101 extends SkillEffect {   // attack gain A * curMP%
  constructor(A) { super(); this.A = A; }
  getAttribGain(unit, enemy, attr) { if (attr !== 3) return 0; return f32(this.A * f32(f32(U.mp(unit)) / f32(U.fin(unit).max_mp))); }
  isBuff() { return true; }
}
Object.assign(S107101.prototype, notify);
class S107102 extends SkillEffect {   // critical normal hit vs monster rank < 4: chance A*(4-rank)/3 instant death
  constructor(A) { super(); this.A = A; }
  onHitEnemy(unit, enemy, dmg, info) {
    if (!enemy || info.mode !== 0) return;
    const r = monRank(enemy); if (r == null) return;
    if (r < 4 && info.crit && rand01() <= f32(f32(this.A * (4 - r)) / 3)) {
      const n = U.addAbnormal(enemy, 3); View.abnormal(enemy, 3, true, n);
      View.bodyEffect('pe-1-2-1', enemy, '', '');
    }
  }
}
class S109001 extends SkillEffect {   // skill damage +A; certain skills cost +25% MP
  constructor(A) { super(); this.A = A; }
  afterDamageCalculation(unit, enemy, raw, info) {
    if (raw.mode !== 1) return;
    for (let i = 0; i < 5; i++) { const d = trunc(f32(-f32(this.A * f32(raw.dmg[i])))); const c = info.dmg[i]; info.dmg[i] = Math.abs(c) <= Math.abs(d) ? 0 : c - d; }
  }
  onUsedSkill(unit, enemy, id, cost) {
    if ((id - 0x19a28) >>> 0 < 6 || (id - 0x1bd50) >>> 0 < 6 || (id - 0x18e70) >>> 0 < 5) {
      new SkillMPLoss(keyOf(unit), keyOf(enemy), trunc(f32(f32(cost) * f32(0.25)))).onTriggered();
    }
  }
}
class S109002 extends SkillEffect {   // skill damage: enemy defense -A*def, resists -B
  constructor(A, B) { super(); this.A = A; this.B = B; }
  beforeDamageCalculation(unit, enemy, atkB, defB, raw) {
    if (!enemy || raw.mode !== 1) return;
    defB[4] -= mul(this.A, U.fin(enemy).defense);
    for (let i = 7; i <= 10; i++) defB[i] -= this.B;
  }
}
class S110003 extends SkillEffect {   // the next skill used after attaching deals +C, then the buff is removed
  constructor(C) { super(); this.count = 0; this.skill = 0; this.C = C; }
  onUsedSkill(unit, enemy, id) { const c = this.count; this.count = c + 1; this.skill = id; if (0 < c) U.removeSkillBuff(unit, this); }
  afterDamageCalculation(unit, enemy, raw, info) {
    if (this.count === 1 && raw.skill === this.skill) { addScaled(info, raw, this.C); U.removeSkillBuff(unit, this); }
  }
}
class S110101 extends SkillEffect {   // kill (mode 0): recover A*maxHP
  constructor(A) { super(); this.A = A; }
  onKillEnemy(unit, enemy, kmode) { if (kmode === 0) recoverNow(unit, mul(this.A, U.fin(unit).max_hp), 0); }
}
class S110102 extends SkillEffect {   // enter battle: recover A*maxHP every 3s for the whole battle
  constructor(A) { super(); this.A = A; }
  onEnterBattle(unit) {
    const r = new SkillRecover(1, keyOf(unit), mul(this.A, U.fin(unit).max_hp), 0); r.flag = true;
    U.addSkillBuff(unit, new SkillPeriodEffect(3, 0, r), false);
  }
}
class S111000 extends SkillEffect {   // absorb all damage for 5s, then deal absorbed/5 to self each second (x5)
  constructor(A) { super(); this.state = 1; this.absorbed = 0; this.A = A; this.timer = new MyTimer(); }
  onAttachedToUnit(unit) {
    this.state = 0; this.absorbed = 0;
    this.timer.initWithDelay(5, 1, 5, () => {
      if (this.state < 5) { this.state++; GC.dealHurtUnit(1, 0, unit, trunc(this.absorbed / 5), false); }
      else if (this.state === 5) U.removeSkillBuff(unit, this);
    });
  }
  onDetachedFromUnit() { this.timer.cancel(); }
  update(dt) { this.timer.update(dt); }
  afterBeDamageCalculation(unit, enemy, raw, info) {
    if (this.state !== 0) return;
    for (let i = 0; i < 5; i++) if (0 < info.dmg[i]) { this.absorbed += info.dmg[i]; info.dmg[i] = 0; }
  }
}
class S112000 extends SkillEffect {   // light weapon (10): attack gain A; normal hit -> bleed 3 x (avg/6) physical dot
  constructor(A, B) { super(); this.A = A; this.B = B; this.on = false; }
  getAttribGain(unit, enemy, attr) {
    this.on = false;
    if (unit && attr === 3 && U.isHero(unit) && U.weaponType(unit) === 10) { this.on = true; return this.A; }
    return 0;
  }
  isBuff() { return this.on; }
  onHitEnemy(unit, enemy, dmg, info) {
    if (info.mode !== 0) return;
    const d = new SkillDamage(0x1b580, keyOf(unit), keyOf(enemy), 1, 0, trunc(U.fin(unit).avg_atk / 6), false, true); d.flag = true;
    U.addSkillBuff(enemy, new SkillPeriodEffect(1, 3, d), false);
  }
}
Object.assign(S112000.prototype, notify);
const CRUSH_DIV = [4, 8, 8, 16];      // DAT_00f00d5c (monster rank 1..4)
class S112001 extends SkillEffect {   // heavy weapon (11): crit damage +A; normal hit chance B -> hurt curHP/div[rank]
  constructor(A, B) { super(); this.A = A; this.B = B; this.on = false; }
  getAttribBenefit(unit, enemy, attr) {
    this.on = false;
    if (unit && attr === 18 && U.isHero(unit) && U.weaponType(unit) === 11) { this.on = true; return this.A; }
    return 0;
  }
  isBuff() { return this.on; }
  onHitEnemy(unit, enemy, dmg, info) {
    if (info.mode !== 0) return;
    const ok = rand01() <= this.B;
    if (!enemy || !ok) return;
    const r = monRank(enemy); if (r == null || !((r - 1) >>> 0 < 4)) return;
    const div = CRUSH_DIV[r - 1]; const v = div ? trunc(U.hp(enemy) / div) : 0;
    if (0 < v) GC.dealHurtUnit(1, 0, enemy, v, false);
  }
}
Object.assign(S112001.prototype, notify);
class S112002 extends SkillEffect {   // polearm (12): MP cost gain -A; skill damage +B
  constructor(A, B) { super(); this.A = A; this.B = B; this.on = false; }
  getAttribGain(unit, enemy, attr) {
    this.on = false;
    if (unit && attr === 29 && U.isHero(unit) && U.weaponType(unit) === 12) { this.on = true; return f32(-this.A); }
    return 0;
  }
  isBuff() { return this.on; }
  afterDamageCalculation(unit, enemy, raw, info) { if (raw.mode === 1) addScaled(info, raw, this.B); }
}
Object.assign(S112002.prototype, notify);
class S112100 extends SkillEffect {   // while controlled: recover A*maxHP every second
  constructor(A) { super(); this.A = A; this.timer = new MyTimer(); }
  onAttachedToUnit(unit) {
    this.timer.initWithDelay(1, 1, 0, () => { if (U.isControlled(unit)) recoverNow(unit, mul(this.A, U.fin(unit).max_hp), 0); });
  }
  onDetachedFromUnit() { this.timer.cancel(); }
  update(dt) { this.timer.update(dt); }
}
class S112102 extends SkillEffect {   // attack (atkB[3]) + A per buff; defense (defB[4]) + B per debuff (raw p1/p2)
  constructor(A, B) { super(); this.A = A; this.B = B; }
  beforeDamageCalculation(unit, enemy, atkB) {
    let n = 0; U.forEachSkillBuff(unit, e => { if (e.isBuff()) n++; return true; });
    atkB[3] = trunc(f32(f32(this.A * n) + f32(atkB[3])));
  }
  beforeBeDamageCalculation(unit, enemy, defB) {
    let n = 0; U.forEachSkillBuff(unit, e => { if (e.isDebuff()) n++; return true; });
    defB[4] = trunc(f32(f32(this.B * n) + f32(defB[4])));
  }
}
class S113005 extends SkillEffect {   // damaged: recover A * damage
  constructor(A) { super(); this.A = A; }
  onDamagedByEnemy(unit, enemy, info, dmg) { recoverNow(unit, mul(this.A, dmg), 0); }
}
class S113100 extends SkillEffect {   // cannot dodge (incoming attacks forced to hit); defense gain A * dodge
  constructor(A) { super(); this.A = A; }
  getAttribGain(unit, enemy, attr) { return attr === 4 ? f32(this.A * f32(U.fin(unit).dodge)) : 0; }
  beforeBeDamageCalculation(unit, enemy, defB, atkB, raw, info) { info.hit = true; }
  isBuff() { return true; }
}
Object.assign(S113100.prototype, notify);
class S113101 extends SkillEffect {   // potions heal (A+0.5)/10 of max over 5s (10 x 0.5s) instead of instantly
  constructor(A) { super(); this.A = A; }
  onUsingMedicine(unit, itemId) {
    const f = f32(f32(this.A + f32(0.5)) / 10);
    let hp, mp;
    if (itemId === 999998) { hp = 0; mp = mul(f, U.fin(unit).max_mp); }
    else if (itemId === 999997) { hp = mul(f, U.fin(unit).max_hp); mp = 0; }
    else return true;
    const r = new SkillRecover(1, keyOf(unit), hp, mp); r.flag = true;
    U.addSkillBuff(unit, new SkillPeriodEffect(0.5, 10, r), true);
    return false;
  }
}
class S113102 extends SkillEffect {   // all damage loses its physical part; normal attacks get +A elemental
  constructor(A) { super(); this.A = A; }
  afterDamageCalculation(unit, enemy, raw, info) { info.dmg[0] = 0; if (raw.mode !== 0) return; addScaled(info, raw, this.A, 1); }
}
class S113103 extends SkillEffect {   // physical damage taken halved, resists -A; the first hit of each battle misses
  constructor(A) { super(); this.A = A; this.flag = false; }
  getAttribBenefit(unit, enemy, attr) { return (attr - 7) >>> 0 < 4 ? -this.A : 0; }
  onEnterBattle() { this.flag = false; }
  afterBeDamageCalculation(unit, enemy, raw, info) { if (!this.flag) { info.hit = false; this.flag = true; } info.dmg[0] = trunc(info.dmg[0] / 2); }
}
Object.assign(S113103.prototype, notify);
class S113104 extends SkillEffect {   // normal attack -50%, skill damage +A (abs clamp form)
  constructor(A) { super(); this.A = A; }
  afterDamageCalculation(unit, enemy, raw, info) {
    let k; if (raw.mode === 0) k = f32(-0.5); else if (raw.mode === 1) k = this.A; else return;
    for (let i = 0; i < 5; i++) info.dmg[i] = absAdd(info.dmg[i], mul(k, raw.dmg[i]));
  }
}
class S113105 extends SkillEffect {   // deal +A (abs clamp form), take +B
  constructor(A, B) { super(); this.A = A; this.B = B; }
  afterDamageCalculation(unit, enemy, raw, info) { for (let i = 0; i < 5; i++) info.dmg[i] = absAdd(info.dmg[i], mul(this.A, raw.dmg[i])); }
  afterBeDamageCalculation(unit, enemy, raw, info) { addScaled(info, raw, this.B); }
}
class S114004 extends SkillEffect {   // instant: poison skill damage A*avgAtk*(B*lostHP%+1)
  constructor(A, B, skill, src, tgt, type) { super(); Object.assign(this, { A, B, skill, src, tgt, type }); }
  onTriggered() {
    const s = byKey(this.src); if (!s) return;
    const t = byKey(this.tgt); if (!t) return;
    const m = U.fin(t).max_hp; const lost = m !== 0 ? trunc((m - U.hp(t)) * 100 / m) : 0;
    const v = trunc(f32(f32(this.A * f32(U.fin(s).avg_atk)) * f32(f32(this.B * f32(lost)) + 1)));
    GC.dealDamageUnit(this.skill, s, t, 1, this.type, v, false, false, true);
  }
}
class S210030 extends SkillEffect {   // damaged (not dot): A% chance this unit faints for B seconds
  constructor(A, B) { super(); this.A = A; this.B = B; }
  onDamagedByEnemy(unit, enemy, info) {
    if (info && !info.flag12 && rand100() < trunc(this.A)) U.addSkillBuff(unit, new SkillShortEffect(this.B, new SkillFaint()), false);
  }
}
class S210034 extends SkillEffect {   // attack speed gain = HP rate
  getAttribGain(unit, enemy, attr) { return attr === 19 ? U.getHPRate(unit) : 0; }
}

// id -> make(e, ctx) -> { fx, take }
const P1 = e => fl(e, 'p1'), P2 = e => fl(e, 'p2');
const pc = v => f32(v / 100);
const A = (C, fa) => ({ make: e => ({ fx: new C(fa(e)) }) });
const AB = (C, fa, fb) => ({ make: e => ({ fx: new C(fa(e), fb(e)) }) });
Object.assign(SingleSkills, {
  101000: AB(S101000, e => pc(P1(e)), e => it(e, 'p2')),
  103000: A(S103000, e => pc(P1(e))),
  103103: A(S103103, e => pc(P1(e))),
  104000: A(S104000, P1),
  104001: A(S104001, P1),
  104002: A(S104002, P1),
  104100: A(S104100, P1),
  104101: A(S104101, e => pc(P1(e))),
  104102: A(S104102, e => pc(P1(e))),
  106000: AB(S106000, e => pc(P1(e)), e => pc(P2(e))),
  106001: AB(S106001, e => it(e, 'p1'), e => pc(P2(e))),
  106002: AB(S106002, e => it(e, 'p1'), e => pc(P2(e))),
  106003: AB(S106003, e => it(e, 'p2'), e => pc(P1(e))),
  107100: A(S107100, e => f32(it(e, 'p1'))),
  107101: A(S107101, P1),
  107102: A(S107102, e => pc(P1(e))),
  109001: A(S109001, e => pc(P1(e))),
  109002: AB(S109002, e => pc(P1(e)), e => trunc(P1(e))),
  110003: A(S110003, e => pc(P1(e))),
  110101: A(S110101, e => pc(P1(e))),
  110102: A(S110102, e => pc(P1(e))),
  111000: A(S111000, e => pc(P1(e))),
  112000: AB(S112000, P1, e => pc(P2(e))),
  112001: AB(S112001, e => it(e, 'p1'), e => pc(P2(e))),
  112002: AB(S112002, P1, e => pc(P2(e))),
  112100: A(S112100, e => pc(P1(e))),
  112102: AB(S112102, P1, P2),
  113005: A(S113005, e => pc(P1(e))),
  113100: A(S113100, e => pc(P1(e))),
  113101: A(S113101, e => pc(P1(e))),
  113102: A(S113102, e => pc(P1(e))),
  113103: A(S113103, e => it(e, 'p1')),
  113104: A(S113104, e => pc(P1(e))),
  113105: AB(S113105, e => pc(P1(e)), e => pc(P1(e))),
  114004: { make: (e, c) => ({ fx: new S114004(pc(P1(e)), pc(P2(e)), c.id >>> 0, c.src, c.tgt, 4), take: true }) },
  210030: AB(S210030, e => fl(e, 'faintRate'), e => fl(e, 'faintTime')),
  210034: { make: () => ({ fx: new S210034() }) },
});
export const SINGLE_IDS = Object.keys(SingleSkills).map(Number);
