#!/usr/bin/env python3
"""Convert the tower ornament .ccbi files (CocosBuilder) referenced by ornament.csv into data/orna.json.
usage: python3 ornaments.py <apk/ccb/tower dir> <data dir>"""
import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))
import ccbi

def sheet(p):  # 'image/map/object-1.plist' -> 'map/object-1'
    return p.replace('image/', '').replace('.plist', '')

def conv_val(name, v):
    if name == 'displayFrame':
        if not v[1]: return None
        if not v[0]: return ['', v[1].replace('image/', '').replace('.png', '')]  # single image (no sprite sheet)
        return [sheet(v[0]), v[1].replace('.png', '')]
    return v

KEEP = {'position', 'anchorPoint', 'scale', 'rotation', 'visible', 'opacity', 'color', 'displayFrame', 'blendFunc'}
PKEEP = {'emissionRate', 'duration', 'totalParticles', 'life', 'startSize', 'endSize', 'startSpin', 'endSpin', 'angle',
         'startColor', 'endColor', 'gravity', 'speed', 'tangentialAccel', 'radialAccel', 'texture', 'posVar', 'emitterMode', 'blendFunc'}

def node(n):
    out = {'c': n['cls']}
    keep = KEEP | (PKEEP if n['cls'] == 'MyParticle' else set())
    p = {}
    for k, v in n['props'].items():
        if k not in keep: continue
        if k in ('position', 'scale'): v = v[:2]
        if k == 'texture': v = v.replace('image/', '').replace('.png', '')
        p[k] = conv_val(k, v)
    out['p'] = p
    an = {}
    for sid, props in n['anim'].items():
        pp = {}
        for k, kfs in props.items():
            if k not in KEEP: continue
            pp[k] = [[round(t, 4), conv_val(k, v), e] for t, v, e in kfs]
        if pp: an[str(sid)] = pp
    if an: out['a'] = an
    kids = [node(k) for k in n['kids'] if k['cls'] not in ('CollisionNode', 'Spine', 'CCBFile')]
    if kids: out['k'] = kids
    return out

def main(src, data):
    rows = json.load(open(os.path.join(data, 'ornament.json')))
    names = sorted(set(x for r in rows for x in str(r['Name']).split('/')))
    out = {}
    for n in names:
        d = ccbi.parse(open(os.path.join(src, n + '.ccbi'), 'rb').read())
        out[n] = {'seq': {s['name']: [s['id'], round(s['dur'], 4), s['chain']] for s in d['seqs']}, 'root': node(d['root'])}
    json.dump(out, open(os.path.join(data, 'orna.json'), 'w'), separators=(',', ':'))
    print(len(out), os.path.getsize(os.path.join(data, 'orna.json')))
    # per-tileset background (bg-N) and lighting layer (masker-N)
    fx = {}
    for f in sorted(os.listdir(src)):
        if (f.startswith('bg-') or f.startswith('masker-')) and f.endswith('.ccbi'):
            d = ccbi.parse(open(os.path.join(src, f), 'rb').read())
            fx[f[:-5]] = {'seq': {s['name']: [s['id'], round(s['dur'], 4), s['chain']] for s in d['seqs']}, 'root': node(d['root'])}
    json.dump(fx, open(os.path.join(data, 'towerfx.json'), 'w'), separators=(',', ':'))
    print('towerfx', len(fx), os.path.getsize(os.path.join(data, 'towerfx.json')))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
