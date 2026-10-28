"""Vanguard Tech Center - original design, ONE connected building on the ground (footprint 64 x 64: +-32, front = -y).
A glazed two-storey research podium with an entrance atrium; a stepped research tower rising out of it to ~46 with
glass curtain-wall bands, team-coloured corner fins and a rotating radar array on top ('spin'); a glass-domed lab;
a rotating satellite dish ('dish'); solar panels, roof plant and a sky-bridge.
Faction finishes are swapped in-game by material name.  Run: python3 tech_vanguard.py [--preview]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

reset()
K = Kit()


def chamf(w, d, c):
    """chamfered rectangle outline (8 points)"""
    x, y = w / 2, d / 2
    return [(x, y - c), (x - c, y), (-x + c, y), (-x, y - c), (-x, -y + c), (-x + c, -y), (x - c, -y), (x, -y + c)]


def rrect(w, d, r, n=5):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for i in range(n + 1):
            a = R(a0 + 90 * i / n); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def block(pts, z0, h, mat, bev, ox=0, oy=0, grp='body'):
    b = K.bm(grp, mat, bev, False)
    lo = [b.verts.new((x + ox, y + oy, z0)) for x, y in pts]; hi = [b.verts.new((x + ox, y + oy, z0 + h)) for x, y in pts]
    fs = [b.faces.new(lo[::-1]), b.faces.new(hi)]
    for i in range(len(pts)):
        j = (i + 1) % len(pts); fs.append(b.faces.new((lo[i], lo[j], hi[j], hi[i])))
    bmesh.ops.recalc_face_normals(b, faces=fs)


def mullions(pts, ox, oy, z0, h, step, out=.25):
    """vertical glazing bars along every edge of an outline"""
    n = len(pts)
    for i in range(n):
        (ax, ay), (bx, by) = pts[i], pts[(i + 1) % n]
        L = math.hypot(bx - ax, by - ay); k = max(1, round(L / step))
        nx, ny = (by - ay) / L, -(bx - ax) / L
        for j in range(1, k):
            f = j / k; x, y = ax + (bx - ax) * f + nx * out, ay + (by - ay) * f + ny * out
            K.box((.3, .3, h), (x + ox, y + oy, z0 + h / 2), (0, 0, math.atan2(by - ay, bx - ax)), 'steel', 0)


# ================= podium (two storeys, glazed ground floor) =================
PW, PD, PZ, PCY = 56.0, 46.0, 10.0, 3.0
pod = rrect(PW, PD, 5)
block(pod, 0, 1.0, 'gun', .1, 0, PCY)                                           # base course
block(rrect(PW - .8, PD - .8, 4.6), 1.0, 3.6, 'win', 0, 0, PCY)                 # ground-floor glazing (inset)
mullions(rrect(PW - .8, PD - .8, 4.6), 0, PCY, 1.0, 3.6, 3.2, .08)
block(pod, 4.6, PZ - 4.6, 'WALL', .3, 0, PCY)                                   # upper storey
block(rrect(PW + .4, PD + .4, 5.2), 6.4, 1.8, 'win', 0, 0, PCY)                 # ribbon window
mullions(rrect(PW + .4, PD + .4, 5.2), 0, PCY, 6.4, 1.8, 2.6, .05)
block(rrect(PW + .6, PD + .6, 5.3), PZ - 1.4, 1.4, 'TEAM', .15, 0, PCY)         # team fascia
block(rrect(PW + 1.0, PD + 1.0, 5.5), PZ - .1, .6, 'gun', .12, 0, PCY)          # parapet
for x in (-PW / 2 + 6, -PW / 2 + 16, PW / 2 - 16, PW / 2 - 6):                  # pilasters on the front and back
    for y in (PCY - PD / 2 - .2, PCY + PD / 2 + .2):
        K.box((1.4, 1.0, PZ - 1.4), (x, y, (PZ - 1.4) / 2), mat='WALL', bev=.12)

# entrance atrium on the front: glass box under a team canopy, steps
AY0 = PCY - PD / 2
K.box((18.0, 6.0, 8.6), (-2.0, AY0 - 2.6, 4.3), mat='win', bev=0)
for x in [-10.8 + i * 2.2 for i in range(9)]:
    K.box((.3, .3, 8.6), (x, AY0 - 5.65, 4.3), mat='steel', bev=0)
for z in (3.0, 6.0):
    K.box((18.2, .3, .3), (-2.0, AY0 - 5.65, z), mat='steel', bev=0)
for x in (-11.2, 7.2):
    K.box((.9, 6.4, 8.8), (x, AY0 - 2.6, 4.4), mat='WALL', bev=.1)
K.box((22.0, 9.0, .8), (-2.0, AY0 - 4.0, 9.0), mat='TEAM', bev=.2)
K.box((22.4, 9.4, .3), (-2.0, AY0 - 4.0, 9.55), mat='gun', bev=.05)
for x in (-12.0, 8.0):
    K.cyl(.4, .4, 8.6, (x, AY0 - 8.0, 4.3), mat='steel', segs=10, bev=0)
K.box((6.0, .3, 4.6), (-2.0, AY0 - 5.7, 2.3), mat='door', bev=0)
for i in range(3):
    K.box((14.0, 1.4, .3), (-2.0, AY0 - 6.4 - i * 1.2, .15 + (2 - i) * .3), mat='concrete', bev=.05)
for x in (-6.0, 2.0):
    K.box((1.6, .4, .5), (x, AY0 - 8.3, 8.4), mat='lamp', bev=0)

# ================= research tower (stepped, glass bands, corner fins) =================
TX, TY = -7.0, 8.0
stages = [(20.0, 4.2, PZ, 26.0), (16.4, 3.4, 26.0, 37.0), (12.6, 2.6, 37.0, 45.0)]
for k, (w, c, z0, z1) in enumerate(stages):
    pts = chamf(w, w, c)
    h = z1 - z0
    block(pts, z0, h, 'TOWER', .25, TX, TY)
    # glass curtain bands, each slightly proud of the wall, with mullions
    nb = int(h // 4)
    for b in range(nb):
        zb = z0 + 1.6 + b * (h - 2.4) / nb
        g = chamf(w + .3, w + .3, c + .12)
        block(g, zb, 1.9, 'win', 0, TX, TY)
        mullions(g, TX, TY, zb, 1.9, 2.0, .04)
    block(chamf(w + .8, w + .8, c + .33), z1 - 1.2, 1.2, 'TEAM', .12, TX, TY)       # team cornice
    block(chamf(w + 1.2, w + 1.2, c + .5), z1 - .05, .5, 'gun', .1, TX, TY)        # roof edge
    # team corner fins
    for (px, py) in chamf(w, w, c)[::2]:
        a = math.atan2(py, px)
        K.box((.7, 2.2, h - 1.6), (TX + px + math.cos(a) * .6, TY + py + math.sin(a) * .6, z0 + (h - 1.6) / 2), (0, 0, a), 'TEAM', .1)
# observation deck ring + rotating radar array on the crown
K.cyl(5.6, 6.2, 2.0, (TX, TY, 46.0), mat='gun', segs=24, bev=.15)
K.lathe([(6.3, 45.4), (6.3, 46.4), (5.8, 46.4), (5.8, 45.4)], 32, (TX, TY, 0), mat='GLOW', close=True, smooth=False)
S = 'spin'
K.cyl(2.2, 2.6, 2.4, (TX, TY, 48.2), mat='steel', segs=16, bev=.12, grp=S)
K.box((15.0, 1.2, 3.6), (TX, TY, 51.0), (0, 0, 0), 'gun', .2, grp=S)
for s in (-1, 1):
    K.box((5.6, .4, 3.0), (TX + s * 4.4, TY - .8, 51.0), (R(-12), 0, 0), 'TEAM', .05, grp=S)
    for i in range(4):
        K.box((.3, .2, 2.6), (TX + s * (2.4 + i * 1.3), TY - 1.05, 51.0), (R(-12), 0, 0), 'dark', 0, grp=S)
K.cyl(.22, .12, 10.0, (TX + 2.0, TY + 2.0, 53.0), mat='steel', segs=6, bev=0)          # antenna mast (fixed)
K.sphere(.5, (TX + 2.0, TY + 2.0, 58.2), 'lamp', 10)
for z in (49.5, 52.5, 55.5):
    K.box((1.6, .15, .15), (TX + 2.0, TY + 2.0, z), mat='steel', bev=0)
# roof plant on the lower setbacks
for x, y, z in ((TX - 7.0, TY - 7.0, 26.3), (TX + 6.2, TY + 6.0, 37.3)):
    K.box((3.2, 2.4, 1.6), (x, y, z), mat='steel', bev=.12)
    K.cyl(.8, .8, .3, (x - .4, y, z + .95), mat='dark', segs=12, bev=0)

# ================= glass-domed lab (podium roof, back right) =================
DX, DY, DR = 16.5, 13.5, 8.2
K.cyl(DR + .8, DR + 1.0, 2.4, (DX, DY, PZ + 1.2), mat='WALL', segs=40, bev=.15)
K.lathe([(DR + 1.05, PZ + 1.6), (DR + 1.05, PZ + 2.2)], 40, (DX, DY, 0), mat='TEAM')
K.sphere(DR, (DX, DY, PZ + 2.4), 'gdome', 16, scl=(1, 1, .82))
K.sphere(DR + .08, (DX, DY, PZ + 2.4), 'gwire', 16, scl=(1, 1, .82))
K.cyl(1.0, 1.2, 1.4, (DX, DY, PZ + 2.4 + DR * .82), mat='steel', segs=12, bev=.1)
K.sphere(.55, (DX, DY, PZ + 3.5 + DR * .82), 'GLOW', 10)

# ================= satellite dish (rotates), podium roof front right =================
DSX, DSY = 17.0, -9.5
K.cyl(2.4, 3.0, 2.2, (DSX, DSY, PZ + 1.1), mat='WALL', segs=16, bev=.15)
D = 'dish'
K.cyl(1.2, 1.4, 3.0, (DSX, DSY, PZ + 3.6), mat='steel', segs=12, bev=.1, grp=D)
DP = M((DSX, DSY, PZ + 6.4), (R(-35), 0, 0))
prof = [(0, 0)] + [(r, .09 * r * r) for r in (1, 2, 3, 4, 5, 5.6)] + [(5.6, .09 * 5.6 * 5.6 + .35)] + [(r, .09 * r * r + .35) for r in (5, 4, 3, 2, 1, 0)]
K.lathe(prof, 32, mat='ceram', grp=D, P=DP, close=False)
K.lathe([(5.6, .09 * 5.6 * 5.6), (5.9, .09 * 5.6 * 5.6 + .2), (5.9, .09 * 5.6 * 5.6 + .5), (5.6, .09 * 5.6 * 5.6 + .35)], 32, mat='TEAM', grp=D, P=DP, close=True, smooth=False)
for a in range(3):
    an = a * 2 * math.pi / 3
    K.tube([DP @ Vector((math.cos(an) * 4.6, math.sin(an) * 4.6, 1.9)), DP @ Vector((0, 0, 5.2))], .12, 'steel', 6, grp=D)
K.cyl(.6, .5, 1.2, (0, 0, 5.4), mat='gun', segs=10, bev=.05, grp=D, P=DP)
K.box((1.8, 1.8, 1.4), (0, 0, -.6), mat='gun', bev=.15, grp=D, P=DP)

# ================= solar array, roof plant, sky-bridge =================
for i in range(3):
    for j in range(2):
        x, y = -21.0 + i * 5.6, -12.5 + j * 6.2
        K.box((5.0, 5.4, .25), (x, y, PZ + 1.6), (R(-25), 0, 0), 'win', .02)
        K.box((5.2, 5.6, .15), (x, y, PZ + 1.45), (R(-25), 0, 0), 'steel', 0)
        K.box((.3, .3, 1.6), (x, y + 1.6, PZ + .8), mat='steel', bev=0)
for x, y in ((2.0, 20.5), (7.0, 20.5), (24.0, -2.0)):
    K.box((3.6, 2.6, 1.8), (x, y, PZ + .9), mat='steel', bev=.12)
    K.cyl(.9, .9, .3, (x - .6, y, PZ + 1.95), mat='dark', segs=14, bev=0)
# enclosed glass bridge from tower to dome drum at second-floor height
PB = M(((TX + 10 + DX - DR) / 2, (TY + DY) / 2, PZ + 5.0), (0, 0, math.atan2(DY - TY, DX - DR - TX - 10)))
L = math.hypot(DX - DR - TX - 10, DY - TY) + 1.6
K.box((L, 3.6, 3.2), (0, 0, 0), mat='win', bev=0, P=PB)
K.box((L + .2, 4.0, .5), (0, 0, 1.85), mat='TEAM', bev=.08, P=PB)
K.box((L + .2, 4.0, .5), (0, 0, -1.85), mat='gun', bev=.08, P=PB)
# service pipes up the tower's back face
for dx in (-2.0, 2.0):
    K.tube([(TX + dx, TY + 10.4, PZ), (TX + dx, TY + 10.4, 25.0)], .5, 'steel', 10)
# lamp posts + flag at the front corners
for x, y in ((-28.0, -24.0), (26.0, -24.0)):
    K.cyl(.28, .35, 9, (x, y, 4.5), mat='steel', segs=8, bev=0)
    K.box((2.4, .35, .35), (x + (1 if x < 0 else -1), y, 9), mat='steel', bev=0)
    K.box((1.3, .9, .5), (x + (2 if x < 0 else -2), y, 8.75), mat='gun', bev=.08)
    K.box((1.0, .6, .1), (x + (2 if x < 0 else -2), y, 8.45), mat='lamp', bev=0)
K.cyl(.22, .28, 16, (14.0, -27.0, 8.0), mat='steel', segs=8, bev=0)
K.box((.1, 5.0, 3.2), (14.0, -24.4, 14.2), mat='TEAM', bev=0)

K.empty('emblem1', (-17.0, 14.0, PZ + .5))
K.empty('emblem2', (TX, TY, 37.5))

objs = K.build({'body': (0, 0, 0), 'spin': (TX, TY, 47.0), 'dish': (DSX, DSY, PZ + 2.2)})
for o in objs.values(): box_uv(o, 24)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
print('TRIS', tris, {k: len(o.data.polygons) for k, o in objs.items()})
for o in objs.values(): ao_uv(o, .002)
g = ground(400)
bake_ao({'body': objs['body']}, 2048, 9.0, 64, 'tech_v')
bake_ao({k: objs[k] for k in ('spin', 'dish')}, 512, 6.0, 64, 'tech_v')
if '--preview' in sys.argv:
    preview(os.path.join(OUT, 'tech_v_preview.png'), (62, -86, 64), (0, 0, 18), lens=40)
    preview(os.path.join(OUT, 'tech_v_preview2.png'), (-70, -60, 40), (0, 0, 20), lens=40)
bpy.data.objects.remove(g)
export(objs, 'tech_v')
print('done')
