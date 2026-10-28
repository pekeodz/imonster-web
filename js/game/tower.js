// The Ruling Tower: one floor = one scene (map, monsters, objects, hero, fights).
import { DB, S } from '../engine/db.js';
import { Lua } from '../engine/lua.js';
import { Audio2 } from '../engine/audio.js';
import { rgba } from '../engine/gfx.js';
import { buildPlayerSkeleton, loadSkeletonData, SpineActor } from '../engine/spinekit.js';
import { Grid, WALL, FLOOR, RNG, wallStyle, floorStyle, generateDungeon, bfs, findPath } from './mapgen.js';
import { monsterStats, weaponStance } from './stats.js';
import { P, stats, addExp, addItem, save, fullHeal } from './profile.js';
import { makeAny, rollDropSet, resolveDrop, itemName, itemIcon, itemQuality, itemRecord, QUALITY_COLORS } from './items.js';
import { Combat, AFFIX_NAMES } from './combat.js';
import { story } from './story.js';
import { adventureSkill } from './skills.js';
import { U, GC } from './native/core.js';
import { Ctx, bindHero, bumpStats, bottleLimit, finMPCost } from './native/bridge.js';
import { Traps } from './traps.js';
import { Ornaments, loadOrna, loadTowerFx, towerFx, drawCCB, ccbAssets } from './ornaments.js';
import { pickDiary } from './diary.js';
import { PetRuntime, activePet } from './pets.js';
import { Modes, lookEquips } from './modes.js';
import { Daily } from './daily.js';

const T = 100; // tile size
export const OBJ = { WOOD_BOX: 1, GOLD_BOX: 2, DIAMOND_BOX: 3, CROCK: 4, BARREL: 5, WEAPON_RACK: 6, ARMOR_RACK: 7, TRINKET_BOX: 8, RED_SPRING: 9, BLUE_SPRING: 10, YELLOW_SPRING: 11, RED_ALTAR: 12, BLUE_ALTAR: 13, YELLOW_ALTAR: 14, RETURN_STELE: 15, OPEN_MAP: 16, BOSS_BOX: 29 };
// sprite frames in ui/uip-3 (closed, opened) and sounds
const OBJ_ART = {
  1: ['object-3-1', 'object-3-2', 'object-1-1', 'WoodBoxDrop'],
  2: ['object-4-1', 'object-4-2', 'object-1-1', 'GoldBoxDrop'],
  3: ['object-5-1', 'object-5-2', 'object-1-1', 'DiamondBoxDrop'],
  4: ['object-1-1', 'object-1-2', 'object-2-1', 'BarrelDrop'],
  5: ['object-2-1', 'object-2-2', 'object-2-1', 'BarrelDrop'],
  6: ['object-8-1', 'object-8-2', 'object-4-1', 'WeapenRackDrop'],
  7: ['object-7-1', 'object-7-2', 'object-4-1', 'ArmorStandDrop'],
  8: ['object-11-1', 'object-11-2', 'object-1-1', 'TrinketBoxDrop'],
  9: ['object-6-1', 'object-6-1', 'object-5-1'],
  10: ['object-6-1', 'object-6-1', 'object-5-1'],
  11: ['object-6-1', 'object-6-1', 'object-5-1'],
  12: ['object-10-1', 'object-10-1', 'event-1-2'],
  13: ['object-10-1', 'object-10-1', 'event-1-2'],
  14: ['object-10-1', 'object-10-1', 'event-1-2'],
  15: ['object-15-1', 'object-15-2', 'event-1-2'],
  16: ['object-13-2', 'object-13-1', 'event-1-2'],
  29: ['object-5-1', 'object-5-2', 'object-1-1', 'BossBoxDrop'],
  19: ['object-10-1', 'object-10-1', 'event-1-2'], 20: ['object-9-3', 'object-9-3', 'event-2-1'], 21: ['object-17-4', 'object-17-4', ''],
  22: ['object-12-1', 'object-12-1', 'ui-003'], 23: ['object-14-2', 'object-14-2', 'object-6-1'], 24: ['object-13-1', 'object-13-1', 'event-1-2'],
  25: ['object-11-2', 'object-11-2', 'itemsound-3'], 26: ['object-14-2', 'object-14-2', 'object-6-1'], 27: ['object-11-1', 'object-11-1', 'talking'],
  28: ['object-16-1', 'object-16-1', 'ui-003'], 31: ['object-11-1', 'object-11-1', 'talking'],
  40: ['object-13-2', 'object-13-1', 'ui-003'], // diary page (diary.csv)
};
const SCRIPT_TYPES = new Set([19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 31]);
const SPRING_TINT = { 40: rgba(1, .78, .55), 9: rgba(1, .55, .55), 10: rgba(.55, .7, 1), 11: rgba(1, 1, .6), 12: rgba(1, .5, .5), 13: rgba(.5, .7, 1), 14: rgba(1, 1, .5) };
const FLAG_COLORS = { 1: [0.9, 0.2, 0.2], 2: [0.95, 0.85, 0.2], 3: [0.25, 0.5, 0.95], 4: [0.3, 0.85, 0.3] };
const DESTROYED = new Set([4, 5, 40]); // become passable when broken

export class Tower {
  constructor(game) { this.g = game; this.gfx = game.gfx; this.ui = game.ui; this.time = 0; }

  // ---------------------------------------------------------------- setup
  async enter(mapId, opts = {}) {
    const row = DB.map.get(+mapId);
    if (!row) throw new Error('map ' + mapId);
    this.row = row; this.mapId = +mapId;
    this.floor = +row.Floor; this.level = +row.Level || 1;
    this.rng = new RNG((Date.now() ^ (mapId * 7919)) >>> 0);
    this.units = []; this.objects = []; this.fx = []; this.fight = null; this.hero = null; this.dead = false;
    this.combat = new Combat(this);
    Ctx.tower = this; Ctx.mapRow = row; Ctx.resistMod = 0; bumpStats();
    this.hard = !!this.g.hardRun && !Modes.inLab(); this.lab = Modes.inLab();
    this.traps = new Traps(this);
    this.tileset = String(row.Image || 1);
    if (!DB.frames['map/tile-' + this.tileset]) this.tileset = '1';
    if (+row.Generate === 1 && row.FixedMap !== '' && DB.fixedmaps?.[row.FixedMap]) this.buildFixed(DB.fixedmaps[row.FixedMap]);
    else this.buildRandom();
    const trapIds = Traps.wanted(this);
    if (trapIds.length && !(+row.Generate === 1)) this.traps.build(trapIds);
    this.revealed = new Uint8Array(this.grid.w * this.grid.h);
    this.orna = new Ornaments(this);
    try { await loadOrna(); this.orna.build(); } catch (e) { console.warn('ornaments', e); }
    const on = this.orna.sheets();
    // per-tileset sky/background and lighting layer from the original tower/bg-N and tower/masker-N scenes
    try { await loadTowerFx(); } catch (e) { }
    this.bgFx = towerFx('bg-' + this.tileset); this.maskFx = towerFx('masker-' + this.tileset);
    this.fxEm = { bg: new Map(), mask: new Map() };
    for (const d of [this.bgFx, this.maskFx]) if (d) { const a = ccbAssets(d); on.sheets.push(...a.sheets.filter(k => DB.frames[k])); on.tex.push(...a.tex); }
    const ap = activePet();
    if (ap) this.pet = new PetRuntime(this, ap.id, ap);
    // assets
    await Promise.all([
      this.gfx.loadSheet('map/tile-' + this.tileset),
      this.gfx.loadSheet('ui/uip-3'),
      this.gfx.loadTex('map/floor'), this.gfx.loadTex('ui/towermasker-1'),
      this.gfx.loadSheet('map/stair'),
      this.gfx.loadTex('ui/effect-1-2-3'), this.gfx.loadTex('ui/effect-1-2-6'), this.gfx.loadTex('ui/effect-1-4-1'),
      this.gfx.loadSheet('map/hidden-1'),
      this.pet ? this.pet.load(loadSkeletonData, SpineActor) : null,
      ...on.sheets.map(k => this.gfx.loadSheet(k).catch(() => null)),
      ...on.tex.map(k => this.gfx.loadTex(k).catch(() => null)),
    ]);
    await this.spawnHero();
    await Promise.all(this.units.filter(u => !u.isHero).map(u => this.loadMonsterActor(u)));
    for (const u of this.units) if (!u.isHero) this.combat.setupMonster(u);
    this.arriveFloor();
    this.reveal(this.hero.x, this.hero.y);
    this.camX = this.hero.wx; this.camY = this.hero.wy;
    if (this.pet) { this.pet.unit.wx = this.hero.wx - 70; this.pet.unit.wy = this.hero.wy + 15; }
    Audio2.playBGM(row.BGM || 'tower-1');
    const fl = S(row.FloorName); const nm = S(row.Name);
    this.ui.banner(`${nm}`, this.lab ? `Phòng thí nghiệm · Tầng ${this.floor}` : this.hard ? `Tầng ${this.floor} · KHÓ` : `Tầng ${this.floor}`);
    // floor-entry passives
    P.data.curFloor = this.floor; P.data.curMap = this.mapId;
    if (this.lab) { P.data.labRun ||= { floor: 1 }; P.data.labRun.floor = this.floor; }
    else if (this.hard) { if (this.floor > (P.data.maxFloorHard || 0)) P.data.maxFloorHard = this.floor; }
    else if (this.floor > P.data.maxFloor) P.data.maxFloor = this.floor;
    save();
    this.ui.hud(this);
  }

  buildRandom() {
    const cfgR = Lua.call('GetMapConfig', this.floor, this.level);
    const cfg = cfgR ? cfgR[0] : { deep: 120, monster: 12 };
    this.cfg = cfg;
    const g = generateDungeon(cfg.deep || 120, this.rng);
    this.grid = g;
    const floors = [];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.isFloor(x, y)) floors.push([x, y]);
    // born in first room centre; pass = farthest
    const r0 = g.rooms[0];
    const born = [Math.round((r0.x0 + r0.x1) / 2), Math.round((r0.y0 + r0.y1) / 2)];
    const dist = bfs(g, born[0], born[1]);
    let far = born, fd = -1;
    for (const [x, y] of floors) { const d = dist[x + y * g.w]; if (d > fd) { fd = d; far = [x, y]; } }
    this.born = born; this.pass = far;
    this.blocked = new Uint8Array(g.w * g.h);
    const used = new Set([born.join(), far.join()]);
    // reserve tiles around born
    for (const [x, y] of floors) if (Math.abs(x - born[0]) + Math.abs(y - born[1]) <= 1) used.add(x + ',' + y);
    const candidates = floors.filter(([x, y]) => !used.has(x + ',' + y));
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = this.rng.int(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    shuffle(candidates);
    const take = (pred) => {
      for (let i = 0; i < candidates.length; i++) {
        const [x, y] = candidates[i];
        if (used.has(x + ',' + y) || !pred(x, y)) continue;
        candidates.splice(i, 1); used.add(x + ',' + y); return [x, y];
      }
      return null;
    };
    const wallNeighbors = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => g.get(x + dx, y + dy) !== FLOOR).length;
    // objects: prefer tiles touching walls, keep connectivity
    const objList = [];
    const pushN = (type, n) => { for (let i = 0; i < (n | 0); i++) objList.push(type); };
    pushN(OBJ.WOOD_BOX, cfg.wood_box); pushN(OBJ.GOLD_BOX, cfg.gold_box); pushN(OBJ.DIAMOND_BOX, cfg.diamond_box);
    pushN(OBJ.WEAPON_RACK, cfg.weapon_rack); pushN(OBJ.ARMOR_RACK, cfg.armor_rack); pushN(OBJ.TRINKET_BOX, cfg.trinket_box);
    pushN(OBJ.CROCK, cfg.crock); pushN(OBJ.BARREL, cfg.barrel);
    for (let i = 0; i < (cfg.altar | 0); i++) objList.push(this.rng.pick([9, 10, 11, 12, 13, 14]));
    if (this.floor >= 3 && this.rng.chance(0.25)) objList.push(OBJ.OPEN_MAP);
    if (this.floor >= 5 && this.rng.chance(0.3)) objList.push(OBJ.RETURN_STELE);
    const diary = this.lab ? null : pickDiary(this.floor, this.rng);
    if (diary) objList.push(40);
    for (const type of objList) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const pos = take((x, y) => wallNeighbors(x, y) >= 2 && wallNeighbors(x, y) < 4);
        if (!pos) break;
        const [x, y] = pos;
        this.blocked[x + y * g.w] = 1;
        if (!this.connected() || !this.allObjectsReachable([...this.objects, { x, y }])) { this.blocked[x + y * g.w] = 0; continue; }
        this.objects.push(type === 40 ? { type, x, y, open: false, diary } : { type, x, y, open: false });
        break;
      }
    }
    // monsters
    const ids = String(this.row.MonsterID || '').split(';').filter(Boolean).map(Number).filter(id => DB.monster.has(id));
    if (!ids.length) ids.push(101000);
    const ranks = [];
    for (let i = 0; i < (cfg.monster | 0); i++) ranks.push(1);
    for (let i = 0; i < (cfg.blue_monster | 0); i++) ranks.push(2);
    for (let i = 0; i < (cfg.gold_monster | 0); i++) ranks.push(3);
    for (const rank of ranks) {
      const pos = take((x, y) => dist[x + y * g.w] >= 4);
      if (!pos) break;
      this.addMonster(this.rng.pick(ids), rank, pos[0], pos[1]);
    }
  }

  buildFixed(m) {
    const W = m.width, H = m.height, pad = 2;
    const g = new Grid(W + pad * 2, H + pad * 2);
    const layer = m.layers.find(l => l.type === 'tilelayer');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (layer.data[y * W + x] > 0) g.set(x + pad, y + pad, FLOOR);
    g.rooms = [{ x0: pad, y0: pad, x1: pad + W - 1, y1: pad + H - 1 }];
    this.grid = g; this.blocked = new Uint8Array(g.w * g.h);
    this.born = [pad, pad]; this.pass = null;
    const objs = (m.layers.find(l => l.type === 'objectgroup') || { objects: [] }).objects;
    for (const o of objs) {
      const x = Math.floor((o.x + (o.width || 100) / 2) / 100) + pad;
      const y = Math.floor((o.y - (o.height || 100) / 2) / 100) + pad;
      const t = o.type || o.name || '';
      if (t === 'entry') this.born = [x, y];
      else if (t === 'exit') this.pass = [x, y];
      else if (t.startsWith('mon_')) { const [, id, rank] = t.split('_'); if (DB.monster.has(+id)) this.addMonster(+id, +rank || 1, x, y); }
      else if (t.startsWith('obj_')) {
        const type = +t.split('_')[1];
        if (OBJ_ART[type]) { this.objects.push({ type, x, y, open: false }); this.blocked[x + y * g.w] = 1; }
      }
    }
    if (!this.pass) {
      const d = bfs(g, this.born[0], this.born[1]); let best = -1;
      for (let i = 0; i < d.length; i++) if (d[i] > best) { best = d[i]; this.pass = [i % g.w, (i / g.w) | 0]; }
    }
  }

  // every object needs a free, reachable neighbour tile so the hero can use it
  allObjectsReachable(objs) {
    const g = this.grid;
    const d = bfs(g, this.born[0], this.born[1], (x, y) => g.isFloor(x, y) && !this.blocked[x + y * g.w]);
    return objs.every(o => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const i = (o.x + dx) + (o.y + dy) * g.w; return g.isFloor(o.x + dx, o.y + dy) && !this.blocked[i] && d[i] >= 0; }));
  }
  connected() {
    const g = this.grid;
    const d = bfs(g, this.born[0], this.born[1], (x, y) => g.isFloor(x, y) && !this.blocked[x + y * g.w]);
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const i = x + y * g.w;
      if (g.isFloor(x, y) && !this.blocked[i] && d[i] < 0) return false;
    }
    return true;
  }

  nearestMonster() {
    const h = this.hero; let best = null, bd = 1e9;
    for (const u of this.units) { if (u.isHero || !u.alive) continue; const d = Math.abs(u.x - h.x) + Math.abs(u.y - h.y); if (d < bd) { bd = d; best = u; } }
    return best;
  }
  freeTileNear(cx, cy, minD = 1, maxD = 4) {
    const c = [];
    for (let y = cy - maxD; y <= cy + maxD; y++) for (let x = cx - maxD; x <= cx + maxD; x++) {
      const d = Math.abs(x - cx) + Math.abs(y - cy);
      if (d < minD || d > maxD || !this.passable(x, y) || (this.hero && x === this.hero.x && y === this.hero.y)) continue;
      if (this.pass && x === this.pass[0] && y === this.pass[1]) continue;
      c.push([x, y]);
    }
    return c.length ? c[Math.floor(Math.random() * c.length)] : null;
  }
  async spawnMonster(id, rank, lvOff, col, row) {
    if (!DB.monster.has(+id)) return;
    let pos = (col != null && row != null && this.passable(col, row)) ? [col, row] : null;
    if (!pos) {
      const d = bfs(this.grid, this.hero.x, this.hero.y, (x, y) => this.passable(x, y) || (x === this.hero.x && y === this.hero.y));
      const c = []; for (let i = 0; i < d.length; i++) if (d[i] >= 3) c.push([i % this.grid.w, (i / this.grid.w) | 0]);
      pos = c.length ? c[Math.floor(Math.random() * c.length)] : this.freeTileNear(this.hero.x, this.hero.y, 1, 6);
    }
    if (!pos) return;
    const u = this.addMonster(+id, rank, pos[0], pos[1], this.level + (+lvOff || 0));
    await this.loadMonsterActor(u);
    this.combat.setupMonster(u);
    if (this.revealed[this.idx(u.x, u.y)]) u.seen = true;
  }
  addScriptObject(type, name, param, col, row) {
    let pos = (col != null && row != null && this.grid.isFloor(col, row) && !this.objAt(col, row)) ? [col, row] : this.freeTileNear(this.hero.x, this.hero.y, 2, 6) || this.freeTileNear(this.hero.x, this.hero.y, 1, 10);
    if (!pos) return;
    if (!OBJ_ART[type]) type = 31;
    const o = { type, x: pos[0], y: pos[1], open: false, name, param, script: true };
    this.objects.push(o);
    if (type === 31 || type === 27) this.loadNpcActor(o);
    return o;
  }
  removeScriptObject(name) { this.objects = this.objects.filter(o => o.name !== name); }
  async loadNpcActor(o) {
    try {
      const data = await loadSkeletonData('ui/goblin-' + (/0001$|_1$/.test(o.name || '') ? 2 : 1), 'assets/img/');
      const sk = new spine.Skeleton(data); o.actor = new SpineActor(sk);
      o.actor.play([...o.actor.names].find(n => /stand|idle|normal/.test(n)) || [...o.actor.names][0], true);
    } catch (e) { }
  }
  addMonster(id, rank, x, y, level) {
    const rec = DB.monster.get(id);
    // rate: GameMap::genRandomMap -> 1 for normal maps (server-side bonus for lv>=21 maps is not available offline)
    // MapTemplate.ResInc is added to the PLAYER's resistances (MyPlayer::getFinXResist), not to monsters
    let st = monsterStats(rec, level ?? this.level, rank, 0, 1);
    if (this.hard) st = Modes.hardScale(st);   // NON-ORIGINAL: web hard mode (original hard rate came from the server)
    const u = { id, rec, rank, x, y, st, hp: st.max_hp, alive: true, isHero: false, dir: 3, flip: this.rng.chance(0.5), wx: x * T + 50, wy: -(y * T + 50) - 20, aware: false, alpha: 1 };
    u.mp = st.max_mp; u.onDie = () => this.monsterDie(u);
    this.units.push(u);
    return u;
  }
  async loadMonsterActor(u) {
    try {
      const data = await loadSkeletonData('npc/' + String(u.rec.MonsterModel).padStart(3, '0'));
      const sk = new spine.Skeleton(data);
      const sc = u.rank >= 4 ? 1.25 : u.rank === 3 ? 1.12 : u.rank === 2 ? 1.06 : 1;
      sk.scaleX = sk.scaleY = sc; u.baseScale = sc;
      u.actor = new SpineActor(sk);
      u.actor.play('stand-1-3', true);
      u.actor.state.update(Math.random() * 2);
      if (u.rank === 2) sk.color.set(0.75, 0.85, 1.25, 1);
      if (u.rank === 3) sk.color.set(1.2, 1.05, 0.6, 1);
    } catch (e) { console.warn('monster model', u.rec.MonsterModel, e); }
  }
  async spawnHero() {
    const sk = await buildPlayerSkeleton(P.data.look, lookEquips(P.data));
    const [x, y] = this.born;
    this.hero = { isHero: true, x, y, wx: x * T + 50, wy: -(y * T + 50) - 20, actor: new SpineActor(sk), dir: 2, flip: false, path: null, alive: true, alpha: 1 };
    this.hero.actor.state.data.defaultMix = 0;
    bindHero(this.hero); this.hero.onDie = () => this.heroDie();
    this.units.push(this.hero);
    this.heroIdle();
  }
  async refreshHeroLook() {
    if (!this.hero) return;
    const sk = await buildPlayerSkeleton(P.data.look, lookEquips(P.data));
    this.hero.actor = new SpineActor(sk); this.hero.actor.state.data.defaultMix = 0; this.heroIdle(true);
  }
  heroIdle(force) {
    const h = this.hero; const st = weaponStance(P.data);
    const name = `stand-${st}-${h.dir}`;
    if (force) h.actor.cur = null;
    h.actor.play(name, true);
  }

  // ---------------------------------------------------------------- queries
  idx(x, y) { return x + y * this.grid.w; }
  unitAt(x, y) { return this.units.find(u => u.alive && !u.isHero && u.x === x && u.y === y); }
  objAt(x, y) { return this.objects.find(o => o.x === x && o.y === y && !(o.open && DESTROYED.has(o.type))); }
  passable(x, y) {
    if (!this.grid.isFloor(x, y)) return false;
    if (this.objAt(x, y)) return false;
    if (this.unitAt(x, y)) return false;
    if (this.traps.isDrum(x, y)) return false;
    return true;
  }
  reveal(cx, cy, r = 2.6) {
    const g = this.grid; let n = 0;
    for (let y = Math.floor(cy - r) - 1; y <= cy + r + 1; y++) for (let x = Math.floor(cx - r) - 1; x <= cx + r + 1; x++) {
      if (x < 0 || y < 0 || x >= g.w || y >= g.h) continue;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.5) { if (!this.revealed[this.idx(x, y)]) { this.revealed[this.idx(x, y)] = 1; n++; } }
    }
    if (n) for (const u of this.units) if (!u.isHero && this.revealed[this.idx(u.x, u.y)]) u.seen = true;
  }
  revealAll() { this.revealed.fill(1); this.units.forEach(u => u.seen = true); }
  // item: random teleport scroll (UseEffect 4)
  randomTeleport() {
    const g = this.grid, h = this.hero; const opts = [];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (this.passable(x, y) && !this.unitAt(x, y) && !this.objAt(x, y) && (x !== h.x || y !== h.y)) opts.push([x, y]);
    if (!opts.length) return;
    const [x, y] = opts[Math.floor(Math.random() * opts.length)];
    h.x = x; h.y = y; h.wx = x * T + 50; h.wy = -(y * T + 50) - 20; h.path = null;
    this.reveal(x, y); this.burst(h, 2); Audio2.play('event-2-1'); this.ui.hud(this);
  }
  // item: havoc bomb (UseEffect 7) — 30% max HP to the current enemy
  havoc() {
    const m = this.fight?.mon; if (!m || !m.alive) return;
    const mhp = this.combat.stats(m).max_hp;
    this.combat.rawHurt(m, Math.max(1, Math.round(mhp * 0.3)), this.hero);   // TODO P1: item UseEffect 7 not reversed
    Audio2.play('powerful-1'); this.ui.enemy(m);
  }

  // ---------------------------------------------------------------- input
  onTap(sx, sy) {
    if (this.dead || !this.hero || this.busy) return;
    const w = this.gfx.screenToWorld(sx, sy);
    const tx = Math.floor(w.x / T), ty = Math.floor(-w.y / T);
    if (tx < 0 || ty < 0 || tx >= this.grid.w || ty >= this.grid.h) return;
    if (!this.revealed[this.idx(tx, ty)]) return;
    if (this.teleportMode) {
      this.teleportMode = false;
      const cost = +DB.skill.get(108001).ManaCost || 0;
      if (this.passable(tx, ty) && P.data.mp >= cost && !this.fight) {
        const h = this.hero; P.data.mp -= cost; h.x = tx; h.y = ty; h.wx = tx * T + 50; h.wy = -(ty * T + 50) - 20; h.path = null;
        this.reveal(tx, ty); this.burst(h, 2); Audio2.play('event-2-1'); this.ui.hud(this); return;
      }
    }
    const h = this.hero;
    const mon = this.unitAt(tx, ty) || this.unitAt(tx, Math.floor((-w.y + 40) / T)); // allow tapping a body that overlaps tile above
    if (this.fight) {
      if (mon && mon === this.fight.mon) return;
      // AttackBehavior::msg_C_ESCAPE_BATTLE: 2 s escape (the monster keeps hitting), then the monster fully recovers
      this.combat.escape();
      return;
    }
    if (mon) { this.goTo(mon.x, mon.y, { attack: mon }); return; }
    const obj = this.objAt(tx, ty);
    if (obj) { this.goTo(tx, ty, { use: obj }); return; }
    if (this.pass && tx === this.pass[0] && ty === this.pass[1]) { this.goTo(tx, ty, { stairs: true }); return; }
    if (!this.grid.isFloor(tx, ty)) return;
    this.goTo(tx, ty, {});
    this.addTapFx(tx, ty);
  }
  addTapFx(x, y) { this.fx.push({ kind: 'tap', x: x * T + 50, y: -(y * T + 50), t: 0, life: 0.4 }); }

  goTo(tx, ty, intent) {
    const h = this.hero;
    // tapping again while walking: keep going into the tile we are already stepping into, then re-path from there
    const step = h.path && h.path.length && !this.fight ? h.path[0] : null;
    if (step && (Math.abs(h.wx - (h.x * T + 50)) > 2 || Math.abs(h.wy - (-(h.y * T + 50) - 20)) > 2)) {
      const ox = h.x, oy = h.y; h.x = step[0]; h.y = step[1];
      h.path = null; this.goTo(tx, ty, intent);
      const rest = h.path; h.x = ox; h.y = oy;
      h.path = rest ? [step, ...rest] : [step];
      if (!rest) h.intent = null;
      return;
    }
    let path;
    const adjacentTarget = intent.attack || intent.use;
    if (adjacentTarget) {
      // path to a tile adjacent to target
      if (Math.abs(h.x - tx) + Math.abs(h.y - ty) === 1) path = [];
      else {
        let best = null;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ax = tx + dx, ay = ty + dy;
          if (!this.passable(ax, ay) && !(ax === h.x && ay === h.y)) continue;
          const p = findPath(this.grid, h.x, h.y, ax, ay, (x, y) => this.passable(x, y));
          if (p && (!best || p.length < best.length)) best = p;
        }
        path = best;
      }
    } else path = findPath(this.grid, h.x, h.y, tx, ty, (x, y) => this.passable(x, y) || (this.pass && x === this.pass[0] && y === this.pass[1]));
    if (!path) {
      // route through monsters: the hero will stop and fight whoever blocks the way
      const thru = (x, y) => this.grid.isFloor(x, y) && !this.objAt(x, y);
      const isStair = (x, y) => this.pass && x === this.pass[0] && y === this.pass[1];
      if (adjacentTarget) {
        let best = null;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ax = tx + dx, ay = ty + dy; if (!thru(ax, ay)) continue;
          const p = findPath(this.grid, h.x, h.y, ax, ay, (x, y) => thru(x, y));
          if (p && (!best || p.length < best.length)) best = p;
        }
        path = best;
      } else path = findPath(this.grid, h.x, h.y, tx, ty, (x, y) => thru(x, y) || isStair(x, y));
    }
    if (!path) { this.ui.toast('Không đi tới được'); return; }
    h.path = path; h.intent = intent; h.target = [tx, ty];
    if (!path.length) this.arrive();
  }

  arrive() {
    const h = this.hero; const it = h.intent || {}; h.intent = null;
    if (it.cb) { it.cb(); return; }
    if (it.attack && it.attack.alive) { this.face(h, it.attack.x, it.attack.y); this.startFight(it.attack); return; }
    if (it.use) { this.face(h, it.use.x, it.use.y); this.useObject(it.use); return; }
    if (it.stairs) { this.ui.confirm(`Lên tầng tiếp theo?`, () => this.nextFloor()); return; }
    this.heroIdle();
  }
  face(u, tx, ty) {
    if (tx > u.x) { u.dir = 3; u.flip = false; } else if (tx < u.x) { u.dir = 3; u.flip = true; }
    else if (ty < u.y) u.dir = 1; else u.dir = 2;
  }

  // ---------------------------------------------------------------- objects
  async useObject(o) {
    story('touch object', { name: o.name || '', param: o.param || 0, obj: o.type, col: o.x, row: o.y });
    if (o.script) return this.useScriptObject(o);
    if (o.open) {
      if (o.type >= 9 && o.type <= 14) this.ui.toast('Đã dùng rồi');
      return;
    }
    const art = OBJ_ART[o.type];
    o.open = true; o.t = 0;
    Audio2.play(art[2]);
    const p = P.data;
    const fx = o.x * T + 50, fy = -(o.y * T + 50);
    if (DESTROYED.has(o.type)) { this.blocked[this.idx(o.x, o.y)] = 0; }
    p.stats.chests = (p.stats.chests || 0) + 1;
    if (o.type === 4 || o.type === 5) Daily.progress(3, 1);
    if (o.type <= 3 || o.type === 29 || o.type === 6 || o.type === 7 || o.type === 8) Daily.progress(4, 1);
    if (o.type === 3 || o.type === 29) { const d = o.type === 29 ? 10 : this.rng.int(1, 3); p.diamond = (p.diamond || 0) + d; this.floatText(fx, fy + 140, `+${d} kim cương`, '#8fe3ff', 0.9); }
    if (art[3]) {
      const n = o.type === OBJ.GOLD_BOX ? 2 : o.type === OBJ.DIAMOND_BOX ? 3 : o.type === OBJ.BOSS_BOX ? 4 : 1;
      for (let i = 0; i < n; i++) this.dropFrom(this.row[art[3]], fx, fy);
      // boxes also give some gold
      if (o.type <= 3 || o.type === 29) this.giveGold(Math.round((DB.mstat[this.level * 10 + 1]?.Gold || 5) * (o.type * 2 + this.rng.int(1, 4))), fx, fy);
    }
    const s = stats();
    switch (o.type) {
      case 9: p.hp = s.max_hp; this.floatText(fx, fy, 'HP đầy!', '#ff7b7b'); break;
      case 10: p.mp = s.max_mp; this.floatText(fx, fy, 'MP đầy!', '#7bb4ff'); break;
      case 11: p.hp = s.max_hp; p.mp = s.max_mp; this.floatText(fx, fy, 'Hồi phục!', '#fff17b'); break;
      case 12: p.red = Math.min(this.g.maxPot('red'), p.red + 3); this.floatText(fx, fy, '+3 bình máu', '#ff7b7b'); break;
      case 13: p.blue = Math.min(this.g.maxPot('blue'), p.blue + 3); this.floatText(fx, fy, '+3 bình mana', '#7bb4ff'); break;
      case 14: p.red = Math.min(this.g.maxPot('red'), p.red + 2); p.blue = Math.min(this.g.maxPot('blue'), p.blue + 2); this.floatText(fx, fy, '+2 / +2 bình', '#fff17b'); break;
      case 40: if (o.diary) { P.data.diaries ||= []; if (!P.data.diaries.includes(o.diary)) P.data.diaries.push(o.diary); save(); this.ui.diary(o.diary, true); } break;
      case 15: this.ui.confirm('Dùng bia đá để trở về trại? (giữ lại đồ đã nhặt)', () => this.g.toCamp(true)); o.open = false; break;
      case 16: this.revealAll(); this.ui.toast(S('249') || 'Đã soi sáng bản đồ tầng này'); break;
    }
    this.ui.hud(this);
    this.heroIdle();
  }

  useScriptObject(o) {
    const art = OBJ_ART[o.type]; if (art?.[2]) Audio2.play(art[2]);
    const p = P.data, fx = o.x * T + 50, fy = -(o.y * T + 50);
    switch (o.type) {
      case 20: { // portal -> bonus map (RainbowID) then back to the next floor
        let target = +o.param || 0;
        if (!target) { const r = String(this.row.RainbowID || '').split(';').filter(Boolean).map(Number).filter(id => DB.map.has(id)); target = r.length ? r[Math.floor(Math.random() * r.length)] : 0; }
        if (target && DB.map.has(target)) this.ui.confirm('Bước vào cổng dịch chuyển?', () => { this.g.returnMap = +this.row.NextMap || this.mapId; this.g.enterTower(target); });
        break;
      }
      case 23: case 26: if (!o.open) { o.open = true; this.giveGold(Math.round((DB.mstat[this.level * 10 + 2]?.Gold || 20) * 5), fx, fy); } break;
      case 24: if (!o.open) { o.open = true; const e = Math.round((DB.mstat[this.level * 10 + 2]?.Exp || 50) * 3); const ups = addExp(e); this.floatText(fx, fy + 80, `+${e} EXP`, '#9cff6b'); if (ups) this.ui.levelUp(p.level); } break;
      case 25: if (!o.open) { o.open = true; this.dropFrom(this.row.TrinketBoxDrop || this.row.ArmorStandDrop, fx, fy); } break;
      case 19: if (!o.open) { o.open = true; for (const u of this.units) if (!u.isHero && u.alive && Math.abs(u.x - this.hero.x) + Math.abs(u.y - this.hero.y) <= 4) this.combat.rawHurt(u, u.hp, this.hero); } break;
      default: break;
    }
    this.ui.hud(this);
  }
  // ---------------------------------------------------------------- fights (native AttackBehavior in combat.js)
  startFight(mon) {
    if (this.fight && this.fight.mon === mon) return;
    if (this.combat.inBattle()) return;
    const h = this.hero;
    this.face(h, mon.x, mon.y);
    mon.flip = mon.x > h.x ? true : mon.x < h.x ? false : mon.flip;
    mon.aware = true;
    this.fight = { mon, time: 0 };
    h.path = null; h.dir = 3;
    this.ui.enemy(mon);
    story('battle begin', { mon_id: mon.id });
    this.combat.startBattle(mon);
  }
  // AttackBehavior::end -> notifyLeaveBattle
  onBattleEnd(mon, result) {
    const f = this.fight; this.fight = null;
    story('battle end', { result: result === 'win' ? 0 : result === 'die' ? 1 : 2, mon_id: mon?.id });
    this.ui.enemy(null);
    if (this.hero.alive) this.heroIdle(true);
    if (mon?.alive && mon.actor) { mon.actor.cur = null; mon.actor.play('stand-1-3', true); }
    this.ui.hud(this);
  }
  // kept for callers outside the battle flow
  endFight(result) { if (this.combat.inBattle()) this.combat.ab.end(); else if (this.fight) this.onBattleEnd(this.fight.mon, result); }
  // AttackBehavior state 7: the attacker moves into the dead target's tile, then the battle ends (win)
  walkInto(att, tgt, cb) {
    const h = this.hero;
    if (att !== h || !this.grid.isFloor(tgt.x, tgt.y) || this.objAt(tgt.x, tgt.y)) { cb(); return; }
    h.path = [[tgt.x, tgt.y]]; h.intent = { cb };
  }
  // 100 ATK SPD = one attack / 2 s (attack animations are 2 s long and play at fin_atk_speed * act_rate / 100)
  attackInterval(st) { const v = st.fin_atk_speed ?? 100; return v > 0 ? 2.0 / (v / 100) : Infinity; }
  idleUnit(u) { if (u.isHero) { if (u.alive) this.heroIdle(true); } else if (u.alive && u.actor) { u.actor.cur = null; u.actor.play('stand-1-3', true); } }
  burst(u, elem = 0) {
    const col = [[1, 1, 1], [1, .55, .2], [.5, .85, 1], [.85, .5, 1], [.55, .9, .35]][elem] || [1, 1, 1];
    this.fx.push({ kind: 'burst', x: u.wx, y: u.wy + 70, t: 0, life: 0.5, col });
  }
  // MyPlayer::onKillUnit (SOURCE-EXACT exp / gold / return power; drops still use the web roller -> TODO P1)
  rewardKill(m, kmode = 0) {
    const p = P.data, h = this.hero, f = U.fin(h);
    p.stats.kills = (p.stats.kills || 0) + 1;
    const expP = (f.exp_bonus + 100) * (m.st.exp | 0), goldP = (f.gold_bonus + 100) * (m.st.gold | 0);
    const exp = Math.trunc(expP / 100), gold = Math.trunc(goldP / 100);
    let ups = 0;
    if (99 < expP) { ups = addExp(exp); this.floatText(m.wx, m.wy + 150, `+${exp} EXP`, '#9cff6b', 0.9); }
    if (99 < goldP) this.giveGold(gold, m.wx, m.wy);
    // drops: TODO P1 (MapTemplate::getMonsterDropWithQuality + GameController::calItemIDWithDropSet + own/first drops)
    const field = m.rank === 1 ? 'NormalDrop' : m.rank === 2 ? 'EliteDrop' : m.rank === 3 ? 'UniqueDrop' : 'BossDrop';
    this.dropFrom(this.row[field] || this.row.NormalDrop, m.wx, m.wy);
    // return power: rank 2..4 -> +3 / +6 / +10, else +1; capped at 100
    p.power = Math.min(100, (p.power || 0) + (({ 2: 3, 3: 6, 4: 10 })[m.rank] || 1));
    Daily.progress(8, 1); if (m.rank >= 2) Daily.progress(7, 1);
    if (this.pet) { const pd = p.pets?.[this.pet.id]; if (pd) pd.exp = (pd.exp || 0) + Math.max(1, Math.round(m.st.exp * 0.5)); }   // TODO P1 (pet exp)
    if (ups) { this.ui.levelUp(p.level); Audio2.play('levelup-1'); this.refreshHeroLook(); story('level up', {}); bumpStats(); }
    this.ui.hud(this);
    save();
  }
  // Monster::die -> OnDead script, Unit::die (state dead), GameMap::removeMonster
  monsterDie(m) {
    m.alive = false; m.removed = true; m.hp = 0; m.dieT = 0;
    Audio2.play(m.rec.DeathSound);
    this.ui.enemy(null);
  }
  dropFrom(field, wx, wy) {
    if (!field) return;
    const luck = stats().luck || 0;   // native: no client-side hard-mode LUC bonus (removed web +100)
    const dropId = rollDropSet(field, luck);
    if (!dropId) return;
    const p = P.data, s = stats();
    if (dropId === 1) { // HP/MP balls
      const id = resolveDrop(1);
      if (id === 999997) { const v = Math.round(s.max_hp * 0.15); p.hp = Math.min(s.max_hp, p.hp + v); this.floatText(wx, wy + 60, `+${v} HP`, '#ff8080'); }
      else { const v = Math.round(s.max_mp * 0.15); p.mp = Math.min(s.max_mp, p.mp + v); this.floatText(wx, wy + 60, `+${v} MP`, '#80b0ff'); }
      return;
    }
    if (dropId === 2) { p.hp = s.max_hp; p.mp = s.max_mp; this.floatText(wx, wy + 60, 'Hồi phục!', '#e0a0ff'); return; }
    const itemId = resolveDrop(dropId);
    if (!itemId) return;
    const it = makeAny(itemId, this.level);
    if (!it) return;
    if (addItem(it)) {
      it.isNew = true;
      if (it.eq && it.q >= 2) Daily.progress(5, 1);
      this.ui.loot(it);
      story('obtain item', { item_id: it.id, item_type: +(itemRecord(it)?.Type || 0) });
      Audio2.play('itemsound-' + (1 + (Math.random() * 6 | 0)), 0.6);
    } else this.ui.toast('Túi đồ đã đầy!');
  }
  giveGold(n, wx, wy) {
    if (!n || n <= 0) return;
    P.data.gold += n;
    Daily.progress(6, n);
    this.floatText(wx + 30, wy + 100, `+${n} vàng`, '#ffd34d', 0.85);
  }
  heroDie() {
    const h = this.hero; if (!h.alive) return; h.alive = false; this.dead = true;
    if (this.fight && !this.combat.inBattle()) this.onBattleEnd(this.fight.mon, 'die');
    h.actor.cur = null; h.actor.play('death', false, () => h.actor.play('deathloop', true));
    Audio2.playBGM('death-1');
    P.data.stats.deaths = (P.data.stats.deaths || 0) + 1;
    setTimeout(() => this.ui.dead(this), 1400);
  }

  // adventure skills (group 14): Telekinesis / Teleport / Foresight
  useAdventure(id) {
    const r = DB.skill.get(id); const cost = +r.ManaCost || 0; const p = P.data;
    if (this.fight) { this.ui.toast(S('229') || 'Đang chiến đấu'); return; }
    if (p.mp < cost) { this.ui.toast('Không đủ MP'); return; }
    if (id === 108001) { this.teleportMode = true; this.ui.toast('Chạm vào ô đã khám phá để dịch chuyển'); return; }
    p.mp -= cost;
    if (id === 108002) { this.revealAll(); this.ui.toast(S('249') || 'Bản đồ đã được soi sáng'); }
    if (id === 108000) {
      const h = this.hero; let n = 0;
      for (const o of this.objects) if (!o.open && o.type !== 15 && this.revealed[this.idx(o.x, o.y)] && Math.abs(o.x - h.x) + Math.abs(o.y - h.y) <= 6) { this.useObject(o); n++; }
      if (!n) { p.mp += cost; this.ui.toast('Không có rương nào trong tầm nhìn'); }
    }
    Audio2.play('event-1-3');
    this.ui.hud(this);
  }
  // potions
  usePotion(kind) {
    if (!this.hero?.alive) return;
    const code = this.combat.useBottle(kind === 'red' ? 0 : 1);   // GameController::feedbackUseBottle
    if (code === 0xcc) { this.ui.toast(S('204')); return; }
    if (code === 0xca) { this.ui.toast(S('202')); return; }
    if (code === 0xcb) { this.ui.toast(S('205')); return; }
    Audio2.play('ui-021');
    this.ui.hud(this);
  }
  // MyPlayer::onArriveFloor: forEachEffect(onArriveFloor) + item buffs cleared on MapConType 0/1/5
  arriveFloor() {
    const h = this.hero; if (!h) return;
    U.forEachEffect(h, e => { e.onArriveFloor(h, this.floor, this.mapId); });
    const c = +this.row.Content; if (c === 0 || c === 1 || c === 5) P.data.itemBuffs = [];
  }

  async nextFloor() {
    let next = Modes.nextOf(this.row);
    if ((!next || !DB.map.has(next)) && this.g.returnMap) { next = this.g.returnMap; this.g.returnMap = null; }
    if (!next || !DB.map.has(next)) { this.ui.toast('Bạn đã tới đỉnh tháp!'); return; }
    this.busy = true;
    Audio2.play('event-1-2');
    Daily.progress(2, 1);
    const petExp = this.pet?.floorExp() || 0;
    await this.g.enterTower(next);
    if (petExp) { const ups = addExp(petExp); this.ui.toast(`Thú cưng tò mò: +${petExp} EXP`); if (ups) this.ui.levelUp(P.data.level); }
  }

  floatText(wx, wy, text, color, scale = 1) { this.ui.float(this, wx, wy, text, color, scale); }

  // ---------------------------------------------------------------- update / render
  animateOnly(dt) { for (const u of this.units) if (u.actor && (u.alive || u.isHero)) u.actor.update(dt); this.pet?.unit.actor?.update(dt); }
  update(dt) {
    this.time += dt;
    const h = this.hero; if (!h) return;
    this.combat.update(dt);
    Ctx.frame++;
    // hero movement
    if (!h.path || !h.path.length) h.carry = 0;
    if (h.path && h.path.length && h.alive) {
      const [nx, ny] = h.path[0];
      // a monster stepped into the way?
      if (!this.passable(nx, ny) && !(this.pass && nx === this.pass[0] && ny === this.pass[1])) {
        const m = this.unitAt(nx, ny);
        h.path = null;
        if (m) { this.startFight(m); }
        else this.heroIdle();
      } else {
        const tx = nx * T + 50, ty = -(ny * T + 50) - 20;
        const dx = tx - h.wx, dy = ty - h.wy; const d = Math.hypot(dx, dy);
        const sp = 330 * dt + (h.carry || 0); h.carry = 0;
        if (nx !== h.x) { h.dir = 3; h.flip = nx < h.x; } else h.dir = ny < h.y ? 1 : 2;
        h.actor.play('run-1-' + h.dir, true);
        if (d <= sp) {
          h.wx = tx; h.wy = ty; h.x = nx; h.y = ny; h.path.shift();
          h.carry = Math.min(sp - d, 40);
          this.reveal(h.x, h.y);
          if (this.pass && !this.nearPassFired && Math.abs(h.x - this.pass[0]) + Math.abs(h.y - this.pass[1]) <= 2) { this.nearPassFired = true; story('near pass', {}); }
          // ambush: an aware monster adjacent starts a fight
          const adj = this.units.find(u => u.alive && !u.isHero && u.seen && Math.abs(u.x - h.x) + Math.abs(u.y - h.y) === 1 && (u.rank >= 2 || u === h.intent?.attack || Math.random() < 0.5));
          if (adj && !h.intent?.cb && !this.fight && !(h.intent && h.intent.attack === adj && h.path.length)) {
            if (h.intent?.attack !== adj || !h.path.length) { h.path = null; h.intent = null; this.startFight(adj); }
          }
          if (h.path && !h.path.length) { h.path = null; this.arrive(); }
          this.ui.hud(this);
        } else { h.wx += dx / d * sp; h.wy += dy / d * sp; }
      }
    }
    if (this.fight) this.fight.time += dt;
    this.traps.update(dt);
    if (this.pet) { this.pet.follow(h, dt); this.pet.update(dt, this.fight); this.pet.unit.actor?.update(dt); }
    for (const u of this.units) {
      if (u.hitT) u.hitT = Math.max(0, u.hitT - dt);
      if (!u.alive && !u.isHero) { u.dieT += dt; u.alpha = Math.max(0, 1 - u.dieT / 0.8); }
      if (u.actor && (u.alive || u.alpha > 0 || u.isHero)) u.actor.update(U.isAbnormal(u, 2) ? 0 : dt);   // froze: animation paused
    }
    this.units = this.units.filter(u => u.isHero || u.alive || u.alpha > 0);
    for (const o of this.objects) if (o.open) o.t = (o.t || 0) + dt;
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter(f => f.t < f.life);
    // camera
    const k = Math.min(1, dt * 6);
    const fy = this.g.uiFocus ? 75 - this.g.uiFocus.y : 40; // character screen: hero stands in the middle of the equipment ring
    this.camX += (h.wx - this.camX) * k; this.camY += (h.wy + fy - this.camY) * k;
  }

  render() {
    const gfx = this.gfx, g = this.grid;
    const viewW = this.g.viewW, viewH = this.g.viewH;
    gfx.setView(Math.round(this.camX), Math.round(this.camY), viewW, viewH);
    gfx.begin([0.02, 0.02, 0.03]);
    const vx0 = this.camX - viewW / 2, vx1 = this.camX + viewW / 2, vy0 = this.camY - viewH / 2, vy1 = this.camY + viewH / 2;
    if (this.bgFx) { // sky behind the tower (screen space, slowly drifting)
      const s = this.bgFx.seq.normal || Object.values(this.bgFx.seq)[0];
      const k = Math.max(viewW / 750, viewH / 1334);
      drawCCB(gfx, this.bgFx, { sid: s[0], t: s[1] > 0 ? this.time % s[1] : 0, root: [k, 0, 0, k, this.camX, this.camY], em: this.fxEm.bg, now: this.time });
    }
    const x0 = Math.max(0, Math.floor((this.camX - viewW / 2) / T) - 1), x1 = Math.min(g.w - 1, Math.ceil((this.camX + viewW / 2) / T) + 1);
    const y0 = Math.max(0, Math.floor((-this.camY - viewH / 2) / T) - 1), y1 = Math.min(g.h - 1, Math.ceil((-this.camY + viewH / 2) / T) + 2);
    const sheet = 'map/tile-' + this.tileset, pre = this.tileset + '-';
    // floors
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!g.isFloor(x, y) || !this.revealed[this.idx(x, y)]) continue;
      const fs = floorStyle(g, x, y);
      if (fs) gfx.drawFrame(sheet, pre + fs, x * T, -(y + 1) * T, { ax: 0, ay: 0 });
    }
    this.orna?.drawTiles(gfx);
    // exit stairs
    if (this.pass && this.revealed[this.idx(this.pass[0], this.pass[1])]) {
      gfx.drawTex(gfx.tex('map/floor'), this.pass[0] * T + 50, -(this.pass[1] * T + 50));
    }
    // fx under units
    for (const f of this.fx) if (f.kind === 'tap') {
      const k = f.t / f.life; gfx.drawRect(f.x - 40, f.y - 40, 80, 80, rgba(1, 1, 1, 0.25 * (1 - k)));
    }
    // rows: walls, objects, units
    const unitsByRow = new Map();
    for (const u of this.units) { const r = Math.round(-(u.wy + 30) / T - 0.5); if (!unitsByRow.has(r)) unitsByRow.set(r, []); unitsByRow.get(r).push(u); }
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (g.get(x, y) !== WALL) continue;
        // only draw walls next to revealed floor
        if (!this.wallVisible(x, y)) continue;
        const ws = wallStyle(g, x, y);
        if (ws) gfx.drawFrame(sheet, pre + ws, x * T, -y * T, { ax: 0, ay: 1 });
      }
      this.orna?.drawRow(gfx, y);
      for (const f of this.flags || []) if (f.y === y) this.drawFlag(f);
      if (this.traps.list.length) this.traps.draw(gfx, this.time, this.revealed, (a, b) => this.idx(a, b), y);
      for (const o of this.objects) {
        if (o.y !== y || !this.revealed[this.idx(o.x, o.y)]) continue;
        this.drawObject(o);
      }
      if (this.pet && Math.round(-(this.pet.unit.wy + 30) / T - 0.5) === y) this.drawUnit(this.pet.unit);
      const us = unitsByRow.get(y); if (us) { us.sort((a, b) => a.wx - b.wx); for (const u of us) this.drawUnit(u); }
    }
    for (const f of this.fx) if (f.kind === 'burst') {
      const k = f.t / f.life;
      const c = rgba(f.col[0], f.col[1], f.col[2], 0.8 * (1 - k));
      gfx.drawTex(gfx.tex('ui/effect-1-2-6'), f.x, f.y, { scale: 0.3 + k * 0.7, color: c });
      gfx.drawTex(gfx.tex('ui/effect-1-4-1'), f.x, f.y, { scale: 1.5 + k, color: rgba(1, 1, 1, 1 - k) });
    }
    // unexplored tiles are simply not drawn: the background shows through, like the original
    // lighting layer around the hero (mist on the first floors, dark vignette + coloured glow deeper in the tower)
    if (this.maskFx) {
      const s = this.maskFx.seq.normal || Object.values(this.maskFx.seq)[0];
      drawCCB(gfx, this.maskFx, { sid: s[0], t: s[1] > 0 ? this.time % s[1] : 0, root: [1, 0, 0, 1, this.hero.wx, this.hero.wy + 40], em: this.fxEm.mask, now: this.time, cover: { x0: vx0 - 10, x1: vx1 + 10, y0: vy0 - 10, y1: vy1 + 10 } });
    }
    gfx.end();
  }
  wallVisible(x, y) {
    const g = this.grid;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= g.w || yy >= g.h) continue;
      if (g.isFloor(xx, yy) && this.revealed[this.idx(xx, yy)]) return true;
    }
    return false;
  }
  // signal flags (item UseEffect 13): a coloured marker the player leaves on the floor
  placeFlag(color) {
    const h = this.hero; this.flags ||= [];
    this.flags = this.flags.filter(f => !(f.x === h.x && f.y === h.y));
    this.flags.push({ x: h.x, y: h.y, color });
    Audio2.play('ui-003');
  }
  drawFlag(f) {
    const C = FLAG_COLORS[f.color] || FLAG_COLORS[1];
    const x = f.x * T + 50, y = -(f.y * T + 50) - 30, sw = Math.sin(this.time * 3 + f.x) * 4;
    this.gfx.drawRect(x - 3, y, 6, 70, rgba(0.35, 0.22, 0.1, 1));
    this.gfx.drawRect(x + 3, y + 40 + sw * 0.2, 34 + sw, 26, rgba(C[0], C[1], C[2], 1));
    this.gfx.drawRect(x - 10, y - 4, 20, 8, rgba(0, 0, 0, 0.35));
  }
  drawObject(o) {
    const art = OBJ_ART[o.type]; const gfx = this.gfx;
    if (o.actor) { const sk = o.actor.skeleton; o.actor.update(1 / 60); sk.x = o.x * T + 50; sk.y = -(o.y * T + 50) - 30; sk.updateWorldTransform(); gfx.drawSkeleton(sk); return; }
    if (o.type === 20) { const k = 1 + Math.sin(this.time * 4) * 0.06; gfx.drawFrame('ui/uip-3', 'object-9-3', o.x * T + 50, -(o.y * T + 50) - 35, { ax: 0.5, ay: 0 }); gfx.drawFrame('ui/uip-3', 'object-9-4', o.x * T + 50, -(o.y * T + 50) + 5, { scale: k, color: rgba(0.6, 0.9, 1, 0.9) }); return; }
    const x = o.x * T + 50, y = -(o.y * T + 50) - 35;
    let name = o.open ? art[1] : art[0];
    let color = SPRING_TINT[o.type] || null;
    if (o.open && o.type >= 9 && o.type <= 14) color = rgba(0.45, 0.45, 0.45, 1);
    if (o.type === 40 && o.open) return;
    if (o.open && DESTROYED.has(o.type)) { const a = Math.max(0, 1 - (o.t || 0) / 1.2); if (a <= 0) return; color = rgba(1, 1, 1, a); }
    let scale = 1;
    if (!o.open && o.type <= 3) scale = 1 + Math.sin(this.time * 3 + o.x) * 0.02;
    gfx.drawFrame('ui/uip-3', name, x, y, { ax: 0.5, ay: 0, color, scale });
  }
  drawUnit(u) {
    if (!u.actor) return;
    if (!u.isHero && !u.isPet && !this.revealed[this.idx(u.x, u.y)]) return;
    const sk = u.actor.skeleton;
    sk.x = u.wx; sk.y = u.wy;
    const base = u.baseScale || 1;
    sk.scaleX = (u.flip ? 1 : -1) * base; sk.scaleY = base; // all spine art (hero, pets, monsters) faces left by default
    if (!u.isHero && !u.isPet) sk.scaleX = (u.flip ? 1 : -1) * base; // monsters art faces left by default
    if (u.isPet) { sk.scaleX = (u.flip ? 1 : -1) * base; const c0 = sk.color; c0.set(1, 1, 1, 1); sk.updateWorldTransform(); this.gfx.drawSkeleton(sk); return; }
    const c = sk.color;
    const tintR = u.rank === 3 ? 1.2 : u.rank === 2 ? 0.8 : 1, tintG = u.rank === 3 ? 1.05 : u.rank === 2 ? 0.9 : 1, tintB = u.rank === 3 ? 0.6 : u.rank === 2 ? 1.3 : 1;
    const flash = u.hitT ? 2 : 1;
    if (u.isHero) c.set(flash, u.hitT ? 0.6 : 1, u.hitT ? 0.6 : 1, u.alpha ?? 1);
    else c.set(tintR * flash, tintG * flash, tintB * flash, u.alpha ?? 1);
    sk.updateWorldTransform();
    this.gfx.drawSkeleton(sk);
  }
}
