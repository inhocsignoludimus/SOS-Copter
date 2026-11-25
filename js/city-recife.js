// city-recife.js — pacote da cidade. Para criar outra cidade, copie este arquivo, troque os dados e carregue-o no lugar deste.
// Coordenadas: x cresce para leste, z cresce para o sul. Os dados abaixo estão num esboço de -800 a 800
// e são ampliados por SCALE no fim do arquivo (mapa final de 4 km: -2000 a 2000 metros).
const CITIES = window.CITIES = window.CITIES || {};
const RECIFE = {
  id: 'recife', name: 'Recife', half: 2000, reef: true, quay: true, desc: { pt: 'A orla de Boa Viagem, os rios Capibaribe e Beberibe, o Marco Zero, Olinda e a linha dos arrecifes.', en: 'Boa Viagem beachfront, the Capibaribe and Beberibe rivers, Marco Zero, Olinda and the reef line.' },
  coast: z => 470 + 18*Math.sin(z/260),       // x do litoral (mar a leste)
  beachFrom: -330,                             // praia a partir deste z (ao norte é cais)
  rivers: [
    { n: { pt: 'rio Capibaribe', en: 'Capibaribe River' }, w: 34, p: [[-800,-300],[-600,-340],[-450,-280],[-300,-380],[-150,-430],[0,-390],[150,-440],[280,-420],[380,-455],[440,-470],[560,-470]] },
    { n: { pt: 'rio Beberibe', en: 'Beberibe River' }, w: 26, p: [[200,-800],[250,-660],[310,-560],[380,-460]] },
    { n: { pt: 'rio Tejipió', en: 'Tejipió River' }, w: 22, p: [[-800,260],[-520,190],[-220,130],[80,40],[260,-120],[330,-200]] },
    { n: null, w: 30, p: [[360,-380],[380,-455]] }],
  lakes: [{ x: 360, z: -260, rx: 70, rz: 130 }],     // Bacia do Pina
  roads: [
    { n: 'Av. Boa Viagem', w: 14, beach: true },
    { n: 'Av. Agamenon Magalhães', w: 12, p: [[170,-800],[110,-560],[80,-330],[130,-120],[230,40],[215,300],[180,580]] },
    { n: 'BR-101', w: 16, p: [[-480,-800],[-470,-300],[-430,200],[-380,800]] },
    { n: 'Av. Caxangá', w: 11, p: [[-800,-470],[-450,-460],[-250,-470],[-120,-470],[100,-480]] },
    { n: 'Av. Domingos Ferreira', w: 11, p: [[-380,450],[0,420],[215,400],[456,400]] },
    { n: 'Av. Sul', w: 10, p: [[-470,-100],[-200,-60],[130,-120]] },
    { n: 'Av. Norte', w: 10, p: [[110,-560],[250,-600],[400,-540]] },
    { n: 'Via Mangue', w: 11, p: [[230,40],[330,-40],[440,-80]] }],
  parks: [{ n: { pt: 'Parque da Jaqueira', en: 'Jaqueira Park' }, x: -200, z: -560, r: 55 }, { n: { pt: 'Parque Dona Lindu', en: 'Dona Lindu Park' }, x: 430, z: 450, r: 22 },
    { n: { pt: 'Parque do Caiara', en: 'Caiara Park' }, x: -330, z: 230, r: 40 }, { n: { pt: 'Praça de Casa Amarela', en: 'Casa Amarela Square' }, x: 60, z: 150, r: 34 }],
  greens: [{ x0: -790, z0: -330, x1: -560, z1: -70 }],
  industrial: { x0: -120, z0: 440, x1: 240, z1: 600 },
  airport: { x0: -10, z0: 610, x1: 310, z1: 800, runway: { x0: 20, z0: 700, x1: 290, z1: 716 } },
  pads: {
    base: { n: { pt: 'Base de Resgate', en: 'Rescue Base' }, x: 180, z: -150, kind: 'base' },
    hosp: { n: { pt: 'Hospital da Restauração', en: 'Restauração Hospital' }, x: 40, z: -330, kind: 'hosp' },
    marco: { n: { pt: 'Marco Zero', en: 'Marco Zero' }, x: 420, z: -520 },
    shop: { n: { pt: 'Shopping em Boa Viagem', en: 'Boa Viagem Mall' }, x: 330, z: 370 },
    aero: { n: { pt: 'Aeroporto dos Guararapes', en: 'Guararapes Airport' }, x: 250, z: 655 },
    jaq: { n: { pt: 'Parque da Jaqueira', en: 'Jaqueira Park' }, x: -200, z: -560 },
    ufpe: { n: { pt: 'Cidade Universitária', en: 'University City' }, x: -640, z: -200 },
    lindu: { n: { pt: 'Parque Dona Lindu', en: 'Dona Lindu Park' }, x: 430, z: 450 },
    olinda: { n: { pt: 'Alto da Sé, Olinda', en: 'Alto da Sé, Olinda' }, x: 400, z: -720 },
    piedade: { n: { pt: 'Praia de Piedade', en: 'Piedade Beach' }, x: 395, z: 745 } },
  fixed: [{ x: 280, z: -510, w: 12, d: 12, h: 140, c: '#ebe7df' }, { x: 298, z: -510, w: 12, d: 12, h: 140, c: '#ebe7df' },
    { rel: 'hosp', dx: 0, dz: -38, w: 44, d: 22, h: 28, c: '#f4f4f0' }, { rel: 'base', dx: 0, dz: -32, w: 30, d: 16, h: 10, c: '#c23a2c', tag: 'base' },
    { rel: 'shop', dx: 0, dz: -55, w: 90, d: 40, h: 14, c: '#d9d6cf' }, { rel: 'aero', dx: -140, dz: -10, w: 120, d: 24, h: 12, c: '#e8e4da' }],
  tutorialDest: 'marco',
  crowdSpots: ['marco', 'jaq', 'lindu'],
  pedSpots: [{ x: 400, z: -495, r: 14, n: 30 }, { x: 330, z: 395, r: 18, n: 10 }, { x: 250, z: 680, r: 16, n: 10 }, { x: -640, z: -175, r: 16, n: 10 }],
  secret: { x: 150, z: 745 },
  menuCam: { x: 260, z: 100 },                  // aeronave escondida no aeroporto
  // tipos de bairro: beach (prédios altos na orla), industrial, downtown, highrise, campus, residential
  zone(x, z) {
    if (z < -640 && x > 300) return 'downtown';        // Olinda (casario colorido)
    if (z > -140 && x > this.coast(z) - 125) return 'beach';
    if (x > -120 && x < 240 && z > 440 && z < 600) return 'industrial';
    if (x > 240 && z < -400) return 'downtown';
    if (x > -150 && x < 260 && z < -150) return 'highrise';
    if (x < -560 && z > -330 && z < -70) return 'campus';
    return 'residential';
  },
  district(x, z) {
    const zn = this.zone(x, z);
    if (z < -640 && x > 300) return 'Olinda'; if (z > 690 && x > 250) return 'Piedade';
    if (zn === 'beach') return 'Boa Viagem'; if (zn === 'industrial') return 'Imbiribeira'; if (zn === 'downtown') return 'Bairro do Recife';
    if (zn === 'highrise') return 'Graças'; if (zn === 'campus') return 'Cidade Universitária';
    if (z < -300) return x < -350 ? 'Várzea' : 'Casa Forte';
    if (z > 250) return x < 0 ? 'Ibura' : 'Imbiribeira';
    return x < -300 ? 'Jardim São Paulo' : 'Afogados';
  },
  // piadas locais que se somam às genéricas
  flavor: {
    pt: { j_taxi: ['Leva bolo de rolo para a viagem.'], j_medico: ['Torceu o pé dançando frevo no meio da rua.'], j_tumulto: ['Acabou o caldinho na barraca mais famosa.'], j_mar: ['Jurou que sabia nadar até passar dos arrecifes.'] },
    en: { j_taxi: ['Bringing bolo de rolo cake for the trip.'], j_medico: ['Sprained an ankle dancing frevo in the street.'], j_tumulto: ['The famous stand ran out of caldinho soup.'], j_mar: ['Swore they could swim until past the reefs.'] } }
};
RECIFE.roads[0].p = []; for (let z = -320; z <= 800; z += 40) RECIFE.roads[0].p.push([RECIFE.coast(z) - 32/2.5, z]);
RECIFE.beaches = [{ sea: [1, 0], p: [] }]; for (let z = RECIFE.beachFrom; z <= 800; z += 20) RECIFE.beaches[0].p.push([RECIFE.coast(z) - 11/2.5, z]);
// ---- ampliação do esboço para o tamanho real do mapa ----
(function scaleCity(C, K) {
  const pt = q => [q[0]*K, q[1]*K], xz = o => { o.x *= K; o.z *= K; }, rc = r => { r.x0 *= K; r.x1 *= K; r.z0 *= K; r.z1 *= K; };
  const c0 = C.coast, z0 = C.zone, d0 = C.district;
  C.coast = z => c0.call(C, z/K)*K;
  C.zone = function (x, z) { return z0.call({ coast: c0 }, x/K, z/K); };
  C.district = function (x, z) { const zn = this.zone(x, z); return d0.call({ coast: c0, zone: () => zn }, x/K, z/K); };
  C.beachFrom *= K;
  for (const r of C.rivers) { r.p = r.p.map(pt); r.w = Math.round(r.w*1.6); }
  for (const r of C.roads) r.p = r.p.map(pt);
  for (const k of C.lakes) { xz(k); k.rx *= K; k.rz *= K; }
  for (const p of C.parks) { xz(p); p.r *= 1.8; }
  C.greens.forEach(rc); rc(C.industrial); rc(C.airport); rc(C.airport.runway); C.airport.runway.z1 = C.airport.runway.z0 + 45;
  for (const k in C.pads) xz(C.pads[k]);
  for (const f of C.fixed) { if (f.rel) { const p = C.pads[f.rel]; f.x = p.x + f.dx; f.z = p.z + f.dz; } else xz(f); }
  for (const s of C.pedSpots) { xz(s); s.r *= 1.5; }
  xz(C.secret); xz(C.menuCam);
  for (const b of C.beaches) b.p = b.p.map(pt);
})(RECIFE, RECIFE.half/800);
CITIES.recife = RECIFE;
