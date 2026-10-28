// Combat runtime on top of the SOURCE-EXACT native core (js/game/native/*):
//   AttackBehavior (enterBattle / hit event / anim complete / deathClearing / escape / end),
//   MyPlayer::useSkill + checkUseSkill + cooldowns, GameController::feedbackUseBottle, passives
//   (MyPlayer::resetPassiveSkillEffect), Monster::onEnterBattle and MyPlayer::onKillUnit (exp/gold/return power).
// Everything visual goes through the View bridge implemented here.
import { DB, S } from '../engine/db.js';
import { Audio2 } from '../engine/audio.js';
import { P } from './profile.js';
import { weaponStance } from './stats.js';
import { combatSlots, adventureSkill, ELEM_COLOR } from './skills.js';
import { f32, trunc, U, GC, View, Script, newInfo, sumDmg } from './native/core.js';
import { useSkill, parseEffects } from './native/effects.js';
import { heroUnit, finMPCost, finCooldown, finSkillLevel, skillCondition, resetBattle, bumpStats } from './native/bridge.js';

// names of the monster template "Buff" skills (UI tag only)
export const AFFIX_NAMES = {
  200000: 'Kiên định', 200001: 'Kháng phép', 200002: 'Nhanh nhẹn', 200003: 'Linh hoạt', 200004: 'Cường sinh', 200005: 'Gai góc', 200006: 'Phản xạ',
  200007: 'Hút máu', 200008: 'Hồi phục', 200009: 'Liều lĩnh', 200010: 'Cuồng bạo', 200011: 'Phẫn nộ', 200012: 'Cuồng nhiệt', 200013: 'Tập trung',
  200014: 'Cường hoá lửa', 200015: 'Cường hoá băng', 200016: 'Cường hoá sét', 200017: 'Cường hoá độc', 200018: 'Trúng độc', 200019: 'Hồi máu mạnh',
  200020: 'Kim chung tráo', 200021: 'Phản đòn', 200022: 'Tra tấn', 200023: 'Trấn áp', 200024: 'Phán xét', 200025: 'Khô kiệt', 200026: 'Uy hiếp',
  200027: 'Hộ thuẫn', 200028: 'Đốt mana', 200029: 'Mãnh kích', 200030: 'Đóng băng', 200031: 'Chúc phúc', 200032: 'Nguyền rủa',
};
const RETURN_POWER = { 2: 3, 3: 6, 4: 10 };   // DAT_00efeedc (rank 2..4), other ranks +1

// ---------------------------------------------------------------- passives (MyPlayer::resetPassiveSkillEffect)
export function resetPassives() {
  const h = heroUnit(); U.init(h);
  U.removeAllSkillBuffs(h, false, true);
  for (const id in P.data?.skills || {}) {
    const r = DB.skill.get(+id); if (!r || +r.Type !== 3 || !(P.data.skills[id] > 0)) continue;
    useSkill(+id, finSkillLevel(+id), h, null);
    h.n.chain.update(0);
  }
  bumpStats();
}
// ---------------------------------------------------------------- cooldowns (Cooldown: rest = total - passed)
function cdOf(id) { const n = U.init(heroUnit()).n; n.cds ||= {}; return n.cds[id] ||= { t: 0, p: 0 }; }
export function isCooling(id) { const c = cdOf(id); return 0 < c.t && c.p < c.t; }
export function cooldownLeft(id) { const c = cdOf(id); return isCooling(id) ? { left: c.t - c.p, total: c.t } : { left: 0, total: c.t || 1 }; }
function beginCooldown(id, t) { const c = cdOf(id); c.t = f32(t); c.p = 0; }
function updateCooldowns(dt) { const n = U.init(heroUnit()).n; for (const k in n.cds || {}) { const c = n.cds[k]; c.p = c.p + dt <= c.t ? f32(c.p + dt) : c.t; } }
const usingSkills = () => [...combatSlots().filter(Boolean), adventureSkill()].filter(Boolean);

// ---------------------------------------------------------------- AttackBehavior
// states: 1 approach, 3 battle, 5 escaping, 7 attacker won (walks into the tile), 8 won, 4 attacker died, 6 escaped
class AttackBehavior {
  constructor(C, att, tgt) { this.C = C; this.att = att; this.tgt = tgt; this.state = 0; this.info = new Map(); this.hits = 0; this.t0 = C.now; this.timer = null; }
  other(u) { return u === this.att ? this.tgt : u === this.tgt ? this.att : null; }
  init() {
    this.state = 1; this.t0 = this.C.now;
    U.init(this.att); this.att.n.fighting = true; this.att.n.enemy = this.tgt;   // getEnemy / isInFighting: attacker's chain only
    resetBattle();
    if (U.isHero(this.att) && isNearDeath(this.att)) Audio2.play('dying-1');
    this.enterBattle();   // NOTE: the native approach walk (state 1, half a tile) is visual only and skipped
  }
  enterBattle() {
    const a = this.att, t = this.tgt;
    this.state = 3;
    U.onEnterBattle(a, t); this.C.monsterEnterBattle(a, t);
    U.onEnterBattle(t, a); this.C.monsterEnterBattle(t, a);
    this.info.set(a, U.calAttackDamage(a, t, 0, true, false, 1));
    this.info.set(t, U.calAttackDamage(t, a, 0, false, false, 1));
    this.C.playAttack(a, 4.0);
    this.C.playAttack(t, f32(f32(U.actionRate(t) * U.fin(t).fin_atk_speed) / 100));
  }
  startNewAttack(u) {
    const o = this.other(u); if (!o) return;
    if (u === this.att && !(this.state === 3 || this.state === 5 || this.state === 7)) { this.end(); return; }
    const prev = this.info.get(u) || newInfo();
    this.info.set(u, U.calAttackDamage(u, o, 0, false, false, 1));
    if (!U.onAttackingEnemy(u, o)) this.C.playAttack(u, f32(f32(U.actionRate(u) * U.fin(u).fin_atk_speed) / 100));
    if (U.isMonster(u)) {
      if (Script.monsterAIAction(u, o, prev, this.C.now - this.t0)) this.info.set(u, newInfo());
    }
  }
  onHit(u) {
    const o = this.other(u); if (!o || !(this.state === 5 || this.state === 3)) return;
    this.hits++;
    const stored = this.info.get(u) || newInfo();
    let info = stored;
    if (0 < stored.n) { info = U.calAttackDamage(u, o, 0, false, false, 1); info.n = stored.n; }
    stored.n++;
    const flag = { v: false }; let total = 0;
    if (info.hit) {
      U.beDamaging(o, info, flag);
      total = sumDmg(info);
      if (total !== 0) U.beHurt(o, 0, total);
    }
    View.attackHit(u, o, info, flag.v, total);
    if (U.isHero(o)) View.attrChanged(o);
    if (U.isHero(u) && info.hit) { const f = U.fin(u), hp = f.hit_hp, mp = f.hit_mp; if (0 < hp || 0 < mp) GC.dealRecoverUnit(u, 0, hp, mp, true); }
    if (info.hit) { U.onHitEnemy(u, o, total, info); if (0 < total) U.onDamagedByEnemy(o, u, info, total); }
    this.deathClearing(info);
  }
  deathClearing(info) {
    if (this.state === 4 || this.state === 7 || this.state === 8 || this.done) return;
    if (U.isDead(this.att)) { GC.dealKillUnit(this.tgt, this.att, 0); this.state = 4; this.end(); return; }
    if (U.isDead(this.tgt) && !this.tgt.removed) {
      if (U.isHero(this.att)) {
        const f = U.fin(this.att), hp = f.kill_hp, mp = f.kill_mp;
        if (0 < hp || 0 < mp) GC.dealRecoverUnit(this.att, 0, hp, mp, true);
        if (info && info.crit) View.globalEffect(1);
      }
      GC.dealKillUnit(this.att, this.tgt, 0);
      this.state = 7;
      this.C.winWalk(this);
    }
  }
  escape() {   // msg_C_ESCAPE_BATTLE
    if (this.state !== 3 || U.isDead(this.att)) return;
    this.state = 5;
    this.C.playEscape(this.att);
    this.timer = this.C.after(2, () => {
      if (this.done) return;
      if (!U.isDead(this.att)) {
        this.state = 6;
        U.setHp(this.tgt, U.fin(this.tgt).max_hp);   // the monster recovers completely
        this.C.idle(this.tgt);
        this.end();
      }
    });
  }
  end() {
    if (this.done) return; this.done = true;
    const res = this.state === 4 ? 1 : this.state === 8 ? 0 : 2;
    if (this.timer) this.timer.cancel = true;
    U.onLeaveBattle(this.att, this.tgt, res);
    U.onLeaveBattle(this.tgt, this.att, res);
    this.att.n.chain.cancelAll(); U.init(this.tgt).n.chain.cancelAll();
    this.att.n.fighting = false; this.att.n.enemy = null;
    this.C.onBattleEnd(this, res);
  }
}
const isNearDeath = u => { const hp = U.hp(u); return 0 < hp && hp <= trunc(U.fin(u).max_hp / 5); };

// ---------------------------------------------------------------- Combat (per tower)
export class Combat {
  constructor(tower) { this.t = tower; this.now = 0; this.timers = []; this.ab = null; this.bottleCD = [0, 0]; installView(this); }
  get hero() { return this.t.hero; }
  // ---- accessors kept for UI / pets / traps
  hp(u) { return U.hp(u); }
  mp(u) { return U.mp(u); }
  setHp(u, v) { U.setHp(u, v); }
  setMp(u, v) { U.setMp(u, v); }
  stats(u) { return U.fin(u); }
  after(sec, fn) { const t = { at: this.now + sec, fn }; this.timers.push(t); return t; }
  wait(sec) { return new Promise(res => this.after(sec, res)); }

  // ---- per frame (GameMap::update -> Unit::update for every unit, MyPlayer::update cooldowns / bottle CD)
  update(dt) {
    this.now += dt;
    const due = this.timers.filter(t => t.at <= this.now); this.timers = this.timers.filter(t => t.at > this.now);
    for (const t of due) if (!t.cancel) t.fn();
    updateCooldowns(dt);
    for (let i = 0; i < 2; i++) if (0 < this.bottleCD[i]) this.bottleCD[i] = Math.max(0, f32(this.bottleCD[i] - dt));
    const units = [this.hero, this.t.pet?.unit, ...this.t.units.filter(x => !x.isHero && x.alive)].filter(Boolean);
    for (const u of units) U.update(u, dt);
  }

  // ---- monsters
  setupMonster(m) {
    U.init(m);
    m.affixes = [];   // native has no random elite affixes: elite/boss differ by MonsterStat row (+ boss skill 210023)
    m.hp = U.fin(m).max_hp; m.mp = U.fin(m).max_mp;
  }
  // Monster::onEnterBattle: template Buff skills (lv 1) + boss (rank > 3) skill 210023
  monsterEnterBattle(m, enemy) {
    if (!U.isMonster(m)) return;
    const ids = String(m.rec?.Buff ?? '').split(';').filter(x => x !== '').map(Number);
    for (const id of ids) useSkill(id, 1, m, enemy);
    if (3 < U.rank(m)) useSkill(210023, 1, m, enemy);
  }

  // ---- battle
  startBattle(m) {
    if (this.ab && !this.ab.done) return;
    const ab = new AttackBehavior(this, this.hero, m);
    this.ab = ab; ab.init();
    if (this.t.pet) this.t.pet.fightStart?.(m);
  }
  escape() { if (this.ab && !this.ab.done) this.ab.escape(); }
  inBattle() { return !!(this.ab && !this.ab.done); }
  onBattleEnd(ab, res) {
    if (this.ab === ab) this.ab = null;
    this.t.onBattleEnd(ab.tgt, res === 0 ? 'win' : res === 1 ? 'die' : 'flee');
  }
  winWalk(ab) {   // state 7: the attacker walks into the target tile, then state 8 -> end (win)
    this.t.walkInto(ab.att, ab.tgt, () => { if (ab.done) return; ab.state = 8; ab.end(); });
  }

  // ---- animation plumbing (Unit::notifyChangeState / C_UNIT_ANIM_EVENT / C_UNIT_ANIM_COMPLETE)
  attackAnim(u) { if (u.isHero) { const st = weaponStance(P.data); return (st === 2 || st === 3) ? 'attack-2-3' : 'attack-1-3'; } return 'attack-1-3'; }
  playAnim(u, name, speed) {
    const a = u.actor;
    const done = () => { if (this.ab && !this.ab.done && this.ab.other(u)) this.ab.startNewAttack(u); else this.idle(u); };
    const hit = n => { if (n === 'hit' && this.ab && !this.ab.done) this.ab.onHit(u); };
    if (!a) { this.after(2 / Math.max(0.05, speed), () => { hit('hit'); done(); }); return; }
    a.cur = null;
    const e = a.play(name, false, done, hit);
    if (e) {
      e.timeScale = speed;
      // NON-ORIGINAL safety: a model whose attack animation has no "hit" event would never deal damage
      if (a.hitTime(e.animation?.name || name) == null && /^attack/.test(name)) { const d = a.duration(e.animation?.name || name); this.after(d * 0.6 / Math.max(0.05, speed), () => { if (a.state.getCurrent(0) === e) hit('hit'); }); }
    }
  }
  playAttack(u, speed) { if (U.isAbnormal(u, 1)) return; this.playAnim(u, this.attackAnim(u), speed); }
  playEscape(u) { if (u.actor) { u.actor.cur = null; const e = u.actor.play(u.isHero ? 'run-1-3' : 'stand-1-3', true); if (e) e.timeScale = 3; } }
  idle(u) { if (u.isHero) { if (u.alive) this.t.heroIdle(true); } else if (u.alive && u.actor) { u.actor.cur = null; u.actor.play('stand-1-3', true); } }

  // ---- hero skills (MyPlayer::useSkill)
  castHero(slotIdx) { const id = combatSlots()[slotIdx]; if (id) this.useSkill(id); }
  checkUseSkill(id) {
    const r = DB.skill.get(+id); if (!r) return 2;
    if (!(P.data.skills?.[id] > 0)) return 0xf5;
    if (U.mp(this.hero) < finMPCost(id)) return 0xdd;
    const type = +r.Type;
    if (type === 3) return 0xde;
    if (isCooling(id)) return 0xe0;
    if (type === 2 && !U.isNormalMap(this.t.mapId)) return 0xdf;
    if ((+id === 108001 && +this.t.row?.Content === 5) || U.isControlled(this.hero)) return 0xdf;
    const fighting = this.inBattle();
    if (type === 1 && fighting) return 0;
    if (!fighting && type === 2) return 0;
    return 0xdf;
  }
  useSkill(id, target) {
    const h = this.hero; target ||= this.ab?.tgt || null;
    let code = this.checkUseSkill(id);
    if (code === 0) code = U.isDead(h) ? 0xdf : (target && U.isDead(target)) ? 0xf3 : skillCondition(id, h, target);
    if (code !== 0) { this.t.ui.toast(skillError(code)); return code; }
    const r = DB.skill.get(+id), type = +r.Type;
    const lv = finSkillLevel(id), cost = finMPCost(id);
    if (type === 1) { U.drainMP(h, cost); View.attrChanged(h); useSkill(+id, lv, h, target); }
    else return this.t.useAdventure(id);   // explore skills (108000..108002): ExploreOpBehavior (web map code)
    // FUN_00923234: cooldown for the used skill, 2 s for the others; onUsedSkill
    if (type !== 1) { U.drainMP(h, cost); View.attrChanged(h); }
    for (const sid of usingSkills()) {
      if (sid === +id) beginCooldown(sid, finCooldown(sid));
      else { const c = cooldownLeft(sid); if (!(2 <= c.left)) beginCooldown(sid, 2); }
    }
    if (type === 1 || type === 2) U.onUsedSkill(h, target, +id, cost);
    Audio2.play('player-attack-1-' + (1 + (Math.random() * 5 | 0)), 0.7);
    if (this.t.pet) this.t.pet.onHeroSkill?.(combatSlots().indexOf(+id), target);
    this.t.ui.hud(this.t);
    return 0;
  }
  // after an explore skill (web code path) -> native cooldown bookkeeping
  exploreUsed(id) {
    for (const sid of usingSkills()) { if (sid === +id) beginCooldown(sid, finCooldown(sid)); else { const c = cooldownLeft(sid); if (!(2 <= c.left)) beginCooldown(sid, 2); } }
    U.onUsedSkill(this.hero, null, +id, finMPCost(id));
  }

  // ---- bottles (GameController::feedbackUseBottle)
  useBottle(type) {
    const p = P.data, h = this.hero, k = type === 0 ? 'red' : 'blue';
    if (0 < this.bottleCD[type]) return 0xcc;
    if ((p[k] | 0) < 1) return 0xca;
    let hp = 0, mp = 0;
    if (type === 1) {
      const cur = U.mp(h), mx = U.fin(h).max_mp; if (mx <= cur) return 0xcb;
      p[k]--;
      if (U.onUsingMedicine(h, 999998)) { const v = U.calRecover(h, 3, 6, trunc((mx + 1) / 2)); mp = U.recoverMP(h, v); U.onRecovered(h, 3, 6, mp, v); }
    } else {
      const cur = U.hp(h), mx = U.fin(h).max_hp; if (cur < 1 || mx <= cur) return 0xcb;
      p[k]--;
      if (U.onUsingMedicine(h, 999997)) { const v = U.calRecover(h, 3, 5, trunc((mx + 1) / 2)); hp = U.recoverHP(h, v); U.onRecovered(h, 3, 5, hp, v); }
    }
    this.bottleCD[type] = 2;
    if (0 < hp || 0 < mp) View.recover(h, 3, hp, mp);
    View.attrChanged(h);
    return 0;
  }

  // ---- kill (GC.killHandler = MyPlayer::onKillUnit + Unit::die)
  onKill(killer, victim, kmode) {
    if (U.isMonster(victim) && (U.isHero(killer) || killer?.isPet)) this.t.rewardKill(victim, kmode);
  }

  // ---- web-side helpers kept for pets / traps / items (TODO P1: pets 300xxx and traps are not reversed yet)
  rawHurt(tgt, v, src) { v = trunc(v); if (!tgt || v <= 0) return; GC.dealHurtUnit(1, 0, tgt, v, false); }
  heal(u, v, quiet) { v = trunc(v); if (v > 0) GC.dealRecoverUnit(u, 1, v, 0, false); }
  skillDamage(src, tgt, elem, val) { return GC.dealDamageUnit(0, src, tgt, 1, elem | 0, trunc(val), false, false, true); }
  normalAttack(src, tgt) {   // pet swing: same pipeline as SkillAttack (rate 1)
    const info = U.calAttackDamage(src, tgt, 0, false, false, 1); const flag = { v: false }; let total = 0;
    if (info.hit) { U.beDamaging(tgt, info, flag); total = sumDmg(info); if (total) U.beHurt(tgt, 0, total); }
    View.attackHit(src, tgt, info, flag.v, total);
    if (info.hit) { U.onHitEnemy(src, tgt, total, info); if (0 < total) U.onDamagedByEnemy(tgt, src, info, total); }
    GC.deathClearing();
  }
  run(effs, caster, enemy) { const b = parseEffects(effs, 0, 1, caster, enemy); if (b) U.init(caster).n.chain.append(b); }
  instant(e, caster, enemy) { this.run([e], caster, enemy); U.init(caster).n.chain.update(0); }
  fightStart() { } fightEnd() { }
}

// ---------------------------------------------------------------- error strings (useful_xxx)
function skillError(code) {
  switch (code) {
    case 0xdd: return S('221') || 'Không đủ MP';
    case 0xe0: return S('224') || 'Kỹ năng đang hồi';
    case 0xdf: return S('223') || 'Không thể dùng lúc này';
    case 0xf3: return 'Mục tiêu đã chết';
    default: return '';
  }
}

// ---------------------------------------------------------------- View bridge
function installView(C) {
  const T = () => C.t;
  const elemOf = info => { let best = 0, bv = -Infinity; for (let i = 0; i < 5; i++) if (info.dmg[i] > bv) { bv = info.dmg[i]; best = i; } return best; };
  View.attackHit = (src, tgt, info, absorbed, total) => {
    const t = T(); if (!tgt) return;
    if (!info.hit) { t.floatText(tgt.wx, tgt.wy + 110, 'Trượt', '#cfcfcf', 0.9); return; }
    tgt.hitT = 0.15;
    if (absorbed) { t.floatText(tgt.wx, tgt.wy + 110, '0', '#bfe3ff', 0.9); return; }
    const color = tgt.isHero ? (info.crit ? '#ff6a3a' : '#ff4a4a') : (info.crit ? '#ffcf3a' : ELEM_COLOR[elemOf(info)]);
    t.floatText(tgt.wx, tgt.wy + 110 + Math.random() * 30, (tgt.isHero ? '-' : '') + total + (info.crit ? '!' : ''), color, info.crit ? 1.45 : 1);
    if (src?.isHero) { if (info.crit) Audio2.play('crithit-' + (1 + (Math.random() * 3 | 0)), 0.6); else if (!src.actor?.hasSoundEvents(C.attackAnim(src))) Audio2.play('hit-1-' + (1 + (Math.random() * 13 | 0)), 0.6); }
    else if (tgt.isHero && info.crit) Audio2.play('crithit-' + (1 + (Math.random() * 2 | 0)), 0.6);
    else Audio2.play('hit-2-' + (1 + (Math.random() * 4 | 0)), 0.5);
    t.ui.enemy(C.ab?.tgt || t.fight?.mon); t.ui.hud(t);
  };
  View.damage = (u, mode, type, total, curHp, crit, absorbed) => {
    const t = T(); if (!u) return;
    if (total === 0 && !absorbed) return;
    u.hitT = 0.12;
    t.floatText(u.wx, u.wy + 140 + Math.random() * 30, (u.isHero ? '-' : '') + total + (crit ? '!' : ''), u.isHero ? '#ff4a4a' : (crit ? '#ffcf3a' : ELEM_COLOR[type] || '#fff'), crit ? 1.3 : mode === 1 ? 1.15 : 0.9);
    t.ui.enemy(C.ab?.tgt || t.fight?.mon); t.ui.hud(t);
  };
  View.recover = (u, mode, hp, mp) => {
    const t = T(); if (!u) return;
    if (0 < hp) t.floatText(u.wx, u.wy + 170, '+' + hp, '#5aff7a', 0.85);
    if (0 < mp) t.floatText(u.wx, u.wy + 195, '+' + mp + ' MP', '#6ab8ff', 0.8);
    t.ui.hud(t); t.ui.enemy(C.ab?.tgt || t.fight?.mon);
  };
  View.abnormal = (u, s, on, n) => {
    const t = T(); if (!u) return;
    if (on && n === 1) { if (s === 1) t.floatText(u.wx, u.wy + 200, 'Choáng', '#9fe3ff', 0.9); if (s === 2) t.floatText(u.wx, u.wy + 200, 'Đóng băng', '#9fe3ff', 0.9); }
    // AttackBehavior::msg_C_UNIT_ADD/REMOVE_ABNORMAL (faint only)
    if (s === 1 && C.ab && !C.ab.done && C.ab.other(u)) {
      if (on && n === 1) { U.init(u).n.chain.cancelAll(); C.idle(u); }
      if (!on && n === 0) C.ab.startNewAttack(u);
    }
    if (s === 3 && on) GC.deathClearing();
  };
  View.bodyEffect = (name, u) => { if (u) T().burst(u, 0); };
  View.sceneEffect = (file, root, u) => { if (u) T().burst(u, 0); };
  View.flyEffect = fx => { if (fx.tgt) T().burst(fx.tgt, 0); };
  View.action = (u, idx, speed) => {
    if (!u?.actor) return;
    const name = `skill-${idx}-3`;
    C.playAnim(u, u.actor.has(name) ? name : C.attackAnim(u), speed);
  };
  View.attrChanged = () => { bumpStats(); const t = T(); t.ui.hud(t); };
  View.actionRate = () => { };
  View.bottle = () => { const t = T(); t.ui.hud(t); };
  View.qteStart = () => { };   // TODO: QTE mini game UI
  View.globalEffect = () => { };
  GC.deathClearing = () => { if (C.ab && !C.ab.done) C.ab.deathClearing(null); };
  GC.killHandler = (killer, victim, kmode) => C.onKill(killer, victim, kmode);
}
