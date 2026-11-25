// missions.js — carreira, economia, rádio da central e os nove tipos de missão
const newCareer = () => ({ ver: 3, money: 300, rep: 0, rank: 0, owned: ['schwaiter'], heli: 'schwaiter', gear: { schwaiter: ['megafone'] }, done: 0, failed: 0, earned: 0, tutorial: true });
let G = newCareer(), M = null, offer = null, offerT = 0, nextOffer = 3, chatT = 50, megaCd = 0, gasCd = 0;
const RANKS = [0, 150, 500, 1200, 2500];
const rankIdx = () => { let i = 0; RANKS.forEach((r, j) => { if (G.rep >= r) i = j; }); return i; };
const rankName = i => T('rankNames')[i];
const dxz = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const eqName = id => L(eqById(id).n);
const joke = k => pickR(T(k).concat((CITY.flavor[LANG] || {})[k] || []));
const payMul = () => 1 + rankIdx()*.1;

/* ---------- Tipos de missão ---------- */
// req: equipamento exigido (lista = qualquer um deles). seats: precisa de lugares. r: patente mínima. w: peso no sorteio
const MT = {
  taxi: { seats: true, r: 0, w: 3 }, transito: { req: ['megafone'], r: 0, w: 2.5 }, medico: { req: ['maca'], seats: true, r: 0, w: 2.5 },
  incendio: { req: ['balde', 'canhao'], r: 0, w: 2 }, mar: { req: ['guincho'], seats: true, r: 0, w: 1.5 }, telhado: { seats: true, r: 0, w: 1.5 },
  perseguicao: { r: 1, w: 1.5 }, tumulto: { req: ['megafone'], r: 1, w: 1.2 }, enchente: { seats: true, r: 1, w: 1 } };
const mtName = t => T('mt_' + t);
function missingFor(type, n) {
  const m = MT[type];
  if (m.req && !m.req.some(hasEq)) return m.req.length > 1 ? T('bucketOrCannon') : eqName(m.req[0]);
  if (m.seats && HSPEC.seats < (n || 1)) return T('seatsTag');
  return null;
}
// as chamadas aparecem perto de onde o helicóptero está (cidade grande, tanque pequeno)
const NEAR = 1100;
function nearHeli(list, xz = o => o, max = NEAR) { const ok = list.filter(o => { const p = xz(o); return p && Math.hypot(p.x - st.x, p.z - st.z) < max; }); return ok.length ? ok : list; }
function groundNear() { for (let i = 0; i < 40; i++) { const q = randGround(); if (Math.hypot(q.x - st.x, q.z - st.z) < NEAR) return q; } return randGround(); }
const BUILD = {
  taxi() { const n = 1 + Math.floor(Math.random()*3); let from;
    if (Math.random() < .5) { const k = pickR(nearHeli(Object.keys(pads).filter(k => k !== 'base'), k => pads[k])); from = { x: pads[k].x, z: pads[k].z, name: padName(pads[k]) }; } else { const q = groundNear(); from = { ...q, name: bairro(q.x, q.z) }; }
    let to, guard = 0; do { const k = pickR(Object.keys(pads)); to = { x: pads[k].x, z: pads[k].z, name: padName(pads[k]) }; } while ((dxz(from, to) < 350 || dxz(from, to) > 1400) && ++guard < 40);
    return { n, from, to, rep: 5, repFail: 5, call: T(n > 1 ? 'c_taxiN' : 'c_taxi1', { n, a: from.name, b: to.name, j: joke('j_taxi') }) }; },
  medico() { const q = groundNear(), n = 1 + (Math.random() < .3 ? 1 : 0), from = { ...q, name: bairro(q.x, q.z) }, to = { x: pads.hosp.x, z: pads.hosp.z, name: padName(pads.hosp) };
    return { n, from, to, rep: 10, repFail: 10, call: T('c_medico', { n, a: from.name, j: joke('j_medico') }) }; },
  mar() { let q; for (let i = 0; i < 30; i++) { q = beachAt(45 + Math.random()*120); if (isWater(q.x, q.z, 8) && Math.abs(q.z) < HALF - 150) break; } const from = { x: q.x, z: q.z, name: '' };
    return { n: 1, from, to: { x: pads.hosp.x, z: pads.hosp.z, name: padName(pads.hosp) }, rep: 10, repFail: 10, call: T('c_mar', { j: joke('j_mar') }) }; },
  telhado() { let tall = B.filter(b => !b.fix && !b.burnt && b.h >= 40); if (!tall.length) tall = B.filter(b => !b.fix && !b.burnt).sort((a, b) => b.h - a.h).slice(0, 12); const c = nearHeli(tall); const b = pickR(c), k = 2 + Math.floor(Math.random()*4);
    return { b, k, left: k, saved: 0, lost: 0, from: { x: b.x, z: b.z, y: b.h, name: bairro(b.x, b.z) }, rep: 10, repFail: 10, call: T('c_telhado', { n: k, a: bairro(b.x, b.z) }) }; },
  incendio() { const c = nearHeli(B.filter(b => !b.fix && !b.burnt && b.h >= 12 && b.h <= 90)); const b = pickR(c);
    return { b, from: { x: b.x, z: b.z, y: b.h, name: bairro(b.x, b.z) }, rep: 10, repFail: 6, saved: 0, lost: 0, call: T('c_incendio', { a: bairro(b.x, b.z), j: joke('j_incendio') }) }; },
  transito() { const ri = Math.floor(Math.random()*roads.length), r = roads[ri], s = 60 + Math.random()*(r.len - 120), p = roadAt(r, s);
    return { ri, s, calls: 0, from: { x: p.x, z: p.z, name: r.n }, rep: 5, repFail: 6, call: T('c_transito', { a: r.n, j: joke('j_transito') }) }; },
  perseguicao() { return { from: { x: 0, z: 0, name: '' }, rep: 30, repFail: 6, lock: 0, lose: 0, arrive: 0, call: T('c_perseguicao', { j: joke('j_perseguicao'), n: dayF < .5 ? T('c_perseguicaoNight') : '' }) }; },
  tumulto() { const sp = pickR(CITY.crowdSpots.map(k => pads[k]).filter(Boolean).concat(parks)), x = sp.x + 8, z = sp.z + 8;
    return { from: { x, z, name: L(sp.n) }, rep: 0, repFail: 6, disp: 0, k: 26, call: T('c_tumulto', { a: L(sp.n), j: joke('j_tumulto') }) }; },
  enchente() { let lows = B.filter(b => !b.fix && !b.burnt && b.h <= 16 && zone(b.x, b.z) === 'residential'); if (!lows.length) lows = B.filter(b => !b.fix && !b.burnt && b.h <= 24);
    const named = rivers.filter(r => r.n), near = lows.filter(b => named.some(r => dPoly(b.x, b.z, r.p) < 70)); const c = pickR(near.length ? near : lows);
    const riv = named.slice().sort((a, b) => dPoly(c.x, c.z, a.p) - dPoly(c.x, c.z, b.p))[0];
    const houses = lows.filter(b => Math.hypot(b.x - c.x, b.z - c.z) < 70).sort(() => Math.random() - .5).slice(0, 4); let tot = 0;
    const list = houses.map(b => { const n = Math.min(1 + Math.floor(Math.random()*2), 8 - tot); tot += n; return { b, n }; }).filter(h => h.n > 0);
    return { cx: c.x, cz: c.z, houses: list, k: tot, saved: 0, lost: 0, from: { x: c.x, z: c.z, name: bairro(c.x, c.z) }, rep: 12, repFail: 10,
      call: T('c_enchente', { a: bairro(c.x, c.z), r: riv ? L(riv.n) : (LANG === 'pt' ? 'o temporal' : 'the storm'), n: tot, j: joke('j_enchente') }) }; } };

/* ---------- Pagamentos ---------- */
function earn(v, quiet) { v = Math.round(v*payMul()*(M ? M.payMul : 1)); G.money += v; G.earned += v; if (M) M.earned = (M.earned || 0) + v; if (!quiet) toast(T('earnToast', { p: fmt(v) }), 1200); sfx('cash'); return v; }
function finish(base, rep) {
  const pay = base > 0 ? earn(base, true) : 0, total = (M.earned || 0);
  G.rep += Math.max(0, Math.round(rep*(M.payMul < 1 ? .5 : 1))) - (M.repPen || 0); G.rep = Math.max(0, G.rep); G.done++; if (typeof storyCount === 'function') storyCount();
  toast(T('winToast', { p: fmt(total) }), 3200); radio(T('payRadio', { l: pickR(T('win')), p: fmt(total) }), 'win'); sfx('win');
  endMission(); checkRank(); save(); return pay;
}
function failMission(msg, repLoss) {
  if (!M) return; G.rep = Math.max(0, G.rep - (repLoss != null ? repLoss : M.repFail || 6) - (M.repPen || 0)); G.failed++;
  toast(T('failToast', { m: msg }), 3400); radio(msg.charAt(0).toUpperCase() + msg.slice(1) + ' ' + pickR(T('fail')), 'alerta'); endMission(); save();
}

/* ---------- Central: ofertas ---------- */
function genOffer() {
  const rk = rankIdx(); let type;
  if (G.tutorial) type = 'taxi';
  else { const allow = CITY.story && !G.free ? storyTypes(CITY.story.level) : null; const list = Object.keys(MT).filter(t => (allow ? allow.includes(t) : rk >= MT[t].r)).map(t => [t, MT[t].w*(missingFor(t) ? .4 : 1)]);
    const tot = list.reduce((a, b) => a + b[1], 0); let r = Math.random()*tot; type = list[0][0]; for (const [t, w] of list) { if ((r -= w) <= 0) { type = t; break; } } }
  const o = BUILD[type](); o.type = type; o.title = mtName(type);
  if (G.tutorial) { const d = pads[CITY.tutorialDest]; o.n = 1; o.from = { x: pads.base.x + 10, z: pads.base.z + 4, name: padName(pads.base) }; o.to = { x: d.x, z: d.z, name: padName(d) }; o.call = T('c_tutorial', { b: padName(d) }); }
  o.missing = missingFor(type, o.n);
  offer = o; offerT = 32; radio((LANG === 'pt' ? 'Central: ' : 'Dispatch: ') + o.call, 'chamada');
  if (o.missing) radioLog[0].text += T('missingTag', { x: o.missing });
}
function acceptOffer() {
  if (!offer || M || st.dead) return;
  if (offer.missing) { toast(T('needMissing', { x: offer.missing }), 3000); return; }
  M = offer; offer = null; M.stage = 0; M.hold = 0; M.prog = 0; M.payMul = 1; M.earned = 0; M.repPen = 0; G.tutorial = false;
  const sp = HSPEC.vmax*.55;
  if (M.type === 'taxi' || M.type === 'medico') { M.t = Math.round((dxz(st, M.from) + dxz(M.from, M.to))/sp + (M.type === 'taxi' ? 60 : 40)); showPeople(M.n, M.from.x, 0, M.from.z, M.type === 'medico'); }
  if (M.type === 'mar') { M.t = Math.round(dxz(st, M.from)/sp + dxz(M.from, M.to)/sp + 70); swimmer.position.set(M.from.x, 0, M.from.z); swimmer.visible = true; }
  if (M.type === 'telhado') { M.t = 300; showPeople(Math.min(M.k, people.length), M.b.x, M.b.h, M.b.z, false); if (M.k >= 3 && Math.random() < .7) people[M.k - 1].userData.scared = true; }
  if (M.type === 'incendio') { M.t = null; igniteBuilding(M.b, 70); }
  if (M.type === 'transito') { M.t = Math.round(dxz(st, M.from)/sp + 50); makeJam(M.ri, M.s); M.late = 0; }
  if (M.type === 'perseguicao') { M.t = 200; startSuspect(); placePoliceFar(); }
  if (M.type === 'tumulto') { M.t = Math.round(dxz(st, M.from)/sp + 80); startCrowd(M.from.x, M.from.z); M.late = 0; }
  if (M.type === 'enchente') { M.t = 330; startFlood(M.cx, M.cz, 95); const L2 = []; for (const h of M.houses) for (let i = 0; i < h.n; i++) L2.push({ x: h.b.x + (i ? 2.5 : -2.5), y: h.b.h, z: h.b.z, tag: h }); placePeople(L2, 'wave'); M.tg = M.from; }
  if (M.type === 'telhado') M.tg = M.from;
  setMarker(M.from); radio(T('accepted'), 'info');
}
function declineOffer() { if (!offer) return; offer = null; nextOffer = 8; radio(T('declined'), 'info'); }

/* ---------- Apoio terrestre (tecla V): facilita, mas paga menos ---------- */
function callSupport() {
  if (!M) { toast(T('supNone'), 1800); return; } if (M.support) { toast(T('supAlready'), 1500); return; }
  const t = M.type;
  if (t === 'perseguicao' && M.stage === 0) { M.support = 1; M.payMul = .5; radio(T('supPolice'), 'info'); }
  else if (t === 'medico' && M.stage === 0) { M.support = 1; M.payMul = .5; M.ambT = 10; radio(T('supAmb'), 'info'); }
  else if (t === 'incendio') { M.support = 1; M.payMul = .6; for (const f of fires) f.int *= .5; radio(T('supFire'), 'info'); }
  else if (t === 'tumulto') { M.support = 1; M.payMul = .5; M.supT = 0; radio(T('supPolice'), 'info'); }
  else if (t === 'transito') { M.support = 1; M.payMul = .5; M.supT = 12; radio(T('supTraffic'), 'info'); }
  else { toast(T('supNone'), 1800); return; }
  sfx('radio');
}

/* ---------- Andamento ---------- */
function landNear(p, dt, r = 20, need = 1.5) {
  if (st.landed && dxz(st, p) < r) { M.hold += dt; M.prog = M.hold/need; if (M.hold >= need) { M.hold = 0; M.prog = 0; return true; } } else { M.hold = 0; M.prog = 0; }
  return false;
}
function hovering(p, r, maxAgl, minY = 0) { return !st.landed && dxz(st, p) < r && st.y - minY < maxAgl && st.y > minY && Math.hypot(st.vx, st.vz) < 6.5; }
// guincho: subir rápido ou alto demais derruba o passageiro
function winchFell(minY) { const hs = Math.hypot(st.vx, st.vz); if (M.hold > .5 && (hs > 9.5 || st.y - minY > 30)) { G.money = Math.max(0, G.money - 100); G.rep = Math.max(0, G.rep - 10); toast(T('fell', { p: fmt(100) }), 3000); radio(T('fellRadio'), 'alerta'); sfx('alarm'); M.hold = 0; M.prog = 0; return true; } return false; }
function winchAt(y0) { const len = st.y - y0; winch.scale.y = Math.max(.1, len); winch.position.set(st.x, y0 + len/2, st.z); }
const UPD = {
  taxi(dt) { if (M.stage === 0) { const done = landNear(M.from, dt, 20, 2.2); boardAnim(M.prog); if (done) { st.pax += M.n; M.stage = 1; hidePeople(); setMarker(M.to); earn(10*M.n); radio(T('paxOn', { b: M.to.name }), 'info'); } }
    else if (landNear(M.to, dt)) { st.pax = Math.max(0, st.pax - M.n); earn(20*M.n, true); finish(100*M.n, M.rep); } },
  medico(dt) {
    if (M.ambT != null && M.stage === 0) { M.ambT -= dt; M.prog = 1 - M.ambT/10; if (M.ambT <= 0) { hidePeople(); radio(T('supAmbDone'), 'info'); return finish(200*M.n + 40*M.n, M.rep); } return; }
    if (M.stage === 0) { const done = landNear(M.from, dt, 20, 2.4); boardAnim(M.prog); if (done) { st.pax += M.n; M.stage = 1; hidePeople(); setMarker(M.to); earn(10*M.n); radio(T('victimOn'), 'info'); } }
    else if (landNear(M.to, dt)) { st.pax = Math.max(0, st.pax - M.n); earn(30*M.n, true); finish(200*M.n, M.rep); } },
  mar(dt) {
    if (M.stage === 0) { const ok = hovering(M.from, 10, 22); if (!ok && winch.visible && winchFell(0)) { winch.visible = false; swimmer.visible = false; return failMission(T('personLost'), 0); }
      M.hold = ok ? M.hold + dt : Math.max(0, M.hold - dt*2); M.prog = M.hold/2.5; winch.visible = ok && M.hold > 0;
      if (ok) { winchAt(0); swimmer.position.y = st.y*M.prog*.85; }
      if (M.hold >= 2.5) { M.stage = 1; M.hold = 0; st.pax += 1; swimmer.visible = winch.visible = false; setMarker(M.to); earn(10); radio(T('swimmerUp'), 'info'); } }
    else if (landNear(M.to, dt)) { st.pax = Math.max(0, st.pax - 1); finish(200, M.rep); } },
  telhado(dt) {
    const b = M.b, onRoof = st.landed && st.roof === b, winchOk = hasEq('guincho') && hovering({ x: b.x, z: b.z }, 9, 24, b.h);
    if (!onRoof && !winchOk && winch.visible && winchFell(b.h)) { winch.visible = false; M.left--; M.lost++; hidePeople(1); }
    const calm = people.find(p => p.visible && !p.userData.scared);
    for (const p of people) if (p.visible && p.userData.follow && onRoof && seatsFree() > 0 && Math.hypot(p.position.x - st.x, p.position.z - st.z) < 6*HSPEC.size) { p.visible = false; p.userData.follow = false; M.left--; st.pax++; earn(10); toast(T('scaredBoard')); }
    M.onlyScared = M.left > 0 && !calm;
    if (calm && M.left > 0 && seatsFree() > 0 && (onRoof || winchOk)) { M.hold += dt; M.prog = M.hold/1.2; winch.visible = winchOk && !onRoof; boardAnim(M.prog, calm); if (winch.visible) winchAt(b.h);
      if (M.hold >= 1.2) { M.hold = 0; M.left--; st.pax++; calm.visible = false; earn(10); toast(T('boardOne', { f: seatsFree() })); } }
    else { M.hold = 0; M.prog = 0; winch.visible = false; boardAnim(0); }
    const deliver = st.pax > 0 && (M.left === 0 || seatsFree() === 0);
    M.tg = deliver ? { x: pads.hosp.x, z: pads.hosp.z } : M.from; setMarker(M.tg); M.stage = deliver ? 1 : 0;
    if (st.pax > 0) for (const p of [pads.hosp, pads.base]) if (st.landed && dxz(st, p) < 20) { M.saved += st.pax; toast(T('saveOk', { n: st.pax })); st.pax = 0; }
    if (M.saved + M.lost >= M.k) { if (M.saved) finish(200, M.rep); else failMission(T('personLost')); } },
  enchente(dt) {
    let boarding = false;
    if (seatsFree() > 0) for (const h of M.houses) { if (h.n <= 0) continue; const onRoof = st.landed && st.roof === h.b, wOk = hasEq('guincho') && hovering({ x: h.b.x, z: h.b.z }, 9, 24, h.b.h);
      if (!(onRoof || wOk)) continue; boarding = true; M.hold += dt; M.prog = M.hold/1.2; const p = people.find(p => p.visible && p.userData.tag === h); if (p) boardAnim(M.prog, p);
      winch.visible = wOk && !onRoof; if (winch.visible) winchAt(h.b.h); M.wy = h.b.h; M.wh = h;
      if (M.hold >= 1.2) { M.hold = 0; h.n--; st.pax++; if (p) p.visible = false; earn(10); toast(T('boardOne', { f: seatsFree() })); } break; }
    if (!boarding) { if (winch.visible && M.wh && winchFell(M.wy)) { M.wh.n--; M.lost++; const p = people.find(p => p.visible && p.userData.tag === M.wh); if (p) p.visible = false; } M.hold = 0; M.prog = 0; winch.visible = false; boardAnim(0); }
    if (st.pax > 0 && st.landed) for (const p of padArr) if (dxz(st, p) < 20 && Math.hypot(p.x - M.cx, p.z - M.cz) > 100) { M.saved += st.pax; toast(T('saveOk', { n: st.pax })); st.pax = 0; }
    const left = M.houses.filter(h => h.n > 0), deliver = st.pax > 0 && (!left.length || seatsFree() === 0);
    if (deliver) M.tg = padArr.filter(p => Math.hypot(p.x - M.cx, p.z - M.cz) > 100).sort((a, b) => dxz(st, a) - dxz(st, b))[0];
    else if (left.length) { const h = left.slice().sort((a, b) => dxz(st, a.b) - dxz(st, b.b))[0]; M.tg = { x: h.b.x, z: h.b.z, y: h.b.h }; }
    M.stage = deliver ? 1 : 0; setMarker(M.tg);
    if (M.saved + M.lost >= M.k) { if (M.saved) finish(200, M.rep); else failMission(T('personLost')); } },
  incendio(dt) {
    const rk = rankIdx(), cap = bucketCap(), cannon = hasEq('canhao');
    const fillOk = cannon ? (!st.landed && st.agl < 7 && st.overWater) : (bucket.visible && bucketPos.y < 2.5 && isWater(bucketPos.x, bucketPos.z));
    if (st.water < cap && fillOk && Math.hypot(st.vx, st.vz) < 10) { st.water = Math.min(cap, st.water + cap/2*dt); if (st.water >= cap) toast(T(cannon ? 'tankFull' : 'bucketFull')); }
    if (M.dropT > 0) { M.dropT -= dt; const n = Math.ceil(dt*70), fx = -Math.sin(st.yaw), fz = -Math.cos(st.yaw);
      for (let i = 0; i < n && st.water > 0; i++) { const d = drops.find(d => !d.visible); if (!d) break;
        if (cannon) spawnDrop(st.x + fx*4, st.y + .5, st.z + fz*4, st.vx + fx*30, st.vz + fz*30); else spawnDrop(bucketPos.x, bucketPos.y - .8, bucketPos.z, st.vx, st.vz);
        d.userData.water = cap/400*2.4*(cannon ? 1.3 : 1); st.water = Math.max(0, st.water - cap/40); } }
    for (const f of [...fires]) { f.int += dt*(1 + rk*.15)*(M.support ? .5 : 1);
      if (f.int > 115 && !f.spread && fires.length < 3) { f.spread = true; const nb = B.filter(o => o !== f.b && !o.fix && !o.burnt && o.h >= 8 && Math.hypot(o.x - f.b.x, o.z - f.b.z) < 40).sort((a, c) => Math.hypot(a.x - f.b.x, a.z - f.b.z) - Math.hypot(c.x - f.b.x, c.z - f.b.z))[0];
        if (nb && igniteBuilding(nb, 45)) { radio(T('fireSpread'), 'alerta'); M.repPen += 2; } }
      if (f.int >= 170) { removeFire(f, true); M.lost++; G.rep = Math.max(0, G.rep - 20); radio(T('fireLost'), 'alerta'); }
      else if (f.int <= 0) { removeFire(f, false); M.saved++; const v = earn(50, true); toast(T('fireOut', { p: fmt(v) })); sfx('win'); } }
    M.prog = fires.length ? Math.max(...fires.map(f => f.int))/170 : 0;
    if (fires.length) { const f = fires.reduce((a, c) => c.int > a.int ? c : a); setMarker({ x: f.b.x, z: f.b.z, y: f.b.h }); }
    if (!fires.length) { if (M.saved > 0) { radio(T('fireDone'), 'info'); finish(150, M.rep); } else failMission(T('allBurnt')); } },
  transito(dt) {
    M.late += dt; if (M.late > 60) { M.repPen += dt/10; }
    if (M.supT != null) { M.supT -= dt; M.prog = 1 - M.supT/12; if (M.supT <= 0) { clearJam(); radio(T('reportOk', { a: M.from.name }), 'info'); return finish(100, M.rep); } return; }
    M.prog = M.calls/2; if (M.calls >= 2) { clearJam(); radio(T('reportOk', { a: M.from.name }), 'info'); finish(100, M.rep); } },
  perseguicao(dt) { updSuspect(dt, M.stage === 0); M.from.x = sus.x; M.from.z = sus.z; setMarker(M.from);
    const need = M.support ? 12 : 25;
    if (M.stage === 0) { const d = dxz(st, sus), needSpot = dayF < .5, ok = d < 45 && st.agl < 140 && !st.landed && (!needSpot || st.spotOn);
      if (ok) M.lock += dt; else if (d > 170) { M.lose += dt; M.repPen += dt; } else M.lose = Math.max(0, M.lose - dt);
      M.prog = M.lock/need; if (M.lose > 15) return failMission(T('escaped'));
      if (M.lock >= need) { M.stage = 1; radio(T('policeComing'), 'info'); } }
    else { M.arrive += dt; sus.v = Math.max(0, sus.v - 8*dt); M.prog = 1; if (M.arrive > 5) finish(500, M.rep); }
    updPolice(dt, M.stage === 1 || !!M.support); },
  tumulto(dt) {
    M.late += dt; if (M.late > 10) { M.late = 0; M.repPen += 2; }
    if (M.support) { M.supT += dt; if (M.supT > 2) { M.supT = 0; dispNow(1); } }
    M.prog = M.disp/M.k; if (crowdLeft() === 0 && M.disp > 0) { radio(T('crowdGone'), 'info'); finish(0, 0); } } };
function dispNow(n) { const k = disperseCrowd(n); if (!k) return; M.disp += k; G.rep += k; const v = earn(10*k, true); toast(T('dispersed', { n: k, p: fmt(v) }), 1400); }

/* ---------- Ações do jogador ---------- */
function dropWater() {
  if (!(hasEq('balde') || hasEq('canhao'))) { toast(T('noGear', { x: T('bucketOrCannon') }), 1500); return; }
  if (!M || M.type !== 'incendio') return;
  if (st.water <= 0) { toast(T('bucketEmpty'), 2000); return; }
  M.dropT = .6; sfx('splash');
}
function megaphone() {
  if (!hasEq('megafone')) { toast(T('noGear', { x: eqName('megafone') }), 1500); return; }
  if (megaCd > 0) return; megaCd = 1.3; toast('“' + pickR(T('mega')) + '”', 2200); sfx('horn');
  if (speederMegaphone()) return;
  if (!M) return;
  if (M.type === 'tumulto' && dxz(st, M.from) < 40 && st.agl < 55) dispNow(3);
  if (M.type === 'transito' && !M.support && dxz(st, M.from) < 45 && st.agl < 90 && !st.landed) M.calls++;
}
function throwGas() {
  if (!hasEq('gas')) { toast(T('noGear', { x: eqName('gas') }), 1500); return; }
  if (gasCd > 0) return; gasCd = 4; toast(T('gasOut'), 1200); sfx('splash', .5);
  for (let i = 0; i < 10; i++) puff(st.x + (Math.random() - .5)*16, Math.max(1, st.y - 12 - Math.random()*8), st.z + (Math.random() - .5)*16, 2.5, '#b7c48a');
  if (M && M.type === 'tumulto' && dxz(st, M.from) < 45 && st.agl < 60) dispNow(9);
}
function toggleSpot() { if (!hasEq('holofote')) { toast(T('noGear', { x: eqName('holofote') }), 1500); return; } st.spotOn = !st.spotOn; toast(T(st.spotOn ? 'spotOn' : 'spotOff'), 900); sfx('click'); }
function endMission() {
  hidePeople(); swimmer.visible = winch.visible = false; clearJam(); suspect.visible = false; if (!EV) police.forEach(p => p.visible = false); sus.v = 20;
  hideCrowd(); hideFlood(); clearFires(); setMarker(null); if (st) { st.pax = 0; st.water = 0; } M = null; nextOffer = 7*(hasEq('radar') ? .6 : 1);
}
function checkRank() { const r = rankIdx(); if (r > G.rank) { G.rank = r; radio(T('promotedRadio', { r: rankName(r) }), 'win'); toast(T('promoted', { r: rankName(r) }), 4000); } }
function updDispatch(dt) {
  megaCd = Math.max(0, megaCd - dt); gasCd = Math.max(0, gasCd - dt);
  chatT -= dt; if (chatT <= 0) { chatT = 45 + Math.random()*40; if (!offer) radio(pickR(T('chat')), 'info'); }
  if (G.free) return;
  updSpeeder(dt);
  if (st.dead) return;
  if (M) { if (M.t != null) { M.t -= dt; if (M.t <= 0) { if (M.type === 'tumulto' && M.disp > 0) return finish(0, 0); return failMission(M.type === 'medico' && M.stage === 0 ? T('victimDied') : T('timeUp')); } } UPD[M.type](dt); return; }
  if (offer) { offerT -= dt; if (offerT <= 0) { radio(T('expired'), 'info'); offer = null; nextOffer = 6; } return; }
  if (EV) return;
  nextOffer -= dt*(hasEq('radar') ? 1.6 : 1); if (nextOffer <= 0) genOffer();
}
function missionText() {
  if (!M) return offer ? (offer.missing ? T('t_offerMissing', { x: offer.missing }) : T('t_offer')) : T('t_idle');
  const t = M.type, w = hasEq('guincho') ? T('t_winchOpt') : '';
  if (t === 'taxi') return M.stage ? T('t_taxi1', { b: M.to.name }) : T('t_taxi0', { a: M.from.name });
  if (t === 'medico') return M.stage ? T('t_medico1', { b: M.to.name }) : T('t_medico0', { a: M.from.name });
  if (t === 'mar') return M.stage ? T('t_mar1', { b: M.to.name }) : T('t_mar0');
  if (t === 'telhado' && M.onlyScared && !M.stage) return T('t_scared');
  if (t === 'telhado') return M.stage ? T('t_telhado1', { s: M.saved, k: M.k }) : T('t_telhado0', { w, l: M.left, f: seatsFree() });
  if (t === 'incendio') return st.water > 0 ? T('t_incendio1', { s: M.saved }) : T('t_incendio0');
  if (t === 'transito') return T('t_transito', { c: M.calls });
  if (t === 'perseguicao') return M.stage ? T('t_perseguicao1') : T('t_perseguicao0', { n: dayF < .5 ? T('t_perseguicao0n') : '' });
  if (t === 'tumulto') return T('t_tumulto', { d: M.disp, k: M.k });
  if (t === 'enchente') return M.stage ? T('t_enchente1', { s: M.saved, k: M.k }) : T('t_enchente0', { w, l: M.k - M.saved - M.lost - st.pax, f: seatsFree() });
  return '';
}
function missionTarget() { if (M && M.tg) return M.tg; return M ? (M.stage && M.to ? M.to : M.from) : (EV && hasEq('radar') ? EV : null); }

/* ---------- Salvar e carregar ---------- */
const SAVE_KEY = CITY.story ? 'airRescue.story.v1' : 'airRescue.' + CITY.id + '.v3'; // no modo história, um save só para todas as cidades
function freeCareer() { const g = newCareer(); g.free = true; g.tutorial = false; g.money = 9999999; g.owned = HELIS.map(h => h.id); g.heli = 'jetrider';
  for (const h of HELIS) g.gear[h.id] = EQUIP.filter(e => !eqFits(e, h)).map(e => e.id); return g; }
function save() { if (G.free) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) {} }
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.ver === 3 && s.owned) return Object.assign(newCareer(), s); } catch (e) {} return null; }
function exportCode() { return btoa(unescape(encodeURIComponent(JSON.stringify(G)))); }
function importCode(c) { const s = JSON.parse(decodeURIComponent(escape(atob(c.trim())))); if (!s || s.ver !== 3 || !s.owned) throw new Error('bad'); G = Object.assign(newCareer(), s); save(); }
