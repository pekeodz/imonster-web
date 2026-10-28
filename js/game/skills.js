// Skill system. Skill effects come from the ORIGINAL lua/skill.lua (g_skills[id].use / description)
// and monster AI from lua/monsterai.lua (g_monster_ai[id].action). This file interprets the effect lists.
import { DB, S } from '../engine/db.js';
import { Lua } from '../engine/lua.js';
import { P } from './profile.js';

export const COMBAT_GROUPS = [4, 9, 19, 24];     // fight skill slots #1..#4
export const ADVENTURE_GROUP = 14;               // map skills (Telekinesis / Teleport / Foresight)
// AttribType (skill.lua) -> stat key(s)
const ATTR = {
  1: ['min_atk'], 2: ['max_atk'], 3: ['min_atk', 'max_atk'], 4: ['defense'], 5: ['max_hp'], 6: ['max_mp'],
  7: ['fire_res'], 8: ['cold_res'], 9: ['light_res'], 10: ['poison_res'], 11: ['fire_atk'], 12: ['cold_atk'], 13: ['light_atk'], 14: ['poison_atk'],
  15: ['hit'], 16: ['dodge'], 17: ['critical'], 18: ['crit_dam'], 19: ['fin_atk_speed'], 20: ['luck'], 21: ['exp_bonus'], 22: ['gold_bonus'],
  23: ['hit_hp'], 24: ['kill_hp'], 25: ['hit_mp'], 26: ['kill_mp'], 27: ['extra_red'], 28: ['extra_blue'], 29: ['mp_cost'], 30: ['skill_cd'], 31: ['debuff_res'], 32: ['control_res'],
};
const ELEM_KEY = ['physics', 'fire', 'cold', 'light', 'poison'];
const ELEM_RES = [null, 'fire_res', 'cold_res', 'light_res', 'poison_res'];
export const ELEM_COLOR = ['#ffffff', '#ff8a3a', '#7fd8ff', '#d77dff', '#8de05a'];

// ------------------------------------------------------------------ learning
export function skillRow(id) { return DB.skill.get(+id); }
export function skillLevel(id) { return P.data?.skills?.[id] || 0; }
export function learnedInGroup(g) {
  const sk = P.data.skills; for (const id in sk) { const r = DB.skill.get(+id); if (r && +r.Group === g && sk[id] > 0) return +id; } return 0;
}
export function pointsSpent() { let n = 0; for (const id in P.data.skills) n += P.data.skills[id]; return n; }
export function groupsOrdered() {
  const m = new Map();
  for (const r of DB.skillRows) { const g = +r.Group; if (!g || g >= 99) continue; if (!m.has(g)) m.set(g, []); m.get(g).push(r); }
  return [...m.entries()].sort((a, b) => a[0] - b[0]);
}
export function canLearn(id) {
  const r = DB.skill.get(+id); if (!r) return { ok: false, why: '?' };
  const lv = skillLevel(id), max = +r.MaxLevel || 5;
  if (lv >= max) return { ok: false, why: 'Đã tối đa' };
  if (P.data.skillPoints <= 0) return { ok: false, why: 'Hết điểm kỹ năng' };
  const g = +r.Group; const other = learnedInGroup(g);
  if (other && other !== +id) return { ok: false, why: 'Mỗi hàng chỉ chọn 1 kỹ năng' };
  if (r.Condition !== '' && r.Condition != null) {
    const conds = String(r.Condition).split(';').map(Number);
    if (!conds.some(c => learnedInGroup(c))) return { ok: false, why: 'Cần học hàng trước' };
  }
  const need = +r.PointReq || 0;
  if (pointsSpent() < need) return { ok: false, why: `Cần đã dùng ${need} điểm` };
  return { ok: true };
}
export function learn(id) {
  const c = canLearn(id); if (!c.ok) return c;
  P.data.skills[id] = (P.data.skills[id] || 0) + 1; P.data.skillPoints--;
  invalidatePassives();
  return { ok: true };
}
export function resetSkills() {
  const n = pointsSpent(); P.data.skills = {}; P.data.skillPoints += n; invalidatePassives();
}
export function combatSlots() { return COMBAT_GROUPS.map(g => learnedInGroup(g)); }
export function adventureSkill() { return learnedInGroup(ADVENTURE_GROUP); }

export function skillDesc(id, lv) {
  const r = DB.skill.get(+id); if (!r) return '';
  let s = S(r.Desc) || '';
  const dd = descNum(id, Math.max(1, lv));
  if (dd) for (const k in dd) s = s.split(`<${k}>`).join(dd[k]);
  return s;
}
function descNum(id, lv) {
  const r = Lua.call('__skillDesc', id, lv); return r?.[0];
}

// ------------------------------------------------------------------ Lua glue
export function installSkillLua() {
  Lua.exec(`
    function __skillUse(id, caster, enemy, lv)
      local s = g_skills[id]; if not s or not s.use then return {} end
      return s.use(caster, enemy, lv) or {}
    end
    function __skillDesc(id, lv)
      local s = g_skills[id]; if not s or not s.description then return nil end
      return s.description(lv)
    end
    function __monsterAI(id, monster, enemy, battle)
      local a = g_monster_ai and g_monster_ai[id]; if not a or not a.action then return false end
      local r = a.action(monster, enemy, battle)
      return r and true or false
    end
    __battles = {}
    function __monsterAIb(id, key, monster, enemy)
      __battles[key] = __battles[key] or {}
      local b = __battles[key]; b._time = monster._time or 0
      return __monsterAI(id, monster, enemy, b)
    end
    function __battleEnd(key) __battles[key] = nil end
  `, 'skillglue');
}
export const skillHost = {
  IsSkillLearned: id => skillLevel(id) > 0,
  GetSkillLevel: id => skillLevel(id),
};
// queue for sw.UseSkill (monster AI)
export const pendingUse = [];
skillHost.UseSkill = (id, caster, enemy) => { pendingUse.push(id); return null; };

export function skillEffects(id, caster, enemy, lv) {
  const r = Lua.call('__skillUse', +id, caster, enemy, lv);
  const lst = r?.[0];
  return Array.isArray(lst) ? lst : (lst ? Object.values(lst) : []);
}

// ------------------------------------------------------------------ passives (hero)
let passiveCache = null;
let passiveHook = null;
export function setPassiveHook(f) { passiveHook = f; }
// skills / equipment changed -> MyPlayer::resetPassiveSkillEffect (native passives live on the hero unit)
export function invalidatePassives() { passiveCache = null; if (passiveHook) passiveHook(); }
export function heroPassives(baseStats) {
  if (passiveCache) return passiveCache;
  const out = { stat: [], perm: [], specials: {}, double: 0 };
  const sk = P.data?.skills || {};
  for (const id in sk) {
    const lv = sk[id]; if (!lv) continue;
    const r = DB.skill.get(+id); if (!r || +r.Type !== 3) continue;
    const effs = skillEffects(+id, baseStats, baseStats, lv);
    for (const e of effs) {
      if (!e || !e.type) continue;
      if (e.type === 'attrib benefit' || e.type === 'attrib gain') out.stat.push(e);
      else if (e.type === 'double attack') out.double += +e.perc || 0;
      else if (e.type === 'single skill') out.specials[e.id] = e;
      else out.perm.push(e);
    }
  }
  passiveCache = out;
  return out;
}
// DEPRECATED (wrong order: benefit before gain). Use applyBuffLayer in stats.js. Kept only for reference.
export function applyAttrEffects(st, effs) {
  const gains = {};
  for (const e of effs) {
    const keys = ATTR[e.attr]; if (!keys) continue;
    if (e.type === 'attrib benefit') for (const k of keys) st[k] = (st[k] || 0) + (+e.bene || 0);
    else for (const k of keys) gains[k] = (gains[k] || 0) + (+e.gain || 0);
  }
  for (const k in gains) st[k] = (st[k] || 0) * (1 + gains[k] / 100);
  for (const k of ['min_atk', 'max_atk', 'defense', 'max_hp', 'max_mp']) if (st[k] != null) st[k] = Math.max(0, Math.round(st[k]));
  return st;
}
// hero specials that change stats (from "single skill" passives)
export function applyHeroSpecials(st, sp, ctx = {}) {
  const v = id => +(sp[id]?.p1 || 0), v2 = id => +(sp[id]?.p2 || 0);
  if (sp[103000]) { const add = st.defense * v(103000) / 100; st.min_atk += Math.round(add); st.max_atk += Math.round(add); }
  if (sp[104100]) st.max_mp = Math.round(st.max_mp * (1 + v(104100) / 100));
  if (sp[112000] && ctx.weaponType === 10) { st.fin_atk_speed *= 1 + v(112000) / 100; }
  if (sp[112001] && ctx.weaponType === 11) { st.min_atk = Math.round(st.min_atk * (1 + v(112001) / 100)); st.max_atk = Math.round(st.max_atk * (1 + v(112001) / 100)); }
  if (sp[112002] && ctx.weaponType === 12) { st.critical += v(112002); }
  return st;
}

// ------------------------------------------------------------------ buff helpers (runtime, per unit)
export function activeBuffs(u, now) { if (!u.buffs) return []; u.buffs = u.buffs.filter(b => !b.until || b.until > now); return u.buffs; }
export function addBuff(u, e, now) {
  u.buffs ||= [];
  const b = { ...e, until: e.duration ? now + (+e.duration) : 0, t0: now };
  if (e.unique_id) u.buffs = u.buffs.filter(x => x.unique_id !== e.unique_id);
  u.buffs.push(b);
  return b;
}
export function buffMods(u, now) {
  const m = { cause: {}, be: {}, suck: 0, back: 0, speed: 0, froze: false, faint: false, recover: 0, addAtk: null, shield: null };
  for (const b of activeBuffs(u, now)) {
    if (b.type === 'cause damage change') for (const k of [...ELEM_KEY, 'attack', 'skill', 'trap']) if (b[k] != null) m.cause[k] = (m.cause[k] || 0) + +b[k];
    if (b.type === 'be damage change') for (const k of [...ELEM_KEY, 'attack', 'skill', 'trap']) if (b[k] != null) m.be[k] = (m.be[k] || 0) + +b[k];
    if (b.type === 'suck red') m.suck += +b.perc || 0;
    if (b.type === 'damage back') m.back += +b.perc || 0;
    if (b.type === 'speed up') m.speed += +b.val || 0;
    if (b.type === 'froze') m.froze = true;
    if (b.type === 'faint') m.faint = true;
    if (b.type === 'recover change') m.recover += +b.perc || 0;
    if (b.type === 'shield' && b.left > 0) m.shield = b;
    if (b.type === 'additional attack') m.addAtk = b;
  }
  return m;
}
