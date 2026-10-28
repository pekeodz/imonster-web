// Thin wrapper around Fengari to run the ORIGINAL game scripts (lua/*.lua)
// and call their formula functions with JS objects.
const F = window.fengari;
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = F;
let L = null;

function push(L, v) {
  if (v === null || v === undefined) lua.lua_pushnil(L);
  else if (typeof v === 'number') { Number.isInteger(v) ? lua.lua_pushinteger(L, v) : lua.lua_pushnumber(L, v); }
  else if (typeof v === 'boolean') lua.lua_pushboolean(L, v);
  else if (typeof v === 'string') lua.lua_pushstring(L, to_luastring(v));
  else if (Array.isArray(v)) {
    lua.lua_createtable(L, v.length, 0);
    v.forEach((x, i) => { push(L, x); lua.lua_rawseti(L, -2, i + 1); });
  } else if (typeof v === 'object') {
    lua.lua_newtable(L);
    for (const k in v) { push(L, v[k]); lua.lua_setfield(L, -2, to_luastring(k)); }
  } else if (typeof v === 'function') {
    lua.lua_pushjsfunction(L, (L2) => {
      const n = lua.lua_gettop(L2); const args = [];
      for (let i = 1; i <= n; i++) args.push(read(L2, i));
      const r = v(...args); push(L2, r); return 1;
    });
  } else lua.lua_pushnil(L);
}
function read(L, idx, depth = 0) {
  const t = lua.lua_type(L, idx);
  switch (t) {
    case lua.LUA_TNIL: case lua.LUA_TNONE: return null;
    case lua.LUA_TNUMBER: return lua.lua_tonumber(L, idx);
    case lua.LUA_TBOOLEAN: return lua.lua_toboolean(L, idx);
    case lua.LUA_TSTRING: return lua.lua_tojsstring(L, idx);
    case lua.LUA_TTABLE: {
      if (depth > 6) return {};
      idx = lua.lua_absindex(L, idx);
      const o = {}; let isArr = true, n = 0;
      lua.lua_pushnil(L);
      while (lua.lua_next(L, idx) !== 0) {
        const kt = lua.lua_type(L, -2);
        let k;
        if (kt === lua.LUA_TNUMBER) k = lua.lua_tonumber(L, -2); else { k = lua.lua_tojsstring(L, -2); isArr = false; }
        o[k] = read(L, -1, depth + 1); n++;
        lua.lua_pop(L, 1);
      }
      if (isArr && n > 0) { const a = []; for (let i = 1; i <= n; i++) { if (!(i in o)) return o; a.push(o[i]); } return a; }
      return o;
    }
    default: return null;
  }
}

export const Lua = {
  ready: false,
  async init(files, sw) {
    L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    // host API table `sw`
    lua.lua_newtable(L);
    for (const k in sw) {
      const fn = sw[k];
      if (fn && fn.__raw) { lua.lua_pushjsfunction(L, fn.__raw); lua.lua_setfield(L, -2, to_luastring(k)); continue; }
      lua.lua_pushjsfunction(L, (L2) => {
        const n = lua.lua_gettop(L2); const args = [];
        for (let i = 1; i <= n; i++) args.push(read(L2, i));
        let r;
        try { r = fn(...args); } catch (e) { console.error('sw.' + k, e); r = null; }
        if (Array.isArray(r) && r.__multi) { r.forEach(x => push(L2, x)); return r.length; }
        push(L2, r); return 1;
      });
      lua.lua_setfield(L, -2, to_luastring(k));
    }
    lua.lua_setglobal(L, to_luastring('sw'));
    this.exec(`print = function(...) end`, 'pre');
    for (const f of files) {
      const src = await fetch('lua/' + f + '.lua').then(r => r.text());
      this.exec(src, f);
    }
    this.ready = true;
  },
  exec(code, name = 'chunk') {
    if (lauxlib.luaL_loadbuffer(L, to_luastring(code), null, to_luastring(name)) !== 0) {
      console.error('lua load', lua.lua_tojsstring(L, -1)); lua.lua_pop(L, 1); return false;
    }
    if (lua.lua_pcall(L, 0, 0, 0) !== 0) { console.error('lua run', name, lua.lua_tojsstring(L, -1)); lua.lua_pop(L, 1); return false; }
    return true;
  },
  // call(name, ...args) -> array of results
  depth: 0,
  call(name, ...args) {
    // nested calls (JS callback invoked from inside Lua, e.g. a coroutine) run on a fresh thread
    if (this.depth > 0) {
      const top0 = lua.lua_gettop(L);
      const th = lua.lua_newthread(L);
      try { return this._call(th, name, args); } finally { lua.lua_settop(L, top0); }
    }
    return this._call(L, name, args);
  },
  _call(L, name, args) {
    this.depth++;
    try { return this.__call(L, name, args); } finally { this.depth--; }
  },
  __call(L, name, args) {
    const top = lua.lua_gettop(L);
    // support dotted names: a.b
    const parts = name.split('.');
    lua.lua_getglobal(L, to_luastring(parts[0]));
    for (let i = 1; i < parts.length; i++) { lua.lua_getfield(L, -1, to_luastring(parts[i])); lua.lua_remove(L, -2); }
    if (lua.lua_type(L, -1) !== lua.LUA_TFUNCTION) { lua.lua_settop(L, top); return null; }
    for (const a of args) push(L, a);
    if (lua.lua_pcall(L, args.length, lua.LUA_MULTRET, 0) !== 0) {
      console.error('lua call', name, lua.lua_tojsstring(L, -1)); lua.lua_settop(L, top); return null;
    }
    const n = lua.lua_gettop(L) - top; const out = [];
    for (let i = 1; i <= n; i++) out.push(read(L, top + i));
    lua.lua_settop(L, top);
    return out;
  },
  get(name) {
    lua.lua_getglobal(L, to_luastring(name)); const v = read(L, -1); lua.lua_pop(L, 1); return v;
  },
  // raw host function: receives the lua_State directly (needed for integer/float subtype checks)
  raw(f) { return { __raw: f }; },
  multi(...vals) { vals.__multi = true; return vals; },
};
