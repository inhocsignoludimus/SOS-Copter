// city-miami.js — pacote da cidade de Miami (estilizada; geografia real, tudo o mais é nosso).
// Coordenadas em metros, mapa de -2000 a 2000. x cresce para leste, z para o sul (norte = z negativo).
// A orla do continente fica na Baía de Biscayne; Miami Beach e Key Biscayne são ilhas com praia para o Atlântico.
(window.CITIES = window.CITIES || {}).miami = {
  id: 'miami', name: 'Miami', half: 2000, desc: { pt: 'Baía de Biscayne, South Beach art déco, os arranha-céus de Brickell, pontes sobre o mar e Key Biscayne.', en: 'Biscayne Bay, art deco South Beach, the Brickell skyline, causeways over the water and Key Biscayne.' },
  coast: z => 640 + 20*Math.sin(z/300),        // margem oeste da baía (continente)
  bayColor: '#3fb3c9', deepX: z => 1730,          // baía turquesa; oceano mais escuro a leste das ilhas
  islands: [
    { n: 'Miami Beach', zone: 'beach', p: [[1300,-2000],[1656,-2000],[1656,-400],[1300,-400]] },
    { n: 'South Beach', zone: 'artdeco', p: [[1300,-400],[1656,-400],[1656,290],[1560,330],[1300,300]] },
    { n: 'Key Biscayne', zone: 'beach', p: [[1250,850],[1640,820],[1706,1000],[1706,1650],[1560,1720],[1380,1500],[1250,1050]] },
    { n: 'Dodge Island', zone: 'industrial', p: [[790,110],[1170,120],[1170,270],[790,255]] },
    { n: 'Watson Island', zone: 'campus', p: [[810,20],[960,25],[960,140],[810,135]] },
    { n: 'Fisher Island', zone: 'artdeco', p: [[1340,420],[1500,420],[1500,530],[1340,530]] },
    { n: 'Virginia Key', zone: 'campus', p: [[900,650],[1150,620],[1180,760],[930,800]] },
    { n: 'Venetian Islands', zone: 'residential', p: [[820,-292],[885,-292],[885,-228],[820,-228]] },
    { n: 'Venetian Islands', zone: 'residential', p: [[950,-292],[1015,-292],[1015,-228],[950,-228]] },
    { n: 'Venetian Islands', zone: 'residential', p: [[1080,-292],[1145,-292],[1145,-228],[1080,-228]] }],
  beaches: [{ sea: [1, 0], p: [[1645,-2000],[1645,280]] }, { sea: [1, 0], p: [[1695,1000],[1695,1640]] }],
  rivers: [
    { n: { pt: 'rio Miami', en: 'Miami River' }, w: 40, p: [[-2000,-320],[-1300,-260],[-800,-150],[-300,-90],[150,-50],[450,-10],[660,15]] },
    { n: { pt: 'Little River', en: 'Little River' }, w: 26, p: [[-2000,-1350],[-700,-1300],[100,-1380],[650,-1330]] },
    { n: { pt: 'canal de Coral Gables', en: 'Coral Gables Waterway' }, w: 20, p: [[-700,1500],[-200,1450],[300,1500],[645,1480]] }],
  lakes: [{ x: -1500, z: -1350, rx: 120, rz: 80 }],
  roads: [
    { n: 'I-95', w: 18, p: [[200,-2000],[150,-1000],[120,-200],[80,300],[-60,900],[-260,1500],[-420,2000]] },
    { n: 'Biscayne Blvd', w: 14, p: [] },
    { n: 'Collins Ave', w: 14, p: [[1470,-2000],[1470,280]] },
    { n: 'Ocean Drive', w: 10, p: [[1610,-380],[1610,270]] },
    { n: 'Calle Ocho', w: 12, p: [[-2000,250],[-900,240],[0,245],[480,215]] },
    { n: 'Dolphin Expressway', w: 16, p: [[120,-130],[-500,-170],[-1050,-200],[-1990,-210]] },
    { n: 'US-1', w: 14, p: [[420,320],[100,700],[-300,1200],[-700,1700],[-950,2000]] },
    { n: 'MacArthur Causeway', w: 14, p: [[630,30],[810,120],[960,125],[1310,180]] },
    { n: 'Venetian Causeway', w: 9, p: [[645,-260],[1305,-260]] },
    { n: 'Julia Tuttle Causeway', w: 14, p: [[650,-950],[1305,-950]] },
    { n: 'Rickenbacker Causeway', w: 12, p: [[640,760],[920,700],[1180,760],[1270,900]] },
    { n: 'Port Blvd', w: 10, p: [[600,150],[790,190]] },
    { n: 'Crandon Blvd', w: 10, p: [[1270,900],[1450,1100],[1500,1600]] }],
  parks: [{ n: { pt: 'Bayfront Park', en: 'Bayfront Park' }, x: 520, z: -110, r: 45 }, { n: { pt: 'Lummus Park', en: 'Lummus Park' }, x: 1585, z: -100, r: 30 },
    { n: { pt: 'Crandon Park', en: 'Crandon Park' }, x: 1480, z: 1200, r: 90 }, { n: { pt: 'Peacock Park', en: 'Peacock Park' }, x: 520, z: 1150, r: 45 },
    { n: { pt: 'Domino Park', en: 'Domino Park' }, x: -250, z: 300, r: 20 }, { n: { pt: 'Tropical Park', en: 'Tropical Park' }, x: -700, z: 800, r: 70 }],
  greens: [{ x0: -900, z0: 1050, x1: -350, z1: 1550 }],
  industrial: { x0: -2000, z0: -1100, x1: -1000, z1: -100 },
  airport: { x0: -1750, z0: -750, x1: -1050, z1: -300, runway: { x0: -1700, z0: -600, x1: -1100, z1: -555 } },
  pads: {
    base: { n: { pt: 'Base de Resgate', en: 'Rescue Base' }, x: -150, z: -450, kind: 'base' },
    hosp: { n: { pt: 'Hospital Geral de Biscayne', en: 'Biscayne General Hospital' }, x: -500, z: -330, kind: 'hosp' },
    bayfront: { n: { pt: 'Bayfront Park', en: 'Bayfront Park' }, x: 480, z: -200 },
    southbeach: { n: { pt: 'South Beach', en: 'South Beach' }, x: 1540, z: 50 },
    watson: { n: { pt: 'Heliponto de Watson Island', en: 'Watson Island Heliport' }, x: 880, z: 55 },
    port: { n: { pt: 'Porto de cruzeiros', en: 'Cruise Port' }, x: 1110, z: 190 },
    wynwood: { n: { pt: 'Wynwood', en: 'Wynwood' }, x: 50, z: -800 },
    havana: { n: { pt: 'Little Havana', en: 'Little Havana' }, x: -300, z: 330 },
    grove: { n: { pt: 'Coconut Grove', en: 'Coconut Grove' }, x: 380, z: 1050 },
    keybiscayne: { n: { pt: 'Key Biscayne', en: 'Key Biscayne' }, x: 1450, z: 1250 },
    aero: { n: { pt: 'Aeroporto de Miami', en: 'Miami Airport' }, x: -1350, z: -420 },
    gables: { n: { pt: 'Coral Gables', en: 'Coral Gables' }, x: -620, z: 1300 } },
  fixed: [{ rel: 'base', dx: 0, dz: -32, w: 30, d: 16, h: 10, c: '#c23a2c', tag: 'base' }, { rel: 'hosp', dx: 0, dz: -40, w: 46, d: 24, h: 42, c: '#f4f4f0' },
    { rel: 'aero', dx: -170, dz: 20, w: 150, d: 28, h: 14, c: '#e8e4da' },
    { x: 980, z: 118, w: 170, d: 26, h: 32, c: '#f7f7f4', tag: 'ship' }, { x: 980, z: 262, w: 170, d: 26, h: 32, c: '#f7f7f4', tag: 'ship' }],
  tutorialDest: 'southbeach',
  crowdSpots: ['southbeach', 'bayfront', 'havana'],
  pedSpots: [{ x: 1600, z: -50, r: 30, n: 45 }, { x: 500, z: -130, r: 25, n: 20 }, { x: -280, z: 300, r: 20, n: 15 }, { x: 60, z: -780, r: 20, n: 15 }, { x: 1460, z: 1150, r: 40, n: 15 }],
  secret: { x: -1180, z: -380 },
  menuCam: { x: 1250, z: -60 },
  zone(x, z) {
    const is = onIsland(x, z); if (is) return is.zone || 'residential';
    if (x > 300 && x < 700 && z > -400 && z < 180) return 'cbd';
    if (x > 150 && x < 700 && z > -1100 && z <= -400) return 'highrise';
    if (x > -100 && x <= 150 && z > -1100 && z < -550) return 'downtown';
    if (x > -900 && x < 300 && z >= 180 && z < 520) return 'downtown';
    if (x < -1000 && z < -100 && z > -1100) return 'industrial';
    if (x > -900 && x < -350 && z > 1050 && z < 1550) return 'campus';
    return 'residential';
  },
  district(x, z) {
    const is = onIsland(x, z); if (is) return is.n;
    if (x > 300 && z > -400 && z < 180) return z < -150 ? 'Downtown' : 'Brickell';
    if (x > 150 && z > -1100 && z <= -400) return z < -700 ? 'Midtown' : 'Edgewater';
    if (x > -100 && x <= 150 && z > -1100 && z < -550) return 'Wynwood';
    if (x > -900 && x < 300 && z >= 180 && z < 520) return 'Little Havana';
    if (x < -1000 && z < -100) return 'Doral';
    if (z < -1300) return 'Little Haiti';
    if (z > 700) return x > 0 ? 'Coconut Grove' : 'Coral Gables';
    return 'Allapattah';
  },
  flavor: {
    pt: { j_taxi: ['Turista de camisa florida e meia com sandália.', 'Quer chegar antes do pôr do sol para a selfie.'], j_medico: ['Insolação depois de seis horas de praia sem protetor.', 'Caiu dos patins na beira-mar.'],
      j_tumulto: ['Briga pela última mesa no café cubano.', 'Discussão sobre qual praia é a melhor.'], j_mar: ['Foi atrás de uma boia de flamingo.', 'Tentou nadar até o navio de cruzeiro.'], j_incendio: ['O churrasco no iate saiu do controle.'] },
    en: { j_taxi: ['Tourist in a floral shirt and socks with sandals.', 'Wants to arrive before sunset for the selfie.'], j_medico: ['Sunstroke after six hours at the beach without sunscreen.', 'Fell off roller skates on the boardwalk.'],
      j_tumulto: ['A fight over the last table at the Cuban café.', 'An argument about which beach is best.'], j_mar: ['Went after a flamingo pool float.', 'Tried to swim to the cruise ship.'], j_incendio: ['The yacht barbecue got out of hand.'] } }
};
{ const M = CITIES.miami; for (let z = -2000; z <= 900; z += 50) M.roads[1].p.push([M.coast(z) - 75, z]); }
