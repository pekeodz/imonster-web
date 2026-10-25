// Traps from trap.csv: groups of floor spikes that rise in sequence (Appear: dx,dy,delay; Period),
// and the blade drum (trap 7) that hits the 4 tiles around it.
import { DB } from '../engine/db.js';
import { rgba } from '../engine/gfx.js';
import { Audio2 } from '../engine/audio.js';
import { P, stats } from './profile.js';

const T = 100;
const UP = 0.45; // seconds a spike stays up

export class Traps {
  constructor(tower) { this.t = tower; this.list = []; this.tiles = new Map(); this.cd = 0; }
  static wanted(tower) {
    const ids = String(tower.row.TrapID || '').split(';').filter(Boolean).map(Number);
    if (ids.length) return ids;
    if (tower.hard && tower.floor >= 3) return [1, 2, 3, 4, 5, 6, 7];
    return [];
  }
  // place 2..5 trap groups away from born/pass/objects; never block the only path (spikes are passable)
  build(ids) {
    const t = this.t, g = t.grid, rng = t.rng;
    const n = Math.min(6, 2 + Math.floor(t.floor / 20) + (t.hard ? 2 : 0));
    const isFree = (x, y) => g.isFloor(x, y) && !t.objAt(x, y) && !t.unitAt(x, y) && !(x === t.born[0] && y === t.born[1]) && !(t.pass && x === t.pass[0] && y === t.pass[1]) && Math.abs(x - t.born[0]) + Math.abs(y - t.born[1]) > 2 && !this.tiles.has(x + ',' + y);
    for (let k = 0; k < n * 6 && this.list.length < n; k++) {
      const def = DB.trap.get(rng.pick(ids)); if (!def) continue;
      const x = rng.int(1, g.w - 2), y = rng.int(1, g.h - 2);
      if (!isFree(x, y)) continue;
      if (def.ID === 7) {
        // drum blocks its tile: keep map connected
        t.blocked[x + y * g.w] = 1;
        if (!t.connected() || !t.allObjectsReachable(t.objects)) { t.blocked[x + y * g.w] = 0; continue; }
        const tr = { def, x, y, drum: true, period: +def.Period || 0.5, phase: rng.next() * 2, tiles: [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => g.isFloor(a, b)).map(([a, b]) => ({ x: a, y: b, delay: 0 })) };
        this.list.push(tr); this.tiles.set(x + ',' + y, tr);
        continue;
      }
      const app = String(def.Appear).split(';').filter(Boolean).map(s => s.split(',').map(Number));
      const tiles = app.map(([dx, dy, d]) => ({ x: x + dx, y: y + dy, delay: d || 0 })).filter(c => isFree(c.x, c.y));
      if (tiles.length < 1) continue;
      const tr = { def, x, y, period: Math.max(0.8, +def.Period || 1.2), phase: rng.next() * 3, tiles };
      this.list.push(tr); tiles.forEach(c => this.tiles.set(c.x + ',' + c.y, tr));
    }
  }
  isDrum(x, y) { const tr = this.tiles.get(x + ',' + y); return tr && tr.drum && tr.x === x && tr.y === y; }
  up(tr, c, time) {
    const per = tr.period + UP * 1.5;
    const ph = ((time + tr.phase - c.delay) % per + per) % per;
    return ph < UP;
  }
  update(dt) {
    const t = this.t, h = t.hero; if (!h?.alive) return;
    this.cd = Math.max(0, this.cd - dt);
    const key = h.x + ',' + h.y;
    // count traps evaded (daily task) when standing on a down spike
    const tr = this.tiles.get(key);
    let hitBy = null;
    if (tr && !tr.drum) { const c = tr.tiles.find(c => c.x === h.x && c.y === h.y); if (c && this.up(tr, c, t.time)) hitBy = tr; else if (c && this.lastSafe !== key) { this.lastSafe = key; t.g.daily?.progress(9, 1); } }
    for (const d of this.list) if (d.drum && d.tiles.some(c => c.x === h.x && c.y === h.y) && this.up(d, d.tiles[0], t.time)) hitBy = d;
    if (hitBy && this.cd <= 0) {
      this.cd = 0.8;
      const s = stats();
      let dmg = s.max_hp * (hitBy.drum ? 0.12 : 0.08);
      const red = (t.pet?.trapReduce() || 0) + 0;
      dmg *= Math.max(0.1, 1 - red / 100);
      const mods = t.combat ? 1 : 1;
      dmg = Math.max(1, Math.round(dmg * mods));
      Audio2.play('hidden-1');
      t.combat.rawHurt(h, dmg, null);
      t.ui.hud(t);
    }
  }
  draw(gfx, time, revealed, idx, y) {
    for (const tr of this.list) {
      if (tr.drum) {
        if (tr.y !== y || !revealed[idx(tr.x, tr.y)]) continue;
        const up = this.up(tr, tr.tiles[0], time);
        const cx = tr.x * T + 50, cy = -(tr.y * T + 50);
        if (up) for (const c of tr.tiles) { const dx = (c.x - tr.x) * 60, dy = -(c.y - tr.y) * 60; gfx.drawFrame('map/hidden-1', c.x !== tr.x ? 'hidden-2-3' : 'hidden-2-2', cx + dx, cy + dy, {}); }
        gfx.drawFrame('map/hidden-1', 'hidden-2-1', cx, cy - 20, { ax: 0.5, ay: 0.3 });
        continue;
      }
      for (const c of tr.tiles) {
        if (c.y !== y || !revealed[idx(c.x, c.y)]) continue;
        const cx = c.x * T + 50, cy = -(c.y * T + 50);
        gfx.drawFrame('map/hidden-1', 'hidden-1-1', cx, cy, { scale: 1.3 });
        if (this.up(tr, c, time)) {
          gfx.drawFrame('map/hidden-1', 'hidden-1-3', cx - 18, cy - 10, { ax: 0.5, ay: 0.05, scale: 0.7 });
          gfx.drawFrame('map/hidden-1', 'hidden-1-3', cx + 16, cy - 4, { ax: 0.5, ay: 0.05, scale: 0.8 });
          gfx.drawFrame('map/hidden-1', 'hidden-1-3', cx, cy - 18, { ax: 0.5, ay: 0.05, scale: 0.6 });
        }
      }
    }
  }
}
