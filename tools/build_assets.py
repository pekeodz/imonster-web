import os,glob,shutil,subprocess,json,sys
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
RAW='/home/claude/raw'; OUT='/home/claude/imonster-web/assets'
MAP=[('obb/image','img'),('apk/avatar','avatar')]
def img(a):
    src,dst=a
    if os.path.exists(dst): return
    os.makedirs(os.path.dirname(dst),exist_ok=True)
    try:
        im=Image.open(src)
        if im.mode not in('RGBA','RGB'): im=im.convert('RGBA')
        im.save(dst,'WEBP',quality=90,method=4)
    except Exception as e: print('ERR',src,e)
def run():
    jobs=[];other=[]
    for s,d in MAP:
        for f in glob.glob(f'{RAW}/{s}/**/*',recursive=True):
            if not os.path.isfile(f): continue
            rel=f[len(RAW)+len(s)+2:]
            if f.endswith('.png') or f.endswith('.jpg'):
                jobs.append((f,f'{OUT}/{d}/'+os.path.splitext(rel)[0]+'.webp'))
            else: other.append((f,f'{OUT}/{d}/{rel}'))
    with ProcessPoolExecutor(2) as ex: list(ex.map(img,jobs,chunksize=64))
    for s,d in other:
        os.makedirs(os.path.dirname(d),exist_ok=True)
        if s.endswith('.atlas'):
            t=open(s,encoding='utf-8',errors='replace').read().replace('.png\n','.webp\n').replace('.jpg\n','.webp\n')
            open(d,'w').write(t)
        elif s.endswith('.plist'):
            t=open(s,'rb').read().replace(b'.png</string>\n\t\t\t<key>textureFileName',b'.webp</string>\n\t\t\t<key>textureFileName')
            open(d,'wb').write(t)
        else: shutil.copy(s,d)
    print('images',len(jobs),'other',len(other))
if __name__=='__main__': run()
