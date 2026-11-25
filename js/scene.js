// scene.js — renderizador com resolução retrô, chão, prédios, árvores, céu, dia/noite e clima
const OPT = { quality: 0, vol: .8, music: .5, sfx: .8, radio: .8, sens: 1, invert: false, cycle: true, weather: true, mode: 1, ps1: true, dither: true, view: IS_TOUCH ? 0 : 2 };
const VIEW = [650, 1000, 1450]; // distância de visão: curta, média, longa
try { Object.assign(OPT, JSON.parse(localStorage.getItem('resgateRecife.opts') || '{}')); } catch (e) {}
const R = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
R.setPixelRatio(1); $('game').appendChild(R.domElement);
const S = new THREE.Scene(); S.background = new THREE.Color('#a8d8f0'); S.fog = new THREE.Fog('#c4e4f3', 320, 1450);
const cam = new THREE.PerspectiveCamera(62, 1, 1.2, 4200);
const hemi = new THREE.HemisphereLight('#eef8ff', '#7a6a4a', .55); S.add(hemi);
const sun = new THREE.DirectionalLight('#fff1d0', .62); S.add(sun);
const retroTex = [], bMats = [];

// resolução interna: Retrô 360p (pixelado), Média 540p, Alta (nativa)
function applyRes() {
  const h = OPT.quality === 0 ? 360 : OPT.quality === 1 ? 540 : Math.min(Math.round(innerHeight * Math.min(devicePixelRatio, 2)), 1440);
  R.setSize(Math.max(1, Math.round(h * innerWidth / innerHeight)), h, false);
  R.domElement.style.cssText = 'width:100%;height:100%;display:block;image-rendering:' + (OPT.quality === 0 ? 'pixelated' : 'auto');
  cam.aspect = innerWidth / innerHeight; cam.far = VIEW[OPT.view] + 150; cam.updateProjectionMatrix();
  const f = OPT.quality === 0 ? THREE.NearestFilter : THREE.LinearFilter;
  for (const t of retroTex) { t.magFilter = f; t.needsUpdate = true; }
  const v = R.getDrawingBufferSize(new THREE.Vector2()); rt.setSize(v.x, v.y);
}

/* chão, mar e entorno */
const groundTex = new THREE.CanvasTexture(gc); groundTex.anisotropy = R.capabilities.getMaxAnisotropy(); retroTex.push(groundTex);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(HALF*2, HALF*2, 48, 48), new THREE.MeshLambertMaterial({ map: groundTex })); ground.rotation.x = -Math.PI/2; S.add(ground);
// entorno do mapa: faixas no mesmo nível do chão, sem ficar por baixo dele (evita o chão "piscar" em celulares)
const landM = new THREE.MeshLambertMaterial({ color: '#bdb59f' }), seaM = new THREE.MeshLambertMaterial({ color: '#2a78a0' }), FAR = HALF*4;
function strip(x0, z0, x1, z1, m) { if (x1 <= x0 || z1 <= z0) return; const o = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0, 4, 4), m); o.rotation.x = -Math.PI/2; o.position.set((x0 + x1)/2, 0, (z0 + z1)/2); S.add(o); }
strip(HALF, -FAR, FAR, FAR, seaM); strip(-FAR, -FAR, -HALF, FAR, landM);
for (const [z0, z1, ze] of [[-FAR, -HALF, -HALF], [HALF, FAR, HALF]]) { const cx = clamp(coast(ze), -HALF, HALF); strip(-HALF, z0, cx, z1, landM); strip(cx, z0, HALF, z1, seaM); }


/* prédios: duas malhas instanciadas (baixos e altos), janelas acendem à noite */
function winMat(cols, rows) {
  const mk = lit => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = lit ? '#000' : '#fff'; x.fillRect(0, 0, 64, 128); const cw = 64/cols, rh = 128/rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { x.fillStyle = lit ? (Math.random() < .55 ? pickR(['#ffe7a0','#fff4cf','#ffd27a']) : '#000') : '#8299ad'; x.fillRect(i*cw + cw*.22, j*rh + rh*.3, cw*.56, rh*.42); }
    const t = new THREE.CanvasTexture(c); retroTex.push(t); return t; };
  const m = new THREE.MeshLambertMaterial({ map: mk(0), emissive: new THREE.Color('#ffffff'), emissiveMap: mk(1), emissiveIntensity: 0 }); bMats.push(m); return m;
}
const bGeo = new THREE.BoxGeometry(1, 1, 1); bGeo.translate(0, .5, 0);
{ const uv = bGeo.attributes.uv; for (let i = 8; i < 12; i++) uv.setXY(i, .01, .01); } // telhado sem janelas
const m4 = new THREE.Matrix4(), col = new THREE.Color(), kTint = new THREE.Color();
// a cidade é dividida em quadras de 500 m: cada quadra só é desenhada se estiver na frente da câmera e dentro da distância de visão
const CHUNK = 500, chunks = [], frustum = new THREE.Frustum(), projM = new THREE.Matrix4(), sph = new THREE.Sphere();
function byChunk(list) { const g = new Map(); for (const it of list) { const k = Math.floor((it.x + HALF)/CHUNK)*100 + Math.floor((it.z + HALF)/CHUNK); if (!g.has(k)) g.set(k, []); g.get(k).push(it); } return [...g.values()]; }
function addChunk(meshes, items, top) {
  let cx = 0, cz = 0; for (const it of items) { cx += it.x; cz += it.z; } cx /= items.length; cz /= items.length;
  let r = 0; for (const it of items) r = Math.max(r, Math.hypot(it.x - cx, it.z - cz) + (it.hw || 6)*1.5);
  for (const m of meshes) { m.frustumCulled = false; S.add(m); } chunks.push({ meshes, x: cx, z: cz, r: Math.hypot(r, top/2), y: top/2 });
}
// prédios: perto da câmera usam os modelos 3D (Kenney); longe, caixas simples (bem mais leve)
const BCELL = 250, LOD_D = IS_TOUCH ? 190 : 520, LOWS = Object.keys(KM).filter(k => k.startsWith('com:low-detail-building') && k !== 'com:low-detail-building-n');
function byCell(list, sz) { const g = new Map(); for (const it of list) { const k = Math.floor((it.x + HALF)/sz)*1000 + Math.floor((it.z + HALF)/sz); if (!g.has(k)) g.set(k, []); g.get(k).push(it); } return [...g.values()]; }
const boxMats = [winMat(3, 2), winMat(4, 14)], kd = new THREE.Object3D();
for (const grp of byCell(B, BCELL)) {
  const lo = [], hi = [], always = []; let top = 0;
  const isHouse = b => b.km && b.km.startsWith('sub:');
  const parts = [[grp.filter(b => !b.km && b.h < 24), 0, always], [grp.filter(b => !b.km && b.h >= 24), 1, always], [grp.filter(b => isHouse(b) && b.h < 24), 0, lo], [grp.filter(b => isHouse(b) && b.h >= 24), 1, lo]];
  for (const [sub, mi, dest] of parts) { if (!sub.length) continue;
    const m = new THREE.InstancedMesh(bGeo, boxMats[mi], sub.length);
    sub.forEach((b, i) => { m4.makeScale(b.hw*2, b.h, b.hd*2); m4.setPosition(b.x, 0, b.z); m.setMatrixAt(i, m4); m.setColorAt(i, col.set(b.c)); b.mesh = m; b.i = i; top = Math.max(top, b.h); });
    dest.push(m); }
  // de longe, prédios comerciais viram as versões "low detail" do Kenney (com janelas, mas bem leves)
  const byLow = new Map(); for (const b of grp) if (b.km && !isHouse(b)) { const k = LOWS[b.id % LOWS.length]; if (!byLow.has(k)) byLow.set(k, []); byLow.get(k).push(b); }
  for (const [key, sub] of byLow) { const m = new THREE.InstancedMesh(kGeo(key), kMat('com'), sub.length), [mx, my, mz] = kDims(key);
    sub.forEach((b, i) => { kd.position.set(b.x, 0, b.z); kd.rotation.set(0, 0, 0); kd.scale.set(b.hw*2/mx, b.h/my, b.hd*2/mz); kd.updateMatrix(); m.setMatrixAt(i, kd.matrix);
      m.setColorAt(i, col.set('#ffffff').lerp(kTint.set(b.c), .3)); if (!b.mesh) { b.mesh = m; b.i = i; } top = Math.max(top, b.h); }); lo.push(m); }
  const byKey = new Map(); for (const b of grp) if (b.km) { const vs = kVars(kKit(b.km)), v = vs[(b.id*7) % vs.length], k = b.km + '|' + (v || ''); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(b); }
  for (const [kv, sub] of byKey) { const [key, v] = kv.split('|'), m = new THREE.InstancedMesh(kGeo(key), kMat(kKit(key), v || null), sub.length);
    sub.forEach((b, i) => { kd.position.set(b.x, 0, b.z); kd.rotation.set(0, b.kr, 0); kd.scale.set(...b.ks); kd.updateMatrix(); m.setMatrixAt(i, kd.matrix);
      m.setColorAt(i, b.kc = col.set('#ffffff').lerp(kTint.set(b.c), .3).clone()); b.hm = m; b.hj = i; }); hi.push(m); }
  // prédios fixos (base, hospital...) não têm modelo: ficam sempre como caixa
  addChunk([...always], grp, top); const ch = chunks[chunks.length - 1]; ch.lo = lo; ch.hi = hi; for (const m of [...lo, ...hi]) { m.frustumCulled = false; S.add(m); }
}
const kNightMats = Object.values(kMats);
function updChunks() {
  projM.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); frustum.setFromProjectionMatrix(projM); const vd = S.fog.far + 60;
  for (const c of chunks) { const d = Math.hypot(c.x - cam.position.x, c.z - cam.position.z) - c.r; sph.center.set(c.x, c.y, c.z); sph.radius = c.r;
    const on = d < vd && frustum.intersectsSphere(sph); for (const m of c.meshes) m.visible = on;
    if (c.hi) { const near = on && OPT.detail !== 0 && d < (c.lodD || LOD_D); for (const m of c.hi) m.visible = near; for (const m of c.lo) m.visible = on && !near; } }
}
function tintBuilding(b, c) { b.mesh.setColorAt(b.i, col.set(c)); b.mesh.instanceColor.needsUpdate = true;
  if (b.hm) { b.hm.setColorAt(b.hj, c === b.c ? b.kc : col.set(c)); b.hm.instanceColor.needsUpdate = true; } }

/* árvores e coqueiros */
{
  const trees = [];
  for (const bch of beaches) for (let s = 8; s < bch.len; s += 16) { const p = roadAt(bch, s), o = -(11 + (Math.random() - .5)*5); trees.push({ x: p.x + bch.sea[0]*o, z: p.z + bch.sea[1]*o, h: 8 + Math.random()*3, palm: 1 }); }
  for (const k of parks) for (let n = 0; n < k.r*k.r/90; n++) { const a = Math.random()*7, r = Math.sqrt(Math.random())*(k.r - 4), x = k.x + Math.cos(a)*r, z = k.z + Math.sin(a)*r;
    if (padArr.some(p => Math.hypot(x - p.x, z - p.z) < 16)) continue; trees.push({ x, z, h: 4 + Math.random()*3 }); }
  if (GRID) for (const t of GRID.trees.slice(0, IS_TOUCH ? 2500 : 5000)) if (!padArr.some(p => Math.hypot(t.x - p.x, t.z - p.z) < 26) && !bNear(t.x, t.z, 2)) trees.push(t);
  if (!GRID) for (let n = 0; n < (IS_TOUCH ? 2000 : 4000); n++) { const x = -HALF + 10 + Math.random()*(HALF*2 - 20), z = -HALF + 10 + Math.random()*(HALF*2 - 20);
    if (nearBeach(x, z, 30) || isWater(x, z, 6) || nearRoad(x, z, 5) || bNear(x, z, 3) || inAir(x, z) || padArr.some(p => Math.hypot(x - p.x, z - p.z) < 20)) continue; trees.push({ x, z, h: 3 + Math.random()*3 }); }
  const trG = new THREE.CylinderGeometry(.3, .45, 1, 5).translate(0, .5, 0), trM = new THREE.MeshLambertMaterial({ color: '#7a5a3a' }), crG = new THREE.IcosahedronGeometry(1, 0), crM = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  const d = new THREE.Object3D();
  if (CITY.id === 'miami') for (const t of trees) if (!t.palm && Math.random() < .35) { t.palm = 1; t.h = 7 + Math.random()*4; }
  // coqueiros 3D (Quaternius) perto da câmera; longe, o coqueiro simples
  const PALMS = ['nat:PalmTree_1', 'nat:PalmTree_2', 'nat:PalmTree_4'], palmD = IS_TOUCH ? 110 : 300;
  for (const grp of byCell(trees.filter(t => t.palm), BCELL)) {
    const tr = new THREE.InstancedMesh(trG, trM, grp.length), cr = new THREE.InstancedMesh(crG, crM, grp.length), byV = PALMS.map(() => []);
    grp.forEach((t, i) => { d.position.set(t.x, 0, t.z); d.scale.set(1, t.h, 1); d.rotation.set(0, 0, 0); d.updateMatrix(); tr.setMatrixAt(i, d.matrix);
      d.position.set(t.x, t.h, t.z); d.scale.set(3.4, 1.1, 3.4); d.rotation.y = Math.random()*3; d.updateMatrix(); cr.setMatrixAt(i, d.matrix); cr.setColorAt(i, col.set('#4f9a3c'));
      byV[Math.floor(Math.random()*PALMS.length)].push(t); });
    const hi = []; byV.forEach((l, v) => { if (!l.length) return; const key = PALMS[v], m = new THREE.InstancedMesh(kGeo(key), kMat('nat'), l.length), mh = kDims(key)[1];
      l.forEach((t, i) => { d.position.set(t.x, 0, t.z); d.rotation.set(0, Math.random()*6.3, 0); d.scale.setScalar(t.h*1.15/mh); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }); hi.push(m); });
    addChunk([], grp, 14); const ch = chunks[chunks.length - 1]; ch.lo = [tr, cr]; ch.hi = hi; ch.lodD = palmD; for (const m of [tr, cr, ...hi]) { m.frustumCulled = false; S.add(m); }
  }
  for (const grp of byChunk(trees.filter(t => !t.palm))) { const tr = new THREE.InstancedMesh(trG, trM, grp.length), cr = new THREE.InstancedMesh(crG, crM, grp.length);
  grp.forEach((t, i) => { d.position.set(t.x, 0, t.z); d.scale.set(1, t.h, 1); d.rotation.set(0, 0, 0); d.updateMatrix(); tr.setMatrixAt(i, d.matrix);
    d.position.set(t.x, t.h, t.z); if (t.palm) d.scale.set(3.4, 1.1, 3.4); else d.scale.set(2.6 + t.h*.3, 2.2 + t.h*.3, 2.6 + t.h*.3); d.rotation.y = Math.random()*3; d.updateMatrix(); cr.setMatrixAt(i, d.matrix);
    cr.setColorAt(i, col.set(t.palm ? '#4f9a3c' : pickR(['#3f8a3a','#4c9640','#367a34']))); });
  addChunk([tr, cr], grp, 14); }
}
/* jangadas no mar */
const boats = [];
for (let n = 0; n < 8; n++) { const b = new THREE.Group(), z = -250 + n*120 + Math.random()*60;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, .5, 5), new THREE.MeshLambertMaterial({ color: '#8a5b36' })); hull.position.y = .25; b.add(hull);
  const sail = new THREE.Mesh(new THREE.BoxGeometry(.08, 5, 3), new THREE.MeshLambertMaterial({ color: pickR(['#ffffff','#f6d24a','#f07a52']) })); sail.position.set(0, 3, 0); sail.rotation.x = .25; b.add(sail);
  let q = beachAt(30 + Math.random()*120); if (!isWater(q.x, q.z, 4)) q = { x: (coast(z) + 60), z }; b.position.set(q.x, 0, q.z); b.rotation.y = Math.random()*6; b.userData.ph = Math.random()*6; S.add(b); boats.push(b); }

/* holofote do helicóptero (sempre na cena; liga e desliga pela intensidade) */
const spot = new THREE.SpotLight('#fff3d0', 0, 280, .3, .45, 1.1); S.add(spot, spot.target);
const spotCone = new THREE.Mesh(new THREE.ConeGeometry(16, 70, 18, 1, true).translate(0, -35, 0), new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide }));
spotCone.visible = false; S.add(spotCone);

/* chuva */
const RAIN_N = 1800, rainGeo = new THREE.BufferGeometry(), rainPos = new Float32Array(RAIN_N*3);
for (let i = 0; i < RAIN_N; i++) { rainPos[i*3] = (Math.random() - .5)*140; rainPos[i*3+1] = Math.random()*90; rainPos[i*3+2] = (Math.random() - .5)*140; }
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: '#c9dcec', size: .35, transparent: true, opacity: .7, depthWrite: false })); rain.visible = false; rain.frustumCulled = false; S.add(rain);

/* céu, ciclo dia/noite e clima */
let tod = .33, dayF = 1, weather = 'sol', wTimer = 240;
const skyDay = new THREE.Color('#a8d8f0'), skyDusk = new THREE.Color('#f0a070'), skyNight = new THREE.Color('#0d1633'), skyGrey = new THREE.Color('#8d98a3'), tmpC = new THREE.Color();
function clockText() { const m = Math.floor(tod*1440); return String(Math.floor(m/60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function updSky(dt) {
  if (OPT.cycle) tod = (tod + dt/720) % 1; // um dia inteiro = 12 minutos
  const el = Math.sin((tod - .25)*Math.PI*2); dayF = clamp((el + .12)/.35, 0, 1);
  const dusk = clamp(1 - Math.abs(el)/.22, 0, 1);
  tmpC.copy(skyNight).lerp(skyDay, dayF).lerp(skyDusk, dusk*.45);
  if (weather !== 'sol') tmpC.lerp(skyGrey, .55*dayF + .1);
  S.background.copy(tmpC); S.fog.color.copy(tmpC);
  hemi.intensity = .14 + .42*dayF; sun.intensity = .64*dayF*(weather === 'sol' ? 1 : .55);
  sun.position.set(Math.cos((tod - .25)*Math.PI*2)*500, Math.max(60, el*500), 200);
  for (const m of bMats) m.emissiveIntensity = (1 - dayF)*.9;
  for (const m of kNightMats) m.emissiveIntensity = (1 - dayF)*.55;
  updLamps(1 - dayF);
  const V = VIEW[OPT.view] || 1450, tf = weather === 'sol' ? V : weather === 'chuva' ? Math.min(V, 650) : 300, tn = weather === 'neblina' ? 50 : tf*.22;
  S.fog.near += (tn - S.fog.near)*Math.min(1, dt*.4); S.fog.far += (tf - S.fog.far)*Math.min(1, dt*.4);
  if (OPT.weather) { wTimer -= dt; if (wTimer <= 0) { wTimer = 160 + Math.random()*220; const r = Math.random(), nw = r < .6 ? 'sol' : r < .85 ? 'chuva' : 'neblina';
      if (nw !== weather) { weather = nw; if (typeof radio === 'function') radio(T(nw === 'sol' ? 'weatherRadioSun' : nw === 'chuva' ? 'weatherRadioRain' : 'weatherRadioFog'), 'info'); } } }
  else weather = 'sol';
  rain.visible = weather === 'chuva';
  if (rain.visible) { rain.position.set(cam.position.x, cam.position.y - 40, cam.position.z); for (let i = 0; i < RAIN_N; i++) { rainPos[i*3+1] -= 70*dt; if (rainPos[i*3+1] < 0) rainPos[i*3+1] += 90; } rainGeo.attributes.position.needsUpdate = true; }
}

/* ---------- Visual PS1: vértices "tremidos" e pontilhado de 15 bits ---------- */
const SNAP = '\nif (gl_Position.w > 0.0) { vec4 sp = gl_Position; sp.xyz /= sp.w; sp.xy = floor(sp.xy * vec2(160.0, 90.0) + 0.5) / vec2(160.0, 90.0); sp.xyz *= sp.w; gl_Position = sp; }';
const ps1Mats = new Set();
function ps1Patch() { S.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
  for (const m of ms) { if (ps1Mats.has(m) || m.isSpriteMaterial || m.isPointsMaterial || m.isShaderMaterial) continue; ps1Mats.add(m);
    m.onBeforeCompile = sh => { if (OPT.ps1) sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>' + SNAP); };
    m.customProgramCacheKey = () => OPT.ps1 ? 'ps1' : 'std'; m.needsUpdate = true; } }); }
function setPS1() { for (const m of ps1Mats) m.needsUpdate = true; }
const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const postS = new THREE.Scene(), postC = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postS.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { t: { value: rt.texture } }, depthTest: false, depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D t; varying vec2 vUv;
    float b2(vec2 p){ return mod(2.0*p.x + 3.0*p.y, 4.0); }
    void main(){ vec2 p = floor(mod(gl_FragCoord.xy, 4.0)); float d = (4.0*b2(mod(p, 2.0)) + b2(floor(p/2.0)))/16.0 - 0.5;
      vec3 c = texture2D(t, vUv).rgb; c = floor(c*24.0 + d + 0.5)/24.0; gl_FragColor = vec4(c, 1.0); }` })));
function renderFrame() { if (OPT.dither) { R.setRenderTarget(rt); R.render(S, cam); R.setRenderTarget(null); R.render(postS, postC); } else R.render(S, cam); }

/* ---------- Postes de luz nas avenidas ---------- */
const lampPts = [];
for (const r of roads.filter(r => r.w >= 11)) { for (let s = 10; s < r.len; s += 34) { const p = roadAt(r, s), side = (Math.floor(s/34) % 2 ? 1 : -1)*(r.w/2 + 1.5), x = p.x - p.tz*side, z = p.z + p.tx*side; if (!isWater(x, z, 1) && !bNear(x, z, 1)) lampPts.push({ x, z }); } }
const lampPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .16, 7, 5).translate(0, 3.5, 0), new THREE.MeshLambertMaterial({ color: '#6c7077' }), lampPts.length);
const lampHeadM = new THREE.MeshBasicMaterial({ color: '#9aa0a6' }), lampHead = new THREE.InstancedMesh(new THREE.BoxGeometry(.7, .25, .7).translate(0, 7.1, 0), lampHeadM, lampPts.length);
const lampGlowM = new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const lampGlow = new THREE.InstancedMesh(new THREE.CircleGeometry(5, 12).rotateX(-Math.PI/2).translate(0, .14, 0), lampGlowM, lampPts.length);
lampPts.forEach((l, i) => { m4.makeTranslation(l.x, 0, l.z); lampPole.setMatrixAt(i, m4); lampHead.setMatrixAt(i, m4); lampGlow.setMatrixAt(i, m4); });
S.add(lampPole, lampHead, lampGlow);
const padLightM = new THREE.MeshBasicMaterial({ color: '#5a6a5a' });
{ const pl = new THREE.InstancedMesh(new THREE.SphereGeometry(.35, 6, 4), padLightM, padArr.length*10); let k = 0;
  for (const p of padArr) for (let i = 0; i < 10; i++) { const a = i/10*Math.PI*2; m4.makeTranslation(p.x + Math.cos(a)*13.5, .3, p.z + Math.sin(a)*13.5); pl.setMatrixAt(k++, m4); } S.add(pl); }
const lampDay = new THREE.Color('#9aa0a6'), lampNight = new THREE.Color('#ffe3a0'), padDay = new THREE.Color('#5a6a5a'), padNight = new THREE.Color('#7dff6a');
function updLamps(night) { lampHeadM.color.copy(lampDay).lerp(lampNight, night); lampGlowM.opacity = night*.3; padLightM.color.copy(padDay).lerp(padNight, night*(Math.floor(perfT*2) % 2 ? 1 : .55)); }

/* ---------- Hangar da base: arco, portão, placa, biruta e caminhão-tanque ---------- */
const baseB = B.find(b => b.tag === 'base');
const windsock = new THREE.Group();
{ const b = baseB, Mt = c => new THREE.MeshLambertMaterial({ color: c }), g = new THREE.Group();
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 30.4, 18, 1, false, 0, Math.PI), Mt('#ece7dd')); arch.rotation.z = Math.PI/2; arch.position.set(b.x, b.h, b.z); g.add(arch);
  for (const dz of [-8.05, 8.05]) { const cap = new THREE.Mesh(new THREE.CircleGeometry(8, 18, 0, Math.PI), Mt('#c23a2c')); cap.position.set(b.x, b.h, b.z + dz); if (dz < 0) cap.rotation.y = Math.PI; g.add(cap); }
  for (const dx of [-15.3, 15.3]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(8.1, 8.1, .6, 18, 1, false, 0, Math.PI), Mt('#c23a2c')); band.rotation.z = Math.PI/2; band.position.set(b.x + dx, b.h, b.z); g.add(band); }
  const dc = document.createElement('canvas'); dc.width = 128; dc.height = 64; const x = dc.getContext('2d');
  x.fillStyle = '#4a4f57'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#3d4249'; for (let i = 0; i < 128; i += 8) x.fillRect(i, 0, 2, 56);
  for (let i = -8; i < 136; i += 16) { x.fillStyle = '#ffcc1f'; x.beginPath(); x.moveTo(i, 64); x.lineTo(i + 8, 56); x.lineTo(i + 16, 56); x.lineTo(i + 8, 64); x.fill(); }
  const dt = new THREE.CanvasTexture(dc); retroTex.push(dt);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(22, 9), new THREE.MeshLambertMaterial({ map: dt })); door.position.set(b.x, 4.5, b.z + b.hd + .06); g.add(door);
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 32; const y = sc.getContext('2d'); y.fillStyle = '#c23a2c'; y.fillRect(0, 0, 256, 32);
  y.fillStyle = '#fff'; y.font = '900 20px Archivo,Arial,sans-serif'; y.textAlign = 'center'; y.textBaseline = 'middle'; y.fillText(T('baseSign'), 128, 17);
  const stx = new THREE.CanvasTexture(sc); retroTex.push(stx);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 2), new THREE.MeshBasicMaterial({ map: stx })); sign.position.set(b.x, 12.6, b.z + 6.2); sign.rotation.x = -.35; g.add(sign);
  // biruta
  const p = pads.base; const pole = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, 7, 5), Mt('#ddd')); pole.position.set(p.x + 20, 3.5, p.z + 8); g.add(pole);
  windsock.position.set(p.x + 20, 6.8, p.z + 8); const sock = new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, 2.6, 8, 1, true).rotateX(Math.PI/2).translate(0, 0, 1.3), new THREE.MeshLambertMaterial({ color: '#ff7a1a', side: THREE.DoubleSide })); windsock.add(sock); g.add(windsock);
  // caminhão-tanque
  const truck = new THREE.Group(); const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2), Mt('#c23a2c')); cab.position.set(0, 1.5, -3);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 5, 10), Mt('#e8e8e8')); tank.rotation.x = Math.PI/2; tank.position.set(0, 1.7, .6);
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, .5, 7.5), Mt('#2b2b30')); chassis.position.y = .55; truck.add(cab, tank, chassis); truck.position.set(p.x - 22, 0, p.z + 4); truck.rotation.y = .4; g.add(truck);
  S.add(g); baseB.h = 17; // colisão inclui o telhado em arco
}
