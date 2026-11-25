// core.js — utilidades e geração da cidade a partir do pacote escolhido (city-*.js registram-se em CITIES)
// cidade padrão: Miami
const CITY = (() => { let id = 'miami'; try { id = localStorage.getItem('ar.city') || id; } catch (e) {} return CITIES[id] || CITIES.miami; })();
function setCity(id) { try { localStorage.setItem('ar.city', id); sessionStorage.setItem('ar.skipSplash', '1'); } catch (e) {} location.reload(); }
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
let seed = 1977; // seed fixa: a cidade é sempre a mesma
const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];
const pickR = a => a[Math.floor(Math.random() * a.length)];
const HALF = CITY.half, TEX = (matchMedia('(pointer:coarse)').matches ? 2048 : 4096), PX = TEX / (HALF*2), P = v => (v + HALF) * PX;

/* ---------- Geografia vinda do pacote da cidade ---------- */
const coast = CITY.coast, rivers = CITY.rivers, roads = CITY.roads, parks = CITY.parks, pads = CITY.pads;
for (const k in pads) pads[k].id = k;
const islands = CITY.islands || [], beaches = CITY.beaches || [];
const padArr = Object.values(pads), padName = p => L(p.n);
for (const r of roads.concat(beaches)) { r.L = [0]; for (let i = 1; i < r.p.length; i++) r.L.push(r.L[i-1] + Math.hypot(r.p[i][0]-r.p[i-1][0], r.p[i][1]-r.p[i-1][1])); r.len = r.L[r.L.length-1]; }
function roadAt(r, s) {
  s = clamp(s, 0, r.len); let i = 1; while (i < r.L.length - 1 && r.L[i] < s) i++;
  const a = r.p[i-1], b = r.p[i], t = (s - r.L[i-1]) / ((r.L[i] - r.L[i-1]) || 1);
  const dx = b[0]-a[0], dz = b[1]-a[1], l = Math.hypot(dx, dz) || 1;
  return { x: a[0] + dx*t, z: a[1] + dz*t, tx: dx/l, tz: dz/l };
}
function dSeg(x, z, a, b) { const dx = b[0]-a[0], dz = b[1]-a[1]; let t = ((x-a[0])*dx + (z-a[1])*dz) / (dx*dx + dz*dz); t = clamp(t, 0, 1); return Math.hypot(a[0] + t*dx - x, a[1] + t*dz - z); }
function dPoly(x, z, p) { let m = 1e9; for (let i = 0; i < p.length - 1; i++) m = Math.min(m, dSeg(x, z, p[i], p[i+1])); return m; }
function inPoly(x, z, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const a = p[i], b = p[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; }
function ringDist(x, z, p) { let m = 1e9; for (let i = 0; i < p.length; i++) m = Math.min(m, dSeg(x, z, p[i], p[(i + 1) % p.length])); return m; }
function onIsland(x, z, m = 0) { for (const is of islands) if (inPoly(x, z, is.p) && (m <= 0 || ringDist(x, z, is.p) > m)) return is; return null; }
// cidades do SimCity 2000 (modo história) vêm em grade de quadras
const GRID = CITY.grid || null, gTile = GRID ? GRID.tileAt : null;
const gAny = (x, z, m, arr) => { for (const [a, b] of [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]]) { const i = gTile(x + a, z + b); if (i < 0 ? arr === GRID.water : arr[i]) return true; } return false; };
const nearBeach = (x, z, m) => GRID ? false : beaches.some(b => dPoly(x, z, b.p) < m);
function beachDist(x, z) { if (GRID) { const i = gTile(x, z); return i < 0 ? 0 : GRID.wd[i]*GRID.T; } let m = 1e9; for (const b of beaches) m = Math.min(m, dPoly(x, z, b.p)); return m; }
function isWater(x, z, m = 0) {
  if (GRID) return gAny(x, z, m, GRID.water);
  if (x > coast(z) - m && !onIsland(x, z, m)) return true;
  for (const k of CITY.lakes) { const ex = (x - k.x)/(k.rx + m), ez = (z - k.z)/(k.rz + m); if (ex*ex + ez*ez < 1) return true; }
  for (const r of rivers) if (dPoly(x, z, r.p) < r.w/2 + m) return true;
  return false;
}
const nearRoad = (x, z, m) => GRID ? gAny(x, z, m + 4, GRID.road) : roads.some(r => dPoly(x, z, r.p) < r.w/2 + m);
const inPark = (x, z, m) => parks.some(p => Math.hypot(x - p.x, z - p.z) < p.r + m);
const AP = CITY.airport, inAir = (x, z) => x > AP.x0 && x < AP.x1 && z > AP.z0 && z < AP.z1;
const zone = (x, z) => CITY.zone(x, z), bairro = (x, z) => CITY.district(x, z);

/* ---------- Prédios ---------- */
const B = [];
const addB = (x, z, w, d, h, c, fix, tag) => B.push({ x, z, hw: w/2, hd: d/2, h, c, fix, tag });
const fixed = CITY.fixed; for (const f of fixed) if (f.rel) { f.x = pads[f.rel].x + f.dx; f.z = pads[f.rel].z + f.dz; }
fixed.forEach(f => addB(f.x, f.z, f.w, f.d, f.h, f.c, 1, f.tag));
const pal = { low: ['#f1e4c8','#f4c7b8','#c9e1ea','#f6e7a1','#e6b58c','#ffffff','#d7e6c3','#efc9d9','#f0a98a'], mid: ['#e9e4da','#d8d4cc','#f1e7d0','#c7d3dc','#e7d2bf'],
  tall: ['#eef0f2','#d9dee3','#bcd3e2','#f3efe6','#a9bccb','#e4ddd0','#9fb7c9'], glass: ['#9fc4d8','#b7d3e0','#7fa9c2','#d9e4ea','#a6b8c4','#c9dde8','#8fb3c9'],
  deco: ['#f7c6d9','#bfe8dc','#d9c9f2','#ffd8b0','#a8e0ef','#fff1a8','#f4f4f0'], ind: ['#b8c0c8','#9fb0bf','#c9c2b5','#8e9aa6','#c4b49a'] };
if (GRID) for (const b of GRID.blds) { addB(b.x, b.z, b.w, b.d, b.h, b.c, 0, b.s); const nb = B[B.length - 1]; nb.zn = b.zn; nb.sc2 = b.k; }
else for (let gx = -HALF + 10; gx < HALF - 10; gx += 20) for (let gz = -HALF + 10; gz < HALF - 10; gz += 20) {
  const x = gx + 10, z = gz + 10, mx = (x + HALF) % 80, mz = (z + HALF) % 80;
  if (mx < 12 || mx > 68 || mz < 12 || mz > 68) continue; // ruas da grade
  if (isWater(x, z, 9) || nearBeach(x, z, 40) || nearRoad(x, z, 9) || inPark(x, z, 8) || inAir(x, z)) continue;
  if (padArr.some(p => Math.hypot(x - p.x, z - p.z) < 32)) continue;
  if (fixed.some(f => Math.abs(x - f.x) < f.w/2 + 12 && Math.abs(z - f.z) < f.d/2 + 12)) continue;
  const zn = zone(x, z); let p, h, c, s;
  if (zn === 'beach') { p = .9; h = 32 + rnd()*58; c = pick(pal.tall); s = 13 + rnd()*5; }
  else if (zn === 'cbd') { p = .9; h = 42 + rnd()*78; c = pick(pal.glass); s = 14 + rnd()*5; }
  else if (zn === 'artdeco') { p = .85; h = 7 + rnd()*10; c = pick(pal.deco); s = 12 + rnd()*5; }
  else if (zn === 'industrial') { p = .7; h = 7 + rnd()*7; c = pick(pal.ind); s = 16 + rnd()*3; }
  else if (zn === 'downtown') { p = .85; h = 10 + rnd()*32; c = pick(pal.low); s = 12 + rnd()*6; }
  else if (zn === 'highrise') { p = .75; h = rnd() < .5 ? 20 + rnd()*48 : 8 + rnd()*15; c = pick(h > 30 ? pal.tall : pal.mid); s = 11 + rnd()*6; }
  else if (zn === 'campus') { p = .25; h = 6 + rnd()*8; c = pick(pal.mid); s = 14 + rnd()*4; }
  else { p = .6; const t = rnd() < .07; h = t ? 22 + rnd()*24 : 5 + rnd()*11; c = pick(t ? pal.mid : pal.low); s = 9 + rnd()*7; }
  if (rnd() > p) continue;
  addB(x + (rnd() - .5)*2, z + (rnd() - .5)*2, s, s * (.8 + rnd()*.4), h, c); B[B.length - 1].zn = zn;
}
// modelos 3D (Kenney): cada prédio ganha um modelo, e o terreno/altura passam a ser os do modelo
if (typeof kAssign === 'function') for (const b of B) if (!b.fix && !(GRID && /^(svc|pow|misc|arco|ind)$/.test(b.sc2))) kAssign(b, b.zn, rnd);
B.forEach((b, i) => b.id = i);
const BG = new Map(), GC = 40, gk = (i, j) => i * 1000 + j;
for (const b of B) for (let i = Math.floor((b.x - b.hw - 4 + HALF)/GC); i <= Math.floor((b.x + b.hw + 4 + HALF)/GC); i++)
  for (let j = Math.floor((b.z - b.hd - 4 + HALF)/GC); j <= Math.floor((b.z + b.hd + 4 + HALF)/GC); j++) { const k = gk(i, j); if (!BG.has(k)) BG.set(k, []); BG.get(k).push(b); }
function bAt(x, z, m) { const l = BG.get(gk(Math.floor((x + HALF)/GC), Math.floor((z + HALF)/GC))); if (!l) return null; let best = null; for (const b of l) if (Math.abs(x - b.x) < b.hw + m && Math.abs(z - b.z) < b.hd + m && (!best || b.h > best.h)) best = b; return best; }
function bNear(x, z, m) { // busca pela grade espacial (rápido mesmo com muitos prédios)
  for (let i = Math.floor((x - m - 30 + HALF)/GC); i <= Math.floor((x + m + 30 + HALF)/GC); i++) for (let j = Math.floor((z - m - 30 + HALF)/GC); j <= Math.floor((z + m + 30 + HALF)/GC); j++) {
    const l = BG.get(gk(i, j)); if (l) for (const b of l) if (Math.abs(x - b.x) < b.hw + m && Math.abs(z - b.z) < b.hd + m) return true; }
  return false; }
// ponto aleatório numa praia; off > 0 entra no mar, off < 0 entra na terra
function beachAt(off, rand = Math.random) { if (GRID && GRID.shore.length) { const s = GRID.shore[Math.floor(rand()*GRID.shore.length)]; return { x: s.x + s.sx*off, z: s.z + s.sz*off }; } const tot = beaches.reduce((a, b) => a + b.len, 0); let r = rand()*tot, b = beaches[0];
  for (const x of beaches) { if ((r -= x.len) <= 0) { b = x; break; } } const p = roadAt(b, rand()*b.len); return { x: p.x + b.sea[0]*off, z: p.z + b.sea[1]*off }; }
function randGround() { for (let k = 0; k < 300; k++) { const x = -HALF + 40 + Math.random()*(HALF*2 - 80), z = -HALF + 40 + Math.random()*(HALF*2 - 80); if (isWater(x, z, 14) || nearBeach(x, z, 30) || bNear(x, z, 12) || inAir(x, z)) continue; return { x, z }; } return { x: parks[0].x, z: parks[0].z + 20 }; }

/* ---------- Mapa desenhado: chão 3D e minimapa ---------- */
function drawGridGround() { // cidades do SimCity 2000: pinta quadra por quadra
  const { N, T, H } = GRID, tp = T*PX, at = (r, q) => r >= 0 && q >= 0 && r < N && q < N ? r*N + q : -1;
  const zc = ['', '#c9d7b0', '#bfd0a4', '#c4cfd8', '#b9c7d4', '#d6cfa6', '#cfc597', '#b5b09a', '#b9b6a8', '#b0aea6'];
  for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) { const i = r*N + q, x = (q*T - H + HALF)*PX, y = (r*T - H + HALF)*PX;
    let col = GRID.water[i] ? (GRID.wd[i] === 0 && GRID.alt[i] < 2 ? '#2a78a0' : '#2f86b0') : zc[GRID.zon[i]] || (GRID.alt[i] > 8 ? '#c2b896' : '#cdc5b0');
    if (GRID.park[i]) col = '#6f9a4e'; else if (GRID.flat[i]) col = GRID.flat[i] === 0xdd || GRID.flat[i] === 0xde ? '#4a4a50' : '#9d9a92';
    g.fillStyle = col; g.fillRect(x, y, tp + .5, tp + .5);
    if (GRID.tree[i] && !GRID.water[i]) { g.fillStyle = '#93b06c'; g.fillRect(x + tp*.1, y + tp*.1, tp*.8, tp*.8); } }
  // ruas, rodovias e trilhos: um quadrado no centro + braços até as quadras vizinhas
  const net = (arr, w, col, dash) => { for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) { const i = r*N + q; if (!arr[i] || (arr === GRID.road && w < 12 && arr[i] === 2) || (arr === GRID.road && w >= 12 && arr[i] !== 2)) continue;
    const cx = (q*T - H + T/2 + HALF)*PX, cy = (r*T - H + T/2 + HALF)*PX, hw = w*PX/2; g.fillStyle = col; g.fillRect(cx - hw, cy - hw, hw*2, hw*2);
    for (const [a, d] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const j = at(r + a, q + d); if (j < 0 || !arr[j]) continue;
      if (d) g.fillRect(d > 0 ? cx : cx - tp/2, cy - hw, tp/2, hw*2); else g.fillRect(cx - hw, a > 0 ? cy : cy - tp/2, hw*2, tp/2); } } };
  net(GRID.rail, 4, '#7a5a3a'); net(GRID.road, 10, '#5b5b62'); net(GRID.road, 14, '#46464c');
}
const gc = document.createElement('canvas'); gc.width = gc.height = TEX; const g = gc.getContext('2d');
const rect = (r, c) => { g.fillStyle = c; g.fillRect(P(r.x0), P(r.z0), (r.x1 - r.x0)*PX, (r.z1 - r.z0)*PX); };
g.fillStyle = '#cdc5b0'; g.fillRect(0, 0, TEX, TEX);
if (GRID) drawGridGround(); else {
if (CITY.industrial) rect(CITY.industrial, '#b3aea4');
for (const r of CITY.greens || []) rect(r, '#93b06c');
g.strokeStyle = '#a8a398'; g.lineWidth = 5*PX;
for (let v = -HALF; v <= HALF; v += 80) { g.beginPath(); g.moveTo(P(v), 0); g.lineTo(P(v), TEX); g.stroke(); g.beginPath(); g.moveTo(0, P(v)); g.lineTo(TEX, P(v)); g.stroke(); }
g.fillStyle = '#6f9a4e'; for (const k of parks) { g.beginPath(); g.arc(P(k.x), P(k.z), k.r*PX, 0, 7); g.fill(); }
rect(AP, '#b9b6a8'); rect(AP.runway, '#4a4a50');
g.fillStyle = '#fff'; for (let x = AP.runway.x0 + 10; x < AP.runway.x1 - 5; x += 20) g.fillRect(P(x), P((AP.runway.z0 + AP.runway.z1)/2 - .5), 10*PX, PX);
const WC = '#2f86b0'; g.fillStyle = WC; g.strokeStyle = WC; g.lineCap = g.lineJoin = 'round';
for (const r of rivers) { g.lineWidth = r.w*PX; g.beginPath(); r.p.forEach((q, i) => i ? g.lineTo(P(q[0]), P(q[1])) : g.moveTo(P(q[0]), P(q[1]))); g.stroke(); }
for (const k of CITY.lakes) { g.beginPath(); g.ellipse(P(k.x), P(k.z), k.rx*PX, k.rz*PX, 0, 0, 7); g.fill(); }
g.fillStyle = CITY.bayColor || '#3d9dc2'; g.beginPath(); g.moveTo(TEX, 0); for (let z = -HALF; z <= HALF; z += 10) g.lineTo(P(coast(z)), P(z)); g.lineTo(TEX, TEX); g.fill();
if (CITY.reef) { // linha dos arrecifes (Recife)
  g.fillStyle = '#2a78a0'; g.beginPath(); g.moveTo(TEX, 0); for (let z = -HALF; z <= HALF; z += 10) g.lineTo(P(coast(z) + 62*HALF/800), P(z)); g.lineTo(TEX, TEX); g.fill();
  g.strokeStyle = '#6d7a66'; g.lineWidth = 4*PX; g.setLineDash([14*PX, 6*PX]); g.beginPath(); for (let z = -HALF; z <= HALF; z += 10) g.lineTo(P(coast(z) + 60*HALF/800), P(z)); g.stroke(); g.setLineDash([]); }
if (CITY.deepX) { g.fillStyle = '#2a78a0'; g.beginPath(); g.moveTo(TEX, 0); for (let z = -HALF; z <= HALF; z += 20) g.lineTo(P(CITY.deepX(z)), P(z)); g.lineTo(TEX, TEX); g.fill(); }
// ilhas: chão, ruas da grade e parques por cima da água
for (const is of islands) { g.save(); g.beginPath(); is.p.forEach((q, i) => i ? g.lineTo(P(q[0]), P(q[1])) : g.moveTo(P(q[0]), P(q[1]))); g.closePath(); g.fillStyle = '#cdc5b0'; g.fill(); g.clip();
  g.strokeStyle = '#a8a398'; g.lineWidth = 5*PX; for (let v = -HALF; v <= HALF; v += 80) { g.beginPath(); g.moveTo(P(v), 0); g.lineTo(P(v), TEX); g.stroke(); g.beginPath(); g.moveTo(0, P(v)); g.lineTo(TEX, P(v)); g.stroke(); }
  g.fillStyle = '#6f9a4e'; for (const k of parks) { g.beginPath(); g.arc(P(k.x), P(k.z), k.r*PX, 0, 7); g.fill(); } g.restore(); }
// cais do porto (Recife) e areia das praias
if (CITY.quay) { const BF = CITY.beachFrom; g.fillStyle = '#9d9a92'; g.beginPath(); for (let z = -HALF; z <= BF; z += 10) g.lineTo(P(coast(z) - 14), P(z)); for (let z = BF; z >= -HALF; z -= 10) g.lineTo(P(coast(z)), P(z)); g.fill(); }
g.strokeStyle = '#ecdca8'; g.lineCap = 'butt';
for (const bch of beaches) { g.lineWidth = 22*PX; g.beginPath(); bch.p.forEach((q, i) => i ? g.lineTo(P(q[0]), P(q[1])) : g.moveTo(P(q[0]), P(q[1]))); g.stroke(); }
g.lineCap = 'round';
for (const r of roads) { g.strokeStyle = '#5b5b62'; g.lineWidth = r.w*PX; g.beginPath(); r.p.forEach((q, i) => i ? g.lineTo(P(q[0]), P(q[1])) : g.moveTo(P(q[0]), P(q[1]))); g.stroke();
  g.strokeStyle = '#e9c84a'; g.lineWidth = .8*PX; g.setLineDash([6*PX, 6*PX]); g.stroke(); g.setLineDash([]); }
}
for (const b of B) { g.fillStyle = b.h > 30 ? '#6f6a62' : '#958f83'; g.fillRect(P(b.x - b.hw), P(b.z - b.hd), b.hw*2*PX, b.hd*2*PX); }
for (const p of padArr) { const base = p.kind === 'base', hosp = p.kind === 'hosp';
  g.fillStyle = base ? '#d8261c' : hosp ? '#ffffff' : '#2f3540'; g.beginPath(); g.arc(P(p.x), P(p.z), 12*PX, 0, 7); g.fill(); g.strokeStyle = '#ffcc1f'; g.lineWidth = 1.5*PX; g.stroke();
  g.fillStyle = base ? '#fff' : hosp ? '#d8261c' : '#ffcc1f'; g.font = `900 ${15*PX}px Archivo,Arial,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(hosp ? '+' : 'H', P(p.x), P(p.z) + PX); }
