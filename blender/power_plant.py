"""Power Plant v3 - original design, ONE connected building standing on the ground:
a generator hall with one big hyperboloid cooling tower rising out of its roof, a reactor drum built into the
front-right corner, a barrel-roofed turbine wing on the left and an entrance block with a glazed control room.
Faction finishes are swapped in-game by material name: WALL, TOWER, TEAM, GLOW.  Run: python3 power_plant.py [--preview]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

reset()
K = Kit()
HZ = 9.0                     # hall roof height

def rrect(w, d, r, n=5):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for i in range(n + 1):
            a = R(a0 + 90 * i / n); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def block(pts, z0, h, mat, bev, ox=0, oy=0):
    b = K.bm('body', mat, bev, False)
    lo = [b.verts.new((x + ox, y + oy, z0)) for x, y in pts]; hi = [b.verts.new((x + ox, y + oy, z0 + h)) for x, y in pts]
    fs = [b.faces.new(lo[::-1]), b.faces.new(hi)]
    for i in range(len(pts)):
        j = (i + 1) % len(pts); fs.append(b.faces.new((lo[i], lo[j], hi[j], hi[i])))
    bmesh.ops.recalc_face_normals(b, faces=fs)

# ---------- generator hall (the core of the building) ----------
HX0, HX1, HY0, HY1 = -22.0, 22.0, -19.0, 24.0
HCX, HCY, HW, HD = (HX0 + HX1) / 2, (HY0 + HY1) / 2, HX1 - HX0, HY1 - HY0
block(rrect(HW, HD, 4), 0, HZ, 'WALL', .35, HCX, HCY)
block(rrect(HW + .6, HD + .6, 4.3), HZ - 1.3, 1.3, 'TEAM', .15, HCX, HCY)                 # team fascia
block(rrect(HW + 1.0, HD + 1.0, 4.5), HZ - .1, .55, 'gun', .12, HCX, HCY)                 # roof parapet
block(rrect(HW + .5, HD + .5, 4.25), 0, .9, 'gun', .1, HCX, HCY)                          # wall base course
for i in range(9):                                                                        # pilasters
    x = HX0 + 3 + i * (HW - 6) / 8
    for y in (HY0 - .25, HY1 + .25):
        K.box((1.0, .7, HZ - 1.4), (x, y, (HZ - 1.4) / 2), mat='gun', bev=.1)
for y in (HY1 + .2,):
    for x0, x1 in ((HX0 + 4, -2), (2, HX1 - 4)):
        K.box((x1 - x0, .3, 1.5), ((x0 + x1) / 2, y, 5.6), mat='win', bev=0)
for x0, x1 in ((3.5, 9.5),):
    K.box((x1 - x0, .3, 1.5), ((x0 + x1) / 2, HY0 - .2, 5.6), mat='win', bev=0)
for y0, y1 in ((-4, 2), (6, HY1 - 5)):
    K.box((.3, y1 - y0, 1.5), (HX1 + .2, (y0 + y1) / 2, 5.6), mat='win', bev=0)

# ---------- cooling tower rising out of the hall roof ----------
TX, TY, TB, TH = -1.0, 7.0, 12.5, 30.0
def hyper(base_r, throat, H, hc):
    c = hc / math.sqrt((base_r / throat) ** 2 - 1)
    return lambda h: throat * math.sqrt(1 + ((h - hc) / c) ** 2)
f = hyper(TB, TB * .64, TH, TH * .76)
z0 = HZ - .6
hs = [0, .05, .12, .22, .34, .47, .6, .72, .82, .9, .96, 1.0]
outer = [(f(h * TH), z0 + h * TH) for h in hs]
inner = [(f(h * TH) - .6, z0 + h * TH) for h in reversed(hs)]
K.lathe(outer + [(outer[-1][0] + .4, z0 + TH), (outer[-1][0] + .4, z0 + TH + .8), (inner[0][0] - .2, z0 + TH + .8)] + inner, 56, (TX, TY, 0), mat='TOWER', close=True)
for h0, h1 in ((.8, .845), (.875, .9)):
    K.lathe([(f(h0 * TH) + .06, z0 + h0 * TH), (f(h1 * TH) + .06, z0 + h1 * TH)], 56, (TX, TY, 0), mat='TEAM')
K.lathe([(f(.965 * TH) + .1, z0 + .96 * TH), (f(TH) + .5, z0 + TH)], 56, (TX, TY, 0), mat='dark')
# collar where the tower meets the roof, inlet louvres all round
K.lathe([(TB + 1.6, HZ + .5), (TB + 1.6, HZ + 3.2), (TB - .2, HZ + 3.2), (TB - .2, HZ + .5)], 56, (TX, TY, 0), mat='WALL', close=True, smooth=False)
for i in range(28):
    a = 2 * math.pi * i / 28
    K.box((.35, 2.2, 2.0), (TX + (TB + 1.65) * math.cos(a), TY + (TB + 1.65) * math.sin(a), HZ + 1.85), (0, 0, a), 'dark', 0)
K.lathe([(TB + 1.8, HZ + 3.2), (TB + 1.8, HZ + 3.7), (TB - .4, HZ + 3.7), (TB - .4, HZ + 3.2)], 56, (TX, TY, 0), mat='TEAM', close=True, smooth=False)
K.cyl(f(.85 * TH) - .7, f(.85 * TH) - .7, .3, (TX, TY, z0 + .85 * TH), mat='dark', segs=40, bev=0)
K.empty('steam1', (TX, TY, z0 + TH + 1.5))

# ---------- reactor drum built into the front-right corner ----------
RX, RY, RR, RH = 15.5, -14.0, 8.0, 15.0
prof = [(0, 0), (RR, 0), (RR, RH)]
for i in range(1, 9):
    a = math.pi / 2 * i / 8; prof.append((RR * math.cos(a), RH + 4.6 * math.sin(a)))
K.lathe(prof, 48, (RX, RY, 0), mat='TOWER')
K.lathe([(RR + .07, 10.4), (RR + .07, 11.6)], 48, (RX, RY, 0), mat='TEAM')
K.lathe([(RR + .9, .4), (RR + .9, 1.0), (RR + .05, 1.0), (RR + .05, .4)], 48, (RX, RY, 0), mat='GLOW', close=True, smooth=False)
for i in range(10):
    a = 2 * math.pi * i / 10 + .3
    K.box((1.2, 1.0, RH), (RX + (RR + .4) * math.cos(a), RY + (RR + .4) * math.sin(a), RH / 2), (0, 0, a), 'WALL', .2)
K.lathe([(RR - .2, RH - .2), (RR + 1.7, RH - .2), (RR + 1.7, RH + .2), (RR - .2, RH + .2)], 48, (RX, RY, 0), mat='steel', close=True, smooth=False)
ring = lambda cx, cy, r, z, n=48: [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n), z) for i in range(n + 1)]
K.tube(ring(RX, RY, RR + 1.5, RH + 1.4), .12, 'steel', 6)
for i in range(16):
    a = 2 * math.pi * i / 16
    K.box((.18, .18, 1.3), (RX + (RR + 1.5) * math.cos(a), RY + (RR + 1.5) * math.sin(a), RH + .8), mat='steel', bev=0)
K.cyl(1.6, 1.8, 1.4, (RX, RY, RH + 4.9), mat='steel', segs=20, bev=.1)
K.sphere(.85, (RX, RY, RH + 6.0), 'GLOW', 14)
K.box((4.2, 2.6, 5.2), (RX - 2.0, RY - RR - .5, 2.6), mat='WALL', bev=.25)          # equipment hatch
K.box((2.8, .3, 3.8), (RX - 2.0, RY - RR - 1.85, 1.9), mat='door', bev=0)
K.box((3.6, .4, .5), (RX - 2.0, RY - RR - 1.95, 4.1), mat='haz', bev=0)

# ---------- turbine wing (left), barrel roof ----------
WX0, WX1, WY0, WY1, WZ = -31.0, HX0 + 1.0, -14.0, 14.0, 7.0
WCX, WCY = (WX0 + WX1) / 2, (WY0 + WY1) / 2
K.box((WX1 - WX0, WY1 - WY0, WZ), (WCX, WCY, WZ / 2), mat='WALL', bev=.3)
half = (WX1 - WX0) / 2 + .3
vault = [(x, WZ + 2.6 * math.sqrt(max(0, 1 - (x / half) ** 2))) for x in [half * (2 * i / 14 - 1) for i in range(15)]]
K.prism([(-half, WZ - .1)] + vault + [(half, WZ - .1)], WY1 - WY0 + .4, (WCX, WCY, 0), (0, 0, 0), 'TEAM', .12)
for i in range(6):
    y = WY0 + 2 + i * (WY1 - WY0 - 4) / 5
    K.prism([(x, z + .22) for x, z in vault] + [(vault[-1][0], vault[-1][1] - .15), (vault[0][0], vault[0][1] - .15)], .45, (WCX, y, 0), (0, 0, 0), 'gun', 0)
K.box((1.2, WY1 - WY0 - 4, .4), (WCX, WCY, WZ + 2.75), mat='win', bev=0)
for y in (-8, 0, 8):     # louvred side vents
    K.box((.3, 4.2, 2.6), (WX0 - .15, y, 3.8), mat='dark', bev=0)
    for k in range(5):
        K.box((.45, 4.0, .18), (WX0 - .3, y, 2.7 + k * .55), mat='steel', bev=0)
K.box((5.0, .4, 5.0), (WCX, WY0 - .2, 2.5), mat='door', bev=0)          # roll-up door
for z in range(1, 6):
    K.box((4.6, .2, .16), (WCX, WY0 - .45, z * .9), mat='steel', bev=0)
for s in (-1, 1):
    K.box((.7, .7, 5.4), (WCX + s * 2.9, WY0 - .35, 2.7), mat='haz', bev=.05)
K.box((6.6, .7, .8), (WCX, WY0 - .35, 5.7), mat='haz', bev=.05)

# ---------- entrance block + control room on the hall front ----------
EX = -6.0
K.box((12.0, 5.0, 6.0), (EX, HY0 - 2.3, 3.0), mat='WALL', bev=.3)
K.box((13.0, 6.0, .6), (EX, HY0 - 2.6, 6.3), mat='TEAM', bev=.15)                   # canopy
K.box((4.4, .3, 4.0), (EX, HY0 - 4.85, 2.0), mat='door', bev=0)
K.box((1.0, .4, .5), (EX, HY0 - 5.1, 4.6), mat='lamp', bev=0)
K.box((15.0, .4, 1.8), (EX - .5, HY0 - .3, HZ - 2.4), mat='win', bev=0)              # control-room glazing
for i in range(9):
    K.box((.3, .55, 1.9), (EX - 8 + i * 1.875, HY0 - .45, HZ - 2.4), mat='steel', bev=0)
for s in (-1, 1):
    K.cyl(.25, .3, 6.0, (EX + s * 6.0, HY0 - 4.8, 3.0), mat='steel', segs=8, bev=0)

# ---------- roof equipment + pipe gallery from the reactor to the tower ----------
for x, y in ((-17, -13), (-12, -13), (17, 19), (12, 19)):
    K.box((3.6, 2.6, 1.8), (x, y, HZ + .9), mat='steel', bev=.12)
    K.cyl(.9, .9, .3, (x - .6, y, HZ + 1.95), mat='dark', segs=14, bev=0)
for x in (-18.5,):
    K.cyl(.9, 1.0, 2.2, (x, 6.0, HZ + 1.1), mat='steel', segs=14, bev=.08)
    K.cyl(1.4, 1.4, .35, (x, 6.0, HZ + 2.3), mat='steel', segs=14, bev=.05)
for dz, r in ((2.4, .85), (4.4, .7)):
    K.tube([(RX - 3.5, RY + RR * .75, HZ + dz), (RX - 3.5, -4.0, HZ + dz), (TX + TB * .62, TY - TB * .55, HZ + dz)], r, 'steel', 12)
for y in (-7.0, -2.5):
    K.box((.4, 4.4, .4), (RX - 3.5, y, HZ + 3.2), mat='gun', bev=0)
    for s in (-1, 1):
        K.box((.35, .35, 4.6), (RX - 3.5 + s * 1.6, y, HZ + 2.3), mat='gun', bev=0)
SX, SY = 18.0, 20.0                                                                         # exhaust stack
K.cyl(1.3, 1.5, 20, (SX, SY, 10), mat='steel', segs=16, bev=.1)
for z in (8, 13, 19.4):
    K.cyl(1.6, 1.6, .5, (SX, SY, z), mat='TEAM' if z > 19 else 'gun', segs=16, bev=.05)
K.empty('steam2', (SX, SY, 21))

# ---------- transformer bay against the right wall ----------
for y in (-1.5, 5.0):
    x = HX1 + 2.6
    K.box((3.0, 4.0, 3.2), (x, y, 1.6), mat='steel', bev=.15)
    for k in range(5):
        K.box((.5, .18, 2.6), (x, y - 1.6 + k * .8, 1.6), mat='dark', bev=0)
    for dy in (-1.1, 0, 1.1):
        K.cyl(.3, .4, 2.0, (x, y + dy, 4.2), mat='ceram', segs=10, bev=0)
        for z in (3.7, 4.3, 4.9):
            K.cyl(.52, .52, .14, (x, y + dy, z), mat='ceram', segs=10, bev=0)
    K.tube([(x, y, 5.2), (x, y, 6.8), (HX1 + .2, y, 6.8)], .1, 'dark', 6)
for z in (1.2, 2.4):
    K.tube([(HX1 + .3, -4.5, z), (HX1 + 5.0, -4.5, z), (HX1 + 5.0, 8.5, z), (HX1 + .3, 8.5, z)], .08, 'steel', 6)
for x, y in ((HX1 + 5.0, -4.5), (HX1 + 5.0, 2.0), (HX1 + 5.0, 8.5)):
    K.box((.2, .2, 2.6), (x, y, 1.3), mat='steel', bev=0)
for x, y in ((-29, -24), (27, -26)):                                                          # lamp posts
    K.cyl(.28, .35, 9, (x, y, 4.5), mat='steel', segs=8, bev=0)
    K.box((2.4, .35, .35), (x + (1 if x < 0 else -1), y, 9), mat='steel', bev=0)
    K.box((1.3, .9, .5), (x + (2 if x < 0 else -2), y, 8.75), mat='gun', bev=.08)
    K.box((1.0, .6, .1), (x + (2 if x < 0 else -2), y, 8.45), mat='lamp', bev=0)

K.empty('emblem1', (-14.0, -9.0, HZ + .15))
K.empty('emblem2', (13.0, 13.0, HZ + .15))

objs = K.build()
for o in objs.values(): box_uv(o, 24)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
print('TRIS', tris, 'tower top', z0 + TH, 'top r', f(TH))
for o in objs.values(): ao_uv(o, .002)
g = ground(400)
bake_ao(objs, 2048, 9.0, 64, 'power3')
if '--preview' in sys.argv:
    preview(os.path.join(OUT, 'power3_preview.png'), (78, -84, 66), (0, 0, 12), lens=40)
bpy.data.objects.remove(g)
export(objs, 'power3')
print('done')
