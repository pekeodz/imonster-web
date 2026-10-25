// Floor generation + auto-tiling.
// getWallStyle / getFloorStyle are direct ports of GameMap::getWallStyle / getFloorStyle
// from the original libMyGame.so (ARM64 disassembly).
export const WALL = 1, FLOOR = 2;

export class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.t = new Uint8Array(w * h).fill(WALL); }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : this.t[y * this.w + x]; }
  set(x, y, v) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.t[y * this.w + x] = v; }
  isFloor(x, y) { return this.get(x, y) === FLOOR; }
}

// Original code indexes [row][col] with row+1 = "up" on screen (Cocos y-up).
// Our grid is y-down, so: up = y-1, down = y+1.
export function wallStyle(g, x, y) {
  const W = (dx, dy) => g.get(x + dx, y + dy) === WALL ? 1 : 0;
  const L = W(-1, 0), R = W(1, 0);
  const U = W(0, 1), D = W(0, -1);            // asm "row-1" = screen down, "row+1" = screen up
  const UL = W(-1, 1), UR = W(1, 1), DL = W(-1, -1), DR = W(1, -1);
  const LR = L && R;
  let w16 = U && LR;
  if (w16 && D) {
    const cnt = UL + UR + DL + DR;
    if (cnt < 2) return 10;
    if (!UL && UR && DL && !DR) return 10;
    if (UL && !UR && !DL && DR) return 10;
  }
  if (D && LR) {
    if (!U) { if (!DL || !DR) return 15; }
    if (UL && U && UR && !DL && !DR) return 15;
  }
  if (w16) {
    if (!D) { if (!UL || !UR) return 16; }
    if (!UR && !UL && DL && D && DR) return 16;
  }
  const UD = D && U;
  if (R && UD) {
    if (!L) { if (!UR || !DR) return g.get(x - 1, y) === 0 ? 24 : 11; }
    if (!UR && UL && L && DL && !DR) return 11;
  }
  if (U && L && D) {
    if (!R) { if (!UL || !DL) return g.get(x + 1, y) === 0 ? 25 : 14; }
    if (!UL && !DL && UR && R && DR) return 14;
  }
  if (U && R) {
    if (!UR) return g.get(x - 1, y) === 0 ? 18 : 5;
    if (!L && !D) return g.get(x - 1, y) === 0 ? 18 : 5;
  }
  if (L && D) {
    if (!R && !U) return g.get(x + 1, y) === 0 ? 21 : 7;
    if (!DL) return g.get(x + 1, y) === 0 ? 21 : 7;
  }
  if (R && D) {
    if (!L && !U) return g.get(x - 1, y) === 0 ? 22 : 8;
    if (!DR) return g.get(x - 1, y) === 0 ? 22 : 8;
  }
  if (U && L) {
    if (!UL) return g.get(x + 1, y) === 0 ? 23 : 9;
    if (!R && !D) return g.get(x + 1, y) === 0 ? 23 : 9;
  }
  if (LR) {
    if (!U || !D) return 2;
    return 0;
  }
  if (!U && L && !R && !D) return 3;
  if (!U && !L && R && !D) return 4;
  if (UD && (!L || !R)) {
    if (g.get(x + 1, y) === 0) return 19;
    return g.get(x - 1, y) === 0 ? 20 : 6;
  }
  if (U && !L && !D && !R) return 12;
  if (D && !L && !U && !R) return 13;
  if (!L && !R && !U && !D) return 17;
  return 0;
}

export function floorStyle(g, x, y) {
  const A = g.get(x, y - 1), Lf = g.get(x - 1, y), AL = g.get(x - 1, y - 1);
  if (A === 1 && Lf === 2 && AL === 2) return 26;
  if (A === 1 && Lf === 2 && AL === 1) return 27;
  if (AL === 1 && Lf === 2 && A === 2) return 28;
  if (A === 2 && Lf === 1 && AL === 2) return 29;
  if (A === 2 && Lf === 1 && AL === 1) return 30;
  if (Lf === 1 && A === 1 && AL === 1) return 31;
  if (Lf === 1 && A === 1 && AL === 2) return 32;
  return A !== 0 ? 1 : 0;
}

// ---------------- Random dungeon (rooms + corridors) ----------------
export class RNG {
  constructor(seed) { this.s = (seed >>> 0) || 1; }
  next() { let x = this.s; x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; this.s = x; return x / 4294967296; }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
}

// deep = number of walkable tiles wanted (from Lua GetMapConfig)
export function generateDungeon(deep, rng) {
  const side = Math.min(96, Math.max(18, Math.ceil(Math.sqrt(deep) * 2.4) + 6));
  const g = new Grid(side, side);
  let count = 0;
  const rooms = [];
  const carve = (x, y) => { if (g.get(x, y) !== FLOOR) { g.set(x, y, FLOOR); count++; } };
  const free = (x0, y0, x1, y1) => {
    if (x0 < 1 || y0 < 1 || x1 >= side - 1 || y1 >= side - 1) return false;
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (g.get(x, y) === FLOOR) return false;
    return true;
  };
  // first room in centre
  {
    const w = rng.int(3, 5), h = rng.int(3, 5);
    const x0 = (side >> 1) - (w >> 1), y0 = (side >> 1) - (h >> 1);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) carve(x, y);
    rooms.push({ x0, y0, x1: x0 + w - 1, y1: y0 + h - 1 });
  }
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  let tries = 0;
  while (count < deep && tries < 6000) {
    tries++;
    // pick a floor tile on the edge
    const x = rng.int(1, side - 2), y = rng.int(1, side - 2);
    if (!g.isFloor(x, y)) continue;
    const d = rng.pick(dirs);
    if (g.get(x + d[0], y + d[1]) !== WALL) continue;
    const sx = x + d[0], sy = y + d[1];
    if (rng.chance(0.55)) {
      // room
      const w = rng.int(2, 6), h = rng.int(2, 5);
      let x0, y0;
      if (d[0] === 0) { x0 = sx - rng.int(0, w - 1); y0 = d[1] < 0 ? sy - h + 1 : sy; }
      else { y0 = sy - rng.int(0, h - 1); x0 = d[0] < 0 ? sx - w + 1 : sx; }
      const x1 = x0 + w - 1, y1 = y0 + h - 1;
      // check region excluding entrance row
      let ok = true;
      for (let yy = y0 - 1; yy <= y1 + 1 && ok; yy++) for (let xx = x0 - 1; xx <= x1 + 1; xx++) {
        if (xx === x && yy === y) continue;
        if (xx < 1 || yy < 1 || xx >= side - 1 || yy >= side - 1) { ok = false; break; }
        if (g.get(xx, yy) === FLOOR && !(Math.abs(xx - x) + Math.abs(yy - y) <= 1)) { ok = false; break; }
      }
      if (!ok) continue;
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) carve(xx, yy);
      rooms.push({ x0, y0, x1, y1 });
    } else {
      // corridor
      const len = rng.int(3, 7);
      let ok = true; const cells = [];
      for (let i = 0; i < len; i++) {
        const cx = sx + d[0] * i, cy = sy + d[1] * i;
        if (cx < 2 || cy < 2 || cx >= side - 2 || cy >= side - 2) { ok = false; break; }
        // side cells must be walls (no touching other floors)
        const px = cx + d[1], py = cy + d[0], qx = cx - d[1], qy = cy - d[0];
        if (i > 0 && (g.isFloor(px, py) || g.isFloor(qx, qy) || g.isFloor(cx, cy))) { ok = false; break; }
        cells.push([cx, cy]);
      }
      if (!ok) continue;
      const ex = sx + d[0] * len, ey = sy + d[1] * len;
      if (g.isFloor(ex, ey)) { /* joins */ }
      cells.forEach(([cx, cy]) => carve(cx, cy));
    }
  }
  // trim bounding box
  let minx = side, miny = side, maxx = 0, maxy = 0;
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) if (g.isFloor(x, y)) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
  const pad = 2;
  const out = new Grid(maxx - minx + 1 + pad * 2, maxy - miny + 1 + pad * 2);
  for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) if (g.isFloor(x, y)) out.set(x - minx + pad, y - miny + pad, FLOOR);
  rooms.forEach(r => { r.x0 += pad - minx; r.x1 += pad - minx; r.y0 += pad - miny; r.y1 += pad - miny; });
  out.rooms = rooms;
  return out;
}

// BFS distances from (sx,sy) through passable tiles
export function bfs(g, sx, sy, passable = (x, y) => g.isFloor(x, y)) {
  const dist = new Int32Array(g.w * g.h).fill(-1);
  const q = [sx + sy * g.w]; dist[q[0]] = 0;
  for (let i = 0; i < q.length; i++) {
    const p = q[i], x = p % g.w, y = (p / g.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
      const np = nx + ny * g.w;
      if (dist[np] >= 0 || !passable(nx, ny)) continue;
      dist[np] = dist[p] + 1; q.push(np);
    }
  }
  return dist;
}
// A* / BFS path; returns array of [x,y] excluding start
export function findPath(g, sx, sy, tx, ty, passable) {
  if (sx === tx && sy === ty) return [];
  const W = g.w;
  const prev = new Int32Array(g.w * g.h).fill(-1);
  const seen = new Uint8Array(g.w * g.h);
  const q = [sx + sy * W]; seen[q[0]] = 1;
  const target = tx + ty * W;
  for (let i = 0; i < q.length; i++) {
    const p = q[i]; if (p === target) break;
    const x = p % W, y = (p / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
      const np = nx + ny * W; if (seen[np]) continue;
      if (np !== target && !passable(nx, ny)) continue;
      if (np === target && !passable(nx, ny)) continue;
      seen[np] = 1; prev[np] = p; q.push(np);
    }
  }
  if (!seen[target]) return null;
  const path = []; let p = target;
  while (p !== sx + sy * W) { path.push([p % W, (p / W) | 0]); p = prev[p]; }
  return path.reverse();
}
