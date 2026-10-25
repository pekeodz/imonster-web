// DOM user interface (HUD, menus, panels). Text in Vietnamese; game content from the original string table.
import { DB, S, richText, setLang } from '../engine/db.js';
import { Audio2 } from '../engine/audio.js';
import { P, stats, save, equip, unequip, removeItem, addItem, canEquip, wipe, newProfile } from '../game/profile.js';
import { expRow } from '../game/stats.js';
import { itemName, itemIcon, itemQuality, itemRecord, attrText, sellPrice, EQUIP_SLOTS, SLOT_NAMES_VI, slotsForType, QUALITY_COLORS, makeEquip, makeItem, toLuaEqu } from '../game/items.js';
import { Lua } from '../engine/lua.js';
import { Cloud } from '../game/cloud.js';
import { groupsOrdered, skillLevel, canLearn, learn, resetSkills, skillDesc, combatSlots, adventureSkill, pointsSpent, learnedInGroup, COMBAT_GROUPS } from '../game/skills.js';
import { AFFIX_NAMES } from '../game/combat.js';
import { story } from '../game/story.js';
const skillIcon = r => `assets/img/icon/skill-${String(r.IconID || r.ID).padStart(6, '0')}.webp`;

export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : document.createTextNode(c));
  return e;
}
const fmt = n => (n | 0).toLocaleString('vi-VN');
const TONES = ['#5a3c22', '#b05656', '#e6b48c', '#c8bc3c', '#78bc44', '#68988e', '#4870b8', '#b04e8e', '#c0c0c0', '#5c5c5c'];
const SLOT_ICON = { weapon: 's-weapon', offhand: 's-glove2', helm: 's-chest', chest: 's-cloth', glove: 's-glove', cuish: 's-cuish', boot: 's-boot', necklace: 's-ring', ring1: 's-ring', ring2: 's-ring', spirit: 's-spirit' };

export class UI {
  constructor(game) {
    this.g = game; this.root = document.getElementById('ui');
    this.screenEl = h('div', { class: 'layer pass' }); this.hudEl = null; this.fxEl = h('div', { class: 'layer pass' }); this.modalEl = h('div', { class: 'layer pass' });
    this.root.append(this.screenEl, this.fxEl, this.modalEl);
  }
  clearScreen() { this.screenEl.innerHTML = ''; this.hudEl = null; this.fxEl.innerHTML = ''; }
  closeModals() { this.modalEl.innerHTML = ''; }
  modal(content, onClose) {
    const m = h('div', { class: 'modal', onclick: e => { if (e.target === m) { close(); } } }, content);
    const close = () => { m.remove(); onClose && onClose(); };
    m.close = close;
    this.modalEl.append(m);
    return m;
  }

  // ------------------------------------------------ loading / title
  loading() {
    this.clearScreen();
    this.loadEl = h('div', { id: 'loading' }, h('div', { class: 'logo' }), h('div', { class: 'bar' }, h('i')), h('div', { class: 'loadtxt' }, 'Đang tải...'));
    this.screenEl.append(this.loadEl);
  }
  progress(k, txt) { if (!this.loadEl) return; this.loadEl.querySelector('.bar>i').style.width = Math.round(k * 100) + '%'; if (txt) this.loadEl.querySelector('.loadtxt').textContent = txt; }
  title(onStart) {
    this.clearScreen();
    const el = h('div', { class: 'title', onclick: () => { Audio2.play('ui-001'); onStart(); } },
      h('div', { class: 'logo' }),
      h('div', { class: 'tap' }, S('launch_001') + ' / Chạm để bắt đầu'),
      h('div', { class: 'credit' }, 'Bản làm lại web phi lợi nhuận — tài nguyên © Pixss / Loongcheer'));
    this.screenEl.append(el);
  }

  // ------------------------------------------------ character creation
  create(onDone) {
    this.clearScreen();
    const look = { tone: 1, style: 2 };
    const g = this.g;
    g.preview(look, [DB.equip.get(110000)]);
    const randomName = () => {
      const rows = DB.playernameRows || [];
      const a = rows[Math.floor(Math.random() * rows.length)], b = rows[Math.floor(Math.random() * rows.length)];
      return a && b ? `${b['Name-en'] || 'Gob'}` : 'Goblin';
    };
    const nameInput = h('input', { value: randomName(), maxlength: 14 });
    const tones = h('div', { class: 'swatches' }, TONES.map((c, i) => h('button', { class: 'sw' + (i === look.tone ? ' on' : ''), style: { background: c }, onclick: e => { look.tone = i; [...tones.children].forEach((x, j) => x.classList.toggle('on', j === i)); g.preview(look); } })));
    const styles = h('div', { class: 'swatches' }, [2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => h('button', { class: 'chip' + (s === look.style ? ' on' : ''), onclick: () => { look.style = s; [...styles.children].forEach(x => x.classList.toggle('on', x.textContent == s - 1)); g.preview(look); } }, String(s - 1))));
    const el = h('div', { class: 'layer create' },
      h('div', { class: 'top' }, 'Tạo tiểu quái vật của bạn'),
      h('div', { class: 'panel pick pop' },
        h('div', { class: 'col' },
          h('b', {}, 'Màu da'), tones,
          h('b', {}, 'Kiểu dáng'), styles,
          h('b', {}, 'Tên'),
          h('div', { class: 'namebox' }, nameInput, h('button', { class: 'btn small', onclick: () => nameInput.value = randomName() }, '🎲')),
          h('div', { class: 'center', style: { marginTop: 'calc(10*var(--u))' } }, h('button', { class: 'btn green', onclick: () => { Audio2.play('ui-002'); onDone(nameInput.value.trim() || 'Goblin', { ...look }); } }, 'Bắt đầu phiêu lưu!')))));
    this.screenEl.append(el);
  }

  // ------------------------------------------------ camp
  camp() {
    this.clearScreen();
    const p = P.data, s = stats();
    const hot = (x, y, label, fn) => { const s0 = this.g.bgToScreen(x, y); return h('button', { class: 'hot', style: { left: Math.max(14, Math.min(84, s0.x)) + '%', top: s0.y + '%' }, onclick: () => { Audio2.play('ui-003'); fn(); } }, h('span', { class: 'ring' }), h('span', { class: 'tag' }, label)); };
    const el = h('div', { class: 'layer camp' },
      h('div', { class: 'topbar' },
        h('span', { class: 'lvl' }, p.level),
        h('span', { class: 'pill' }, p.name),
        h('span', { class: 'grow' }),
        h('span', { class: 'pill money' }, h('i'), fmt(p.gold)),
        h('button', { class: 'icobtn', style: { width: 'calc(70*var(--u))', height: 'calc(70*var(--u))', backgroundImage: 'url(assets/img/ux/gear.webp)' }, onclick: () => this.settings() })),
      hot(620, 760, 'Cổng tháp', () => this.floorSelect()),
      hot(150, 930, 'Lò rèn', () => this.smithy()),
      hot(640, 1010, 'Cửa hàng', () => this.shop()),
      hot(480, 430, 'Kỹ năng' + (p.skillPoints ? ` (${p.skillPoints})` : ''), () => this.skillTree()),
      h('div', { class: 'bottombar' },
        h('button', { class: 'icobtn', style: { backgroundImage: 'url(assets/img/ux/char.webp)' }, onclick: () => this.inventory() }, h('span', { class: 'lbl' }, 'Nhân vật')),
        h('button', { class: 'icobtn', style: { backgroundImage: 'url(assets/img/ux/up.webp)' }, onclick: () => this.floorSelect() }, h('span', { class: 'lbl' }, 'Vào tháp')),
        h('button', { class: 'icobtn', style: { backgroundImage: 'url(assets/img/ux/skill.webp)' }, onclick: () => this.skillTree() }, h('span', { class: 'lbl' }, 'Kỹ năng'), p.skillPoints ? h('span', { class: 'badge' }, p.skillPoints) : null),
        h('button', { class: 'icobtn', style: { backgroundImage: 'url(assets/img/ux/quest.webp)' }, onclick: () => this.records() }, h('span', { class: 'lbl' }, 'Thành tích'))));
    this.screenEl.append(el);
  }

  // ------------------------------------------------ tower HUD
  hud(t) {
    if (!t || this.g.scene !== 'tower') return; // camp has its own screen (closing the bag in camp must not build the tower HUD)
    const p = P.data; const s = stats();
    if (!this.hudEl) {
      this.clearScreen();
      const el = h('div', { class: 'layer pass' });
      el.innerHTML = `
      <div class="hud-top pass">
        <div class="me"><span class="lvl" data-k="lv"></span>
          <div class="bars"><div class="hbar"><i data-k="hp"></i><b data-k="hpt"></b></div><div class="hbar mp"><i data-k="mp"></i><b data-k="mpt"></b></div><div class="hbar xp"><i data-k="xp"></i></div></div></div>
        <div class="floorinfo pass"><div class="fname" data-k="fname"></div><span class="pill money"><i></i><span data-k="gold"></span></span></div>
      </div>
      <div class="enemy hidden pass" data-k="enemy"><div class="ename" data-k="ename"></div><div class="hbar"><i data-k="ehp"></i><b data-k="ehpt"></b></div></div>
      <div class="minimap" data-k="mini"><canvas width="100" height="100"></canvas></div>
      <div class="lootfeed" data-k="loot"></div>
      <div class="hud-bottom pass">
        <button class="pot" data-k="red"><span data-k="redn"></span><i class="cd" data-k="redcd"></i></button>
        <button class="pot blue" data-k="blue"><span data-k="bluen"></span><i class="cd" data-k="bluecd"></i></button>
        <span class="grow pass"></span>
        <div class="skillbar" data-k="skills"></div>
        <button class="icobtn" data-k="bag" style="background-image:url(assets/img/ux/char.webp)"><span class="lbl">Túi đồ</span></button>
        <button class="icobtn" data-k="home" style="background-image:url(assets/img/ux/home.webp)"><span class="lbl">Về trại</span></button>
      </div>`;
      this.hudEl = el; this.screenEl.append(el);
      const q = k => el.querySelector(`[data-k="${k}"]`);
      this.hq = {}; el.querySelectorAll('[data-k]').forEach(x => this.hq[x.dataset.k] = x);
      q('red').onclick = () => this.g.tower?.usePotion('red');
      q('blue').onclick = () => this.g.tower?.usePotion('blue');
      q('bag').onclick = () => this.inventory();
      q('home').onclick = () => {
        if (this.g.tower?.fight) { this.toast(S('229')); return; }
        story('prepare return city', {});
        const p = P.data;
        if (p.labBackup) { this.confirm(`Rời Phòng thí nghiệm ở tầng ${p.labRun?.floor || 1}? Lượt chơi kết thúc và bạn nhận thưởng.`, () => this.g.toCamp(true)); return; }
        if ((p.power || 0) >= 100) this.confirm('Năng lượng hồi trại đã đầy. Trở về trại và giữ lại toàn bộ chiến lợi phẩm?', () => { p.power = 0; this.g.toCamp(true); });
        else this.confirm(`Năng lượng hồi trại: ${p.power || 0}/100 (hạ quái để nạp).\nBỏ cuộc về trại sẽ MẤT vàng và đồ nhặt được trong lần leo tháp này. Vẫn về?`, () => this.g.toCamp(false));
      };
      q('mini').onclick = () => q('mini').classList.toggle('big');
      this.buildSkillBar();
    }
    const q = this.hq;
    q.lv.textContent = p.level;
    q.hp.style.width = Math.max(0, p.hp / s.max_hp * 100) + '%'; q.hpt.textContent = `${Math.max(0, Math.ceil(p.hp))}/${s.max_hp}`;
    q.mp.style.width = Math.max(0, p.mp / s.max_mp * 100) + '%'; q.mpt.textContent = `${Math.ceil(p.mp)}/${s.max_mp}`;
    const need = expRow(p.level)?.NextExp || 1; q.xp.style.width = Math.min(100, p.exp / need * 100) + '%';
    if (t) q.fname.textContent = `${t.hard ? "[Khó] " : ""}${S(t.row.Name)} · ${t.floor}F`;
    q.gold.textContent = fmt(p.gold);
    q.redn.textContent = p.red; q.bluen.textContent = p.blue;
    q.home.style.setProperty('--pw', Math.min(100, p.power || 0) + '%'); q.home.classList.toggle('full', (p.power || 0) >= 100);
    if (t) this.minimap(t);
  }
  tick(t) {
    if (!this.hq || !t) return;
    const cd = t.potCD || { red: 0, blue: 0 };
    this.hq.redcd.style.setProperty('--cd', (cd.red / 2 * 100) + '%');
    this.hq.bluecd.style.setProperty('--cd', (cd.blue / 2 * 100) + '%');
    const h0 = t.hero; if (!h0 || !this.skillBtns) return;
    const now = t.combat.now;
    for (const b of this.skillBtns) {
      const end = h0.skillCD?.[b.id] || 0, mx = h0.skillCDmax?.[b.id] || 1;
      const k = end > now ? (end - now) / mx : 0;
      b.cd.style.setProperty('--cd', (k * 100) + '%');
      b.el.classList.toggle('nomp', (P.data.mp || 0) < b.cost);
    }
  }
  buildSkillBar() {
    const bar = this.hq?.skills; if (!bar) return;
    bar.innerHTML = ''; this.skillBtns = [];
    combatSlots().forEach((id, i) => {
      if (!id) return;
      const r = DB.skill.get(id);
      const cd = h('i', { class: 'cd' });
      const el = h('button', { class: 'skbtn', style: { backgroundImage: `url(${skillIcon(r)})` }, onclick: () => this.g.tower?.combat.castHero(i) }, cd, h('span', { class: 'mpc' }, r.ManaCost || ''));
      bar.append(el); this.skillBtns.push({ id, el, cd, cost: +r.ManaCost || 0 });
    });
    const adv = adventureSkill();
    if (adv) {
      const r = DB.skill.get(adv);
      const el = h('button', { class: 'skbtn adv', style: { backgroundImage: `url(${skillIcon(r)})` }, onclick: () => this.g.tower?.useAdventure(adv) }, h('i', { class: 'cd' }), h('span', { class: 'mpc' }, r.ManaCost || ''));
      bar.append(el);
    }
  }
  minimap(t) {
    const c = this.hq?.mini?.querySelector('canvas'); if (!c) return;
    const g = t.grid; if (c.width !== g.w) { c.width = g.w; c.height = g.h; }
    const x = c.getContext('2d'); const img = x.createImageData(g.w, g.h);
    for (let y = 0; y < g.h; y++) for (let xx = 0; xx < g.w; xx++) {
      const i = xx + y * g.w, o = i * 4;
      if (!t.revealed[i]) { img.data[o + 3] = 0; continue; }
      if (g.isFloor(xx, y)) { img.data[o] = 200; img.data[o + 1] = 180; img.data[o + 2] = 140; img.data[o + 3] = 255; }
      else { img.data[o + 3] = 0; }
    }
    const put = (xx, y, r, gg, b) => { const o = (xx + y * g.w) * 4; img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255; };
    for (const o of t.objects) if (t.revealed[o.x + o.y * g.w] && !o.open) put(o.x, o.y, 255, 210, 60);
    for (const u of t.units) if (!u.isHero && u.alive && t.revealed[u.x + u.y * g.w]) put(u.x, u.y, 230, 40, 40);
    if (t.pass && t.revealed[t.pass[0] + t.pass[1] * g.w]) put(t.pass[0], t.pass[1], 80, 255, 120);
    const FC = { 1: [235, 50, 50], 2: [245, 220, 50], 3: [70, 130, 245], 4: [80, 220, 80] };
    for (const f of t.flags || []) { const c = FC[f.color] || FC[1]; put(f.x, f.y, c[0], c[1], c[2]); }
    if (t.hero) put(t.hero.x, t.hero.y, 60, 160, 255);
    x.putImageData(img, 0, 0);
  }
  enemy(m) {
    const q = this.hq; if (!q) return;
    if (!m || !m.alive) { q.enemy.classList.add('hidden'); return; }
    q.enemy.classList.remove('hidden');
    q.enemy.className = 'enemy pass r' + Math.min(4, m.rank);
    const prefix = m.rank === 2 ? '★ ' : m.rank === 3 ? '★★ ' : m.rank >= 4 ? '☠ ' : '';
    const aff = (m.affixes || []).map(a => AFFIX_NAMES[a]).filter(Boolean).join(', ');
    q.ename.textContent = `${prefix}${S(m.rec.Name)}  Lv.${m.st.lv}${aff ? '  [' + aff + ']' : ''}`;
    const mhp = this.g.tower?.combat ? this.g.tower.combat.stats(m).max_hp : m.st.max_hp;
    q.ehp.style.width = Math.max(0, m.hp / mhp * 100) + '%';
    q.ehpt.textContent = `${Math.max(0, Math.ceil(m.hp))}/${mhp}`;
  }

  // ------------------------------------------------ small feedback
  toast(msg) {
    if (!msg) return;
    if (this._lastToast === msg && performance.now() - this._lastToastT < 1500) return;
    this._lastToast = msg; this._lastToastT = performance.now();
    this.fxEl.querySelectorAll('.toast').forEach(x => x.remove());
    const e = h('div', { class: 'toast' }, msg); this.fxEl.append(e); setTimeout(() => e.remove(), 1900);
  }
  banner(a, b) { const e = h('div', { class: 'banner' }, h('div', { class: 'b1' }, a), h('div', { class: 'b2' }, b)); this.fxEl.append(e); setTimeout(() => e.remove(), 2700); }
  levelUp(lv) { const e = h('div', { class: 'lvup' }, `LEVEL UP! ${lv}`, h('div', { style: { fontSize: 'calc(28*var(--u))', color: '#fff' } }, '+1 điểm kỹ năng')); this.fxEl.append(e); setTimeout(() => e.remove(), 2300); }
  float(t, wx, wy, text, color, scale = 1) {
    const s = this.g.gfx.worldToScreen(wx, wy);
    const st = document.getElementById('stage').getBoundingClientRect();
    const e = h('div', { class: 'float', style: { left: (s.x / st.width * 100) + '%', top: (s.y / st.height * 100) + '%', color, fontSize: `calc(${Math.round(34 * scale)}*var(--u))` } }, text);
    this.fxEl.append(e); setTimeout(() => e.remove(), 1150);
  }
  loot(it) {
    const feed = this.hq?.loot; if (!feed) return;
    const q = itemQuality(it);
    const e = h('div', { class: 'lootitem', style: { color: QUALITY_COLORS[q] } }, h('img', { src: itemIcon(it) }), itemName(it) + (it.n > 1 ? ` ×${it.n}` : ''));
    feed.append(e); setTimeout(() => e.remove(), 3300);
    while (feed.children.length > 5) feed.firstChild.remove();
  }
  confirm(msg, yes, no) {
    const m = this.modal(h('div', { class: 'panel pop', style: { top: '35%' } },
      h('p', { class: 'center', style: { fontSize: 'calc(28*var(--u))', fontWeight: 700 } }, msg),
      h('div', { class: 'row', style: { justifyContent: 'center', gap: 'calc(30*var(--u))' } },
        h('button', { class: 'btn red', onclick: () => { m.close(); no && no(); } }, 'Không'),
        h('button', { class: 'btn green', onclick: () => { m.close(); yes && yes(); } }, 'Đồng ý'))));
  }
  dead(t) {
    const el = h('div', { class: 'deadscreen' },
      h('div', { class: 't' }, 'Bạn đã gục ngã...'),
      h('div', { class: 'center', style: { padding: '0 calc(60*var(--u))', textShadow: '0 0 6px #000' }, html: P.data.labBackup ? `Bạn dừng chân ở tầng ${P.data.labRun?.floor || 1} của Phòng thí nghiệm.<br>Nhân vật sẽ trở lại như cũ và nhận thưởng.` : richText(S('tower_010')) }),
      h('button', { class: 'btn', onclick: () => { el.remove(); this.g.toCamp(false); } }, P.data.labBackup ? 'Về trại nhận thưởng' : 'Hồi sinh ở trại'));
    this.fxEl.append(el);
  }
  records() {
    const p = P.data;
    const m = this.modal(h('div', { class: 'panel pop', style: { top: 'calc(260*var(--u))' } },
      h('button', { class: 'close', onclick: () => m.close() }),
      h('h2', {}, 'Thành tích'),
      h('div', { class: 'statbox' },
        h('span', {}, 'Tầng cao nhất', h('b', {}, p.maxFloor)), h('span', {}, 'Cấp độ', h('b', {}, p.level)),
        h('span', {}, 'Quái đã hạ', h('b', {}, fmt(p.stats.kills))), h('span', {}, 'Rương đã mở', h('b', {}, fmt(p.stats.chests))),
        h('span', {}, 'Số lần gục', h('b', {}, fmt(p.stats.deaths))), h('span', {}, 'Vàng', h('b', {}, fmt(p.gold))),
        h('span', {}, 'Kỷ lục Khó', h('b', {}, p.maxFloorHard || 0)), h('span', {}, 'Kỷ lục Vô tận', h('b', {}, p.labBest || 0))),
      h('div', { class: 'center', style: { marginTop: 'calc(14*var(--u))' } }, h('button', { class: 'btn', onclick: () => this.diaryBook() }, `Nhật ký thám hiểm (${(p.diaries || []).length})`))));
  }

  // ------------------------------------------------ inventory & equipment
  inventory() {
    const p = P.data;
    let sel = null;
    const panel = h('div', { class: 'panel inv pop' });
    const m = this.modal(panel, () => { this.g.onEquipChanged(); this.hud(this.g.tower); story('close package', {}); });
    story('open package', {});
    p.inventory.forEach(it => { delete it.isNew; });
    const render = () => {
      const s = stats();
      panel.innerHTML = '';
      panel.append(h('button', { class: 'close', onclick: () => m.close() }), h('h2', {}, `${p.name} · Lv.${p.level}`));
      const eg = h('div', { class: 'equipgrid' });
      for (const slot of ['weapon', 'offhand', 'helm', 'chest', 'glove', 'cuish', 'boot', 'necklace', 'ring1', 'ring2', 'spirit']) {
        const it = p.equipped[slot];
        eg.append(h('button', { class: 'slot' + (it ? ' q' + it.q : ''), title: SLOT_NAMES_VI[slot], onclick: () => { if (it) this.itemTip(it, { slot, onChange: render }); } },
          it ? h('img', { src: itemIcon(it) }) : h('span', { class: 'ph', style: { backgroundImage: `url(assets/img/ux/${SLOT_ICON[slot]}.webp)` } })));
      }
      eg.append(h('button', { class: 'slot', title: 'Sắp xếp', onclick: () => { sortBag(); render(); } }, h('span', { class: 'ph', style: { opacity: .8, backgroundImage: 'url(assets/img/ux/sort.webp)' } })));
      panel.append(eg);
      panel.append(h('div', { class: 'statbox', style: { margin: 'calc(14*var(--u)) 0' } },
        h('span', {}, 'HP', h('b', {}, `${Math.ceil(p.hp)}/${s.max_hp}`)), h('span', {}, 'MP', h('b', {}, `${Math.ceil(p.mp)}/${s.max_mp}`)),
        h('span', {}, 'Tấn công', h('b', {}, `${s.min_atk}-${s.max_atk}`)), h('span', {}, 'Phòng thủ', h('b', {}, s.defense)),
        h('span', {}, 'Tốc đánh', h('b', {}, s.fin_atk_speed + '%')), h('span', {}, 'Chính xác', h('b', {}, s.hit)),
        h('span', {}, 'Né tránh', h('b', {}, s.dodge)), h('span', {}, 'Chí mạng', h('b', {}, s.critical + '% / +' + s.crit_dam + '%')),
        h('span', {}, 'Kháng Lửa/Băng', h('b', {}, `${s.fire_res}/${s.cold_res}`)), h('span', {}, 'Kháng Sét/Độc', h('b', {}, `${s.light_res}/${s.poison_res}`)),
        h('span', {}, 'EXP', h('b', {}, `${fmt(p.exp)}/${fmt(expRow(p.level)?.NextExp)}`)), h('span', {}, 'Vàng', h('b', {}, fmt(p.gold)))));
      panel.append(h('div', { class: 'row' }, h('b', {}, `Túi đồ (${p.inventory.length}/${p.bagSize})`), h('span', { class: 'grow' }),
        h('button', { class: 'btn small', onclick: () => this.sellJunk(render) }, 'Bán đồ trắng')));
      const bg = h('div', { class: 'baggrid' });
      for (const it of p.inventory) {
        bg.append(h('button', { class: 'slot q' + itemQuality(it), onclick: () => this.itemTip(it, { onChange: render }) }, h('img', { src: itemIcon(it), loading: 'lazy' }), it.n > 1 ? h('span', { class: 'n' }, it.n) : null));
      }
      for (let i = p.inventory.length; i < p.bagSize; i++) bg.append(h('div', { class: 'slot', style: { opacity: .5 } }));
      panel.append(bg);
    };
    const sortBag = () => p.inventory.sort((a, b) => (b.eq || 0) - (a.eq || 0) || itemQuality(b) - itemQuality(a) || (+itemRecord(a)?.Type || 0) - (+itemRecord(b)?.Type || 0) || (b.lv || 0) - (a.lv || 0));
    render();
  }
  sellJunk(after) {
    const p = P.data; let gold = 0, n = 0;
    p.inventory = p.inventory.filter(it => { if (it.eq && it.q <= 1) { gold += sellPrice(it); n++; return false; } return true; });
    p.gold += gold; save(); this.toast(n ? `Đã bán ${n} món, +${fmt(gold)} vàng` : 'Không có đồ trắng để bán'); after && after();
  }
  itemTip(it, { slot, onChange, shop } = {}) {
    const p = P.data; const r = itemRecord(it); const q = itemQuality(it);
    const lines = [];
    if (it.eq) {
      const typeName = S('itemtype_' + r.Type) || '';
      lines.push(h('div', { class: 'ln muted' }, `${typeName} · Cấp thuộc tính ${it.lv}`));
      if (+r.Type >= 10 && +r.Type <= 12) lines.push(h('div', { class: 'ln' }, `Tốc độ đánh: ${it.spd}%`));
      for (const b of it.base) lines.push(h('div', { class: 'ln bas' }, attrText(b.a, b.v)));
      for (const b of it.affix) lines.push(h('div', { class: 'ln aff' }, attrText(b.a, b.v)));
      const ns = it.q >= 4 ? 3 : it.q === 3 ? 2 : it.q === 2 ? 1 : 0;
      for (let i = 0; i < ns; i++) { const g = it.gems?.[i]; lines.push(h('div', { class: 'ln gem' }, g ? '◆ ' + g.attrs.map(a => attrText(a.a, a.v)).join(', ') : '◇ Lỗ khảm trống')); }
      const req = +r.LevelReq || 1;
      lines.push(h('div', { class: 'ln req' + (p.level < req ? ' bad' : '') }, `Yêu cầu cấp: ${req}`));
      // compare
      if (!slot) {
        const sl = slotsForType(r.Type)[0]; const cur = p.equipped[sl];
        if (cur) {
          const a = (Lua.call('CalEquipmentScore', toLuaEqu(it)) || [0])[0], b = (Lua.call('CalEquipmentScore', toLuaEqu(cur)) || [0])[0];
          const d = Math.round(a - b);
          lines.push(h('div', { class: 'ln ' + (d >= 0 ? 'cmp-up' : 'cmp-down') }, `Điểm trang bị: ${Math.round(a)} (${d >= 0 ? '+' : ''}${d} so với đang mặc)`));
        } else lines.push(h('div', { class: 'ln cmp-up' }, `Điểm trang bị: ${Math.round((Lua.call('CalEquipmentScore', toLuaEqu(it)) || [0])[0])}`));
      }
    } else {
      lines.push(h('div', { class: 'ln', html: richText(S(r.ItemDesc)) }));
    }
    const price = sellPrice(it);
    const btns = [];
    if (shop) btns.push(h('button', { class: 'btn green', onclick: () => { tip.close(); shop(); } }, 'Mua'));
    else if (slot) btns.push(h('button', { class: 'btn', onclick: () => { if (unequip(slot)) { save(); tip.close(); onChange && onChange(); } else this.toast('Túi đồ đã đầy!'); } }, 'Tháo ra'));
    else {
      if (it.eq) btns.push(h('button', { class: 'btn green', onclick: () => { if (!canEquip(it)) { this.toast('Chưa đủ cấp'); return; } equip(it.uid); Audio2.play(r.DragSound || 'ui-020'); save(); tip.close(); onChange && onChange(); story('change equip', {}); } }, 'Trang bị'));
      if (!it.eq && +r.UseEffect) btns.push(h('button', { class: 'btn green', onclick: () => { this.useItem(it); tip.close(); onChange && onChange(); } }, 'Dùng'));
      btns.push(h('button', { class: 'btn red', onclick: () => { removeItem(it.uid); p.gold += price; Audio2.play('ui-030'); save(); tip.close(); onChange && onChange(); } }, `Bán ${fmt(price)}`));
    }
    const tip = this.modal(h('div', { class: 'tip pop' },
      h('div', { class: 'row' }, h('div', { class: 'slot q' + q, style: { width: 'calc(110*var(--u))', flex: 'none' } }, h('img', { src: itemIcon(it) })),
        h('div', {}, h('div', { class: 'nm', style: { color: QUALITY_COLORS[q] } }, itemName(it)), it.n > 1 ? h('div', { class: 'ln' }, `Số lượng: ${it.n}`) : null)),
      h('div', { style: { margin: 'calc(14*var(--u)) 0' } }, lines),
      h('div', { class: 'row', style: { justifyContent: 'flex-end', flexWrap: 'wrap' } }, btns)));
  }

  // ------------------------------------------------ shop (equipment merchant, storage 1) + potions
  shop(tab0) {
    const p = P.data;
    story('open shop', { storage: 1 });
    const panel = h('div', { class: 'panel inv pop' });
    const m = this.modal(panel);
    let tab = tab0 || 'eq';
    // refresh stock once per camp visit
    if (!this.stock || this.stockLv !== p.level) {
      const rows = DB.shopRows.filter(r => +r.Storage === 1 && p.level >= (+r.MinLevel || 1) && (r.MaxLevel === '' || p.level <= +r.MaxLevel));
      const pool = rows.length ? rows : DB.shopRows.filter(r => +r.Storage === 1).slice(0, 10);
      const picks = []; const used = new Set();
      for (let i = 0; i < 10 && used.size < pool.length; i++) { let r; do { r = pool[Math.floor(Math.random() * pool.length)]; } while (used.has(r.ID) && used.size < pool.length); used.add(r.ID); const it = makeEquip(r.ItemID, p.level); if (it) picks.push({ r, it }); }
      this.stock = picks; this.stockLv = p.level;
    }
    const price = it => { const pr = Lua.call('CalShopGoodsPrice', 0, it.id, 1, toLuaEqu(it)); return Math.max(10, Math.round(pr?.[1] ?? pr?.[0] ?? sellPrice(it) * 6)); };
    const render = () => {
      panel.innerHTML = '';
      panel.append(h('button', { class: 'close', onclick: () => m.close() }), h('h2', {}, S('useful_020') || 'Cửa hàng'),
        h('div', { class: 'row', style: { justifyContent: 'center', marginBottom: 'calc(10*var(--u))', gap: 'calc(12*var(--u))' } }, h('span', { class: 'pill money' }, h('i'), fmt(p.gold)), h('span', { class: 'pill money dia' }, h('i'), fmt(p.diamond || 0))),
        h('div', { class: 'tabs' }, h('button', { class: tab === 'eq' ? 'on' : '', onclick: () => { tab = 'eq'; render(); } }, 'Trang bị'), h('button', { class: tab === 'pot' ? 'on' : '', onclick: () => { tab = 'pot'; render(); } }, 'Thuốc & túi'), h('button', { class: tab === 'mer' ? 'on' : '', onclick: () => { tab = 'mer'; render(); } }, 'Thương nhân'), h('button', { class: tab === 'fas' ? 'on' : '', onclick: () => { tab = 'fas'; render(); } }, 'Thời trang')));
      const list = h('div', { class: 'shoplist' });
      if (tab === 'eq') {
        list.append(this.npcTalk(1));
        for (const st of this.stock) {
          const it = st.it; const cost = price(it); const q = it.q;
          list.append(h('div', { class: 'shopitem' },
            h('button', { class: 'slot q' + q, onclick: () => this.itemTip(it, { shop: () => buy(st, cost) }) }, h('img', { src: itemIcon(it) })),
            h('div', { class: 'grow' }, h('div', { class: 'nm', style: { color: q > 1 ? QUALITY_COLORS[q] : '#3a2410' } }, itemName(it)), h('div', { class: 'muted' }, `Yêu cầu Lv.${+DB.equip.get(it.id).LevelReq || 1}`)),
            h('button', { class: 'btn small', disabled: p.gold < cost ? true : null, onclick: () => buy(st, cost) }, h('span', { class: 'money' }, h('i'), fmt(cost)))));
        }
        if (!this.stock.length) list.append(h('p', { class: 'center' }, 'Hết hàng.'));
      } else if (tab === 'mer') { this.merchantList(list, render);
      } else if (tab === 'fas') { this.fashionList(list, render);
      } else {
        const offers = [
          ['Nâng giới hạn bình máu +1', 'red', 500 * (p.maxRed - 9)],
          ['Nâng giới hạn bình mana +1', 'blue', 500 * (p.maxBlue - 9)],
          ['Mở rộng túi đồ +6 ô', 'bag', 1000 * Math.pow(2, (p.bagSize - 40) / 6)],
        ];
        for (const [name, k, cost] of offers) list.append(h('div', { class: 'shopitem' },
          h('div', { class: 'slot' }, h('span', { class: 'ph', style: { opacity: 1, backgroundImage: `url(assets/img/ux/${k === 'bag' ? 'chest' : 'orb-' + k}.webp)` } })),
          h('div', { class: 'grow nm' }, name),
          h('button', { class: 'btn small', disabled: p.gold < cost ? true : null, onclick: () => { if (p.gold < cost) return; p.gold -= cost; if (k === 'red') p.maxRed++; else if (k === 'blue') p.maxBlue++; else p.bagSize += 6; Audio2.play('ui-030'); save(); render(); } }, h('span', { class: 'money' }, h('i'), fmt(cost)))));
      }
      panel.append(list);
    };
    const buy = (st, cost) => {
      if (p.gold < cost) { this.toast('Không đủ vàng'); return; }
      if (!addItem(st.it)) { this.toast('Túi đồ đã đầy!'); return; }
      p.gold -= cost; this.stock = this.stock.filter(x => x !== st); Audio2.play('ui-030'); save(); render();
    };
    render();
  }

  // ------------------------------------------------ skill tree (skill.csv groups, effects from skill.lua)
  skillTree() {
    const p = P.data;
    story('open skill', {}); story('open learn skill', {});
    const panel = h('div', { class: 'panel inv pop' });
    const m = this.modal(panel, () => { this.g.onEquipChanged(); if (this.g.tower) { this.buildSkillBar(); this.hud(this.g.tower); } else if (this.g.scene === 'camp') this.camp(); });
    const render = () => {
      panel.innerHTML = '';
      panel.append(h('button', { class: 'close', onclick: () => m.close() }), h('h2', {}, 'Kỹ năng'),
        h('div', { class: 'row', style: { justifyContent: 'center', marginBottom: 'calc(10*var(--u))' } },
          h('span', { class: 'pill' }, `Điểm: ${p.skillPoints}`), h('span', { class: 'pill' }, `Đã dùng: ${pointsSpent()}`),
          h('button', { class: 'btn small red', onclick: () => { const cost = 200 * p.level; this.confirm(`Tẩy điểm kỹ năng với ${fmt(cost)} vàng?`, () => { if (p.gold < cost) { this.toast('Không đủ vàng'); return; } p.gold -= cost; resetSkills(); save(); render(); }); } }, 'Tẩy điểm')));
      const list = h('div', { class: 'shoplist' });
      for (const [g, rows] of groupsOrdered()) {
        const chosen = learnedInGroup(g);
        const slotIdx = COMBAT_GROUPS.indexOf(g);
        const tag = slotIdx >= 0 ? `Kỹ năng chiến đấu #${slotIdx + 1}` : g === 14 ? 'Kỹ năng phiêu lưu' : 'Bị động';
        const need = +rows[0].PointReq || 0;
        const locked = !canLearn(rows[0].ID).ok && !chosen && (pointsSpent() < need || (rows[0].Condition !== '' && !String(rows[0].Condition).split(';').some(c => learnedInGroup(+c))));
        list.append(h('div', { class: 'skrow' + (locked ? ' locked' : '') },
          h('div', { class: 'sktag' }, `${tag}${need ? ' · cần ' + need + ' điểm' : ''}`),
          h('div', { class: 'skicons' }, rows.map(r => {
            const lv = skillLevel(r.ID);
            return h('button', { class: 'skicon' + (lv ? ' on' : '') + (chosen && chosen !== r.ID ? ' dim' : ''), style: { backgroundImage: `url(${skillIcon(r)})` }, onclick: () => this.skillTip(r, render) }, lv ? h('span', { class: 'n' }, lv + '/' + (r.MaxLevel || 5)) : null);
          }))));
      }
      panel.append(list);
    };
    render();
  }
  skillTip(r, after) {
    const lv = skillLevel(r.ID), max = +r.MaxLevel || 5;
    const c = canLearn(r.ID);
    const info = [];
    if (+r.Type === 1) info.push(`MP: ${r.ManaCost} · Hồi chiêu: ${r.Cooldown}s`);
    if (+r.Type === 2) info.push(`MP: ${r.ManaCost}`);
    const tip = this.modal(h('div', { class: 'tip pop' },
      h('div', { class: 'row' }, h('div', { class: 'skicon on', style: { backgroundImage: `url(${skillIcon(r)})`, flex: 'none' } }),
        h('div', {}, h('div', { class: 'nm' }, S(r.Name)), h('div', { class: 'ln muted' }, `Cấp ${lv}/${max}${info.length ? ' · ' + info.join(' · ') : ''}`))),
      lv ? h('div', { class: 'ln', style: { marginTop: 'calc(12*var(--u))' }, html: '<b>Hiện tại:</b> ' + richText(skillDesc(r.ID, lv)) }) : null,
      lv < max ? h('div', { class: 'ln aff', style: { marginTop: 'calc(8*var(--u))' }, html: '<b>Cấp ' + (lv + 1) + ':</b> ' + richText(skillDesc(r.ID, lv + 1)) }) : null,
      h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: 'calc(14*var(--u))' } },
        c.ok ? h('button', { class: 'btn green', onclick: () => { const res = learn(r.ID); if (res.ok) { Audio2.play('levelup-2'); save(); tip.close(); after && after(); story('learn skill', { skill_id: r.ID, skill_group: +r.Group, skill_type: +r.Type }); } } }, lv ? 'Nâng cấp' : 'Học') : h('span', { class: 'muted' }, c.why))));
  }

  // ------------------------------------------------ settings
  settings() {
    const p = P.data;
    const panel = h('div', { class: 'panel pop', style: { top: 'calc(160*var(--u))' } });
    const m = this.modal(panel);
    const langs = [['en', 'English'], ['zhs', '简体中文'], ['zht', '繁體中文'], ['jp', '日本語'], ['kr', '한국어']];
    const render = () => {
      panel.innerHTML = '';
      panel.append(h('button', { class: 'close', onclick: () => m.close() }), h('h2', {}, 'Cài đặt'),
        h('div', { class: 'setting' }, 'Nhạc', h('input', { type: 'range', min: 0, max: 1, step: .05, value: p.settings.music, oninput: e => { p.settings.music = +e.target.value; Audio2.setMusic(p.settings.music); save(); } })),
        h('div', { class: 'setting' }, 'Âm thanh', h('input', { type: 'range', min: 0, max: 1, step: .05, value: p.settings.sound, oninput: e => { p.settings.sound = +e.target.value; Audio2.setSound(p.settings.sound); save(); } })),
        h('div', { class: 'setting' }, 'Ngôn ngữ nội dung game', h('select', { onchange: async e => { p.settings.lang = e.target.value; await setLang(p.settings.lang); save(); this.toast('Đã đổi ngôn ngữ'); } }, langs.map(([v, n]) => h('option', { value: v, selected: p.settings.lang === v ? 'selected' : null }, n)))),
        h('div', { class: 'setting' }, 'Lưu trên mây (Firebase):', h('b', {}, Cloud.enabled ? (Cloud.status === 'ok' ? (Cloud.isAnon ? 'Ẩn danh' : 'Google') : Cloud.status) : 'chưa cấu hình')),
        Cloud.enabled && Cloud.isAnon ? h('button', { class: 'btn small', onclick: async () => { if (await Cloud.signInGoogle()) { save(); this.toast('Đã liên kết Google'); render(); } } }, 'Đăng nhập Google để đồng bộ') : '',
        h('div', { class: 'row', style: { flexWrap: 'wrap', marginTop: 'calc(16*var(--u))', justifyContent: 'center' } },
          h('button', { class: 'btn small', onclick: () => { const blob = new Blob([JSON.stringify(p)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: `imonster-save-${p.name}.json` }); a.click(); } }, 'Xuất file lưu'),
          h('button', { class: 'btn small', onclick: () => { const inp = h('input', { type: 'file', accept: '.json', onchange: async () => { try { const d = JSON.parse(await inp.files[0].text()); if (!d.name || !d.equipped) throw 0; P.data = d; save(); location.reload(); } catch (e) { this.toast('File không hợp lệ'); } } }); inp.click(); } }, 'Nhập file lưu'),
          h('button', { class: 'btn small red', onclick: () => this.confirm('Xoá toàn bộ dữ liệu và chơi lại từ đầu?', () => { wipe(); location.reload(); }) }, 'Xoá dữ liệu')),
        h('p', { class: 'center muted', style: { fontSize: 'calc(18*var(--u))' } }, 'iMonster Classic: Hero Adventure — bản làm lại web cá nhân. Nội dung gốc © Pixss / Loongcheer.'));
    };
    render();
  }
}
