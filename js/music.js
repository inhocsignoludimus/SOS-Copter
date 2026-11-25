// SOS Copter — música de elevador (bossa lounge original, sintetizada em tempo real)
// Composição original. 16 compassos em Sol maior, 100 bpm; cada volta muda o instrumento da melodia.
let musicG = null, musicOn = false, musNext = 0, musStep = 0, musLoop = 0, musTimer = null, musVerb = null, musTrem = null;
const MUS_BPM = 100, MUS_16 = 60/MUS_BPM/4;
// [baixo, acorde] por compasso (MIDI)
const MUS_CH = [
  [43, [55, 59, 62, 66]], [40, [55, 59, 62, 64]], [45, [55, 57, 60, 64]], [38, [54, 57, 60, 64]], // Gmaj7  Em7  Am7  D7
  [47, [54, 57, 59, 62]], [40, [56, 59, 62, 64]], [45, [55, 57, 60, 64]], [38, [54, 57, 60, 64]], // Bm7    E7   Am7  D7
  [48, [55, 59, 60, 64]], [48, [55, 57, 60, 63]], [47, [54, 57, 59, 62]], [40, [56, 59, 62, 64]], // Cmaj7  Cm6  Bm7  E7
  [45, [55, 57, 60, 64]], [38, [54, 57, 60, 64]], [43, [54, 59, 62, 66]], [45, [55, 57, 60, 64], 38, [54, 57, 60, 64]] // Am7 D7 Gmaj7 | Am7-D7
];
// melodia: [passo (16 avos), nota, duração]
const MUS_MEL = [
  [[0, 71, 4], [4, 69, 2], [6, 71, 2], [8, 74, 6]], [[0, 71, 2], [2, 67, 6]],
  [[0, 72, 4], [4, 71, 2], [6, 72, 2], [8, 76, 6]], [[0, 74, 2], [2, 72, 2], [4, 69, 6], [12, 66, 4]],
  [[0, 69, 4], [4, 66, 2], [6, 69, 2], [8, 74, 4], [12, 71, 4]], [[0, 68, 6], [6, 71, 2], [8, 74, 4], [12, 76, 4]],
  [[0, 72, 6], [6, 71, 2], [8, 69, 4], [12, 67, 4]], [[0, 66, 8], [8, 69, 2], [10, 72, 6]],
  [[0, 76, 6], [6, 74, 2], [8, 71, 8]], [[0, 75, 6], [6, 74, 2], [8, 72, 8]],
  [[0, 74, 4], [4, 71, 2], [6, 69, 2], [8, 66, 8]], [[0, 68, 4], [4, 71, 4], [8, 76, 4], [12, 74, 4]],
  [[0, 72, 6], [6, 76, 2], [8, 79, 6]], [[0, 78, 4], [4, 76, 2], [6, 72, 2], [8, 69, 8]],
  [[0, 71, 4], [4, 74, 4], [8, 78, 8]], [[0, 76, 4], [4, 72, 4], [8, 69, 2], [10, 66, 2], [12, 69, 4]]
];
const MUS_COMP = [[0, 3], [3, 3], [6, 4], [10, 2], [12, 4]]; // batida de bossa (início, duração)
const mf = m => 440*Math.pow(2, (m - 69)/12);

function musNoise() { const n = AC.sampleRate*.5, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random()*2 - 1; return b; }
let musNB = null;
function startMusic() {
  if (!AC || musicG) return;
  musicG = gainN(OPT.music*.5); musicG.connect(master);
  // eco de salão: impulso de ruído decaindo
  const len = Math.floor(AC.sampleRate*2.2), ir = AC.createBuffer(2, len, AC.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/len, 3); }
  musVerb = AC.createConvolver(); musVerb.buffer = ir; const vg = gainN(.28); chain(musVerb, vg, musicG);
  // tremolo do piano elétrico
  musTrem = gainN(.8); const lfo = AC.createOscillator(); lfo.frequency.value = 4.6; const la = gainN(.2); chain(lfo, la); la.connect(musTrem.gain); lfo.start();
  const lp = filt('lowpass', 2400); chain(musTrem, lp, musicG); lp.connect(musVerb);
  musNB = musNoise(); musicOn = true; musNext = AC.currentTime + .15; musStep = 0; musLoop = 0;
  musTimer = setInterval(musTick, 40);
}
function musOut(dry, wet) { const g = gainN(1); g.connect(musicG); if (wet) { const w = gainN(wet); g.connect(w); w.connect(musVerb); } return g; }
function musEP(m, t, d, v) { // piano elétrico (FM leve)
  const c = AC.createOscillator(), mo = AC.createOscillator(), mg = gainN(mf(m)*1.2), e = gainN(0);
  c.frequency.value = mf(m); mo.frequency.value = mf(m)*1; mo.connect(mg); mg.connect(c.frequency);
  mg.gain.setValueAtTime(mf(m)*1.2, t); mg.gain.exponentialRampToValueAtTime(mf(m)*.08, t + .25);
  e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(v, t + .008); e.gain.exponentialRampToValueAtTime(v*.35, t + .5); e.gain.setTargetAtTime(0, t + d, .08);
  c.connect(e); e.connect(musTrem); c.start(t); mo.start(t); c.stop(t + d + .6); mo.stop(t + d + .6);
}
function musVibe(m, t, d, v) { // vibrafone: senoide + parcial 4x, motor de vibrato
  const o = AC.createOscillator(), o2 = AC.createOscillator(), e = gainN(0), e2 = gainN(0), out = musOut(1, .5), am = gainN(1);
  const vib = AC.createOscillator(), va = gainN(.25); vib.frequency.value = 5.5; vib.connect(va); va.connect(am.gain);
  o.frequency.value = mf(m); o2.frequency.value = mf(m)*4;
  e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(v, t + .005); e.gain.exponentialRampToValueAtTime(.001, t + Math.max(1.2, d + .8));
  e2.gain.setValueAtTime(v*.25, t); e2.gain.exponentialRampToValueAtTime(.001, t + .25);
  o.connect(e); o2.connect(e2); e.connect(am); e2.connect(am); am.connect(out);
  const end = t + Math.max(1.3, d + .9); [o, o2, vib].forEach(x => { x.start(t); x.stop(end); });
}
function musFlute(m, t, d, v) { // flauta suave
  const o = AC.createOscillator(), e = gainN(0), f = filt('lowpass', 1800), out = musOut(1, .45), vib = AC.createOscillator(), va = gainN(mf(m)*.006);
  o.type = 'triangle'; o.frequency.value = mf(m); vib.frequency.value = 5; vib.connect(va); va.connect(o.frequency);
  e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(v, t + .07); e.gain.setValueAtTime(v, t + d*.85); e.gain.linearRampToValueAtTime(0, t + d + .12);
  chain(o, f, e, out); o.start(t); vib.start(t); o.stop(t + d + .2); vib.stop(t + d + .2);
}
function musBass(m, t, d, v) {
  const o = AC.createOscillator(), o2 = AC.createOscillator(), e = gainN(0), f = filt('lowpass', 520), out = musOut(1, .08);
  o.type = 'triangle'; o.frequency.value = mf(m); o2.frequency.value = mf(m);
  e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(v, t + .01); e.gain.exponentialRampToValueAtTime(v*.45, t + .2); e.gain.setTargetAtTime(0, t + d*.9, .05);
  o.connect(f); o2.connect(f); chain(f, e, out); o.start(t); o2.start(t); o.stop(t + d + .3); o2.stop(t + d + .3);
}
function musHat(t, v, len = .035, fq = 8000) {
  const s = AC.createBufferSource(), e = gainN(0), out = musOut(1, .15); s.buffer = musNB; s.playbackRate.value = 1 + Math.random()*.1;
  e.gain.setValueAtTime(v, t); e.gain.exponentialRampToValueAtTime(.001, t + len); chain(s, filt('highpass', fq), e, out); s.start(t, Math.random()*.4); s.stop(t + len + .02);
}
function musRim(t, v) { const o = AC.createOscillator(), e = gainN(0), out = musOut(1, .2); o.frequency.value = 1650; e.gain.setValueAtTime(v, t); e.gain.exponentialRampToValueAtTime(.001, t + .03); chain(o, filt('bandpass', 1650, 3), e, out); o.start(t); o.stop(t + .05); }

function musPlayStep(t) {
  const bar = Math.floor(musStep/16) % 16, s = musStep % 16, ch = MUS_CH[bar], sec = MUS_16;
  const half = ch.length > 2 && s >= 8, bass = half ? ch[2] : ch[0], chord = half ? ch[3] : ch[1];
  // baixo: tônica no 1, quinta no 3 (com antecipação)
  if (s === 0 || (half && s === 8)) musBass(bass, t, sec*5.5, .42);
  if (!ch[2] && s === 6) musBass(bass + 7, t, sec*1.6, .3);
  if (!ch[2] && s === 8) musBass(bass + 7, t, sec*5.5, .36);
  if (s === 14) musBass(bass + (bar % 2 ? 0 : 12), t, sec*1.6, .25);
  // piano: batida de bossa
  for (const [st, d] of MUS_COMP) if (st === s && (musLoop > 0 || bar > 0)) chord.forEach((m, i) => musEP(m, t + i*.006, sec*d*.9, .085));
  // chimbal / shaker e aro
  musHat(t, s % 4 === 2 ? .09 : s % 2 ? .03 : .05);
  if ((bar % 2 ? [2, 6, 10] : [0, 3, 6, 10, 12]).includes(s)) musRim(t, .1);
  // melodia (volta 0: vibrafone · 1: flauta uma oitava abaixo · 2: só acompanhamento)
  const mode = musLoop % 3;
  if (mode < 2) for (const [st, m, d] of MUS_MEL[bar]) if (st === s) {
    if (mode === 0) musVibe(m, t, sec*d, .16); else musFlute(m - 12, t, sec*d, .13);
  }
}
function musTick() {
  if (!musicOn || !AC || AC.state !== 'running') return;
  if (musNext < AC.currentTime - .5) musNext = AC.currentTime + .05; // voltou de segundo plano
  while (musNext < AC.currentTime + .25) {
    if (OPT.music > 0) musPlayStep(musNext);
    musNext += MUS_16; musStep++; if (musStep % 256 === 0) musLoop++;
  }
}
// a música já toca no menu: o navegador só libera áudio depois do primeiro toque/tecla
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { try { startAudio(); } catch (e) {} }, { once: true, capture: true }));
