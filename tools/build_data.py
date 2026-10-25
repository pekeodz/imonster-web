import csv,json,io,os,glob
SRC='/home/claude/src/apk/assets/data'; OUT='/home/claude/imonster-web/data'
os.makedirs(OUT,exist_ok=True)
def read(path,delim=','):
    b=open(path,'rb').read()
    for enc in ('utf-8-sig','gbk','gb18030'):
        try: t=b.decode(enc);break
        except: pass
    return list(csv.reader(io.StringIO(t),delimiter=delim))
def num(v):
    if v=='' : return v
    try:
        if v.strip().lstrip('-').isdigit(): return int(v)
        f=float(v); return f
    except: return v
for f in glob.glob(SRC+'/*.csv'):
    name=os.path.basename(f)[:-4]
    if name=='string':
        rows=read(f,'\t'); hdr=rows[1]
        langs=['zhs','zht','en','jp','kr']
        out={l:{} for l in langs}
        for r in rows[2:]:
            if not r or not r[0]: continue
            for i,l in enumerate(langs):
                v=r[i+1] if i+1<len(r) else ''
                if v: out[l][r[0]]=v
        for l in langs: json.dump(out[l],open(f'{OUT}/strings_{l}.json','w'),ensure_ascii=False,separators=(',',':'))
        continue
    rows=read(f)
    hdr=rows[1]
    recs=[]
    for r in rows[2:]:
        if not any(x.strip() for x in r): continue
        o={}
        for i,h in enumerate(hdr):
            if not h: continue
            v=r[i] if i<len(r) else ''
            if h in o: h=h+'_'+str(i)
            o[h]=num(v)
        if hdr[0]=='' : o['_mark']=r[0]
        recs.append(o)
    json.dump(recs,open(f'{OUT}/{name}.json','w'),ensure_ascii=False,separators=(',',':'))
    print(name,len(recs),hdr[:6])
# fixed maps
mm={}
for f in glob.glob(SRC+'/m-*.json'):
    mm[os.path.basename(f)[2:-5]]=json.load(open(f))
json.dump(mm,open(f'{OUT}/fixedmaps.json','w'),separators=(',',':'))
