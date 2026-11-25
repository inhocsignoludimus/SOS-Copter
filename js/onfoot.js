// onfoot.js — sair do helicóptero e andar a pé: piloto próprio (macacão laranja e capacete), conversa, hangar e resgate a pé
function makePilot() {
  const p = new THREE.Group(), Mt = c => new THREE.MeshLambertMaterial({ color: c });
  const suit = Mt('#ff7a1a'), stripe = Mt('#f4f4f0'), dark = Mt('#1b1d22'), skin = Mt('#c58c63'), helmet = Mt('#f4f4f0'), visor = Mt('#203040');
  const add = (geo, m, x, y, z, parent = p) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
  const legs = [-1, 1].map(sd => { const g = new THREE.Group(); g.position.set(sd*.2, 1.02, 0); p.add(g); add(new THREE.BoxGeometry(.3, .95, .32).translate(0, -.48, 0), suit, 0, 0, 0, g); add(new THREE.BoxGeometry(.34, .2, .48), dark, 0, -.97, -.06, g); return g; });
  add(new THREE.BoxGeometry(.74, .3, .44), suit, 0, 1.08, 0);
  add(new THREE.BoxGeometry(.84, .98, .5), suit, 0, 1.7, 0); add(new THREE.BoxGeometry(.86, .1, .52), stripe, 0, 1.55, 0); add(new THREE.BoxGeometry(.86, .1, .52), stripe, 0, 1.85, 0);
  add(new THREE.BoxGeometry(.24, .18, .24), skin, 0, 2.25, 0); add(new THREE.BoxGeometry(.56, .58, .56), skin, 0, 2.6, 0);
  add(new THREE.BoxGeometry(.66, .5, .66), helmet, 0, 2.85, .02); add(new THREE.BoxGeometry(.5, .2, .06), visor, 0, 2.68, -.31);
  const arms = [-1, 1].map(sd => { const g = new THREE.Group(); g.position.set(sd*.54, 2.12, 0); p.add(g); add(new THREE.BoxGeometry(.22, .82, .24).translate(0, -.41, 0), suit, 0, 0, 0, g); add(new THREE.BoxGeometry(.22, .22, .22), dark, 0, -.92, 0, g); return g; });
  p.scale.setScalar(.6); p.userData = { aL: arms[0], aR: arms[1], lL: legs[0], lR: legs[1] }; return p;
}
const pilot = makePilot(); pilot.visible = false; S.add(pilot);
const PF = { active: false, x: 0, z: 0, y: 0, yaw: 0, camYaw: 0, walk: 0, roof: null, moving: false };
let footPromptEl = null;
function footPrompt(text) {
  if (!footPromptEl) { footPromptEl = document.createElement('div'); footPromptEl.id = 'footPrompt';
    footPromptEl.style.cssText = 'position:fixed;left:50%;bottom:150px;transform:translateX(-50%);background:rgba(12,20,30,.82);color:#fff;font:700 14px Archivo,sans-serif;padding:8px 14px;border-radius:10px;pointer-events:none;z-index:5;white-space:nowrap';
    document.body.appendChild(footPromptEl); }
  footPromptEl.textContent = text || ''; footPromptEl.style.display = text ? 'block' : 'none';
}
// pode ficar em pé aqui? (no telhado, só dentro dele; no chão, fora de prédios, água e do próprio helicóptero)
function footOK(x, z) {
  if (PF.roof) { const r = PF.roof; return Math.abs(x - r.x) < r.hw - .5 && Math.abs(z - r.z) < r.hd - .5 && Math.hypot(x - st.x, z - st.z) > 2.2*HSPEC.size; }
  if (Math.abs(x) > HALF - 5 || Math.abs(z) > HALF - 5 || isWater(x, z, .5) || bAt(x, z, .6)) return false;
  if (st.gnd === 0 && Math.hypot(x - st.x, z - st.z) < 2.2*HSPEC.size) return false;
  return true;
}
function exitHeli() {
  if (!st.landed || st.dead || st.dying) { toast(T('exitNeedLanded'), 1600); return; }
  PF.roof = st.roof; PF.y = st.gnd;
  const rx = Math.cos(st.yaw), rz = -Math.sin(st.yaw); let ok = false;
  for (const k of [1, -1]) for (const d of [3.6, 3, 2.6]) { if (ok) break; const x = st.x + rx*d*HSPEC.size*k, z = st.z + rz*d*HSPEC.size*k; if (footOK(x, z)) { PF.x = x; PF.z = z; ok = true; } }
  if (!ok) { toast(T('noRoomExit'), 1600); return; }
  PF.active = true; PF.yaw = st.yaw; PF.camYaw = st.yaw; pilot.visible = true; sfx('click');
  if (st.engine) toast(T('leftEngine'), 3200);
}
function enterHeli() { PF.active = false; pilot.visible = false; footPrompt(''); camYaw = st.yaw; for (const p of people) if (p.userData.follow) p.userData.follow = false; sfx('land'); }
// o que dá para fazer com E perto do piloto
const hangarDoor = () => ({ x: baseB.x, z: baseB.z + baseB.hd + 4 });
function footTarget() {
  const scared = people.find(p => p.visible && p.userData.scared && !p.userData.follow && Math.hypot(p.position.x - PF.x, p.position.z - PF.z) < 4 && Math.abs(p.position.y - PF.y) < 1.5);
  if (scared) return { k: 'follow', o: scared };
  if (Math.hypot(PF.x - st.x, PF.z - st.z) < 5.5*HSPEC.size && Math.abs(PF.y - st.gnd) < 1 && st.landed) return { k: 'heli' };
  if (!PF.roof && dxz(PF, hangarDoor()) < 12) return { k: 'hangar' };
  if (!PF.roof) { let best = null, bd = 3.5; for (const s of peds) { const d = Math.hypot(s.position.x - PF.x, s.position.z - PF.z); if (d < bd) { bd = d; best = s; } } if (best) return { k: 'talk', o: best }; }
  return null;
}
function footAction() {
  if (!PF.active) return exitHeli();
  const t = footTarget(); if (!t) return;
  if (t.k === 'heli') enterHeli();
  else if (t.k === 'follow') { t.o.userData.follow = true; toast('“' + T('followLine') + '”', 2000); sfx('click'); }
  else if (t.k === 'hangar') { if (M) { toast(T('missionsLeft'), 2000); return; } paused = true; renderHangar(); }
  else if (t.k === 'talk') { const u = t.o.userData; u.tx = t.o.position.x; u.tz = t.o.position.z; u.t = 4; toast('“' + pickR(T('talk')) + '”', 2600); sfx('radio', .3); }
}
function footInput() {
  const pad = readPad(), k = (a, b) => (K[a] || K[b]) ? 1 : 0;
  return { mx: clamp(k('KeyD', '') - k('KeyA', '') + tch.lx + pad.lx, -1, 1), mz: clamp(k('KeyW', 'ArrowUp') - k('KeyS', 'ArrowDown') + tch.ly - pad.ly, -1, 1),
    run: K.ShiftLeft || K.ShiftRight || Math.hypot(tch.lx, tch.ly) > .95, cam: (K.ArrowLeft ? 1 : 0) - (K.ArrowRight ? 1 : 0) - tch.rx - pad.rx };
}
function footStep(dt) {
  const f = footInput(); PF.camYaw += f.cam*2.2*dt;
  const fx = -Math.sin(PF.camYaw), fz = -Math.cos(PF.camYaw), rx = Math.cos(PF.camYaw), rz = -Math.sin(PF.camYaw);
  let vx = fx*f.mz + rx*f.mx, vz = fz*f.mz + rz*f.mx; const l = Math.hypot(vx, vz); PF.moving = l > .08;
  if (PF.moving) { vx /= l; vz /= l; const sp = (f.run ? 8 : 4)*Math.min(1, l), nx = PF.x + vx*sp*dt, nz = PF.z + vz*sp*dt;
    if (footOK(nx, PF.z)) PF.x = nx; if (footOK(PF.x, nz)) PF.z = nz;
    let d = Math.atan2(-vx, -vz) - PF.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); PF.yaw += d*Math.min(1, dt*10); PF.walk += dt*sp*1.7; }
  pilot.position.set(PF.x, PF.y, PF.z); pilot.rotation.y = PF.yaw;
  const u = pilot.userData, sw = PF.moving ? Math.sin(PF.walk)*.7 : 0; u.lL.rotation.x = sw; u.lR.rotation.x = -sw; u.aL.rotation.x = -sw*.8; u.aR.rotation.x = sw*.8;
  // quem foi buscado a pé segue o piloto
  for (const p of people) if (p.visible && p.userData.follow) { const dx = PF.x - p.position.x, dz = PF.z - p.position.z, d = Math.hypot(dx, dz);
    p.userData.walking = d > 1.8; if (d > 1.8) { p.position.x += dx/d*Math.min(d - 1.6, 4.5*dt); p.position.z += dz/d*Math.min(d - 1.6, 4.5*dt); p.rotation.set(0, Math.atan2(-dx, -dz), 0); } p.position.y = PF.y; }
  const t = footTarget();
  footPrompt(t ? T({ heli: 'pEnter', follow: 'pFollow', hangar: 'pHangar', talk: 'pTalk' }[t.k]) : '');
}
