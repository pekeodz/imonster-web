// Combat runtime on top of the SOURCE-EXACT native core (js/game/native/*):
//   AttackBehavior (enterBattle / hit event / anim complete / deathClearing / escape / end),
//   MyPlayer::useSkill + checkUseSkill + cooldowns, GameController::feedbackUseBottle, passives
//   (MyPlayer::resetPassiveSkillEffect), Monster::onEnterBattle and MyPlayer::onKillUnit (exp/gold/return power).
// Everything visual goes through the View bridge implemented here.
import { DB, S } from '../engine/db.js';
import { Audio2 } from '../engine/audio.js';
import { P } from './profile.js';
import { combatSlots, adventureSkill, ELEM_COLOR } from './skills.js';
import { f32, trunc, U, GC, View, Script, newInfo, sumDmg, MyTimer } from './native/core.js';
import { UV, ST, OPPOSITE } from './native/unitview.js';
import { arc4random } from '../engine/nativerng.js';
import { SpineActor } from '../engine/spinekit.js';
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

// ---------------------------------------------------------------- AttackBehavior (AttackBehavior.cpp)
// LocalTime::getCurrentSeconds: gettimeofday as a double (sec + usec*1e-6); AI `_time` = now - AttackBehavior+0x40 (wall clock)
const wallSeconds = () => Date.now() / 1000;
const MOVE_SPEED = 375.0;   // Unit::getMoveSpeed (0x43bb8000)
// AttackBehavior::init meeting offsets (DAT_00ef6d5c / 6d6c / 6d7c) and attacker direction (DAT_00ef6d8c), index 0..3 =
// target above / below / left / right of the attacker (native y axis points up; web world y points up as well)
const MEET_AX = [f32(-30.000002), f32(-30.000002), f32(30.000002), f32(-30.000002)];
const MEET_AY = [-20, 20, 0, 0];
const MEET_TX = [20, 20, -20, 20];
const MEET_DIR = [4, 4, 3, 4];
// AudioMgr::randSound(list, n): arc4random() % n, empty entries play nothing
function randSound(list) { const n = list[arc4random() % list.length]; if (n) Audio2.play(n); }
const DEBUG_AB = false;
const dlog = (...a) => { if (DEBUG_AB) console.log('[AB]', ...a); };
// states: 1 approach, 3 battle, 4 attacker died, 5 escaping, 6 escaped, 7 attacker won (walks into the tile), 8 won
class AttackBehavior {
  constructor(C, att, tgt) {
    this.C = C; this.att = att; this.tgt = tgt;
    this.state = 0; this.info = new Map(); this.hits = 0; this.t0 = 0; this.timer = null; this.done = false;
    this.meetA = null; this.meetT = null; this.attTile = null; this.tgtTile = null;
  }
  other(u) { return u === this.att ? this.tgt : u === this.tgt ? this.att : null; }
  has(u) { return u === this.att || u === this.tgt; }
  // positions of the two units (Unit::getMapPosition) and their tiles
  // shared by AttackBehavior::init and FightBehavior::init
  begin() {
    const a = this.att, t = this.tgt;
    if (!a || !t) { console.error('[AB] check failed: _attacker && _target'); return false; }
    if (Math.abs(a.x - t.x) + Math.abs(a.y - t.y) !== 1) { console.error('[AB] check failed: dist == 1'); return false; }
    this.t0 = wallSeconds(); this.state = 1;
    U.init(a); a.n.fighting = true; a.n.enemy = t; U.init(t);
    const dx = f32(t.wx - a.wx), dy = f32(t.wy - a.wy);
    let i;
    if (0 <= dx) i = 0 < dy ? (dx <= dy ? 0 : 3) : (dx <= -dy ? 1 : 3);
    else i = 0 < dy ? (-dx <= dy ? 0 : 2) : (dy <= dx ? 1 : 2);
    this.dirIdx = i;
    this.attTile = [a.x, a.y]; this.tgtTile = [t.x, t.y];
    return true;
  }
  init() {
    if (!this.begin()) return false;
    const a = this.att, t = this.tgt, i = this.dirIdx;
    this.meetA = [f32(t.wx + MEET_AX[i]), f32(t.wy + MEET_AY[i])];
    this.meetT = [f32(t.wx + MEET_TX[i]), f32(t.wy + 0)];
    const d = MEET_DIR[i];
    UV.setDir(a, d); UV.setState(a, ST.RUN); this.C.changeState(a, true, 1.0);
    UV.setDir(t, OPPOSITE[d]);
    this.C.t.notifyEnterBattle(t);   // GameController::notifyEnterBattle (C_ENTER_BATTLE -> story "battle begin")
    if (U.isHero(a) && isNearDeath(a)) randSound(['dying-1', '', '', '', '', '', '']);
    resetBattle();
    dlog('init state=1', a.id ?? 'hero', t.id);
    return true;
  }
  // AttackBehavior::update (main behavior chain: real dt, not scaled by the action rate, not paused by froze)
  update(dt) {
    if (this.done) return;
    const a = this.att;
    if (this.state === 7) {
      const step = f32(f32(MOVE_SPEED * 0.5) * dt);
      const [px, py] = this.C.t.tilePos(this.tgtTile[0], this.tgtTile[1], a);
      const vx = f32(px - a.wx), vy = f32(py - a.wy), len = Math.hypot(vx, vy);
      if (len <= step) {
        a.wx = px; a.wy = py; a.x = this.tgtTile[0]; a.y = this.tgtTile[1];   // setMapPosition(..., true)
        this.C.t.unitArriveTile(a, this.attTile, this.tgtTile);              // Unit/MyPlayer::onArriveTile(from, to)
        this.state = 8; this.end();
      } else { a.wx = f32(a.wx + f32(f32(vx / len) * step)); a.wy = f32(a.wy + f32(f32(vy / len) * step)); }
    } else if (this.state === 1) {
      const t = this.tgt, step = f32(MOVE_SPEED * dt);
      const mv = (u, m) => {
        const vx = f32(m[0] - u.wx), vy = f32(m[1] - u.wy), len = Math.hypot(vx, vy);
        if (len <= step) { u.wx = m[0]; u.wy = m[1]; }
        else { u.wx = f32(u.wx + f32(f32(vx / len) * step)); u.wy = f32(u.wy + f32(f32(vy / len) * step)); }
      };
      mv(a, this.meetA); mv(t, this.meetT);
      if (a.wx === this.meetA[0] && a.wy === this.meetA[1] && t.wx === this.meetT[0] && t.wy === this.meetT[1]) { dlog('approach reached'); this.enterBattle(); }
    }
    if (this.timer) this.timer.update(dt);
  }
  enterBattle() {
    const a = this.att, t = this.tgt;
    this.state = 3;
    UV.setState(a, ST.ATTACK); UV.setState(t, ST.ATTACK);
    U.onEnterBattle(a, t); this.C.monsterEnterBattle(a, t);
    U.onEnterBattle(t, a); this.C.monsterEnterBattle(t, a);
    this.info.set(a, U.calAttackDamage(a, t, 0, true, false, 1));
    this.info.set(t, U.calAttackDamage(t, a, 0, false, false, 1));
    this.C.changeState(a, false, 4.0);
    this.C.changeState(t, false, f32(f32(U.actionRate(t) * U.fin(t).fin_atk_speed) / 100));
    dlog('enterBattle state=3');
  }
  // AttackBehavior::startNewAttack(unit)
  startNewAttack(u) {
    const o = this.other(u); if (!o) { console.error('[AB] check failed: tgt'); return; }
    if (u === this.att && !(this.state === 3 || this.state === 5 || this.state === 7)) { this.end(); return; }
    const prev = this.info.get(u) || newInfo();
    this.info.set(u, U.calAttackDamage(u, o, 0, false, false, 1));
    if (!U.onAttackingEnemy(u, o)) this.C.changeState(u, false, f32(f32(U.actionRate(u) * U.fin(u).fin_atk_speed) / 100));
    if (U.isMonster(u)) {
      if (Script.monsterAIAction(u, o, prev, wallSeconds() - this.t0)) this.info.set(u, newInfo());
    }
    dlog('startNewAttack', u.isHero ? 'hero' : u.id);
  }
  // msg_C_UNIT_ANIM_START: the hero's attack track starting with a critical stored attack -> crit voice
  onAnimStart(u, track) {
    if (track !== 2 || !U.isHero(u)) return;
    const info = this.info.get(u);
    if (info && info.crit) randSound(['crit-1', 'crit-2', 'crit-3', '', '']);
  }
  // msg_C_UNIT_ANIM_COMPLETE: only the attack track (state 2) -> next attack
  onAnimComplete(u, track) { if (track === 2) this.startNewAttack(u); }
  // msg_C_UNIT_ANIM_EVENT: exact event "hit" while the behavior is in state 3 or 5 (any track of the unit)
  onAnimEvent(u, track, name) {
    if (name !== 'hit') return;
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
      if (total !== 0) {
        U.beHurt(o, 0, total);
        if (info.crit) { if (U.isHero(u)) Audio2.play('crit'); else if (U.isHero(o)) randSound(['crithit-1', 'crithit-2', 'crithit-2', 'crithit-3', 'crithit-3', '', '']); }
      }
    }
    dlog('onHit', u.isHero ? 'hero' : u.id, total);
    View.attackHit(u, o, info, flag.v, total);
    if (U.isHero(o)) View.attrChanged(o);
    if (U.isHero(u) && info.hit) { const f = U.fin(u), hp = f.hit_hp, mp = f.hit_mp; if (0 < hp || 0 < mp) GC.dealRecoverUnit(u, 0, hp, mp, true); }
    if (info.hit) { U.onHitEnemy(u, o, total, info); if (0 < total) U.onDamagedByEnemy(o, u, info, total); }
    this.deathClearing(info);
  }
  deathClearing(info) {
    if (this.done) return;
    dlog('deathClearing hpA=', U.hp(this.att), 'hpT=', U.hp(this.tgt));
    if (U.isDead(this.att)) { GC.dealKillUnit(this.tgt, this.att, 0); this.state = 4; this.end(); return; }
    if (U.isDead(this.tgt) && this.state !== 7 && this.state !== 8) {
      if (U.isHero(this.att)) {
        const f = U.fin(this.att), hp = f.kill_hp, mp = f.kill_mp;
        if (0 < hp || 0 < mp) GC.dealRecoverUnit(this.att, 0, hp, mp, true);
        if (info && info.crit) View.globalEffect(1);
      }
      GC.dealKillUnit(this.att, this.tgt, 0);
      this.state = 7;
    }
  }
  // msg_C_ESCAPE_BATTLE (GameController::feedbackEscape from the escape button)
  escape() {
    if (this.state !== 3 || U.isDead(this.att)) return;
    const a = this.att;
    this.C.t.setVeil(true);   // Veil::setEnabled(true, 0x20, 4.0)
    const d = OPPOSITE[UV.dir(a)] || UV.dir(a);
    this.state = 5;
    UV.setDir(a, d); UV.setState(a, ST.ESCAPE); this.C.changeState(a, true, 3.0);
    this.C.t.showEscaping(true);
    this.timer = new MyTimer();
    this.timer.initWithDelayOneShot(2.0, () => {   // lambda 01160eb8
      this.C.t.setVeil(false); this.C.t.showEscaping(false);
      if (U.isDead(a)) return;
      const t = this.tgt;
      this.state = 6;
      const [px, py] = this.C.t.tilePos(this.tgtTile[0], this.tgtTile[1], t); t.wx = px; t.wy = py;
      U.setHp(t, U.fin(t).max_hp);   // Unit::setCurHP(getFinMaxHP)
      UV.setState(t, ST.STAND); this.C.changeState(t, true, 1.0);
      View.attrChanged(t);
      this.end();
    });
  }
  // AttackBehavior::end: onLeaveBattle 4 -> 1, 8 -> 0, other states > 1 -> 2; skill chains cancelled;
  // C_LEAVE_BATTLE only for 4 (1), 6 (2, attacker walks back to its tile) and 8 (0, + "powerful" voice on a one-hit win)
  end() {
    if (this.done) return; this.done = true;
    const st = this.state;
    if (this.timer) this.timer.cancel();
    const res = st === 4 ? 1 : st === 8 ? 0 : 1 < st ? 2 : -1;
    if (0 <= res) { U.onLeaveBattle(this.att, this.tgt, res); U.onLeaveBattle(this.tgt, this.att, res); }
    U.init(this.att).n.chain.cancelAll(); U.init(this.tgt).n.chain.cancelAll();
    this.att.n.fighting = false; this.att.n.enemy = null;
    let notify = -1;
    if (st === 4) notify = 1;
    else if (st === 6) { this.C.t.moveUnitTo(this.att, this.attTile); notify = 2; }
    else if (st === 8) { this.C.t.moveUnitTo(this.att, this.tgtTile); notify = 0; if (this.hits === 1) randSound(['powerful-1', 'powerful-2', '', '', '', '', '', '', '', '', '']); }
    dlog('end state=', st, 'result=', notify);
    this.C.onBattleEnd(this, notify, true);
  }
}
const isNearDeath = u => { const hp = U.hp(u); return 0 < hp && hp <= trunc(U.fin(u).max_hp / 5); };   // Unit::isNearDeath

// FightBehavior (AttackBehavior.cpp): MyPlayer::attack on a rank-4 monster -> MoveBehavior + FightBehavior (no StandBehavior).
// init: no approach walk. Directions from the two map positions; a hidden boss (Unit state 5) gets C_BOSS_APPEAR, the
// attacker goes to state 4 (ready) and the battle starts on the boss's appear-complete (C_UNIT_ANIM_COMPLETE state 5);
// otherwise C_ENTER_BATTLE + enterBattle at once. update() only runs the timer: at state 7 there is no walk-in, the
// battle ends on the attacker's next attack-track complete.
// end(): states 4/6/7/8 -> onLeaveBattle(1/2/0/0), other states > 1 -> 2; states 6..8: attacker state 4;
// C_LEAVE_BATTLE only for 4 (1), 6 (2), 7/8 (0).
class FightBehavior extends AttackBehavior {
  init() {
    if (!this.begin()) return false;
    const a = this.att, t = this.tgt;
    // FightBehavior::init direction table: same quadrant split, attacker 1 / 2 -> 4 (DAT_00ef6d9c for the boss)
    const i = this.dirIdx, q = [1, 2, 3, 4][i];
    const d = (q - 1) >>> 0 > 1 ? q : 4;
    if (UV.state(t) === ST.HIDE) {
      this.C.t.bossAppear(t);   // C_BOSS_APPEAR: presentation only (veil, BossBGM, appear animation, story)
      UV.setDir(a, d); UV.setState(a, ST.READY);
      UV.setDir(t, OPPOSITE[d] || d);
      this.C.changeState(a, true, 1.0);
    } else {
      UV.setDir(a, d); this.C.changeState(a, true, 1.0);
      this.C.t.notifyEnterBattle(t);
      this.enterBattle();
    }
    resetBattle();
    return true;
  }
  update(dt) { if (!this.done && this.timer) this.timer.update(dt); }
  onAnimComplete(u, track) {
    if (track === 5 && u === this.tgt) { this.C.t.notifyEnterBattle(this.tgt); this.enterBattle(); return; }   // appear done
    if (this.state === 7 && track === 2 && u === this.att) { this.end(); return; }
    super.onAnimComplete(u, track);
  }
  end() {
    if (this.done) return; this.done = true;
    const st = this.state;
    if (this.timer) this.timer.cancel();
    const res = st === 4 ? 1 : st === 6 ? 2 : st === 7 || st === 8 ? 0 : 1 < st ? 2 : -1;
    if (0 <= res) { U.onLeaveBattle(this.att, this.tgt, res); U.onLeaveBattle(this.tgt, this.att, res); }
    let notify = -1;
    if (6 <= st && st <= 8) { UV.setState(this.att, ST.READY); this.C.changeState(this.att, true, 1.0); notify = st === 6 ? 2 : 0; }
    else if (st === 4) notify = 1;
    this.att.n.fighting = false; this.att.n.enemy = null;
    this.C.onBattleEnd(this, notify, false);
  }
}
// FightBehavior::init quadrant table: index 0..3 (above/below/left/right) -> 1/2/3/4, and 1/2 are replaced by 4
// (code: `uVar1 = 4; if (1 < uVar5 - 1) uVar1 = uVar5;`). VERIFY: the boss direction pairing uses DAT_00ef6d9c.

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
    // Actor::update -> main BehaviorChain (AttackBehavior / FightBehavior) with the real dt
    if (this.ab && !this.ab.done) this.ab.update(dt);
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

  // ---- battle (MyPlayer::attack -> Unit::attack: MoveBehavior + AttackBehavior + StandBehavior; rank 4: + FightBehavior)
  startBattle(m) {
    if (this.ab && !this.ab.done) return false;
    const ab = 4 === U.rank(m) ? new FightBehavior(this, this.hero, m) : new AttackBehavior(this, this.hero, m);
    this.ab = ab;
    if (!ab.init()) { this.ab = null; return false; }
    return true;
  }
  // GameController::feedbackEscape -> C_ESCAPE_BATTLE (escape button only)
  escape() { if (this.ab && !this.ab.done) this.ab.escape(); }
  inBattle() { return !!(this.ab && !this.ab.done); }
  battleState() { return this.ab && !this.ab.done ? this.ab.state : 0; }
  onBattleEnd(ab, res, stand) {
    if (this.ab === ab) this.ab = null;
    this.t.onBattleEnd(ab.tgt, res === 0 ? 'win' : res === 1 ? 'die' : res === 2 ? 'flee' : null, stand);
  }

  // ---- view plumbing: Unit::notifyChangeState -> UnitNode::animateWithState; Spine event / complete / start
  //      (track index = unit state) -> AttackBehavior msg_C_UNIT_ANIM_EVENT / _COMPLETE / _START
  changeState(u, loop, rate) { return UV.changeState(u, loop, rate); }
  animEvent(u, track, name) { const ab = this.ab; if (ab && !ab.done && ab.has(u)) ab.onAnimEvent(u, track, name); }
  animComplete(u, track) { const ab = this.ab; if (ab && !ab.done && ab.has(u)) ab.onAnimComplete(u, track); }
  animStart(u, track) { const ab = this.ab; if (ab && !ab.done && ab.has(u)) ab.onAnimStart(u, track); }

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
  // TowerView::msg_C_ATTACK_HIT: damage numbers only (no sound here; sounds come from the Spine events and
  // AttackBehavior::msg_C_UNIT_ANIM_EVENT). Hit: base damage (critical: large + "critical" word) and the summed
  // elemental damage as a second number; a negative value shows as "+N" (health); miss: the "miss" word.
  View.attackHit = (src, tgt, info, absorbed, total) => {
    const t = T(); if (!tgt) return;
    if (!info.hit) { t.floatText(tgt.wx, tgt.wy + 110, S('miss') || 'Trượt', '#ffffff', 0.9); t.ui.enemy(C.ab?.tgt || t.fight?.mon); t.ui.hud(t); return; }
    tgt.hitT = 0.15;
    const vals = [info.dmg[0], info.dmg[1] + info.dmg[2] + info.dmg[3] + info.dmg[4]];
    vals.forEach((v, i) => {
      const y = tgt.wy + 110 + i * 34;
      if (0 < v) {
        if (i === 0 && info.crit) t.floatText(tgt.wx, y, `-${v} ${S('critical') || 'Chí mạng'}`, '#ffd200', 1.45);
        else t.floatText(tgt.wx, y, `-${v}`, i === 0 ? '#ffffff' : '#ffd200', 1);
      } else if (v < 0) t.floatText(tgt.wx, y, `+${-v}`, '#5aff7a', 1);
    });
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
    // AttackBehavior::msg_C_UNIT_ADD_ABNORMAL (s 1, val 1): cancel the skill chain + notifyChangeState(true, 1.0)
    // (the faint makes getAnimateWithState return "stand" on the current state track);
    // msg_C_UNIT_REMOVE_ABNORMAL (s 1, val 0): startNewAttack
    if (s === 1 && C.ab && !C.ab.done && C.ab.has(u)) {
      if (on && n === 1) { U.init(u).n.chain.cancelAll(); C.changeState(u, true, 1.0); }
      if (!on && n === 0) C.ab.startNewAttack(u);
    }
    if (s === 3 && on) GC.deathClearing();
  };
  View.bodyEffect = (name, u) => { if (u) T().burst(u, 0); };
  View.sceneEffect = (file, root, u) => { if (u) T().burst(u, 0); };
  View.flyEffect = fx => { if (fx.tgt) T().burst(fx.tgt, 0); };
  // C_SKILL_ACTION -> UnitNode::spineAnimate(2, getSkillAnimate(act), false, rate): exact name, no fallback
  View.action = (u, idx, speed) => { if (u?.actor) UV.skillAction(u, idx, speed); };
  View.attrChanged = () => { bumpStats(); const t = T(); t.ui.hud(t); };
  View.actionRate = u => { if (u) UV.setActionRate(u, U.actionRate(u)); };   // C_UNIT_ACTION_RATE
  View.bottle = () => { const t = T(); t.ui.hud(t); };
  View.qteStart = () => { };   // TODO: QTE mini game UI
  View.globalEffect = () => { };
  GC.deathClearing = () => { if (C.ab && !C.ab.done) C.ab.deathClearing(null); };
  // Spine -> GameController::feedbackUnitAnimationEvent / Complete / Start (track index = "state")
  SpineActor.router = (actor, kind, track, name) => {
    const u = actor.owner; if (!u) return;
    if (kind === 'event') C.animEvent(u, track, name);
    else if (kind === 'complete') { C.animComplete(u, track); UV.animComplete(u, track); }   // feedback first, then the node's relax countdown
    else if (kind === 'start') C.animStart(u, track);
  };
  GC.killHandler = (killer, victim, kmode) => C.onKill(killer, victim, kmode);
}
