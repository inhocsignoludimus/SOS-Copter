// ui.js — HUD, painel de instrumentos, minimapa, rádio, menus, hangar, opções e salvamento (bilíngue)
const tEl = $('toast'); let tT = 0;
function toast(m, ms = 2600) { if (!m) return; tEl.textContent = m; tEl.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => tEl.classList.remove('on'), ms); }
const radioLog = []; let lastRadio = 0;
function radio(text, kind = 'info') { lastRadio = performance.now(); radioLog.unshift({ text, kind, t: clockText() }); radioLog.length = Math.min(radioLog.length, 4); renderRadio(); sfx('radio', kind === 'info' ? .5 : 1); radioVoice(Math.min(10, 2 + Math.ceil(text.length/18))); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function renderRadio() {
  $('radioLog').innerHTML = radioLog.map((r, i) => `<p class="rl ${r.kind}${i ? ' old' : ''}"><b>${r.t}</b> ${esc(r.text)}</p>`).join('');
  $('offerBtns').hidden = !offer; if (offer) { $('acc').textContent = offer.missing ? T('missingGear') : T('accept'); $('acc').disabled = !!offer.missing; }
}
$('acc').addEventListener('click', () => { acceptOffer(); renderRadio(); }); $('dec').addEventListener('click', () => { declineOffer(); renderRadio(); });
// textos fixos da página
function applyStatic() {
  document.title = T('title') + ' · ' + T('subtitle') + ' · ' + CITY.name;
  const set = (sel, k) => document.querySelectorAll('#hotbar ' + sel).forEach(e => { const kb = e.querySelector('kbd'); e.textContent = T(k); if (kb) e.prepend(kb); });
  set('[data-act=Space]', 'hbWater'); set('[data-act=KeyL]', 'hbSpot'); set('[data-act=KeyG]', 'hbMega'); set('[data-act=KeyK]', 'hbGas'); set('[data-act=KeyV]', 'hbSupport');
  set('[data-act=KeyI]', 'hbEngine'); set('[data-act=KeyC]', 'hbCam'); set('[data-act=KeyH]', 'hbHangar'); set('[data-act=KeyP]', 'hbPause'); set('[data-act=Enter]', 'hbAccept'); set('[data-act=KeyE]', 'hbExit');
  document.querySelectorAll('[data-act=Space] kbd').forEach(k => k.textContent = LANG === 'pt' ? 'Espaço' : 'Space');
  $('radioH').textContent = T('radioTitle'); $('rotTxt').textContent = T('rotate'); $('rotBtn').textContent = T('playAnyway'); $('rotBtn').onclick = () => { rotSeen = true; $('rotHint').hidden = true; }; $('dec').textContent = T('decline'); $('slL').textContent = T('stL'); $('srL').textContent = T('stR');
}

/* ---------- Painel de instrumentos ---------- */
const pc = $('panel'), px = pc.getContext('2d');
function dial(cx, cy, r, v, max, label, txt, min = 0, warn) {
  px.fillStyle = '#10161d'; px.beginPath(); px.arc(cx, cy, r, 0, 7); px.fill(); px.strokeStyle = '#4b5663'; px.lineWidth = 2; px.stroke();
  const a0 = Math.PI*.75, a1 = Math.PI*2.25;
  px.strokeStyle = '#7f8b98'; px.lineWidth = 1; for (let i = 0; i <= 10; i++) { const a = a0 + (a1 - a0)*i/10; px.beginPath(); px.moveTo(cx + Math.cos(a)*(r - 2), cy + Math.sin(a)*(r - 2)); px.lineTo(cx + Math.cos(a)*(r - 7), cy + Math.sin(a)*(r - 7)); px.stroke(); }
  if (warn != null) { px.strokeStyle = '#e2231a'; px.lineWidth = 3; px.beginPath(); px.arc(cx, cy, r - 4, a0 + (a1 - a0)*clamp((warn - min)/(max - min), 0, 1), a1); px.stroke(); }
  const a = a0 + (a1 - a0)*clamp((v - min)/(max - min), 0, 1); px.strokeStyle = '#ffcc1f'; px.lineWidth = 2.5; px.beginPath(); px.moveTo(cx, cy); px.lineTo(cx + Math.cos(a)*(r - 8), cy + Math.sin(a)*(r - 8)); px.stroke();
  px.fillStyle = '#ffcc1f'; px.beginPath(); px.arc(cx, cy, 3, 0, 7); px.fill();
  px.fillStyle = '#c9d3dc'; px.font = '700 9px Archivo,sans-serif'; px.textAlign = 'center'; px.fillText(label, cx, cy + r*.45);
  px.fillStyle = '#fff'; px.font = '700 11px Archivo,sans-serif'; px.fillText(txt, cx, cy + r*.45 + 12);
}
function barG(x, y, w, h, f, c, label, txt) { px.fillStyle = '#c9d3dc'; px.font = '700 9px Archivo,sans-serif'; px.textAlign = 'left'; px.fillText(label, x, y - 3); px.textAlign = 'right'; px.fillStyle = '#fff'; px.fillText(txt, x + w, y - 3);
  px.fillStyle = '#2a333d'; px.fillRect(x, y, w, h); px.fillStyle = c; px.fillRect(x, y, w*clamp(f, 0, 1), h); }
function drawPanel() {
  const W = pc.width, H = pc.height, r = 38; px.clearRect(0, 0, W, H);
  px.fillStyle = 'rgba(18,24,31,.92)'; px.beginPath(); px.roundRect ? px.roundRect(0, 0, W, H, 12) : px.rect(0, 0, W, H); px.fill();
  const kmh = Math.hypot(st.vx, st.vz)*3.6;
  dial(48, 50, r, kmh, 340, T('pSpeed'), Math.round(kmh) + ' km/h', 0, HSPEC.kmh);
  dial(136, 50, r, st.y, 350, T('pAlt'), Math.round(st.y) + ' m');
  const hx = 224, hy = 50; px.save(); px.beginPath(); px.arc(hx, hy, r, 0, 7); px.clip(); px.translate(hx, hy); px.rotate(st.bank); const off = st.pitchS*90;
  px.fillStyle = '#3d8fcf'; px.fillRect(-60, -60 + off, 120, 60); px.fillStyle = '#8a5a34'; px.fillRect(-60, off, 120, 60); px.strokeStyle = '#fff'; px.lineWidth = 1; px.beginPath(); px.moveTo(-40, off); px.lineTo(40, off); px.stroke(); px.restore();
  px.strokeStyle = '#ffcc1f'; px.lineWidth = 3; px.beginPath(); px.moveTo(hx - 22, hy); px.lineTo(hx - 8, hy); px.lineTo(hx, hy + 6); px.lineTo(hx + 8, hy); px.lineTo(hx + 22, hy); px.stroke();
  px.strokeStyle = '#4b5663'; px.lineWidth = 2; px.beginPath(); px.arc(hx, hy, r, 0, 7); px.stroke();
  dial(312, 50, r, st.vy, 16, T('pClimb'), (st.vy > 0 ? '+' : '') + st.vy.toFixed(1) + ' m/s', -16);
  dial(400, 50, r, st.rpm*100, 110, T('pRotor'), Math.round(st.rpm*100) + '%', 0, 100);
  const head = ((-st.yaw*180/Math.PI) % 360 + 360) % 360, bx = 20, by = 98, bw = 400; px.fillStyle = '#10161d'; px.fillRect(bx, by, bw, 18);
  px.save(); px.beginPath(); px.rect(bx, by, bw, 18); px.clip(); px.font = '700 10px Archivo,sans-serif'; px.textAlign = 'center';
  const CARD = LANG === 'pt' ? { 0: 'N', 45: 'NE', 90: 'L', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' } : { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  for (let d = -180; d <= 540; d += 15) { const xx = bx + bw/2 + (d - head)*2.2; if (xx < bx - 20 || xx > bx + bw + 20) continue; const lab = CARD[(d + 360) % 360]; px.fillStyle = lab ? '#ffcc1f' : '#7f8b98'; px.fillText(lab || '|', xx, by + 13); }
  px.restore(); px.fillStyle = '#e2231a'; px.fillRect(bx + bw/2 - 1, by - 2, 2, 22);
  const gx = 452, gw = W - gx - 14, FC = fuelCap(), AC2 = armorCap();
  barG(gx, 16, gw, 7, st.fuel/FC, st.fuel/FC < .2 ? '#e2231a' : '#5fd16a', T('pFuel'), st.fuel.toFixed(0) + ' gal');
  barG(gx, 40, gw, 7, st.dmg/AC2, '#e2231a', T('pDmg'), Math.round(st.dmg/AC2*100) + '%');
  const load = st.pax*LB_PAX + st.water; barG(gx, 64, gw, 7, load/HSPEC.load, load > HSPEC.load ? '#e2231a' : '#4fb3ea', T('pLoad'), Math.round(load) + ' lb');
  px.fillStyle = '#c9d3dc'; px.font = '700 9px Archivo,sans-serif'; px.textAlign = 'left'; px.fillText(T('pSeats') + ' ' + st.pax + '/' + HSPEC.seats, gx, 85);
  const cells = Math.min(HSPEC.seats, 15), cw = Math.min(12, gw/Math.max(1, cells)); for (let i = 0; i < cells; i++) { px.fillStyle = i < st.pax ? '#ffcc1f' : '#3a4450'; px.fillRect(gx + i*cw, 89, cw - 3, 12); }
  px.fillStyle = st.engine ? '#9fe08f' : '#55606c'; px.textAlign = 'right'; px.fillText(T(st.engine ? 'pOn' : 'pOff'), W - 14, 116);
}

/* ---------- Minimapa ---------- */
const mini = $('mini'), mc = mini.getContext('2d');
function drawMini() { // minimapa estilo GPS: gira junto com o helicóptero (frente sempre para cima)
  const W = mini.width, span = 900, sc = W/span, c = Math.cos(st.yaw), s = Math.sin(st.yaw), ox = PF.active ? PF.x : st.x, oz = PF.active ? PF.z : st.z;
  const rot = (x, z) => { const dx = (x - ox)*sc, dz = (z - oz)*sc; return [W/2 + dx*c - dz*s, W/2 + dx*s + dz*c]; };
  mc.fillStyle = '#2a78a0'; mc.fillRect(0, 0, W, W);
  mc.save(); mc.translate(W/2, W/2); mc.rotate(st.yaw); const big = span*1.5;
  mc.drawImage(gc, P(ox - big/2), P(oz - big/2), big*PX, big*PX, -big*sc/2, -big*sc/2, big*sc, big*sc); mc.restore();
  const dot = (x, z, col, r = 4, edge) => { let [mx, my] = rot(x, z); const out = mx < 5 || my < 5 || mx > W - 5 || my > W - 5; if (out && !edge) return; mx = clamp(mx, 5, W - 5); my = clamp(my, 5, W - 5);
    mc.fillStyle = col; mc.beginPath(); mc.arc(mx, my, out ? 3 : r, 0, 7); mc.fill(); mc.strokeStyle = '#000'; mc.lineWidth = 1.2; mc.stroke(); };
  for (const f of fires) dot(f.b.x, f.b.z, '#ff6a1a', 4);
  if (suspect.visible) dot(sus.x, sus.z, '#111', 4, true);
  if (EV && hasEq('radar')) dot(EV.x, EV.z, '#ff2a2a', 4, true);
  dot(pads.base.x, pads.base.z, '#d8261c', 4); dot(pads.hosp.x, pads.hosp.z, '#fff', 4);
  if (PF.active) dot(st.x, st.z, '#4fb3ea', 4, true);
  const tg = missionTarget(); if (tg) dot(tg.x, tg.z, Math.floor(perfT*3) % 2 ? '#ffcc1f' : '#e2231a', 6, true);
  if (!CK_ON) { mc.fillStyle = '#fff'; mc.strokeStyle = '#000'; mc.lineWidth = 1.5; mc.beginPath(); mc.moveTo(W/2, W/2 - 8); mc.lineTo(W/2 + 6, W/2 + 6); mc.lineTo(W/2, W/2 + 3); mc.lineTo(W/2 - 6, W/2 + 6); mc.closePath(); mc.fill(); mc.stroke(); }
  const nx = W/2 + s*(W/2 - 11), ny = W/2 - c*(W/2 - 11); mc.fillStyle = '#e2231a'; mc.beginPath(); mc.arc(nx, ny, 8, 0, 7); mc.fill();
  mc.fillStyle = '#fff'; mc.font = '700 11px Archivo,sans-serif'; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText('N', nx, ny + 1); mc.textBaseline = 'alphabetic';
}

/* ---------- HUD ---------- */
let hudT = 0;
function updHud(dt) {
  // o rádio fica sempre logo abaixo do painel do canto (que cresce com os assentos e a meta)
  if (!IS_TOUCH) { const tl = document.querySelector('#hud .tl'); if (tl) { const y = Math.round(tl.getBoundingClientRect().bottom + 8) + 'px'; if ($('radio').style.top !== y) $('radio').style.top = y; } }
  hudT += dt; if (hudT < .1) return; hudT = 0;
  const rk = rankIdx(), nx = RANKS[rk + 1];
  $('money').textContent = G.free ? T('freeFlight') : fmt(G.money); $('rank').textContent = G.free ? CITY.name : rankName(rk) + ' · ' + G.rep + ' rep.' + (CITY.story ? ' · ' + storyGoalText() : '');
  $('repBar').style.width = (nx != null ? (G.rep - RANKS[rk])/(nx - RANKS[rk])*100 : 100) + '%';
  $('heliName').textContent = HSPEC.n; $('clock').textContent = clockText() + ' · ' + T({ sol: 'wsun', chuva: 'wrain', neblina: 'wfog' }[weather]) + ' · ' + CITY.name;
  $('mTitle').textContent = M ? M.title : offer ? T('hudCall', { t: offer.title }) : T('hudNoMission');
  $('mDesc').textContent = missionText();
  const bar = $('mBar'); bar.style.width = (M ? clamp(M.prog || 0, 0, 1)*100 : offer ? offerT/32*100 : 0) + '%'; bar.style.background = M && M.type === 'incendio' ? '#e2231a' : '#ffcc1f';
  const tg = missionTarget();
  if (tg) { const dx = tg.x - st.x, dz = tg.z - st.z, fx = -Math.sin(st.yaw), fz = -Math.cos(st.yaw), rx = Math.cos(st.yaw), rz = -Math.sin(st.yaw);
    $('arrow').style.transform = `rotate(${Math.atan2(dx*rx + dz*rz, dx*fx + dz*fz)}rad)`; $('arrow').style.visibility = 'visible'; const d = Math.hypot(dx, dz); $('mDist').textContent = d > 1000 ? (d/1000).toFixed(1).replace('.', LANG === 'pt' ? ',' : '.') + ' km' : Math.round(d) + ' m'; }
  else { $('arrow').style.visibility = 'hidden'; $('mDist').textContent = ''; }
  $('mTime').textContent = M && M.t != null ? Math.max(0, Math.ceil(M.t)) + ' s' : ''; $('mTime').style.color = M && M.t != null && M.t < 20 ? '#ff6a5a' : '';
  { const n = HSPEC.seats, el = $('seats'); if (el.dataset.k !== n + ':' + st.pax) { el.dataset.k = n + ':' + st.pax;
    el.innerHTML = n ? `<span class="sl">${T('pSeats')} ${st.pax}/${n}</span>` + Array.from({ length: n }, (_, i) => `<i class="${i < st.pax ? 'on' : ''}"></i>`).join('') : ''; } }
  $('gmini').textContent = T('gmini', { alt: Math.round(st.y), v: Math.round(Math.hypot(st.vx, st.vz)*3.6), f: Math.round(st.fuel/fuelCap()*100), d: Math.round(st.dmg/armorCap()*100) });
  $('svc').textContent = svcText || (st.fuel/fuelCap() < .2 ? T('fuelLow') : st.landed && dxz(st, pads.base) < 20 ? T('atBase') : '');
  document.querySelectorAll('[data-act=KeyL]').forEach(b => b.classList.toggle('on', st.spotOn));
  document.querySelectorAll('[data-act=Space]').forEach(b => b.classList.toggle('on', st.water > 0));
  document.querySelectorAll('[data-act=KeyI]').forEach(b => b.classList.toggle('on', st.engine));
  document.querySelectorAll('[data-act=KeyV]').forEach(b => b.classList.toggle('on', !!(M && M.support)));
  document.querySelectorAll('[data-act=KeyE]').forEach(b => { b.classList.toggle('on', PF.active); b.classList.toggle('dim', !PF.active && !st.landed); if (b.lastChild && b.lastChild.nodeType === 3) b.lastChild.textContent = T(!PF.active ? 'hbExit' : (footTarget() || {}).k === 'heli' ? 'hbEnter' : 'hbAct'); });
  document.body.classList.toggle('incab', camMode === 1);
  if (IS_TOUCH) { // no celular, só aparecem os botões que servem agora
    const foot = PF.active, atBase = st.landed && dxz(st, pads.base) < 20 || foot && !PF.roof && dxz(PF, hangarDoor()) < 14;
    const hide = { Space: foot || !(hasEq('balde') || hasEq('canhao')), KeyL: foot || !hasEq('holofote'), KeyG: foot || !hasEq('megafone'), KeyK: foot || !hasEq('gas'), KeyV: !M, KeyH: !atBase, KeyI: foot, KeyE: !(st.landed || foot) };
    document.querySelectorAll('#hotbar [data-act]').forEach(b => b.classList.toggle('hide', !!hide[b.dataset.act])); }
  $('radio').classList.toggle('quiet', !offer && performance.now() - lastRadio > 7000);
  drawPanel(); drawMini(); renderRadio();
}

/* ---------- Telas ---------- */
const ov = $('ov'), card = $('card');
function show(html) { card.innerHTML = html; ov.hidden = false; card.scrollTop = 0; const b = card.querySelector('button'); if (b) try { b.focus(); } catch (e) {} }
function hideOv() { ov.hidden = true; }
const btn = (id, t, cls = '') => `<button class="go ${cls}" id="${id}">${t}</button>`;
function on(id, f) { const e = $(id); if (e) e.onclick = f; }
/* ---------- Tela inicial (arte do jogo) ---------- */
// posições dos botões desenhados na arte (imagem 1280x720)
const TS_ROWS = [212, 276, 340, 403, 466, 530, 593];
let tsFocus = 0;
function tsScale() { const ts = $('ts'); if (ts) ts.style.setProperty('--u', (ts.clientWidth/1280) + 'px'); }
addEventListener('resize', tsScale);
function showMain() {
  playing = false; paused = false; $('hud').hidden = true; hideOv(); if (typeof PF !== 'undefined' && PF.active) enterHeli();
  const title = $('title'); title.hidden = false; $('tsLoad').hidden = true; tsScale();
  const sv = loadSave();
  const items = [['mStart', showModes], ['mFree', startFree], ['mCity', showCities], ['mLoad', showLoad], ['mHangar', showShowroom], ['mOptions', () => showOptions(showMain)], ['mQuit', showThanks]];
  const paint = LANG !== 'en';
  $('tsBtns').innerHTML = items.map(([k], i) => `<button class="tsb${paint ? ' paint' : ''}" style="top:${TS_ROWS[i]/7.2}%" data-i="${i}" aria-label="${T(k)}"><span class="lbl">${T(k)}</span></button>`).join('');
  $('tsBtns').querySelectorAll('.tsb').forEach(b => { b.onclick = () => { sfx('click'); items[+b.dataset.i][1](); }; b.onmouseenter = () => { tsFocus = +b.dataset.i; }; });
  $('tsCorner').innerHTML = `<span>${CITY.name.toUpperCase()}${sv ? ' · ' + fmt(sv.money) : ''}</span><button data-l="en"${LANG === 'en' ? ' class="on"' : ''}>EN</button><button data-l="pt"${LANG === 'pt' ? ' class="on"' : ''}>PT</button>`;
  $('tsCorner').querySelectorAll('button').forEach(b => b.onclick = () => { if (b.dataset.l !== LANG) setLang(b.dataset.l); });
  const bs = $('tsBtns').querySelectorAll('.tsb'); if (bs[tsFocus]) try { bs[tsFocus].focus({ preventScroll: true }); } catch (e) {}
}
addEventListener('keydown', e => { // setas navegam pelo menu inicial
  if (playing || $('title').hidden || !ov.hidden) return; const bs = $('tsBtns').querySelectorAll('.tsb'); if (!bs.length) return;
  if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { e.preventDefault(); tsFocus = (tsFocus + (e.code === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length; bs[tsFocus].focus(); sfx('click', .5); }
});
function startCareerMenu() {
  const sv = loadSave();
  if (!sv) { G = newCareer(); save(); return beginCareer(); }
  show(`<img class="logo" src="img/logo.jpg" alt="SOS Copter"><h2>${T('mStart').charAt(0) + T('mStart').slice(1).toLowerCase()}</h2><p>${T('newWarn', { c: CITY.name, r: rankName(Math.min(sv.rank || 0, 4)), m: fmt(sv.money) })}</p>
  <div class="row">${btn('newOk', T('startNew'))}${btn('contB', T('cont'), 'alt')}${btn('back', T('back'), 'alt')}</div>`);
  on('newOk', () => { G = newCareer(); save(); beginCareer(); }); on('contB', () => { G = sv; beginCareer(); }); on('back', showMain);
}
function startFree() { G = freeCareer(); beginCareer(); }
function showLoad() {
  const sv = loadSave();
  show(`<img class="logo" src="img/logo.jpg" alt="SOS Copter"><h2>${T('loadTitle')}</h2>
  ${sv ? `<div class="stats">${CITY.name} · ${rankName(Math.min(sv.rank || 0, 4))}<br>${T('cashLbl')}: <b>${fmt(sv.money)}</b> · ${sv.done} ✓ · ${sv.owned.length} ✈</div><div class="row">${btn('contB', T('cont'))}</div>` : `<p>${T('noSave', { c: CITY.name })}</p>`}
  <label class="small">${T('pasteLabel')}<textarea id="imp" rows="3"></textarea></label><div class="row">${btn('load', T('loadCode'), 'alt')}${btn('back', T('back'), 'alt')}</div><p id="cmsg" class="small"></p>`);
  on('contB', () => { G = sv; beginCareer(); });
  on('load', () => { try { importCode($('imp').value); $('cmsg').textContent = T('loaded'); setTimeout(() => beginCareer(), 400); } catch (e) { $('cmsg').textContent = T('invalid'); } });
  on('back', showMain);
}
function showCities() {
  show(`<img class="logo" src="img/logo.jpg" alt="SOS Copter"><h2>${T('cityTitle')}</h2><p class="small">${T('cityNote')}</p><div class="citylist">${Object.values(CITIES).map(c =>
    `<button class="citybtn${c.id === CITY.id ? ' cur' : ''}" data-c="${c.id}"><b>${c.name}</b><span>${L(c.desc)}</span>${c.id === CITY.id ? `<span class="tag">${T('cityCur')}</span>` : ''}</button>`).join('')}</div>${btn('back', T('back'), 'alt')}`);
  card.querySelectorAll('.citybtn').forEach(b => b.onclick = () => { if (b.dataset.c === CITY.id) showMain(); else setCity(b.dataset.c); });
  on('back', showMain);
}
let showSel = 'schwaiter';
function showShowroom() {
  const sv = loadSave(), owned = sv ? sv.owned : ['schwaiter'], sel = heliById(showSel);
  show(`<div class="hz"></div><h2>${T('showroomTitle')}</h2><p class="small">${T('showroomNote')}</p>
  <div class="pvbox"><div id="pvSlot"></div><div class="pvname"><b>${sel.n}</b><span>${L(sel.d)}</span></div></div>
  ${[1, 2, 3, 4].map(t => `<h4>${T('tier', { n: t })}</h4><div class="grid">${HELIS.filter(h => h.tier === t).map(h => `<div class="hc${h === sel ? ' sel' : ''}${owned.includes(h.id) ? ' cur' : ''}" data-pv="${h.id}"><b>${h.n}</b><span class="small">${L(h.d)}</span>
    <div class="st"><span>${T('sSpeed')}</span><em>${statBar(h.kmh, 320)}</em><span>${T('sSeats')}</span><em>${statBar(h.seats, 15)}</em><span>${T('sBucket')}</span><em>${statBar(h.bucket, 1800)}</em><span>${T('sArmor')}</span><em>${statBar(h.armor, 220)}</em></div>
    <span class="small">${T('seatsSpeed', { s: h.seats, v: h.kmh })} · ${h.price ? fmt(h.price) : '—'}</span>${owned.includes(h.id) ? `<span class="tag">${T('owned')}</span>` : ''}</div>`).join('')}</div>`).join('')}
  <p class="small"><i>${T('secretHint')}</i></p>${btn('back', T('back'))}`);
  const cv = hangarPreview(sel); if (cv) $('pvSlot').appendChild(cv); else $('pvSlot').parentNode.style.display = 'none';
  card.querySelectorAll('[data-pv]').forEach(d => d.onclick = () => { showSel = d.dataset.pv; showShowroom(); });
  on('back', showMain);
}
function showThanks() {
  const d = document.createElement('div'); d.className = 'thanks';
  d.innerHTML = `<div><img src="img/icon-192.png" alt="" width="96" height="96" style="border-radius:20px"><div style="margin:18px 0">${T('thanks')}</div><p>${T('thanksSub')}</p><p style="font-size:12px;opacity:.75;max-width:420px;margin:10px auto">In Hoc Signo Ludimus · Rodrigo Torquato Mazzoli<br>${T('assetCred')}</p><button class="go" id="thxBack">${T('backTitle')}</button></div>`;
  document.body.appendChild(d); try { window.close(); } catch (e) {}
  d.querySelector('#thxBack').onclick = () => { d.remove(); showMain(); };
}
function showControls(back) {
  show(`<h2>${T('ctrlTitle')}</h2><div class="keys">${T('ctrl').map(([k, d]) => `<kbd>${k}</kbd><span>${d}</span>`).join('')}</div>
  <p class="small">${T('ctrlPad')}</p><p class="small">${T('ctrlLand')}</p>${btn('back', T('back'))}`);
  on('back', back);
}
function showOptions(back) {
  show(`<h2>${T('optTitle')}</h2><button class="go ctrlTop" id="ctrlB">⌨ ${T('seeControls')}</button><div class="opts">
  <label>${T('optMode')}<select id="omd">${[0, 1, 2].map(i => `<option value="${i}"${OPT.mode === i ? ' selected' : ''}>${T('fm' + i)}: ${T('fm' + i + 'd')}</option>`).join('')}</select></label>
  <label>${T('optDetail')}<select id="odt">${[1, 0].map(i => `<option value="${i}"${(OPT.detail !== 0 ? 1 : 0) === i ? ' selected' : ''}>${T('dt' + i)}</option>`).join('')}</select></label>
  <label>${T('optQuality')}<select id="oq">${[0, 1, 2].map(i => `<option value="${i}"${OPT.quality === i ? ' selected' : ''}>${T('q' + i)}</option>`).join('')}</select></label>
  <label>${T('optView')}<select id="ovw">${[0, 1, 2].map(i => `<option value="${i}"${OPT.view === i ? ' selected' : ''}>${T('v' + i)}</option>`).join('')}</select></label>
  <label>${T('language')}<select id="olang"><option value="pt"${LANG === 'pt' ? ' selected' : ''}>Português</option><option value="en"${LANG === 'en' ? ' selected' : ''}>English</option></select></label>
  <label>${T('optVol')}<input type="range" id="ov1" min="0" max="1" step=".05" value="${OPT.vol}"></label>
  <label>${T('optMusic')}<input type="range" id="ov4" min="0" max="1" step=".05" value="${OPT.music}"></label>
  <label>${T('optSfx')}<input type="range" id="ov2" min="0" max="1" step=".05" value="${OPT.sfx}"></label>
  <label>${T('optRadio')}<input type="range" id="ov3" min="0" max="1" step=".05" value="${OPT.radio}"></label>
  <label>${T('optSens')}<input type="range" id="osn" min=".5" max="1.6" step=".05" value="${OPT.sens}"></label>
  <label class="chk"><input type="checkbox" id="ops1"${OPT.ps1 ? ' checked' : ''}> ${T('optPs1')}</label>
  <label class="chk"><input type="checkbox" id="odi"${OPT.dither ? ' checked' : ''}> ${T('optDither')}</label>
  <label class="chk"><input type="checkbox" id="oin"${OPT.invert ? ' checked' : ''}> ${T('optInvert')}</label>
  <label class="chk"><input type="checkbox" id="ocy"${OPT.cycle ? ' checked' : ''}> ${T('optCycle')}</label>
  <label class="chk"><input type="checkbox" id="owe"${OPT.weather ? ' checked' : ''}> ${T('optWeather')}</label></div>
  <div class="row">${btn('night', dayF > .5 ? T('skipNight') : T('skipDay'), 'alt')}${btn('back', T('back'))}</div>`);
  const sync = () => { const ps = OPT.ps1; OPT.mode = +$('omd').value; OPT.ps1 = $('ops1').checked; OPT.dither = $('odi').checked; if (ps !== OPT.ps1) setPS1();
    OPT.view = +$('ovw').value; OPT.quality = +$('oq').value; OPT.detail = +$('odt').value; OPT.vol = +$('ov1').value; OPT.sfx = +$('ov2').value; OPT.music = +$('ov4').value; OPT.radio = +$('ov3').value; OPT.sens = +$('osn').value; OPT.invert = $('oin').checked; OPT.cycle = $('ocy').checked; OPT.weather = $('owe').checked; applyRes(); applyVol(); };
  card.querySelectorAll('select:not(#olang),input').forEach(e => e.addEventListener('input', sync));
  $('olang').onchange = e => { save(); setLang(e.target.value); };
  on('night', () => { tod = dayF > .5 ? .9 : .3; updSky(0); showOptions(back); }); on('ctrlB', () => showControls(() => showOptions(back))); on('back', back);
}
function togglePause() {
  if (!playing) return; if (!ov.hidden && !paused) return;
  if (paused) { paused = false; hideOv(); return; }
  paused = true; pauseMenu();
}
function pauseMenu() {
  const atBase = st.landed && dxz(st, pads.base) < 20;
  show(`<img class="logo" src="img/logo.jpg" alt="SOS Copter"><h2>${T('pause')}</h2><p class="small">${G.free ? T('freeFlight') + ' · ' + CITY.name : ''}${G.free ? '' : T('pauseStats', { rank: rankName(rankIdx()), money: fmt(G.money), done: G.done, failed: G.failed })}</p>
  <div class="row">${btn('res', T('resume'))}${atBase && !M ? btn('hang', T('hangar'), 'alt') : ''}</div>
  <div class="row">${btn('optb', T('options'), 'alt')}${btn('ctrb', T('controls'), 'alt')}${btn('codeb', T('saveCode'), 'alt')}</div>
  <div class="row">${CITY.story && !G.free ? btn('stMaps', T('stChoose'), 'alt') : ''}${btn('menu', T('quitMenu'), 'alt')}</div>`);
  on('res', () => { paused = false; hideOv(); }); on('hang', openHangar); on('optb', () => showOptions(pauseMenu)); on('ctrb', () => showControls(pauseMenu));
  on('codeb', () => showCode(pauseMenu)); on('stMaps', () => { if (M) endMission(); save(); showStory(); }); on('menu', () => { if (M) endMission(); save(); paused = false; showMain(); });
}
function showCode(back) {
  save(); const code = exportCode();
  show(`<h2>${T('codeTitle')}</h2><p class="small">${T('codeInfo')}</p>
  <textarea id="code" readonly rows="4">${code}</textarea><div class="row">${btn('copy', T('copy'))}</div>
  <label class="small">${T('pasteLabel')}<textarea id="imp" rows="3"></textarea></label><div class="row">${btn('load', T('loadCode'), 'alt')}${btn('back', T('back'), 'alt')}</div><p id="cmsg" class="small"></p>`);
  on('copy', () => { const t = $('code'); t.select(); (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => $('cmsg').textContent = T('copied')).catch(() => $('cmsg').textContent = T('copyFail')); });
  on('load', () => { try { importCode($('imp').value); spawnHeli(heliById(G.heli)); resetFlight(); $('cmsg').textContent = T('loaded'); } catch (e) { $('cmsg').textContent = T('invalid'); } });
  on('back', back);
}

/* ---------- Hangar ---------- */
let pv = null, hangarSel = null;
function hangarPreview(spec) {
  if (!pv) { const c = document.createElement('canvas'); c.width = 720; c.height = 320; c.className = 'pvc';
    let r; try { r = new THREE.WebGLRenderer({ canvas: c, antialias: true }); } catch (e) { return null; }
    const s = new THREE.Scene(); s.background = new THREE.Color('#2a2f36'); s.fog = new THREE.Fog('#2a2f36', 30, 70);
    const fc = document.createElement('canvas'); fc.width = fc.height = 256; const x = fc.getContext('2d'); x.fillStyle = '#8b8f94'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${Math.random()*.08})`; x.fillRect(Math.random()*256, Math.random()*256, 3, 3); }
    x.strokeStyle = '#ffcc1f'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 90, 0, 7); x.stroke(); x.fillStyle = '#ffcc1f'; x.font = '900 120px Archivo,Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('H', 128, 134);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(fc) })); floor.rotation.x = -Math.PI/2; s.add(floor);
    const wc = document.createElement('canvas'); wc.width = 256; wc.height = 64; const w = wc.getContext('2d'); w.fillStyle = '#c23a2c'; w.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 256; i += 32) { w.fillStyle = '#a8301f'; w.fillRect(i, 0, 3, 64); } w.fillStyle = '#fff'; w.font = '900 20px Archivo,Arial'; w.textAlign = 'center'; w.fillText(T('hangarSign'), 128, 40);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(wc) })); wall.position.set(0, 5, -12); s.add(wall);
    for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(26, 12), new THREE.MeshLambertMaterial({ color: '#5a6068' })); side.position.set(sx*13, 6, 0); side.rotation.y = -sx*Math.PI/2; s.add(side); }
    for (let i = -1; i <= 1; i++) { const lamp = new THREE.Mesh(new THREE.BoxGeometry(4, .2, .6), new THREE.MeshBasicMaterial({ color: '#fff6d8' })); lamp.position.set(i*7, 11, -2); s.add(lamp); }
    const tb = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 1), new THREE.MeshLambertMaterial({ color: '#d8261c' })); tb.position.set(-8, .8, -9); s.add(tb);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1.4, 10), new THREE.MeshLambertMaterial({ color: '#2f6fd0' })); drum.position.set(8.5, .7, -8.5); s.add(drum);
    s.add(new THREE.HemisphereLight('#ffffff', '#555', .7)); const dl = new THREE.DirectionalLight('#fff3dc', .8); dl.position.set(5, 12, 8); s.add(dl);
    const pcam = new THREE.PerspectiveCamera(40, 720/320, .1, 100); pv = { c, r, s, cam: pcam, model: null, spec: null, raf: 0 }; }
  if (pv.spec !== spec) { if (pv.model) pv.s.remove(pv.model.g); pv.model = makeHeli(spec); pv.s.add(pv.model.g); pv.spec = spec;
    const k = spec.size; pv.cam.position.set(14*k, 6*k, 17*k); pv.cam.lookAt(0, 2*k, -1); }
  if (!pv.raf) { const loop = () => { if (ov.hidden || !document.body.contains(pv.c)) { pv.raf = 0; return; } pv.model.g.rotation.y += .008; for (const r of pv.model.rotors) r.rotation.y += .05; for (const t of pv.model.tails) t.rotation.x += .08; pv.r.render(pv.s, pv.cam); pv.raf = requestAnimationFrame(loop); }; pv.raf = requestAnimationFrame(loop); }
  return pv.c;
}
function openHangar() {
  if (!playing) return;
  if (!(st.landed && dxz(st, pads.base) < 20) && !(PF.active && !PF.roof && dxz(PF, hangarDoor()) < 14)) { toast(T('hangarAtBase'), 2000); return; }
  if (M) { toast(T('missionsLeft'), 2000); return; }
  paused = true; renderHangar();
}
const statBar = (v, max) => `<i style="width:${clamp(v/max, 0, 1)*100}%"></i>`;
function heliCard(h, sel) {
  const own = G.owned.includes(h.id), cur = G.heli === h.id, sellP = h.sell || Math.round(h.price*.5);
  return `<div class="hc${cur ? ' cur' : ''}${h === sel ? ' sel' : ''}" data-pv="${h.id}"><b>${h.n}</b><span class="small">${L(h.d)}</span>
  <div class="st"><span>${T('sSpeed')}</span><em>${statBar(h.kmh, 320)}</em><span>${T('sClimb')}</span><em>${statBar(h.climb, 16)}</em><span>${T('sSeats')}</span><em>${statBar(h.seats, 15)}</em>
  <span>${T('sBucket')}</span><em>${statBar(h.bucket, 1800)}</em><span>${T('sTank')}</span><em>${statBar(h.fuel, 150)}</em><span>${T('sArmor')}</span><em>${statBar(h.armor, 220)}</em></div>
  <span class="small">${T('seatsSpeed', { s: h.seats, v: h.kmh })}</span>
  <div class="row tight">${cur ? `<span class="tag">${T('inUse')}</span>` : own ? `<button class="go alt sm" data-use="${h.id}">${T('use')}</button>` : `<button class="go sm" data-buy="${h.id}"${G.money < h.price ? ' disabled' : ''}>${T('buy', { p: fmt(h.price) })}</button>`}
  ${own && !cur ? `<button class="go alt sm" data-sell="${h.id}">${T('sell', { p: fmt(sellP) })}</button>` : ''}</div></div>`;
}
function renderHangar(msg = '') {
  const FC = fuelCap(), fuelCost = Math.round((FC - st.fuel)*2), fixCost = Math.round(st.dmg*4), sel = heliById(hangarSel || G.heli) || HSPEC, gear = G.gear[G.heli] || [];
  const tiers = [1, 2, 3, 4].map(t => `<h4>${T('tier', { n: t })}</h4><div class="grid">${HELIS.filter(h => h.tier === t).map(h => heliCard(h, sel)).join('')}</div>`).join('');
  const secret = G.owned.includes('apaxe') ? `<h4>${T('secretTier')}</h4><div class="grid">${heliCard(heliById('apaxe'), sel)}</div>` : `<p class="small"><i>${T('secretHint')}</i></p>`;
  show(`<div class="hz"></div><h2>${T('hangarTitle')}</h2><p class="small">${T('cashRank', { money: fmt(G.money), rank: rankName(rankIdx()) })}</p>
  <div class="pvbox"><div id="pvSlot"></div><div class="pvname"><b>${sel.n}</b><span>${L(sel.d)}</span></div></div>
  <div class="row">${btn('fuel', T('fillTank', { c: fmt(fuelCost) }), 'alt')}${btn('fix', T('repair', { c: fmt(fixCost) }), 'alt')}</div>
  <h3>${T('equipFor', { heli: HSPEC.n })}</h3><p class="small">${T('gearNote')}</p><div class="grid eq">${EQUIP.map(e => { const no = eqFits(e, HSPEC);
    return gear.includes(e.id) ? `<div class="hc cur"><b>${L(e.n)}</b><span class="small">${L(e.d)}</span><span class="tag">${e.stock ? T('factory') : T('installed')}</span></div>`
    : `<div class="hc"><b>${L(e.n)}</b><span class="small">${L(e.d)}</span>${no ? `<span class="small"><i>${no}</i></span>` : `<button class="go sm" data-eq="${e.id}"${G.money < e.price ? ' disabled' : ''}>${T('buy', { p: fmt(e.price) })}</button>`}</div>`; }).join('')}</div>
  <h3>${T('helis')}</h3>${tiers}${secret}
  <p class="small" id="hmsg">${esc(msg)}</p>${btn('back', T('backFly'))}`);
  const cv = hangarPreview(sel); if (cv) $('pvSlot').appendChild(cv); else $('pvSlot').parentNode.style.display = 'none';
  card.querySelectorAll('[data-pv]').forEach(d => d.addEventListener('click', e => { if (e.target.closest('button')) return; hangarSel = d.dataset.pv; renderHangar(); }));
  on('fuel', () => { const c = Math.min(fuelCost, G.money); st.fuel += c/2; G.money -= c; sfx('cash'); save(); renderHangar(T('tankDone')); });
  on('fix', () => { const c = Math.min(fixCost, G.money); st.dmg = Math.max(0, st.dmg - c/4); G.money -= c; sfx('cash'); save(); renderHangar(T('repairDone')); });
  card.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const h = heliById(b.dataset.buy); if (G.money < h.price) return; G.money -= h.price; G.owned.push(h.id); G.gear[h.id] = ['megafone']; useHeli(h.id); hangarSel = h.id; sfx('cash'); renderHangar(T('bought', { x: h.n })); });
  card.querySelectorAll('[data-use]').forEach(b => b.onclick = () => { useHeli(b.dataset.use); hangarSel = b.dataset.use; renderHangar(T('switched', { x: HSPEC.n })); });
  card.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => { const h = heliById(b.dataset.sell), p = h.sell || Math.round(h.price*.5); G.owned = G.owned.filter(x => x !== h.id); delete G.gear[h.id]; G.money += p; sfx('cash'); save(); hangarSel = G.heli; renderHangar(T('soldMsg', { x: h.n, p: fmt(p) })); });
  card.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => { const e = eqById(b.dataset.eq); if (G.money < e.price) return; G.money -= e.price; (G.gear[G.heli] = G.gear[G.heli] || []).push(e.id); if (e.id === 'tanque') st.fuel = Math.min(fuelCap(), st.fuel); sfx('cash'); save(); renderHangar(T('bought', { x: L(e.n) })); });
  on('back', () => { paused = false; hideOv(); });
}
function useHeli(id) { G.heli = id; G.gear[id] = G.gear[id] || ['megafone']; spawnHeli(heliById(id)); const y = st.yaw; resetFlight(); st.yaw = y; save(); }
function crashDialog() {
  if (PF.active) enterHeli();
  playing = false; const lost = OPT.mode === 2 && !G.free, h = HSPEC; let html;
  if (G.free) { spawnHeli(h); resetFlight(); playing = true; toast(T('crashInsured'), 3000); return; }
  G.rep = Math.max(0, G.rep - 8);
  if (lost) {
    G.owned = G.owned.filter(x => x !== h.id); delete G.gear[h.id];
    if (!G.owned.length) { G.owned = ['schwaiter']; G.gear.schwaiter = ['megafone']; }
    G.heli = G.owned[0]; G.gear[G.heli] = G.gear[G.heli] || ['megafone'];
    html = `<p>${T('crashLost', { heli: h.n })}</p>${G.heli === 'schwaiter' && G.owned.length === 1 ? `<p>${T('crashLoan', { heli: heliById('schwaiter').n })}</p>` : ''}`;
  } else {
    const fee = Math.round(Math.min(G.money, Math.max(150, (h.price || h.sell || 750)*.2))); G.money -= fee;
    html = `<p>${T('crashInsured')}</p><div class="stats">${T('fee')}: <b>${fmt(fee)}</b></div>`;
  }
  save();
  show(`<h2>${T('crashTitle')}</h2>${html}<div class="stats">${T('repLbl')}: <b>−8</b><br>${T('cashLbl')}: <b>${fmt(G.money)}</b></div>${btn('again', T('backBase'))}`);
  on('again', () => { spawnHeli(heliById(G.heli)); resetFlight(); hideOv(); playing = true; });
}
