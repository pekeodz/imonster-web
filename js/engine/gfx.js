// WebGL renderer built on spine-webgl's SceneRenderer.
// World coordinates are y-up (like Cocos2d). Units: pixels of the original art (tile = 100).
import { DB } from './db.js';
import { loadGLTexture } from './spinekit.js';

const C = new spine.Color(1, 1, 1, 1);
export class Gfx {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = new spine.webgl.ManagedWebGLRenderingContext(canvas, { alpha: false, preserveDrawingBuffer: false, antialias: false });
    this.r = new spine.webgl.SceneRenderer(canvas, this.ctx, true);
    this.r.skeletonRenderer.premultipliedAlpha = false;
    this.cam = this.r.camera;
    this.zoom = 1;
    this.sheets = {}; // key -> {tex, frames}
    this.textures = {};
    this.quad = new Float32Array(4 * 12);
    this.width = 750; this.height = 1334;
  }
  get gl() { return this.ctx.gl; }
  resize(w, h, dpr) {
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.cssW = w; this.cssH = h;
  }
  // logical view size in world units
  setView(cx, cy, viewW, viewH) {
    this.cam.position.x = cx; this.cam.position.y = cy;
    this.cam.viewportWidth = viewW; this.cam.viewportHeight = viewH;
    this.viewW = viewW; this.viewH = viewH; this.cx = cx; this.cy = cy;
    this.cam.update();
  }
  screenToWorld(sx, sy) { // css px -> world
    return { x: this.cx + (sx / this.cssW - 0.5) * this.viewW, y: this.cy - (sy / this.cssH - 0.5) * this.viewH };
  }
  worldToScreen(wx, wy) {
    return { x: ((wx - this.cx) / this.viewW + 0.5) * this.cssW, y: (0.5 - (wy - this.cy) / this.viewH) * this.cssH };
  }
  async loadSheet(key) { // key like 'map/tile-1'
    if (this.sheets[key]) return this.sheets[key];
    const info = DB.frames[key]; if (!info) throw new Error('no sheet ' + key);
    const tex = await loadGLTexture('assets/img/' + info.page + '.webp');
    const img = tex.getImage();
    return (this.sheets[key] = { tex, W: img.width, H: img.height, frames: info.frames });
  }
  async loadTex(path) { // 'map/floor'
    if (!this.textures[path]) this.textures[path] = await loadGLTexture('assets/img/' + path + '.webp');
    return this.textures[path];
  }
  tex(path) { return this.textures[path]; }
  frame(key, name) {
    const s = this.sheets[key]; if (!s) return null;
    const f = s.frames[name]; if (!f) return null;
    return { s, f };
  }
  begin(bg = [0, 0, 0]) {
    const gl = this.gl;
    gl.clearColor(bg[0], bg[1], bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT);
    this.r.begin();
  }
  end() { this.r.end(); }

  _quad(tex, x0, y0, x1, y1, uvs, color) {
    const q = this.quad; const c = color || C;
    // uvs: [u,v] for corners BL, BR, TR, TL
    const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    let i = 0;
    for (let k = 0; k < 4; k++) {
      q[i++] = pts[k][0]; q[i++] = pts[k][1];
      q[i++] = c.r; q[i++] = c.g; q[i++] = c.b; q[i++] = c.a;
      q[i++] = uvs[k * 2]; q[i++] = uvs[k * 2 + 1];
      q[i++] = 0; q[i++] = 0; q[i++] = 0; q[i++] = 0;
    }
    this.r.enableRenderer(this.r.batcher);
    this.r.batcher.draw(tex, q, this.r.QUAD_TRIANGLES);
  }
  // draw a sprite frame. (x,y)=anchor position in world. ax/ay anchor in source size (0..1, y from bottom)
  drawFrame(key, name, x, y, o = {}) {
    const fr = this.frame(key, name); if (!fr) return false;
    const { s, f } = fr;
    const [fx, fy, fw, fh, ox, oy, sw, sh, rot] = f;
    const sc = o.scale ?? 1, sx = (o.flip ? -1 : 1) * sc * (o.scaleX ?? 1), sy = sc * (o.scaleY ?? 1);
    const ax = o.ax ?? 0.5, ay = o.ay ?? 0.5;
    // trimmed rect in source coords (y-down from top) -> local y-up
    const lx0 = ox - ax * sw, lx1 = lx0 + fw;
    const ly1 = (sh - oy) - ay * sh, ly0 = ly1 - fh;
    let x0 = x + lx0 * sx, x1 = x + lx1 * sx, y0 = y + ly0 * sy, y1 = y + ly1 * sy;
    let uvs;
    const W = s.W, H = s.H;
    const e = 0.5; // half-texel inset to avoid bleeding from neighbouring frames
    if (!rot) {
      const u = (fx + e) / W, v = (fy + e) / H, u2 = (fx + fw - e) / W, v2 = (fy + fh - e) / H;
      uvs = [u, v2, u2, v2, u2, v, u, v];
    } else {
      // packed rotated 90° CW: rect in texture is (fx,fy, fh, fw)
      const u = (fx + e) / W, v = (fy + e) / H, u2 = (fx + fh - e) / W, v2 = (fy + fw - e) / H;
      // original TL->(u2,v) TR->(u2,v2) BR->(u,v2) BL->(u,v)
      uvs = [u, v, u, v2, u2, v2, u2, v];
    }
    if (sx < 0) { [x0, x1] = [x1, x0]; uvs = [uvs[2], uvs[3], uvs[0], uvs[1], uvs[6], uvs[7], uvs[4], uvs[5]]; }
    this._quad(s.tex, x0, y0, x1, y1, uvs, o.color);
    return true;
  }
  // draw a sprite frame with an affine matrix m=[a,b,c,d,tx,ty] applied to its content space
  // (origin = bottom-left of the untrimmed frame, y-up)
  drawFrameM(key, name, m, color) {
    const fr = this.frame(key, name); if (!fr) return false;
    const { s, f } = fr;
    const [fx, fy, fw, fh, ox, oy, sw, sh, rot] = f;
    const lx0 = ox, lx1 = ox + fw, ly1 = sh - oy, ly0 = ly1 - fh;
    const P = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    const pts = [P(lx0, ly0), P(lx1, ly0), P(lx1, ly1), P(lx0, ly1)];
    const W = s.W, H = s.H, e = 0.5;
    let uvs;
    if (!rot) { const u = (fx + e) / W, v = (fy + e) / H, u2 = (fx + fw - e) / W, v2 = (fy + fh - e) / H; uvs = [u, v2, u2, v2, u2, v, u, v]; }
    else { const u = (fx + e) / W, v = (fy + e) / H, u2 = (fx + fh - e) / W, v2 = (fy + fw - e) / H; uvs = [u, v, u, v2, u2, v2, u2, v]; }
    this._quad4(s.tex, pts, uvs, color);
    return true;
  }
  _quad4(tex, pts, uvs, color) {
    const q = this.quad; const c = color || C; let i = 0;
    for (let k = 0; k < 4; k++) {
      q[i++] = pts[k][0]; q[i++] = pts[k][1]; q[i++] = c.r; q[i++] = c.g; q[i++] = c.b; q[i++] = c.a;
      q[i++] = uvs[k * 2]; q[i++] = uvs[k * 2 + 1]; q[i++] = 0; q[i++] = 0; q[i++] = 0; q[i++] = 0;
    }
    this.r.enableRenderer(this.r.batcher);
    this.r.batcher.draw(tex, q, this.r.QUAD_TRIANGLES);
  }
  setAdditive(on) {
    const gl = this.gl;
    this.r.enableRenderer(this.r.batcher);
    this.r.batcher.setBlendMode(gl.SRC_ALPHA, on ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
  }
  // draw a whole texture. (x,y) = anchor pos
  drawTex(tex, x, y, o = {}) {
    if (!tex) return;
    const img = tex.getImage();
    const w = (o.w ?? img.width) * (o.scale ?? 1), h = (o.h ?? img.height) * (o.scale ?? 1);
    const ax = o.ax ?? 0.5, ay = o.ay ?? 0.5;
    const x0 = x - ax * w, y0 = y - ay * h;
    this._quad(tex, x0, y0, x0 + w, y0 + h, [0, 1, 1, 1, 1, 0, 0, 0], o.color);
  }
  drawRect(x, y, w, h, color) {
    // uses the white pixel of any texture: draw with a tiny white texture
    if (!this.white) return;
    this._quad(this.white, x, y, x + w, y + h, [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], color);
  }
  drawSkeleton(sk) { this.r.drawSkeleton(sk, false); }
  makeWhite() {
    const c = document.createElement('canvas'); c.width = c.height = 4;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 4, 4);
    this.white = new spine.webgl.GLTexture(this.ctx, c);
  }
}
export function rgba(r, g, b, a = 1) { return new spine.Color(r, g, b, a); }
