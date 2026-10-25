// Map ornaments (ornament.csv + the original CocosBuilder tower/*.ccbi scenes, converted to data/orna.json).
// Placement: each ornament lists tile patterns ("Position") made of wall-style codes (getWallStyle),
// 1 = floor, 33 = the exit stairs. Each match is taken with probability Percent.
import { DB } from '../engine/db.js';
import { wallStyle } from './mapgen.js';

const T = 100;
let ORNA = null;
export function ornaFor(map) { if (!ORNA) return []; const n = new Set(); for (const r of DB.ornamentRows) if (+r.Map === +map) String(r.Name).split('/').forEach(x => n.add(x)); return [...n].map(x => ORNA[x]).filter(Boolean); }
export async function loadOrna() { if (!ORNA) ORNA = await fetch('data/orna.json').then(r => r.json()); return ORNA; }

const parsePat = s => String(s).split(';').map(r => r.split(',').map(c => c === '' ? null : +c));

// ---- ccbi evaluation
function lerp(a, b, k) { return a + (b - a) * k; }
function sample(kfs, t, step) {
  if (t <= kfs[0][0] || kfs.length === 1) return kfs[0][1];
  for (let i = 1; i < kfs.length; i++) {
    const [t1, v1] = kfs[i];
    if (t <= t1) {
      const [t0, v0, e0] = kfs[i - 1];
      if (step || e0 === 0) return v0;
      const k = (t - t0) / Math.max(1e-6, t1 - t0);
      if (Array.isArray(v0)) return v0.map((x, j) => lerp(x, v1[j], k));
      return lerp(v0, v1, k);
    }
  }
  return kfs[kfs.length - 1][1];
}
const STEP = { visible: 1, displayFrame: 1 };
function prop(n, sid, name, t, def) {
  const a = n.a?.[sid]?.[name];
  if (a) return sample(a, t, STEP[name]);
  const v = n.p[name];
  return v === undefined ? def : v;
}
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];

class Emitter {
  constructor(p) { this.p = p; this.list = []; this.acc = 0; this.age = 0; }
  update(dt) {
    const p = this.p, r = (v) => Array.isArray(v) ? v[0] + (v[1] || 0) * (Math.random() * 2 - 1) : (v || 0);
    this.age += dt;
    const dur = Array.isArray(p.duration) ? p.duration[0] : p.duration;
    const rate = Array.isArray(p.emissionRate) ? p.emissionRate[0] : (p.emissionRate || 10);
    const max = Math.min(60, p.totalParticles || 30);
    if (dur < 0 || this.age < dur || dur === undefined) {
      this.acc += rate * dt;
      while (this.acc >= 1 && this.list.length < max) {
        this.acc -= 1;
        const ang = r(p.angle) * Math.PI / 180, sp = r(p.speed);
        const sc = p.startColor || [1, 1, 1, 1, 0, 0, 0, 0], ec = p.endColor || sc;
        const cv = (c, i) => Math.max(0, Math.min(1, c[i] + (c[i + 4] || 0) * (Math.random() * 2 - 1)));
        this.list.push({ x: (p.posVar?.[0] || 0) * (Math.random() * 2 - 1), y: (p.posVar?.[1] || 0) * (Math.random() * 2 - 1), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          life: Math.max(0.05, r(p.life)), t: 0, s0: Math.max(0, r(p.startSize)), s1: (p.endSize?.[0] ?? -1) < 0 ? null : Math.max(0, r(p.endSize)),
          c0: [0, 1, 2, 3].map(i => cv(sc, i)), c1: [0, 1, 2, 3].map(i => cv(ec, i)) });
      }
      if (this.acc > 1) this.acc = 1;
    }
    const g = p.gravity || [0, 0];
    for (const q of this.list) { q.t += dt; q.vx += g[0] * dt; q.vy += g[1] * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    this.list = this.list.filter(q => q.t < q.life);
  }
}

export class Ornaments {
  constructor(tower) { this.t = tower; this.items = []; }
  get time() { return this.t.time || 0; }
  build() {
    if (!ORNA) return;
    const t = this.t, g = t.grid, rng = t.rng;
    const map = +t.tileset;
    const rows = DB.ornamentRows.filter(r => +r.Map === map);
    const code = (x, y) => {
      if (x < 0 || y < 0 || x >= g.w || y >= g.h) return -1;
      if (t.pass && x === t.pass[0] && y === t.pass[1]) return 33;
      if (g.isFloor(x, y)) return 1;
      return wallStyle(g, x, y);
    };
    const codes = new Int16Array(g.w * g.h);
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) codes[x + y * g.w] = code(x, y);
    const at = (x, y) => (x < 0 || y < 0 || x >= g.w || y >= g.h) ? -1 : codes[x + y * g.w];
    const used = { tile: new Uint8Array(g.w * g.h), unit: new Uint8Array(g.w * g.h) };
    const busy = (x, y) => t.objAt(x, y) || t.unitAt?.(x, y) || (t.born && x === t.born[0] && y === t.born[1]);
    // larger patterns first
    const defs = rows.map(r => {
      const layers = String(r.Layer).split('/'), names = String(r.Name).split('/'), anims = String(r.Animations).split('/');
      const pats = String(r.Position).split('/').filter(s => s !== '').map(parsePat);
      return { r, layers, names, anims, pats, area: Math.max(...pats.map(p => p.length * p[0].length)) };
    }).filter(d => d.names.every(n => ORNA[n])).sort((a, b) => b.area - a.area);
    for (const d of defs) {
      const pct = (+d.r.Percent || 0) / 100;
      const isTile = d.layers.every(l => l === 'tile');
      const occ = isTile ? used.tile : used.unit;
      for (const pat of d.pats) {
        const H = pat.length, W = pat[0].length;
        for (let ay = H - 1; ay < g.h; ay++) for (let ax = 0; ax <= g.w - W; ax++) {
          // pattern rows are listed bottom -> top (Cocos y-up), anchor = bottom-left cell
          let ok = true;
          for (let i = 0; i < H && ok; i++) for (let j = 0; j < W && ok; j++) {
            const want = pat[i][j]; if (want === null) continue;
            const x = ax + j, y = ay - i;
            const c = at(x, y);
            if (c !== want || occ[x + y * g.w]) ok = false;
            else if (want === 1 && !isTile && busy(x, y)) ok = false;
          }
          if (!ok || rng.next() >= pct) continue;
          for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) if (pat[i][j] !== null) occ[ax + j + (ay - i) * g.w] = 1;
          const seqs = d.anims.map(a => a.split(';'));
          const pickIdx = Math.floor(rng.next() * seqs[0].length);
          d.layers.forEach((layer, li) => {
            const name = d.names[li] || d.names[0];
            const list = seqs[li] || seqs[0];
            const seq = list[Math.min(pickIdx, list.length - 1)];
            const o = ORNA[name]; const s = o.seq[seq]; if (!s) return;
            this.items.push({ layer, name, sid: String(s[0]), seq: s, x: ax, y: ay, w: W, h: H, t0: rng.next() * 3, em: new Map() });
          });
        }
      }
    }
    this.byRow = new Map();
    for (const it of this.items) if (it.layer !== 'tile') { if (!this.byRow.has(it.y)) this.byRow.set(it.y, []); this.byRow.get(it.y).push(it); }
    this.tiles = this.items.filter(it => it.layer === 'tile');
  }
  sheets() {
    const s = new Set(), tex = new Set();
    for (const name of new Set(this.items.map(i => i.name))) { const a = ccbAssets(ORNA[name]); a.sheets.forEach(x => s.add(x)); a.tex.forEach(x => tex.add(x)); }
    return { sheets: [...s].filter(k => DB.frames[k]), tex: [...tex] };
  }
  visible(it) {
    const t = this.t;
    for (let i = 0; i < it.h; i++) for (let j = 0; j < it.w; j++) { const x = it.x + j, y = it.y - i; if (x >= 0 && y >= 0 && x < t.grid.w && y < t.grid.h && (t.revealed[t.idx(x, y)] || t.wallVisible(x, y))) return true; }
    return false;
  }
  drawTiles(gfx) { for (const it of this.tiles) if (this.visible(it)) this.drawItem(gfx, it); }
  drawRow(gfx, y) { const l = this.byRow?.get(y); if (l) for (const it of l) if (this.visible(it)) this.drawItem(gfx, it); }
  drawItem(gfx, it) {
    const [sid, dur, chain] = it.seq;
    let t = this.time + it.t0;
    if (chain === sid) t = dur > 0 ? t % dur : 0; else t = Math.min(t, dur);
    drawCCB(gfx, ORNA[it.name], { sid: it.sid, t, root: [1, 0, 0, 1, it.x * T + 50, -(it.y + 1) * T], em: it.em, now: this.time, tileset: this.t.tileset });
  }
}

// ---- generic CocosBuilder scene renderer (ornaments, tower background, tower lighting mask)
// opts: { sid, t, root:[a,b,c,d,tx,ty], em:Map (particle emitters), now, tileset, cover:{x0,y0,x1,y1} }
export function drawCCB(gfx, def, o) {
  const t = o.t, sidS = String(o.sid), tileset = o.tileset;
  const node = (n, M, alpha) => {
    if (!prop(n, sidS, 'visible', t, true)) return;
    const pos = prop(n, sidS, 'position', t, [0, 0]);
    const sc = prop(n, sidS, 'scale', t, [1, 1]);
    const rot = prop(n, sidS, 'rotation', t, 0) * Math.PI / 180;
    const op = prop(n, sidS, 'opacity', t, 255) / 255 * alpha;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const L = [cs * sc[0], -sn * sc[0], sn * sc[1], cs * sc[1], pos[0], pos[1]]; // cocos rotation is clockwise
    const W = mul(M, L); let childM = W;
    if (n.c === 'CCSprite') {
      const f = prop(n, sidS, 'displayFrame', t, null);
      if (f) {
        let [sheet, name] = f;
        const col = prop(n, sidS, 'color', t, [255, 255, 255]);
        const color = new spine.Color(col[0] / 255, col[1] / 255, col[2] / 255, op);
        const bf = n.p.blendFunc; const add = bf && bf[1] === 1;
        const ap = n.p.anchorPoint || [0.5, 0.5];
        if (sheet === '') { // single texture
          const tex = gfx.tex(name);
          if (tex) {
            const img = tex.getImage(), w = img.width, hgt = img.height;
            const A = mul(W, [1, 0, 0, 1, -ap[0] * w, -ap[1] * hgt]); childM = A;
            if (add) gfx.setAdditive(true);
            gfx.drawTexM(tex, A, color);
            if (add) gfx.setAdditive(false);
            // lighting masks are finite squares: keep the darkness going past their edges on tall screens
            if (o.cover && !add && /towermasker/.test(name) && op > 0.5) {
              const xs = [0, w].map(x => A[0] * x + A[4]), ys = [0, hgt].map(y => A[3] * y + A[5]);
              const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), C = o.cover;
              if (y1 < C.y1) gfx.drawRect(C.x0, y1, C.x1 - C.x0, C.y1 - y1, color);
              if (y0 > C.y0) gfx.drawRect(C.x0, C.y0, C.x1 - C.x0, y0 - C.y0, color);
              if (x0 > C.x0) gfx.drawRect(C.x0, y0, x0 - C.x0, y1 - y0, color);
              if (x1 < C.x1) gfx.drawRect(x1, y0, C.x1 - x1, y1 - y0, color);
            }
          }
        } else {
          if (sheet.startsWith('map/tile-')) { const pre = name.split('-')[0]; if (pre === '1' && tileset && tileset !== '1') { sheet = 'map/tile-' + tileset; name = tileset + name.slice(1); } }
          const fr = gfx.frame(sheet, name);
          if (fr) {
            const A = mul(W, [1, 0, 0, 1, -ap[0] * fr.f[6], -ap[1] * fr.f[7]]); childM = A;
            if (add) gfx.setAdditive(true);
            gfx.drawFrameM(sheet, name, A, color);
            if (add) gfx.setAdditive(false);
          }
        }
      }
    } else if (n.c === 'MyParticle' && o.em) {
      let em = o.em.get(n); if (!em) { em = new Emitter(n.p); o.em.set(n, em); em.last = o.now; for (let k = 0; k < 20; k++) em.update(0.1); }
      const dt = Math.min(0.1, o.now - em.last); em.last = o.now; if (dt > 0) em.update(dt);
      const tex = gfx.tex(n.p.texture);
      if (tex) {
        const img = tex.getImage(); const add = !n.p.blendFunc || n.p.blendFunc[1] === 1;
        if (add) gfx.setAdditive(true);
        for (const q of em.list) {
          const k = q.t / q.life, size = q.s1 == null ? q.s0 : lerp(q.s0, q.s1, k);
          const c = [0, 1, 2, 3].map(i => lerp(q.c0[i], q.c1[i], k));
          const wx = W[0] * q.x + W[2] * q.y + W[4], wy = W[1] * q.x + W[3] * q.y + W[5];
          gfx.drawTex(tex, wx, wy, { w: size, h: size * img.height / img.width, color: new spine.Color(c[0], c[1], c[2], c[3] * alpha) });
        }
        if (add) gfx.setAdditive(false);
      }
    }
    for (const k of n.k || []) node(k, childM, op);
  };
  node(def.root, o.root, 1);
}
// textures / sheets a scene needs
export function ccbAssets(def) {
  const sheets = new Set(), tex = new Set();
  const walk = n => {
    const add = f => { if (!f) return; if (f[0] === '') tex.add(f[1]); else sheets.add(f[0]); };
    add(n.p.displayFrame); for (const a of Object.values(n.a || {})) for (const kf of a.displayFrame || []) add(kf[1]);
    if (n.p.texture) tex.add(n.p.texture); (n.k || []).forEach(walk);
  };
  walk(def.root);
  return { sheets: [...sheets], tex: [...tex] };
}
let TFX = null;
export async function loadTowerFx() { if (!TFX) TFX = await fetch('data/towerfx.json').then(r => r.json()); return TFX; }
export const towerFx = name => TFX?.[name] || null;
