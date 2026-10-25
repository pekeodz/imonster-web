// Story / tutorial runner: executes the ORIGINAL lua/story.lua, subplots.lua and encounter.lua
// (coroutine based: Dialog / Sleep yield, we resume via OnDialogEnd / __fireDelay).
import { DB, S, richText } from '../engine/db.js';
import { Lua } from '../engine/lua.js';
import { Audio2 } from '../engine/audio.js';
import { P, stats, addItem, save, removeItem, bagFull } from './profile.js';
import { makeAny, itemRecord } from './items.js';
import { combatSlots } from './skills.js';
import { h } from '../ui/ui.js';

let G = null;           // game
let dialogEl = null;    // current dialog element
const st = () => (P.data.story ||= { fin: {}, data: {}, func: {} });

export const StoryHost = {
  // ---- coroutine plumbing
  Delay: (id, ms) => { setTimeout(() => { try { Lua.call('__fireDelay', id); } catch (e) { console.warn(e); } }, ms); },
  RegisterCoroutine: () => null, UnregisterCoroutine: () => null, EnableSave: () => null, Record: () => null,
  EnableVeil: e => { if (G) G.veil = !!e; return null; },
  SetPlayerOperable: e => { if (G) G.locked = !e; return null; },
  SetDialogCanTouch: () => null, ShowMask: () => null, HideMask: () => null, ShowNode: () => null, HideNode: () => null, NodeAnimate: () => null,
  MoveCamera: () => null, PauseRunningActions: () => null, ResumeActions: () => null,
  CloseWindowViews: () => { G?.ui.closeModals(); return null; },
  StopPlayerAction: () => { const h0 = G?.tower?.hero; if (h0) h0.path = null; return null; },
  NewIncID: (() => { let n = 1; return () => n++; })(),
  ScheduelSystemTimer: () => 0, CancelSystemTimer: () => null,
  JsonToTable: s => { try { return JSON.parse(s); } catch (e) { return {}; } },
  TableToJson: t => JSON.stringify(t || {}),
  // ---- dialogs
  Dialog: (dir, head, talker, word, speed, sel1, sel2) => { showDialog(dir, head, talker, word, sel1, sel2); return null; },
  HideDialog: () => { hideDialog(); return null; },
  MessageOkCancel: (content, title) => { G.ui.confirm(content, () => Lua.call('OnMessageEnd', 1), () => Lua.call('OnMessageEnd', 2)); return null; },
  FloatMessage: msg => { G?.ui.toast(msg); return null; },
  // ---- story state
  IsStoryFinished: id => !!st().fin[id],
  SetStoryFinished: (id, fin) => { if (fin) st().fin[id] = 1; else delete st().fin[id]; return null; },
  GetStoryData: k => st().data[k] ?? null,
  SetStoryData: (k, v) => { if (v == null) delete st().data[k]; else st().data[k] = v; return null; },
  SetFunctionUnlock: (f, b) => { st().func[f] = b ? 1 : 0; return null; },
  IsFunctionUnlock: f => st().func[f] !== 0,
  SetStoryTask: () => null, ResetStoryTask: () => null, IsStoryTaskExist: () => false, RefreshShop: () => { if (G) G.ui.stock = null; return null; },
  // ---- player & items
  GetMyPlayer: () => {
    const p = P.data, s = stats(); const sl = combatSlots(); const hero = G?.tower?.hero;
    return { lv: p.level, cur_hp: p.hp, max_hp: s.max_hp, cur_mp: p.mp, max_mp: s.max_mp, cur_skpt: p.skillPoints,
      fight_skill1: sl[0] || null, fight_skill2: sl[1] || null, fight_skill3: sl[2] || null, fight_skill4: sl[3] || null,
      cur_red: p.red, cur_blue: p.blue, power: p.power || 0, x: hero?.wx || 0, y: hero?.wy || 0 };
  },
  GetCurMap: () => { const t = G?.tower; return t ? { id: t.mapId, lv: t.level, floor: t.floor } : { id: 0, lv: 1, floor: 0 }; },
  IsPackageFull: () => bagFull(),
  GetPackageSpace: () => P.data.bagSize - P.data.inventory.length,
  GetItemsWithPage: page => {
    const toT = it => { const r = itemRecord(it); return { id: it.id, type: +r?.Type || 0, quality: it.eq ? it.q : (+r?.Quality || 1), attr_lv: it.lv || 1, is_new: !!it.isNew }; };
    if (page === 0) return Object.values(P.data.equipped).map(toT);
    return P.data.inventory.slice((page - 1) * 20, page * 20).map(toT);
  },
  GetItemCount: id => P.data.inventory.filter(x => x.id === id).reduce((a, x) => a + (x.n || 1), 0),
  AddItemToPackage: (id, _, n) => { n = n || 1; for (let i = 0; i < n; i++) { const it = makeAny(id, G?.tower?.level || P.data.level); if (it && addItem(it)) G?.ui.loot(it); } return null; },
  RemoveItemFromPackage: (id, n) => { n = n || 1; for (const it of [...P.data.inventory]) { if (n <= 0) break; if (it.id === id) { const take = Math.min(n, it.n || 1); removeItem(it.uid, take); n -= take; } } return null; },
  AddGold: n => { P.data.gold += n | 0; G?.ui.toast(`+${n} vàng`); return null; },
  AddDiamond: n => { P.data.diamond = (P.data.diamond || 0) + (n | 0); return null; },
  AddSkillPoint: n => { P.data.skillPoints += n || 1; G?.ui.toast(`+${n || 1} điểm kỹ năng`); return null; },
  SupplyPower: () => { P.data.power = 100; G?.ui.hud(G.tower); return null; },
  SupplyBottle: () => { G?.refillPots(); G?.ui.hud(G.tower); return null; },
  GetMapTemplate: id => DB.map.get(id) || null,
  GetItemTemplate: id => DB.item.get(id) || DB.equip.get(id) || null,
  // ---- audio
  PlayBGM: n => { Audio2.playBGM(String(n).replace(/^.*\//, '').replace(/\.mp3$/, '')); return null; },
  PlaySound: n => { Audio2.play(String(n).replace(/^.*\//, '').replace(/\.(wav|mp3)$/, '')); return null; },
  StopSound: () => null, PauseBGM: () => { Audio2.bgm?.pause(); return null; }, ResumeBGM: () => { Audio2.bgm?.play().catch(() => { }); return null; },
  // ---- tower
  FindRoundMonster: () => { const t = G?.tower; if (!t) return null; const m = t.nearestMonster(); return m ? { x: m.wx, y: m.wy, id: m.id } : null; },
  FindRoundSpace: () => { const t = G?.tower; if (!t) return null; const c = t.freeTileNear(t.hero.x, t.hero.y, 1, 3); return c ? { col: c[0], row: c[1] } : null; },
  GetMonsterCount: () => { const t = G?.tower; if (!t) return Lua.multi(0, 0, 0, 0); const a = t.units.filter(u => !u.isHero && u.alive); return Lua.multi(a.length, a.filter(u => u.rank === 1).length, a.filter(u => u.rank === 2 || u.rank === 3).length, a.filter(u => u.rank >= 4).length); },
  AddMonster: (id, rank, lvOff, col, row) => { G?.tower?.spawnMonster(id, rank || 1, lvOff || 0, col, row); return null; },
  AddMapObject: (type, name, param, col, row) => { G?.tower?.addScriptObject(type, name, param, col, row); return null; },
  BreakMapObject: (name) => { G?.tower?.removeScriptObject(name); return null; },
  FindMapObject: name => { const o = G?.tower?.objects.find(o => o.name === name); return o ? { col: o.x, row: o.y } : null; },
  VisibleMapObject: () => null,
  LeaveTower: () => { G?.toCamp(true); return null; },
  TeleportTower: id => { if (DB.map.has(+id)) G?.enterTower(+id); return null; },
  OpenTower: () => { G?.ui.floorSelect(); return null; },
};

export function installStory(game) {
  G = game;
  Lua.exec(`
    APP_DIS = true
    __delays = {}; __delayId = 0
    function DelayCall(ms, obj, fn, arg) __delayId = __delayId + 1; __delays[__delayId] = {fn, arg}; sw.Delay(__delayId, ms) end
    function __fireDelay(id) local d = __delays[id]; __delays[id] = nil; if d then d[1](d[2]) end end
    SysTimer = SysTimer or { OnReach = function() end }
    -- test scripts (ids >= 900000) are disabled
    for i, v in pairs(g_stories) do if i >= 900000 then g_stories[i] = nil end end
    OnOpen()
  `, 'storyglue');
}
export function story(moment, data = {}) {
  if (!G || !P.data) return;
  try { Lua.call('TriggerStory', moment, data); } catch (e) { console.warn('story', moment, e); }
}

function charImg(head) {
  if (!head) return '';
  const n = String(head).replace(/^image\//, '').replace(/\.png$/, '');
  return 'assets/img/' + n + '.webp';
}
function showDialog(dir, head, talker, word, sel1, sel2) {
  hideDialog();
  G.storyBusy = true;
  const finish = sel => { hideDialog(); G.storyBusy = false; Audio2.play('ui-001', 0.5); try { Lua.call('OnDialogEnd', sel); } catch (e) { console.warn(e); } };
  const opts = (sel1 && sel1 !== '') ? h('div', { class: 'dlgopts' },
    h('button', { class: 'btn small green', onclick: e => { e.stopPropagation(); finish(1); } }, sel1),
    sel2 ? h('button', { class: 'btn small red', onclick: e => { e.stopPropagation(); finish(2); } }, sel2) : null) : null;
  dialogEl = h('div', { class: 'dialog ' + (dir === 'right' ? 'right' : 'left'), onclick: () => { if (!opts) finish(1); } },
    head ? h('img', { class: 'portrait', src: charImg(head), onerror: function () { this.style.display = 'none'; } }) : null,
    h('div', { class: 'dlgbox' }, h('div', { class: 'who' }, talker || ''), h('div', { class: 'txt', html: richText(word || '') }), opts || h('div', { class: 'next' }, '▼')));
  G.ui.root.append(dialogEl);
}
function hideDialog() { if (dialogEl) { dialogEl.remove(); dialogEl = null; } if (G) G.storyBusy = false; }
