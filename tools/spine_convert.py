import json,glob,os,sys
FORCE=True
def conv_curves(o):
    if isinstance(o,dict):
        c=o.get('curve')
        if isinstance(c,list) and len(c)==4:
            o['curve'],o['c2'],o['c3'],o['c4']=c
        for v in o.values(): conv_curves(v)
    elif isinstance(o,list):
        for v in o: conv_curves(v)
def convert(d):
    ver=d['skeleton'].get('spine','3.3')
    if ver.startswith('3.8') and not FORCE: return d
    d['skeleton']['spine']='3.8.99'
    for b in d.get('bones',[]):
        ir=b.pop('inheritRotation',True); isc=b.pop('inheritScale',True)
        if 'transform' not in b:
            if not ir and not isc: b['transform']='onlyTranslation'
            elif not ir: b['transform']='noRotationOrReflection'
            elif not isc: b['transform']='noScale'
    for t in d.get('transform',[]):
        if 'bone' in t and 'bones' not in t: t['bones']=[t.pop('bone')]
    o=0
    for key in ('ik','transform','path'):
        for c in d.get(key,[]) or []:
            c['order']=o; o+=1
    sk=d.get('skins')
    if isinstance(sk,dict):
        d['skins']=[{'name':k,'attachments':v} for k,v in sk.items()]
    for s in d['skins']:
        for slot in s['attachments'].values():
            for a in slot.values():
                if a.get('type')=='linkedmesh' and 'ffd' in a: a['deform']=a.pop('ffd')
    for a in d.get('animations',{}).values():
        if 'paths' in a: a['path']=a.pop('paths')
        if 'ffd' in a: a['deform']=a.pop('ffd')
    conv_curves(d.get('animations',{}))
    return d
if __name__=='__main__':
    n=0
    for f in sys.argv[1:]:
        d=json.load(open(f))
        if 'skeleton' not in d: continue
        json.dump(convert(d),open(f,'w'),separators=(',',':')); n+=1
    print('converted',n)
