// heli.js — frota, equipamentos e física de voo
// Nomes parecidos com aeronaves reais, sem usar as marcas. Modelos 3D próprios, feitos de primitivas.
const HELIS = [
  { id: 'schwaiter', n: 'Schwaiter 300C', tier: 1, price: 0, d: { pt: 'Leve, frágil e lento. Ótimo para aprender.', en: 'Light, fragile and slow. Great for learning.' }, kmh: 150, climb: 8, seats: 2, bucket: 300, load: 620, fuel: 45, burn: .18, armor: 80, turn: 1.15, size: .8, style: 'bubble', c1: '#e2231a', c2: '#f4f1ea', roof: 'S' },
  { id: 'jetrider', n: 'Bel 206 JetRider', tier: 2, price: 4500, d: { pt: 'O grande salto: versátil, faz quase tudo.', en: 'The big leap: versatile, does almost everything.' }, kmh: 230, climb: 11, seats: 7, bucket: 700, load: 1500, fuel: 85, burn: .26, armor: 120, turn: 1.05, size: 1, style: 'utility', c1: '#1f6fd0', c2: '#f4f1ea', roof: 'M' },
  { id: 'md505', n: 'McDowell MD-505', tier: 2, price: 5500, d: { pt: 'Compacto e ágil: pousa em telhados apertados.', en: 'Compact and nimble: lands on tight rooftops.' }, kmh: 230, climb: 12, seats: 6, bucket: 600, load: 1300, fuel: 70, burn: .24, armor: 110, turn: 1.3, size: .85, style: 'egg', c1: '#ffcc1f', c2: '#2b2b30', roof: 'S' },
  { id: 'md525', n: 'McDowell MD-525 NoTail', tier: 2, price: 7500, d: { pt: 'Sem rotor de cauda: rápido e quase imune ao vento.', en: 'No tail rotor: fast and nearly immune to wind.' }, kmh: 250, climb: 12, seats: 5, bucket: 600, load: 1200, fuel: 70, burn: .25, armor: 110, turn: 1.25, size: .9, style: 'notail', c1: '#2b2b30', c2: '#e2231a', roof: 'S', windRes: .3 },
  { id: 'bel213', n: 'Bel 213 TwinPack', tier: 3, price: 11000, d: { pt: 'O caminhão do céu: 15 lugares e o maior balde.', en: 'The sky truck: 15 seats and the biggest bucket.' }, kmh: 205, climb: 9, seats: 15, bucket: 1800, load: 4200, fuel: 150, burn: .4, armor: 200, turn: .8, size: 1.35, style: 'twinpack', c1: '#e2231a', c2: '#f4f1ea', roof: 'L' },
  { id: 'a110', n: 'Augusta A-110', tier: 3, price: 14000, d: { pt: 'O mais rápido da loja: perseguições e emergências.', en: 'Fastest in the shop: chases and emergencies.' }, kmh: 285, climb: 14, seats: 8, bucket: 800, load: 1900, fuel: 95, burn: .34, armor: 140, turn: 1.2, size: 1.05, style: 'sleek', c1: '#f4f1ea', c2: '#1f6fd0', roof: 'M' },
  { id: 'delfim', n: 'Eurocóptero AS-366 Delfim', tier: 4, price: 17000, d: { pt: 'Carga alta sem ser lento.', en: 'High capacity without being slow.' }, kmh: 260, climb: 13, seats: 13, bucket: 1400, load: 3400, fuel: 130, burn: .38, armor: 180, turn: 1.05, size: 1.25, style: 'dolphin', c1: '#e2231a', c2: '#ffcc1f', roof: 'L' },
  { id: 'explorador', n: 'McDowell Explorador', tier: 4, price: 20000, d: { pt: 'O definitivo: rápido, estável e espaçoso.', en: 'The ultimate: fast, stable and roomy.' }, kmh: 275, climb: 14, seats: 10, bucket: 1200, load: 2800, fuel: 120, burn: .34, armor: 170, turn: 1.2, size: 1.15, style: 'explorer', c1: '#14202c', c2: '#ffcc1f', roof: 'M', windRes: .35 },
  { id: 'apaxe', n: 'Boing AH-46 Apaxe', tier: 5, price: 0, sell: 25000, secret: true, d: { pt: 'Peça de museu desarmada. Rapidíssimo, mas não leva ninguém nem balde.', en: 'Disarmed museum piece. Blazing fast, but carries no one and no bucket.' }, kmh: 320, climb: 16, seats: 0, bucket: 0, load: 200, fuel: 90, burn: .36, armor: 220, turn: 1.35, size: 1.15, style: 'attack', c1: '#4a5a34', c2: '#2b2b30', roof: 'M' }];
HELIS.forEach(h => h.vmax = h.kmh/3.6);
const EQUIP = [
  { id: 'megafone', price: 0, stock: true, n: { pt: 'Alto-falante', en: 'Loudspeaker' }, d: { pt: 'De fábrica. Trânsito, infratores e tumultos.', en: 'Factory-fitted. Traffic, speeders and riots.' } },
  { id: 'maca', price: 400, seats: true, n: { pt: 'Maca', en: 'Stretcher' }, d: { pt: 'Libera as emergências médicas.', en: 'Unlocks medical emergencies.' } },
  { id: 'holofote', price: 600, n: { pt: 'Holofote', en: 'Spotlight' }, d: { pt: 'Perseguições noturnas e voo à noite.', en: 'Night chases and night flying.' } },
  { id: 'balde', price: 700, bucket: true, n: { pt: 'Balde d’água', en: 'Water bucket' }, d: { pt: 'Combate a incêndios com balde pendurado.', en: 'Fight fires with a slung bucket.' } },
  { id: 'guincho', price: 900, seats: true, n: { pt: 'Guincho', en: 'Rescue hoist' }, d: { pt: 'Resgata em telhados, no mar e em enchentes sem pousar.', en: 'Rescue on rooftops, at sea and in floods without landing.' } },
  { id: 'radar', price: 1000, n: { pt: 'Radar', en: 'Radar' }, d: { pt: 'Mostra infratores no mapa; chamadas chegam mais rápido.', en: 'Shows speeders on the map; calls arrive faster.' } },
  { id: 'tanque', price: 1200, n: { pt: 'Tanque extra', en: 'Aux tank' }, d: { pt: '+40% de combustível.', en: '+40% fuel.' } },
  { id: 'blindagem', price: 1500, n: { pt: 'Blindagem', en: 'Armor' }, d: { pt: '+35% de resistência.', en: '+35% toughness.' } },
  { id: 'gas', price: 1800, n: { pt: 'Gás lacrimogêneo', en: 'Tear gas' }, d: { pt: 'Dispersa tumultos três vezes mais rápido.', en: 'Breaks up riots three times faster.' } },
  { id: 'canhao', price: 2500, bucket: true, minTier: 2, n: { pt: 'Canhão d’água', en: 'Water cannon' }, d: { pt: 'Mira à frente, mais preciso que o balde. Nível 2 ou mais.', en: 'Aims forward, more precise than the bucket. Tier 2+.' } }];
const PMAX = .32, SMAX = .22, LB_PAX = 120, ROOF_MIN = { S: 0, M: 6, L: 8 };
const FMODES = [
  { auto: 1, wind: .35, dmg: .55, burn: .8, land: 1.45, sens: .85 },
  { auto: .45, wind: 1, dmg: 1, burn: 1, land: 1, sens: 1 },
  { auto: 0, wind: 1.6, dmg: 1.3, burn: 1.15, land: .75, sens: 1.1 }];
const FM = () => FMODES[OPT.mode] || FMODES[1];
const heliById = id => HELIS.find(h => h.id === id);
const eqById = id => EQUIP.find(e => e.id === id);
const hasEq = id => !!(G.gear[G.heli] || []).includes(id);
const fuelCap = () => HSPEC.fuel*(hasEq('tanque') ? 1.4 : 1);
const armorCap = () => HSPEC.armor*(hasEq('blindagem') ? 1.35 : 1);
const bucketCap = () => hasEq('canhao') ? Math.round(HSPEC.bucket*.7) : HSPEC.bucket;
function eqFits(e, h) { if (e.minTier && h.tier < e.minTier) return T('needTier'); if ((e.seats && !h.seats) || (e.bucket && !h.bucket)) return T('notOnThis'); return null; }

/* ---------- Modelos 3D ---------- */
function makeHeli(spec) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const body = new THREE.Group(); body.scale.setScalar(spec.size); g.add(body);
  const M = c => new THREE.MeshLambertMaterial({ color: c });
  const c1 = M(spec.c1), c2 = M(spec.c2), dark = M('#2b2b30'), glass = new THREE.MeshLambertMaterial({ color: '#8fd0ee', transparent: true, opacity: .75 });
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); body.add(o); return o; };
  const ball = (r, sx, sy, sz, m, x, y, z) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); body.add(o); return o; };
  const cyl = (r1, r2, h, m, x, y, z, rx = 0, rz = 0) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 10), m); o.rotation.set(rx, 0, rz); o.position.set(x, y, z); body.add(o); return o; };
  const rotors = [], tails = [], discs = [];
  const rotor = (y, z, r, blades = 2) => { const rg = new THREE.Group(); rg.position.set(0, y, z); rg.userData.dir = 1; body.add(rg);
    for (let i = 0; i < blades; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(r, .08, .42).translate(r/2, 0, 0), dark); b.rotation.y = i*Math.PI*2/blades; rg.add(b); }
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color: '#222', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    disc.rotation.x = -Math.PI/2; disc.position.set(0, y, z); body.add(disc); rotors.push(rg); discs.push(disc); box(.35, .6, .35, dark, 0, y - .3, z); };
  const tailRotor = (x, y, z, r = 1.05) => { const tr = new THREE.Group(); tr.position.set(x, y, z); body.add(tr); tr.add(new THREE.Mesh(new THREE.BoxGeometry(.06, r*2, .24), dark)); tails.push(tr); };
  const skids = (w = 1.15, l = 7) => { box(.22, .22, l, dark, -w, .11, 0); box(.22, .22, l, dark, w, .11, 0); for (const sx of [-1, 1]) for (const sz of [-1.5, 1.5]) box(.14, 1, .14, dark, sx*(w - .1), .6, sz); };
  const wheels = (zs) => { for (const z of zs) for (const x of [-1, 1]) cyl(.4, .4, .35, dark, x*1.1, .4, z, 0, Math.PI/2); };
  const s = spec.style;
  if (s === 'bubble') {
    ball(1.5, 1, 1, 1, glass, 0, 1.9, -1); box(2.2, .5, 2.2, c1, 0, 1, -1); box(1.4, 1.2, 1.6, c1, 0, 1.9, 1);
    for (let i = 0; i < 4; i++) box(.08, .08, 5.4, c2, (i % 2 ? .25 : -.25), 2 + (i < 2 ? .25 : -.1), 4.3);
    box(.12, 1.4, .8, c1, 0, 2.7, 6.9); skids(); rotor(3.35, .2, 4.8, 3); tailRotor(.25, 2.6, 7, .85);
  } else if (s === 'egg') {
    ball(1.4, 1, 1.05, 1.45, c1, 0, 1.8, 0); ball(1.2, .95, .8, .9, glass, 0, 2.05, -1.1); box(.4, .4, 4.6, c1, 0, 2.1, 3.8);
    box(.1, 1.5, .8, c2, 0, 2.8, 6); box(1.6, .1, .5, c2, 0, 3.3, 6.1); skids(1.05, 5.5); rotor(3.25, 0, 4.6, 5); tailRotor(.25, 2.3, 6.1, .8);
  } else if (s === 'notail' || s === 'explorer') {
    if (s === 'notail') { ball(1.4, 1, 1.05, 1.45, c1, 0, 1.8, 0); ball(1.2, .95, .8, .9, glass, 0, 2.05, -1.1); }
    else { box(2.3, 1.9, 3.8, c1, 0, 1.7, 0); const nose = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2, 8), c1); nose.rotation.x = -Math.PI/2; nose.position.set(0, 1.5, -2.9); body.add(nose); box(2.1, 1.2, 1.6, glass, 0, 2.15, -1.8); box(2.34, .3, 3.84, c2, 0, 1.15, 0); }
    cyl(.55, .35, 5, c1, 0, 2.1, 4.2, Math.PI/2); cyl(.36, .36, .6, dark, 0, 2.1, 6.8, Math.PI/2);
    for (const x of [-1, 1]) { const f = box(.1, 1.3, .9, c2, x*.9, 2.6, 6.3); f.rotation.z = -x*.2; } box(2, .1, .6, c2, 0, 2.1, 6.3);
    skids(s === 'notail' ? 1.05 : 1.15, 6); rotor(3.3, 0, s === 'notail' ? 4.8 : 5.4, 5);
  } else if (s === 'twinpack') {
    box(2.9, 2.6, 5.6, c1, 0, 1.9, 0); box(2.6, 1.6, 1.4, glass, 0, 2.3, -3.2); box(2.4, 1, 1.2, c1, 0, 1.3, -3.2); box(2.94, .4, 5.64, c2, 0, 1.2, 0);
    box(1.6, .8, 2.6, c1, 0, 3.5, .3); box(.7, .7, 6, c1, 0, 2.3, 5.6); box(.15, 2.2, 1.3, c1, 0, 3.2, 8.3); box(2.6, .14, .7, c2, 0, 2.4, 7.6);
    skids(1.5, 7.5); rotor(4.2, .3, 7.2, 2); tailRotor(.42, 3.3, 8.4, 1.3);
  } else if (s === 'sleek' || s === 'dolphin') {
    box(2.2, 1.9, 3.8, c1, 0, 1.6, 0); const nose = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.6, 8), c1); nose.rotation.x = -Math.PI/2; nose.position.set(0, 1.4, -3.2); body.add(nose);
    box(2, 1.2, 1.6, glass, 0, 2.05, -1.9); box(2.24, .3, 3.84, c2, 0, 1.15, 0); box(.5, .5, 5.2, c1, 0, 1.95, 4.3);
    if (s === 'dolphin') { const ring = new THREE.Mesh(new THREE.TorusGeometry(.9, .25, 6, 16), c2); ring.rotation.y = Math.PI/2; ring.position.set(0, 2.1, 7.1); body.add(ring); box(.12, 1.6, 1, c2, 0, 3, 6.6);
      const fan = new THREE.Group(); fan.position.set(0, 2.1, 7.1); body.add(fan); fan.add(new THREE.Mesh(new THREE.BoxGeometry(.08, 1.5, .2), dark)); tails.push(fan); skids(1.2, 6.5); rotor(3.2, 0, 6, 4); }
    else { box(.12, 1.7, 1, c1, 0, 2.8, 6.8); box(2, .1, .55, c2, 0, 2, 6.2); tailRotor(.32, 2.7, 6.95, .95); wheels([-1.8, 1.4]); rotor(3.15, 0, 5.6, 4); }
  } else if (s === 'attack') {
    box(1.3, 1.5, 7, c1, 0, 1.8, -.4); box(1.1, .9, 1.4, glass, 0, 2.8, -2.6); box(1.1, 1, 1.6, glass, 0, 3, -1); box(.6, .6, 5.5, c1, 0, 2.2, 5.3);
    box(4.2, .14, 1.1, c2, 0, 1.9, .2); box(.14, 2, 1.2, c1, 0, 3.1, 7.8); box(2.4, .1, .6, c2, 0, 2.3, 7.6); wheels([-2.4]); cyl(.25, .25, .3, dark, 0, .3, 7, 0, Math.PI/2);
    rotor(3.7, 0, 6.2, 4); tailRotor(.32, 3.4, 7.9, 1.05);
  } else { // utility
    box(2.4, 2, 3.6, c1, 0, 1.65, 0); box(2.2, 1.5, 1.5, glass, 0, 1.95, -2.3); box(2.44, .38, 3.64, c2, 0, 1.25, 0); box(2.3, .6, 1.6, c1, 0, 1.1, -2.2);
    box(.6, .6, 5.6, c1, 0, 2.05, 4.5); box(.15, 1.9, 1.1, c1, 0, 2.9, 7); box(2.3, .12, .6, c2, 0, 2.2, 6.6); box(1.2, .6, 1.8, c1, 0, 2.85, .6);
    skids(); rotor(3.35, 0, 5.8, 2); tailRotor(.38, 2.9, 7.15);
  }
  const nav = (c, x, y, z) => { const o = new THREE.Mesh(new THREE.SphereGeometry(.18, 6, 4), new THREE.MeshBasicMaterial({ color: c })); o.position.set(x, y, z); body.add(o); return o; };
  nav('#ff2a2a', -1.3, 1.6, -.5); nav('#2aff5a', 1.3, 1.6, -.5); const strobe = nav('#ffffff', 0, .7, 1.6);
  return { g, rotors, tails, discs, strobe };
}

/* ---------- Estado do voo ---------- */
let HSPEC = HELIS[0], HM = null, st = null;
function spawnHeli(spec) { HSPEC = spec; if (HM) S.remove(HM.g); HM = makeHeli(spec); S.add(HM.g); }
function resetFlight() {
  st = { x: pads.base.x, y: 0, z: pads.base.z, vx: 0, vy: 0, vz: 0, yaw: 0, yawRate: 0, pitchT: 0, pitchS: 0, slideT: 0, slideS: 0, bank: 0, fwd: 0, sld: 0,
    rpm: 0, engine: false, fuel: 0, dmg: 0, landed: true, roof: null, dying: false, dead: false, deadT: 0, pax: 0, water: 0, spotOn: false, fill: 0,
    shake: 0, agl: 0, gnd: 0, overWater: false, smokeT: 0, wind: { x: 0, z: 0 }, windT: 0, roofWarn: 0 };
  st.fuel = fuelCap(); HM.g.visible = true;
}
const seatsFree = () => HSPEC.seats - st.pax;

/* ---------- Dano e queda ---------- */
let lastHurtMsg = 0;
function hurt(a, msg) {
  if (st.dead || st.dying || a <= 0) return; a *= FM().dmg; st.dmg += a;
  if (st.dmg >= armorCap()) { st.dmg = armorCap(); st.dying = true; st.engine = false; toast(T('mayday'), 3000); radio(T('maydayRadio'), 'alerta'); sfx('alarm'); return; }
  if (msg && performance.now() - lastHurtMsg > 900) { toast(msg + ' ' + T('dmgPct', { p: Math.round(st.dmg/armorCap()*100) })); lastHurtMsg = performance.now(); }
  sfx('thud', Math.min(1, a/20));
}
function explode() { st.dead = true; st.deadT = 0; st.dying = false; HM.g.visible = false; spawnBoom(st.x, st.y + 1.5, st.z); sfx('boom'); if (M) failMission(T('crashedMission')); }

/* ---------- Passo de física ---------- */
function flightStep(dt, inp) {
  if (st.dead) return;
  const H = HSPEC, fm = FM(), sens = OPT.sens*fm.sens, ARM = armorCap();
  const fx = -Math.sin(st.yaw), fz = -Math.cos(st.yaw), rx = Math.cos(st.yaw), rz = -Math.sin(st.yaw);
  if (st.engine && (st.fuel <= 0 || st.dying)) st.engine = false;
  st.rpm = clamp(st.rpm + (st.engine ? dt/2.6 : -dt/5), 0, 1);
  const liftOK = st.rpm >= .8 && !st.dying;
  const load = st.pax*LB_PAX + st.water, loadF = clamp(load / H.load, 0, 1.4), lf = 1 - .42*loadF;
  const ctrl = !st.dying && !st.dead;
  if (ctrl) {
    if (Math.abs(inp.ap) > .08) st.pitchT = clamp(inp.ap, -.6, 1)*PMAX;
    else if (inp.kp) st.pitchT = clamp(st.pitchT + inp.kp*.6*sens*dt, -PMAX*.6, PMAX);
    else st.pitchT -= Math.sign(st.pitchT)*Math.min(Math.abs(st.pitchT), (camMode === 1 ? .55 : .3)*(.6 + fm.auto*1.6)*dt);
    if (Math.abs(inp.as) > .08) st.slideT = inp.as*SMAX;
    else if (inp.ks) st.slideT = clamp(st.slideT + inp.ks*.7*sens*dt, -SMAX, SMAX);
    else st.slideT -= Math.sign(st.slideT)*Math.min(Math.abs(st.slideT), .6*dt);
  }
  if (st.landed) { st.pitchT *= Math.max(0, 1 - dt*4); st.slideT *= Math.max(0, 1 - dt*4); }
  const turn = ctrl && !st.landed ? clamp(inp.turn, -1, 1) : 0;
  st.yawRate += ((st.dying ? 2.6 : turn*H.turn*sens) - st.yawRate)*Math.min(1, dt*(st.dying ? 1 : 3.5));
  st.pitchS += (st.pitchT - st.pitchS)*Math.min(1, dt*2.8); st.slideS += (st.slideT - st.slideS)*Math.min(1, dt*3);
  st.windT -= dt; if (st.windT <= 0) { st.windT = 8 + Math.random()*10; const a = Math.random()*7, w = (weather === 'chuva' ? 4 : 1.6)*Math.random(); st.wind.x = Math.cos(a)*w; st.wind.z = Math.sin(a)*w; }
  const windK = fm.wind*(H.windRes || 1);
  const fireT = fireBelow(st.x, st.y, st.z), turb = clamp((st.dmg/ARM - .55)*2, 0, 1) + fireT + (weather === 'chuva' ? .25 : 0)*(H.windRes || 1);
  st.shake = turb; if (fireT > .3) hurt(dt*6*fireT, T('fireHeat'));
  if (!st.landed) {
    st.yaw += st.yawRate*dt;
    const fwdT = st.pitchS/PMAX*H.vmax*lf*(st.pitchS < 0 ? .4 : 1), sldT = st.slideS/SMAX*H.vmax*.32*lf;
    st.fwd += (fwdT - st.fwd)*Math.min(1, dt*.65); st.sld += (sldT - st.sld)*Math.min(1, dt*.9);
    const idle = !inp.kp && Math.abs(inp.ap) < .08 && !inp.ks && Math.abs(inp.as) < .08;
    if (idle && fm.auto > 0) { st.fwd *= Math.max(0, 1 - fm.auto*.6*dt); st.sld *= Math.max(0, 1 - fm.auto*.9*dt); }
    const dvx = fx*st.fwd + rx*st.sld + st.wind.x*windK, dvz = fz*st.fwd + rz*st.sld + st.wind.z*windK;
    const k = Math.min(1, dt*1.25); st.vx += (dvx - st.vx)*k; st.vz += (dvz - st.vz)*k;
    st.vx += (Math.random() - .5)*turb*14*dt; st.vz += (Math.random() - .5)*turb*14*dt;
  }
  let climbT;
  if (st.dying) climbT = -18;
  else if (!liftOK) climbT = st.landed ? 0 : st.fuel <= 0 ? -7 + Math.max(0, inp.col)*3 : -10*(1 - st.rpm) - 3;
  else climbT = inp.col*H.climb*(inp.col < 0 ? 1.8 : 1 - .35*loadF); // descer é mais rápido que subir
  if (st.agl > 300 && climbT > 0) climbT = 0;
  if (liftOK && st.agl < 9 && climbT < 0) climbT *= .45 + .55*st.agl/9;
  if (liftOK && !st.landed && inp.col === 0) climbT += Math.sin(perfT*1.3)*.25*(1 - fm.auto*.7) + (Math.random() - .5)*turb*6 - (OPT.mode === 2 ? .9 : 0);
  st.vy += (climbT - st.vy)*Math.min(1, dt*2.2);
  if (st.landed && (climbT <= 0 || !liftOK)) { st.vy = 0; st.vx = st.vz = st.fwd = st.sld = 0; }
  if (st.engine) { st.fuel = Math.max(0, st.fuel - .5*H.burn*fm.burn*dt*(st.landed ? .25 : .55 + .25*st.rpm + .3*Math.abs(inp.col) + .25*loadF));
    if (st.fuel <= 0) { toast(T('noFuel'), 3500); radio(T('noFuelRadio'), 'alerta'); } }
  let nx = st.x + st.vx*dt, ny = st.y + st.vy*dt, nz = st.z + st.vz*dt;
  const E = HALF - 10; if (nx < -E || nx > E + 500 || nz < -E || nz > E) { nx = clamp(nx, -E, E + 500); nz = clamp(nz, -E, E); st.vx *= -.2; st.vz *= -.2; st.fwd *= .3; if (Math.random() < .05) toast(T('boundary'), 1500); }
  if (ny > 340) { ny = 340; st.vy = Math.min(0, st.vy); }
  const R2 = 2.6*H.size, b = bAt(nx, nz, R2);
  if (b && st.y < b.h - .4) {
    const sp = Math.hypot(st.vx, st.vz), ox = Math.abs(nx - b.x) - b.hw, oz = Math.abs(nz - b.z) - b.hd;
    if (ox > oz) st.vx = -st.vx*.35; else st.vz = -st.vz*.35;
    nx = st.x + st.vx*dt; nz = st.z + st.vz*dt; if (bAt(nx, nz, R2)) { nx = st.x; nz = st.z; }
    st.fwd *= .3; st.sld *= .3;
    if (st.dying) return explode();
    hurt(sp*1.7 + 5, T('hitBuilding')); sfx('crash');
  }
  const gb = bAt(nx, nz, 1.5); st.gnd = gb && st.y >= gb.h - .4 ? gb.h : 0;
  st.overWater = !gb && isWater(nx, nz);
  if (ny <= st.gnd) {
    const sink = -st.vy, hs = Math.hypot(st.vx, st.vz), small = st.gnd > 0 && gb && Math.min(gb.hw, gb.hd) < ROOF_MIN[H.roof];
    if (st.dying) { st.x = nx; st.z = nz; st.y = st.gnd; return explode(); }
    if (st.overWater) { ny = st.gnd + .6; st.vy = Math.max(3, sink*.5); st.vx *= .5; st.vz *= .5; st.fwd *= .4; spawnSplash(nx, nz); hurt(12 + sink*3, T('waterTouch')); sfx('splash'); }
    else if (small && !st.landed) { ny = st.gnd + .3; st.vy = Math.max(2, sink*.4); hurt(3 + sink*2, ''); if (performance.now() - st.roofWarn > 2500) { toast(T('roofSmall'), 2200); st.roofWarn = performance.now(); } }
    else if (st.landed || (sink < 6*fm.land && hs < 7.5*fm.land && Math.abs(st.pitchS) < .16*fm.land && Math.abs(st.slideS) < .13*fm.land)) {
      if (!st.landed) { st.landed = true; sfx('land'); }
      ny = st.gnd; st.vy = 0; st.vx = st.vz = st.fwd = st.sld = 0; st.roof = gb && st.gnd > 0 ? gb : null;
    } else {
      ny = st.gnd + .05; st.vy = sink*.35; st.vx *= .5; st.vz *= .5; st.fwd *= .5; st.sld *= .5;
      hurt(Math.max(0, sink - 6)*6 + Math.max(0, hs - 7.5)*2 + 4, sink > 6 ? T('hardLanding') : T('badLanding'));
    }
  } else if (ny > st.gnd + .05) { st.landed = false; st.roof = null; }
  if (st.landed && liftOK && inp.col > 0) { st.landed = false; st.vy = 1.5; ny = st.gnd + .1; st.roof = null; }
  st.x = nx; st.y = ny; st.z = nz; st.agl = st.y - st.gnd;
  const f = clamp(Math.abs(st.fwd)/14, .25, 1);
  st.bank += ((st.landed ? 0 : turn*.38*f - st.slideS*1.1) + (st.dying ? Math.sin(perfT*5)*.3 : 0) - st.bank)*Math.min(1, dt*3);
  const sh = st.shake*.05;
  HM.g.position.set(st.x, st.y, st.z);
  HM.g.rotation.set(-st.pitchS + (Math.random() - .5)*sh, st.yaw, st.bank + (Math.random() - .5)*sh);
  for (const r of HM.rotors) r.rotation.y += dt*st.rpm*40*r.userData.dir;
  for (const t of HM.tails) t.rotation.x += dt*st.rpm*60;
  for (const d of HM.discs) d.material.opacity = st.rpm > .8 ? .16 : 0;
  HM.strobe.visible = Math.floor(perfT*1.5) % 2 === 0 && (perfT*1.5 % 1) < .15;
  if (st.dying) { st.smokeT -= dt; if (st.smokeT <= 0) { st.smokeT = .08; puff(st.x, st.y + 2, st.z, 2); } }
  else if (st.dmg/ARM > .6) { st.smokeT -= dt; if (st.smokeT <= 0) { st.smokeT = .3; puff(st.x, st.y + 2.5, st.z, 1); } }
}
