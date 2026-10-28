// SpineKit: loads Spine 3.3 skeletons (pre-converted to 3.8 JSON) and builds the paper-doll hero.
// Runtime: spine-webgl 3.8 (js/lib/spine-webgl.js, global `spine`).
import { DB } from './db.js';

const AV = 'assets/avatar/';
const textCache = new Map();
const imgCache = new Map();
const skelCache = new Map();
let glCtx = null;

export function initSpineKit(ctx) { glCtx = ctx; }

function fetchText(url) {
  if (!textCache.has(url)) textCache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }));
  return textCache.get(url);
}
export function loadImage(url) {
  if (!imgCache.has(url)) imgCache.set(url, new Promise((res, rej) => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => res(im); im.onerror = () => rej(new Error('img ' + url)); im.src = url;
  }));
  return imgCache.get(url);
}
const glTexCache = new Map();
export async function loadGLTexture(url) {
  if (!glTexCache.has(url)) glTexCache.set(url, loadImage(url).then(im => {
    const t = new spine.webgl.GLTexture(glCtx, im);
    t.setFilters(spine.TextureFilter.Linear, spine.TextureFilter.Linear);
    return t;
  }));
  return glTexCache.get(url);
}

// Build a TextureAtlas from an .atlas file (pages loaded as GL textures)
async function loadAtlas(dir, atlasFile) {
  const txt = await fetchText(dir + atlasFile);
  const pages = [];
  txt.split('\n').forEach((l, i, arr) => { if ((i === 0 || arr[i - 1].trim() === '') && /\.(webp|png)$/.test(l.trim())) pages.push(l.trim()); });
  const texs = {};
  await Promise.all(pages.map(async p => { texs[p] = await loadGLTexture(dir + p); }));
  return new spine.TextureAtlas(txt, p => texs[p]);
}

// One-image-per-page atlas for individual avatar part images.
function atlasTextForImages(names) {
  let s = '';
  for (const n of names) {
    const sz = DB.avatarIndex[n]; if (!sz) continue;
    s += `\n${n}.webp\nsize: ${sz[0]},${sz[1]}\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\n${n}\n  rotate: false\n  xy: 0, 0\n  size: ${sz[0]}, ${sz[1]}\n  orig: ${sz[0]}, ${sz[1]}\n  offset: 0, 0\n  index: -1\n`;
  }
  return s;
}
const partAtlasRegions = new Map(); // name -> TextureAtlasRegion
async function getPartRegions(names) {
  const need = names.filter(n => !partAtlasRegions.has(n) && DB.avatarIndex[n]);
  if (need.length) {
    const texs = {};
    await Promise.all(need.map(async n => { texs[n + '.webp'] = await loadGLTexture(AV + n + '.webp'); }));
    const atlas = new spine.TextureAtlas(atlasTextForImages(need), p => texs[p]);
    for (const r of atlas.regions) partAtlasRegions.set(r.name, r);
  }
  const out = {};
  for (const n of names) if (partAtlasRegions.has(n)) out[n] = partAtlasRegions.get(n);
  return out;
}

// Skeleton data for monsters / npcs (has own atlas)
export async function loadSkeletonData(path /* e.g. 'npc/1001' or 'ui/deathfx-1' with base */, base = AV, scale = 1) {
  const key = base + path + '@' + scale;
  if (!skelCache.has(key)) skelCache.set(key, (async () => {
    const dir = (base + path).replace(/[^/]+$/, '');
    const name = path.split('/').pop();
    const [json, atlas] = await Promise.all([fetchText(base + path + '.json'), loadAtlas(dir, name + '.atlas')]);
    const sj = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
    sj.scale = scale;
    return sj.readSkeletonData(JSON.parse(json));
  })());
  return skelCache.get(key);
}

// ---------- Player (paper doll) ----------
let playerData = null;
const DUMMY_REGION = { u: 0, v: 0, u2: 1, v2: 1, width: 1, height: 1, originalWidth: 1, originalHeight: 1, offsetX: 0, offsetY: 0, rotate: false, degrees: 0, renderObject: null, texture: null };
class LazyLoader {
  newRegionAttachment(skin, name, path) {
    const a = new spine.RegionAttachment(name); a.path = path; a.setRegion(DUMMY_REGION); a.__dummy = true; return a;
  }
  newMeshAttachment(skin, name, path) { const a = new spine.MeshAttachment(name); a.path = path; a.region = DUMMY_REGION; a.__dummy = true; return a; }
  newBoundingBoxAttachment(skin, name) { return new spine.BoundingBoxAttachment(name); }
  newPathAttachment(skin, name) { return new spine.PathAttachment(name); }
  newPointAttachment(skin, name) { return new spine.PointAttachment(name); }
  newClippingAttachment(skin, name) { return new spine.ClippingAttachment(name); }
}
export async function loadPlayerData() {
  if (playerData) return playerData;
  const json = JSON.parse(await fetchText(AV + 'player-1.json'));
  const sj = new spine.SkeletonJson(new LazyLoader());
  playerData = sj.readSkeletonData(json);
  playerData.__origDefault = playerData.defaultSkin;
  playerData.defaultSkin = new spine.Skin('default');
  playerData.skins = [playerData.defaultSkin];
  return playerData;
}

function setRegion(att, region, w, h) {
  region.renderObject = region;
  if (att instanceof spine.RegionAttachment) {
    att.setRegion(region);
    if (w) { att.width = w; att.height = h; }
    att.updateOffset();
  } else if (att instanceof spine.MeshAttachment) {
    att.region = region; att.updateUVs();
  }
}

// look = { tone:0..9, style:2..10 }, equips = [equipRecord...]
export async function buildPlayerSkeleton(look, equips) {
  const data = await loadPlayerData();
  const tone = look?.tone ?? 1, style = look?.style ?? 2;
  const baseModel = String(tone * 10 + 1).padStart(3, '0');
  const styleModel = String(tone * 10 + (style % 10)).padStart(3, '0'); // style 10 = set x0 of the same tone
  const skin = new spine.Skin('doll');
  const def = data.__origDefault;
  // map slot name -> {attName: imageName}
  const want = []; // [slotIndex, attName, attachment(template), imageName]
  const equipBySlot = {};
  const hidden = new Set();
  for (const e of equips || []) {
    if (!e) continue;
    const model = String(e.ModelID).padStart(3, '0');
    for (let i = 1; i <= 26; i++) {
      const s = e['Slot' + i]; if (s === '' || s == null) continue;
      const vars = String(e['Attach' + i]).split(';').filter(Boolean);
      equipBySlot[String(s).padStart(3, '0')] = { model, vars };
    }
    if (e.HideSlot !== '' && e.HideSlot != null) String(e.HideSlot).split(';').forEach(h => hidden.add(String(h).padStart(3, '0')));
  }
  const entries = def.getAttachments();
  for (const ent of entries) {
    const slot = data.slots[ent.slotIndex];
    const sname = slot.name;
    const att = ent.attachment;
    if (!att.path && !(att instanceof spine.RegionAttachment || att instanceof spine.MeshAttachment)) continue;
    const path = att.path || ent.name;
    let img = null;
    const m = /^(\d{3})-(\d{3})-(\d{2})$/.exec(path);
    const eq = equipBySlot[sname];
    const varName = ent.name; // '01'...
    if (eq) {
      const cand = `${sname}-${eq.model}-${varName}`;
      if (DB.avatarIndex[cand]) img = cand;
    }
    if (!img && m) {
      const s2 = `${m[1]}-${styleModel}-${m[3]}`, s1 = `${m[1]}-${baseModel}-${m[3]}`;
      img = DB.avatarIndex[s2] ? s2 : (DB.avatarIndex[s1] ? s1 : path);
    }
    if (!img && path && DB.avatarIndex[path]) img = path;
    want.push([ent.slotIndex, ent.name, att, img, hidden.has(sname)]);
  }
  const regions = await getPartRegions([...new Set(want.map(w => w[3]).filter(Boolean))]);
  for (const [si, name, tpl, img, hide] of want) {
    if (hide) continue;
    const reg = img && regions[img];
    if (!reg) continue;
    const a = tpl.copy();
    const sz = DB.avatarIndex[img];
    if (tpl instanceof spine.RegionAttachment && (tpl.path === 'empty' || tpl.width <= 1)) setRegion(a, reg, sz[0], sz[1]);
    else if (tpl instanceof spine.RegionAttachment) setRegion(a, reg, sz[0], sz[1]);
    else setRegion(a, reg);
    skin.setAttachment(si, name, a);
  }
  const sk = new spine.Skeleton(data);
  sk.setSkin(skin);
  sk.setSlotsToSetupPose();
  // hidden slots: clear
  sk.slots.forEach(s => { if (hidden.has(s.data.name)) s.data.__hidden = true; });
  return sk;
}

export class SpineActor {
  static rand = n => Math.floor(Math.random() * n);   // replaced by arc4random() % n in main.js
  static router = null;                               // (actor, kind, track, name, ev, entry) -> combat / view
  static shake = null;
  static _warned = new Set();
  static warnMissing(n, track) { const k = n + '#' + track; if (!SpineActor._warned.has(k)) { SpineActor._warned.add(k); console.warn('[SPINE] animation not found', n, 'track', track); } }
  constructor(skeleton) {
    this.skeleton = skeleton; this.curTrack = 0;
    this.state = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
    this.state.data.defaultMix = 0.1;
    this.names = new Set(skeleton.data.animations.map(a => a.name));
    this.cur = null;
    // UnitNode::onAnimationEvent / onAnimationComplete / onAnimationStart (renderer side):
    //  - "sound-1"/"sound-2": one random entry of the comma list (arc4random), played every time (no throttle)
    //  - "gsound-1"/"gsound-2": same, as a group sound;  "shake-t": C_TOWER_SHAKE with a random entry
    //  - every event / complete / start is forwarded unchanged to SpineActor.router with the TRACK INDEX
    //    (UnitNode::spineAnimate uses the unit state as the track: GameController::feedbackUnitAnimation* "state").
    //    The renderer never decides gameplay (no hit / fire interpretation here).
    this.state.addListener({
      start: entry => { if (entry.__exact) SpineActor.router?.(this, 'start', entry.trackIndex, entry.animation?.name, null, entry); },
      event: (entry, ev) => {
        const n = ev.data.name;
        const list = () => String(ev.stringValue ?? ev.data.stringValue ?? '').split(',').filter(x => x !== '');
        if (n === 'sound-1' || n === 'sound-2' || n === 'gsound-1' || n === 'gsound-2') {
          const l = list(); if (l.length && SpineActor.sound && !this.mute && this.inView !== false) { const pick = l[SpineActor.rand(l.length)]; if (pick && pick !== '0') SpineActor.sound(pick); }
        } else if (n === 'shake-t') { const l = list(); if (l.length) SpineActor.shake?.(l[SpineActor.rand(l.length)]); }
        if (entry.__exact) SpineActor.router?.(this, 'event', entry.trackIndex, n, ev, entry);
        else if ((n === 'hit' || n === 'fire') && entry.onHit) entry.onHit(n);   // legacy (non-combat) path only
      },
      complete: entry => { if (entry.__exact) SpineActor.router?.(this, 'complete', entry.trackIndex, entry.animation?.name, null, entry); },
    });
  }
  // ---- SOURCE-EXACT path (UnitNode::spineAnimate / spineAnimates / setActionRate). No name fallback: a missing
  // animation is reported and nothing is played (no synthetic complete / hit).
  spineAnimate(track, name, loop, rate) {
    if (!name || !this.names.has(name)) { console.error('[SPINE] missing animation', name, 'track', track); return null; }
    const cur = this.state.getCurrent(this.curTrack ?? 0);
    const prevT = cur ? cur.trackTime : -1;
    this.state.clearTracks(); this.skeleton.setToSetupPose();
    if (0 < rate) this.state.timeScale = rate;
    const e = this.state.setAnimation(track, name, !!loop); e.__exact = true; e.mixDuration = 0;
    if (track === 1 && 0 <= prevT) e.trackTime = prevT;   // run: keep the cycle position
    this.curTrack = track; this.cur = name;
    return e;
  }
  spineAnimates(track, names, loop, rate) {
    if (!names.length) return null;
    this.state.clearTracks(); this.skeleton.setToSetupPose();
    if (0 < rate) this.state.timeScale = rate;
    let e = null;
    // SkeletonAnimation::addAnimation of a name the skeleton lacks only logs and adds nothing (spine-cpp)
    names.forEach((n, i) => {
      if (!this.names.has(n)) { SpineActor.warnMissing(n, track); return; }
      e = this.state.addAnimation(track, n, i === names.length - 1 ? !!loop : false, 0); e.__exact = true; e.mixDuration = 0;
    });
    this.curTrack = track; this.cur = names[names.length - 1];
    return e;
  }
  setActionRate(rate) { this.state.timeScale = rate; }
  // time of the first impact event of an animation (seconds), or null
  hitTime(name) {
    const a = this.skeleton.data.findAnimation(name); if (!a) return null;
    for (const tl of a.timelines) if (tl instanceof spine.EventTimeline) for (const e of tl.events) if (e.data.name === 'hit' || e.data.name === 'fire') return e.time;
    return null;
  }
  hasSoundEvents(name) {
    const a = this.skeleton.data.findAnimation(name); if (!a) return false;
    for (const tl of a.timelines) if (tl instanceof spine.EventTimeline) for (const e of tl.events) if (e.data.name.startsWith('sound')) return true;
    return false;
  }
  has(n) { return this.names.has(n); }
  play(name, loop = true, onEnd, onHit) {
    if (!this.has(name)) {
      // fallbacks
      const base = name.replace(/-\d$/, '');
      const alt = [...this.names].find(a => a.startsWith(base)) || [...this.names].find(a => a.startsWith(name.split('-')[0]));
      if (!alt) { onEnd && onEnd(); return null; }
      name = alt;
    }
    if (this.cur === name && loop && !this.curTrack) return;
    if (this.curTrack) { this.state.clearTracks(); this.curTrack = 0; }   // leaving the exact (combat) path
    this.state.timeScale = 1;
    this.cur = name;
    const e = this.state.setAnimation(0, name, loop);
    if (onEnd) e.listener = { complete: () => { e.listener = null; onEnd(); } };
    if (onHit) e.onHit = onHit;
    return e;
  }
  duration(name) { const a = this.skeleton.data.findAnimation(name); return a ? a.duration : 0; }
  update(dt) { this.state.update(dt); this.state.apply(this.skeleton); this.skeleton.updateWorldTransform(); }
}
