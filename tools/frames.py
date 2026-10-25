import plistlib,glob,re,json,os
out={}
for f in glob.glob('/home/claude/raw/obb/image/**/*.plist',recursive=True):
    rel=f.split('/obb/image/')[1][:-6]  # e.g. map/tile-1
    p=plistlib.load(open(f,'rb'))
    tex=p['metadata'].get('textureFileName') or p['metadata'].get('realTextureFileName')
    page=os.path.dirname(rel)+'/'+os.path.splitext(tex)[0]
    fr={}
    for k,v in p['frames'].items():
        n=lambda s:list(map(lambda x:int(round(float(x))),re.findall(r'-?[\d.]+',s)))
        x,y,w,h=n(v['frame']); sc=n(v['sourceColorRect']); ss=n(v['sourceSize'])
        fr[k[:-4] if k.endswith('.png') else k]=[x,y,w,h,sc[0],sc[1],ss[0],ss[1],1 if v.get('rotated') else 0]
    out[rel]={'page':page,'frames':fr}
json.dump(out,open('/home/claude/imonster-web/data/frames.json','w'),separators=(',',':'))
print(len(out), sum(len(v['frames']) for v in out.values()))
print({k:v['page'] for k,v in out.items() if 'tile' in k})
