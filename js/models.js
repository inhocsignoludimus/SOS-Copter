// models.js — modelos 3D Kenney (CC0, kenney.nl) convertidos por tools/build_models.py
const KM = KENNEY_META.models, KBUF = (() => { const s = atob(KENNEY_B64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; })();
const kGeoCache = {}, kMats = {};
function kDims(key) { const m = KM[key]; return [m.max[0] - m.min[0], m.max[1] - m.min[1], m.max[2] - m.min[2]]; }
// geometria centrada em x/z, com a base em y = 0
function kGeo(key) {
  if (kGeoCache[key]) return kGeoCache[key];
  const m = KM[key], g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(KBUF, m.p, m.n*3).slice(), 3));
  // normais em float (o three r128 estraga atributos int8 normalizados ao transformar a geometria)
  const n8 = new Int8Array(KBUF, m.nm, m.n*3), nf = new Float32Array(m.n*3); for (let i = 0; i < nf.length; i++) nf[i] = n8[i]/127;
  g.setAttribute('normal', new THREE.BufferAttribute(nf, 3));
  if (m.c !== undefined) g.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(KBUF, m.c, m.n*3), 3, true));
  else g.setAttribute('uv', new THREE.BufferAttribute(new Uint16Array(KBUF, m.uv, m.n*2), 2, true));
  g.setIndex(new THREE.BufferAttribute(m.i32 ? new Uint32Array(KBUF, m.i, m.ni) : new Uint16Array(KBUF, m.i, m.ni), 1));
  g.translate(-(m.min[0] + m.max[0])/2, -m.min[1], -(m.min[2] + m.max[2])/2); g.computeBoundingSphere();
  return kGeoCache[key] = g;
}
// paleta em degradê: sem mipmaps (senão, de longe, as cores se misturam com o preto da paleta)
function kTex(src) { const nm = src.split('/').pop().replace('.png', ''), t = new THREE.TextureLoader().load(KENNEY_TEX[nm] || src); t.flipY = false; t.encoding = THREE.LinearEncoding; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t; }
function kMat(kit, v) { // um material por kit (todos os modelos do kit usam a mesma paleta); v = paleta alternativa ('b', 'c')
  if (v) kit = kit + '-' + v;
  if (kMats[kit]) return kMats[kit];
  if (kit === 'nat') return kMats[kit] = new THREE.MeshLambertMaterial({ vertexColors: true });
  const m = new THREE.MeshLambertMaterial({ color: new THREE.Color(1.12, 1.12, 1.12), map: kTex(`models/${kit}.png`), emissive: new THREE.Color('#ffffff'), emissiveMap: kTex(`models/${kit}-em.png`), emissiveIntensity: 0 });
  return kMats[kit] = m;
}
const kKit = key => KM[key].kit, kVars = kit => [null, ...((KENNEY_META.var || {})[kit] || [])];
// escolhe e encaixa um modelo no terreno de cada prédio (ajusta hw/hd/h ao tamanho real do modelo)
const K_HOUSES = Object.keys(KM).filter(k => k.startsWith('sub:building')), K_SHOPS = Object.keys(KM).filter(k => /^com:building-[a-n]$/.test(k)), K_TOWERS = Object.keys(KM).filter(k => k.startsWith('com:building-skyscraper'));
function kAssign(b, zn, rand) {
  const w = b.hw*2, d = b.hd*2, house = (zn === 'residential' || zn === 'suburb' || !zn) && b.h <= 16;
  const list = house ? K_HOUSES : b.h >= 40 ? K_TOWERS : K_SHOPS;
  let key;
  if (house || b.h >= 40) key = list[Math.floor(rand()*list.length)];
  else { const want = b.h/Math.max(w, d); key = list.slice().sort((a, c) => { const A = kDims(a), C = kDims(c); return Math.abs(A[1]/Math.max(A[0], A[2]) - want) - Math.abs(C[1]/Math.max(C[0], C[2]) - want); })[Math.floor(rand()*3)]; }
  const rot = Math.floor(rand()*4), [mx, my, mz] = kDims(key), sw = rot % 2 ? mz : mx, sd = rot % 2 ? mx : mz;
  const k = Math.min(w/sw, d/sd)*.96;
  let ky = k;
  if (b.h >= 40) ky = b.h/my; else if (!house) ky = clamp(b.h/(k*my), .8, 1.45)*k;
  b.km = key; b.kr = rot*Math.PI/2; b.ks = [k, ky, k]; b.hw = sw*k/2; b.hd = sd*k/2; b.h = my*ky;
}
