// iMonster Classic: Hero Adventure — web remake. Boot + scene management.
import { DB, loadDB, setLang } from './engine/db.js';
import { Lua } from './engine/lua.js';
import { Gfx } from './engine/gfx.js';
import { Audio2 } from './engine/audio.js';
import { initSpineKit, buildPlayerSkeleton, SpineActor } from './engine/spinekit.js';
import { UI } from './ui/ui.js';
import './ui/panels.js';
import { Tower } from './game/tower.js';
import { Cloud } from './game/cloud.js';
import * as Profile from './game/profile.js';
import { StoryHost, installStory, story } from './game/story.js';
import { installSkillLua, skillHost, heroPassives, applyAttrEffects, applyHeroSpecials, activeBuffs, buffMods, invalidatePassives } from './game/skills.js';
import { Modes, lookEquips, LAB_START } from './game/modes.js';
import { Daily } from './game/daily.js';
import { loadGemTable } from './game/craft.js';
const { P, save, newProfile, loadBest, fullHeal } = Profile;

const VW = 750, VH = 1334;
class Game {
  constructor() {
    this.stage = document.getElementById('stage');
    this.canvas = document.getElementById('gl');
    this.gfx = new Gfx(this.canvas);
    this.gfx.makeWhite();
    initSpineKit(this.gfx.ctx);
    this.ui = new UI(this);
    this.profileApi = Profile;
    this.scene = 'boot'; this.tower = null; this.previewActor = null;
    this.viewW = VW; this.viewH = VH;
    window.addEventListener('resize', () => this.layout());
    this.layout();
    this.canvas.addEventListener('pointerdown', e => this.onPointer(e));
    document.addEventListener('visibilitychange', () => { if (document.hidden && P.data) save(); });
    window.addEventListener('beforeunload', () => { if (P.data) save(); });
    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }
  layout() {
    clearTimeout(this._relayout); this._relayout = setTimeout(() => { if (this.scene === 'camp') this.ui.camp(); }, 200);
    const w = window.innerWidth, h = window.innerHeight;
    // portrait 750x1334 design; on wide screens keep portrait, on narrow phones fill
    let sw = w, sh = h;
    const ar = VW / VH;
    if (w / h > ar) sw = Math.round(h * ar); else sh = Math.round(w / ar);
    if (w / h < ar && w / h > 0.4) { sw = w; sh = h; } // tall phones: fill, extend view vertically
    const u = sw / VW;
    document.documentElement.style.setProperty('--u', u + 'px');
    this.stage.style.width = sw + 'px'; this.stage.style.height = sh + 'px';
    this.viewW = VW; this.viewH = sh / u;
    this.gfx.resize(sw, sh, Math.min(2, window.devicePixelRatio || 1));
  }
  async boot() {
    this.ui.loading();
    try {
      await loadDB(k => this.ui.progress(k * 0.6, 'Đang tải dữ liệu...'));
      DB.playernameRows = await fetch('data/playername.json').then(r => r.json());
      DB.fixedmaps = await fetch('data/fixedmaps.json').then(r => r.json());
      this.ui.progress(0.65, 'Khởi động công thức gốc (Lua)...');
      await Lua.init(['define', 'common', 'formular', 'skill', 'monsterai', 'story', 'subplots', 'encounter', 'main'], {
        ...StoryHost,
        randi: (a, b) => { a = Math.floor(a); b = Math.floor(b); return b <= a ? a : a + Math.floor(Math.random() * (b - a + 1)); },
        rand: () => Math.random(),
        LocalString: k => DB.str[k] || k,
        SuccessRandom: p => Math.random() * 100 < p,
        ...skillHost,
      });
      installSkillLua();
      installStory(this);
      Profile.setStatHook(s => this.heroStatHook(s));
      this.ui.progress(0.8, 'Kết nối lưu trữ...');
      await Cloud.init();
      await loadGemTable();
      await loadBest();
      if (P.data?.labBackup) this.labSummary = Modes.leaveLab(); // page closed inside the Dark Lab
      this.daily = Daily;
      Daily.onDone = tk => this.ui.toast('Hoàn thành nhiệm vụ: ' + Daily.text(tk));
      if (P.data) await setLang(P.data.settings.lang || 'en');
      invalidatePassives();
      Audio2.init(P.data?.settings);
      this.ui.progress(0.95, 'Chuẩn bị...');
      await Promise.all([this.gfx.loadSheet('ui/uip-3'), this.gfx.loadTex('ui/towermasker-1'), this.gfx.loadTex('scene/camp')]);
      this.ui.progress(1, 'Xong!');
    } catch (e) {
      console.error(e); this.ui.progress(1, 'Lỗi tải: ' + e.message); return;
    }
    this.title();
  }
  heroStatHook(s) {
    const p = P.data; if (!p) return s;
    const pv = heroPassives({ ...s, cur_hp: p.hp ?? s.max_hp, cur_mp: p.mp ?? s.max_mp });
    applyAttrEffects(s, pv.stat);
    const w = p.equipped.weapon; const wt = w ? +DB.equip.get(w.id)?.Type : 0;
    applyHeroSpecials(s, pv.specials, { weaponType: wt });
    const t = this.tower; const h = t?.hero;
    if (t?.pet) t.pet.heroStat(s);
    if (h?.buffs?.length) {
      const now = t.combat.now;
      const effs = activeBuffs(h, now).filter(b => b.type === 'attrib benefit' || b.type === 'attrib gain');
      if (effs.length) applyAttrEffects(s, effs);
      const sp = buffMods(h, now).speed; if (sp) s.fin_atk_speed *= 1 + sp / 100;
      // Fierce Battle (107100): attack speed up to p1% by lost HP
    }
    if (pv.specials[107100] && p.hp != null) s.fin_atk_speed *= 1 + (+pv.specials[107100].p1 || 0) / 100 * Math.max(0, 1 - p.hp / s.max_hp);
    s.fin_atk_speed = Math.round(s.fin_atk_speed);
    return s;
  }
  // camp/main background (750x1334 art, drawn centered + cover) -> stage percentage
  bgToScreen(bx, by) {
    const k = Math.max(this.viewW / 750, this.viewH / 1334);
    const wx = (bx - 375) * k, wy = (667 - by) * k;
    return { x: (wx / this.viewW + 0.5) * 100, y: (0.5 - wy / this.viewH) * 100 };
  }
  maxPot(kind) { const p = P.data, s = Profile.stats(); return kind === 'red' ? p.maxRed + (s.extra_red || 0) : p.maxBlue + (s.extra_blue || 0); }
  refillPots() { const p = P.data; p.red = this.maxPot('red'); p.blue = this.maxPot('blue'); }
  title() {
    this.scene = 'title'; this.tower = null; this.previewActor = null;
    Audio2.playBGM('theme-1');
    this.ui.title(() => { if (P.data) this.toCamp(true, true); else this.create(); });
  }
  create() {
    this.scene = 'create';
    newProfile('?', { tone: 1, style: 2 }); // temporary profile so the intro story can run
    this.ui.create((name, look) => { const st0 = P.data.story; newProfile(name, look); P.data.story = st0; story('create role', {}); save(); this.toCamp(true, true); });
    setTimeout(() => story('enter create', {}), 300);
  }
  async preview(look, equips) {
    if (equips) this._prevEquips = equips;
    const sk = await buildPlayerSkeleton(look, this._prevEquips || []);
    const a = new SpineActor(sk); a.play('stand-2-2', true);
    this.previewActor = a; this.previewLook = look;
  }
  async onEquipChanged() {
    if (this.tower) await this.tower.refreshHeroLook();
    if (this.scene === 'camp') await this.campPreview();
  }
  async campPreview() {
    const p = P.data;
    await this.preview(p.look, lookEquips(p));
  }
  async toCamp(keepLoot, silent) {
    const p = P.data;
    let labRes = null;
    if (Modes.inLab()) { labRes = Modes.leaveLab(); keepLoot = true; }
    if (!keepLoot && this.runSnapshot) {
      // died: lose what was gathered during this run (original: "You can't take anything away")
      p.inventory = this.runSnapshot.inventory; p.gold = this.runSnapshot.gold;
    }
    const died = !keepLoot && this.tower?.dead;
    this.runSnapshot = null; this.hardRun = false;
    this.tower = null; this.scene = 'camp'; this.returnMap = null;
    fullHeal(); this.refillPots(); p.curMap = null;
    save();
    Audio2.playBGM('home-1');
    this.ui.closeModals();
    this.ui.camp();
    await this.campPreview();
    story('enter main', {}); story('enter camp', {});
    if (died) story('resurge', {});
    labRes ||= this.labSummary; this.labSummary = null;
    if (labRes) this.ui.labResult(labRes);
    Daily.ensure();
  }
  // mode: 'normal' | 'hard' | 'lab'
  async enterTower(mapId, fresh, mode) {
    const p = P.data;
    if (fresh) {
      this.hardRun = mode === 'hard';
      if (mode === 'lab') { Modes.enterLab(); mapId = LAB_START; }
      Daily.progress(1, 1);
      this.runSnapshot = mode === 'lab' ? null : { inventory: JSON.parse(JSON.stringify(p.inventory)), gold: p.gold };
      this.refillPots(); fullHeal();
    }
    this.ui.closeModals();
    this.ui.loading(); this.ui.progress(0.3, 'Đang vào tháp...');
    story('entering tower', { map_id: +mapId });
    const lastId = this.tower ? this.tower.mapId : 0;
    const t = new Tower(this);
    try { await t.enter(mapId); }
    catch (e) { console.error(e); this.ui.toast('Lỗi tạo tầng: ' + e.message); return this.toCamp(true); }
    this.tower = t; this.scene = 'tower'; this.previewActor = null;
    this.ui.hud(t);
    story('entered tower', { map_id: +mapId, last_id: lastId });
  }
  onPointer(e) {
    const r = this.canvas.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    if (this.storyBusy || this.veil || this.locked) return;
    if (this.scene === 'tower' && this.tower) this.tower.onTap(sx, sy);
  }
  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
    try {
      if (this.scene === 'tower' && this.tower) {
        if (this.storyBusy) this.tower.animateOnly(dt); else this.tower.update(dt);
        this.tower.render(); this.ui.tick(this.tower);
      } else this.renderPreview(dt);
    } catch (e) { console.error(e); }
    requestAnimationFrame(tt => this.loop(tt));
  }
  renderPreview(dt) {
    const g = this.gfx;
    g.setView(0, 0, this.viewW, this.viewH);
    g.begin([0, 0, 0]);
    const bg = g.tex('scene/camp');
    if (bg && (this.scene === 'create' || this.scene === 'camp')) {
      const k = Math.max(this.viewW / 750, this.viewH / 1334);
      g.drawTex(bg, 0, 0, { w: 750 * k, h: 1334 * k, color: this.scene === 'create' ? this._dim || (this._dim = new spine.Color(.45, .45, .5, 1)) : null });
    }
    const a = this.previewActor;
    if (a && (this.scene === 'create' || this.scene === 'camp')) {
      a.update(dt);
      const sk = a.skeleton;
      const sc = this.scene === 'create' ? 2.4 : 1.5;
      sk.scaleX = sk.scaleY = sc;
      sk.x = this.scene === 'create' ? 0 : 40; sk.y = this.scene === 'create' ? 60 : -this.viewH / 2 + 250;
      sk.updateWorldTransform();
      g.drawSkeleton(sk);
    }
    g.end();
  }
}

const game = new Game();
window.GAME = game;
game.boot();
