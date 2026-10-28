// Original forge screens (ui/smithy, ui/inset, ui/decompose, ui/alchemy) wired to the game logic.
import { DB, S } from '../engine/db.js';
import { Audio2 } from '../engine/audio.js';
import { Lua } from '../engine/lua.js';
import { P, save, removeItem, addItem } from '../game/profile.js';
import { itemName, itemQuality, itemRecord, attrText, toLuaEqu, makeItem } from '../game/items.js';
import { isGem, socketCount, gemAttrs, inlayCost, inlay, unsocket, breakupResult, breakup, knownRecipes, recipeInputs, countItem, canCraft, recipeCost, craft } from '../game/craft.js';
import { Daily } from '../game/daily.js';
import { story } from '../game/story.js';
import { loadCCB, CCBView, openScene } from './ccb.js';
import { BagPanel, makeCell, fillCell, RING_SLOTS } from './screens.js';

const fmt = n => (Math.round(n) || 0).toLocaleString('vi-VN');
const EQUIP_ORDER = ['weapon', 'helm', 'chest', 'glove', 'cuish', 'boot', 'necklace', 'ring1', 'spirit'];
const gold = n => `<cr=255,214,90>${fmt(n)} vàng<cr=def>`;
const dia = n => `<cr=110,210,255>${fmt(n)} kim cương<cr=def>`;
const anyIcon = id => { const r = DB.equip.get(+id) || DB.item.get(+id); return r ? `assets/img/icon/item-${String(r.IconID).padStart(6, '0')}.webp` : ''; };
const anyName = id => { const r = DB.equip.get(+id) || DB.item.get(+id); return r ? S(r.ItemName) : '???'; };

async function mountBag(ui, v, opts) {
  const iv = new CCBView(await loadCCB('ui/item')); await iv.ready();
  v.slot('item_root').append(iv.el);
  const bag = new BagPanel(ui, iv, { equippedTab: true, equippedOrder: EQUIP_ORDER, noSell: true, noDoubleTap: true, ...opts });
  await bag.init();
  if (opts.startEquipped) { bag.page = -1; bag.render(); }
  return bag;
}
async function subCell(view, name) { // a named CCBFile item cell inside a scene
  const c = view.sub(name); if (!c) return null;
  for (const n of ['fashion_root', 'new_root', 'lock_root', 'select_root', 'desc_root', 'bp_lock_node', 'bp_ad_node', 'bp_got_node']) c.show(n, false);
  fillCell(c, null);
  return c;
}
function close(ui, v, after) { ui.ccbClose(v, () => { ui.g.onEquipChanged(); after && after(); }); }

// ================================================================ smithy: reinforce / refine / recast
export async function openSmithy(ui, tab = 0) {
  const p = P.data;
  story('open smithy', {});
  const v = await openScene('ui/smithy', ui.modalEl); ui.ccbOpen(v);
  let target = null, beads = [null, null, null];
  const after = new CCBView(await loadCCB('ui/smithy-1-2')); await after.ready();
  v.slot('inte_equip_root_1').append(after.el);
  const afterCell = await subCell(after, 'inte_equip_1'); after.show('new_hole_hint_1', false);
  const tcell = await makeCell(v.slot('equip_root'), null);
  const mats = []; for (let i = 0; i < 3; i++) mats.push(await subCell(v, 'inte_material_' + i));
  const bag = await mountBag(ui, v, {
    startEquipped: true,
    hint: it => it.eq ? 'Chạm để chọn món cần rèn' : (+DB.item.get(it.id)?.Type === 43 ? 'Hạt chúc phúc: chạm ô nguyên liệu để dùng' : ''),
    onSelect: s => { if (s.it.eq) { target = s.it; beads = [null, null, null]; render(); } },
  });
  v.tap('close_button', () => close(ui, v));
  for (let i = 0; i < 3; i++) v.tap('entry_button_' + i, () => { tab = i; render(); });
  v.show('auto_button', false);
  // material slots: cycle the blessing beads you own
  for (let i = 0; i < 3; i++) v.tap('inte_material_' + i, () => {
    const types = [...new Set(p.inventory.filter(it => !it.eq && +DB.item.get(it.id)?.Type === 43).map(it => it.id))];
    if (!types.length) { ui.toast('Chưa có hạt chúc phúc (chế tạo ở Lò luyện)'); return; }
    const cur = beads[i]; const k = cur ? types.indexOf(cur) : -1;
    beads[i] = k + 1 < types.length ? types[k + 1] : null;
    // never use more beads than owned
    const used = {}; beads.forEach((b, j) => { if (!b) return; used[b] = (used[b] || 0) + 1; if (used[b] > countItem(b)) beads[j] = null; });
    render();
  });
  // refine (remould): lock toggles per affix
  const locks = new Set();
  for (let i = 0; i < 7; i++) v.tap('remould_button_' + i, () => { if (!target || i >= target.affix.length) return; locks.has(i) ? locks.delete(i) : locks.add(i); render(); });
  v.tap('ok_button', () => doIt());
  function beadBonus() { return beads.reduce((a, b) => a + (b ? +DB.item.get(b).Param || 0 : 0), 0); }
  function affixRange(aid) { // sample the original formula to show where a value sits in its range
    const equ = { ...toLuaEqu(target) }; let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < 10; k++) { const r = Lua.call('CalEquipmentAffix', equ, aid); const x = r ? Math.round(r[0]) : 0; lo = Math.min(lo, x); hi = Math.max(hi, x); }
    return [lo, hi];
  }
  const refineCost = () => Math.round(target.lv * 120 * (1 + locks.size));
  const recastCost = () => Math.max(10, Math.round(target.lv / 2) + target.q * 5);
  function render() {
    for (let i = 0; i < 3; i++) { const b = v.sub('entry_button_' + i); b && b.play(i === tab ? 'select' : 'normal'); }
    v.show('none_root', !target); v.show('common_root', !!target);
    v.show('intensify_root', !!target && tab === 0); v.show('remould_root', !!target && tab === 1); v.show('recast_root', !!target && tab === 2);
    fillCell(tcell, target);
    if (!target) { v.text('none_label', 'Chọn trang bị ở túi đồ bên dưới (tab “Equiping” là đồ đang mặc)'); v.text('cost_label', ''); return; }
    const q = itemQuality(target);
    v.text('equip_name_label', `${itemName(target)}${target.inte ? ' +' + target.inte : ''}`);
    if (tab === 0) {
      const info = (Lua.call('CalEquipmentIntensify', toLuaEqu(target)) || [])[0];
      const max = !info || (target.inte || 0) >= 6;
      const next = { ...target, inte: (target.inte || 0) + (max ? 0 : 1) };
      fillCell(afterCell, next);
      after.text('inte_equip_base_1', max ? 'Đã cường hoá tối đa' : target.base.map((b, i) => `${attrText(b.a, b.v).replace(/[+\d.%]+$/, '')}<cr=60,140,40>${Math.round(info.base?.[i]?.p1 ?? b.v)}<cr=def>`).join('\n'), true);
      const rate = max ? 0 : Math.min(100, Math.round((info.success || 0) * 100) + beadBonus());
      v.text('suc_rate_label', max ? '' : `Tỉ lệ thành công: ${rate}%`);
      const g0 = max ? 0 : Math.round(info.gold || 0), d0 = max ? 0 : Math.round(info.diamond || 0);
      v.text('cost_label', max ? '' : gold(g0) + (d0 ? ' + ' + dia(d0) : ''), true);
      beads.forEach((b, i) => { if (!mats[i]) return; fillCell(mats[i], b ? { id: b, n: 1 } : null, { tapEmpty: true }); });
      v.enable('ok_button', !max);
    } else if (tab === 1) {
      const n = target.affix.length;
      for (let i = 0; i < 7; i++) {
        v.show('remould_button_' + i, i < n);
        const b = v.sub('remould_button_' + i); if (!b || i >= n) continue;
        const a = target.affix[i]; const [lo, hi] = affixRange(a.a);
        b.text('rich_text', attrText(a.a, a.v));
        const k = hi > lo ? (a.v - lo) / (hi - lo) : 1;
        const bar = b.find('value_bar'); if (bar) { bar.size = [Math.max(2, 100 * Math.min(1, k)), 30]; b.applyRec(bar, null, 0); }
        b.show('max_root', a.v >= hi); b.show('check_node', locks.has(i));
      }
      v.text('cost_label', n ? gold(refineCost()) + (locks.size ? ` (khoá ${locks.size} dòng)` : '') : 'Món này không có thuộc tính phụ', true);
      v.enable('ok_button', n > 0);
    } else {
      const n = target.affix.length;
      for (let i = 0; i < 5; i++) { v.show('recast_button_' + i, i < n); const b = v.sub('recast_button_' + i); if (b && i < n) b.text('rich_text', attrText(target.affix[i].a, target.affix[i].v)); }
      v.show('update_recast_button', false);
      v.text('cost_label', n ? dia(recastCost()) + ' hoặc ' + gold(recastCost() * 300) : 'Món này không có thuộc tính phụ', true);
      v.enable('ok_button', n > 0);
    }
    bag.render();
  }
  function pay(g0, d0) {
    if (d0 && (p.diamond || 0) >= d0) { if (p.gold < g0) return false; p.gold -= g0; p.diamond -= d0; return true; }
    const g = g0 + d0 * 300; if (p.gold < g) return false; p.gold -= g; return true;
  }
  function doIt() {
    if (!target) return;
    if (tab === 0) {
      const info = (Lua.call('CalEquipmentIntensify', toLuaEqu(target)) || [])[0]; if (!info || (target.inte || 0) >= 6) return;
      if (!pay(Math.round(info.gold || 0), Math.round(info.diamond || 0))) { ui.toast('Không đủ vàng / kim cương'); return; }
      const rate = Math.min(100, Math.round((info.success || 0) * 100) + beadBonus());
      beads.forEach(b => { if (!b) return; const it = p.inventory.find(x => x.id === b); if (it) removeItem(it.uid, 1); });
      beads = [null, null, null];
      if (Math.random() * 100 < rate) { target.inte = (target.inte || 0) + 1; target.base.forEach((b, i) => b.v = Math.round(info.base?.[i]?.p1 ?? b.v)); ui.toast('Cường hoá thành công!'); Audio2.play('powerful-1'); v.play('shake'); }
      else { ui.toast('Thất bại...'); Audio2.play('cantmove-1'); }
      Daily.progress(10, 1);
    } else if (tab === 1) {
      const cost = refineCost(); if (p.gold < cost) { ui.toast('Không đủ vàng'); return; }
      p.gold -= cost;
      target.affix.forEach((a, i) => { if (locks.has(i)) return; const r = Lua.call('CalEquipmentAffix', toLuaEqu(target), a.a); if (r) a.v = Math.round(r[0]); });
      ui.toast('Đã tinh luyện'); Audio2.play('powerful-1');
    } else {
      const c = recastCost();
      if ((p.diamond || 0) >= c) p.diamond -= c; else if (p.gold >= c * 300) p.gold -= c * 300; else { ui.toast('Không đủ kim cương / vàng'); return; }
      const r = DB.equip.get(target.id); const equ = toLuaEqu(target); const out = [];
      for (const k of ['Affix1', 'Affix2', 'Affix3', 'Affix4', 'Affix5']) {
        if (r[k] === '' || r[k] == null) continue;
        const opts = String(r[k]).split(';').filter(Boolean).map(Number); const aid = opts[Math.floor(Math.random() * opts.length)]; if (!aid) continue;
        const val = Lua.call('CalEquipmentAffix', equ, aid); if (val) out.push({ a: aid, v: Math.round(val[0] ?? 1) });
      }
      if (out.length) target.affix = out;
      ui.toast('Đã đúc lại thuộc tính'); Audio2.play('powerful-1');
    }
    save(); ui.g.onEquipChanged(); render();
  }
  render();
  return v;
}

// ================================================================ inlay (ui/inset)
export async function openInset(ui) {
  const p = P.data;
  const v = await openScene('ui/inset', ui.modalEl); ui.ccbOpen(v);
  let target = null, pending = [null, null, null], mode = 1;
  const tcell = await makeCell(v.slot('equip_root'), null);
  const gemCells = [];
  for (let i = 0; i < 3; i++) gemCells.push(await makeCell(v.slot('item_node_' + i), () => tapSocket(i)));
  const bag = await mountBag(ui, v, {
    startEquipped: true,
    hint: it => it.eq ? 'Chạm để chọn món cần khảm' : isGem(it) ? gemAttrs(it.id).map(a => attrText(a.a, a.v)).join(', ') + ' — chạm để đặt vào lỗ trống' : '',
    filter: it => it.eq ? socketCount(it) > 0 : isGem(it),
    onSelect: s => {
      const it = s.it;
      if (it.eq) { if (!socketCount(it)) { ui.toast('Món này không có lỗ khảm (cần đồ xanh trở lên)'); return; } target = it; pending = [null, null, null]; render(); return; }
      if (isGem(it) && target && mode === 1) {
        const n = socketCount(target); const i = [0, 1, 2].find(k => k < n && !target.gems?.[k] && !pending[k]) ?? [0, 1, 2].find(k => k < n && !pending[k]);
        if (i == null) { ui.toast('Không còn lỗ trống'); return; }
        const used = pending.filter(g => g && g.uid === it.uid).length; if (used >= (it.n || 1)) { ui.toast('Hết ngọc này'); return; }
        pending[i] = it; render();
      }
    },
  });
  v.tap('close_btn', () => close(ui, v));
  v.tap('radio_btn_1', () => { mode = 1; render(); }); v.tap('radio_btn_2', () => { mode = 2; pending = [null, null, null]; render(); });
  v.tap('confirm_btn', () => confirm());
  function tapSocket(i) {
    if (!target) return;
    if (pending[i]) { pending[i] = null; render(); return; }
    if (mode === 2 && target.gems?.[i]) ui.confirm('Gỡ ngọc sẽ làm vỡ viên ngọc. Tiếp tục?', () => { unsocket(target, i); save(); ui.g.onEquipChanged(); render(); });
  }
  const cost = () => pending.reduce((a, g, i) => a + (g ? inlayCost(target, i) : 0), 0);
  function render() {
    for (const k of [1, 2]) { const b = v.sub('radio_btn_' + k); b && b.play(mode === k ? 'select' : 'normal'); }
    fillCell(tcell, target);
    const n = target ? socketCount(target) : 0;
    for (let i = 0; i < 3; i++) {
      v.show('lock_root_' + i, !target || i >= n);
      const g = pending[i] ? { id: pending[i].id, n: 1 } : target?.gems?.[i] ? { id: target.gems[i].id, n: 1 } : null;
      fillCell(gemCells[i], g, { tapEmpty: !!target && i < n, selected: !!pending[i] });
      v.show('mark_root_' + i, !!pending[i]);
    }
    v.text('cost_label', target ? (mode === 1 ? (pending.some(Boolean) ? 'Phí khảm: ' + gold(cost()) : 'Chọn ngọc trong túi để khảm') : 'Chạm vào viên ngọc để gỡ (ngọc sẽ vỡ)') : 'Chọn trang bị có lỗ khảm', true);
    v.enable('confirm_btn', mode === 1 && pending.some(Boolean));
    bag.render();
  }
  function confirm() {
    if (!target || !pending.some(Boolean)) return;
    if (p.gold < cost()) { ui.toast('Không đủ vàng'); return; }
    pending.forEach((g, i) => { if (g) inlay(target, i, p.inventory.find(x => x.id === g.id) || g); });
    pending = [null, null, null]; Audio2.play('powerful-1'); v.def.seq['done-1'] && v.play('done-1', () => v.play('normal'));
    save(); ui.g.onEquipChanged(); render();
  }
  render();
  return v;
}

// ================================================================ decompose (ui/decompose)
export async function openDecompose(ui) {
  const p = P.data;
  const v = await openScene('ui/decompose', ui.modalEl); ui.ccbOpen(v);
  let picks = [];
  const ins = [], outs = [];
  for (let i = 1; i <= 5; i++) { ins.push(await subCell(v, 'item_node_' + i)); outs.push(await subCell(v, 'mate_node_' + i)); v.tap('item_node_' + i, () => { if (picks[i - 1]) { picks.splice(i - 1, 1); render(); } }); }
  const bag = await mountBag(ui, v, {
    filter: it => it.eq,
    hint: it => it.eq ? (() => { const r = breakupResult(it); return r ? `Phân giải ra: ${anyName(r.id)} ×${r.n} — chạm để thêm` : 'Không phân giải được'; })() : '',
    onSelect: s => { const it = s.it; if (!it.eq) return; if (picks.includes(it)) { picks = picks.filter(x => x !== it); } else { if (picks.length >= 5) { ui.toast('Tối đa 5 món mỗi lần'); return; } if (!breakupResult(it)) { ui.toast('Không phân giải được món này'); return; } picks.push(it); } render(); },
  });
  bag.opts.startEquipped = false; bag.page = 0;
  v.tap('close_button', () => close(ui, v));
  v.tap('auto_button', () => { picks = p.inventory.filter(it => it.eq && it.q <= 2 && breakupResult(it)).slice(0, 5); if (!picks.length) ui.toast('Không có đồ trắng/xanh'); render(); });
  v.show('stop_button', false);
  v.tap('ok_button', () => {
    if (!picks.length) return;
    const got = {};
    for (const it of picks) { const r = breakup(it); if (r) got[r.id] = (got[r.id] || 0) + r.n; }
    picks = []; Audio2.play('ui-030'); Daily.progress(10, 1); save();
    ui.toast('Nhận: ' + Object.entries(got).map(([id, n]) => `${anyName(id)} ×${n}`).join(', '));
    render(true, got);
  });
  function render(done, got) {
    const pb = v.sub('progress_bar'); pb && pb.all.forEach(r => { if (r.def.c === 'CCLayerColor') { r.el.style.transformOrigin = '0 50%'; r.el.style.transform = `scaleX(${done ? 1 : 0})`; } });
    for (let i = 0; i < 5; i++) {
      fillCell(ins[i], picks[i] || null);
      const r = picks[i] ? breakupResult(picks[i]) : null;
      fillCell(outs[i], r ? { id: r.id, n: r.n } : null);
      outs[i] && outs[i].text('num', r ? '×' + r.n : '');
    }
    v.text('total_label', picks.length ? `Đã chọn ${picks.length}/5` : 'Chọn trang bị trong túi');
    v.enable('ok_button', picks.length > 0);
    bag.render();
  }
  render();
  return v;
}

// ================================================================ alchemy / forge (ui/alchemy)
export async function openAlchemy(ui) {
  const p = P.data;
  const v = await openScene('ui/alchemy', ui.modalEl); ui.ccbOpen(v);
  let cat = 1, page = 0, sel = null, showAll = false;
  const pageView = new CCBView(await loadCCB('ui/alchemy-1-1')); await pageView.ready();
  v.slot('page_scroll').append(pageView.el);
  pageView.el.style.left = '370px'; pageView.el.style.bottom = '250px';
  const mates = []; for (let i = 1; i <= 5; i++) mates.push(await subCell(v, 'mate_node_' + i));
  const comp = await subCell(v, 'comp_node');
  const rcells = [];
  for (let i = 1; i <= 10; i++) {
    const c = pageView.sub('cell_' + i); if (!c) continue;
    const ic = await makeCell(c.slot('icon_root'), null); ic.el.style.transform = 'scale(.8)';
    rcells.push({ v: c, icon: ic });
    const nameNode = c.find('name_label');
    const hid = nameNode && c.all.find(r => r.def.p.visible === false && r !== nameNode && r.el.contains(nameNode.el)); if (hid) hid.forceVisible = true;
    const hit = c.find('gray_root'); if (hit) { hit.el.classList.add('ccb-btn'); hit.el.onclick = e => { e.stopPropagation(); const rc = list()[page * 10 + i - 1]; if (rc) { Audio2.play('ui-003'); sel = rc; render(); } }; }
  }
  v.tap('close_button', () => close(ui, v));
  for (let i = 1; i <= 5; i++) v.tap('cate_button_' + i, () => { cat = i; page = 0; sel = null; render(); });
  v.tap('all_button', () => { showAll = !showAll; page = 0; render(); });
  v.show('switch_button', false); v.show('stop_button', false); v.show('auto_button', false);
  v.tap('ok_button', () => {
    if (!sel) return;
    if (!known.has(+sel.ID)) { ui.toast('Chưa học công thức này'); return; }
    const o = craft(sel);
    if (typeof o === 'string') { ui.toast(o); return; }
    Audio2.play('powerful-1'); ui.toast('Đã chế tạo: ' + itemName(o)); Daily.progress(10, 1); story('forge item', {}); save();
    v.def.seq['done-1'] ? v.play('done-1', () => v.play('normal')) : null; render();
  });
  // swipe pages
  let sx = null; const ps = v.el$('page_scroll');
  if (ps) { ps.classList.add('ccb-btn'); ps.style.cursor = 'grab'; ps.onpointerdown = e => { sx = e.clientX; }; ps.onpointerup = e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 30) { const n = Math.max(1, Math.ceil(list().length / 10)); page = (page + (dx < 0 ? 1 : n - 1)) % n; render(); } }; }
  const lbl = v.el$('page_label'); if (lbl) { lbl.classList.add('ccb-btn'); lbl.onclick = () => { const n = Math.max(1, Math.ceil(list().length / 10)); page = (page + 1) % n; render(); }; }
  let known = new Set(knownRecipes());
  function list() { known = new Set(knownRecipes()); return DB.recipeRows.filter(r => +r.Category === cat && (showAll || known.has(+r.ID))).sort((a, b) => (canCraft(b) && known.has(+b.ID)) - (canCraft(a) && known.has(+a.ID))); }
  function render() {
    const L = list(); const n = Math.max(1, Math.ceil(L.length / 10)); if (page >= n) page = 0;
    for (let i = 1; i <= 5; i++) { const b = v.sub('cate_button_' + i); b && b.play(i === cat ? 'select' : 'normal'); }
    const ab = v.sub('all_button'); ab && ab.show('check_node', showAll);
    v.text('page_label', `${page + 1}/${n}`);
    rcells.forEach((c, i) => {
      const rc = L[page * 10 + i];
      c.v.el.style.visibility = rc ? '' : 'hidden';
      if (!rc) return;
      c.v.applyAll(null, 0);
      c.v.text('name_label', anyName(rc.Output) + (known.has(+rc.ID) ? '' : ' (chưa học)'));
      fillCell(c.icon, { id: +rc.Output, eq: DB.equip.has(+rc.Output) ? 1 : 0, q: +(DB.equip.get(+rc.Output)?.Quality || DB.item.get(+rc.Output)?.Quality || 1), n: 1, lv: 1, base: [], affix: [] });
      c.v.show('hint_node', sel === rc); c.v.show('new_node', false);
      c.v.el.style.filter = known.has(+rc.ID) ? '' : 'grayscale(.8) brightness(.85)';
    });
    const can = L.filter(r => known.has(+r.ID) && canCraft(r)).length;
    v.text('total_label', String(can));
    v.show('comp_info_1', !!sel); v.show('mate_container', !!sel);
    if (!sel) { v.text('comp_name', 'Chọn một công thức'); mates.forEach(m => fillCell(m, null)); v.enable('ok_button', false); return; }
    const ins = recipeInputs(sel);
    v.text('comp_name', 'Chế tạo: ' + anyName(sel.Output));
    for (let i = 0; i < 5; i++) {
      v.show('mate_root_' + (i + 1), i < ins.length);
      const inp = ins[i]; if (!inp || !mates[i]) continue;
      fillCell(mates[i], { id: inp.id, eq: DB.equip.has(inp.id) ? 1 : 0, q: +(DB.equip.get(inp.id)?.Quality || DB.item.get(inp.id)?.Quality || 1), n: 1, lv: 1, base: [], affix: [] });
      const have = countItem(inp.id);
      mates[i].text('num', `${have}/${inp.n}`); const nl = mates[i].find('num'); if (nl) nl.el.style.color = have >= inp.n ? '#7dff6a' : '#ff6a5a';
    }
    fillCell(comp, { id: +sel.Output, eq: DB.equip.has(+sel.Output) ? 1 : 0, q: +(DB.equip.get(+sel.Output)?.Quality || DB.item.get(+sel.Output)?.Quality || 1), n: 1, lv: 1, base: [], affix: [] });
    const cost = recipeCost(sel);
    v.text('cost_label', cost ? gold(cost) : '', true);
    const eq = DB.equip.get(+sel.Output);
    v.text('attr_level', eq ? `Cấp vật phẩm: ${Math.max(p.level, +eq.LevelReq || 1)}` : '');
    v.enable('ok_button', known.has(+sel.ID) && canCraft(sel));
  }
  render();
  return v;
}
