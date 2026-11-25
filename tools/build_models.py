#!/usr/bin/env python3
"""Converte modelos Kenney (glb) num pacote compacto para o jogo: models/kenney.bin + kenney.json.
Cada modelo vira uma geometria única (nós já aplicados), com posição float32, normal int8, uv uint16.
uso: python3 tools/build_models.py <pasta-com-os-kits-extraidos>"""
import json, struct, sys, os, numpy as np
from PIL import Image
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(__file__), '..', 'models')
KITS = {
 'car': ('kenney_car-kit', ['sedan','sedan-sports','hatchback-sports','suv','suv-luxury','taxi','van','police','ambulance','firetruck','truck','delivery','garbage-truck']),
 'com': ('kenney_city-kit-commercial_2.1', [f'building-{c}' for c in 'abcdefghijklmn'] + [f'low-detail-building-{c}' for c in 'abcdefghijklmn'] + [f'building-skyscraper-{c}' for c in 'abcde'] + ['detail-awning','detail-parasol-a']),
 'sub': ('kenney_city-kit-suburban_20', [f'building-type-{c}' for c in 'abcdefghijklmnopqrstu'] + ['tree-large','tree-small']),
 'road': ('kenney_city-kit-roads', ['light-curved','light-square-double','traffic-light','construction-cone','dumpster']),
}
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def load(p):
    b = open(p, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); bin_ = b[20 + jl + 8:]
    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; n = NC[a['type']]; dt = CT[a['componentType']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); cnt = a['count']; stride = bv.get('byteStride', 0) or n*np.dtype(dt).itemsize
        raw = np.frombuffer(bin_, dtype=np.uint8, count=stride*(cnt - 1) + n*np.dtype(dt).itemsize, offset=off)
        arr = np.lib.stride_tricks.as_strided(raw.view(dt) if stride == n*np.dtype(dt).itemsize else np.frombuffer(bin_, dt, offset=off), shape=(cnt, n), strides=(stride, np.dtype(dt).itemsize))
        return np.array(arr, dtype=np.float64 if dt == np.float32 else dt)
    P, N, U, I = [], [], [], []
    def mat(nd):
        if 'matrix' in nd: return np.array(nd['matrix']).reshape(4, 4).T
        t = nd.get('translation', [0, 0, 0]); r = nd.get('rotation', [0, 0, 0, 1]); s = nd.get('scale', [1, 1, 1]); x, y, z, w = r
        R = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
        M = np.eye(4); M[:3, :3] = R*np.array(s); M[:3, 3] = t; return M
    def walk(ni, M):
        nd = j['nodes'][ni]; M = M @ mat(nd)
        if 'mesh' in nd:
            for pr in j['meshes'][nd['mesh']]['primitives']:
                at = pr['attributes']; p = acc(at['POSITION']); n = acc(at['NORMAL']); u = acc(at['TEXCOORD_0']) if 'TEXCOORD_0' in at else np.zeros((len(p), 2))
                idx = acc(pr["indices"]).ravel().astype(np.int64) if 'indices' in pr else np.arange(len(p))
                ph = np.c_[p, np.ones(len(p))] @ M.T; nn = n @ np.linalg.inv(M[:3, :3]).T; nn /= np.linalg.norm(nn, axis=1, keepdims=True) + 1e-9
                base = sum(len(x) for x in P); P.append(ph[:, :3]); N.append(nn); U.append(u); I.append(idx + base)
        for c in nd.get('children', []): walk(c, M)
    for r in j['scenes'][j.get('scene', 0)]['nodes']: walk(r, np.eye(4))
    return np.vstack(P), np.vstack(N), np.vstack(U), np.concatenate(I)
meta = {'models': {}, 'tex': {}}; chunks = []; off = 0
def put(a):
    global off
    b = a.tobytes(); pad = (-len(b)) % 4; chunks.append(b + b'\0'*pad); o = off; off += len(b) + pad; return o
for kit, (folder, names) in KITS.items():
    gd = os.path.join(SRC, folder, 'Models', 'GLB format')
    im = Image.open(os.path.join(gd, 'Textures', 'colormap.png')).convert('RGB'); im.save(os.path.join(OUT, f'{kit}.png'))
    a = np.asarray(im).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # janelas (vidro azul-claro) acendem à noite
    win = (b - r > 60) & (g > r) & (b - g > 40) & (kit != 'car')  # vidro azul das janelas (carros não acendem)
    em = np.zeros_like(a); em[win] = [235, 190, 120]; Image.fromarray(em.astype(np.uint8)).save(os.path.join(OUT, f'{kit}-em.png'))
    meta['tex'][kit] = 1
    # paletas alternativas do kit (variation-b, -c): mesmas peças, outras cores
    for vn in 'bc':
        vp = os.path.join(SRC, folder, 'Models', 'Textures', f'variation-{vn}.png')
        if os.path.exists(vp):
            vi = Image.open(vp).convert('RGB'); vi.save(os.path.join(OUT, f'{kit}-{vn}.png')); va = np.asarray(vi).astype(int)
            vr, vg, vb = va[..., 0], va[..., 1], va[..., 2]; vw = (vb - vr > 60) & (vg > vr) & (vb - vg > 40)
            ve = np.zeros_like(va); ve[vw] = [235, 190, 120]; Image.fromarray(ve.astype(np.uint8)).save(os.path.join(OUT, f'{kit}-{vn}-em.png')); meta['tex'][kit].__class__; meta.setdefault('var', {}).setdefault(kit, []).append(vn)
    for nm in names:
        P, N, U, I = load(os.path.join(gd, nm + '.glb'))
        mn, mx = P.min(0), P.max(0)
        rec = {'kit': kit, 'n': len(P), 'ni': len(I), 'min': mn.round(4).tolist(), 'max': mx.round(4).tolist()}
        rec['p'] = put(P.astype(np.float32)); rec['nm'] = put(np.clip(np.round(N*127), -127, 127).astype(np.int8))
        rec['uv'] = put(np.clip(np.round(U*65535), 0, 65535).astype(np.uint16))
        big = len(P) > 65535; rec['i32'] = big; rec['i'] = put(I.astype(np.uint32 if big else np.uint16))
        meta['models'][f'{kit}:{nm}'] = rec
# Quaternius (CC0): OBJ + MTL com cores por material -> cor por vértice
NAT = ('Ultimate_Nature_Pack_by_Quaternius/OBJ', ['PalmTree_1', 'PalmTree_2', 'PalmTree_4', 'CommonTree_3'])
def load_obj(base):
    kd = {}; cur = None
    for ln in open(base + '.mtl'):
        t = ln.split()
        if not t: continue
        if t[0] == 'newmtl': cur = t[1]
        elif t[0] == 'Kd': kd[cur] = [min(1, float(x)**(1/2.2)*1.15) for x in t[1:4]]
    V, VN, out, idx, P, N, C = [], [], {}, [], [], [], []; mat = None
    for ln in open(base + '.obj'):
        t = ln.split()
        if not t: continue
        if t[0] == 'v': V.append([float(x) for x in t[1:4]])
        elif t[0] == 'vn': VN.append([float(x) for x in t[1:4]])
        elif t[0] == 'usemtl': mat = t[1]
        elif t[0] == 'f':
            ids = []
            for w in t[1:]:
                q = w.split('/'); vi = int(q[0]) - 1; ni = int(q[2]) - 1 if len(q) > 2 and q[2] else -1; key = (vi, ni, mat)
                if key not in out: out[key] = len(P); P.append(V[vi]); N.append(VN[ni] if ni >= 0 else [0, 1, 0]); C.append(kd.get(mat, [.5, .5, .5]))
                ids.append(out[key])
            for k in range(1, len(ids) - 1): idx += [ids[0], ids[k], ids[k + 1]]
    return np.array(P), np.array(N), np.array(C), np.array(idx)
for nm in NAT[1]:
    P, N, C, I = load_obj(os.path.join(SRC, NAT[0], nm)); mn, mx = P.min(0), P.max(0)
    rec = {'kit': 'nat', 'n': len(P), 'ni': len(I), 'min': mn.round(4).tolist(), 'max': mx.round(4).tolist(), 'i32': False}
    rec['p'] = put(P.astype(np.float32)); rec['nm'] = put(np.clip(np.round(N*127), -127, 127).astype(np.int8)); rec['c'] = put(np.round(C*255).astype(np.uint8)); rec['i'] = put(I.astype(np.uint16))
    meta['models'][f'nat:{nm}'] = rec
open(os.path.join(OUT, 'kenney.bin'), 'wb').write(b''.join(chunks)); json.dump(meta, open(os.path.join(OUT, 'kenney.json'), 'w'))
print('bin', off, 'models', len(meta['models']))
for k, v in meta['models'].items(): print(k, v['n'], [round(v['max'][i] - v['min'][i], 2) for i in range(3)])
# versão em script (carrega até em file:// e no APK, sem fetch)
import base64
# texturas embutidas como data URI (sem CORS: funcionam em file://, no APK e no itch)
TEXD = {}
for fn in sorted(os.listdir(OUT)):
    if fn.endswith('.png'): TEXD[fn[:-4]] = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(OUT, fn), 'rb').read()).decode(); os.remove(os.path.join(OUT, fn))
pp = os.path.join(os.path.dirname(__file__), '..', 'img', 'peds.png')
if os.path.exists(pp): TEXD['peds'] = 'data:image/png;base64,' + base64.b64encode(open(pp, 'rb').read()).decode()
open(os.path.join(OUT, 'kenney.js'), 'w').write('// gerado por tools/build_models.py — modelos Kenney e Quaternius (CC0)\nconst KENNEY_META = ' + json.dumps(meta) + ';\nconst KENNEY_TEX = ' + json.dumps(TEXD) + ';\nconst KENNEY_B64 = "' + base64.b64encode(b''.join(chunks)).decode() + '";\n')
os.remove(os.path.join(OUT, 'kenney.bin')); os.remove(os.path.join(OUT, 'kenney.json'))
