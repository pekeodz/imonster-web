// Combat runtime: normal attacks (CalAttackDamage from formular.lua), skill effect interpreter
// (effect lists from skill.lua), buffs, monster AI (monsterai.lua) and elite affixes.
import { DB, S } from '../engine/db.js';
import { Lua } from '../engine/lua.js';
import { Audio2 } from '../engine/audio.js';
import { P, stats } from './profile.js';
import { applyBuffLayer, perHitAttack, heroFinMPCost, heroFinCooldown } from './stats.js';
import { skillEffects, heroPassives, addBuff, activeBuffs, buffMods, skillLevel, combatSlots, pendingUse, ELEM_COLOR, invalidatePassives } from './skills.js';

const ELEM_RES = [null, 'fire_res', 'cold_res', 'light_res', 'poison_res'];
const ELEM_ATK = ['phy', 'fire_atk', 'cold_atk', 'light_atk', 'poison_atk'];
const ELEM_KEY = ['physics', 'fire', 'cold', 'light', 'poison'];
// Elite affixes: skill ids 200000..200032 (group 99 in skill.csv). Names from the Chinese marks.
export const AFFIX_NAMES = {
  200000: 'Kiên định', 200001: 'Kháng phép', 200002: 'Nhanh nhẹn', 200003: 'Linh hoạt', 200004: 'Cường sinh', 200005: 'Gai góc', 200006: 'Phản xạ',
  200007: 'Hút máu', 200008: 'Hồi phục', 200009: 'Liều lĩnh', 200010: 'Cuồng bạo', 200011: 'Phẫn nộ', 200012: 'Cuồng nhiệt', 200013: 'Tập trung',
  200014: 'Cường hoá lửa', 200015: 'Cường hoá băng', 200016: 'Cường hoá sét', 200017: 'Cường hoá độc', 200018: 'Trúng độc', 200019: 'Hồi máu mạnh',
  200020: 'Kim chung tráo', 200021: 'Phản đòn', 200022: 'Tra tấn', 200023: 'Trấn áp', 200024: 'Phán xét', 200025: 'Khô kiệt', 200026: 'Uy hiếp',
  200027: 'Hộ thuẫn', 200028: 'Đốt mana', 200029: 'Mãnh kích', 200030: 'Đóng băng', 200031: 'Chúc phúc', 200032: 'Nguyền rủa',
};

// ---------------- equipment specialization runtime (EquipEffect_<id> classes in libMyGame.so)
// Only reversed classes are implemented; every other spec id is stored on the item but has NO runtime effect yet (TODO).
export function heroSpecs() {
  const out = [];
  for (const it of Object.values(P.data?.equipped || {})) for (const sp of it?.spec || []) out.push(sp);
  return out;
}
const specState = {};
// beforeDamageCalculation(attacker, target, ..., DamageInfo{mode})
function specBefore(C, src, tgt, mode) {
  for (const sp of heroSpecs()) {
    // EquipEffect_221 (DK Cobra Stick): mode==0 and target curHP >= target finMaxHP -> arm
    if (sp.id === 221 && mode === 0 && C.hp(tgt) >= C.stats(tgt).max_hp) specState[221] = true;
  }
}
// onHitEnemy(attacker, target, ...)
function specOnHit(C, src, tgt) {
  // EquipEffect_221: armed -> clear, target gets SkillShortEffect(2.0s, SkillFaint)
  if (specState[221]) { specState[221] = false; addBuff(tgt, { type: 'faint', duration: 2 }, C.now); C.t.floatText(tgt.wx, tgt.wy + 200, 'Choáng', '#9fe3ff', 0.9); }
}

export class Combat {
  constructor(tower) { this.t = tower; this.now = 0; this.timers = []; }
  get hero() { return this.t.hero; }
  // ---------------- accessors (hero hp/mp live in the profile)
  hp(u) { return u.isHero ? P.data.hp : u.hp; }
  mp(u) { return u.isHero ? P.data.mp : (u.mp ?? u.st.max_mp); }
  setHp(u, v) { const mx = this.stats(u).max_hp; v = Math.max(0, Math.min(mx, v)); if (u.isHero) P.data.hp = v; else u.hp = v; }
  setMp(u, v) { const mx = this.stats(u).max_mp; v = Math.max(0, Math.min(mx, v)); if (u.isHero) P.data.mp = v; else u.mp = v; }
  stats(u) {
    if (u.isHero) return stats();
    let s = { ...u.st };
    // Unit::calAttribWithBuffs (one pass over permanent + active effects)
    const effs = [...(u.permAttr || []), ...activeBuffs(u, this.now).filter(b => b.type === 'attrib benefit' || b.type === 'attrib gain')];
    if (effs.length) s = applyBuffLayer(s, effs);
    // Monster::getFinMin/MaxAttack + 4 elemental attack getters: per-hit scaling by MonsterTemplate.AtkTimes
    if (!u.isPet && s.atk_times > 1) for (const k of ['min_atk', 'max_atk', 'fire_atk', 'cold_atk', 'light_atk', 'poison_atk']) s[k] = perHitAttack(s[k], s.atk_times);
    const sp = buffMods(u, this.now).speed; if (sp) s.fin_atk_speed *= (1 + sp / 100);   // TODO VERIFY (speed-up buff path)
    return s;
  }
  // lua-facing table for a unit
  lt(u) {
    const s = this.stats(u);
    const m = buffMods(u, this.now);
    return { ...s, cur_hp: this.hp(u), cur_mp: this.mp(u), act_rate: Math.max(0, 1 + m.speed / 100), quality: u.rank || 1, _time: this.t.fight?.time || 0 };
  }

  // ---------------- elites: random affixes + fixed monster Buff
  setupMonster(m) {
    m.permAttr = []; m.perm = []; m.affixes = [];
    const add = id => {
      const effs = skillEffects(id, this.lt(m), this.lt(m), 1);
      for (const e of effs) {
        if (!e || !e.type) continue;
        if ((e.type === 'attrib benefit' || e.type === 'attrib gain') && !e.duration) m.permAttr.push(e);
        else if (!e.duration && !e.period && ['cause damage change', 'be damage change', 'suck red', 'damage back', 'recover change', 'additional attack', 'speed up'].includes(e.type)) m.buffs = [...(m.buffs || []), { ...e, until: 0 }];
        else m.perm.push({ id, e });
      }
    };
    if (m.rec.Buff !== '' && m.rec.Buff != null) String(m.rec.Buff).split(';').filter(Boolean).forEach(id => add(+id));
    const n = m.rank === 2 ? 1 : m.rank >= 3 ? 2 : 0;
    const pool = [200002, 200003, 200004, 200005, 200007, 200008, 200009, 200010, 200012, 200013, 200014, 200015, 200016, 200017, 200020, 200021, 200027, 200029];
    for (let i = 0; i < n; i++) { const id = pool[Math.floor(Math.random() * pool.length)]; if (m.affixes.includes(id)) continue; m.affixes.push(id); add(id); }
    const s = this.stats(m); m.hp = s.max_hp; m.mp = s.max_mp;
  }

  // ---------------- damage pipeline
  // kind: 'attack' | 'skill' | 'trap'; parts: [phy, fire, cold, light, poison] (already resisted)
  applyDamage(src, tgt, parts, kind, opts = {}) {
    const ms = src ? buffMods(src, this.now) : { cause: {} }, mt = buffMods(tgt, this.now);
    let total = 0; let mainElem = 0, best = -1;
    for (let e = 0; e < 5; e++) {
      let v = parts[e] || 0; if (v <= 0) continue;
      let k = 1 + ((ms.cause[ELEM_KEY[e]] || 0) + (ms.cause[kind] || 0) + ((src?.isHero || src?.isPet) && this.t.pet ? this.t.pet.elemBonus(e) : 0)) / 100;
      k *= 1 + ((mt.be[ELEM_KEY[e]] || 0) + (mt.be[kind] || 0)) / 100;
      v *= Math.max(0, k);
      if (v > best) { best = v; mainElem = e; }
      total += v;
    }
    // hero passive specials
    if (src?.isHero) {
      const sp = heroPassives().specials; const hs = this.stats(src); const ts = this.stats(tgt);
      const rhp = this.hp(src) / hs.max_hp, thp = this.hp(tgt) / ts.max_hp;
      if (sp[106000] && rhp > 0.7) total *= 1 + (+sp[106000].p1 || 0) / 100;
      if (sp[106001] && thp < 0.35) total *= 1 + (+sp[106001].p2 || +sp[106001].p1 || 0) / 100;
      if (sp[106003] && tgt.rank >= 2) total *= 1 + (+sp[106003].p1 || 0) / 100;
      if (sp[107101]) total *= 1 + (+sp[107101].p1 || 0) / 100 * (this.mp(src) / hs.max_mp);
      if (kind === 'skill' && sp[109001]) total *= 1 + (+sp[109001].p1 || 0) / 100;
      if (this.nextSkillBonus && kind === 'skill') { total *= 1 + this.nextSkillBonus / 100; this.nextSkillBonus = 0; }
    }
    if (tgt.isHero) {
      const sp = heroPassives().specials; const hs = this.stats(tgt);
      if (sp[106000] && this.hp(tgt) / hs.max_hp < 0.35) total *= 1 - (+sp[106000].p2 || 0) / 100;
      if (kind === 'attack' && sp[109100]) total *= 1 - (+sp[109100].p1 || 0) / 100;
      if (kind === 'skill' && sp[109101]) total *= 1 - (+sp[109101].p1 || 0) / 100;
      const ps = this.stats(tgt); if (kind === 'attack' && ps.phys_reduce) total *= 1 - Math.min(60, ps.phys_reduce) / 100;
    }
    total = Math.max(1, Math.round(total));
    // shield
    if (mt.shield) { const ab = Math.min(mt.shield.left, total); mt.shield.left -= ab; total -= ab; if (ab) this.t.floatText(tgt.wx, tgt.wy + 160, `(${ab})`, '#bfe3ff', 0.8); }
    if (tgt.absorbAll) { tgt.absorbed = (tgt.absorbed || 0) + total; total = 0; }
    if (total <= 0) return 0;
    this.setHp(tgt, this.hp(tgt) - total);
    tgt.hitT = 0.15;
    const color = tgt.isHero ? (opts.crit ? '#ff6a3a' : '#ff4a4a') : (opts.crit ? '#ffcf3a' : ELEM_COLOR[mainElem]);
    this.t.floatText(tgt.wx, tgt.wy + 110 + (opts.dy || 0), (tgt.isHero ? '-' : '') + total + (opts.crit ? '!' : ''), color, opts.crit ? 1.45 : kind === 'skill' ? 1.2 : 1);
    if (src) {
      // lifesteal / thorns
      const suck = (ms.suck || 0) + (opts.suck || 0);
      if (suck > 0 && kind !== 'trap') this.heal(src, total * suck / 100, true);
      if (mt.back > 0 && kind === 'attack') { const back = Math.round(total * mt.back / 100); if (back > 0) { this.setHp(src, this.hp(src) - back); this.t.floatText(src.wx, src.wy + 130, (src.isHero ? '-' : '') + back, '#ff9a6a', 0.8); } }
      if (src.isHero && kind === 'attack') {
        const ps = this.stats(src);
        if (ps.hit_hp) this.heal(src, ps.hit_hp, true);
        if (ps.steal_hp) this.heal(src, total * ps.steal_hp / 100, true);
        if (ps.hit_mp) this.setMp(src, this.mp(src) + ps.hit_mp);
      }
      if (tgt.isHero && kind === 'attack' && this.t.pet && src.alive) this.t.pet.onHeroAttacked(src);
      if (src.isHero && opts.crit && this.t.pet && tgt.alive) this.t.pet.onHeroCrit(tgt);
      if (tgt.isHero && kind === 'attack') {
        const ps = this.stats(tgt); const sp = heroPassives().specials;
        if (ps.thorn) this.rawHurt(src, ps.thorn, tgt);
        if (sp[103103]) this.rawHurt(src, Math.round(ps.defense * (+sp[103103].p1 || 0) / 100), tgt);
        if (sp[104102]) this.setMp(tgt, this.mp(tgt) + ps.max_mp * (+sp[104102].p1 || 0) / 100);
      }
    }
    this.t.ui.enemy(this.t.fight?.mon);
    this.checkDeath(tgt, src);
    return total;
  }
  rawHurt(tgt, v, src) {
    v = Math.round(v); if (v <= 0 || !tgt) return;
    this.setHp(tgt, this.hp(tgt) - v); tgt.hitT = 0.12;
    this.t.floatText(tgt.wx, tgt.wy + 140, (tgt.isHero ? '-' : '') + v, tgt.isHero ? '#ff4a4a' : '#ffb07a', 0.85);
    this.checkDeath(tgt, src);
  }
  heal(u, v, quiet) {
    v = Math.round(v * (1 + (buffMods(u, this.now).recover || 0) / 100) * (u.isHero ? 1 + (this.stats(u).heal_bonus || 0) / 100 + (+(heroPassives().specials[109102]?.p1) || 0) / 100 : 1));
    if (v <= 0) return;
    this.setHp(u, this.hp(u) + v);
    if (!quiet || v >= 5) this.t.floatText(u.wx, u.wy + 170, '+' + v, '#5aff7a', quiet ? 0.75 : 1);
  }
  checkDeath(u, killer) {
    if (u.isPet) return;
    if (this.hp(u) > 0) return;
    if (u.isHero) { if (u.alive) this.t.heroDie(); }
    else if (u.alive) this.t.killMonster(u);
  }

  // normal attack (formular.lua CalAttackDamage)
  normalAttack(src, tgt, opts = {}) {
    if (!src.alive || !tgt.alive) return;
    const a = this.lt(src), d = this.lt(tgt);
    if (opts.perc) for (const k of ['min_atk', 'max_atk', 'fire_atk', 'cold_atk', 'light_atk', 'poison_atk']) a[k] = (a[k] || 0) * opts.perc / 100;
    // hero passives that modify the swing
    let ignoreDef = 0;
    if (src.isHero) {
      const sp = heroPassives().specials; const lvGap = Math.max(0, d.lv - a.lv);
      const chance = p => (+p || 0) / (lvGap >= 5 ? 2 : 1);
      if (sp[104000] && Math.random() * 100 < chance(sp[104000].p1)) ignoreDef = 0.5;
      if (sp[106002]) { if (this.hp(tgt) / d.max_hp > this.hp(src) / a.max_hp) a.hit += +sp[106002].p1 || 0; else ignoreDef = Math.max(ignoreDef, (+sp[106002].p2 || 0) / 100); }
      if (sp[106001] && this.hp(tgt) / d.max_hp > 0.8) a.critical += +sp[106001].p1 || 0;
      if (sp[104002] && Math.random() * 100 < chance(sp[104002].p1)) addBuff(tgt, { type: 'faint', duration: 2 }, this.now);
      if (sp[104001] && Math.random() * 100 < chance(sp[104001].p1)) { const e = 1 + Math.floor(Math.random() * 4); a[ELEM_ATK[e]] = (a[ELEM_ATK[e]] || 0) + (a.min_atk + a.max_atk) / 2 * 0.15; }
    }
    if (ignoreDef) d.defense *= (1 - ignoreDef);
    if (src.isHero && this.t.pet) d.defense = Math.max(0, d.defense - this.t.pet.ignoreDef());
    const add = buffMods(src, this.now).addAtk;
    if (add) { a.min_atk += +add.physics || 0; a.max_atk += +add.physics || 0; a.fire_atk += +add.fire || 0; a.cold_atk += +add.cold || 0; a.light_atk += +add.light || 0; a.poison_atk += +add.poison || 0; }
    // equipment specialization hooks: beforeDamageCalculation (normal attack)
    if (src.isHero) specBefore(this, src, tgt, 0);
    const r = Lua.call('CalAttackDamage', a, d, !!opts.hit, !!opts.crit) || [];
    const [phy, fire, cold, light, poison, crit] = r;
    if (phy != null || fire != null) { if (src.isHero) specOnHit(this, src, tgt); }
    if (phy == null && fire == null) {
      this.t.floatText(tgt.wx, tgt.wy + 110, 'Trượt', '#cfcfcf', 0.9);
      if (tgt.isHero && heroPassives().specials[300000]) { }
      return 0;
    }
    // the swing animation already played its own impact sound (spine "sound-1" events); keep the crit sting
    if (src.isHero) { if (crit) Audio2.play('crithit-' + (1 + (Math.random() * 3 | 0)), 0.6); else if (!opts.silent) Audio2.play('hit-1-' + (1 + (Math.random() * 13 | 0)), 0.6); }
    else if (!opts.silent) Audio2.play('hit-2-' + (1 + (Math.random() * 4 | 0)), 0.5);
    // Fighting Instinct: chance to kill instantly after crit
    if (src.isHero && crit && heroPassives().specials[107102] && tgt.rank < 4) {
      const p = (+heroPassives().specials[107102].p1 || 0) * (tgt.rank === 2 ? 0.67 : tgt.rank === 3 ? 0.34 : 1);
      if (Math.random() * 100 < p) { this.t.floatText(tgt.wx, tgt.wy + 200, 'TỬ!', '#ff3030', 1.6); this.setHp(tgt, 0); this.checkDeath(tgt, src); return 0; }
    }
    return this.applyDamage(src, tgt, [phy || 0, fire || 0, cold || 0, light || 0, poison || 0], 'attack', { crit, dy: opts.dy });
  }

  // skill damage: raw value, element; uses defense / resist like the engine
  // Unit::calSkillDamage (native): atk = max(0, val + hookAtk), def/res = max(0, target stat + hookDef)
  //   physical: int(CalPhysicalDamage(lvA, atk, def));  element: int(CalEleDmg(atk, max(1,lvA), res, max(1,lvB)))
  //   then int(CalCriticalDamage(force, dmg, attacker crit, attacker crit dmg))
  skillDamage(src, tgt, elem, val, opts = {}) {
    if (!tgt.alive) return 0;
    const a = this.lt(src), d = this.lt(tgt);
    const atk = Math.max(0, Math.trunc(+val || 0));
    // TODO VERIFY: passive 109002 (web-side "ignore def/res") stands in for the native beforeDamageCalculation hooks
    const ext = src.isHero ? (+(heroPassives().specials[109002]?.p1) || 0) / 100 : 0;
    let v;
    if (elem === 0) {
      const def = Math.max(0, Math.trunc((d.defense || 0) * (1 - ext)));
      v = Math.trunc((Lua.call('CalPhysicalDamage', a.lv | 0, atk, def) || [0])[0] || 0);
    } else {
      const res = Math.max(0, Math.trunc((d[ELEM_RES[elem]] || 0) * (1 - ext)));
      v = Math.trunc((Lua.call('CalEleDmg', atk, Math.max(1, a.lv | 0), res, Math.max(1, d.lv | 0)) || [0])[0] || 0);
    }
    const cr = Lua.call('CalCriticalDamage', !!opts.crit, v, a.critical | 0, a.crit_dam | 0) || [v, false];
    v = Math.trunc(cr[0] || 0); const crit = !!cr[1];
    const parts = [0, 0, 0, 0, 0]; parts[elem] = v;
    return this.applyDamage(src, tgt, parts, 'skill', { crit, suck: opts.suck });
  }

  // ---------------- effect interpreter
  wait(sec) { return new Promise(res => this.timers.push({ at: this.now + sec, res })); }
  update(dt) {
    this.now += dt;
    const due = this.timers.filter(t => t.at <= this.now); this.timers = this.timers.filter(t => t.at > this.now);
    due.forEach(t => t.res());
    // periodic effects
    for (const u of [this.hero, this.t.pet?.unit, ...this.t.units.filter(x => !x.isHero)]) {
      if (!u?.buffs) continue;
      for (const b of u.buffs) {
        if (!b.period || !(b.loopLeft > 0) || b.nextAt > this.now) continue;
        b.nextAt += +b.period; b.loopLeft--;
        if (b.loopLeft <= 0) b.until = this.now;
        this.instant(b, b.casterRef, b.enemyRef);
      }
    }
  }
  unitFor(sel, caster, enemy) { return sel === 'enemy' ? enemy : caster; }
  async run(effs, caster, enemy, ctx = {}) {
    for (const e of effs) {
      if (!e || !e.type) continue;
      if (!caster.alive && e.type !== 'delay') return;
      if (e.type === 'delay') { await this.wait(+e.time || 0); continue; }
      if (e.period && e.loop) {
        const tgtU = this.unitFor(e.src, caster, enemy);
        const b = addBuff(tgtU, { ...e, duration: 0 }, this.now);
        b.loopLeft = +e.loop; b.nextAt = this.now + (+e.period); b.casterRef = caster; b.enemyRef = enemy; b.until = this.now + (+e.period) * (+e.loop) + 0.1;
        continue;
      }
      this.instant(e, caster, enemy, ctx);
    }
  }
  instant(e, caster, enemy, ctx = {}) {
    if (!enemy) enemy = caster;
    const U = sel => this.unitFor(sel, caster, enemy);
    switch (e.type) {
      case 'action': {
        const a = caster.actor; if (!a) break;
        const name = `skill-${e.idx || 1}-3`;
        if (a.has(name)) { a.cur = null; a.play(name, false, () => this.t.idleUnit(caster)); }
        else if (a.has('attack-1-3')) { a.cur = null; a.play('attack-1-3', false, () => this.t.idleUnit(caster)); }
        break;
      }
      case 'body effect': case 'scene effect': case 'fly effect': {
        const u = U(e.tgt || e.src); if (u) this.t.burst(u, ctx.elem ?? 0);
        break;
      }
      case 'skill damage': {
        const s = U(e.src), t = U(e.tgt); if (!s || !t) break;
        this.t.burst(t, +e.elem || 0);
        this.skillDamage(s, t, +e.elem || 0, +e.val || 0, { crit: !!e.crit });
        break;
      }
      case 'suck damage': {
        const s = U(e.src), t = U(e.tgt); if (!s || !t) break;
        this.t.burst(t, +e.elem || 0);
        this.skillDamage(s, t, +e.elem || 0, +e.val || 0, { suck: +e.suck || 0, crit: !!e.crit });
        break;
      }
      case 'skill hurt': { const t = U(e.tgt); if (t) this.rawHurt(t, +e.val || 0, U(e.src)); break; }
      case 'skill attack': { const s = U(e.src), t = U(e.tgt); if (s && t) this.normalAttack(s, t, { perc: +e.perc || 100, hit: !!e.hit, crit: !!e.crit }); break; }
      case 'skill recover': { const u = U(e.src); if (!u) break; if (e.hp) this.heal(u, +e.hp); if (e.mp) { this.setMp(u, this.mp(u) + +e.mp); this.t.floatText(u.wx, u.wy + 190, '+' + Math.round(+e.mp) + ' MP', '#6ab8ff', 0.8); } break; }
      case 'mp loss': { const u = U(e.tgt); if (u) this.setMp(u, this.mp(u) - (+e.loss || 0)); break; }
      case 'steal': { if (enemy.isHero || caster.isHero) { if (Math.random() * 100 < (+e.rate || 0) && P.data.red > 0) { P.data.red--; this.t.ui.toast('Bị trộm 1 bình máu!'); } } break; }
      case 'shield': { const u = U(e.src); if (!u) break; const b = addBuff(u, e, this.now); b.left = +e.val || 0; this.t.floatText(u.wx, u.wy + 200, 'Khiên', '#bfe3ff', 0.9); break; }
      case 'froze': case 'faint': {
        const u = U(e.src); if (!u) break;
        if (u.isHero && (this.stats(u).control_res || 0) > Math.random() * 100) break;
        addBuff(u, e, this.now); this.t.floatText(u.wx, u.wy + 200, e.type === 'froze' ? 'Đóng băng' : 'Choáng', '#9fe3ff', 0.9);
        break;
      }
      case 'attrib benefit': case 'attrib gain': case 'cause damage change': case 'be damage change': case 'damage back': case 'suck red':
      case 'speed up': case 'recover change': case 'additional attack': {
        const u = U(e.src); if (!u) break;
        addBuff(u, e, this.now);
        if (u.isHero) invalidatePassives();
        break;
      }
      case 'single skill': this.single(e, caster, enemy); break;
      default: break; // qte start, double attack (passive) etc.
    }
  }
  single(e, caster, enemy) {
    const id = +e.id;
    switch (id) {
      case 110003: this.nextSkillBonus = +e.p1 || 0; break;
      case 111000: { // absorb all damage for 5s, return part afterwards
        caster.absorbAll = true; caster.absorbed = 0;
        this.wait(5).then(() => { caster.absorbAll = false; const back = Math.round((caster.absorbed || 0) * (+e.p1 || 0) / 100); caster.absorbed = 0; if (back > 0) this.run([{ type: 'skill hurt', src: 'caster', tgt: 'caster', val: back / 5, period: 1, loop: 5 }], caster, enemy); });
        break;
      }
      case 113005: addBuff(caster, { type: 'recover change', perc: 0, duration: e.duration || 5 }, this.now); break;
      default: break;
    }
  }

  // ---------------- skills used by the hero
  castHero(slotIdx) {
    const t = this.t, f = t.fight, h = this.hero;
    const id = combatSlots()[slotIdx]; if (!id) return;
    const row = DB.skill.get(id); const lv = skillLevel(id);
    h.skillCD ||= {};
    if ((h.skillCD[id] || 0) > this.now) { t.ui.toast('Kỹ năng đang hồi'); return; }
    const hs = this.stats(h);
    let cost = heroFinMPCost(hs, +row.ManaCost || 0);                         // Hero::getFinMPCost
    if (heroPassives().specials[109001]) cost = Math.round(cost * 1.25);        // TODO VERIFY (web-side special)
    if (this.mp(h) < cost) { t.ui.toast('Không đủ MP'); return; }
    const needsEnemy = !['102005'].includes(String(id)) && !(+row.Group === 19);
    if (!f && needsEnemy) { t.ui.toast('Chỉ dùng khi đang chiến đấu'); return; }
    if (buffMods(h, this.now).froze || buffMods(h, this.now).faint) return;
    this.setMp(h, this.mp(h) - cost);
    let cd = heroFinCooldown(hs, +row.Cooldown || 0);                           // Hero::getFinSkillCooldown
    if (heroPassives().specials[109000]) cd *= 1 - (+heroPassives().specials[109000].p1 || 0) / 100;   // TODO VERIFY (web-side special)
    h.skillCD[id] = this.now + cd; h.skillCDmax ||= {}; h.skillCDmax[id] = cd;
    const enemy = f?.mon || h;
    const effs = skillEffects(id, this.lt(h), this.lt(enemy), lv);
    Audio2.play('player-attack-1-' + (1 + (Math.random() * 5 | 0)), 0.7);
    if (f) f.heroT = Math.max(f.heroT, 0.5);
    this.run(effs, h, enemy, { elem: elemOfSkill(id) });
    if (f && this.t.pet) this.t.pet.onHeroSkill(slotIdx, f.mon);
    t.ui.hud(t);
  }

  // ---------------- monster turn: AI decides skill vs. normal attack
  monsterTurn(m) {
    const h = this.hero;
    pendingUse.length = 0;
    let used = false;
    try { const r = Lua.call('__monsterAIb', m.id, m.key || (m.key = 'm' + Math.random().toString(36).slice(2)), this.lt(m), this.lt(h)); used = !!(r && r[0]); } catch (e) { }
    const ids = [...pendingUse]; pendingUse.length = 0;
    for (const sid of ids) {
      const effs = skillEffects(sid, this.lt(m), this.lt(h), Math.max(1, m.rank));
      this.run(effs, m, h, {});
      const nm = DB.skill.get(sid); if (nm && S(nm.Name)) this.t.floatText(m.wx, m.wy + 230, S(nm.Name), '#ffd36a', 0.9);
    }
    return used && ids.length > 0;
  }
  // fixed periodic affix effects (e.g. regen) at fight start
  fightStart(m) {
    for (const p of m.perm || []) this.run([p.e], m, this.hero, {});
    // hero: combat passives with periods (110102 regen every 3s)
    const sp = heroPassives().specials;
    if (sp[110102]) this.run([{ type: 'skill recover', src: 'caster', hp: stats().max_hp * (+sp[110102].p1 || 0) / 100, period: 3, loop: 999 }], this.hero, m);
  }
  fightEnd(m) {
    // stop periodic effects tied to this fight
    for (const u of [this.hero, m]) if (u?.buffs) u.buffs = u.buffs.filter(b => !b.period && (!b.until || b.until > this.now) && !(b.type === 'froze' || b.type === 'faint'));
    if (m) Lua.call('__battleEnd', m.key || '');
  }
}
function elemOfSkill(id) {
  const n = id % 10; return [0, 1, 2, 3, 4, 0][n] ?? 0;
}
