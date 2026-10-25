import struct, sys, os
sys.path.insert(0,'/home/claude/tools')
import ccz
from PIL import Image
KEY=[0x426e5e6f,0x3d7e2b0b,0xbdde0b8c,0x4e3aa900]
def unpremul(arr):
    import numpy as np
    a=arr[...,3:4].astype(np.float32)
    rgb=arr[...,:3].astype(np.float32)
    out=np.where(a>0, np.clip(rgb*255.0/np.maximum(a,1),0,255), 0)
    return np.concatenate([out,arr[...,3:4]],-1).astype(np.uint16)
def load(path):
    buf=open(path,'rb').read()
    if buf[:4]==b'\x89PNG': return Image.open(path).convert('RGBA')
    if buf[:4]==b'CCZp': d,_=ccz.decrypt(buf,KEY)
    elif buf[:4]==b'CCZ!':
        import zlib; d=zlib.decompress(buf[16:])
    else: d=buf
    if d[:4]==b'\x89PNG':
        import io; return Image.open(io.BytesIO(d)).convert('RGBA')
    hl,h,w,mm,flags,dl,bpp=struct.unpack_from('<7I',d,0)
    if hl==52:
        fmt=flags&0xff; px=d[52:52+dl]
        if fmt==0x12:
            import numpy as np
            arr=np.frombuffer(px[:w*h*4],dtype=np.uint8).reshape(h,w,4).astype(np.uint16)
            im=Image.fromarray(unpremul(arr).astype(np.uint8),'RGBA')
        elif fmt==0x1a: im=Image.frombytes('RGBA',(w,h),px[:w*h*4],'raw','BGRA')
        elif fmt==0x10:
            import numpy as np
            v=np.frombuffer(px[:w*h*2],dtype='<u2').reshape(h,w)
            arr=np.stack([(v>>12)&15,(v>>8)&15,(v>>4)&15,v&15],-1).astype(np.uint16)*17
            arr=unpremul(arr)
            im=Image.fromarray(arr.astype(np.uint8),'RGBA')
        elif fmt==0x13: im=Image.frombytes('RGB',(w,h),px[:w*h*2],'raw','BGR;16').convert('RGBA')
        elif fmt==0x11: im=Image.frombytes('RGBA',(w,h),px[:w*h*2],'raw','RGBA;15') 
        elif fmt==0x15: im=Image.frombytes('RGB',(w,h),px[:w*h*3]).convert('RGBA')
        elif fmt==0x1b: a=Image.frombytes('L',(w,h),px[:w*h]); im=Image.new('RGBA',(w,h),(255,255,255,0)); im.putalpha(a)
        elif fmt==0x17: im=Image.frombytes('LA',(w,h),px[:w*h*2]).convert('RGBA')
        else: raise Exception('fmt %x'%fmt)
        return im
    raise Exception('unknown header %r'%d[:8])
if __name__=='__main__':
    for p in sys.argv[1:]:
        try:
            im=load(p); print(p,im.size)
        except Exception as e: print('ERR',p,e)
