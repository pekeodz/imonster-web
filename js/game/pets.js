// Pets (henchman.csv / henchmanstats.csv). Stats come from the original tables (star*1000+level row × pet factors).
// Pet skills 300000-300054 were coded in C++ in the original; effects here follow their skill.csv descriptions.
import { DB, S } from '../engine/db.js';
import { Lua } from '../engine/lua.js';
import { P } from './profile.js';
import { itemRecord } from './items.js';

export const PET_NAMES = { 100000: 'Lina', 100001: 'Ally', 100002: 'Stanley', 100003: 'Kotone', 100004: 'Rex', 100005: 'Cookie' };
export const PET_PRICE = { 100000: 0, 100001: 15000, 100002: 30000, 100003: 50000, 100004: 80000, 100005: 120000 };
const STAT_KEYS = { max_hp: 'Life', max_mp: 'Mana', defense: 'Defense', min_atk: 'MinDam', max_atk: 'MaxDam', fire_atk: 'FireDam', cold_atk: 'ColdDam', light_atk: 'LightDam', poison_atk: 'PoisonDam' };

// Native Pet::copyTemplateData: int stat -> float32, multiply by float32 pet factor, then fcvtzs (truncate toward zero).
const petMulTrunc = (stat, factor) => Math.trunc(Math.fround(Math.fround(+stat || 0) * Math.fround(+factor || 0)));

export function petRec(id) { return DB.henchman.get(+id); }
export function petName(id) { return PET_NAMES[id] || ('Pet ' + id); }
export function petIcon(id) { return `assets/img/icon/pet-${id}.webp`; }
export function ownedPets() { return P.data.pets || {}; }
export function activePet() { const id = P.data.petActive; return id && P.data.pets?.[id] ? { id: +id, ...P.data.pets[id] } : null; }
export function statRow(star, lv) { return DB.henchmanstats.get(star * 1000 + lv) || DB.henchmanstats.get(1001); }
export function petModel(id, star) { const r = petRec(id); const m = String(star >= 5 ? r.Model5 : star >= 3 ? r.Model3 : r.Model); return m === '3202' ? '3102' : m; }

export function petStats(id, pd) {
  const r = petRec(id), row = statRow(pd.star, pd.lv);
  // Native Pet::getFinLevel() returns the pet's own stored level, not the Hero level.
  const s = { type: 'Monster', lv: pd.lv | 0, isPet: true };
  for (const k in STAT_KEYS) s[k] = petMulTrunc(row[STAT_KEYS[k]], r[STAT_KEYS[k]]);
  // Do not normalize/swap min/max here: native copyTemplateData stores both independently.
  Object.assign(s, { hit: 95, dodge: 0, critical: 8, crit_dam: 50, fire_res: 0, cold_res: 0, light_res: 0, poison_res: 0, fin_atk_speed: 100, raw_atk_speed: 100 });
  s.avg = (s.min_atk + s.max_atk) / 2 + (s.fire_atk + s.cold_atk + s.light_atk + s.poison_atk) / 2;
  return s;
}
// Native Pet::checkSkillAvailability: skill slot i (0..4) is available when star > i (star >= i+1).
// Skill level growth below is still VERIFY until the 300xxx native runtime is fully reversed.
export function petSkills(id, pd) {
  const r = petRec(id); const out = [];
  for (let i = 0; i < 5; i++) {
    const sid = +r['SkillID' + (i + 1)]; if (!sid) continue;
    const lv = pd.star >= i + 1 ? Math.min(i === 4 ? 1 : 5, pd.star - i) : 0;
    out.push({ id: sid, lv });
  }
  return out;
}
export function skillValues(sid, lv, avg) {
  // returns {p1,p2} numbers used both for the description and the effect
  const D = avg;
  switch (sid) {
    case 300000: return { p1: 10 + 4 * lv, p2: Math.round(D * (0.5 + 0.1 * lv)) };
    case 300001: return { p1: Math.round(D * (1 + 0.5 * lv)) };
    case 300002: return { p1: 10 * lv };
    case 300003: return { p1: 5 * lv };
    case 300010: return { p1: Math.round(D * (0.6 + 0.15 * lv)) };
    case 300011: return { p1: 4 * lv };
    case 300012: return { p1: Math.round(D * (0.3 + 0.1 * lv)) };
    case 300013: return { p1: 5 * lv };
    case 300014: return { p1: Math.round(D * 1.5) };
    case 300020: return { p1: Math.round(D * (0.25 + 0.05 * lv)) };
    case 300021: return { p1: 5 * lv };
    case 300022: return { p1: 4 * lv, p2: 3 * lv };
    case 300023: return { p1: Math.round(D * (1 + 0.3 * lv)), p2: 10 };
    case 300024: return { p1: Math.round(D * 0.4) };
    case 300030: return { p1: Math.round(D * (0.4 + 0.1 * lv)) };
    case 300031: return { p1: Math.round(D * 0.2 * lv) };
    case 300032: return { p1: Math.round(D * (1.2 + 0.3 * lv)) };
    case 300033: return { p1: 1 + lv };
    case 300040: return { p1: Math.round(D * (0.6 + 0.15 * lv)) };
    case 300041: return { p1: 4 * lv };
    case 300042: return { p1: Math.round(D * (0.3 + 0.08 * lv)) };
    case 300043: return { p1: 5 * lv, p2: 3 * lv };
    case 300044: return { p1: Math.round(D * 3) };
    case 300050: return { p1: Math.round(D * (0.5 + 0.1 * lv)), p2: Math.round(D * (0.6 + 0.12 * lv)) };
    case 300051: return { p1: 5 * lv };
    case 300052: return { p1: Math.round(D * (0.5 + 0.15 * lv)) };
    case 300053: return { p1: 3 * lv };
    case 300054: return { p1: Math.round(D * 0.5), p2: Math.round(D * 0.5) };
    default: return { p1: 0 };
  }
}
export function petSkillDesc(sid, lv, avg) {
  const r = DB.skill.get(sid); let s = S(r?.Desc) || '';
  const v = skillValues(sid, Math.max(1, lv), avg);
  return s.replace('<p1>', v.p1 ?? '').replace('<p2>', v.p2 ?? '').replace(/<\/?strong>/g, '');
}

// ---- progression
const EVOLVE_GENE = Object.freeze({ 1: 2, 2: 4, 3: 8, 4: 16 });

export function normalizePet(pd) {
  if (!pd) return pd;
  if (!Number.isFinite(+pd.lv) || +pd.lv < 1) pd.lv = 1;
  if (!Number.isFinite(+pd.star) || +pd.star < 1) pd.star = 1;
  if (!Number.isFinite(+pd.exp) || +pd.exp < 0) pd.exp = 0;
  // Native Pet has a separate geneCount. Old web saves did not have it, so preserve them as 0.
  if (!Number.isFinite(+pd.gene) || +pd.gene < 0) pd.gene = 0;
  return pd;
}

// Native MyPlayer::addOwnPet: obtaining a duplicate owned pet adds exactly +1 geneCount.
export function addPet(id) {
  P.data.pets ||= {};
  const old = P.data.pets[id];
  if (old) {
    normalizePet(old);
    old.gene = (old.gene | 0) + 1;
    return { duplicate: true, gene: old.gene };
  }
  P.data.pets[id] = { lv: 1, star: 1, exp: 0, gene: 0 };
  if (!P.data.petActive) P.data.petActive = id;
  return { duplicate: false, gene: 0 };
}

// Native Pet::getLevelLimit(): star * 10.
export function capLevel(pd) { normalizePet(pd); return (pd.star | 0) * 10; }
export function evolveGeneNeed(pd) { normalizePet(pd); return EVOLVE_GENE[pd.star | 0] || 0; }
export function nextInfo(pd) {
  normalizePet(pd);
  const row = statRow(pd.star, pd.lv);
  if (pd.lv >= capLevel(pd)) {
    if (pd.star >= 5) return { max: true };
    return { evolve: true, gold: +row.NextGold || 0, gene: evolveGeneNeed(pd), haveGene: pd.gene | 0 };
  }
  return { exp: +row.NextExp || 0, gold: +row.NextGold || 0 };
}
export function feedValue(it) {
  if (!it?.eq) return 0;
  const r = itemRecord(it);
  const v = Lua.call('CalPetExpFromItem', { type: +r.Type, quality: it.q });
  return v ? (v[0] | 0) : 0;
}

// Native Pet::getLevelUpExp(level): row ID = star * 1000 + level, returns NextExp.
export function petLevelUpExp(pd, lv = pd.lv) {
  normalizePet(pd);
  return +(statRow(pd.star, lv)?.NextExp || 0);
}

// Native Pet::getLevelUpGold(level): row ID = star * 1000 + level, returns NextGold.
export function petLevelUpGold(pd, lv = pd.lv) {
  normalizePet(pd);
  return +(statRow(pd.star, lv)?.NextGold || 0);
}

// Native checkUpgradePet: 1..10 foods, pet must be below the star level cap,
// and the pet's current level may not be greater than the Hero's current level.
// Upgrade gold is current-level NextGold multiplied by the number of selected foods.
export function petUpgradeInfo(id, foods) {
  const pd = normalizePet(P.data.pets?.[id]);
  if (!pd) return { error: 'Không sở hữu thú cưng này' };
  const list = Array.isArray(foods) ? foods : [];
  if (pd.lv >= capLevel(pd)) return { error: pd.star >= 5 ? 'Đã đạt cấp tối đa' : 'Pet đã chạm giới hạn cấp, hãy tiến hóa trước' };
  if ((pd.lv | 0) > (P.data.level | 0)) return { error: 'Cấp thú cưng đang cao hơn cấp nhân vật' };
  if (!list.length) return { error: 'Chưa chọn trang bị' };
  if (list.length > 10) return { error: 'Chỉ được chọn tối đa 10 món' };
  let exp = 0;
  for (const it of list) exp += feedValue(it);
  const gold = petLevelUpGold(pd) * list.length;
  if ((P.data.gold | 0) < gold) return { error: 'Không đủ vàng', exp, gold };
  return { exp, gold, count: list.length };
}

// Native Pet::addExp: add all food EXP first, then repeatedly consume the current
// level's NextExp while it is >= 1. If the next row returns 0, leftover EXP is cleared.
export function petAddExp(pd, amount) {
  normalizePet(pd);
  const oldLv = pd.lv | 0;
  let lv = oldLv;
  let exp = (pd.exp | 0) + (amount | 0);
  for (;;) {
    const need = petLevelUpExp(pd, lv);
    if (need < 1 || exp < need) {
      pd.exp = need === 0 ? 0 : exp;
      break;
    }
    lv++;
    exp -= need;
  }
  pd.lv = lv;
  return { oldLv, newLv: lv, gainedLevels: lv - oldLv, exp: pd.exp | 0 };
}

// Native feedbackPetUpgrade: validate, remove every selected equipment item,
// subtract gold, then apply the summed EXP in one Pet::addExp call.
export function upgradePetFoods(id, foods) {
  const info = petUpgradeInfo(id, foods);
  if (info.error) return info;
  const pd = normalizePet(P.data.pets[id]);
  const selected = [...foods];
  for (const it of selected) removePetFoodItem(it);
  P.data.gold -= info.gold;
  const lv = petAddExp(pd, info.exp);
  return { ...info, ...lv };
}

function removePetFoodItem(it) {
  // Equipment instances are unique in the web save; native removes each selected item once.
  const inv = P.data.inventory || [];
  const i = inv.findIndex(x => x === it || (it.uid != null && x.uid === it.uid));
  if (i >= 0) inv.splice(i, 1);
}

// Evolve remains a separate native action from Pet Upgrade.
export function levelUp(id) {
  const pd = normalizePet(P.data.pets[id]); const n = nextInfo(pd);
  if (n.max) return 'Đã tối đa';
  if (!n.evolve) return 'Hãy cho thú cưng ăn trang bị để nhận EXP';
  if (P.data.gold < n.gold) return 'Không đủ vàng';
  if ((pd.gene | 0) < n.gene) return `Không đủ gene (${pd.gene | 0}/${n.gene})`;
  P.data.gold -= n.gold;
  pd.gene = (pd.gene | 0) - n.gene;
  pd.star++;
  return null;
}

// ---- runtime in the tower
export class PetRuntime {
  constructor(tower, id, pd) {
    this.t = tower; this.id = id; this.pd = pd;
    this.st = petStats(id, pd);
    this.skills = {}; for (const s of petSkills(id, pd)) if (s.lv) this.skills[s.id] = skillValues(s.id, s.lv, this.st.avg);
    this.unit = { isPet: true, alive: true, st: this.st, hp: this.st.max_hp, x: 0, y: 0, wx: 0, wy: 0, flip: false, alpha: 1, rank: 1, id: 'pet' };
  }
  has(sid) { return !!this.skills[sid]; }
  v(sid, k = 'p1') { return +(this.skills[sid]?.[k] || 0); }
  // permanent effects on the hero (applied from the stat hook)
  heroStat(s) {
    if (this.has(300011)) s.light_res += this.v(300011);
    if (this.has(300022)) s.poison_res += this.v(300022);
    if (this.has(300041)) s.fire_res += this.v(300041);
    if (this.has(300003)) s.gold_bonus = (s.gold_bonus || 0) + this.v(300003);
    if (this.has(300033)) s.steal_hp = (s.steal_hp || 0) + this.v(300033);
    const f = this.t.fight;
    if (f && f.time >= 20 && this.has(300004)) s.defense = Math.round(s.defense * 1.3);
    if (f && f.time >= 20 && this.has(300053)) for (const k of ['fire_res', 'cold_res', 'light_res', 'poison_res']) s[k] += this.v(300053);
    if (f && this.has(300051)) s.heal_bonus = (s.heal_bonus || 0) + this.v(300051) * Math.min(2, Math.floor(f.time / 12));
    return s;
  }
  // element damage bonus (% by element index) for the hero
  elemBonus(e) { return e === 3 ? this.v(300013) : e === 4 ? this.v(300021) : e === 1 ? this.v(300043) : 0; }
  async load(loadSkeletonData, SpineActor) {
    try {
      const data = await loadSkeletonData('npc/' + petModel(this.id, this.pd.star));
      const sk = new spine.Skeleton(data); sk.scaleX = sk.scaleY = 0.8;
      this.unit.actor = new SpineActor(sk); this.unit.baseScale = 0.8;
      this.unit.actor.state.data.defaultMix = 0;
      this.unit.actor.play('stand-1-3', true);
    } catch (e) { console.warn('pet model', e); }
  }
  // follow the hero (one tile behind)
  follow(h, dt) {
    const u = this.unit;
    const tx = h.wx + (h.flip ? 70 : -70), ty = h.wy + 15;
    const dx = tx - u.wx, dy = ty - u.wy, d = Math.hypot(dx, dy);
    const a = u.actor, busy = a && a.cur && a.cur.startsWith('attack');
    if (d > 600) { u.wx = tx; u.wy = ty; }
    else if (d > 6) {
      const sp = Math.min(d, 380 * dt); u.wx += dx / d * sp; u.wy += dy / d * sp;
      if (Math.abs(dx) > Math.abs(dy) * 0.6) { u.flip = dx < 0; if (a && !busy) a.play('run-1-3', true); }
      else if (a && !busy) a.play(dy > 0 ? 'run-1-1' : 'run-1-2', true);
    } else if (a && !busy) {
      const m = this.t.fight?.mon;
      if (m) u.flip = m.wx < u.wx; else u.flip = h.flip;
      a.play('stand-1-3', true);
    }
    u.x = h.x; u.y = h.y;
  }
  fightStart(m) {
    this.timers = { atk: 1.0, s10: 2, s14: 6, s20: 4, s24: 3, s30: 2.2, s32: 5, s40: 2, s42: 3.7, s50: 2.5, s54: 5 };
    const C = this.t.combat, h = this.t.hero;
    if (this.has(300034)) { C.instant({ type: 'attrib benefit', src: 'caster', attr: 17, bene: 20, duration: 6 }, h, m); C.instant({ type: 'speed up', src: 'caster', val: 30, duration: 6 }, h, m); this.say('Gầm!'); }
    if (this.has(300022)) C.instant({ type: 'attrib benefit', src: 'enemy', attr: 10, bene: -this.v(300022, 'p2') }, h, m);
  }
  say(txt) { this.t.floatText(this.unit.wx, this.unit.wy + 150, txt, '#ffe08a', 0.8); }
  hit(m, elem, val, kind = 'skill') {
    const C = this.t.combat; if (!m.alive) return;
    this.t.burst(m, elem);
    C.skillDamage(this.unit, m, elem, val);
  }
  update(dt, f) {
    if (!f) return;
    const m = f.mon; if (!m.alive) return;
    if (!this.timers) this.fightStart(m);
    const T = this.timers, C = this.t.combat, h = this.t.hero;
    for (const k in T) T[k] -= dt;
    if (T.atk <= 0) {
      T.atk = 2.0;
      const a = this.unit.actor; if (a) { a.cur = null; this.unit.flip = m.wx < this.unit.wx; const an = ['attack-1-3', 'skill-1-3'].find(n => a.has(n)); if (an) a.play(an, false, () => { a.cur = null; a.play('stand-1-3', true); }); }
      C.wait(0.3).then(() => { if (this.t.fight?.mon === m) C.normalAttack(this.unit, m); });
    }
    if (this.has(300010) && T.s10 <= 0) { T.s10 = 2; this.hit(m, 3, this.v(300010)); }
    if (this.has(300014) && T.s14 <= 0) { T.s14 = 6; C.instant({ type: 'speed up', src: 'caster', val: 15, duration: 4 }, h, m); C.run([{ type: 'skill damage', src: 'caster', tgt: 'enemy', elem: 3, val: this.v(300014) / 4, period: 1, loop: 4 }], this.unit, m); }
    if (this.has(300020) && T.s20 <= 0) { T.s20 = 4; C.run([{ type: 'skill damage', src: 'caster', tgt: 'enemy', elem: 4, val: this.v(300020), period: 1, loop: 4 }], this.unit, m); }
    if (this.has(300024) && T.s24 <= 0) { T.s24 = 3; C.heal(h, this.v(300024), true); }
    if (this.has(300030) && T.s30 <= 0) { T.s30 = 2.2; this.hit(m, 0, this.v(300030)); C.wait(0.2).then(() => this.hit(m, 0, this.v(300030))); }
    if (this.has(300032) && T.s32 <= 0) { T.s32 = 5; this.say('Cắn!'); this.hit(m, 0, this.v(300032)); }
    if (this.has(300040) && T.s40 <= 0) { T.s40 = 2; this.hit(m, 1, this.v(300040)); }
    if (this.has(300042) && T.s42 <= 0) { T.s42 = 3.7; C.run([{ type: 'skill damage', src: 'caster', tgt: 'enemy', elem: 1, val: this.v(300042) * 2 / 3, period: 1, loop: 3 }], this.unit, m); }
    if (this.has(300050) && T.s50 <= 0) { T.s50 = 2.5; if (Math.random() < 0.5) C.heal(h, this.v(300050)); else this.hit(m, 0, this.v(300050, 'p2')); }
    if (this.has(300054) && T.s54 <= 0) { T.s54 = 5; C.heal(h, this.v(300054), true); this.hit(m, 4, this.v(300054, 'p2')); }
  }
  // hooks
  onHeroAttacked(m) {
    const C = this.t.combat;
    if (this.has(300000) && Math.random() * 100 < this.v(300000)) { this.say('Phản đòn!'); this.hit(m, 0, this.v(300000, 'p2')); }
    if (this.has(300012)) this.hit(m, 3, this.v(300012));
  }
  onHeroCrit(m) { if (this.has(300052)) { this.say('Thuyền băng!'); this.hit(m, 2, this.v(300052)); } }
  onHeroSkill(slot, m) {
    const C = this.t.combat;
    if (slot === 2 && this.has(300023)) { this.hit(m, 4, this.v(300023)); C.instant({ type: 'attrib gain', src: 'enemy', attr: 3, gain: -10, duration: 5 }, this.t.hero, m); }
    if (slot === 3 && this.has(300044)) { this.say('Hơi thở rồng!'); this.hit(m, 1, this.v(300044)); }
  }
  ignoreDef() { return this.v(300031); }
  trapReduce() { return this.v(300002); }
  floorExp() { return this.v(300001); }
}
