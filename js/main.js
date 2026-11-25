// main.js — laço principal, câmeras, serviço da base e início da carreira
let perfT = 0, last = performance.now(), svcText = '', camYaw = 0, ps1T = 0;
const v3 = new THREE.Vector3(), lk = new THREE.Vector3();

function baseService(dt) {
  svcText = '';
  if (!st.landed || st.gnd !== 0) return;
  const atBase = dxz(st, pads.base) < 16, atPad = atBase || Object.values(pads).some(p => dxz(st, p) < 16); if (!atPad) return;
  const FC = fuelCap();
  if (st.fuel < FC - .5 && G.money > 0) { const a = Math.min(FC - st.fuel, 12*dt); st.fuel += a; G.money -= a*(atBase ? 2 : 3); svcText = T('svcFuel'); }
  if (!atBase) { if (G.money <= 0 && st.fuel < FC - 1) svcText = T('svcNoMoney'); G.money = Math.max(0, G.money); return; }
  if (st.dmg > 0 && G.money > 0) { const a = Math.min(st.dmg, 14*dt); st.dmg -= a; G.money -= a*4; svcText = T(svcText ? 'svcBoth' : 'svcRepair'); }
  if (G.money <= 0 && (st.fuel < FC - 1 || st.dmg > 0)) svcText = T('svcNoMoney');
  G.money = Math.max(0, G.money);
}
function updSpot() {
  const on = st.spotOn && !st.dead; spot.intensity = on ? 2.4 : 0; spotCone.visible = on;
  if (!on) return; const fx = -Math.sin(st.yaw), fz = -Math.cos(st.yaw);
  spot.position.set(st.x + fx*2, st.y + .5, st.z + fz*2); spot.target.position.set(st.x + fx*28, Math.max(0, st.y - 60), st.z + fz*28);
  spotCone.position.copy(spot.position); spotCone.lookAt(spot.target.position); spotCone.rotateX(-Math.PI/2);
  const len = spot.position.distanceTo(spot.target.position); spotCone.scale.set(len/70, len/70, len/70);
}
function updCam(dt) {
  if (!playing && !st.dead) { // tela de menu: câmera passeando pela orla
    const a = perfT*.05 + now0*.00001; cam.up.set(0, 1, 0); const cx = CITY.menuCam.x, cz = CITY.menuCam.z; cam.position.set(cx + Math.cos(a)*420, 190, cz + Math.sin(a)*420); cam.lookAt(cx + 80, 30, cz); return; }
  if (PF.active) { PF.camYaw += orbit.yaw; orbit.yaw = 0; const fx = -Math.sin(PF.camYaw), fz = -Math.cos(PF.camYaw); cam.up.set(0, 1, 0);
    v3.set(PF.x - fx*5, PF.y + 2.3 + orbit.pitch*4, PF.z - fz*5); cam.position.lerp(v3, 1 - Math.exp(-dt*8)); cam.lookAt(PF.x, PF.y + 1.3, PF.z); return; }
  let d = st.yaw - camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); camYaw += d*Math.min(1, dt*3);
  if (!orbit.drag && orbit.t > 0) orbit.t -= dt; if (!orbit.drag && orbit.t <= 0) { orbit.yaw *= Math.max(0, 1 - dt*2); orbit.pitch *= Math.max(0, 1 - dt*2); }
  const s = HSPEC.size; cam.up.set(0, 1, 0);
  if (camMode === 0) { const yaw = camYaw + orbit.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), D = orbit.dist*s;
    v3.set(st.x - fx*D*Math.cos(orbit.pitch), Math.max(st.y + 8*s + Math.sin(orbit.pitch)*D, 3), st.z - fz*D*Math.cos(orbit.pitch)); cam.position.lerp(v3, 1 - Math.exp(-dt*5));
    lk.set(st.x + fx*10, st.y + 2, st.z + fz*10); cam.lookAt(lk); }
  else if (camMode === 1) { const fx = -Math.sin(st.yaw), fz = -Math.cos(st.yaw); cam.position.set(st.x + fx*2.9*s, st.y + 2.3*s, st.z + fz*2.9*s);
    lk.set(st.x + fx*40, st.y + 2.3*s - Math.tan(st.pitchS)*40 - 4, st.z + fz*40); cam.lookAt(lk); cam.rotateZ(st.bank*.6); }
  else if (camMode === 2) { const fx = -Math.sin(st.yaw), fz = -Math.cos(st.yaw); cam.up.set(fx, 0, fz); cam.position.set(st.x, st.y - .3, st.z); cam.lookAt(st.x + fx*.01, st.y - 50, st.z + fz*.01); }
  else { v3.set(st.x, st.y + 130, st.z + 45); cam.position.lerp(v3, 1 - Math.exp(-dt*4)); cam.lookAt(st.x, st.y, st.z); }
  if (st.shake > .05 && camMode !== 3) { cam.position.x += (Math.random() - .5)*st.shake*.5; cam.position.y += (Math.random() - .5)*st.shake*.5; }
}
const now0 = Date.now();
function anim(dt) {
  animPeople(); updFlood(dt); if (st) windsock.rotation.y += (Math.atan2(st.wind.x || .3, st.wind.z || .5) - windsock.rotation.y)*Math.min(1, dt);
  if (swimmer.visible && !winch.visible) swimmer.position.y = Math.sin(perfT*2.4)*.35;
  beacon.material.opacity = .2 + .1*Math.sin(perfT*3); ring.rotation.z += dt*.6;
  boats.forEach(b => { b.position.y = Math.sin(perfT*1.6 + b.userData.ph)*.25; b.rotation.z = Math.sin(perfT*1.3 + b.userData.ph)*.06; });
  shadow.visible = HM.g.visible; shadow.position.set(st.x, st.gnd + .18, st.z); shadow.scale.setScalar(Math.max(.4, 1 - st.agl/120)*HSPEC.size);
}
function loop(now) {
  requestAnimationFrame(loop); const dt = Math.min(.05, (now - last)/1000); last = now;
  if (playing && !paused) {
    const inp = PF.active ? { kp: 0, ks: 0, ap: 0, as: 0, turn: 0, col: 0 } : readInput(); flightStep(dt, inp); if (PF.active) footStep(dt); baseService(dt); updDispatch(dt); updBucket(dt); updSpot();
    if (st.landed && !G.owned.includes('apaxe') && dxz(st, CITY.secret) < 22) { G.owned.push('apaxe'); G.gear.apaxe = ['megafone']; secretModel.g.visible = false; toast(T('secretFound', { x: heliById('apaxe').n }), 4000); radio(T('secretRadio'), 'win'); sfx('win'); save(); }
    if (st.dead) { st.deadT += dt; if (st.deadT > 2.5 && playing) crashDialog(); }
  } else readPad();
  if (!paused) { perfT += dt; updSky(dt); updCars(dt); updPeds(dt); updCrowd(dt); updFires(dt); updFx(dt); anim(dt); }
  updCam(dt); cam.updateMatrixWorld(); updChunks(); if (playing) updHud(dt); updAudio(dt); if (playing) { ps1T -= dt; if (ps1T <= 0) { ps1T = 1; ps1Patch(); } } renderFrame(); if (playing && CK_ON) drawCockpit();
}
function tryLandscape() { // celular: tenta tela cheia + travar deitado (nem todo navegador permite)
  if (!IS_TOUCH) return; const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
  try { const p = rq && !document.fullscreenElement ? rq.call(el) : null; Promise.resolve(p).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape')).catch(() => {}); } catch (e) {}
}
let rotSeen = false;
setInterval(() => { const r = $('rotHint'); if (!r) return; const show = IS_TOUCH && playing && !rotSeen && innerHeight > innerWidth; r.hidden = !show; }, 400);
function beginCareer() {
  tryLandscape();
  spawnHeli(heliById(G.heli) || HELIS[0]); resetFlight(); endMission(); offer = null; nextOffer = 2.5; radioLog.length = 0;
  hideOv(); $('title').hidden = true; $('hud').hidden = false; playing = true; paused = false; startAudio(); camMode = 0; camYaw = 0;
  radio(G.free ? T('freeHello') : T('hello', { rank: rankName(rankIdx()).toLowerCase(), city: CITY.name }), G.free ? 'win' : 'info');
  toast(T('tip1'), 4000); secretModel.g.visible = !G.owned.includes('apaxe');
  if (G.tutorial) setTimeout(() => toast(T('tip2'), 4500), 4500);
}
addEventListener('resize', applyRes);
// grupos instanciados (prédios, carros, árvores, postes) cobrem o mapa todo: não deixar a câmera descartá-los
S.traverse(o => { if (o.isInstancedMesh || o.isPoints) o.frustumCulled = false; });
spawnHeli(HELIS[0]); resetFlight(); applyRes(); updSky(0); ps1Patch(); applyStatic(); showMain(); requestAnimationFrame(loop);
storyAuto();
