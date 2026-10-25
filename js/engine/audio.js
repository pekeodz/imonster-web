// Simple audio: BGM via <audio>, SFX via WebAudio buffers.
export const Audio2 = {
  musicVol: 0.6, soundVol: 0.8, bgm: null, bgmName: '', ctx: null, buffers: new Map(), unlocked: false,
  init(settings) {
    this.musicVol = settings?.music ?? 0.6; this.soundVol = settings?.sound ?? 0.8;
    const unlock = () => {
      if (this.unlocked) return; this.unlocked = true;
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
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
  async play(name, vol = 1) {
    if (!name || !this.ctx || this.soundVol <= 0) return;
    name = String(name).split(',')[Math.floor(Math.random() * String(name).split(',').length)].trim();
    try {
      let buf = this.buffers.get(name);
      if (buf === null) return;
      if (!buf) {
        this.buffers.set(name, null);
        const r = await fetch('assets/audio/sound/' + name + '.mp3'); if (!r.ok) return;
        buf = await this.ctx.decodeAudioData(await r.arrayBuffer());
        this.buffers.set(name, buf);
      }
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const g = this.ctx.createGain(); g.gain.value = this.soundVol * vol;
      src.connect(g); g.connect(this.ctx.destination); src.start();
    } catch (e) { }
  },
};
