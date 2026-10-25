// Daily tasks + battle-pass points, based on bptask.csv (RequireNum / Score).
import { DB, S } from '../engine/db.js';
import { P, addItem, addExp } from './profile.js';
import { makeItem } from './items.js';

// task types used offline (ads / lottery tasks of the original are replaced)
const TYPE_INFO = {
  1: { vi: 'Bắt đầu một chuyến leo tháp', need: r => r.RequireNum },
  2: { vi: 'Vượt qua {n} tầng', need: r => r.RequireNum },
  3: { vi: 'Đập {n} thùng / vò', need: r => r.RequireNum },
  4: { vi: 'Mở {n} rương', need: r => r.RequireNum },
  5: { vi: 'Nhặt {n} trang bị xanh trở lên', need: r => Math.min(10, r.RequireNum) },
  6: { vi: 'Kiếm {n} vàng', need: r => r.RequireNum },
  7: { vi: 'Hạ {n} quái tinh anh', need: r => Math.min(10, r.RequireNum) },
  8: { vi: 'Hạ {n} quái', need: r => r.RequireNum * 6 },
  9: { vi: 'Đi qua {n} ô bẫy an toàn', need: r => 10 },
};
export const BP_TIERS = [ // battle pass milestones (points -> reward)
  { pts: 20, gold: 2000, item: 400040 },
  { pts: 40, dia: 30, item: 400060 },
  { pts: 60, gold: 8000, item: 400041 },
  { pts: 80, dia: 60, item: 400061 },
];
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

export const Daily = {
  ensure() {
    const p = P.data; if (!p) return;
    if (p.daily?.date === today()) return p.daily;
    const rows = DB.bptaskRows.filter(r => TYPE_INFO[r.Type]);
    const byType = {}; rows.forEach(r => (byType[r.Type] ||= []).push(r));
    const types = Object.keys(byType).map(Number).sort(() => Math.random() - 0.5).slice(0, 5);
    if (!types.includes(1)) types[0] = 1;
    const tasks = types.map(t => { const r = byType[t][Math.floor(Math.random() * byType[t].length)]; return { id: r.ID, type: t, need: TYPE_INFO[t].need(r), prog: 0, score: +r.Score || 5, done: false, claimed: false }; });
    p.daily = { date: today(), tasks, bp: 0, bpClaimed: [] };
    return p.daily;
  },
  text(tk) { return TYPE_INFO[tk.type].vi.replace('{n}', tk.need.toLocaleString('vi-VN')); },
  progress(type, n = 1) {
    const d = this.ensure(); if (!d) return;
    for (const tk of d.tasks) {
      if (tk.type !== type || tk.done) continue;
      tk.prog = Math.min(tk.need, tk.prog + n);
      if (tk.prog >= tk.need) { tk.done = true; this.onDone?.(tk); }
    }
  },
  claim(tk) {
    const p = P.data; if (!tk.done || tk.claimed) return null;
    tk.claimed = true; p.daily.bp += tk.score;
    const gold = 300 * p.level + tk.score * 50; p.gold += gold;
    const exp = Math.round((DB.mstat[Math.min(200, p.level) * 10 + 2]?.Exp || 50) * tk.score / 2); addExp(exp);
    const dia = Math.ceil(tk.score / 5); p.diamond = (p.diamond || 0) + dia;
    return { gold, exp, dia };
  },
  claimTier(i) {
    const p = P.data, d = p.daily, t = BP_TIERS[i];
    if (!t || d.bp < t.pts || d.bpClaimed.includes(i)) return null;
    d.bpClaimed.push(i);
    if (t.gold) p.gold += t.gold; if (t.dia) p.diamond = (p.diamond || 0) + t.dia;
    if (t.item) addItem(makeItem(t.item, 1));
    return t;
  },
};
