import sys,os,glob,shutil
sys.path.insert(0,'/home/claude/tools');import pvr2png
from concurrent.futures import ProcessPoolExecutor
OUT='/home/claude/raw'
def job(a):
    src,dst=a
    os.makedirs(os.path.dirname(dst),exist_ok=True)
    try:
        if src.endswith('.png'):
            pvr2png.load(src).save(dst,optimize=False)
        else: shutil.copy(src,dst)
        return None
    except Exception as e: return (src,str(e))
jobs=[]
for root,base in [('obb','/home/claude/src/obb'),('apk','/home/claude/src/apk/assets')]:
    for f in glob.glob(base+'/**/*',recursive=True):
        if os.path.isfile(f):
            jobs.append((f,OUT+'/'+root+f[len(base):]))
with ProcessPoolExecutor(8) as ex:
    errs=[r for r in ex.map(job,jobs,chunksize=50) if r]
print(len(jobs),'errors',len(errs),errs[:5])
