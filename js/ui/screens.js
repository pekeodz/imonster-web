// Original-layout screens built from the game's own CocosBuilder scenes (see ccb.js):
// character / bag (ui/package + ui/item), and the shared item cell (object/button-6-1).
import { DB, S } from '../engine/db.js';
import { Audio2 } from '../engine/audio.js';
import { Lua } from '../engine/lua.js';
import { P, stats, save, equip, unequip, removeItem, canEquip } from '../game/profile.js';
import { expRow } from '../game/stats.js';
import { itemName, itemIcon, itemQuality, itemRecord, attrText, sellPrice, toLuaEqu, slotsForType } from '../game/items.js';
import { story } from '../game/story.js';
import { loadCCB, CCBView, openScene } from './ccb.js';

const fmt = n => (Math.round(n) || 0).toLocaleString('vi-VN');
// ring position (equip_root_N) -> profile slot
export const RING_SLOTS = { 0: 'weapon', 1: 'helm', 2: 'chest', 3: 'glove', 4: 'cuish', 5: 'boot', 6: 'necklace', 7: 'ring1', 8: 'spirit' };
const Q_RGB = { 1: [235, 235, 235], 2: [70, 160, 255], 3: [190, 90, 255], 4: [255, 160, 30], 5: [255, 60, 60] };
const Q_CSS = { 1: '#f4f0e6', 2: '#56b0ff', 3: '#c77dff', 4: '#ffae2b', 5: '#ff5050' };
const score = it => Math.round((Lua.call('CalEquipmentScore', toLuaEqu(it)) || [0])[0]);

// ---------------------------------------------------------------- item cell (object/button-6-1)
export async function makeCell(host, onTap) {
  const def = await loadCCB('object/button-6-1');
  const v = new CCBView(def); await v.ready();
  host.append(v.el);
  for (const n of ['fashion_root', 'new_root', 'lock_root', 'select_root', 'desc_root', 'bp_lock_node', 'bp_ad_node', 'bp_got_node']) v.show(n, false);
  if (onTap) v.tap('control', onTap);
  v.setItem = it => fillCell(v, it);
  v.setItem(null);
  return v;
}
export function fillCell(v, it, opts = {}) {
  const img = v.find('image');
  if (!it) {
    v.show('image', false); v.show('quality_root_1', false); v.text('num', ''); v.text('level', '');
    for (let i = 0; i < 3; i++) v.show('hole_root_' + i, false);
    v.show('select_root', false); v.show('new_root', false);
    if (v.find('control')) v.find('control').el.style.pointerEvents = opts.tapEmpty ? 'auto' : 'none';
    return;
  }
  if (v.find('control')) v.find('control').el.style.pointerEvents = 'auto';
  v.show('image', true);
  if (img) {
    img.inner.style.cssText = `position:absolute;left:-37px;top:-37px;width:74px;height:74px;background:url(${itemIcon(it)}) center/contain no-repeat`;
    img.customImg = true;
  }
  const q = itemQuality(it);
  v.show('quality_root_1', q >= 2);
  const qr = v.find('quality_root_1'); if (qr) qr.el.style.filter = tint(Q_RGB[q] || Q_RGB[1]);
  v.text('num', !it.eq && (it.n || 1) > 1 ? 'x' + it.n : '');
  v.text('level', it.eq && it.inte ? '+' + it.inte : '');
  const holes = it.eq ? (it.q >= 4 ? 3 : it.q === 3 ? 2 : it.q === 2 ? 1 : 0) : 0;
  for (let i = 0; i < 3; i++) { v.show('hole_root_' + i, i < holes); v.show('gem_node_' + i, !!it.gems?.[i]); }
  v.show('new_root', !!it.isNew);
  v.show('select_root', !!opts.selected);
}
function tint(c) { // reuse the svg colour filters of ccb.js through a tiny probe
  const id = 'tint_' + c.join('_');
  if (!document.getElementById(id)) {
    let svg = document.getElementById('cellTints');
    if (!svg) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'cellTints'; svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.style.position = 'absolute'; document.body.append(svg); }
    svg.insertAdjacentHTML('beforeend', `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${c[0] / 255} 0 0 0 0 0 ${c[1] / 255} 0 0 0 0 0 ${c[2] / 255} 0 0 0 0 0 1 0"/></filter>`);
  }
  return `url(#${id})`;
}

// ---------------------------------------------------------------- bag panel (ui/item)
export class BagPanel {
  constructor(ui, view, opts = {}) {
    this.ui = ui; this.v = view; this.opts = opts; this.page = 0; this.sel = null; this.cells = [];
  }
  async init() {
    const v = this.v;
    for (let i = 1; i <= 20; i++) {
      const slot = v.slot('item_' + i); slot.style.left = '50px'; slot.style.bottom = '50px';
      const idx = i - 1;
      this.cells.push(await makeCell(slot, () => this.tapCell(idx)));
    }
    this.info = v.sub('item_icon'); // the info panel's own item cell
    if (this.info) for (const n of ['fashion_root', 'new_root', 'lock_root', 'select_root', 'desc_root', 'bp_lock_node', 'bp_ad_node', 'bp_got_node']) this.info.show(n, false);
    // page_btn_0 = "Equipping" (equipped items, used by the smithy), page_btn_1..9 = bag pages
    for (let i = 1; i <= 9; i++) v.tap('page_btn_' + i, () => { this.page = i - 1; this.sel = null; this.render(); });
    v.tap('page_btn_0', () => { this.page = -1; this.sel = null; this.render(); });
    for (let i = 2; i <= 9; i++) v.tap('lock_btn_' + i, () => this.buyPage(i));
    v.tap('outside_button', () => { if (this.sel) { this.sel = null; this.render(); } });
    v.tap('junk_button_1', () => this.opts.onSellJunk?.(1));
    v.tap('junk_button_2', () => this.opts.onSellJunk?.(2));
    v.tap('sell_button_1', () => this.sel?.it && this.opts.onSell?.(this.sel.it));
    v.tap('sell_button_2', () => this.sel?.it && this.opts.onSell?.(this.sel.it));
    v.tap('confirm_button_1', () => this.sel && this.opts.onConfirm?.(this.sel));
    v.tap('confirm_button_2', () => { this.sel = null; this.render(); });
    v.show('item_lock', false); v.show('op_hint_root', false);
    this.render();
  }
  get pages() { return Math.max(1, Math.min(9, Math.ceil(P.data.bagSize / 20))); }
  list() { // items shown on the current page
    const p = P.data;
    if (this.page === -1) return Object.values(this.opts.equippedOrder ? this.opts.equippedOrder.map(s => p.equipped[s]) : Object.values(p.equipped)).filter(Boolean).slice(0, 20);
    return p.inventory.slice(this.page * 20, this.page * 20 + 20);
  }
  pageCost(i) { return 2000 * Math.pow(2, i - 3); }
  buyPage(i) { // lock_btn_i unlocks bag page i
    const p = P.data; if (i !== this.pages + 1) { this.ui.toast('Mở khoá trang trước đó trước'); return; }
    const cost = this.pageCost(i);
    this.ui.confirm(`Mở thêm trang túi đồ số ${i} (20 ô) với ${fmt(cost)} vàng?`, () => {
      if (p.gold < cost) { this.ui.toast('Không đủ vàng'); return; }
      p.gold -= cost; p.bagSize = i * 20; Audio2.play('ui-030'); save(); this.render(); this.opts.onChange?.();
    });
  }
  tapCell(idx) {
    const it = this.list()[idx]; if (!it) return;
    if (this.sel?.it === it && !this.opts.noDoubleTap) { this.opts.onConfirm?.(this.sel); return; } // second tap = equip / use
    const slot = this.page === -1 ? Object.keys(P.data.equipped).find(k => P.data.equipped[k] === it) : null;
    this.select({ it, from: this.page === -1 ? 'equip' : 'bag', slot });
    this.opts.onSelect?.(this.sel);
  }
  select(s) { this.sel = s; if (s?.it) delete s.it.isNew; this.render(); }
  render() {
    const p = P.data, v = this.v, filt = this.opts.filter;
    for (let i = 1; i <= 9; i++) {
      v.show('page_btn_' + i, i <= this.pages);
      const pb = v.sub('page_btn_' + i); if (pb) { pb.text('text_label', String(i)); pb.play(i - 1 === this.page ? 'select' : 'normal'); }
    }
    for (let i = 2; i <= 9; i++) v.show('lock_btn_' + i, i === this.pages + 1);
    v.show('page_btn_0', !!this.opts.equippedTab);
    const pb0 = v.sub('page_btn_0'); if (pb0) pb0.play(this.page === -1 ? 'select' : 'normal');
    if (this.page >= this.pages) this.page = this.pages - 1;
    const list = this.list();
    for (let i = 0; i < 20; i++) {
      const it = list[i];
      fillCell(this.cells[i], it, { selected: this.sel?.it === it && !!it });
      const dim = it && filt && !filt(it);
      this.cells[i].el.style.opacity = dim ? 0.35 : 1;
    }
    // info panel
    const s = this.sel;
    v.show('icon_root', !!s);
    const info = this.v.slot('item_info_root'); info.innerHTML = '';
    v.show('junk_node', !s); v.show('sell_node', !!s && s.from === 'bag' && !this.opts.noSell); v.show('confirm_node', !!s);
    if (!s) { ['item_name', 'item_type', 'item_score', 'item_base', 'item_tips', 'attr_level'].forEach(n => v.text(n, '')); return; }
    const it = s.it, r = itemRecord(it), q = itemQuality(it);
    if (this.info) fillCell(this.info, it);
    v.text('item_name', itemName(it) + (it.inte ? ` +${it.inte}` : ''));
    const nm = v.find('item_name'); if (nm) nm.el.style.color = Q_CSS[q] || '#fff';
    v.text('item_type', it.eq ? (S('itemtype_' + r.Type) || '') : (S('itemtype_' + r.Type) || ''));
    v.text('item_score', it.eq ? '★ ' + fmt(score(it)) : '');
    v.text('attr_level', it.eq ? 'Lv.' + it.lv : '');
    const req = +r.LevelReq || 1;
    v.text('item_tips', it.eq ? `Yêu cầu cấp ${req}` + (p.level < req ? ' (chưa đủ)' : '') : `Giá bán: ${fmt(sellPrice(it))}`);
    if (it.eq) {
      v.text('item_base', '');
      const lines = [];
      if (+r.Type >= 10 && +r.Type <= 12 && it.spd) lines.push(`<div class="ccb-attr base">Tốc đánh ${it.spd}%</div>`);
      for (const b of it.base) lines.push(`<div class="ccb-attr base">${attrText(b.a, b.v)}</div>`);
      for (const b of it.affix) lines.push(`<div class="ccb-attr aff">${attrText(b.a, b.v)}</div>`);
      for (const g of it.gems || []) if (g) lines.push(`<div class="ccb-attr gem">◆ ${g.attrs.map(a => attrText(a.a, a.v)).join(', ')}</div>`);
      if (s.from === 'equip') lines.push(`<div class="ccb-attr hint">Chạm ✔ để tháo ra</div>`);
      else if (this.opts.hint) lines.push(`<div class="ccb-attr hint">${this.opts.hint(it)}</div>`);
      else {
        const sl = slotsForType(r.Type)[0], cur = sl && p.equipped[sl];
        if (cur) { const d = score(it) - score(cur); lines.push(`<div class="ccb-attr ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${fmt(Math.abs(d))} so với đang mặc</div>`); }
        lines.push(`<div class="ccb-attr hint">Chạm ✔ hoặc chạm lại để trang bị</div>`);
      }
      info.innerHTML = `<div class="ccb-attrs">${lines.join('')}</div>`;
    } else {
      v.text('item_base', '');
      const desc = String(S(r.ItemDesc) || '');
      info.innerHTML = `<div class="ccb-attrs"><div class="ccb-attr">${desc.replace(/\\n|\n/g, '<br>').replace(/<(?!br>)[^>]*>/g, '')}</div>${+r.UseEffect ? '<div class="ccb-attr hint">Chạm ✔ để dùng</div>' : ''}</div>`;
    }
    v.text('coin_value', fmt(sellPrice(it)));
  }
}

// ---------------------------------------------------------------- character screen (ui/package)
export async function openPackage(ui) {
  const g = ui.g, p = P.data;
  story('open package', {});
  const v = await openScene('ui/package', ui.modalEl);
  ui.ccbOpen(v, true);
  const itemDef = await loadCCB('ui/item');
  const iv = new CCBView(itemDef); await iv.ready();
  v.slot('item_root').append(iv.el);
  const bag = new BagPanel(ui, iv, {
    onConfirm: s => act(s),
    onSell: it => { const pr = sellPrice(it); ui.confirm(`Bán ${itemName(it)} lấy ${fmt(pr)} vàng?`, () => { removeItem(it.uid); p.gold += pr; Audio2.play('ui-030'); bag.sel = null; save(); refresh(); }); },
    onSellJunk: k => { const maxQ = k === 1 ? 1 : 2; const list = p.inventory.filter(it => it.eq && it.q <= maxQ && !it.locked); if (!list.length) { ui.toast(k === 1 ? 'Không có đồ trắng' : 'Không có đồ trắng/xanh'); return; } const gold = list.reduce((a, it) => a + sellPrice(it), 0); ui.confirm(`Bán ${list.length} món ${k === 1 ? 'trắng' : 'trắng + xanh'} lấy ${fmt(gold)} vàng?`, () => { p.inventory = p.inventory.filter(it => !list.includes(it)); p.gold += gold; Audio2.play('ui-030'); save(); refresh(); }); },
    onChange: () => refresh(),
  });
  await bag.init();
  // equipment ring
  const ringCells = {};
  for (const [idx, slot] of Object.entries(RING_SLOTS)) {
    const host = v.slot('equip_root_' + idx);
    ringCells[slot] = await makeCell(host, () => { const it = p.equipped[slot]; if (it) bag.select({ it, from: 'equip', slot }); });
  }
  v.tap('close_btn', () => close());
  v.show('skill_button', true); v.tap('skill_button', () => { close(); ui.skillTree(); });
  // two equipment pages (sets)
  p.equipSet ||= 0;
  v.tap('equ_page_button_1', () => switchSet(0)); v.tap('equ_page_button_2', () => switchSet(1));
  function switchSet(k) {
    if (p.equipSet === k) return;
    const other = p.equippedAlt || {}; p.equippedAlt = p.equipped; p.equipped = other; p.equipSet = k;
    for (const s of Object.keys(p.equipped)) { const it = p.equipped[s]; if (it && !canEquip(it)) { delete p.equipped[s]; p.inventory.push(it); } }
    Audio2.play('ui-020'); save(); g.onEquipChanged(); refresh();
  }
  function act(s) {
    const it = s.it;
    if (s.from === 'equip') { if (unequip(s.slot)) { Audio2.play('ui-020'); bag.sel = null; save(); g.onEquipChanged(); refresh(); } else ui.toast('Túi đồ đã đầy!'); return; }
    if (it.eq) {
      if (!canEquip(it)) { ui.toast('Chưa đủ cấp'); return; }
      equip(it.uid); Audio2.play(itemRecord(it).DragSound || 'ui-020'); bag.sel = null; save(); g.onEquipChanged(); story('change equip', {}); refresh(); return;
    }
    if (+itemRecord(it).UseEffect) { ui.useItem(it); bag.sel = null; save(); refresh(); return; }
    ui.toast('Không dùng trực tiếp được');
  }
  function refresh() {
    const s = stats(), row = expRow(p.level);
    v.text('name', p.name); v.text('level', String(p.level));
    v.text('exp_value', ((p.exp / (row?.NextExp || 1)) * 100).toFixed(1) + '%');
    v.scaleX('exp_bar', Math.min(1, p.exp / (row?.NextExp || 1)));
    v.text('id_value', '');
    v.scaleX('hp_bar', Math.min(1, (p.hp ?? s.max_hp) / s.max_hp)); v.scaleX('mp_bar', Math.min(1, (p.mp ?? s.max_mp) / s.max_mp));
    v.text('hp_value', `${fmt(p.hp ?? s.max_hp)} / ${fmt(s.max_hp)}`); v.text('mp_value', `${fmt(p.mp ?? s.max_mp)} / ${fmt(s.max_mp)}`);
    v.text('health_hp', `${fmt(s.hit_hp || 0)} / ${fmt(s.kill_hp || 0)}`); v.text('health_mp', `${fmt(s.hit_mp || 0)} / ${fmt(s.kill_mp || 0)}`);
    v.text('atk_value', `${fmt(s.min_atk)} ~ ${fmt(s.max_atk)}`);
    v.text('fire_atk_value', fmt(s.fire_atk)); v.text('cold_atk_value', fmt(s.cold_atk)); v.text('poison_atk_value', fmt(s.poison_atk)); v.text('light_atk_value', fmt(s.light_atk));
    v.text('def_value', fmt(s.defense));
    v.text('fire_def_value', s.fire_res + '%'); v.text('cold_def_value', s.cold_res + '%'); v.text('poison_def_value', s.poison_res + '%'); v.text('light_def_value', s.light_res + '%');
    v.text('atk_speed_value', String(s.fin_atk_speed)); v.text('hit_value', String(s.hit)); v.text('dodge_value', String(s.dodge));
    v.text('crit_value', s.critical + '%'); v.text('crit_damage_value', s.crit_dam + '%');
    v.text('fortunate_value', String(s.luck || 0)); v.text('exp_extra_value', (s.exp_bonus || 0) + '%'); v.text('gold_extra_value', (s.gold_bonus || 0) + '%');
    let total = 0; for (const it of Object.values(p.equipped)) if (it) total += score(it);
    v.text('score', fmt(total));
    for (const slot of Object.values(RING_SLOTS)) fillCell(ringCells[slot], p.equipped[slot] || null, { selected: bag.sel?.from === 'equip' && bag.sel.slot === slot });
    for (const k of [1, 2]) { const b = v.sub('equ_page_button_' + k); b && b.play((p.equipSet || 0) === k - 1 ? 'select' : 'normal'); }
    bag.render();
    ui.hud?.(g.tower);
  }
  const origRender = bag.render.bind(bag);
  bag.render = () => { origRender(); for (const slot of Object.values(RING_SLOTS)) fillCell(ringCells[slot], p.equipped[slot] || null, { selected: bag.sel?.from === 'equip' && bag.sel.slot === slot }); };
  refresh();
  p.inventory.forEach(it => { delete it.isNew; });
  function close() { ui.ccbClose(v, () => { g.onEquipChanged(); story('close package', {}); if (g.tower) ui.hud(g.tower); }); }
  return v;
}
