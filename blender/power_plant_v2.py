"""Power Plant - original design (stands directly on the ground): two hyperboloid cooling towers, domed reactor, turbine hall, transformer yard.
Footprint 58x58 on top of the game's foundation (origin = foundation top). Front of the building = Blender -Y.
Faction finishes are swapped in-game by material name: WALL, TOWER, TEAM, GLOW.  Run: python3 power_plant.py [--preview]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

reset()
K = Kit()
Z0 = 0.0   # ground level (no platform: the building stands on the terrain)

# ---------- plinth ----------
def rrect(w, d, r, n=6):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for i in range(n + 1):
            a = R(a0 + 90 * i / n); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def slab(w, d, r, z0, h, mat, bev):
    """rounded-rectangle slab (as a vertical prism)"""
    pts = rrect(w, d, r)
    b = K.bm('body', mat, bev, False)
    lo = [b.verts.new((x, y, z0)) for x, y in pts]; hi = [b.verts.new((x, y, z0 + h)) for x, y in pts]
    fs = [b.faces.new(lo[::-1]), b.faces.new(hi)]
    for i in range(len(pts)):
        j = (i + 1) % len(pts); fs.append(b.faces.new((lo[i], lo[j], hi[j], hi[i])))
    bmesh.ops.recalc_face_normals(b, faces=fs)

for x in (-24, -18, 18, 24):                       # hazard strips + kerb lights along the front edge
    K.box((4.4, .5, .25), (x, -28.4, Z0 + .45), mat='haz', bev=0)

# ---------- cooling towers ----------
def hyper(base_r, throat, H, hc):
    c = hc / math.sqrt((base_r / throat) ** 2 - 1)
    return lambda h: throat * math.sqrt(1 + ((h - hc) / c) ** 2)

def cooling_tower(cx, cy, base_r, H, segs, steam):
    legs = 3.0; zb = Z0 + legs
    f = hyper(base_r, base_r * .66, H, H * .77)
    hs = [0, .04, .1, .2, .32, .45, .58, .7, .8, .88, .95, 1.0]
    outer = [(f(h * H), zb + h * H) for h in hs]
    inner = [(f(h * H) - .55, zb + h * H) for h in reversed(hs)]
    prof = outer + [(outer[-1][0] + .35, zb + H), (outer[-1][0] + .35, zb + H + .7), (inner[0][0] - .2, zb + H + .7)] + inner
    K.lathe(prof, segs, (cx, cy, 0), mat='TOWER', close=True)
    # painted bands
    for h0, h1, m in ((.83, .87, 'TEAM'), (.9, .925, 'TEAM')):
        K.lathe([(f(h0 * H) + .06, zb + h0 * H), (f(h1 * H) + .06, zb + h1 * H)], segs, (cx, cy, 0), mat=m)
    K.lathe([(f(.97 * H) + .1, zb + .965 * H), (f(H) + .45, zb + H)], segs, (cx, cy, 0), mat='dark')   # soot at the lip
    # ring beam + raker columns (the open base where air is drawn in)
    K.lathe([(base_r + .3, zb - .8), (base_r + .3, zb + .2), (base_r - 1.0, zb + .2), (base_r - 1.0, zb - .8)], segs, (cx, cy, 0), mat='TOWER', close=True, smooth=False)
    n = segs // 2
    for i in range(n):
        a = 2 * math.pi * i / n
        for da in (-1, 1):
            b2 = a + da * math.pi / n
            K.tube([(cx + (base_r - .2) * math.cos(a), cy + (base_r - .2) * math.sin(a), zb - .7),
                    (cx + (base_r + .1) * math.cos(b2), cy + (base_r + .1) * math.sin(b2), Z0)], .32, 'TOWER', 6)
    K.cyl(f(.86 * H) - .6, f(.86 * H) - .6, .3, (cx, cy, zb + .86 * H), mat='dark', segs=segs, bev=0)    # interior shadow plate
    K.cyl(base_r - .8, base_r - .8, .3, (cx, cy, Z0 + .15), mat='dark', segs=segs, bev=0)                 # basin
    K.empty(steam, (cx, cy, zb + H + 1.5))
    return zb, f

zbA, fA = cooling_tower(-11.5, 11.0, 12.0, 26.0, 48, 'steam1')
zbB, fB = cooling_tower(14.0, 14.5, 9.2, 20.0, 40, 'steam2')
# ladder + cage up tower B's ring beam to a platform
for s in (-1, 1):
    K.box((.25, .25, 3.6), (14.0 + s * .7, 14.5 - 9.9, Z0 + 1.8), mat='steel', bev=0)

# ---------- reactor ----------
RX, RY, RR = 13.0, -9.0, 8.0
prof = [(0, Z0), (RR, Z0), (RR, Z0 + 11.5)]
for i in range(1, 9):
    a = math.pi / 2 * i / 8; prof.append((RR * math.cos(a), Z0 + 11.5 + 5.6 * math.sin(a)))
K.lathe(prof, 48, (RX, RY, 0), mat='TOWER', close=False)
K.lathe([(RR + .07, Z0 + 7.6), (RR + .07, Z0 + 8.8)], 48, (RX, RY, 0), mat='TEAM')
K.lathe([(RR + .07, Z0 + 9.3), (RR + .07, Z0 + 9.7)], 48, (RX, RY, 0), mat='TEAM')
K.lathe([(RR + .9, Z0 + .3), (RR + .9, Z0 + .9), (RR + .05, Z0 + .9), (RR + .05, Z0 + .3)], 48, (RX, RY, 0), mat='GLOW', close=True, smooth=False)
for i in range(8):   # buttress ribs
    a = 2 * math.pi * i / 8 + math.pi / 8
    K.box((1.2, 1.0, 11.0), (RX + (RR + .4) * math.cos(a), RY + (RR + .4) * math.sin(a), Z0 + 5.5), (0, 0, a), 'WALL', .2)
# walkway + railing round the dome springline
K.lathe([(RR - .2, Z0 + 11.3), (RR + 1.8, Z0 + 11.3), (RR + 1.8, Z0 + 11.7), (RR - .2, Z0 + 11.7)], 48, (RX, RY, 0), mat='steel', close=True, smooth=False)
ring = lambda r, z, n=48: [(RX + r * math.cos(2 * math.pi * i / n), RY + r * math.sin(2 * math.pi * i / n), z) for i in range(n + 1)]
K.tube(ring(RR + 1.6, Z0 + 12.9), .12, 'steel', 6)
K.tube(ring(RR + 1.6, Z0 + 12.3), .09, 'steel', 6)
for i in range(16):
    a = 2 * math.pi * i / 16
    K.box((.18, .18, 1.4), (RX + (RR + 1.6) * math.cos(a), RY + (RR + 1.6) * math.sin(a), Z0 + 12.4), mat='steel', bev=0)
# dome top: vent, beacon, aerials
K.cyl(1.5, 1.7, 1.4, (RX, RY, Z0 + 17.6), mat='steel', segs=20, bev=.1)
K.cyl(1.9, 1.9, .3, (RX, RY, Z0 + 18.4), mat='dark', segs=20, bev=0)
K.sphere(.8, (RX, RY, Z0 + 19.2), 'GLOW', 14)
K.cyl(.08, .12, 6, (RX + 2.6, RY + 1.0, Z0 + 18.6), mat='steel', segs=6, bev=0)
# equipment hatch facing front
K.box((5.0, 3.4, 6.4), (RX - 1.0, RY - RR - .8, Z0 + 3.2), mat='WALL', bev=.3)
K.box((3.2, .3, 4.4), (RX - 1.0, RY - RR - 2.55, Z0 + 2.4), mat='door', bev=0)
K.box((4.4, .4, .6), (RX - 1.0, RY - RR - 2.65, Z0 + 4.9), mat='haz', bev=0)
K.box((5.4, 3.8, .5), (RX - 1.0, RY - RR - .8, Z0 + 6.6), mat='TEAM', bev=.15)
K.box((.9, .5, .5), (RX - 1.0, RY - RR - 2.7, Z0 + 5.7), mat='lamp', bev=0)
# ladder up the reactor wall to the walkway
LX, LY = RX + RR + .35, RY + 1.6
for dy in (-.6, .6):
    K.box((.2, .2, 11.6), (LX, LY + dy, Z0 + 5.8), mat='steel', bev=0)
for z in range(1, 12):
    K.box((.15, 1.2, .15), (LX, LY, Z0 + z), mat='steel', bev=0)

# ---------- turbine hall ----------
HX, HY, HW, HD, HH = -11.0, -15.0, 22.0, 12.0, 8.0
K.box((HW, HD, HH), (HX, HY, Z0 + HH / 2), mat='WALL', bev=.3)
for i in range(8):     # pilasters
    x = HX - HW / 2 + 1.2 + i * (HW - 2.4) / 7
    for y in (HY - HD / 2 - .25, HY + HD / 2 + .25):
        K.box((.9, .6, HH), (x, y, Z0 + HH / 2), mat='gun', bev=.1)
K.box((HW + .8, HD + .8, 1.1), (HX, HY, Z0 + HH - .4), mat='TEAM', bev=.15)
vault = [(y, Z0 + HH + .2 + 3.2 * math.sqrt(max(0, 1 - (y / (HD / 2 + .3)) ** 2))) for y in [(HD / 2 + .3) * (2 * i / 16 - 1) for i in range(17)]]
K.prism([(-HD / 2 - .3, Z0 + HH - .1)] + vault + [(HD / 2 + .3, Z0 + HH - .1)], HW + .4, (HX, HY, 0), (0, 0, R(90)), 'TEAM', .15)
for i in range(7):     # roof ribs
    x = HX - HW / 2 + 1.5 + i * (HW - 3) / 6
    K.prism([(y, z + .25) for y, z in vault] + [(vault[-1][0], vault[-1][1] - .2), (vault[0][0], vault[0][1] - .2)], .5, (x, HY, 0), (0, 0, R(90)), 'gun', 0)
K.box((HW - 3, 1.4, .5), (HX, HY, Z0 + HH + 3.55), mat='win', bev=0)                   # ridge skylight
for x in (-17.5, -11.0, -4.5):                                                          # roof extractors
    K.cyl(1.0, 1.0, 1.8, (x, HY + 2.6, Z0 + HH + 3.0), mat='steel', segs=14, bev=.08)
    K.cyl(1.4, 1.4, .35, (x, HY + 2.6, Z0 + HH + 4.0), mat='steel', segs=14, bev=.05)
# front windows + roll-up door
K.box((HW - 8, .3, 1.6), (HX - 3, HY - HD / 2 - .2, Z0 + 5.6), mat='win', bev=0)
for i in range(8):
    K.box((.25, .45, 1.7), (HX - 10 + i * 2.0, HY - HD / 2 - .3, Z0 + 5.6), mat='steel', bev=0)
DX = HX + 6.5
K.box((5.6, .4, 5.4), (DX, HY - HD / 2 - .25, Z0 + 2.7), mat='door', bev=0)
for z in range(1, 6):
    K.box((5.2, .2, .18), (DX, HY - HD / 2 - .5, Z0 + z * .95), mat='steel', bev=0)
for s in (-1, 1):
    K.box((.8, .8, 5.8), (DX + s * 3.2, HY - HD / 2 - .4, Z0 + 2.9), mat='haz', bev=.05)
K.box((7.2, .8, .9), (DX, HY - HD / 2 - .4, Z0 + 6.1), mat='haz', bev=.05)
K.box((1.0, .4, .5), (DX, HY - HD / 2 - .7, Z0 + 6.9), mat='lamp', bev=0)
# exhaust stack at the hall's back corner
K.cyl(1.25, 1.4, 16, (HX - HW / 2 + 2.2, HY + HD / 2 + 1.6, Z0 + 8), mat='steel', segs=16, bev=.1)
for z in (6, 11, 15.6):
    K.cyl(1.5, 1.5, .5, (HX - HW / 2 + 2.2, HY + HD / 2 + 1.6, Z0 + z), mat='TEAM' if z > 15 else 'gun', segs=16, bev=.05)
K.empty('steam3', (HX - HW / 2 + 2.2, HY + HD / 2 + 1.6, Z0 + 17))
# AC units on the hall's end wall
for y in (HY - 2.5, HY + 2.5):
    K.box((1.6, 3.0, 2.4), (HX + HW / 2 + .8, y, Z0 + 1.2), mat='steel', bev=.12)
    K.cylx(1.0, .25, (HX + HW / 2 + 1.65, y, Z0 + 1.4), 'dark', 14, 0)

# ---------- steam pipes: reactor -> hall, hall -> towers ----------
for y, z, r in ((-10.0, Z0 + 7.0, .9), (-12.8, Z0 + 5.0, .75)):
    x0, x1 = RX - RR + .2, HX + HW / 2 - .1
    K.cylx(r, x0 - x1, ((x0 + x1) / 2, y, z), 'steel', 14, 0)
    for x in (x1 + .6, (x0 + x1) / 2, x0 - .6):
        K.cylx(r + .3, .5, (x, y, z), 'gun', 14, .05)
for x in (0.0, 3.0):     # A-frame pipe supports
    for dy in (-1, 1):
        K.box((.4, .4, 7.4), (x, -11.4 + dy * 2.2, Z0 + 3.4), (dy * R(-12), 0, 0), 'gun', .05)
    K.box((.5, 5.6, .5), (x, -11.4, Z0 + 6.2), mat='gun', bev=.05)
for x in (-15.0, -8.5):   # hall back -> tower A ring
    K.tube([(x, HY + HD / 2, Z0 + 4.5), (x, HY + HD / 2 + 2, Z0 + 4.5), (x, HY + HD / 2 + 3.4, Z0 + 3.0), (x, -1.0, Z0 + 3.0), (x, .6, Z0 + 2.0)], .7, 'steel', 12)
    K.cylx(1.0, .5, (x, HY + HD / 2 + .3, Z0 + 4.5), 'gun', 14, .05)
K.tube([(RX + 3, RY + RR * .9, Z0 + 3), (RX + 3, 2.0, Z0 + 3.0), (RX + 1.5, 4.8, Z0 + 2.2)], .7, 'steel', 12)
# pump house between everything
K.box((6.0, 5.0, 4.4), (1.5, -2.0, Z0 + 2.2), mat='WALL', bev=.25)
K.box((6.6, 5.6, .5), (1.5, -2.0, Z0 + 4.6), mat='TEAM', bev=.1)
K.box((1.8, .3, 3.0), (1.5, -4.6, Z0 + 1.5), mat='door', bev=0)
K.cyl(1.0, 1.0, .9, (0.2, -1.2, Z0 + 5.3), mat='steel', segs=14, bev=.05)
K.tube([(4.5, -2.0, Z0 + 2.5), (RX - RR + .3, -2.0, Z0 + 2.5)], .5, 'steel', 10)
K.tube([(-1.5, -1.0, Z0 + 2.5), (-4.5, -1.0, Z0 + 2.5), (-4.5, 0.6, Z0 + 2.5)], .5, 'steel', 10)

# ---------- transformer yard (front centre) ----------
for x in (-.6, 4.2):
    y = -23.0
    K.box((3.4, 2.6, 3.0), (x, y, Z0 + 1.5), mat='steel', bev=.15)
    for k in range(5):
        for s in (-1, 1):
            K.box((.18, .5, 2.4), (x - 1.3 + k * .65, y + s * 1.5, Z0 + 1.5), mat='dark', bev=0)
    K.box((2.2, 1.8, .7), (x, y, Z0 + 3.35), mat='gun', bev=.1)
    for dx in (-1.0, 0, 1.0):
        K.cyl(.32, .42, 2.2, (x + dx, y, Z0 + 4.8), mat='ceram', segs=10, bev=0)
        for z in (4.2, 4.8, 5.4):
            K.cyl(.55, .55, .14, (x + dx, y, Z0 + z), mat='ceram', segs=10, bev=0)
    K.tube([(x, y + 1.3, Z0 + 5.6), (x, y + 4.5, Z0 + 7.4), (x, HY - HD / 2 - .2, Z0 + 7.4)], .12, 'dark', 6)
fx0, fx1, fy0, fy1 = -3.4, 7.0, -26.6, -20.0
fence = [(fx0, fy1, 0), (fx0, fy0, 0), (fx1, fy0, 0), (fx1, fy1, 0)]
for z in (Z0 + 2.4, Z0 + 1.2):
    K.tube([(x, y, z) for x, y, _ in fence], .08, 'steel', 6)
for (ax, ay, _), (bx, by, _) in zip(fence, fence[1:]):
    n = max(1, round(math.dist((ax, ay), (bx, by)) / 2.2))
    for i in range(n + 1):
        K.box((.2, .2, 2.6), (ax + (bx - ax) * i / n, ay + (by - ay) * i / n, Z0 + 1.3), mat='steel', bev=0)
K.box((3.0, .5, .25), (2.0, -27.2, Z0 + .45), mat='haz', bev=0)

# ---------- lamp posts + emblem spots ----------
for x, y in ((-26, -25.5), (26, -25.5), (-26, 25.5), (26, 25.5)):
    K.cyl(.28, .35, 9, (x, y, Z0 + 4.5), mat='steel', segs=8, bev=0)
    K.box((2.4, .35, .35), (x + (1 if x < 0 else -1), y, Z0 + 9), mat='steel', bev=0)
    K.box((1.3, .9, .5), (x + (2 if x < 0 else -2), y, Z0 + 8.75), mat='gun', bev=.08)
    K.box((1.0, .6, .1), (x + (2 if x < 0 else -2), y, Z0 + 8.45), mat='lamp', bev=0)
K.empty('emblem1', (-20.5, -24.5, Z0))
K.empty('emblem2', (22.0, 2.5, Z0))
K.empty('toweA', (-11.5, 11.0, zbA + 26.0 * .55))
K.empty('toweB', (14.0, 14.5, zbB + 20.0 * .55))

objs = K.build()
for o in objs.values(): box_uv(o, 24)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
print('TRIS', tris)
for o in objs.values(): ao_uv(o, .002)
g = ground(400)
bake_ao(objs, 2048, 9.0, 64, 'power')
if '--preview' in sys.argv:
    preview(os.path.join(OUT, 'power_preview.png'), (82, -86, 72), (0, 0, 9), lens=40)
bpy.data.objects.remove(g)
export(objs, 'power')
print('done')
