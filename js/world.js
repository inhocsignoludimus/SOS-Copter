// world.js — cidade viva: carros, polícia, pedestres, multidão, fogo, efeitos e marcadores
const dummy = new THREE.Object3D();

/* ---------- Trânsito: avenidas + carros que viram nas esquinas da grade ---------- */
const AV_N = GRID ? (IS_TOUCH ? 40 : 70) : IS_TOUCH ? 130 : 220, GRID_N = GRID ? (IS_TOUCH ? 140 : 260) : IS_TOUCH ? 150 : 300, CAR_N = AV_N + GRID_N, cars = [];
const carBody = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 1.1, 4.4).translate(0, .75, 0), new THREE.MeshLambertMaterial({ color: '#fff' }), CAR_N);
const carTop = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, .7, 2.2).translate(0, 1.65, .3), new THREE.MeshLambertMaterial({ color: '#fff' }), CAR_N);
const headL = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .3, .12).translate(0, .85, -2.26), new THREE.MeshBasicMaterial({ color: '#fff6d0' }), CAR_N);
const tailL = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .25, .12).translate(0, .9, 2.26), new THREE.MeshBasicMaterial({ color: '#ff2a2a' }), CAR_N);
const glowM = new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const carGlow = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.4, 9).rotateX(-Math.PI/2).translate(0, .13, -7.2), glowM, CAR_N);
S.add(carBody, carTop, headL, tailL, carGlow);
// carros 3D (Kenney Car Kit) perto da câmera; longe, as caixas simples
const CAR_TYPES = ['car:sedan','car:sedan','car:sedan-sports','car:hatchback-sports','car:suv','car:suv-luxury','car:van','car:taxi','car:taxi','car:truck','car:delivery'], CAR_SC = 4.4/2.55, CAR_LOD = IS_TOUCH ? 120 : 260;
function carGeo(key) { const g = kGeo(key); if (!g.userData.turned) { g.rotateY(Math.PI); g.userData.turned = 1; } return g; }
const carHi = {}; for (const k of new Set(CAR_TYPES)) { const m = new THREE.InstancedMesh(carGeo(k), kMat('car'), CAR_N); m.count = 0; m.frustumCulled = false; carHi[k] = m; S.add(m); }
const carHiBuf = {};
const CAR_COLS = ['#e2231a','#f4f1ea','#2f6fd0','#ffcc1f','#30343c','#9aa3ab','#2f9a5a','#f07a52','#7a4fb0'];
const GSTEP = GRID ? GRID.T : 80, GOFF = GRID ? GRID.T/2 : 0, gridOK = GRID ? (x, z) => { const i = gTile(x, z); return i >= 0 && GRID.road[i] > 0; } : (x, z) => x > -HALF + 30 && x < HALF - 30 && !nearBeach(x, z, 25) && z > -HALF + 30 && z < HALF - 30 && !isWater(x, z, 5) && !inAir(x, z) && !inPark(x, z, 2);
function segOK(x1, z1, x2, z2) { for (let t = .2; t <= 1.001; t += .2) if (!gridOK(x1 + (x2 - x1)*t, z1 + (z2 - z1)*t)) return false; return true; }
function pickDir(c) {
  let dirs = [[1,0],[-1,0],[0,1],[0,-1]].filter(d => !(d[0] === -c.dx && d[1] === -c.dz)).sort(() => Math.random() - .5);
  if (Math.random() < .55) dirs = [[c.dx, c.dz], ...dirs.filter(d => !(d[0] === c.dx && d[1] === c.dz))];
  for (const d of dirs) { const nx = c.tx + d[0]*GSTEP, nz = c.tz + d[1]*GSTEP; if (segOK(c.tx, c.tz, nx, nz)) { c.dx = d[0]; c.dz = d[1]; c.nx = nx; c.nz = nz; return; } }
  c.dx = -c.dx; c.dz = -c.dz; c.nx = c.tx + c.dx*GSTEP; c.nz = c.tz + c.dz*GSTEP; if (!segOK(c.tx, c.tz, c.nx, c.nz)) { c.nx = c.tx; c.nz = c.tz; }
}
{ const tot = roads.reduce((a, r) => a + r.len, 0);
  for (const [ri, r] of roads.entries()) { const n = Math.round(AV_N*r.len/tot); for (let k = 0; k < n && cars.length < AV_N; k++) cars.push({ r: ri, s: Math.random()*r.len, dir: Math.random() < .5 ? 1 : -1, v: 9 + Math.random()*7, jam: false }); }
  while (cars.length < AV_N) cars.push({ r: 0, s: Math.random()*roads[0].len, dir: 1, v: 10, jam: false });
  let guard = 0;
  while (cars.length < CAR_N && guard++ < 20000) { const tx = -HALF + GOFF + GSTEP*Math.floor(Math.random()*HALF*2/GSTEP), tz = -HALF + GOFF + GSTEP*Math.floor(Math.random()*HALF*2/GSTEP); if (!gridOK(tx, tz)) continue;
    const c = { g: true, tx, tz, dx: 1, dz: 0, p: Math.random()*GSTEP, v: 7 + Math.random()*5, h: 0 }; pickDir(c); if (c.nx === c.tx && c.nz === c.tz) continue; c.h = Math.atan2(-c.dx, -c.dz); cars.push(c); }
  cars.forEach((c, i) => { carBody.setColorAt(i, col.set(pickR(CAR_COLS))); carTop.setColorAt(i, col.set('#3b4552')); c.kt = pickR(CAR_TYPES); });
}
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function setCarMatrix(i, x, z, h) { dummy.position.set(x, 0, z); dummy.rotation.set(0, h, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); for (const m of [headL, tailL, carGlow]) m.setMatrixAt(i, dummy.matrix);
  const c = cars[i], near = OPT.detail !== 0 && Math.abs(x - cam.position.x) < CAR_LOD && Math.abs(z - cam.position.z) < CAR_LOD;
  if (near) { carBody.setMatrixAt(i, ZERO); carTop.setMatrixAt(i, ZERO); dummy.scale.setScalar(CAR_SC); dummy.updateMatrix(); const m = carHi[c.kt]; m.setMatrixAt(m.count++, dummy.matrix); }
  else { carBody.setMatrixAt(i, dummy.matrix); carTop.setMatrixAt(i, dummy.matrix); } }
function updCars(dt) {
  const night = dayF < .6; headL.visible = tailL.visible = carGlow.visible = night; glowM.opacity = (1 - dayF)*.32;
  for (const m of Object.values(carHi)) m.count = 0;
  cars.forEach((c, i) => {
    if (c.g) { c.p += c.v*dt; if (c.p >= GSTEP) { c.p -= GSTEP; c.tx = c.nx; c.tz = c.nz; pickDir(c); }
      const th = Math.atan2(-c.dx, -c.dz); let d = th - c.h; d = Math.atan2(Math.sin(d), Math.cos(d)); c.h += d*Math.min(1, dt*6);
      const t = Math.min(c.p, GSTEP), x = c.tx + c.dx*t + (-c.dz)*(GRID ? 1.8 : 2.3), z = c.tz + c.dz*t + c.dx*(GRID ? 1.8 : 2.3); c.x = x; c.z = z; setCarMatrix(i, x, z, c.h); return; }
    if (!c.jam) { c.s += c.v*c.dir*dt; const r = roads[c.r]; if (c.s > r.len) c.s = 0; if (c.s < 0) c.s = r.len; }
    const r = roads[c.r], p = roadAt(r, c.s), lane = r.w*.25*c.dir; c.x = p.x - p.tz*lane; c.z = p.z + p.tx*lane; setCarMatrix(i, c.x, c.z, Math.atan2(-p.tx*c.dir, -p.tz*c.dir));
  });
  for (const m of [carBody, carTop, headL, tailL, carGlow, ...Object.values(carHi)]) m.instanceMatrix.needsUpdate = true;
}
// engarrafamento: junta carros parados num trecho de avenida
let jamCars = [];
function makeJam(ri, s) { clearJam(); const pool = cars.filter(c => !c.g && !c.jam).sort(() => Math.random() - .5).slice(0, 16);
  pool.forEach((c, k) => { c.jam = true; c.r = ri; c.dir = k % 2 ? 1 : -1; c.s = clamp(s + (Math.floor(k/2) - 4)*6.5, 0, roads[ri].len); }); jamCars = pool; }
function clearJam() { for (const c of jamCars) c.jam = false; jamCars = []; }

/* ---------- Suspeito e polícia ---------- */
function carMesh(key, tint) { const g = new THREE.Group(); let mat = kMat('car'); if (tint) { mat = mat.clone(); mat.color.set(tint).multiplyScalar(1.12); }
  const b = new THREE.Mesh(carGeo(key), mat); b.scale.setScalar(CAR_SC); g.add(b); return g; }
const suspect = carMesh('car:sedan-sports', '#7a2a2a'); suspect.visible = false; S.add(suspect);
const police = [0, 1].map(() => { const p = carMesh('car:police'); const l = new THREE.Mesh(new THREE.BoxGeometry(1.2, .3, .4), new THREE.MeshBasicMaterial({ color: '#2a5bff' })); l.position.set(0, 2.45, .2); p.add(l); p.userData.light = l; p.visible = false; S.add(p); return p; });
const sus = { r: 0, s: 0, dir: 1, v: 20, turnT: 10, x: 0, z: 0 };
function startSuspect() { let long = roads.map((r, i) => i).filter(i => roads[i].len > 500); if (!long.length) long = roads.map((r, i) => i).sort((a, b) => roads[b].len - roads[a].len).slice(0, 4); sus.r = pickR(long); sus.s = Math.random()*roads[sus.r].len; sus.dir = Math.random() < .5 ? 1 : -1; sus.turnT = 12 + Math.random()*12; suspect.visible = true; }
function updSuspect(dt, fast) {
  const r = roads[sus.r]; sus.turnT -= dt; if (sus.turnT <= 0) { sus.turnT = 12 + Math.random()*15; sus.dir *= -1; }
  sus.s += sus.dir*sus.v*(fast ? 1.15 : 1)*dt; if (sus.s > r.len) { sus.s = r.len; sus.dir = -1; } if (sus.s < 0) { sus.s = 0; sus.dir = 1; }
  const p = roadAt(r, sus.s), lane = r.w*.25*sus.dir; sus.x = p.x - p.tz*lane; sus.z = p.z + p.tx*lane;
  suspect.position.set(sus.x, 0, sus.z); suspect.rotation.y = Math.atan2(-p.tx*sus.dir, -p.tz*sus.dir);
}
function updPolice(dt, on) { police.forEach((p, i) => { p.visible = on; if (!on) return;
  const a = perfT*.7 + i*Math.PI, tx = sus.x + Math.cos(a)*9, tz = sus.z + Math.sin(a)*9, dx = tx - p.position.x, dz = tz - p.position.z, d = Math.hypot(dx, dz);
  if (d > .5) { const v = Math.min(d, 30*dt); p.position.x += dx/d*v; p.position.z += dz/d*v; p.rotation.y = Math.atan2(-dx, -dz); }
  p.userData.light.material.color.set(Math.floor(perfT*6 + i) % 2 ? '#2a5bff' : '#ff2a2a'); }); }
function placePoliceFar() { police.forEach((p, i) => p.position.set(sus.x + (i ? 120 : -120), 0, sus.z + 80)); }

/* ---------- Pedestres em sprite (estilo anos 90): 8 tipos x 3 quadros de caminhada ---------- */
const PV = 8, PFR = 3;
// pedestres: sprites renderizados a partir do "Animated Human" da Quaternius (CC0) — 8 roupas × 3 quadros (parado, passo, passo)
const pedClones = [], pedTex = new THREE.TextureLoader().load(typeof KENNEY_TEX !== 'undefined' && KENNEY_TEX.peds || 'img/peds.png', () => pedClones.forEach(t => { t.image = pedTex.image; t.needsUpdate = true; })); pedTex.magFilter = pedTex.minFilter = THREE.NearestFilter;
const pedMat = []; for (let v = 0; v < PV; v++) { pedMat.push([]); for (let f = 0; f < PFR; f++) { const t = pedTex.clone(); pedClones.push(t); if (pedTex.image && pedTex.image.complete) t.needsUpdate = true; t.repeat.set(1/PV, 1/PFR); t.offset.set(v/PV, 1 - (f + 1)/PFR); pedMat[v].push(new THREE.SpriteMaterial({ map: t })); } }
const peds = [];
function addPed(x, z, r) { const v = Math.floor(Math.random()*PV), s = new THREE.Sprite(pedMat[v][0]); s.scale.set(.88, 1.75, 1); s.position.set(x, .875, z); s.userData = { v, hx: x, hz: z, r, tx: x, tz: z, t: Math.random()*3, ph: Math.random()*6 }; S.add(s); peds.push(s); return s; }
for (let k = 0; k < (IS_TOUCH ? 130 : 260); k++) { const q = beachAt(-(8 + Math.random()*14)); if (!isWater(q.x, q.z)) addPed(q.x, q.z, 14); }
for (const sp of CITY.pedSpots) for (let k = 0; k < sp.n; k++) addPed(sp.x + (Math.random() - .5)*sp.r*2, sp.z + (Math.random() - .5)*sp.r*2, sp.r);
for (const p of parks) for (let k = 0; k < 12; k++) addPed(p.x + (Math.random() - .5)*p.r, p.z + (Math.random() - .5)*p.r, p.r*.4);
function updPeds(dt) { const PD = IS_TOUCH ? 260 : 380; for (const s of peds) { const u = s.userData;
  s.visible = Math.abs(s.position.x - cam.position.x) < PD && Math.abs(s.position.z - cam.position.z) < PD; if (!s.visible) continue; u.t -= dt; if (u.t <= 0) { u.t = 2 + Math.random()*5; const still = Math.random() < .3; u.tx = still ? s.position.x : u.hx + (Math.random() - .5)*u.r*2; u.tz = still ? s.position.z : u.hz + (Math.random() - .5)*u.r*2; }
  const dx = u.tx - s.position.x, dz = u.tz - s.position.z, d = Math.hypot(dx, dz), moving = d > .3;
  if (moving) { s.position.x += dx/d*1.2*dt; s.position.z += dz/d*1.2*dt; }
  s.material = pedMat[u.v][moving ? 1 + (Math.floor(perfT*5 + u.ph) % 2) : 0]; s.position.y = .875; } }

/* ---------- Multidão do tumulto ---------- */
const crowd = []; for (let i = 0; i < 26; i++) { const v = Math.floor(Math.random()*PV), s = new THREE.Sprite(pedMat[v][0]); s.scale.set(.88, 1.75, 1); s.visible = false; s.userData = { v, a: 0, r: 0, run: 0 }; S.add(s); crowd.push(s); }
const crowdC = { x: 0, z: 0, on: false, calm: false };
function startCrowd(x, z) { crowdC.x = x; crowdC.z = z; crowdC.on = true; crowdC.calm = false; crowd.forEach(s => { s.visible = true; s.scale.set(.88, 1.75, 1); s.userData.a = Math.random()*7; s.userData.r = Math.random()*12; s.userData.run = 0; s.userData.gone = false; }); }
function disperseCrowd(n) { let k = 0; for (const s of crowd) { if (k >= n) break; if (s.visible && !s.userData.gone) { s.userData.gone = true; k++; } } return k; }
const crowdLeft = () => crowd.filter(s => s.visible && !s.userData.gone).length;
function updCrowd(dt) { if (!crowdC.on) return; let alive = 0;
  crowd.forEach(s => { const u = s.userData; if (u.gone || crowdC.calm) { u.run += dt; u.r += 9*dt; const k = Math.max(0, 1 - u.run/3); s.scale.set(.88*k, 1.75*k, 1); } else u.a += dt*(.6 + Math.random());
    s.position.set(crowdC.x + Math.cos(u.a)*u.r, s.scale.y/2 + (u.gone ? 0 : Math.abs(Math.sin(perfT*9 + u.a))*.5), crowdC.z + Math.sin(u.a)*u.r);
    s.material = pedMat[u.v][1 + (Math.floor(perfT*8 + u.a) % 2)]; if (s.scale.y > .05) alive++; });
  if (!alive) { crowdC.on = false; crowd.forEach(s => s.visible = false); } }
function hideCrowd() { crowdC.on = false; crowd.forEach(s => s.visible = false); }

/* ---------- Enchente: água subindo num bairro ---------- */
const flood = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI/2), new THREE.MeshLambertMaterial({ color: '#5d8796', transparent: true, opacity: .85, depthWrite: false })); flood.visible = false; S.add(flood);
const floodC = { lvl: 0 };
function startFlood(x, z, r) { flood.position.set(x, .1, z); flood.scale.set(r, 1, r); flood.visible = true; floodC.lvl = 0; }
function updFlood(dt) { if (!flood.visible) return; floodC.lvl = Math.min(2.6, floodC.lvl + dt*.12); flood.position.y = .1 + floodC.lvl + Math.sin(perfT*1.5)*.05; }
function hideFlood() { flood.visible = false; }

/* ---------- Fogo ---------- */
const fires = []; // { b, int, g, flames }
function igniteBuilding(b, int = 70) {
  if (b.burnt || fires.some(f => f.b === b)) return null;
  const g = new THREE.Group(), flames = []; g.position.set(b.x, b.h, b.z);
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(1.8, 6, 5).translate(0, 3, 0), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ff7a1a' : '#ffd23a' }));
    f.position.set((Math.random() - .5)*b.hw*1.5, 0, (Math.random() - .5)*b.hd*1.5); f.userData.ph = Math.random()*6; g.add(f); flames.push(f); }
  const light = new THREE.Mesh(new THREE.BoxGeometry(b.hw*2 + .2, Math.min(b.h, 10), b.hd*2 + .2), new THREE.MeshBasicMaterial({ color: '#ff6a1a', transparent: true, opacity: .25, depthWrite: false }));
  light.position.y = -Math.min(b.h, 10)/2; g.add(light);
  S.add(g); const fire = { b, int, g, flames }; fires.push(fire); tintBuilding(b, '#8a5a40'); return fire;
}
function removeFire(f, burnt) { S.remove(f.g); fires.splice(fires.indexOf(f), 1); if (burnt) { f.b.burnt = 1; tintBuilding(f.b, '#3a3330'); } else tintBuilding(f.b, f.b.c); }
function clearFires() { while (fires.length) removeFire(fires[0], false); }
function fireBelow(x, y, z) { let t = 0; for (const f of fires) { const b = f.b; if (Math.abs(x - b.x) < b.hw + 10 && Math.abs(z - b.z) < b.hd + 10 && y > b.h - 2 && y < b.h + 45) t = Math.max(t, f.int/100*(1 - (y - b.h)/45)); } return clamp(t, 0, 1); }
function updFires(dt) { for (const f of fires) { const k = clamp(f.int/100, .25, 1.6); f.flames.forEach(m => m.scale.set(k, k*(.7 + .5*Math.sin(perfT*9 + m.userData.ph)), k));
  if (Math.random() < dt*5*k) puff(f.b.x + (Math.random() - .5)*f.b.hw, f.b.h + 4, f.b.z + (Math.random() - .5)*f.b.hd, 1); } }

/* ---------- Efeitos: fumaça, gotas, explosão, respingo ---------- */
const smokes = []; for (let i = 0; i < 60; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 0), new THREE.MeshLambertMaterial({ color: '#5a5a5e', transparent: true, opacity: 0, depthWrite: false })); s.userData.life = 0; s.visible = false; S.add(s); smokes.push(s); }
function puff(x, y, z, sz, c = '#5a5a5e') { const s = smokes.find(s => s.userData.life <= 0); if (!s) return; s.userData.life = 3; s.userData.max = 3; s.position.set(x, y, z); s.scale.setScalar(.5*sz); s.material.color.set(c); s.visible = true; }
const drops = []; for (let i = 0; i < 90; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(.55, .55, .55), new THREE.MeshBasicMaterial({ color: '#7fd0ff' })); d.visible = false; d.userData.v = new THREE.Vector3(); S.add(d); drops.push(d); }
function spawnDrop(x, y, z, vx, vz) { const d = drops.find(d => !d.visible); if (!d) return; d.visible = true; d.position.set(x + (Math.random() - .5)*1.6, y, z + (Math.random() - .5)*1.6); d.userData.v.set(vx + (Math.random() - .5)*3, -2 - Math.random()*3, vz + (Math.random() - .5)*3); }
const booms = []; for (let i = 0; i < 24; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), new THREE.MeshBasicMaterial({ color: i % 3 ? '#ff7a1a' : '#ffd23a', transparent: true })); b.visible = false; b.userData.v = new THREE.Vector3(); b.userData.life = 0; S.add(b); booms.push(b); }
function spawnBoom(x, y, z) { booms.forEach(b => { b.visible = true; b.userData.life = 1.8; b.position.set(x, y, z); b.userData.v.set((Math.random() - .5)*22, Math.random()*18, (Math.random() - .5)*22); b.scale.setScalar(1); b.material.opacity = 1; }); for (let i = 0; i < 8; i++) puff(x, y + 2, z, 3); }
function spawnSplash(x, z) { for (let i = 0; i < 14; i++) { const d = drops.find(d => !d.visible); if (!d) return; d.visible = true; d.position.set(x, .5, z); d.userData.v.set((Math.random() - .5)*10, 6 + Math.random()*6, (Math.random() - .5)*10); } }
function updFx(dt) {
  for (const s of smokes) if (s.userData.life > 0) { s.userData.life -= dt; s.position.y += 6*dt; s.position.x += 1.5*dt; s.scale.multiplyScalar(1 + dt*.5); s.material.opacity = Math.max(0, s.userData.life/s.userData.max*.55); if (s.userData.life <= 0) s.visible = false; }
  for (const d of drops) if (d.visible) { d.userData.v.y -= 22*dt; d.position.addScaledVector(d.userData.v, dt);
    if (d.userData.water) { for (const f of fires) { const b = f.b; if (d.position.y < b.h + 1 && d.position.y > b.h - 4 && Math.abs(d.position.x - b.x) < b.hw + 2.5 && Math.abs(d.position.z - b.z) < b.hd + 2.5) { f.int -= d.userData.water; d.visible = false; f.hit = 1; break; } } }
    if (d.position.y < 0) { d.visible = false; d.userData.water = 0; } }
  for (const b of booms) if (b.userData.life > 0) { b.userData.life -= dt; b.userData.v.y -= 20*dt; b.position.addScaledVector(b.userData.v, dt); b.scale.multiplyScalar(1 + dt*.7); b.material.opacity = Math.max(0, b.userData.life/1.8); if (b.position.y < 0) { b.position.y = 0; b.userData.v.set(0, 0, 0); } if (b.userData.life <= 0) b.visible = false; }
}

/* ---------- Pessoas das missões (bonecos com pernas e braços), maca, banhista, balde, guincho, marcadores ---------- */
function makePerson() {
  const p = new THREE.Group(), Mt = c => new THREE.MeshLambertMaterial({ color: c });
  const skin = Mt(pickR(['#8d5a3b','#c58c63','#e5b48c','#5c3a24','#a86f4c'])), shirt = Mt(pickR(['#2f6fd0','#e2231a','#2f9a5a','#f2b72f','#ffffff','#7a4fb0','#1fb5b0'])),
    pants = Mt(pickR(['#30343c','#2a3550','#7a5a3a','#1d4a8a'])), hairM = Mt(pickR(['#1b120c','#3a2416','#6b4a2a'])), dark = Mt('#151515');
  const add = (geo, m, x, y, z, parent = p) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
  const legs = [-1, 1].map(sd => { const g = new THREE.Group(); g.position.set(sd*.2, 1.02, 0); p.add(g); add(new THREE.BoxGeometry(.3, .95, .32).translate(0, -.48, 0), pants, 0, 0, 0, g); add(new THREE.BoxGeometry(.32, .16, .46), dark, 0, -.98, -.06, g); return g; });
  add(new THREE.BoxGeometry(.72, .3, .42), pants, 0, 1.08, 0);
  add(new THREE.BoxGeometry(.82, .95, .48), shirt, 0, 1.7, 0); add(new THREE.BoxGeometry(.24, .18, .24), skin, 0, 2.25, 0);
  const head = add(new THREE.BoxGeometry(.56, .6, .56), skin, 0, 2.62, 0);
  add(new THREE.BoxGeometry(.08, .08, .02), dark, -.12, 2.66, -.29); add(new THREE.BoxGeometry(.08, .08, .02), dark, .12, 2.66, -.29);
  const style = Math.floor(Math.random()*3);
  if (style === 0) add(new THREE.BoxGeometry(.6, .16, .6), hairM, 0, 2.98, 0);
  else if (style === 1) { add(new THREE.BoxGeometry(.62, .18, .62), shirt, 0, 3, 0); add(new THREE.BoxGeometry(.5, .06, .3), shirt, 0, 2.93, -.42); }
  else { add(new THREE.BoxGeometry(.62, .2, .62), hairM, 0, 2.98, 0); add(new THREE.BoxGeometry(.62, .6, .14), hairM, 0, 2.62, .3); }
  const arms = [-1, 1].map(sd => { const g = new THREE.Group(); g.position.set(sd*.53, 2.12, 0); p.add(g); add(new THREE.BoxGeometry(.22, .82, .24).translate(0, -.41, 0), shirt, 0, 0, 0, g); add(new THREE.BoxGeometry(.2, .2, .2), skin, 0, -.92, 0, g); return g; });
  p.scale.setScalar(.6); p.userData = { aL: arms[0], aR: arms[1], lL: legs[0], lR: legs[1], mode: 'wave', home: { x: 0, y: 0, z: 0 }, ph: Math.random()*6 }; return p;
}
const people = []; for (let i = 0; i < 8; i++) { const p = makePerson(); p.visible = false; S.add(p); people.push(p); }
const stretcher = new THREE.Group(); { const w = new THREE.MeshLambertMaterial({ color: '#f4f4f0' }), r = new THREE.MeshLambertMaterial({ color: '#d8261c' }), d = new THREE.MeshLambertMaterial({ color: '#555' });
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.4, .25, 3.6), w); bed.position.y = .75; const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.42, .27, .4), r); stripe.position.y = .75;
  stretcher.add(bed, stripe); for (const x of [-.55, .55]) for (const z of [-1.5, 1.5]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.1, .7, .1), d); l.position.set(x, .35, z); stretcher.add(l); } stretcher.visible = false; stretcher.scale.setScalar(.62); S.add(stretcher); }
function placePeople(list, mode) {
  people.forEach((p, i) => { const q = list[i]; p.visible = !!q; if (!q) return; p.userData.home = { x: q.x, y: q.y, z: q.z }; p.userData.mode = mode; p.userData.tag = q.tag;
    p.userData.scared = false; p.userData.follow = false; p.userData.walking = false;
    p.position.set(q.x, q.y + (mode === 'lie' ? .62 : 0), q.z); p.rotation.set(mode === 'lie' ? -Math.PI/2 : 0, Math.random()*6, 0); });
  stretcher.visible = mode === 'lie' && list.length > 0; if (stretcher.visible) { stretcher.position.set(list[0].x, list[0].y, list[0].z); stretcher.rotation.y = people[0].rotation.y; }
}
function showPeople(n, x, y, z, lying) { const L = []; for (let i = 0; i < n; i++) { const a = i/n*Math.PI*2; L.push({ x: x + (n > 1 ? Math.cos(a)*4 : 0), y, z: z + (n > 1 ? Math.sin(a)*4 : 0) }); } placePeople(L, lying ? 'lie' : 'wave'); }
function hidePeople(k) { let c = 0; for (const p of people) { if (k == null || (p.visible && c < k)) { if (p.visible) c++; p.visible = false; } } if (k == null || !people.some(p => p.visible)) stretcher.visible = false; }
// embarque: as pessoas andam (ou a maca desliza) até o helicóptero conforme o progresso
function boardAnim(prog, only) {
  for (const p of people) { if (!p.visible || (only && p !== only)) continue; const h = p.userData.home, k = clamp(prog, 0, 1), lie = p.userData.mode === 'lie';
    p.position.x = lerp(h.x, st.x, k*.85); p.position.z = lerp(h.z, st.z, k*.85); p.position.y = h.y + (lie ? .62 : 0);
    if (p.userData.follow) continue;
    p.userData.walking = k > 0 && k < 1 && !lie; if (k > 0 && !lie) p.rotation.y = Math.atan2(-(st.x - h.x), -(st.z - h.z));
    if (lie && stretcher.visible) { stretcher.position.set(p.position.x, h.y, p.position.z); } }
}
function animPeople() { for (const p of people) { if (!p.visible) continue; const u = p.userData, t = perfT*8 + u.ph;
  if (u.mode === 'lie') { u.aL.rotation.set(0, 0, 0); u.aR.rotation.set(0, 0, 0); continue; }
  if (u.walking) { u.lL.rotation.x = Math.sin(t)*.6; u.lR.rotation.x = -Math.sin(t)*.6; u.aL.rotation.set(-Math.sin(t)*.5, 0, 0); u.aR.rotation.set(Math.sin(t)*.5, 0, 0); }
  else { u.lL.rotation.x = u.lR.rotation.x = 0; u.aL.rotation.set(0, 0, Math.PI - .4 + Math.sin(t)*.5); u.aR.rotation.set(0, 0, -(Math.PI - .4) - Math.sin(t)*.5); } } }
const swimmer = new THREE.Group(); { const hd = new THREE.Mesh(new THREE.SphereGeometry(.7, 8, 6), new THREE.MeshLambertMaterial({ color: '#8d5a3b' })); hd.position.y = .6;
  const rg = new THREE.Mesh(new THREE.TorusGeometry(1.3, .35, 6, 14), new THREE.MeshLambertMaterial({ color: '#ff6a1a' })); rg.rotation.x = Math.PI/2; rg.position.y = .15; swimmer.add(hd, rg); swimmer.scale.setScalar(1.6); swimmer.visible = false; S.add(swimmer); }
const bucket = new THREE.Group(); { const line = new THREE.Mesh(new THREE.BoxGeometry(.06, 1, .06), new THREE.MeshBasicMaterial({ color: '#222' })); line.name = 'line'; bucket.add(line);
  const bk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, .8, 1.4, 10), new THREE.MeshLambertMaterial({ color: '#ff8c1a' })); bk.name = 'bk'; bucket.add(bk); bucket.visible = false; S.add(bucket); }
const bucketPos = new THREE.Vector3();
const winch = new THREE.Mesh(new THREE.BoxGeometry(.08, 1, .08), new THREE.MeshBasicMaterial({ color: '#222' })); winch.visible = false; S.add(winch);
const beacon = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 260, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffcc1f', transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide, fog: false })); beacon.visible = false; S.add(beacon);
const ring = new THREE.Mesh(new THREE.RingGeometry(11, 14, 36), new THREE.MeshBasicMaterial({ color: '#ffcc1f', transparent: true, opacity: .85, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI/2; ring.visible = false; S.add(ring);
const shadow = new THREE.Mesh(new THREE.CircleGeometry(4.2, 18), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .28, depthWrite: false })); shadow.rotation.x = -Math.PI/2; S.add(shadow);
function setMarker(p) { if (!p) { beacon.visible = ring.visible = false; return; } beacon.position.set(p.x, (p.y || 0) + 130, p.z); ring.position.set(p.x, (p.y || 0) + .25, p.z); beacon.visible = true; ring.visible = true; }

// balde pendurado: segue o helicóptero com atraso (pêndulo simples)
const bucketLag = new THREE.Vector3();
function updBucket(dt) {
  bucket.visible = hasEq('balde') && !hasEq('canhao') && M && M.type === 'incendio' && !st.dead;
  if (!bucket.visible) return;
  bucketLag.x += (-st.vx*.18 - bucketLag.x)*Math.min(1, dt*2); bucketLag.z += (-st.vz*.18 - bucketLag.z)*Math.min(1, dt*2);
  const L = 9; bucketPos.set(st.x + bucketLag.x, st.y - L, st.z + bucketLag.z);
  const line = bucket.getObjectByName('line'), bk = bucket.getObjectByName('bk');
  bucket.position.set(0, 0, 0); bk.position.copy(bucketPos);
  line.position.set((st.x + bucketPos.x)/2, (st.y + bucketPos.y)/2 + .6, (st.z + bucketPos.z)/2);
  line.scale.y = Math.hypot(bucketLag.x, L, bucketLag.z); line.lookAt(st.x, st.y + 1.2, st.z); line.rotateX(Math.PI/2);
  bk.material.color.set(st.water > 0 ? '#2f8fd8' : '#ff8c1a');
}

/* ---------- Infrator em alta velocidade (evento surpresa) ---------- */
const speedCar = carMesh('car:sedan-sports', '#ff3a3a'); speedCar.visible = false; S.add(speedCar);
let EV = null, evT = 120;
function startSpeeder() { const ri = Math.floor(Math.random()*roads.length), r = roads[ri]; EV = { r: ri, s: Math.random()*r.len, dir: Math.random() < .5 ? 1 : -1, v: 34, state: 'drive', t: 0, held: 0, tick: 0, x: 0, z: 0 }; speedCar.visible = true;
  const msg = T(hasEq('radar') ? 'speederRadar' : 'speeder', { a: r.n }); if (hasEq('radar') || dxz(st, roadAt(r, EV.s)) < 700) { toast(msg, 3500); sfx('radio'); } }
function endSpeeder() { EV = null; speedCar.visible = false; police.forEach(p => p.visible = false); evT = 120 + Math.random()*120; }
function updSpeeder(dt) {
  if (!EV) { if (!M && !st.dead && playing) { evT -= dt*(hasEq('radar') ? 1.5 : 1); if (evT <= 0) startSpeeder(); } return; }
  const r = roads[EV.r]; EV.t += dt;
  if (EV.state === 'drive') { EV.s += EV.dir*EV.v*dt; if (EV.s > r.len) { EV.s = r.len; EV.dir = -1; } if (EV.s < 0) { EV.s = 0; EV.dir = 1; } if (EV.t > 80) { toast(T('speederGone'), 2000); return endSpeeder(); } }
  else { EV.held += dt; EV.tick += dt; if (dxz(st, EV) < 90 && EV.tick >= 10) { EV.tick = 0; G.money += 5; toast(T('speederTick', { p: fmt(5) }), 1200); }
    sus.x = EV.x; sus.z = EV.z; updPolice(dt, EV.held > 18);
    if (EV.held > 25) { const pay = 200; G.money += pay; G.rep += 10; G.earned += pay; radio(T('speederDone') + ' ' + T('earnToast', { p: fmt(pay) }), 'win'); sfx('win'); save(); return endSpeeder(); } }
  const p = roadAt(r, EV.s), lane = EV.state === 'stopped' ? r.w*.5 + 1.5 : r.w*.25; EV.x = p.x - p.tz*lane*EV.dir; EV.z = p.z + p.tx*lane*EV.dir;
  speedCar.position.set(EV.x, 0, EV.z); speedCar.rotation.y = Math.atan2(-p.tx*EV.dir, -p.tz*EV.dir);
}
function speederMegaphone() { if (EV && EV.state === 'drive' && dxz(st, EV) < 40 && st.agl < 70) { EV.state = 'stopped'; EV.held = 0; toast(T('speederStop'), 3000); placePoliceFar(); return true; } return false; }

/* ---------- Aeronave secreta em exposição no aeroporto ---------- */
const secretModel = makeHeli(heliById('apaxe')); secretModel.g.position.set(CITY.secret.x, 0, CITY.secret.z); secretModel.g.rotation.y = 2.4; S.add(secretModel.g);
