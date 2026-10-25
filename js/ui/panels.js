// Extra panels: game modes (normal / hard / Dark Lab), pets, daily tasks, smithy tabs (inlay, breakup, forge),
// camp merchant (diamonds / exchange) and fashion wardrobe. Installed on UI.prototype.
import { DB, S, richText } from '../engine/db.js';
import { Audio2 } from '../engine/audio.js';
import { Lua } from '../engine/lua.js';
import { UI, h } from './ui.js';
import { P, stats, save, addItem, removeItem, addExp } from '../game/profile.js';
import { itemName, itemIcon, itemQuality, itemRecord, attrText, QUALITY_COLORS, makeEquip, makeItem, makeAny, toLuaEqu, iconUrl, resolveDrop } from '../game/items.js';
import { Modes, HARD_UNLOCK_FLOOR, LAB_UNLOCK_FLOOR, FASHION_PRICE, fashionRows, fashionSlot } from '../game/modes.js';
import { Daily, BP_TIERS } from '../game/daily.js';
import { PET_PRICE, petName, petIcon, petStats, petSkills, petSkillDesc, addPet, capLevel, nextInfo, feedValue, levelUp, petRec } from '../game/pets.js';
import { GEM, isGem, socketCount, gemAttrs, inlayCost, inlay, unsocket, breakupResult, breakup, knownRecipes, learnRecipe, recipeInputs, countItem, canCraft, recipeCost, craft, CATEGORY_VI } from '../game/craft.js';
import { resetSkills } from '../game/skills.js';
import { story } from '../game/story.js';
import { diaryTitle, diaryText, diaryBooks } from '../game/diary.js';

const fmt = n => (n | 0).toLocaleString('vi-VN');
const dia = n => h('span', { class: 'money dia' }, h('i'), fmt(n));
const gold = n => h('span', { class: 'money' }, h('i'), fmt(n));
const recName = r => S(r.RecipeName) || itemName(DB.equip.has(+r.Output) ? { eq: 1, id: +r.Output, q: 1 } : { id: +r.Output });
const anyIcon = id => DB.equip.has(+id) ? iconUrl(DB.equip.get(+id).IconID) : (DB.item.get(+id) ? iconUrl(DB.item.get(+id).IconID) : '');
const anyName = id => DB.equip.has(+id) ? S(DB.equip.get(+id).ItemName) : (DB.item.get(+id) ? S(DB.item.get(+id).ItemName) : '???');
const anyQ = id => DB.equip.has(+id) ? (+DB.equip.get(+id).Quality || 1) : (+DB.item.get(+id)?.Quality || 1);

function header(ui, panel, m, title, extra) {
  const p = P.data;
  panel.append(h('button', { class: 'close', onclick: () => m.close() }), h('h2', {}, title),
    h('div', { class: 'row', style: { justifyContent: 'center', gap: 'calc(12*var(--u))', marginBottom: 'calc(10*var(--u))' } }, h('span', { class: 'pill' }, gold(p.gold)), h('span', { class: 'pill' }, dia(p.diamond || 0)), extra || null));
}
function tabs(cur, list, set) {
  return h('div', { class: 'tabs' }, list.map(([k, label]) => h('button', { class: cur === k ? 'on' : '', onclick: () => set(k) }, label)));
}

Object.assign(UI.prototype, {
  // ------------------------------------------------ tower gate with modes
  floorSelect() {
    const p = P.data;
    story('tower list', {});
    const panel = h('div', { class: 'panel pop', style: { top: 'calc(180*var(--u))' } });
    const m = this.modal(panel);
    let mode = this._mode || 'normal';
    const mapForFloor = f => { for (const r of DB.mapRows) if (+r.Floor === f && +r.Generate === 0 && +r.Content === 0 && r.ID < 500) return r.ID; return 1; };
    const render = () => {
      this._mode = mode;
      panel.innerHTML = '';
      panel.append(h('button', { class: 'close', onclick: () => m.close() }), h('h2', {}, 'Tháp Thống Trị'),
        tabs(mode, [['normal', 'Thường'], ['hard', 'Khó' + (Modes.hardUnlocked() ? '' : ' 🔒')], ['lab', 'Vô tận' + (Modes.labUnlocked() ? '' : ' 🔒')]], k => { mode = k; render(); }));
      if (mode === 'lab') {
        if (!Modes.labUnlocked()) { panel.append(h('p', { class: 'center' }, `Phòng thí nghiệm Hắc Ám mở khi đạt tầng ${LAB_UNLOCK_FLOOR}. (Tầng cao nhất: ${p.maxFloor})`)); return; }
        panel.append(h('div', { class: 'col', style: { gap: 'calc(10*var(--u))' } },
          h('p', {}, 'Phòng thí nghiệm Hắc Ám (chế độ vô tận): 100 tầng ngẫu nhiên. Bạn vào với tay trắng — cấp 1, không kỹ năng, chỉ có Dao mổ thí nghiệm.'),
          h('p', {}, 'Khi gục ngã hoặc rời đi: nhân vật trở lại như cũ, giữ lại ngọc, nguyên liệu, cuộn công thức nhặt được; thưởng thêm vàng và kim cương theo số tầng.'),
          h('div', { class: 'statbox' }, h('span', {}, 'Kỷ lục', h('b', {}, (p.labBest || 0) + ' tầng')), h('span', {}, 'Thú cưng', h('b', {}, 'không mang theo'))),
          h('div', { class: 'center' }, h('button', { class: 'btn green', onclick: () => { m.close(); this.g.enterTower(0, true, 'lab'); } }, 'Vào phòng thí nghiệm'))));
        return;
      }
      if (mode === 'hard' && !Modes.hardUnlocked()) { panel.append(h('p', { class: 'center' }, `Chế độ Khó mở khi đạt tầng ${HARD_UNLOCK_FLOOR}. (Tầng cao nhất: ${p.maxFloor})`)); return; }
      const max = mode === 'hard' ? Math.max(1, p.maxFloorHard || 1) : p.maxFloor;
      const floors = []; for (let f = 1; f <= max; f++) if (f === 1 || f === max || f % 5 === 1) floors.push(f);
      panel.append(h('p', { class: 'center' }, mode === 'hard' ? `Khó: quái +10 cấp, máu/công ×1.6, nhiều bẫy, thưởng ×1.6. Tầng cao nhất: ${max}` : `Tầng cao nhất: ${max}. Chọn tầng xuất phát:`),
        h('div', { class: 'floorsel' }, floors.map(f => h('button', { class: f === max ? 'cur' : '', onclick: () => { m.close(); this.g.enterTower(mapForFloor(f), true, mode); } }, String(f)))),
        h('p', { class: 'center muted', style: { fontSize: 'calc(20*var(--u))' } }, 'Mỗi lần vào tháp, bình máu và bình mana được nạp đầy.'));
    };
    render();
  },
  labResult(r) {
    const m = this.modal(h('div', { class: 'panel pop', style: { top: '28%' } },
      h('h2', {}, 'Kết thúc Phòng thí nghiệm'),
      h('div', { class: 'statbox' },
        h('span', {}, 'Tầng đạt được', h('b', {}, r.floor)), h('span', {}, 'Kỷ lục', h('b', {}, r.best)),
        h('span', {}, 'Vàng thưởng', h('b', {}, fmt(r.gold))), h('span', {}, 'Kim cương', h('b', {}, fmt(r.dia))),
        h('span', {}, 'Vật phẩm giữ lại', h('b', {}, r.items))),
      h('div', { class: 'center', style: { marginTop: 'calc(16*var(--u))' } }, h('button', { class: 'btn green', onclick: () => m.close() }, 'OK'))));
  },

  // ------------------------------------------------ pets
  pets() {
    const p = P.data;
    const panel = h('div', { class: 'panel inv pop' });
    const m = this.modal(panel, () => { save(); if (this.g.scene === 'camp') this.camp(); });
    let sel = +(p.petActive || 100000);
    const render = () => {
      panel.innerHTML = '';
      header(this, panel, m, 'Thú cưng');
      const row = h('div', { class: 'petrow' });
      for (const id of Object.keys(PET_PRICE).map(Number)) {
        const own = p.pets[id];
        row.append(h('button', { class: 'petpick' + (sel === id ? ' sel' : '') + (own ? '' : ' locked') + (+p.petActive === id ? ' act' : ''), onclick: () => { sel = id; render(); } },
          h('img', { src: petIcon(id) }), h('span', {}, petName(id)), own ? h('em', {}, '★' + own.star) : null));
      }
      panel.append(row);
      const own = p.pets[sel];
      const pd = own || { lv: 1, star: 1, exp: 0 };
      const st = petStats(sel, pd);
      const box = h('div', { class: 'col', style: { gap: 'calc(8*var(--u))' } });
      box.append(h('div', { class: 'row' }, h('b', { style: { fontSize: 'calc(30*var(--u))' } }, petName(sel)), h('span', { class: 'grow' }),
        own ? h('span', { class: 'pill' }, `Lv.${pd.lv}/${capLevel(pd)} · ${'★'.repeat(pd.star)}`) : null));
      const story0 = S(petRec(sel)?.Story); if (story0 && story0 !== petRec(sel)?.Story) box.append(h('div', { class: 'muted', style: { fontSize: 'calc(19*var(--u))' }, html: richText(story0) }));
      box.append(h('div', { class: 'statbox' },
        h('span', {}, 'HP', h('b', {}, fmt(st.max_hp))), h('span', {}, 'Tấn công', h('b', {}, `${st.min_atk}-${st.max_atk}`)),
        h('span', {}, 'Phòng thủ', h('b', {}, st.defense)), h('span', {}, 'Nguyên tố', h('b', {}, `${st.fire_atk}/${st.cold_atk}/${st.light_atk}/${st.poison_atk}`))));
      const sk = h('div', { class: 'col', style: { gap: 'calc(6*var(--u))' } });
      petSkills(sel, pd).forEach((s, i) => {
        const r = DB.skill.get(s.id);
        sk.append(h('div', { class: 'petskill' + (s.lv ? '' : ' locked') },
          h('span', { class: 'skicon' + (s.lv ? ' on' : ''), style: { backgroundImage: `url(${petIcon(sel)})` } }),
          h('div', {}, h('b', {}, `${S(r?.Name) || 'Kỹ năng'} ${s.lv ? 'Lv.' + s.lv : '(mở ở ★' + (i + 1) + ')'}`), h('div', { class: 'ln', html: richText(petSkillDesc(s.id, s.lv, st.avg)) }))));
      });
      box.append(sk);
      const btns = h('div', { class: 'row', style: { flexWrap: 'wrap', justifyContent: 'center' } });
      if (!own) {
        const price = PET_PRICE[sel];
        btns.append(h('button', { class: 'btn green', disabled: p.gold < price ? true : null, onclick: () => { if (p.gold < price) return; p.gold -= price; addPet(sel); Audio2.play('ui-030'); save(); render(); } }, 'Thuê ', gold(price)));
      } else {
        if (+p.petActive !== sel) btns.append(h('button', { class: 'btn green', onclick: () => { p.petActive = sel; save(); render(); } }, 'Mang theo'));
        else btns.append(h('button', { class: 'btn', onclick: () => { p.petActive = null; save(); render(); } }, 'Để ở trại'));
        const n = nextInfo(pd);
        if (n.max) btns.append(h('span', { class: 'pill' }, 'Đã tối đa'));
        else {
          const label = n.starUp ? ['Thăng sao ', gold(n.gold)] : [`Lên cấp (${fmt(pd.exp)}/${fmt(n.exp)} EXP) `, gold(n.gold)];
          btns.append(h('button', { class: 'btn', onclick: () => { const e = levelUp(sel); if (e) this.toast(e); else { Audio2.play('levelup-2'); save(); render(); } } }, ...label));
        }
        btns.append(h('button', { class: 'btn small', onclick: () => this.feedPet(sel, render) }, 'Cho ăn trang bị'));
      }
      box.append(btns);
      box.append(h('p', { class: 'center muted', style: { fontSize: 'calc(18*var(--u))' } }, 'Thú cưng nhận 50% EXP mỗi quái bạn hạ. Cho ăn trang bị để nhận EXP nhanh.'));
      panel.append(box);
    };
    render();
  },
  feedPet(id, after) {
    const p = P.data; const pd = p.pets[id];
    const panel = h('div', { class: 'panel inv pop' }); const m = this.modal(panel, after);
    const render = () => {
      panel.innerHTML = '';
      header(this, panel, m, `Cho ${petName(id)} ăn`, h('span', { class: 'pill' }, `EXP ${fmt(pd.exp)}`));
      const list = p.inventory.filter(it => it.eq);
      const grid = h('div', { class: 'baggrid' });
      for (const it of list) { const v = feedValue(it); grid.append(h('button', { class: 'slot q' + it.q, onclick: () => { removeItem(it.uid); pd.exp += v; Audio2.play('ui-020'); render(); } }, h('img', { src: itemIcon(it) }), h('span', { class: 'n' }, '+' + v))); }
      if (!list.length) panel.append(h('p', { class: 'center' }, 'Không có trang bị trong túi.'));
      panel.append(h('div', { class: 'row', style: { justifyContent: 'center', marginBottom: 'calc(8*var(--u))' } },
        h('button', { class: 'btn small', onclick: () => { let n = 0; for (const it of p.inventory.filter(x => x.eq && x.q <= 2)) { pd.exp += feedValue(it); removeItem(it.uid); n++; } this.toast(n ? `Đã cho ăn ${n} món` : 'Không có đồ trắng/xanh'); render(); } }, 'Cho ăn đồ trắng + xanh')), grid);
    };
    render();
  },

  // ------------------------------------------------ daily tasks
  dailyTasks() {
    const p = P.data; const d = Daily.ensure();
    const panel = h('div', { class: 'panel inv pop' });
    const m = this.modal(panel, () => { save(); if (this.g.scene === 'camp') this.camp(); });
    const render = () => {
      panel.innerHTML = '';
      header(this, panel, m, 'Nhiệm vụ hằng ngày');
      const maxPts = BP_TIERS[BP_TIERS.length - 1].pts;
      panel.append(h('div', { class: 'bpbar' }, h('i', { style: { width: Math.min(100, d.bp / maxPts * 100) + '%' } }), h('b', {}, `Điểm hoạt động: ${d.bp}`)));
      panel.append(h('div', { class: 'row', style: { justifyContent: 'space-around', margin: 'calc(10*var(--u)) 0' } }, BP_TIERS.map((t, i) => {
        const got = d.bpClaimed.includes(i), ok = d.bp >= t.pts && !got;
        return h('button', { class: 'bptier' + (ok ? ' ok' : '') + (got ? ' got' : ''), onclick: () => { const r = Daily.claimTier(i); if (r) { Audio2.play('ui-030'); this.toast('Đã nhận thưởng mốc ' + t.pts); save(); render(); } else this.toast(got ? 'Đã nhận' : `Cần ${t.pts} điểm`); } },
          h('img', { src: anyIcon(t.item) }), h('span', {}, t.pts), h('em', {}, t.gold ? fmt(t.gold) + ' vàng' : t.dia + ' 💎'));
      })));
      const list = h('div', { class: 'shoplist' });
      for (const tk of d.tasks) {
        list.append(h('div', { class: 'shopitem' },
          h('div', { class: 'grow' }, h('div', { class: 'nm' }, Daily.text(tk)), h('div', { class: 'hbar', style: { marginTop: 'calc(6*var(--u))' } }, h('i', { style: { width: (tk.prog / tk.need * 100) + '%' } }), h('b', {}, `${fmt(tk.prog)}/${fmt(tk.need)}`)), h('div', { class: 'muted' }, `+${tk.score} điểm hoạt động`)),
          tk.claimed ? h('span', { class: 'pill' }, '✔') : h('button', { class: 'btn small' + (tk.done ? ' green' : ''), disabled: tk.done ? null : true, onclick: () => { const r = Daily.claim(tk); if (r) { Audio2.play('ui-030'); this.toast(`+${fmt(r.gold)} vàng, +${fmt(r.exp)} EXP, +${r.dia} kim cương`); save(); render(); } } }, 'Nhận')));
      }
      panel.append(list, h('p', { class: 'center muted', style: { fontSize: 'calc(18*var(--u))' } }, 'Nhiệm vụ làm mới mỗi ngày.'));
    };
    render();
  },

  // ------------------------------------------------ smithy: enhance / inlay / breakup / forge
  smithy(tab0) {
    const p = P.data;
    story('open smithy', {});
    const panel = h('div', { class: 'panel inv pop' });
    const m = this.modal(panel, () => this.g.onEquipChanged());
    let tab = tab0 || 'enh', sel = null, cat = 0, bead = null;
    const all = () => [...Object.entries(p.equipped).map(([s, it]) => ({ it, s })), ...p.inventory.filter(i => i.eq).map(it => ({ it }))];
    const grid = (items, onPick, badge) => {
      const g = h('div', { class: 'baggrid', style: { maxHeight: 'calc(420*var(--u))', flex: 'none' } });
      for (const x of items) g.append(h('button', { class: 'slot q' + itemQuality(x.it) + (sel === x.it ? ' sel' : ''), onclick: () => onPick(x) }, h('img', { src: itemIcon(x.it) }), badge ? badge(x) : null, x.s ? h('span', { class: 'n', style: { left: '4%', right: 'auto', color: '#7dff6a' } }, 'E') : null));
      if (!items.length) g.append(h('p', { class: 'center muted', style: { gridColumn: '1/-1' } }, 'Không có gì.'));
      return g;
    };
    const render = () => {
      panel.innerHTML = '';
      header(this, panel, m, 'Lò rèn');
      panel.append(tabs(tab, [['enh', 'Cường hoá'], ['gem', 'Khảm ngọc'], ['brk', 'Phân giải'], ['frg', 'Chế tạo']], k => { tab = k; sel = null; render(); }));
      if (!sel) panel.append(this.npcTalk({ enh: 2, gem: 3, brk: 6, frg: 5 }[tab]));
      if (tab === 'enh') return renderEnh();
      if (tab === 'gem') return renderGem();
      if (tab === 'brk') return renderBrk();
      return renderForge();
    };
    const renderEnh = () => {
      panel.append(grid(all(), x => { sel = x.it; render(); }, x => x.it.inte ? h('span', { class: 'n' }, '+' + x.it.inte) : null));
      if (!sel) { panel.append(h('p', { class: 'center muted' }, 'Chọn một món trang bị để cường hoá.')); return; }
      const r = Lua.call('CalEquipmentIntensify', toLuaEqu(sel)); const info = r && r[0];
      const box = h('div', { class: 'col', style: { marginTop: 'calc(12*var(--u))' } }, h('b', {}, `${itemName(sel)} +${sel.inte || 0}`));
      if (!info || (sel.inte || 0) >= 6) box.append(h('p', {}, 'Đã cường hoá tối đa.'));
      else {
        const g0 = Math.round(info.gold || 0), d0 = Math.round(info.diamond || 0);
        const beads = p.inventory.filter(it => !it.eq && +DB.item.get(it.id)?.Type === 43);
        if (bead && !p.inventory.includes(bead)) bead = null;
        const bonus = bead ? (+DB.item.get(bead.id).Param || 0) : 0;
        const rate = Math.min(100, Math.round((info.success || 0) * 100) + bonus);
        for (let i = 0; i < sel.base.length; i++) box.append(h('div', {}, attrText(sel.base[i].a, sel.base[i].v) + '  →  ' + Math.round(info.base?.[i]?.p1 ?? sel.base[i].v)));
        box.append(h('div', {}, `Tỉ lệ thành công: ${rate}%` + (bonus ? ` (+${bonus}% hạt chúc phúc)` : '')));
        if (beads.length) box.append(h('div', { class: 'reqs' }, 'Hạt chúc phúc: ', beads.map(b => h('button', { class: 'slot q' + itemQuality(b) + (bead === b ? ' sel' : ''), style: { width: 'calc(70*var(--u))' }, title: itemName(b), onclick: () => { bead = bead === b ? null : b; render(); } }, h('img', { src: itemIcon(b) }), h('span', { class: 'n' }, '+' + DB.item.get(b.id).Param + '%')))));
        const useDia = d0 > 0 && (p.diamond || 0) >= d0;
        const costG = g0 + (useDia ? 0 : d0 * 200);
        box.append(h('div', { class: 'muted', style: { fontSize: 'calc(18*var(--u))' } }, d0 ? (useDia ? `Dùng ${d0} kim cương` : `Thiếu kim cương: đổi ${d0} kim cương thành ${fmt(d0 * 200)} vàng`) : ''));
        box.append(h('button', { class: 'btn green', disabled: p.gold < costG ? true : null, onclick: () => {
          if (p.gold < costG) return; p.gold -= costG; if (useDia) p.diamond -= d0;
          if (bead) { removeItem(bead.uid, 1); if (!p.inventory.includes(bead)) bead = null; }
          if (Math.random() * 100 < rate) { sel.inte = (sel.inte || 0) + 1; sel.base.forEach((b, i) => b.v = Math.round(info.base?.[i]?.p1 ?? b.v)); this.toast('Thành công!'); Audio2.play('powerful-1'); }
          else { this.toast('Thất bại...'); Audio2.play('cantmove-1'); }
          save(); render();
        } }, 'Cường hoá ', gold(costG), useDia ? dia(d0) : null));
      }
      panel.append(box);
    };
    const renderGem = () => {
      const items = all().filter(x => socketCount(x.it) > 0);
      panel.append(grid(items, x => { sel = x.it; render(); }, x => h('span', { class: 'n' }, `${(x.it.gems || []).filter(Boolean).length}/${socketCount(x.it)}`)));
      if (!sel) { panel.append(h('p', { class: 'center muted' }, 'Chọn trang bị có lỗ khảm (xanh: 1, tím: 2, cam/đỏ: 3 lỗ).')); return; }
      const box = h('div', { class: 'col', style: { marginTop: 'calc(12*var(--u))', gap: 'calc(8*var(--u))' } }, h('b', { style: { color: QUALITY_COLORS[sel.q] === '#f2f2f2' ? '#3a2410' : QUALITY_COLORS[sel.q] } }, itemName(sel)));
      for (let i = 0; i < socketCount(sel); i++) {
        const g = sel.gems?.[i];
        box.append(h('div', { class: 'shopitem' },
          h('div', { class: 'slot gemslot' }, g ? h('img', { src: anyIcon(g.id) }) : h('span', { class: 'ph', style: { backgroundImage: 'url(assets/img/ux/orb.webp)', opacity: .6 } })),
          h('div', { class: 'grow' }, g ? [h('div', { class: 'nm' }, anyName(g.id)), ...g.attrs.map(a => h('div', { class: 'ln aff' }, attrText(a.a, a.v)))] : h('div', { class: 'muted' }, 'Lỗ trống')),
          h('button', { class: 'btn small', onclick: () => this.pickGem(sel, i, render) }, g ? 'Thay' : 'Khảm'),
          g ? h('button', { class: 'btn small red', onclick: () => this.confirm('Gỡ ngọc sẽ làm vỡ viên ngọc. Tiếp tục?', () => { unsocket(sel, i); save(); render(); }) }, 'Gỡ') : null));
      }
      panel.append(box);
    };
    const renderBrk = () => {
      const items = p.inventory.filter(i => i.eq).map(it => ({ it }));
      panel.append(grid(items, x => { sel = x.it; render(); }));
      const row = h('div', { class: 'row', style: { justifyContent: 'center', marginTop: 'calc(10*var(--u))', flexWrap: 'wrap' } });
      if (sel) {
        const r = breakupResult(sel);
        row.append(r ? h('div', { class: 'shopitem grow' }, h('div', { class: 'slot q' + anyQ(r.id) }, h('img', { src: anyIcon(r.id) })), h('div', { class: 'grow' }, h('div', { class: 'nm' }, `${anyName(r.id)} ×${r.n}`), h('div', { class: 'muted' }, 'Nhận được khi phân giải')),
          h('button', { class: 'btn small red', onclick: () => { const o = breakup(sel); if (o) { Audio2.play('ui-030'); this.toast(`+${o.n} ${anyName(o.id)}`); Daily.progress(10, 1); } sel = null; save(); render(); } }, 'Phân giải')) : h('p', {}, 'Không phân giải được món này.'));
      } else row.append(h('p', { class: 'center muted' }, 'Chọn trang bị trong túi để phân giải thành nguyên liệu.'));
      row.append(h('button', { class: 'btn small', onclick: () => this.confirm('Phân giải toàn bộ đồ trắng và xanh trong túi?', () => { let n = 0; for (const it of p.inventory.filter(x => x.eq && x.q <= 2)) { if (breakup(it)) n++; } this.toast(`Đã phân giải ${n} món`); save(); render(); }) }, 'Phân giải đồ trắng + xanh'));
      panel.append(row);
    };
    const renderForge = () => {
      const known = new Set(knownRecipes());
      const rows = DB.recipeRows.filter(r => known.has(+r.ID) && (!cat || +r.Category === cat));
      panel.append(h('div', { class: 'chips' }, [0, 1, 2, 3, 4, 5].map(c => h('button', { class: 'chip' + (cat === c ? ' on' : ''), onclick: () => { cat = c; render(); } }, c ? CATEGORY_VI[c] : 'Tất cả'))));
      const list = h('div', { class: 'shoplist' });
      rows.sort((a, b) => canCraft(b) - canCraft(a));
      for (const rc of rows) {
        const ins = recipeInputs(rc); const ok = canCraft(rc); const cost = recipeCost(rc);
        list.append(h('div', { class: 'shopitem' },
          h('div', { class: 'slot q' + anyQ(rc.Output) }, h('img', { src: anyIcon(rc.Output), loading: 'lazy' })),
          h('div', { class: 'grow' }, h('div', { class: 'nm' }, anyName(rc.Output)),
            h('div', { class: 'reqs' }, ins.map(i => h('span', { class: countItem(i.id) >= i.n ? 'ok' : 'bad' }, h('img', { src: anyIcon(i.id), loading: 'lazy' }), `${countItem(i.id)}/${i.n}`)), cost ? gold(cost) : null)),
          h('button', { class: 'btn small' + (ok ? ' green' : ''), disabled: ok ? null : true, onclick: () => { const o = craft(rc); if (typeof o === 'string') this.toast(o); else { Audio2.play('powerful-1'); this.toast('Đã chế tạo: ' + itemName(o)); Daily.progress(10, 1); story('forge item', {}); } save(); render(); } }, 'Chế tạo')));
      }
      if (!rows.length) list.append(h('p', { class: 'center muted' }, 'Chưa biết công thức nào. Dùng cuộn công thức (nhặt trong tháp hoặc mua ở Thương nhân) để học thêm.'));
      panel.append(h('p', { class: 'center muted', style: { fontSize: 'calc(18*var(--u))', margin: 0 } }, `Đã biết ${known.size} công thức`), list);
    };
    render();
  },
  pickGem(it, slot, after) {
    const p = P.data;
    const gems = p.inventory.filter(isGem);
    const panel = h('div', { class: 'panel inv pop' }); const m = this.modal(panel);
    panel.append(h('button', { class: 'close', onclick: () => m.close() }), h('h2', {}, 'Chọn ngọc'));
    const cost = inlayCost(it, slot);
    panel.append(h('p', { class: 'center' }, 'Phí khảm: ', gold(cost)));
    const list = h('div', { class: 'shoplist' });
    for (const g of gems) list.append(h('div', { class: 'shopitem' },
      h('div', { class: 'slot q' + itemQuality(g) }, h('img', { src: itemIcon(g) }), g.n > 1 ? h('span', { class: 'n' }, g.n) : null),
      h('div', { class: 'grow' }, h('div', { class: 'nm' }, itemName(g)), gemAttrs(g.id).map(a => h('div', { class: 'ln aff' }, attrText(a.a, a.v)))),
      h('button', { class: 'btn small green', onclick: () => { const e = inlay(it, slot, g); if (e) { this.toast(e); return; } Audio2.play('powerful-1'); save(); m.close(); after && after(); } }, 'Khảm')));
    if (!gems.length) list.append(h('p', { class: 'center muted' }, 'Bạn chưa có viên ngọc nào. Ngọc rơi trong tháp, hoặc chế tạo ở tab Chế tạo.'));
    panel.append(list);
  },

  loadTip() {
    const rows = DB.tipsRows || []; if (!rows.length || !this.loadEl) return;
    const r = rows[Math.floor(Math.random() * rows.length)];
    this.loadEl.append(h('div', { class: 'loadtip', html: '“' + richText(S(r.Content)) + '”' }));
  },
  // NPC shop talk (tips.csv): 1 merchant, 2 smith, 3 inlay, 4 grocer, 5 synthesis, 6 breakup
  npcTalk(npc) {
    const rows = DB.tipsRows.filter(r => +r.NPC === npc); if (!rows.length) return '';
    const r = rows[Math.floor(Math.random() * rows.length)];
    const face = { 1: 'npc-001', 2: 'npc-004', 3: 'npc-012', 4: 'npc-009', 5: 'npc-006', 6: 'npc-010' }[npc] || 'npc-001';
    return h('div', { class: 'npctalk' }, h('img', { src: `assets/img/char/${face}.webp` }), h('div', { class: 'bubble', html: richText(S(r.Content)) }));
  },
  // ------------------------------------------------ diary pages (diary.csv)
  diary(id, isNew) {
    const m = this.modal(h('div', { class: 'panel pop diarypage', style: { top: 'calc(160*var(--u))' } },
      h('button', { class: 'close', onclick: () => m.close() }),
      isNew ? h('div', { class: 'center muted' }, 'Bạn nhặt được một trang nhật ký!') : null,
      h('h2', {}, diaryTitle(id)),
      h('div', { class: 'diarytext', html: richText(diaryText(id)).replace(/\n/g, '<br>') })));
  },
  diaryBook() {
    const got = new Set(P.data.diaries || []);
    const panel = h('div', { class: 'panel inv pop' }); const m = this.modal(panel);
    panel.append(h('button', { class: 'close', onclick: () => m.close() }), h('h2', {}, 'Nhật ký thám hiểm'),
      h('p', { class: 'center muted' }, `Đã tìm thấy ${got.size}/${DB.diaryRows.length} trang. Trang nhật ký rơi ngẫu nhiên trong tháp.`));
    const list = h('div', { class: 'shoplist' });
    for (const b of diaryBooks()) {
      const n = b.ids.filter(i => got.has(i)).length;
      list.append(h('div', { class: 'col', style: { background: '#fff5', borderRadius: 'calc(14*var(--u))', padding: 'calc(10*var(--u))' } },
        h('b', {}, `${b.title}  (${n}/${b.ids.length})`),
        h('div', { class: 'chips', style: { marginTop: 'calc(6*var(--u))' } }, b.ids.map((id, i) => h('button', { class: 'chip' + (got.has(id) ? ' on' : ''), disabled: got.has(id) ? null : true, onclick: () => this.diary(id) }, got.has(id) ? String(i + 1) : '?')))));
    }
    panel.append(list);
  },

  // ------------------------------------------------ camp merchant (diamonds / exchange) + fashion
  merchantRows(sub = 'mer') {
    const p = P.data;
    if (!this._obtainable) { // currencies that can actually be found offline (drops / recipes)
      const dr = JSON.stringify(DB.dropRows || []); const o = new Set();
      for (const m of dr.matchAll(/\d{6}/g)) o.add(+m[0]);
      for (const r of DB.recipeRows) o.add(+r.Output);
      this._obtainable = o;
    }
    const okCur = r => { const c = this.parseCost(r.Cost); return c.cur !== 4 || this._obtainable.has(c.id); };
    if (sub === 'exc') return DB.shopRows.filter(r => +r.Storage === 4 && okCur(r) && p.level >= (+DB.equip.get(+r.ItemID)?.LevelReq || 1) - 5);
    if (sub === 'evt') return DB.shopRows.filter(r => +r.Storage === 5 && okCur(r));
    const rows = DB.shopRows.filter(r => (+r.Storage === 2 || +r.Storage === 3) && okCur(r) && p.level >= (+r.MinLevel || 1) && (r.MaxLevel === '' || p.level <= +r.MaxLevel));
    // signal flags (UseEffect 13) for gold
    return [...[610002, 610003, 610004, 610005].map(id => ({ ItemID: id, Cost: '1;0;300' })), ...rows];
  },
  parseCost(c) { const [cur, id, n] = String(c || '1;0;100').split(';').map(Number); return { cur, id, n }; },
  canPay(c) { const p = P.data; return c.cur === 2 ? (p.diamond || 0) >= c.n : c.cur === 4 ? countItem(c.id) >= c.n : p.gold >= c.n; },
  pay(c) {
    const p = P.data; if (!this.canPay(c)) return false;
    if (c.cur === 2) p.diamond -= c.n; else if (c.cur === 4) { let need = c.n; for (const it of [...p.inventory]) { if (need <= 0) break; if (it.id !== c.id) continue; const take = Math.min(need, it.n || 1); removeItem(it.uid, take); need -= take; } } else p.gold -= c.n;
    return true;
  },
  costEl(c) { return c.cur === 2 ? dia(c.n) : c.cur === 4 ? h('span', { class: 'money' }, h('img', { src: anyIcon(c.id), style: { width: 'calc(34*var(--u))' } }), `${countItem(c.id)}/${c.n}`) : gold(c.n); },
  merchantList(list, render) {
    const sub = this._merSub || 'mer';
    list.append(h('div', { class: 'chips' }, [['mer', 'Thương nhân'], ['exc', 'Đổi trang bị'], ['evt', 'Quầy sự kiện']].map(([k, l]) => h('button', { class: 'chip' + (sub === k ? ' on' : ''), onclick: () => { this._merSub = k; render(); } }, l))));
    list.append(this.npcTalk(sub === 'mer' ? 4 : 1));
    const rows = this.merchantRows(sub); const seen = new Set();
    for (const r of rows) {
      const key = r.ItemID + '|' + r.Cost; if (seen.has(key)) continue; seen.add(key);
      const c = this.parseCost(r.Cost); const id = +r.ItemID;
      const rec = DB.item.get(id) || DB.equip.get(id); if (!rec) continue;
      const isRecipe = +rec.UseEffect === 8 && knownRecipes().includes(+rec.Param);
      list.append(h('div', { class: 'shopitem' + (isRecipe ? ' known' : '') },
        h('div', { class: 'slot q' + anyQ(id) }, h('img', { src: anyIcon(id), loading: 'lazy' })),
        h('div', { class: 'grow' }, h('div', { class: 'nm', style: DB.equip.has(id) ? { color: QUALITY_COLORS[anyQ(id)] === '#f2f2f2' ? '#3a2410' : QUALITY_COLORS[anyQ(id)] } : {} }, anyName(id)), h('div', { class: 'muted', html: isRecipe ? 'Đã học' : DB.equip.has(id) ? 'Yêu cầu Lv.' + (+rec.LevelReq || 1) : richText(String(S(rec.ItemDesc) || '').split(/\\n|\n/)[0]) })),
        h('button', { class: 'btn small', disabled: this.canPay(c) ? null : true, onclick: () => {
          const it = DB.equip.has(id) ? makeEquip(id, P.data.level) : makeItem(id, 1);
          if (!it || !this.canPay(c)) return;
          if (!addItem(it)) { this.toast('Túi đồ đã đầy!'); return; }
          this.pay(c); Audio2.play('ui-030'); save(); render();
        } }, this.costEl(c))));
    }
    if (list.children.length <= 2) list.append(h('p', { class: 'center' }, 'Chưa có hàng cho cấp của bạn.'));
  },
  fashionList(list, render) {
    const p = P.data; p.wardrobe ||= []; p.fashion ||= {};
    const rows = fashionRows();
    const bySlot = {};
    for (const r of rows) { const s = fashionSlot(r.Type); if (s) (bySlot[s] ||= []).push(r); }
    for (const [slot, rs] of Object.entries(bySlot)) {
      list.append(h('div', { class: 'sktag' }, ({ weapon: 'Vũ khí', helm: 'Mũ', chest: 'Áo', glove: 'Găng', cuish: 'Quần', boot: 'Giày' })[slot]));
      const g = h('div', { class: 'baggrid', style: { flex: 'none', overflow: 'visible' } });
      for (const r of rs) {
        const owned = p.wardrobe.includes(+r.ID), worn = p.fashion[slot] === +r.ID;
        g.append(h('button', { class: 'slot q' + (+r.Quality || 1) + (worn ? ' sel' : ''), style: owned ? {} : { opacity: .75 }, onclick: () => this.fashionTip(r, slot, render) }, h('img', { src: iconUrl(r.IconID), loading: 'lazy' }), worn ? h('span', { class: 'n', style: { color: '#7dff6a' } }, '✔') : owned ? null : h('span', { class: 'n' }, '💎')));
      }
      list.append(g);
    }
  },
  fashionTip(r, slot, render) {
    const p = P.data; const owned = p.wardrobe.includes(+r.ID), worn = p.fashion[slot] === +r.ID; const price = FASHION_PRICE(+r.Quality || 1);
    const btns = [];
    if (!owned) btns.push(h('button', { class: 'btn green', disabled: (p.diamond || 0) < price ? true : null, onclick: () => { if ((p.diamond || 0) < price) return; p.diamond -= price; p.wardrobe.push(+r.ID); p.fashion[slot] = +r.ID; Audio2.play('ui-030'); save(); tip.close(); this.g.onEquipChanged(); render(); } }, 'Mua & mặc ', dia(price)));
    else if (worn) btns.push(h('button', { class: 'btn', onclick: () => { delete p.fashion[slot]; save(); tip.close(); this.g.onEquipChanged(); render(); } }, 'Cởi ra'));
    else btns.push(h('button', { class: 'btn green', onclick: () => { p.fashion[slot] = +r.ID; save(); tip.close(); this.g.onEquipChanged(); render(); } }, 'Mặc'));
    const tip = this.modal(h('div', { class: 'tip pop' },
      h('div', { class: 'row' }, h('div', { class: 'slot q' + (+r.Quality || 1), style: { width: 'calc(110*var(--u))', flex: 'none' } }, h('img', { src: iconUrl(r.IconID) })), h('div', {}, h('div', { class: 'nm', style: { color: QUALITY_COLORS[+r.Quality || 1] } }, S(r.ItemName)), h('div', { class: 'ln muted' }, 'Thời trang — chỉ thay đổi ngoại hình, không ảnh hưởng chỉ số.'))),
      h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: 'calc(14*var(--u))' } }, btns)));
  },

  // ------------------------------------------------ item use effects (UseEffect column of item.csv)
  useItem(it) {
    const r = DB.item.get(it.id); const p = P.data; const ue = +r.UseEffect; const s = stats(); const t = this.g.tower;
    const consume = () => { removeItem(it.uid, 1); save(); };
    switch (ue) {
      case 1: consume(); p.hp = s.max_hp; p.mp = s.max_mp; this.toast('Đã dùng ' + itemName(it)); return;
      case 2: consume(); p.hp = Math.min(s.max_hp, p.hp + s.max_hp * 0.5); p.mp = Math.min(s.max_mp, p.mp + s.max_mp * 0.5); this.toast('Đã dùng ' + itemName(it)); return;
      case 3: if (!t) { this.toast('Chỉ dùng được trong tháp'); return; } consume(); t.revealAll(); this.toast(S('249')); return;
      case 4: if (!t || t.fight) { this.toast(t ? S('229') : 'Chỉ dùng được trong tháp'); return; } consume(); t.randomTeleport?.(); return;
      case 5: { consume(); const ups = addExp(+r.Param || 100); this.toast(`+${r.Param} EXP`); if (ups) this.levelUp(p.level); save(); return; }
      case 6: this.confirm('Tẩy toàn bộ điểm kỹ năng miễn phí?', () => { consume(); resetSkills(); save(); this.toast('Đã tẩy điểm kỹ năng'); }); return;
      case 7: if (!t || !t.fight) { this.toast('Chỉ dùng khi đang chiến đấu'); return; } consume(); t.havoc?.(); return;
      case 8: { const id = +r.Param; if (knownRecipes().includes(id)) { this.toast('Đã biết công thức này'); return; } consume(); learnRecipe(id); save(); this.toast('Đã học công thức: ' + (S('recipe_' + id) || anyName(DB.recipe.get(id)?.Output))); Audio2.play('levelup-2'); return; }
      case 9: consume(); p.red = Math.min(this.g.maxPot('red') + 5, (p.red || 0) + (+r.Param || 5)); this.toast(`+${r.Param} bình máu`); this.hud(t); return;
      case 10: consume(); p.blue = Math.min(this.g.maxPot('blue') + 5, (p.blue || 0) + (+r.Param || 5)); this.toast(`+${r.Param} bình mana`); this.hud(t); return;
      case 12: {
        const free = Object.keys(PET_PRICE).map(Number).filter(id => !p.pets[id]);
        if (!free.length) { consume(); p.gold += 20000; this.toast('Đã có đủ thú cưng: nhận 20.000 vàng'); return; }
        const id = free[Math.floor(Math.random() * free.length)]; consume(); addPet(id); save(); this.toast('Nhận thú cưng mới: ' + petName(id)); Audio2.play('levelup-2'); return;
      }
      case 13: if (!t) { this.toast('Chỉ dùng được trong tháp'); return; } consume(); t.placeFlag(+r.Param || 1); this.toast('Đã cắm cờ đánh dấu'); this.hud(t); return;
      case 14: {
        consume();
        const grade = +r.Param || 1; const lv = Math.max(p.level, grade * 5);
        const got = [];
        const g0 = Math.round(200 * grade * (1 + p.level / 10)); p.gold += g0; got.push(fmt(g0) + ' vàng');
        const qMax = Math.min(5, 2 + Math.floor(grade / 5));
        const eqRows = DB.equipRows.filter(e => +e.Fashion !== 1 && (+e.LevelReq || 1) <= lv && (+e.LevelReq || 1) >= Math.max(1, lv - 20) && +e.Quality >= 2 && +e.Quality <= qMax && +e.Type < 50);
        for (let i = 0; i < 1 + Math.floor(grade / 4); i++) {
          const e = eqRows[Math.floor(Math.random() * eqRows.length)]; if (!e) break;
          const item = makeEquip(+e.ID, lv); if (item && addItem(item)) got.push(itemName(item));
        }
        if (Math.random() < 0.3 + grade * 0.03) {
          const gems = Object.keys(GEM).map(Number).filter(id => GEM[id].grade <= 1 + Math.floor(grade / 5) && DB.item.has(id));
          const gid = gems[Math.floor(Math.random() * gems.length)];
          if (gid && addItem(makeItem(gid, 1))) got.push(anyName(gid));
        }
        if (grade >= 3) { const d0 = grade * 2; p.diamond = (p.diamond || 0) + d0; got.push(d0 + ' kim cương'); }
        save(); Audio2.play('ui-030'); this.toast('Nhận: ' + got.join(', ')); return;
      }
    }
    this.toast('Vật phẩm này không dùng trực tiếp được');
  },
});

// camp: extra buttons (pets, daily tasks) and diamonds — wraps the original camp()
const baseCamp = UI.prototype.camp;
UI.prototype.camp = function () {
  baseCamp.call(this);
  const p = P.data; const el = this.screenEl.querySelector('.camp'); if (!el) return;
  const money = el.querySelector('.topbar .money');
  if (money) money.parentNode.insertBefore(h('span', { class: 'pill' }, dia(p.diamond || 0)), money.nextSibling);
  const d = Daily.ensure();
  const claimable = d ? d.tasks.filter(t => t.done && !t.claimed).length + BP_TIERS.filter((t, i) => d.bp >= t.pts && !d.bpClaimed.includes(i)).length : 0;
  const side = h('div', { class: 'sidebar' },
    h('button', { class: 'icobtn', style: { backgroundImage: `url(${petIcon(+(p.petActive || 100000))})` }, onclick: () => this.pets() }, h('span', { class: 'lbl' }, 'Thú cưng')),
    h('button', { class: 'icobtn', style: { backgroundImage: 'url(assets/img/ux/excl.webp)' }, onclick: () => this.dailyTasks() }, h('span', { class: 'lbl' }, 'Nhiệm vụ'), claimable ? h('span', { class: 'badge' }, claimable) : null),
    h('button', { class: 'icobtn', style: { backgroundImage: 'url(assets/img/ux/chest.webp)' }, onclick: () => this.shop('mer') }, h('span', { class: 'lbl' }, 'Thương nhân')),
    h('button', { class: 'icobtn', style: { backgroundImage: 'url(assets/img/ux/s-cloth.webp)' }, onclick: () => this.shop('fas') }, h('span', { class: 'lbl' }, 'Thời trang')));
  el.append(side);
};
