import struct, zlib, sys
def make_stream(k):
    enclen=1024; key=[0]*enclen; rounds=6; s=0; z=key[enclen-1]
    M=0xffffffff
    for _ in range(rounds):
        s=(s+0x9e3779b9)&M; e=(s>>2)&3
        for p in range(enclen-1):
            y=key[p+1]
            mx=((((z>>5)^(y<<2)&M)+((y>>3)^(z<<4)&M))&M) ^ (((s^y)+(k[(p&3)^e]^z))&M)
            key[p]=(key[p]+mx)&M; z=key[p]
        p=enclen-1; y=key[0]
        mx=((((z>>5)^(y<<2)&M)+((y>>3)^(z<<4)&M))&M) ^ (((s^y)+(k[(p&3)^e]^z))&M)
        key[p]=(key[p]+mx)&M; z=key[p]
    return key
_cache={}
def decrypt(buf,k):
    k=tuple(k)
    if k not in _cache: _cache[k]=make_stream(k)
    st=_cache[k]
    n=(len(buf)-12)//4
    d=list(struct.unpack_from('<%dI'%n,buf,12))
    b=0;i=0
    while i<n and i<512:
        d[i]^=st[b]; b=(b+1)%1024; i+=1
    while i<n:
        d[i]^=st[b]; b=(b+1)%1024; i+=64
    out=buf[:12]+struct.pack('<%dI'%n,*d)+buf[12+4*n:]
    ln=struct.unpack('>I',out[12:16])[0]
    return zlib.decompress(out[16:]), ln
