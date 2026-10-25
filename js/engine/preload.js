// Asset preloading: everything needed for the next tower floors (+ all sound effects) is fetched,
// decoded and uploaded to the GPU on the loading screen, so the game never stops to load mid-fight.
// The rest of the tower is warmed in the background afterwards.
import { DB } from './db.js';
import { Audio2 } from './audio.js';
import { loadSkeletonData, buildPlayerSkeleton } from './spinekit.js';
import { P } from '../game/profile.js';
import { lookEquips } from '../game/modes.js';
import { petModel } from '../game/pets.js';
import { loadOrna, loadTowerFx, towerFx, ccbAssets, ornaFor } from '../game/ornaments.js';

const pad3 = v => String(v).padStart(3, '0');
const COMMON_TEX = ['map/floor', 'ui/towermasker-1', 'ui/effect-1-2-3', 'ui/effect-1-2-6', 'ui/effect-1-4-1', 'ui/effect-1-1-1', 'ui/effect-1-2-1', 'ui/effect-2-1-1', 'scene/camp'];
const COMMON_SHEETS = ['ui/uip-3', 'map/stair', 'map/hidden-1'];

// list of loading jobs for a range of floors
function floorJobs(gfx, f0, f1) {
  const jobs = [];
  const tilesets = new Set(), models = new Set();
  for (const r of DB.mapRows) {
    const f = +r.Floor; if (f < f0 || f > f1 || r.ID >= 10000) continue;
    tilesets.add(String(r.Image || 1));
    for (const id of String(r.MonsterID || '').split(';').filter(Boolean)) { const m = DB.monster.get(+id); if (m) models.add(pad3(m.MonsterModel)); }
  }
  for (const ts of tilesets) {
    if (DB.frames['map/tile-' + ts]) jobs.push(() => gfx.loadSheet('map/tile-' + ts));
    for (const def of [towerFx('bg-' + ts), towerFx('masker-' + ts), ...ornaFor(+ts)]) {
      if (!def) continue;
      const a = ccbAssets(def);
      for (const s of a.sheets) if (DB.frames[s]) jobs.push(() => gfx.loadSheet(s));
      for (const t of a.tex) jobs.push(() => gfx.loadTex(t));
    }
  }
  for (const m of models) jobs.push(() => loadSkeletonData('npc/' + m));
  return jobs;
}
async function run(jobs, onP, conc = 6) {
  const seen = new Set(); const q = []; for (const j of jobs) { const k = j.toString(); if (!seen.has(k) || true) q.push(j); }
  let done = 0; const total = q.length || 1;
  const worker = async () => { while (q.length) { const j = q.shift(); try { await j(); } catch (e) { } done++; onP && onP(done / total); } };
  await Promise.all(Array.from({ length: conc }, worker));
}

export const Preload = {
  async essentials(gfx, onP) {
    await Promise.all([loadOrna(), loadTowerFx()]);
    const p = P.data;
    const top = Math.max(1, p?.maxFloor || 1);
    const jobs = [
      ...COMMON_SHEETS.map(s => () => gfx.loadSheet(s)),
      ...COMMON_TEX.map(t => () => gfx.loadTex(t).catch(() => null)),
      ...floorJobs(gfx, 1, 3),
      ...(top > 3 ? floorJobs(gfx, Math.max(1, top - 4), top + 2) : []),
    ];
    if (p) {
      jobs.push(() => buildPlayerSkeleton(p.look, lookEquips(p)));
      for (const id of Object.keys(p.pets || {})) jobs.push(() => loadSkeletonData('npc/' + petModel(+id, p.pets[id].star)));
    } else jobs.push(() => buildPlayerSkeleton({ tone: 1, style: 2 }, [DB.equip.get(110000)]));
    const names = await fetch('data/sounds.json').then(r => r.json()).catch(() => []);
    let a = 0, b = 0; const upd = () => onP && onP(a * 0.7 + b * 0.3);
    await Promise.all([run(jobs, k => { a = k; upd(); }), Audio2.preload(names, k => { b = k; upd(); })]);
  },
  // warm the rest of the tower quietly (one job at a time, never blocks play)
  background(gfx) {
    if (this._bg) return; this._bg = true;
    const top = Math.max(1, P.data?.maxFloor || 1);
    const jobs = [...floorJobs(gfx, 1, Math.min(200, top + 15)), ...floorJobs(gfx, top + 16, 200)];
    const step = () => {
      const j = jobs.shift(); if (!j) return;
      Promise.resolve().then(j).catch(() => { }).then(() => (window.requestIdleCallback ? requestIdleCallback(step, { timeout: 400 }) : setTimeout(step, 30)));
    };
    setTimeout(step, 1500);
  },
  // before a new floor: models of the next floor so the following transition is instant
  next(gfx, floor) { run(floorJobs(gfx, floor + 1, floor + 1), null, 2); },
};
