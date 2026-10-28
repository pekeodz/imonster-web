// Gems / inlay (GetGemAttr + CalEquipmentInlay), breakup (CalBreakupMaterial),
// forge recipes (recipe.csv + GetInitRecipes) — all formulas from the original formular.lua.
import { DB, S } from '../engine/db.js';
import { Lua } from '../engine/lua.js';
import { P, addItem, removeItem } from './profile.js';
import { makeAny, makeItem, toLuaEqu, itemRecord } from './items.js';

export const GEM = {}; // gemId -> { grade, lv, a1, a2 }
export async function loadGemTable() {
  const src = await fetch('lua/formular.lua').then(r => r.text());
  const block = src.slice(src.indexOf('local tGemAttrFactor'), src.indexOf('local tEquipScoreFactor'));
  for (const m of block.matchAll(/\[(\d{6})\]\s*=\s*\{\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)/g)) GEM[+m[1]] = { grade: +m[2], lv: +m[3], a1: +m[4], a2: +m[5] };
}
export const isGem = it => !it.eq && !!GEM[it.id];
export function socketCount(it) { return !it?.eq ? 0 : it.q >= 4 ? 3 : it.q === 3 ? 2 : it.q === 2 ? 1 : 0; }
export function gemAttrs(gemId) {
  const g = GEM[gemId]; if (!g) return [];
  const out = [];
  for (const a of [g.a1, g.a2]) {
    if (!a) continue;
    const r = Lua.call('GetGemAttr', gemId, a);
    const v = r ? Math.round(r[0]) : 0;
    if (v > 0) out.push({ a, v });
  }
  return out;
}
export function inlayCost(it, slot) {
  const old = {}; (it.gems || []).forEach((g, i) => { if (g) old[i + 1] = g.id; });
  const nw = {}; nw[slot + 1] = 1;
  const r = Lua.call('CalEquipmentInlay', toLuaEqu(it), old, nw);
  return r?.[0]?.gold || it.lv * 50;
}
export function inlay(it, slot, gem) {
  it.gems ||= [];
  const cost = inlayCost(it, slot);
  if (P.data.gold < cost) return 'Không đủ vàng';
  P.data.gold -= cost;
  removeItem(gem.uid, 1);
  it.gems[slot] = { id: gem.id, attrs: gemAttrs(gem.id) };
  return null;
}
export function unsocket(it, slot) { // the old gem is destroyed, like in the original (replacement costs ×5)
  if (it.gems) it.gems[slot] = null;
}

// ---------------- breakup
export function breakupResult(it) {
  const r = itemRecord(it);
  const e = toLuaEqu(it); e.is_fashion = r?.Fashion === 1 || r?.Fashion === '1';
  // white (quality 1) normal gear indexes tItemGroup[0] in formular.lua -> Lua error -> not decomposable
  if (+e.type !== 32 && !e.is_fashion && (+e.quality || 1) <= 1) return null;
  const res = Lua.call('CalBreakupMaterial', e);
  if (!res || !res[0]) return null;
  return { id: res[0] | 0, n: res[1] | 0 };
}
export function breakup(it) {
  const r = breakupResult(it); if (!r) return null;
  removeItem(it.uid);
  addItem(makeItem(r.id, r.n));
  return r;
}

// ---------------- recipes (forge)
export function knownRecipes() {
  const p = P.data;
  if (!p.recipes) { const init = Lua.call('GetInitRecipes'); p.recipes = (init?.[0] || []).map(Number); }
  return p.recipes;
}
export function learnRecipe(id) { const k = knownRecipes(); if (!k.includes(+id)) k.push(+id); }
export function recipeInputs(rc) {
  const out = [];
  for (let i = 1; i <= 5; i++) { const v = rc['Input' + i]; if (v === '' || v == null) continue; const [id, n] = String(v).split(';'); out.push({ id: +id, n: +(n || 1) }); }
  return out;
}
export function countItem(id) { return P.data.inventory.filter(x => x.id === id).reduce((a, x) => a + (x.eq ? 1 : (x.n || 1)), 0); }
export function canCraft(rc) {
  for (const i of recipeInputs(rc)) if (countItem(i.id) < i.n) return false;
  return P.data.gold >= recipeCost(rc);
}
export function recipeCost(rc) { return (+rc.Currency === 1 || rc.Currency === '') ? (+rc.Cost || 0) : (+rc.Cost || 0) * 100; }
export function craft(rc) {
  if (!canCraft(rc)) return 'Thiếu nguyên liệu hoặc vàng';
  const out = makeAny(+rc.Output, Math.max(P.data.level, +(DB.equip.get(+rc.Output)?.LevelReq) || 1));
  if (!out) return 'Không tạo được vật phẩm';
  for (const i of recipeInputs(rc)) {
    let need = i.n;
    for (const it of [...P.data.inventory]) { if (need <= 0) break; if (it.id !== i.id) continue; const take = it.eq ? 1 : Math.min(need, it.n || 1); removeItem(it.uid, take); need -= take; }
  }
  P.data.gold -= recipeCost(rc);
  if (!addItem(out)) return 'Túi đồ đã đầy!';
  return out;
}
export const CATEGORY_VI = { 1: 'Vũ khí', 2: 'Giáp', 3: 'Trang sức', 4: 'Đặc biệt', 5: 'Nguyên liệu' };
