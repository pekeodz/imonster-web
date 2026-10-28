#!/usr/bin/env python3
"""Convert the original CocosBuilder UI scenes (ccb/ui/*.ccbi, ccb/object/*.ccbi) to compact JSON
for the web UI renderer (js/ui/ccb.js).  usage: python3 uiccb.py <apk/ccb dir> <out dir (data/ccb)>"""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
import ccbi

def img(v):
    # [plist, frame] -> [sheet, frame] ; ['', 'image/ui/x.png'] -> ['', 'ui/x']
    if not v or not v[1]: return None
    if not v[0]: return ['', v[1].replace('image/', '').replace('.png', '').replace('.jpg', '')]
    return [v[0].replace('image/', '').replace('.plist', ''), v[1].replace('.png', '')]

FRAME_PROPS = ('displayFrame', 'spriteFrame', 'backgroundSpriteFrame|1', 'backgroundSpriteFrame|2', 'backgroundSpriteFrame|3', 'backgroundSpriteFrame|4')

def conv(k, v):
    if k in FRAME_PROPS: return img(v)
    if k in ('texture', 'file', 'ccbFile'): return str(v).replace('image/', '').replace('.png', '').replace('ccb/', '').replace('.ccb', '')
    if isinstance(v, float): return round(v, 3)
    if isinstance(v, list): return [round(x, 3) if isinstance(x, float) else x for x in v]
    return v

def node(n):
    o = {'c': n['cls']}
    if n.get('var'): o['n'] = n['var']
    o['p'] = {k: conv(k, v) for k, v in n['props'].items()}
    an = {}
    for sid, props in n['anim'].items():
        pp = {k: [[round(t, 4), conv(k, v), e] for t, v, e in kfs] for k, kfs in props.items()}
        if pp: an[str(sid)] = pp
    if an: o['a'] = an
    if n['kids']: o['k'] = [node(k) for k in n['kids']]
    return o

def main(src, out):
    n = 0
    for sub in ('ui', 'object'):
        os.makedirs(os.path.join(out, sub), exist_ok=True)
        for f in sorted(os.listdir(os.path.join(src, sub))):
            if not f.endswith('.ccbi'): continue
            try:
                d = ccbi.parse(open(os.path.join(src, sub, f), 'rb').read())
            except Exception as e:
                print('skip', sub, f, e); continue
            j = {'seq': {s['name']: [s['id'], round(s['dur'], 4), s['chain']] for s in d['seqs']}, 'auto': d['auto'], 'root': node(d['root'])}
            json.dump(j, open(os.path.join(out, sub, f[:-5] + '.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
            n += 1
    print('converted', n)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
