#!/usr/bin/env python3
"""Minimal CocosBuilder .ccbi (v5) reader -> JSON node tree with sequences."""
import struct, sys, json

class R:
    def __init__(s, b):
        s.b = b; s.p = 0; s.bit = 0
    def byte(s):
        v = s.b[s.p]; s.p += 1; return v
    def getbit(s):
        v = (s.b[s.p] >> s.bit) & 1
        s.bit += 1
        if s.bit >= 8: s.bit = 0; s.p += 1
        return v
    def align(s):
        if s.bit: s.bit = 0; s.p += 1
    def int(s, signed=False):
        n = 0
        while not s.getbit(): n += 1
        cur = 0
        for a in range(n - 1, -1, -1):
            if s.getbit(): cur |= 1 << a
        cur |= 1 << n
        s.align()
        if signed:
            return cur // 2 if cur % 2 else -(cur // 2)
        return cur - 1
    def float(s):
        t = s.byte()
        if t == 0: return 0.0
        if t == 1: return 1.0
        if t == 2: return -1.0
        if t == 3: return 0.5
        if t == 4: return float(s.int(True))
        v = struct.unpack('<f', s.b[s.p:s.p + 4])[0]; s.p += 4; return v
    def utf(s):
        n = (s.byte() << 8) | s.byte()
        v = s.b[s.p:s.p + n].decode('utf8', 'replace'); s.p += n; return v

def parse(data):
    r = R(data)
    assert data[:4] == b'ibcc', data[:4]
    r.p = 4
    ver = r.int()
    js = r.byte() if ver >= 5 else 0
    strs = [r.utf() for _ in range(r.int())]
    cs = lambda: strs[r.int()]
    seqs = []
    for _ in range(r.int()):
        dur = r.float(); name = cs(); sid = r.int(); chain = r.int(True)
        for _ in range(r.int()): r.float(); r.int(); cs()
        for _ in range(r.int()): r.float(); cs(); r.float(); r.float(); r.float()
        seqs.append({'name': name, 'id': sid, 'dur': dur, 'chain': chain})
    auto = r.int(True)

    def kf_value(t):
        if t == 9: return bool(r.byte())
        if t == 12: return r.byte()
        if t == 13: return [r.byte(), r.byte(), r.byte()]
        if t in (5, 7): return r.float()
        if t in (4, 0, 27, 2, 3): return [r.float(), r.float()]
        if t == 10: return [cs(), cs()]
        raise Exception('kf type %d' % t)

    def node():
        cls = cs()
        if js: cs()
        mt = r.int()
        var = cs() if mt else ''
        anim = {}
        for _ in range(r.int()):
            sid = r.int(); props = {}
            for _ in range(r.int()):
                pname = cs(); ptype = r.int(); kfs = []
                for _ in range(r.int()):
                    t = r.float(); ease = r.int(); eo = None
                    if 2 <= ease <= 7: eo = r.float()
                    kfs.append([t, kf_value(ptype), ease])
                props[pname] = kfs
            anim[sid] = props
        nreg = r.int(); nex = r.int(); props = {}
        for i in range(nreg + nex):
            t = r.int(); name = cs(); r.byte()
            if t == 0: v = [r.float(), r.float(), r.int()]
            elif t in (2, 3, 27): v = [r.float(), r.float()]
            elif t == 1: v = [r.float(), r.float(), r.int()]
            elif t == 4: v = [r.float(), r.float(), r.int()]
            elif t in (5, 7): v = r.float()
            elif t == 26: v = [r.float(), r.int()]
            elif t in (6, 20): v = r.int(True)
            elif t == 8: v = [r.float(), r.float()]
            elif t == 9: v = bool(r.byte())
            elif t == 10: v = [cs(), cs()]
            elif t == 22: v = [cs(), cs()]
            elif t in (11, 17, 19, 24, 18, 23): v = cs()
            elif t == 12: v = r.byte()
            elif t == 13: v = [r.byte(), r.byte(), r.byte()]
            elif t == 14: v = [r.float() for _ in range(8)]
            elif t == 15: v = [bool(r.byte()), bool(r.byte())]
            elif t == 16: v = [r.int(), r.int()]
            elif t == 21: v = [cs(), r.int()]
            elif t == 25: v = [cs(), r.int(), r.int()]
            else: raise Exception('prop type %d %s at %d' % (t, name, r.p))
            props[name] = v
        kids = [node() for _ in range(r.int())]
        return {'cls': cls, 'var': var, 'props': props, 'anim': anim, 'kids': kids}
    root = node()
    return {'ver': ver, 'seqs': seqs, 'auto': auto, 'root': root}

if __name__ == '__main__':
    d = parse(open(sys.argv[1], 'rb').read())
    print(json.dumps(d, indent=1)[:int(sys.argv[2]) if len(sys.argv) > 2 else 6000])
