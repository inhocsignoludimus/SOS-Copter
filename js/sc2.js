// sc2.js — leitor de cidades do SimCity 2000 (.sc2), conforme a especificação aberta do projeto OpenCity2k (CC BY-SA)
// Devolve grades 128×128: altitude, água, terreno, construção (XBLD) e zona (XZON).
function sc2Parse(buf) {
  const u = new Uint8Array(buf), dv = new DataView(buf), tag = o => String.fromCharCode(u[o], u[o+1], u[o+2], u[o+3]);
  if (tag(0) !== 'FORM' || tag(8) !== 'SCDH') throw new Error('não é um arquivo .sc2');
  const ch = {}; let o = 12;
  while (o + 8 <= u.length) { const id = tag(o), n = dv.getUint32(o + 4); ch[id] = u.subarray(o + 8, o + 8 + n); o += 8 + n; }
  const raw = ['CNAM', 'ALTM'];
  const unrle = d => { const out = []; let i = 0; while (i < d.length) { const b = d[i++]; if (b < 128) { for (let k = 0; k < b; k++) out.push(d[i++]); } else { const v = d[i++]; for (let k = 0; k < b - 127; k++) out.push(v); } } return Uint8Array.from(out); };
  const get = id => ch[id] ? (raw.includes(id) ? ch[id] : unrle(ch[id])) : null;
  const N = 128, alt = new Uint8Array(N*N), wlv = new Uint8Array(N*N), A = get('ALTM');
  if (A) for (let i = 0; i < N*N; i++) { const v = (A[i*2] << 8) | A[i*2 + 1]; alt[i] = (v >> 11) & 31; wlv[i] = (v >> 6) & 31; }
  const name = ch.CNAM ? String.fromCharCode(...ch.CNAM.subarray(1, 1 + ch.CNAM[0])).replace(/\0.*$/, '').trim() : '';
  // XBIT: a especificação numera os bits a partir do mais alto — o bit "5" (água) é a máscara 0x04
  const xb = get('XBIT'), wat = new Uint8Array(N*N); for (let i = 0; i < N*N; i++) wat[i] = xb ? (xb[i] & 4 ? 1 : 0) : (wlv[i] > alt[i] ? 1 : 0);
  return { N, name, alt, wlv, wat, xbit: xb, ter: get('XTER'), bld: get('XBLD'), zon: get('XZON'), und: get('XUND') };
}
