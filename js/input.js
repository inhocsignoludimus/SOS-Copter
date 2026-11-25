// input.js — teclado, controle (gamepad), toque, mouse e áudio sintetizado (placeholders fáceis de trocar)
const K = {}, tch = { lx: 0, ly: 0, rx: 0, ry: 0 }, orbit = { yaw: 0, pitch: 0, dist: 24, drag: false, t: 0 };
let camMode = 0, playing = false, paused = false;
function nextCam() { const c = T('cams'); camMode = (camMode + 1) % c.length; toast(T('camT', { c: c[camMode] }), 1200); }
const ACTIONS = {
  Space: dropWater, KeyL: toggleSpot, KeyG: megaphone, KeyC: nextCam,
  KeyI: () => { if (st.engine) { if (st.landed) { st.engine = false; toast(T('engOff'), 1200); } else toast(T('engOnlyLanded'), 1500); } else startEngine(); },
  Enter: () => offer ? (offer.missing ? declineOffer() : acceptOffer()) : null, KeyT: acceptOffer, Backspace: declineOffer, KeyN: declineOffer,
  KeyH: () => openHangar(), KeyM: () => { OPT.vol = OPT.vol > 0 ? 0 : .8; applyVol(); toast(T(OPT.vol ? 'soundOn' : 'soundOff'), 1200); }, KeyK: throwGas, KeyV: callSupport,
  KeyP: () => togglePause(), Escape: () => togglePause(), KeyE: () => footAction() };
const HELI_ONLY = ['Space', 'KeyL', 'KeyG', 'KeyK', 'KeyI', 'KeyC'];
function startEngine() { if (st.engine || st.dead) return; if (st.fuel <= 0) { toast(T('tankEmpty'), 1500); return; } st.engine = true; toast(T('engStart'), 2200); sfx('start'); }
addEventListener('keydown', e => {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (!playing) return;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Backspace'].includes(e.code)) e.preventDefault();
  if (paused && !['KeyP','Escape'].includes(e.code)) return;
  K[e.code] = 1; if (e.repeat || !ACTIONS[e.code]) return;
  if (PF.active && HELI_ONLY.includes(e.code)) { toast(T('onFootNo'), 1400); return; }
  if (e.code === 'KeyE' && !PF.active && !st.landed) return; // em voo, E desliza
  ACTIONS[e.code]();
});
addEventListener('keyup', e => { K[e.code] = 0; });
addEventListener('blur', () => { for (const k in K) K[k] = 0; });

/* toque: dois manches virtuais */
function stick(el, cb) { let id = null, cx = 0, cy = 0; const kn = el.querySelector('i'); let RR = 48;
  const mv = e => { if (e.pointerId !== id) return; let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy); if (l > RR) { dx *= RR/l; dy *= RR/l; } kn.style.transform = `translate(${dx}px,${dy}px)`; cb(dx/RR, -dy/RR); };
  el.addEventListener('pointerdown', e => { id = e.pointerId; try { el.setPointerCapture(id); } catch (_) {} const r = el.getBoundingClientRect(); cx = r.left + r.width/2; cy = r.top + r.height/2; RR = r.width*.36; mv(e); });
  el.addEventListener('pointermove', mv); const up = e => { if (e.pointerId !== id) return; id = null; kn.style.transform = ''; cb(0, 0); }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); }
stick($('sl'), (x, y) => { tch.lx = x; tch.ly = y; }); stick($('sr'), (x, y) => { tch.rx = x; tch.ry = y; });
document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const a = ACTIONS[b.dataset.act]; if (a && playing) a(); }));
if (matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch');

/* mouse: arrastar gira a câmera, roda dá zoom */
R.domElement.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { orbit.drag = true; orbit.lx = e.clientX; orbit.ly = e.clientY; } });
addEventListener('pointerup', () => { orbit.drag = false; orbit.t = 2; });
addEventListener('pointermove', e => { if (!orbit.drag) return; if (PF.active) { PF.camYaw -= (e.clientX - orbit.lx)*.006; orbit.lx = e.clientX; orbit.ly = e.clientY; return; } orbit.yaw -= (e.clientX - orbit.lx)*.006; orbit.pitch = clamp(orbit.pitch + (e.clientY - orbit.ly)*.004, -.4, .9); orbit.lx = e.clientX; orbit.ly = e.clientY; });
// toque: arrastar um dedo no cenário gira a câmera
let camTouch = null, ctx0 = 0, cty0 = 0;
R.domElement.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || camTouch !== null) return; camTouch = e.pointerId; ctx0 = e.clientX; cty0 = e.clientY; });
addEventListener('pointermove', e => { if (e.pointerId !== camTouch) return; const dx = e.clientX - ctx0, dy = e.clientY - cty0; ctx0 = e.clientX; cty0 = e.clientY;
  if (PF.active) PF.camYaw -= dx*.008; else { orbit.yaw -= dx*.008; orbit.pitch = clamp(orbit.pitch + dy*.005, -.4, .9); orbit.t = 2; } });
const camTouchEnd = e => { if (e.pointerId === camTouch) camTouch = null; }; addEventListener('pointerup', camTouchEnd); addEventListener('pointercancel', camTouchEnd);
R.domElement.addEventListener('wheel', e => { e.preventDefault(); orbit.dist = clamp(orbit.dist + Math.sign(e.deltaY)*3, 12, 70); }, { passive: false });

/* controle: analógicos + botões */
const padPrev = [];
function readPad() {
  const out = { lx: 0, ly: 0, rx: 0, ry: 0, lt: 0, rt: 0 }; let gp = null;
  try { for (const p of navigator.getGamepads ? navigator.getGamepads() : []) if (p) { gp = p; break; } } catch (e) {}
  if (!gp) return out;
  const dz = v => Math.abs(v) < .15 ? 0 : v; out.lx = dz(gp.axes[0] || 0); out.ly = dz(gp.axes[1] || 0); out.rx = dz(gp.axes[2] || 0); out.ry = dz(gp.axes[3] || 0);
  out.lt = gp.buttons[6] ? gp.buttons[6].value : 0; out.rt = gp.buttons[7] ? gp.buttons[7].value : 0;
  const map = { 0: 'Space', 1: 'KeyG', 2: 'KeyL', 3: 'KeyC', 9: 'KeyP', 12: 'Enter', 13: 'Backspace', 8: 'KeyH', 5: 'KeyI', 4: 'KeyV', 14: 'KeyE' };
  gp.buttons.forEach((b, i) => { const p = b.pressed; if (p && !padPrev[i] && map[i] && playing && (!paused || map[i] === 'KeyP') && !(PF.active && HELI_ONLY.includes(map[i]))) ACTIONS[map[i]](); padPrev[i] = p; });
  return out;
}
function readInput() {
  const pad = readPad(), inv = OPT.invert ? -1 : 1;
  const kp = ((K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0))*inv, ks = (K.KeyE ? 1 : 0) - (K.KeyQ ? 1 : 0);
  let col = ((K.ArrowUp || K.KeyR) ? 1 : 0) - ((K.ArrowDown || K.KeyF) ? 1 : 0) + tch.ly - pad.ly + pad.rt - pad.lt;
  const turn = (K.KeyA ? 1 : 0) - (K.KeyD ? 1 : 0) + (K.ArrowLeft ? 1 : 0) - (K.ArrowRight ? 1 : 0) - tch.lx - pad.lx;
  const ap = (tch.ry - pad.ry)*inv, as = tch.rx + pad.rx;
  col = clamp(col, -1, 1); if (col > .1 && !st.engine && !st.dead) startEngine();
  return { kp, ks, ap, as, turn: clamp(turn, -1, 1), col };
}

/* ---------- Áudio sintetizado ----------
   Para trocar por arquivos de verdade: coloque os sons na pasta "sons/" do artifact e preencha SOUND_FILES.
   Nomes aceitos: boom, crash, splash, win, horn, alarm, start, land, cash, carhorn, rotor (loop), radio. */
const SOUND_FILES = { /* boom: 'sons/explosao.ogg', rotor: 'sons/rotor.ogg' */ };
const SBUF = {};
let rotorFile = false, AC = null, master, rotorSrc, rotorG, rotorLp, turbO, turbG, windG, rainG, seaG, seaLfo, cityG, sirenO, sirenG;
function noiseBuf(sec, brown) { const n = Math.floor(AC.sampleRate*sec), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { const w = Math.random()*2 - 1; if (brown) { l = (l + .02*w)/1.02; d[i] = l*3.5; } else d[i] = w; } return b; }
function loopSrc(buf) { const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }
function filt(type, f, q = 1) { const x = AC.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; }
function gainN(v = 0) { const g = AC.createGain(); g.gain.value = v; return g; }
function chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }
function startAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)(); master = gainN(OPT.vol); master.connect(AC.destination);
    // rotor: uma batida de pá ("tum") em loop; a rotação muda a velocidade do loop
    const sr = AC.sampleRate, n = Math.floor(sr/18), rb = AC.createBuffer(1, n, sr), d = rb.getChannelData(0);
    for (let i = 0; i < n; i++) { const t = i/sr; d[i] = Math.sin(2*Math.PI*52*t)*Math.exp(-t*34)*.9 + (Math.random()*2 - 1)*Math.exp(-t*80)*.55 + (Math.random()*2 - 1)*.05; }
    rotorSrc = loopSrc(rb); rotorLp = filt('lowpass', 900); rotorG = gainN(); chain(rotorSrc, rotorLp, rotorG, master);
    // turbina: chiado agudo que acompanha a rotação
    turbO = AC.createOscillator(); turbO.type = 'sawtooth'; turbO.start(); turbG = gainN(); chain(turbO, filt('bandpass', 2000, 6), turbG, master);
    // vento, chuva, mar e cidade
    const white = noiseBuf(2, false), brown = noiseBuf(3, true);
    windG = gainN(); chain(loopSrc(white), filt('bandpass', 700, .6), windG, master);
    rainG = gainN(); chain(loopSrc(white), filt('highpass', 3500), rainG, master);
    seaG = gainN(); const seaAm = gainN(.5); seaLfo = AC.createOscillator(); seaLfo.frequency.value = .12; const seaAmt = gainN(.45); chain(seaLfo, seaAmt); seaAmt.connect(seaAm.gain); seaLfo.start();
    chain(loopSrc(brown), filt('lowpass', 500), seaAm, seaG, master);
    cityG = gainN(); chain(loopSrc(brown), filt('lowpass', 260), cityG, master);
    // sirene de dois tons
    sirenO = AC.createOscillator(); sirenO.type = 'square'; sirenO.start(); sirenG = gainN(); chain(sirenO, filt('lowpass', 1800), sirenG, master);
    // sons embutidos (js/sounds.js): decodifica e troca o rotor sintetizado pela gravação
    if (typeof SOUND_DATA !== 'undefined') for (const [k, b64] of Object.entries(SOUND_DATA)) { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
      AC.decodeAudioData(u.buffer).then(buf => { SBUF[k] = buf; if (k === 'rotor') { const s2 = loopSrc(buf); s2.connect(rotorLp); rotorSrc.disconnect(); rotorSrc.stop(); rotorSrc = s2; rotorFile = true; } }).catch(() => {}); }
    for (const [k, url] of Object.entries(SOUND_FILES)) fetch(url).then(r => r.arrayBuffer()).then(b => AC.decodeAudioData(b)).then(buf => { SBUF[k] = buf; if (k === 'rotor') { const s2 = loopSrc(buf); s2.connect(rotorLp); rotorSrc.disconnect(); rotorSrc.stop(); rotorSrc = s2; rotorFile = true; } }).catch(() => {});
    startMusic();
    applyVol();
  } catch (e) { AC = null; }
}
function applyVol() { if (master) master.gain.value = OPT.vol; if (musicG) musicG.gain.value = OPT.music*.5; try { localStorage.setItem('resgateRecife.opts', JSON.stringify(OPT)); } catch (e) {} }
function updAudio(dt) {
  if (!AC) return; const on = playing && !paused && st, fx = OPT.sfx;
  if (!on) { for (const g of [rotorG, turbG, windG, rainG, seaG, cityG, sirenG]) g.gain.value = 0; return; }
  const sp = Math.hypot(st.vx, st.vz), inCab = camMode === 1 ? 1.25 : 1;
  rotorSrc.playbackRate.value = rotorFile ? .3 + .72*st.rpm + Math.abs(st.vy)*.008 : .22 + .98*st.rpm + Math.abs(st.vy)*.01; rotorLp.frequency.value = rotorFile ? 900 + 3500*st.rpm : 400 + 900*st.rpm; rotorG.gain.value = .55*st.rpm*fx*inCab;
  turbO.frequency.value = 700 + 1500*st.rpm; turbG.gain.value = .018*st.rpm*fx;
  windG.gain.value = clamp(sp/55, 0, 1)*.14*fx; rainG.gain.value = weather === 'chuva' ? .05*fx : 0;
  const low = clamp(1 - st.agl/140, 0, 1), dc = beachDist(st.x, st.z);
  seaG.gain.value = clamp(1 - dc/180, 0, 1)*.16*fx*(.4 + .6*low);
  const city = st.overWater ? 0 : low*.09*fx; cityG.gain.value = city;
  if (city > .03 && Math.random() < dt*.25) sfx('carhorn', city*7);
  const chase = M && M.type === 'perseguicao'; sirenO.frequency.value = Math.floor(perfT*2) % 2 ? 650 : 870;
  sirenG.gain.value = chase ? clamp(1 - dxz(st, sus)/300, .15, 1)*.035*fx*(M.stage === 1 ? 1.6 : 1) : 0;
}
function playBuf(name, vol) { const s = AC.createBufferSource(); s.buffer = SBUF[name]; const g = gainN(vol); s.connect(g); g.connect(master); s.start(); }
function sfx(kind, k = 1) {
  if (!AC || OPT.vol === 0) return; const t = AC.currentTime, vol = (kind === 'radio' ? OPT.radio : OPT.sfx)*k;
  if (SBUF[kind]) return playBuf(kind, vol);
  const env = (node, a, dur, at = 0) => { const g = AC.createGain(); g.gain.setValueAtTime(.0001, t + at); g.gain.exponentialRampToValueAtTime(Math.max(.0002, a*vol), t + at + .01); g.gain.exponentialRampToValueAtTime(.0001, t + at + dur); node.connect(g); g.connect(master); return g; };
  const noise = (dur, f, type = 'lowpass', a = .5, at = 0, f2) => { const s = AC.createBufferSource(); s.buffer = noiseBuf(dur + .05, false); const fl = filt(type, f); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + at + dur); s.connect(fl); env(fl, a, dur, at); s.start(t + at); };
  const tone = (f, dur, type = 'square', a = .15, f2, at = 0) => { const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t + at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + dur); env(o, a, dur, at); o.start(t + at); o.stop(t + at + dur + .05); };
  if (kind === 'radio') { noise(.12, 2500, 'bandpass', .3); tone(1400, .05, 'square', .05, 900); }
  else if (kind === 'boom') { noise(1.8, 2500, 'lowpass', 1.3, 0, 90); tone(70, 1.2, 'sine', .9, 28); }
  else if (kind === 'crash' || kind === 'thud') { noise(.4, 900, 'lowpass', .8, 0, 120); tone(90, .25, 'sine', .5, 40); }
  else if (kind === 'splash') { noise(.7, 1600, 'bandpass', .55, 0, 400); }
  else if (kind === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'square', .07, null, i*.09)); }
  else if (kind === 'horn') { const o = AC.createOscillator(); o.type = 'sawtooth'; const ws = AC.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i/128 - 1; c[i] = Math.tanh(x*4); } ws.curve = c;
    const bp = filt('bandpass', 1300, 2); o.connect(ws); ws.connect(bp); env(bp, .25, 1.1); for (let i = 0; i < 8; i++) o.frequency.setValueAtTime(150 + Math.random()*90, t + i*.13); o.start(t); o.stop(t + 1.2); }
  else if (kind === 'carhorn') { const f = 380 + Math.random()*140; tone(f, .22, 'square', .05, null); tone(f*1.26, .22, 'square', .04, null); }
  else if (kind === 'alarm') { for (let i = 0; i < 3; i++) tone(950, .18, 'square', .1, 600, i*.25); }
  else if (kind === 'start') { tone(60, 1.6, 'sawtooth', .08, 240); noise(1.4, 400, 'lowpass', .15); }
  else if (kind === 'land') { noise(.22, 350, 'lowpass', .4); tone(110, .12, 'sine', .25, 60); }
  else if (kind === 'click') tone(1200, .04, 'square', .05);
  else if (kind === 'cash') { tone(1320, .07, 'square', .07); tone(1760, .12, 'square', .06, null, .08); }
}
// "voz" da central: sílabas sem sentido filtradas como rádio
function radioVoice(n) {
  if (!AC || OPT.vol === 0) return; const t0 = AC.currentTime + .12, base = 120 + Math.random()*90;
  for (let i = 0; i < n; i++) { const t = t0 + i*.11 + Math.random()*.03, o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(base*(.85 + Math.random()*.4), t);
    const f1 = filt('bandpass', 500 + Math.random()*700, 4), f2 = filt('bandpass', 1100, .8), g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.11*OPT.radio, t + .02); g.gain.linearRampToValueAtTime(.0001, t + .09);
    o.connect(f1); f1.connect(f2); f2.connect(g); g.connect(master); o.start(t); o.stop(t + .1); }
  const s = AC.createBufferSource(); s.buffer = noiseBuf(n*.11 + .3, false); const hp = filt('bandpass', 2200, .7), g = gainN(.025*OPT.radio); s.connect(hp); hp.connect(g); g.connect(master); s.start(t0 - .1); s.stop(t0 + n*.11 + .2);
}
