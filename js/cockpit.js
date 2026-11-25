// cockpit.js — HUD de cabine v2 (módulos nos cantos), arte do kit do Ludimus em hud/. SÓ NO PC: no celular nada muda.
// Matemática igual à de hud/_src/montar_mockup_v2.py: telas de 1280×800 lógicos, margem de 12 px,
// cada módulo preso ao seu canto e tudo escalado pelo menor lado da janela.
const CK_ON = !IS_TOUCH;
const CK = { open: false, pin: false, held: null, theme: null, imgs: {}, k: 1, S: 1, W: 1280, H: 800 };
// posições (1x) — copiadas de hud/hud_atlas_v2.json → layout
const CKL = { mission_plate: { x: 12, y: 550, w: 200, h: 30 }, minimap_frame: { x: 12, y: 584, w: 200, h: 204 }, minimap_window: { x: 24, y: 604, w: 176, h: 176 },
  status_bar: { x: 812, y: 584, w: 456, h: 40 }, pod_flight: { x: 788, y: 628, w: 480, h: 160 }, heading_tape_view: { x: 850, y: 596, w: 258, h: 20, src_y: 3 }, heading_lubber: { x: 854, y: 591 },
  money: [1194, 606.5], dials: { airspeed: [942, 716], horizon: [1072, 716], altimeter: [1202, 716] }, hzR: 49,
  bars: [{ id: 'fuel', x: 798, y: 662 }, { id: 'damage', x: 826, y: 662 }, { id: 'water', x: 854, y: 662 }],
  radio_screen: { x: 986, y: 12, w: 276, h: 124 }, tools_plate: { x: 980, y: 144, w: 288, h: 154 }, caution_plate: { x: 980, y: 306, w: 288, h: 76 },
  buttons: [['water', 987, 168, 'Space'], ['spot', 1056, 168, 'KeyL'], ['speaker', 1125, 168, 'KeyG'], ['gas', 1194, 168, 'KeyK'], ['backup', 987, 210, 'KeyV'], ['engine', 1056, 210, 'KeyI'],
    ['camera', 1125, 210, 'KeyC'], ['hangar', 1194, 210, 'KeyH'], ['accept', 987, 252, 'Enter'], ['decline', 1056, 252, 'Backspace'], ['pause', 1125, 252, 'KeyP'], ['sound', 1194, 252, 'KeyM']],
  lamps: [['engine', 989, 328], ['rotor', 1057, 328], ['low_fuel', 1125, 328], ['damage', 1193, 328], ['overload', 989, 353], ['water', 1057, 353], ['spot', 1125, 353], ['landing', 1193, 353]] };
const CK_PIV = { needle_long: [5.5, 43.2], needle_short: [6, 29.6], disc: [56, 160], aircraft: [44, 12], player: [8, 10] };
// tema por helicóptero (hud_atlas_v2.json → meta.themes) e cor do LCD de cada tema
const CK_THEME = { schwaiter: 'rescue', bel213: 'rescue', delfim: 'rescue', md525: 'rescue', jetrider: 'sky', a110: 'sky', md505: 'gold', explorador: 'gold', apaxe: 'olive' };
const CK_LCD = { rescue: '#ffb43a', sky: '#7fd4ff', gold: '#ffd65a', olive: '#7dff6a' };
// nomes curtos (em inglês) das missões na placa MISSION
const CK_MT = { taxi: 'AIR TAXI', medico: 'MEDEVAC', incendio: 'FIRE', mar: 'SEA RESCUE', telhado: 'ROOFTOP', transito: 'TRAFFIC', perseguicao: 'CHASE', tumulto: 'RIOT', enchente: 'FLOOD' };

const ckCv = document.createElement('canvas'), ck = ckCv.getContext('2d');
if (CK_ON) { ckCv.id = 'ck2'; document.body.classList.add('ck2'); $('hud').prepend(ckCv); }
function ckImg(path) { // carrega sob demanda; devolve null até a imagem chegar
  let im = CK.imgs[path]; if (!im) { im = CK.imgs[path] = new Image(); im.src = (typeof HUD_PACK !== 'undefined' && HUD_PACK[path]) || 'hud/' + path; } return im.complete && im.naturalWidth ? im : null; }
const ckS = () => CK.S + 'x';
const ckT2 = n => ckImg(`v2/themes/${CK.theme}/${ckS()}/${n}.png`), ckC2 = n => ckImg(`v2/common/${ckS()}/${n}.png`);
const ckT1 = n => ckImg(`themes/${CK.theme}/${ckS()}/${n}.png`), ckC1 = n => ckImg(`common/${ckS()}/${n}.png`);
function ckPut(im, x, y) { if (im) ck.drawImage(im, x, y, im.naturalWidth/CK.S, im.naturalHeight/CK.S); }
function ckNeedle(im, piv, cx, cy, deg) { if (!im) return; ck.save(); ck.translate(cx, cy); ck.rotate(deg*Math.PI/180); ck.drawImage(im, -piv[0], -piv[1], im.naturalWidth/CK.S, im.naturalHeight/CK.S); ck.restore(); }
function ckResize() {
  const dpr = window.devicePixelRatio || 1, w = innerWidth, h = innerHeight;
  CK.k = Math.max(.75, Math.min(w/1280, h/800)); CK.W = w/CK.k; CK.H = h/CK.k; CK.S = dpr*CK.k > 1.2 ? 2 : 1;
  ckCv.width = Math.round(w*dpr); ckCv.height = Math.round(h*dpr); ckCv.style.width = w + 'px'; ckCv.style.height = h + 'px'; CK.dpr = dpr;
}
// deslocamento de cada canto (em coordenadas lógicas de 1280×800)
const ckOff = g => g === 'bl' ? [0, CK.H - 800] : g === 'br' ? [CK.W - 1280, CK.H - 800] : [CK.W - 1280, 0];
const ckToolsOpen = () => CK.open || CK.pin;

/* ---------- estados ---------- */
function ckLamps() {
  const load = st.pax*LB_PAX + st.water, hs = Math.hypot(st.vx, st.vz), FC = fuelCap();
  return { engine: st.engine, rotor: st.engine && st.rpm < .8, low_fuel: st.fuel/FC < .2, damage: st.dmg/armorCap() > .5, overload: load > HSPEC.load,
    water: st.water > 0, spot: st.spotOn, landing: !st.landed && st.engine && st.agl < 15 && -st.vy < 6 && hs < 7.5 && Math.abs(st.pitchS) < .16 && Math.abs(st.slideS) < .13 };
}
function ckOn(id) { // botão "afundado": enquanto clicado ou com a função ligada
  if (CK.held === id) return true;
  return { spot: st.spotOn, engine: st.engine, backup: !!(M && M.support), camera: camMode !== 0, pause: paused, sound: OPT.vol === 0, water: st.water > 0 && hasEq('balde') }[id] || false;
}
function ckWrap(text, w) { const out = []; let line = ''; for (const word of String(text).split(/\s+/)) { const t = line ? line + ' ' + word : word; if (ck.measureText(t).width > w && line) { out.push(line); line = word; } else line = t; } if (line) out.push(line); return out; }

/* ---------- desenho ---------- */
function drawCockpit() {
  if (!CK_ON) return;
  const th = CK_THEME[HSPEC.id] || 'rescue'; if (th !== CK.theme) CK.theme = th;
  const lcd = CK_LCD[th], dim = 'rgba(255,255,255,.0)';
  ck.setTransform(1, 0, 0, 1, 0, 0); ck.clearRect(0, 0, ckCv.width, ckCv.height);
  const base = CK.dpr*CK.k, at = g => { const [ox, oy] = ckOff(g); ck.setTransform(base, 0, 0, base, ox*base, oy*base); };
  const kmh = Math.hypot(st.vx, st.vz)*3.6, alt = Math.max(0, PF.active ? 0 : st.agl), hdg = ((-st.yaw*180/Math.PI) % 360 + 360) % 360;
  // --- inferior esquerdo: MISSION + MAP
  at('bl'); const mw = CKL.minimap_window;
  ck.save(); ck.beginPath(); ck.roundRect ? ck.roundRect(mw.x, mw.y, mw.w, mw.h, 16) : ck.rect(mw.x, mw.y, mw.w, mw.h); ck.clip(); ck.fillStyle = '#2a78a0'; ck.fillRect(mw.x, mw.y, mw.w, mw.h);
  ck.drawImage(mini, 0, 0, mini.width, mini.height, mw.x, mw.y, mw.w, mw.h); ck.restore();
  ckNeedle(ckC2('minimap_player'), CK_PIV.player, mw.x + 88, mw.y + 88, 0); // o mapa já gira com o rumo: a seta fica sempre para cima
  ckPut(ckT2('minimap_frame'), CKL.minimap_frame.x, CKL.minimap_frame.y);
  const mp = CKL.mission_plate; ckPut(ckT2('mission_plate'), mp.x, mp.y);
  let mtxt = 'STANDBY'; const tg = missionTarget();
  if (PF.active) mtxt = 'ON FOOT'; else if (M) mtxt = (CK_MT[M.type] || 'MISSION') + (tg ? '  ' + (dxz(st, tg)/1000).toFixed(1) + ' km' : ''); else if (offer) mtxt = 'CALL: ' + (CK_MT[offer.type] || '');
  ck.font = '15px VT323, monospace'; ck.fillStyle = lcd; ck.textBaseline = 'middle'; ck.textAlign = 'left'; ck.fillText(mtxt.slice(0, 17), mp.x + 70, mp.y + 15.5);
  // --- inferior direito: status (bússola + dinheiro) e FLIGHT
  at('br'); const sb = CKL.status_bar, tv = CKL.heading_tape_view; ckPut(ckT2('status_bar'), sb.x, sb.y);
  const tape = ckT1('heading_tape'); if (tape) { const sx = (hdg + 180)*4 - tv.w/2; ck.drawImage(tape, sx*CK.S, tv.src_y*CK.S, tv.w*CK.S, tv.h*CK.S, tv.x, tv.y, tv.w, tv.h); }
  ckPut(ckT2('heading_lubber'), CKL.heading_lubber.x, CKL.heading_lubber.y);
  ck.font = '19px VT323, monospace'; ck.textAlign = 'center'; ck.fillStyle = lcd; ck.fillText(G.free ? 'FREE' : '$ ' + Math.round(G.money).toLocaleString('en-US'), CKL.money[0], CKL.money[1]);
  ckPut(ckT2('pod_flight'), CKL.pod_flight.x, CKL.pod_flight.y);
  const fr = { fuel: st.fuel/fuelCap(), damage: st.dmg/armorCap(), water: bucketCap() ? st.water/bucketCap() : 0 };
  for (const b of CKL.bars) { ckPut(ckT2('bar_' + b.id), b.x, b.y); const f = ckC2('bar_fill_' + b.id), h = Math.round(84*clamp(fr[b.id] || 0, 0, 1));
    if (f && h > 0) ck.drawImage(f, 0, f.naturalHeight - h*CK.S, f.naturalWidth, h*CK.S, b.x + 7, b.y + 6 + 84 - h, 12, h); }
  // horizonte: nariz para baixo (pitchS > 0 no jogo) mostra mais terra; bank > 0 = rolando para a esquerda
  const [hx, hy] = CKL.dials.horizon, disc = ckC2('horizon_disc');
  if (disc) { const pitch = clamp(-st.pitchS*180/Math.PI, -35, 35); ck.save(); ck.beginPath(); ck.arc(hx, hy, CKL.hzR, 0, 7); ck.clip(); ck.translate(hx, hy); ck.rotate(st.bank);
    ck.drawImage(disc, -CK_PIV.disc[0], -CK_PIV.disc[1] + pitch*3, disc.naturalWidth/CK.S, disc.naturalHeight/CK.S); ck.restore(); }
  ckPut(ckC2('horizon_aircraft'), hx - 44, hy - 12); ckPut(ckT2('horizon_bezel'), hx - 68, hy - 68);
  const [ax, ay] = CKL.dials.airspeed; ckPut(ckT2('gauge_airspeed'), ax - 56, ay - 56);
  ck.font = '11px VT323, monospace'; ck.fillStyle = lcd; ck.fillText(String(Math.round(kmh)), ax, ay + 15.5);
  ckNeedle(ckC2('needle_long'), CK_PIV.needle_long, ax, ay, -135 + 270*Math.min(kmh, 350)/350);
  const [lx, ly] = CKL.dials.altimeter; ckPut(ckT2('gauge_altimeter'), lx - 56, ly - 56);
  ck.fillText(String(Math.round(alt)), lx, ly + 15.5);
  ckNeedle(ckC2('needle_short'), CK_PIV.needle_short, lx, ly, 360*(alt % 1000)/1000); ckNeedle(ckC2('needle_long'), CK_PIV.needle_long, lx, ly, 360*(alt % 100)/100);
  // --- superior direito: DISPATCH RADIO, TOOLS e CAUTION
  at('tr'); const r = CKL.radio_screen; ckPut(ckT1('radio_screen'), r.x, r.y);
  if (performance.now() - lastRadio < 2500) ckPut(ckT1('radio_tx_on'), r.x + 255, r.y + 7);
  ck.font = '16px VT323, monospace'; ck.textAlign = 'left'; ck.textBaseline = 'alphabetic';
  const lines = []; radioLog.forEach((m, i) => { for (const l of ckWrap(m.text, 246)) lines.push([l, i > 0]); });
  if (offer) lines.unshift([offer.missing ? '[BKSP] DECLINE' : '[ENTER] ACCEPT  [BKSP] DECLINE', false]);
  lines.splice(4); const stat = (G.free ? 'FREE FLIGHT' : rankName(rankIdx()).toUpperCase()) + ` · SEATS ${st.pax}/${HSPEC.seats} · ${clockText()}`;
  lines.forEach(([l, old], i) => { ck.fillStyle = lcd; ck.globalAlpha = old ? .55 : 1; ck.fillText(l, r.x + 16, r.y + 44 + i*15); }); ck.globalAlpha = .45; ck.fillText(stat.slice(0, 34), r.x + 16, r.y + 104); ck.globalAlpha = 1;
  const tp = CKL.tools_plate, open = ckToolsOpen();
  if (open) { ckPut(ckT2('tools_plate'), tp.x, tp.y); for (const [id, x, y] of CKL.buttons) ckPut(ckT1(`btn_${id}_${ckOn(id) ? 'pressed' : 'normal'}`), x, y); }
  else ckPut(ckT2('tools_tab'), tp.x, tp.y);
  const dy = open ? 0 : -(tp.h - 26), L8 = ckLamps(); ckPut(ckT2('caution_plate'), CKL.caution_plate.x, CKL.caution_plate.y + dy);
  for (const [id, x, y] of CKL.lamps) ckPut(ckC1(`lamp_${id}_${L8[id] ? 'on' : 'off'}`), x, y + dy);
}

/* ---------- mouse e teclado ---------- */
function ckHit(e) { // devolve o que está sob o cursor: botão, aba do TOOLS ou um módulo qualquer
  const p = g => { const [ox, oy] = ckOff(g); return [e.clientX/CK.k - ox, e.clientY/CK.k - oy]; }, inR = (q, x, y, w, h) => q[0] >= x && q[0] <= x + w && q[1] >= y && q[1] <= y + h;
  const tr = p('tr'), tp = CKL.tools_plate, open = ckToolsOpen();
  if (open) for (const [id, x, y, code] of CKL.buttons) if (inR(tr, x, y, 66, 40)) return { btn: id, code };
  if (inR(tr, tp.x, tp.y, tp.w, open ? 30 : 26)) return { tab: 1 };
  if (inR(tr, 980, 12, 288, open ? 370 : 240)) return { mod: 1 };
  const br = p('br'); if (inR(br, 788, 584, 480, 204)) return { mod: 1 };
  const bl = p('bl'); if (inR(bl, 12, 550, 200, 238)) return { mod: 1 };
  return null;
}
if (CK_ON) {
  addEventListener('resize', ckResize); ckResize();
  addEventListener('pointerdown', e => { if (!playing || paused || e.button !== 0 || !ov.hidden) return; const h = ckHit(e); if (!h) return;
    e.preventDefault(); e.stopPropagation();
    if (h.tab) { CK.pin = !CK.pin; sfx('click', .5); return; }
    if (h.btn) { CK.held = h.btn; sfx('click', .5); const a = ACTIONS[h.code]; if (a && !(PF.active && HELI_ONLY.includes(h.code))) a(); } }, true);
  addEventListener('pointerup', () => { CK.held = null; }, true);
  // segurar Tab abre o painel TOOLS (os atalhos continuam valendo com ele recolhido)
  addEventListener('keydown', e => { if (e.code === 'Tab' && playing) { e.preventDefault(); CK.open = true; } });
  addEventListener('keyup', e => { if (e.code === 'Tab') CK.open = false; });
  addEventListener('blur', () => { CK.open = false; CK.held = null; });
}
