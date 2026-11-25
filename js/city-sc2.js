// city-sc2.js — transforma uma cidade do SimCity 2000 (.sc2) num pacote de cidade do jogo (modo história)
// Os mapas ficam em js/maps/*.js, que registram SC2_MAPS[id] = { b64, title, author, level, thumb }.
// Cada quadra do .sc2 vira um quadrado de SC2_T metros: 128 quadras × 16 m = mapa de 2 km.
const SC2_MAPS = window.SC2_MAPS || (window.SC2_MAPS = {}), SC2_T = 16;

// tipo, altura e cor de cada construção do SimCity 2000 (códigos XBLD)
function sc2Info(c) {
  const R = (a, b) => c >= a && c <= b;
  if (R(0x70, 0x7b)) return { k: 'res', h: [6, 10], c: ['#f1e4c8', '#f4c7b8', '#d7e6c3', '#efc9d9', '#ffffff'] };
  if (R(0x7c, 0x83)) return { k: 'com', h: [8, 13], c: ['#c9e1ea', '#e6b58c', '#f6e7a1'] };
  if (R(0x84, 0x87)) return { k: 'ind', h: [7, 10], c: ['#b8c0c8', '#c9c2b5'] };
  if (R(0x88, 0x8b)) return { k: 'misc', h: [5, 8], c: ['#a89a84'] };
  if (R(0x8c, 0x93)) return { k: 'res', h: [18, 34], c: ['#e9e4da', '#f1e7d0', '#e7d2bf'] };
  if (R(0x94, 0x9d)) return { k: 'com', h: [20, 42], c: ['#c7d3dc', '#eef0f2', '#bcd3e2'] };
  if (R(0x9e, 0xa5)) return { k: 'ind', h: [12, 18], c: ['#9fb0bf', '#c4b49a', '#8e9aa6'] };
  if (R(0xa6, 0xad)) return { k: 'misc', h: [8, 12], c: ['#a89a84'] };
  if (R(0xae, 0xb1)) return { k: 'res', h: [45, 70], c: ['#eef0f2', '#d9dee3'] };
  if ([0xb3, 0xb7, 0xb8, 0xbb].includes(c)) return { k: 'com', h: [70, 110], c: ['#9fc4d8', '#b7d3e0', '#a6b8c4'] };
  if (c === 0xba) return { k: 'com', h: [36, 48], c: ['#e4ddd0'] };
  if (c === 0xb2 || c === 0xb4 || c === 0xb5) return { k: 'com', h: [12, 24], c: ['#c9dde8', '#f3efe6'] };
  if (c === 0xb6 || c === 0xb9) return { k: 'flat' };
  if (R(0xbc, 0xc1)) return { k: 'ind', h: [16, 24], c: ['#b8c0c8', '#9fb0bf'] };
  if (R(0xc2, 0xc5)) return { k: 'misc', h: [10, 14], c: ['#a89a84'] };
  if (c === 0xc8) return { k: 'pow', h: [18, 22], c: ['#eeeeee'] };
  if (c === 0xcc) return { k: 'flat' };
  if (R(0xc6, 0xcf)) return { k: 'pow', h: [18, 30], c: ['#8e9aa6', '#b8c0c8'] };
  const svc = { 0xd0: ['hall', 26, '#f3efe6'], 0xd1: ['hosp', 30, '#f4f4f0'], 0xd2: ['police', 14, '#4a6fa8'], 0xd3: ['fire', 12, '#c23a2c'], 0xd4: ['museum', 18, '#e4ddd0'],
    0xd6: ['school', 10, '#e6b58c'], 0xd7: ['stadium', 22, '#d9dee3'], 0xd8: ['prison', 14, '#8e9aa6'], 0xd9: ['college', 16, '#c9a27a'], 0xdb: ['statue', 8, '#9aa3ab'] };
  if (svc[c]) return { k: 'svc', s: svc[c][0], h: [svc[c][1], svc[c][1]], c: [svc[c][2]] };
  if (c === 0xd5 || c === 0xda || c === 0x0d) return { k: 'park' };
  if ([0xdd, 0xde, 0xdf, 0xe6, 0xe7, 0xea, 0xee, 0xef, 0xf2].includes(c)) return { k: 'flat' };
  if (c === 0xe1 || c === 0xe2) return { k: 'svc', s: 'tower', h: [22, 22], c: ['#d9dee3'] };
  if (c === 0xeb) return { k: 'misc', h: [18, 18], c: ['#f4f4f0'] };
  if (c === 0xf8) return { k: 'svc', s: 'marina', h: [6, 6], c: ['#f4f4f0'] };
  if (R(0xfb, 0xfe)) return { k: 'arco', h: [170, 240], c: ['#9fb0bf', '#c9d4dc', '#7f8f9c'] };
  if (c === 0xff) return { k: 'misc', h: [36, 36], c: ['#c4b49a'] };
  if (R(0xdc, 0xfa)) return { k: 'misc', h: [7, 12], c: ['#c9c2b5', '#b8c0c8'] };
  return null;
}
const SC2_TXT = {
  pt: { dirs: ['Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste'], st: 'Rua', av: 'Avenida', hw: 'Rodovia', base: 'Base de Resgate', hosp: 'Hospital Municipal',
    police: 'Delegacia', fire: 'Corpo de Bombeiros', hall: 'Prefeitura', stadium: 'Estádio', college: 'Universidade', marina: 'Marina', tower: 'Aeroporto', school: 'Escola', museum: 'Museu' },
  en: { dirs: ['Downtown', 'North Side', 'South Side', 'East Side', 'West Side'], st: 'Street', av: 'Avenue', hw: 'Highway', base: 'Rescue Base', hosp: 'City Hospital',
    police: 'Police Station', fire: 'Fire Station', hall: 'City Hall', stadium: 'Stadium', college: 'College', marina: 'Marina', tower: 'Airport', school: 'School', museum: 'Museum' } };

function sc2Build(id) {
  const m = SC2_MAPS[id], s = atob(m.b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  const c = sc2Parse(u.buffer), N = c.N, T = SC2_T, H = N*T/2, idx = (r, q) => r*N + q, tx = q => -H + (q + .5)*T, tz = r => -H + (r + .5)*T;
  const ok = (r, q) => r >= 0 && q >= 0 && r < N && q < N;
  let rs = 77 + id.length; const rand = () => { rs = (rs*16807) % 2147483647; return rs/2147483647; }, pk = a => a[Math.floor(rand()*a.length)];
  const tt = SC2_TXT[typeof LANG !== 'undefined' && LANG === 'pt' ? 'pt' : 'en'];
  // ---- grades por quadra
  const water = new Uint8Array(N*N), road = new Uint8Array(N*N), rail = new Uint8Array(N*N), park = new Uint8Array(N*N), tree = new Uint8Array(N*N), flat = new Uint8Array(N*N), occ = new Int32Array(N*N).fill(-1), zon = new Uint8Array(N*N);
  for (let i = 0; i < N*N; i++) {
    const t = c.ter[i], b = c.bld[i];
    water[i] = c.wat[i];
    if ((b >= 0x1d && b <= 0x2b) || (b >= 0x43 && b <= 0x46) || b === 0x4b || b === 0x4c || (b >= 0x51 && b <= 0x59) || (b >= 0x5d && b <= 0x60) || (b >= 0x3f && b <= 0x42)) road[i] = 1;
    if (b === 0x49 || b === 0x4a || b === 0x4d || b === 0x4e || b === 0x4f || b === 0x50 || (b >= 0x61 && b <= 0x6b)) road[i] = 2;
    if ((b >= 0x2c && b <= 0x3e) || b === 0x47 || b === 0x48 || b === 0x5a || b === 0x5b || (b >= 0x6c && b <= 0x6f)) rail[i] = 1;
    if (b >= 0x06 && b <= 0x0c) tree[i] = b - 5;
    const inf = b >= 0x70 || b === 0x0d ? sc2Info(b) : null;
    if (inf && inf.k === 'park') park[i] = 1; if (inf && inf.k === 'flat') flat[i] = b;
    zon[i] = c.zon[i] & 15;
  }
  // ---- prédios: cada construção ocupa 1×1 até 4×4 quadras (as quinas vêm marcadas no XZON)
  const blds = [];
  for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) {
    const i = idx(r, q), b = c.bld[i]; if (b < 0x70 || occ[i] >= 0) continue; const inf = sc2Info(b); if (!inf || inf.k === 'park' || inf.k === 'flat') continue;
    let sz = 1;
    if ((c.zon[i] >> 4) !== 15) for (let k = 4; k >= 2; k--) { if (!ok(r + k - 1, q + k - 1)) continue; let all = true;
      for (let a = 0; a < k && all; a++) for (let d = 0; d < k; d++) { const j = idx(r + a, q + d); if (c.bld[j] !== b || occ[j] >= 0) { all = false; break; } }
      const cz = (a, d) => c.zon[idx(r + a, q + d)] >> 4; // as 4 quinas marcadas e, se k ≥ 3, a borda entre elas sem marca
      if (all && cz(k - 1, k - 1) && cz(0, k - 1) && cz(k - 1, 0) && (k < 3 || !cz(0, 1))) { sz = k; break; } }
    for (let a = 0; a < sz; a++) for (let d = 0; d < sz; d++) occ[idx(r + a, q + d)] = blds.length;
    const h = inf.h[0] + rand()*(inf.h[1] - inf.h[0]), x = -H + (q + sz/2)*T, z = -H + (r + sz/2)*T;
    blds.push({ x, z, w: sz*T*.82, d: sz*T*.82, h, c: pk(inf.c), k: inf.k, s: inf.s, code: b, zn: inf.k === 'res' && h <= 16 ? 'residential' : inf.k === 'ind' ? 'industrial' : 'downtown', sz, r, q });
  }
  // ---- distância até a água (em quadras) e margens (para resgates no mar e o som do mar)
  const wd = new Uint16Array(N*N).fill(999), Q = [];
  for (let i = 0; i < N*N; i++) if (water[i]) { wd[i] = 0; Q.push(i); }
  for (let h = 0; h < Q.length; h++) { const i = Q[h], r = Math.floor(i/N), q = i % N;
    for (const [a, d] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!ok(r + a, q + d)) continue; const j = idx(r + a, q + d); if (wd[j] > wd[i] + 1) { wd[j] = wd[i] + 1; Q.push(j); } } }
  const shore = [];
  for (let r = 1; r < N - 1; r++) for (let q = 1; q < N - 1; q++) { const i = idx(r, q); if (water[i] || road[i] || occ[i] >= 0) continue;
    for (const [a, d] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (water[idx(r + a, q + d)]) { shore.push({ x: tx(q), z: tz(r), sx: d, sz: a }); break; } }
  // ---- ruas: trechos retos (horizontais e verticais) viram as avenidas por onde os carros andam
  const roads = []; let rn = 1;
  const runs = (horiz) => { for (let a = 0; a < N; a++) { let st = -1, hw = 0;
    for (let b = 0; b <= N; b++) { const i = b < N ? (horiz ? idx(a, b) : idx(b, a)) : -1, on = i >= 0 && road[i];
      if (on && st < 0) { st = b; hw = 0; } if (on && road[i] === 2) hw = 1;
      if (!on && st >= 0) { if (b - st >= 6) { const p = horiz ? [[tx(st), tz(a)], [tx(b - 1), tz(a)]] : [[tx(a), tz(st)], [tx(a), tz(b - 1)]];
          roads.push({ n: hw ? `${tt.hw} ${rn++}` : horiz ? `${tt.st} ${rn++}` : `${tt.av} ${rn++}`, w: hw ? 14 : 9, p, grid: 1 }); } st = -1; } } } };
  runs(true); runs(false);
  if (!roads.length) roads.push({ n: tt.av + ' 1', w: 9, p: [[-100, 0], [100, 0]], grid: 1 });
  // ---- parques
  const parks = [], seenP = new Uint8Array(N*N);
  for (let i = 0; i < N*N; i++) if (park[i] && !seenP[i]) { const st = [i], cells = []; seenP[i] = 1;
    while (st.length) { const j = st.pop(); cells.push(j); const r = Math.floor(j/N), q = j % N; for (const [a, d] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!ok(r + a, q + d)) continue; const k = idx(r + a, q + d); if (park[k] && !seenP[k]) { seenP[k] = 1; st.push(k); } } }
    let sx = 0, sz = 0; for (const j of cells) { sx += tx(j % N); sz += tz(Math.floor(j/N)); } parks.push({ x: sx/cells.length, z: sz/cells.length, r: Math.max(8, Math.sqrt(cells.length)*T*.55) }); }
  // ---- centro da cidade e helipontos
  let cx = 0, cz = 0, cn = 0; for (const b of blds) { const wgt = b.sz*b.sz*(b.h > 30 ? 3 : 1); cx += b.x*wgt; cz += b.z*wgt; cn += wgt; } if (cn) { cx /= cn; cz /= cn; }
  const free = i => !water[i] && !road[i] && !rail[i] && occ[i] < 0 && !flat[i] && !park[i];
  const usedPad = new Uint8Array(N*N);
  function freeBlock(x, z, s, maxR = 40) { // procura, em espiral, um bloco s×s de quadras livres perto de (x, z)
    const r0 = Math.floor((z + H)/T), q0 = Math.floor((x + H)/T);
    for (let rad = 0; rad <= maxR; rad++) for (let a = -rad; a <= rad; a++) for (let d = -rad; d <= rad; d++) { if (Math.max(Math.abs(a), Math.abs(d)) !== rad) continue;
      const r = r0 + a, q = q0 + d; if (!ok(r, q) || !ok(r + s - 1, q + s - 1)) continue; let all = true;
      for (let e = 0; e < s && all; e++) for (let f = 0; f < s; f++) { const j = idx(r + e, q + f); if (!free(j) || usedPad[j]) { all = false; break; } }
      if (all) { for (let e = -1; e <= s; e++) for (let f = -1; f <= s; f++) if (ok(r + e, q + f)) { const j = idx(r + e, q + f); usedPad[j] = 1; tree[j] = 0; } /* heliponto sem árvores em volta */ return { x: -H + (q + s/2)*T, z: -H + (r + s/2)*T }; } }
    return null; }
  const pads = {}, fixed = [];
  const bp = freeBlock(cx, cz, 4) || { x: cx, z: cz }; pads.base = { n: { pt: SC2_TXT.pt.base, en: SC2_TXT.en.base }, x: bp.x + 8, z: bp.z + 8, kind: 'base' };
  fixed.push({ rel: 'base', dx: 0, dz: -26, w: 30, d: 14, h: 10, c: '#c23a2c', tag: 'base' });
  const svcPad = (s, key, max) => { let n = 0; for (const b of blds) if (b.s === s && n < max) { const p = freeBlock(b.x, b.z, 2, 8); if (!p) continue; n++;
    pads[key + (n > 1 ? n : '')] = { n: { pt: SC2_TXT.pt[s] + (n > 1 ? ' ' + n : ''), en: SC2_TXT.en[s] + (n > 1 ? ' ' + n : '') }, x: p.x, z: p.z, kind: key === 'hosp' && n === 1 ? 'hosp' : undefined }; } return n; };
  if (!svcPad('hosp', 'hosp', 1)) { const p = freeBlock(cx + 200, cz + 150, 4) || { x: cx + 60, z: cz + 60 }; pads.hosp = { n: { pt: SC2_TXT.pt.hosp, en: SC2_TXT.en.hosp }, x: p.x + 8, z: p.z + 8, kind: 'hosp' };
    fixed.push({ rel: 'hosp', dx: 0, dz: -26, w: 34, d: 18, h: 30, c: '#f4f4f0' }); }
  svcPad('police', 'police', 2); svcPad('fire', 'fire', 2); svcPad('hall', 'hall', 1); svcPad('stadium', 'stadium', 1); svcPad('college', 'college', 1); svcPad('marina', 'marina', 1); svcPad('tower', 'aero', 1); svcPad('museum', 'museum', 1);
  // se faltarem destinos, cria helipontos em bairros afastados
  for (const [k, a] of [['north', [0, -1]], ['south', [0, 1]], ['east', [1, 0]], ['west', [-1, 0]]]) { if (Object.keys(pads).length >= 8) break;
    const p = freeBlock(cx + a[0]*420, cz + a[1]*420, 2, 20); if (p) pads['pad_' + k] = { n: { pt: 'Heliponto ' + SC2_TXT.pt.dirs[['', 'north', 'south', 'east', 'west'].indexOf(k)], en: SC2_TXT.en.dirs[['', 'north', 'south', 'east', 'west'].indexOf(k)] + ' Helipad' }, x: p.x, z: p.z }; }
  const others = Object.keys(pads).filter(k => k !== 'base' && k !== 'hosp');
  const far = others.slice().sort((a, b) => Math.hypot(pads[a].x - pads.base.x, pads[a].z - pads.base.z) - Math.hypot(pads[b].x - pads.base.x, pads[b].z - pads.base.z));
  // ---- aeroporto (pistas) e ponto secreto
  let ax0 = 1e9, az0 = 1e9, ax1 = -1e9, az1 = -1e9; for (let i = 0; i < N*N; i++) if (flat[i] === 0xdd || flat[i] === 0xde || flat[i] === 0xe6) { const x = tx(i % N), z = tz(Math.floor(i/N)); ax0 = Math.min(ax0, x - 8); ax1 = Math.max(ax1, x + 8); az0 = Math.min(az0, z - 8); az1 = Math.max(az1, z + 8); }
  const airport = ax1 > ax0 ? { x0: ax0, z0: az0, x1: ax1, z1: az1, runway: { x0: ax0, z0: az0, x1: ax1, z1: az1 }, grid: 1 } : { x0: 1e9, z0: 1e9, x1: 1e9, z1: 1e9, runway: { x0: 1e9, z0: 1e9, x1: 1e9, z1: 1e9 } };
  const sp = freeBlock(cx - 520, cz + 480, 3, 60) || { x: cx - 300, z: cz + 300 };
  const coms = blds.filter(b => b.k === 'com'), pedSpots = [];
  for (let k = 0; k < Math.min(6, coms.length); k++) { const b = coms[Math.floor(rand()*coms.length)], p = freeBlock(b.x, b.z, 1, 4); if (p) pedSpots.push({ x: p.x, z: p.z, r: 10, n: 8 }); }
  const district = (x, z) => { const dx = x - cx, dz = z - cz; if (Math.hypot(dx, dz) < 260) return tt.dirs[0]; return Math.abs(dz) > Math.abs(dx) ? (dz < 0 ? tt.dirs[1] : tt.dirs[2]) : (dx > 0 ? tt.dirs[3] : tt.dirs[4]); };
  const tileAt = (x, z) => { const r = Math.floor((z + H)/T), q = Math.floor((x + H)/T); return ok(r, q) ? idx(r, q) : -1; };
  const trees = []; for (let i = 0; i < N*N; i++) if (tree[i]) { const k = Math.min(3, 1 + Math.floor(tree[i]/3)); for (let n = 0; n < k; n++) trees.push({ x: tx(i % N) + (rand() - .5)*T*.8, z: tz(Math.floor(i/N)) + (rand() - .5)*T*.8, h: 3 + rand()*3 }); }
  return {
    id: 'sc2:' + id, name: m.title, desc: { pt: `Nível ${m.level} · cidade de ${m.author}`, en: `Level ${m.level} · city by ${m.author}` }, half: H, story: m,
    coast: () => 1e9, rivers: [], lakes: [], islands: [], beaches: [], roads, parks, airport, pads, fixed, bayColor: '#2f86b0',
    tutorialDest: far[0] || 'hosp', crowdSpots: others.slice(0, 3).concat(['hosp']), pedSpots, secret: sp, menuCam: { x: cx, z: cz },
    zone(x, z) { const i = tileAt(x, z); return i >= 0 && occ[i] >= 0 ? blds[occ[i]].zn : 'residential'; },
    district, flavor: { pt: {}, en: {} },
    grid: { N, T, H, water, road, rail, park, tree, flat, occ, zon, alt: c.alt, wd, shore, blds, trees, tileAt, cx, cz }
  };
}
// a cidade escolhida no menu (ar.city = 'sc2:<id>') é montada aqui, antes do core.js
(() => { let id = null; try { id = localStorage.getItem('ar.city'); } catch (e) {}
  if (id && id.startsWith('sc2:') && SC2_MAPS[id.slice(4)]) { try { CITIES[id] = sc2Build(id.slice(4)); } catch (e) { console.error(e); try { localStorage.setItem('ar.city', 'miami'); } catch (e2) {} } } })();
