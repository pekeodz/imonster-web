// SOURCE-EXACT host RNG (reversed from libMyGame.so 1.4.1, ScriptExecutor::Lrand / LSuccessRandom).
// sw.randi and sw.rand are BOTH registered to Lrand in the native luaL_Reg table.
const F = window.fengari;
const { lua, lauxlib } = F;
const f32 = Math.fround;
const F1E5 = f32(1e-5);              // 0x3727c5ac
// arc4random(): uniform uint32
const buf = new Uint32Array(256); let bi = 256;
export function arc4random() {
  if (bi >= 256) { crypto.getRandomValues(buf); bi = 0; }
  return buf[bi++];
}
// (arc4random() % 100001) * 1e-5f  -> f32 in [0, 1]
function unit01() { return f32(f32(arc4random() % 100001) * F1E5); }

// Lrand(L): both args integer subtype -> [min,max] inclusive integer, else float in [min,max]
export function Lrand(L) {
  if (lua.lua_isinteger(L, 1) && lua.lua_isinteger(L, 2)) {
    const a = Number(lua.lua_tointegerx(L, 1)) | 0, b = Number(lua.lua_tointegerx(L, 2)) | 0;   // native uses w-registers (int32)
    const lo = a > b ? b : a, hi = a > b ? a : b;
    const n = (hi - lo + 1) >>> 0;
    const u = arc4random();
    const r = n === 0 ? u : u % n;                                         // udiv by 0 -> 0 on ARM64
    lua.lua_pushinteger(L, (lo + r) | 0);
    return 1;
  }
  const a = f32(lauxlib.luaL_checknumber(L, 1)), b = f32(lauxlib.luaL_checknumber(L, 2));
  const lo = a > b ? b : a, hi = a < b ? b : a;
  const v = f32(lo + f32(f32(hi - lo) * unit01()));
  lua.lua_pushnumber(L, v);
  return 1;
}
// LSuccessRandom(L): unit01() <= f32(p * 0.01f)
const K = 0.009999999776482582;        // (double) 0.01f
export function LSuccessRandom(L) {
  const thr = f32(lauxlib.luaL_checknumber(L, 1) * K);
  lua.lua_pushboolean(L, unit01() <= thr);
  return 1;
}
