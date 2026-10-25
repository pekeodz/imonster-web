// Simple audio: BGM via <audio>, SFX via WebAudio buffers.
export const Audio2 = {
  musicVol: 0.6, soundVol: 0.8, bgm: null, bgmName: '', ctx: null, buffers: new Map(), unlocked: false,
  init(settings) {
    this.musicVol = settings?.music ?? 0.6; this.soundVol = settings?.sound ?? 0.8;
    this.ensureCtx();
    const unlock = () => {
      if (this.unlocked) return; this.unlocked = true;
      this.ensureCtx(); try { this.ctx?.resume(); } catch (e) { }
      if (this.bgmName) { const n = this.bgmName; this.bgmName = ''; this.playBGM(n); }
    };
    window.addEventListener('pointerdown', unlock, { once: false, capture: true });
    window.addEventListener('keydown', unlock, { once: false, capture: true });
  },
  playBGM(name) {
    if (!name || name === this.bgmName) return;
    this.bgmName = name;
    if (!this.unlocked) return;
    if (this.bgm) { const old = this.bgm; this.fade(old, 0, 400, () => old.pause()); }
    const a = new window.Audio('assets/audio/bgm/' + name + '.mp3');
    a.loop = true; a.volume = 0; a.play().catch(() => { });
    this.bgm = a; this.fade(a, this.musicVol, 600);
  },
  fade(a, to, ms, done) {
    const from = a.volume, t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / ms); a.volume = from + (to - from) * k; if (k < 1) requestAnimationFrame(step); else done && done(); };
    step();
  },
  setMusic(v) { this.musicVol = v; if (this.bgm) this.bgm.volume = v; },
  setSound(v) { this.soundVol = v; },
  ensureCtx() { if (!this.ctx) try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } return this.ctx; },
  // fetch + decode ahead of time so the first hit of every sound is on time
  async load(name) {
    if (this.buffers.has(name)) return this.pending?.get(name);
    this.pending ||= new Map();
    const pr = (async () => {
      try {
        const r = await fetch('assets/audio/sound/' + name + '.mp3'); if (!r.ok) { this.buffers.set(name, null); return; }
        const ab = await r.arrayBuffer();
        const buf = await new Promise((res, rej) => this.ensureCtx().decodeAudioData(ab, res, rej));
        this.buffers.set(name, buf);
      } catch (e) { this.buffers.set(name, null); }
    })();
    this.buffers.set(name, undefined); this.pending.set(name, pr);
    return pr;
  },
  async preload(names, onProgress) {
    let done = 0; const q = [...names];
    const worker = async () => { while (q.length) { await this.load(q.shift()); done++; onProgress && onProgress(done / names.length); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
  },
  async play(name, vol = 1) {
    if (!name || !this.ctx || this.soundVol <= 0 || !this.unlocked) return;
    name = String(name).split(',')[Math.floor(Math.random() * String(name).split(',').length)].trim();
    try {
      let buf = this.buffers.get(name);
      if (buf === null) return;
      if (!buf) { await this.load(name); buf = this.buffers.get(name); if (!buf) return; }
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const g = this.ctx.createGain(); g.gain.value = this.soundVol * vol;
      src.connect(g); g.connect(this.ctx.destination); src.start();
    } catch (e) { }
  },
};
