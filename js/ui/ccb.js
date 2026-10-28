// CocosBuilder (.ccbi -> data/ccb/*.json) UI renderer: rebuilds the original game's screens as DOM,
// in the original 750x1334 design space (y-up like Cocos). Nodes keep the names the original code used
// (e.g. "hp_value", "equip_root_3", "close_btn") so screens can fill them with live data.
import { DB, S, richText } from '../engine/db.js';
import { Audio2 } from '../engine/audio.js';

const JS = {}; let SIZES = {};
async function fetchDef(path) {
  if (!JS[path]) JS[path] = fetch('data/ccb/' + path + '.json').then(r => { if (!r.ok) throw new Error('ccb ' + path); return r.json(); });
  return JS[path];
}
// load a scene and every nested CCBFile it uses
export async function loadCCB(path) {
  if (!loadCCB.sizes) loadCCB.sizes = fetch('data/ccb/imgsize.json').then(r => r.json()).then(s => (SIZES = s));
  await loadCCB.sizes;
  const def = await fetchDef(path);
  const subs = new Set();
  const walk = n => { if (n.c === 'CCBFile' && n.p.ccbFile) subs.add(n.p.ccbFile); (n.k || []).forEach(walk); };
  walk(def.root);
  await Promise.all([...subs].map(s => loadCCB(s).catch(() => null)));
  return def;
}

// ---------------------------------------------------------------- helpers
const imgUrl = p => `assets/img/${p}.webp`;
let svgDefs = null; const tints = new Set();
function tintFilter(c) {
  const key = c.map(x => x | 0).join('_');
  if (key === '255_255_255') return '';
  if (!svgDefs) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.style.position = 'absolute';
    svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); svg.append(svgDefs); document.body.append(svg);
  }
  const id = 'tint_' + key;
  if (!tints.has(id)) {
    tints.add(id);
    const f = document.createElementNS('http://www.w3.org/2000/svg', 'filter'); f.setAttribute('id', id); f.setAttribute('color-interpolation-filters', 'sRGB');
    const m = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix'); m.setAttribute('type', 'matrix');
    m.setAttribute('values', `${c[0] / 255} 0 0 0 0 0 ${c[1] / 255} 0 0 0 0 0 ${c[2] / 255} 0 0 0 0 0 1 0`);
    f.append(m); svgDefs.append(f);
  }
  return `url(#${id})`;
}
const parseRGBA = s => { const [c, w] = String(s).split(';'); const [r, g, b, a] = c.split(',').map(Number); return { c: `rgba(${r},${g},${b},${(a ?? 255) / 255})`, w: String(w || '').split(',').map(Number) }; };
function frameInfo(f) {
  if (!f) return null;
  const [sheet, name] = f;
  if (sheet === '') { if (name === 'empty') return null; const sz = SIZES[name]; return { single: true, url: imgUrl(name), w: sz ? sz[0] : 0, h: sz ? sz[1] : 0 }; }
  const info = DB.frames[sheet]; const fr = info?.frames[name]; if (!fr) return null;
  const [fx, fy, fw, fh, ox, oy, sw, sh, rot] = fr;
  return { url: imgUrl(info.page), fx, fy, fw, fh, ox, oy, w: sw, h: sh, rot };
}
// size helpers ([w,h,type] like Cocos: 0 abs, 1 percent, 2 relative container, 3 h-percent, 4 v-percent)
function resolveSize(s, ps) {
  if (!s) return [0, 0];
  const [w, h, t] = s;
  switch (t) { case 1: return [ps[0] * w / 100, ps[1] * h / 100]; case 2: return [ps[0] - w, ps[1] - h]; case 3: return [ps[0] * w / 100, h]; case 4: return [w, ps[1] * h / 100]; default: return [w, h]; }
}
function resolvePos(p, ps) {
  if (!p) return [0, 0];
  const [x, y, t] = p;
  switch (t) { case 1: return [x, ps[1] - y]; case 2: return [ps[0] - x, ps[1] - y]; case 3: return [ps[0] - x, y]; case 4: return [ps[0] * x / 100, ps[1] * y / 100]; default: return [x, y]; }
}
function lerp(a, b, k) { return Array.isArray(a) ? a.map((x, i) => typeof x === 'number' ? x + (b[i] - x) * k : x) : (typeof a === 'number' ? a + (b - a) * k : a); }
function sample(kfs, t, step) {
  if (t <= kfs[0][0] || kfs.length === 1) return kfs[0][1];
  for (let i = 1; i < kfs.length; i++) {
    if (t <= kfs[i][0]) {
      const [t0, v0, e0] = kfs[i - 1], [t1, v1] = kfs[i];
      if (step || e0 === 0) return v0;
      let k = (t - t0) / Math.max(1e-6, t1 - t0);
      if (e0 === 2) k = k * k * k; else if (e0 === 3) k = 1 - Math.pow(1 - k, 3); else if (e0 === 4) k = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      else if (e0 >= 5 && e0 <= 10) k = 1 - Math.pow(1 - k, 2);
      else if (e0 >= 11) k = e0 === 12 ? 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2) : k * k * (2.7 * k - 1.7);
      return lerp(v0, v1, k);
    }
  }
  return kfs[kfs.length - 1][1];
}
const STEP = { visible: 1, displayFrame: 1, spriteFrame: 1 };
const LAYER_CLASSES = new Set(['CCLayerColor', 'CCLayerGradient', 'CCLayer']);
const LABELS = new Set(['MyLabelTTF', 'CCLabelTTF', 'RichLabel', 'CCLabelBMFont']);
const SKIP = new Set(['MyParticle', 'CCParticleSystemQuad', 'Spine', 'SubEffect']);
export const CCB_FONT = '"ewmain","Trebuchet MS","Segoe UI",Roboto,Arial,sans-serif';
// static strings in the scenes are string-table keys ("package_009"); numbers and live values are shown as-is
const txt = s => { if (!/^[A-Za-z][\w-]*$/.test(s || '')) return s || ''; const v = S(s); return v && v !== s ? v : (/^[a-z]+(_[a-z0-9]+)*_\d+$/i.test(s) ? '' : s); };

// ---------------------------------------------------------------- view
export class CCBView {
  constructor(def, opts = {}) {
    this.def = def; this.nodes = new Map(); this.all = []; this.subs = []; this.opts = opts;
    this.el = document.createElement('div'); this.el.className = 'ccb-root';
    this.rootRec = this.build(def.root, this.el, opts.size || [0, 0], true);
    const auto = Object.entries(def.seq).find(([, s]) => s[0] === def.auto);
    if (opts.play !== false && auto) this.play(auto[0]);
    else this.applyAll(null, 0);
  }
  build(n, parentEl, psize, isRoot) {
    const rec = { def: n, parentSize: psize, st: {} };
    const el = document.createElement('div'); el.className = 'ccb-n'; rec.el = el;
    const p = n.p;
    // intrinsic size
    let size = [0, 0];
    if (p.contentSize) size = resolveSize(p.contentSize, psize);
    if (n.c === 'CCSprite') { const fi = frameInfo(p.displayFrame); if (fi) size = [fi.w, fi.h]; rec.inner = document.createElement('div'); rec.inner.className = 'ccb-img'; el.append(rec.inner); }
    if (n.c === 'CCScale9Sprite' || n.c === 'CCControlButton') size = resolveSize(p.preferedSize, psize);
    rec.size = size;
    if (SKIP.has(n.c)) { el.style.display = 'none'; parentEl.append(el); return rec; }
    if (LABELS.has(n.c)) this.makeLabel(rec);
    if (n.c === 'CCLayerColor') { const c = p.color || [255, 255, 255]; el.style.background = `rgba(${c[0]},${c[1]},${c[2]},${(p.opacity ?? 255) / 255})`; }
    if (n.c === 'CCLayerGradient') { const a = p.startColor || [0, 0, 0], b = p.endColor || [0, 0, 0]; if (p.startOpacity || p.endOpacity) el.style.background = `linear-gradient(rgba(${b},${(p.endOpacity ?? 0) / 255}),rgba(${a},${(p.startOpacity ?? 0) / 255}))`; }
    if (n.c === 'CCScale9Sprite') this.nine(el, p.spriteFrame, p, size);
    if (n.c === 'CCControlButton') this.makeButton(rec);
    if (/Scroll/.test(n.c) || n.c === 'ClipNode' || n.c === 'ClipControlNode') el.style.overflow = 'hidden';
    if (n.n) { if (!this.nodes.has(n.n)) this.nodes.set(n.n, rec); rec.name = n.n; }
    parentEl.append(el);
    this.all.push(rec);
    if (n.c === 'CCBFile' && n.p.ccbFile) rec.subPending = n.p.ccbFile; // nested scene, built in ready()
    for (const k of n.k || []) this.build(k, el, size, false);
    rec.isRoot = isRoot;
    return rec;
  }
  async ready() { // resolve nested CCBFiles
    const jobs = [];
    for (const rec of this.all) if (rec.subPending) {
      const path = rec.subPending; rec.subPending = null;
      jobs.push(fetchDef(path).then(def => {
        const sv = new CCBView(def, { size: rec.size }); rec.sub = sv; sv.parentRec = rec; this.subs.push(sv);
        rec.el.append(sv.el); return sv.ready();
      }).catch(() => null));
    }
    await Promise.all(jobs);
    return this;
  }
  makeLabel(rec) {
    const p = rec.def.p, el = rec.el;
    el.classList.add('ccb-label');
    const fs = (p.fontSize?.[0] ?? 20);
    el.style.fontSize = fs + 'px'; el.style.fontFamily = CCB_FONT;
    const c = p.color || p.fontColor || [255, 255, 255]; el.style.color = `rgb(${c[0]},${c[1]},${c[2]})`;
    const sh = [];
    if (p.outline) { const o = parseRGBA(p.outline); const w = Math.max(1, o.w[0] || 1); for (const [dx, dy] of [[w, 0], [-w, 0], [0, w], [0, -w], [w, w], [-w, -w], [w, -w], [-w, w]]) sh.push(`${dx}px ${dy}px 0 ${o.c}`); }
    if (p.shadow) { const o = parseRGBA(p.shadow); sh.push(`${o.w[0] || 0}px ${-(o.w[1] || 0)}px 1px ${o.c}`); }
    if (sh.length) el.style.textShadow = sh.join(',');
    const d = p.dimensions;
    if (d && (d[0] || d[1])) { el.style.width = d[0] + 'px'; if (d[1]) el.style.height = d[1] + 'px'; el.style.whiteSpace = 'pre-wrap'; rec.size = [d[0], d[1]]; el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.justifyContent = ['flex-start', 'center', 'flex-end'][p.verticalAlignment || 0]; }
    else el.style.whiteSpace = 'pre';
    el.style.textAlign = ['left', 'center', 'right'][p.horizontalAlignment || 0];
    this.setLabel(rec, p.string || '', rec.def.c === 'RichLabel');
    rec.autoSize = !(d && (d[0] || d[1]));
  }
  setLabel(rec, s, rich, raw) {
    const v = raw ? String(s ?? '') : txt(String(s ?? ''));
    if (rich || /<cr=|\\n|\n/.test(v)) rec.el.innerHTML = richText(v); else rec.el.textContent = v;
  }
  nine(el, frame, p, size) {
    const fi = frameInfo(frame);
    if (!fi) return;
    if (fi.single) {
      let l = p.insetLeft || 0, t = p.insetTop || 0, r = p.insetRight || 0, b = p.insetBottom || 0;
      if (!(l || t || r || b)) { l = r = Math.floor(fi.w / 3); t = b = Math.floor(fi.h / 3); }
      // keep corners inside small boxes
      const k = Math.min(1, size[0] / Math.max(1, l + r), size[1] / Math.max(1, t + b));
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${t * k}px ${r * k}px ${b * k}px ${l * k}px`;
      el.style.borderImage = `url(${fi.url}) ${t} ${r} ${b} ${l} fill stretch`;
      el.style.boxSizing = 'border-box';
    } else { // sheet frame: plain stretch
      el.style.backgroundImage = `url(${fi.url})`;
      el.style.backgroundSize = `${size[0] / fi.fw * 100}% ${size[1] / fi.fh * 100}%`;
    }
  }
  makeButton(rec) {
    const p = rec.def.p, el = rec.el;
    el.classList.add('ccb-btn');
    this.nine(el, p['backgroundSpriteFrame|1'], {}, rec.size);
    const title = p['title|1'];
    if (title) {
      const t = document.createElement('div'); t.className = 'ccb-btitle';
      const c = p['titleColor|1'] || [255, 255, 255];
      t.style.color = `rgb(${c})`; t.style.fontSize = (p['titleTTFSize|1']?.[0] || 20) + 'px'; t.style.fontFamily = CCB_FONT;
      t.textContent = txt(title); el.append(t); rec.title = t;
    }
    if (p.enabled === false) el.classList.add('disabled');
  }
  // ---------------------------------------------------------------- state & layout
  value(rec, name, sid, t, def) {
    const a = rec.def.a?.[sid]?.[name];
    if (a) return sample(a, t, STEP[name]);
    const v = rec.def.p[name];
    return v === undefined ? def : v;
  }
  applyRec(rec, sid, t) {
    const n = rec.def, el = rec.el, p = n.p;
    if (SKIP.has(n.c)) return;
    const vis = rec.forceHidden ? false : (rec.forceVisible ?? this.value(rec, 'visible', sid, t, true));
    el.style.display = vis ? '' : 'none';
    if (!vis) return;
    const posRaw = this.value(rec, 'position', sid, t, null);
    const [x, y] = posRaw ? resolvePos([posRaw[0], posRaw[1], p.position?.[2] || 0], rec.parentSize) : [0, 0];
    const sc = this.value(rec, 'scale', sid, t, [1, 1]);
    const rot = this.value(rec, 'rotation', sid, t, 0);
    const skew = this.value(rec, 'skew', sid, t, [0, 0]);
    const op = this.value(rec, 'opacity', sid, t, 255);
    const ap = p.anchorPoint || (n.c === 'CCSprite' || LABELS.has(n.c) || n.c === 'CCScale9Sprite' || n.c === 'CCControlButton' ? [0.5, 0.5] : [0, 0]);
    const ignore = p.ignoreAnchorPointForPosition ?? LAYER_CLASSES.has(n.c);
    if (n.c === 'CCSprite') this.applyFrame(rec, this.value(rec, 'displayFrame', sid, t, null));
    const [w, h] = rec.size;
    if (!rec.autoSize) { el.style.width = w + 'px'; el.style.height = h + 'px'; }
    el.style.left = x + 'px'; el.style.bottom = y + 'px';
    const tx = ignore ? '0' : `${-ap[0] * 100}%`, ty = ignore ? '0' : `${ap[1] * 100}%`;
    el.style.transformOrigin = `${ap[0] * 100}% ${(1 - ap[1]) * 100}%`;
    let tr = `translate(${tx},${ty})`;
    if (rot) tr += ` rotate(${rot}deg)`;
    if (skew && (skew[0] || skew[1])) tr += ` skew(${-skew[0]}deg,${-skew[1]}deg)`;
    if (sc[0] !== 1 || sc[1] !== 1) tr += ` scale(${sc[0]},${sc[1]})`;
    el.style.transform = tr;
    el.style.opacity = op / 255;
    const col = this.value(rec, 'color', sid, t, null);
    if (col && n.c === 'CCSprite') {
      const add = p.blendFunc && p.blendFunc[1] === 1;
      rec.inner.style.filter = tintFilter(col);
      rec.inner.style.mixBlendMode = add ? 'plus-lighter' : '';
    } else if (n.c === 'CCSprite' && p.blendFunc && p.blendFunc[1] === 1) rec.inner.style.mixBlendMode = 'plus-lighter';
    if (col && n.c === 'CCLayerColor') el.style.background = `rgba(${col[0]},${col[1]},${col[2]},${(p.opacity ?? 255) / 255})`;
  }
  applyFrame(rec, f) {
    if (rec.customImg) return; // live content (item icons) set by the screen
    if (rec.frameOverride) f = rec.frameOverride;
    const key = f ? f.join('|') : '';
    if (rec.frameKey === key) return; rec.frameKey = key;
    const fi = frameInfo(f), inner = rec.inner;
    if (!fi) { inner.style.backgroundImage = ''; return; }
    rec.size = [fi.w, fi.h];
    if (fi.single) {
      Object.assign(inner.style, { left: '0', top: '0', width: fi.w + 'px', height: fi.h + 'px', backgroundImage: `url(${fi.url})`, backgroundPosition: '0 0', transform: '' });
    } else if (!fi.rot) {
      Object.assign(inner.style, { left: fi.ox + 'px', top: fi.oy + 'px', width: fi.fw + 'px', height: fi.fh + 'px', backgroundImage: `url(${fi.url})`, backgroundPosition: `${-fi.fx}px ${-fi.fy}px`, transform: '' });
    } else { // packed rotated 90deg clockwise
      const cx = fi.ox + fi.fw / 2, cy = fi.oy + fi.fh / 2;
      Object.assign(inner.style, { left: (cx - fi.fh / 2) + 'px', top: (cy - fi.fw / 2) + 'px', width: fi.fh + 'px', height: fi.fw + 'px', backgroundImage: `url(${fi.url})`, backgroundPosition: `${-fi.fx}px ${-fi.fy}px`, transform: 'rotate(-90deg)' });
    }
  }
  applyAll(sid, t) { for (const r of this.all) this.applyRec(r, sid, t); }
  // play a timeline by name; chained / looping sequences continue automatically
  play(name, onDone) {
    const s = this.def.seq[name]; if (!s) { onDone && onDone(); return; }
    const [sid, dur, chain] = s;
    this.cur = { sid: String(sid), t0: performance.now(), dur, chain, onDone, name };
    this.applyAll(String(sid), 0);
    cancelAnimationFrame(this._raf);
    const animated = this.all.filter(r => r.def.a?.[sid]);
    const tick = () => {
      if (!this.cur || this.cur.sid !== String(sid)) return;
      const t = (performance.now() - this.cur.t0) / 1000;
      const tt = Math.min(t, dur);
      for (const r of animated) this.applyRec(r, String(sid), tt);
      if (t < dur) { this._raf = requestAnimationFrame(tick); return; }
      const cb = this.cur.onDone; this.cur.onDone = null; cb && cb();
      const next = Object.entries(this.def.seq).find(([, v]) => v[0] === chain);
      if (next && chain !== -1 && this.cur?.sid === String(sid)) { if (chain === sid && !animated.length) return; this.play(next[0]); }
    };
    if (dur > 0 && animated.length) this._raf = requestAnimationFrame(tick);
    else { onDone && onDone(); }
  }
  // ---------------------------------------------------------------- API for screens
  find(name) { if (this.nodes.has(name)) return this.nodes.get(name); for (const s of this.subs) { const r = s.find(name); if (r) return r; } return null; }
  el$(name) { return this.find(name)?.el || null; }
  sub(name) { return this.find(name)?.sub || null; }
  text(name, s, rich) { const r = this.find(name); if (r) this.setLabel(r, s, rich, true); return this; }
  show(name, on) { const r = this.find(name); if (r) { r.forceHidden = !on; r.forceVisible = on ? true : undefined; this.applyRec(r, this.cur?.sid ?? null, 0); } return this; }
  frame(name, f) { const r = this.find(name); if (r) { r.frameOverride = f; r.frameKey = null; this.applyFrame(r, f); } return this; }
  scaleX(name, k) { const r = this.find(name); if (r) { r.def = { ...r.def, p: { ...r.def.p, scale: [Math.max(0, k), r.def.p.scale?.[1] ?? 1] }, a: undefined }; this.applyRec(r, null, 0); } return this; }
  // a container div placed at a named node's origin, for live content
  slot(name, cls) {
    const r = this.find(name); if (!r) return null;
    if (!r.slotEl) { r.slotEl = document.createElement('div'); r.slotEl.className = 'ccb-slot' + (cls ? ' ' + cls : ''); r.el.append(r.slotEl); }
    return r.slotEl;
  }
  // tap on a named button (CCBFile button scene -> its "control"; or a CCControlButton)
  tap(name, fn) {
    const r = this.find(name); if (!r) return this;
    const sv = r.sub; const ctl = sv ? (sv.find('control') || sv.all.find(x => x.def.c === 'CCControlButton')) : r;
    const target = ctl ? ctl.el : r.el;
    target.classList.add('ccb-btn');
    target.onpointerdown = e => { e.stopPropagation(); sv?.def.seq.press && sv.play('press'); };
    target.onpointerup = e => { sv?.def.seq.tonormal && sv.play('tonormal'); };
    target.onpointerleave = () => { if (sv?.cur?.name === 'press') sv.play('tonormal'); };
    target.onclick = e => { e.stopPropagation(); if (r.disabled) return; Audio2.play('ui-003'); fn(e); };
    return this;
  }
  enable(name, on) { const r = this.find(name); if (r) { r.disabled = !on; r.el.classList.toggle('ccb-disabled', !on); } return this; }
  destroy() { cancelAnimationFrame(this._raf); this.subs.forEach(s => s.destroy()); this.el.remove(); }
}

// mount a screen scene full-screen (design space 750 wide, height of the stage), root at the centre
export async function openScene(path, host) {
  const def = await loadCCB(path);
  const stage = document.createElement('div'); stage.className = 'ccb-stage';
  const v = new CCBView(def, { play: false });
  await v.ready();
  const center = document.createElement('div'); center.className = 'ccb-center'; center.append(v.el);
  stage.append(center); host.append(stage);
  v.stage = stage;
  v.close = (done) => { if (v.def.seq.close) v.play('close', () => { v.destroy(); stage.remove(); done && done(); }); else { v.destroy(); stage.remove(); done && done(); } };
  if (v.def.seq.open) v.play('open', () => v.def.seq.normal && v.play('normal')); else if (v.def.seq.normal) v.play('normal'); else v.applyAll(null, 0);
  return v;
}
