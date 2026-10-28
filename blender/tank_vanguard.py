"""Vanguard light tank ('tank') - original design. Run: python3 tank_vanguard.py [--preview]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

reset()
K = Kit()


# ---------------- running gear ----------------
def belt_path(circles, step):
    """convex belt (closed, CCW in XZ) around circles [(x,z,r)], resampled every `step` units -> [(p,t,n)]"""
    pts = []
    for cx, cz, r in circles:
        for i in range(96):
            a = 2 * math.pi * i / 96; pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    pts = sorted(set(pts))
    cross = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, hi = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(hi) >= 2 and cross(hi[-2], hi[-1], p) <= 0: hi.pop()
        hi.append(p)
    loop = lo[:-1] + hi[:-1]
    seg = [(loop[i], loop[(i + 1) % len(loop)]) for i in range(len(loop))]
    L = sum(math.dist(a, b) for a, b in seg)
    n = round(L / step); step = L / n
    out, acc, si = [], 0.0, 0
    for k in range(n):
        d = k * step
        while acc + math.dist(*seg[si]) < d: acc += math.dist(*seg[si]); si += 1
        (ax, az), (bx, bz) = seg[si]; l = math.dist((ax, az), (bx, bz)); f = (d - acc) / l
        t = ((bx - ax) / l, (bz - az) / l)
        out.append(((ax + (bx - ax) * f, az + (bz - az) * f), t, (t[1], -t[0])))
    return out


WZ = 3.45      # road wheel centre height
WR = 2.6
WX = [-12.4, -6.2, 0, 6.2, 12.4]
SPR = (-15.9, 5.3, 2.25)   # rear drive sprocket
IDL = (16.0, 4.9, 2.1)     # front idler
TW = 8.0                   # track width

for s in (-1, 1):
    yc = s * 11.0
    # track links
    circ = [(x, WZ, WR + .32) for x in WX] + [(SPR[0], SPR[1], SPR[2] + .32), (IDL[0], IDL[1], IDL[2] + .32)]
    for (px, pz), t, n in belt_path(circ, 1.08):
        th = math.atan2(-t[1], t[0])
        K.box((.96, TW, .42), (px, yc, pz), (0, th, 0), 'dark', 0)
        K.box((.34, TW - .8, .26), (px + n[0] * .3, yc, pz + n[1] * .3), (0, th, 0), 'gun', 0)
        K.box((.5, .9, .55), (px - n[0] * .42, yc, pz - n[1] * .42), (0, th, 0), 'steel', 0)
    # road wheels: double rubber-tyred discs with hubs
    for x in WX:
        for dy in (-2.05, 2.05):
            K.cyly(WR, 2.5, (x, yc + dy, WZ), 'rubber', 20, .15)
            K.cyly(WR * .74, 2.75, (x, yc + dy, WZ), 'gun', 16, 0)
        K.cyly(.95, TW + .6, (x, yc, WZ), 'steel', 10, 0)
    # drive sprocket with teeth, front idler
    for (cx, cz, r), teeth in ((SPR, True), (IDL, False)):
        for dy in (-1.9, 1.9):
            K.cyly(r, 1.4, (cx, yc + dy, cz), 'gun', 18, .12)
            if teeth:
                for k in range(11):
                    a = 2 * math.pi * k / 11
                    K.box((.75, 1.3, .7), (cx + math.cos(a) * (r + .2), yc + dy, cz + math.sin(a) * (r + .2)), (0, -a, 0), 'gun', 0)
        K.cyly(1.0, TW + .4, (cx, yc, cz), 'steel', 14, .1)
        K.cyly(.55, TW + .9, (cx, yc, cz), 'dark', 10, .05)

# ---------------- hull ----------------
K.prism([(-16.6, 3.2), (14.4, 3.2), (18.3, 6.8), (18.4, 9.0), (-17.0, 9.0), (-17.3, 4.6)], 14.2, mat='gun', bev=.35)
hl = []
for sy in (-1, 1):
    hl += [(-17.4, sy * 15.3, 8.7), (17.6, sy * 15.3, 8.7), (20.0, sy * 14.2, 9.4), (19.9, sy * 13.8, 10.0),
           (12.0, sy * 14.3, 12.5), (-15.4, sy * 14.3, 12.5), (-17.7, sy * 15.0, 11.3)]
K.hull([hl], mat='plate2', bev=.45)
# side skirts in 4 panels, bolted
for s in (-1, 1):
    for x0, x1 in ((-16.6, -8.9), (-8.7, -.9), (-.7, 7.1), (7.3, 15.4)):
        K.box((x1 - x0, .7, 4.1), ((x0 + x1) / 2, s * 15.55, 7.0), (0, 0, 0), 'TEAM', .2)
        for bx in (x0 + 1, (x0 + x1) / 2, x1 - 1):
            K.cyly(.24, .3, (bx, s * 15.95, 8.5), 'steel', 8, 0)
    K.box((4.6, 8.6, .45), (17.4, s * 11.2, 8.4), (0, R(-14), 0), 'gun', .12)   # front fender over idler
    K.box((.4, 7.6, 2.4), (-17.6, s * 11.2, 6.9), (0, 0, 0), 'rubber', .05)      # rear mudflap
# glacis: driver hatch, periscopes, spare track links, headlights, tow hooks
ga = math.atan2(12.5 - 9.8, 12.0 - 20.0)
gl = lambda f, h=0: (20.0 + (12.0 - 20.0) * f + math.sin(R(19)) * h, 9.8 + (12.5 - 9.8) * f + math.cos(R(19)) * h)
for f in (.28, .5):
    for y in (-10.2, -8.9, 8.9, 10.2):
        x, z = gl(f, .25); K.box((1.05, 1.15 * 1.0, .38), (x, y, z), (0, R(19), 0), 'dark', .06)
        x, z = gl(f, .45); K.box((.3, 1.0, .18), (x, y, z), (0, R(19), 0), 'gun', 0)
x, z = gl(.82, .2); K.cyl(1.55, 1.45, .5, (x, 3.4, z), (0, R(19), 0), 'gun', 20, .12)
for dy in (-1.1, 0, 1.1):
    x, z = gl(.62, .35); K.box((.5, .8, .55), (x, 3.4 + dy, z), (0, R(19), 0), 'win', .05)
for s in (-1, 1):
    K.cylx(.75, .9, (18.9, s * 12.4, 10.15), 'steel', 14, .08)
    K.cylx(.58, .2, (19.4, s * 12.4, 10.15), 'lamp', 14, 0)
    K.box((.3, 2.0, .25), (19.6, s * 12.4, 11.05), mat='steel', bev=0)
    K.box((1.2, 1.0, .9), (19.0, s * 7.8, 7.6), mat='steel', bev=.12)
    K.box((1.0, 1.0, .9), (-17.7, s * 7.8, 7.4), mat='steel', bev=.12)
for f0 in (.12,):
    x, z = gl(f0, .05); K.box((1.2, 28.4, .22), (x, 0, z), (0, R(19), 0), 'TEAM', 0)
K.box((1.4, 28.2, .2), (-15.0, 0, 12.6), mat='TEAM', bev=0)
# engine deck grilles, exhausts, rear stowage
for s in (-1, 1):
    K.box((7.6, 4.2, .25), (-11.4, s * 11.6, 12.55), mat='dark', bev=0)
    for i in range(9):
        K.box((.32, 3.9, .3), (-14.8 + i * .85, s * 11.6, 12.75), mat='steel', bev=0)
    K.box((1.2, 3.2, 2.0), (-18.1, s * 10.2, 10.3), mat='dark', bev=.15)
    for i in range(4):
        K.box((.2, 2.8, .25), (-18.75, s * 10.2, 9.6 + i * .45), mat='steel', bev=0)
    K.box((.9, 2.0, 2.6), (-18.0, s * 5.0, 9.6), mat='gun', bev=.2)      # jerry cans
K.box((1.6, 6.0, 1.8), (-17.4, 0, 11.4), mat='gun', bev=.2)
# tools on the right side of the deck
K.cylx(.2, 8, (3, -13.3, 12.75), 'rust', 6, 0); K.box((1.4, .9, .25), (7.4, -13.3, 12.75), mat='steel', bev=0)
K.box((5.5, 2.2, 1.1), (2.5, 12.6, 13.0), mat='gun', bev=.15)
K.cyly(.9, 4.0, (-5.5, 12.4, 13.4), 'rust', 12, .1)

# ---------------- turret (pivot = turret ring) ----------------
T = 'turret'
K.cyl(7.0, 7.0, .8, (-1, 0, 12.8), mat='dark', segs=40, bev=.1, grp=T)
tb = []
for sy in (-1, 1):
    tb += [(10.4, sy * 2.8, 13.0), (8.4, sy * 6.6, 13.0), (-4.2, sy * 7.9, 13.0), (-9.6, sy * 7.3, 13.0), (-11.0, sy * 4.4, 13.0),
           (8.0, sy * 2.4, 18.2), (6.0, sy * 5.8, 18.2), (-4.2, sy * 6.9, 18.2), (-9.0, sy * 6.3, 18.2), (-10.4, sy * 3.6, 18.2)]
K.hull([tb], mat='TEAM', bev=.4, grp=T)
for s in (-1, 1):   # arrow-head cheek armour
    K.hull([[(13.2, s * 3.1, 13.4), (8.2, s * 3.0, 13.3), (7.6, s * 7.1, 13.3), (8.6, s * 7.0, 13.3),
             (11.6, s * 3.1, 17.4), (8.0, s * 3.0, 17.6), (7.2, s * 6.3, 17.6)]], mat='plate2', bev=.3, grp=T)
    K.box((.25, .3, 4.0), (10.2, s * 5.0, 15.4), (0, 0, s * R(-35)), 'dark', 0, grp=T)
# mantlet and gun
K.box((3.4, 5.4, 4.2), (10.6, 0, 15.6), mat='gun', bev=.4, grp=T)
K.box((1.2, 4.4, 3.2), (12.6, 0, 15.8), mat='gun', bev=.3, grp=T)
GZ = 16.0
K.cylx(.98, 6.0, (16.0, 0, GZ), 'gun', 20, .1, grp=T)
K.cylx(.8, 14.0, (25.0, 0, GZ), 'gun', 18, .05, grp=T, r2=.74)
K.cylx(.9, .8, (18.9, 0, GZ), 'gun', 20, .08, grp=T, r2=1.35)
K.cylx(1.35, 2.4, (20.5, 0, GZ), 'gun', 22, .12, grp=T)
K.cylx(1.35, .8, (22.1, 0, GZ), 'gun', 20, .08, grp=T, r2=.9)
for x in (14.2, 17.6, 25.2, 28.0):
    K.cylx(1.02 if x < 18 else .86, .28, (x, 0, GZ), 'dark', 18, 0, grp=T)
K.box((2.8, 2.1, 1.8), (31.0, 0, GZ), mat='gun', bev=.28, grp=T)
for x in (30.3, 31.4):
    K.box((.55, 2.2, 1.0), (x, 0, GZ), mat='dark', bev=0, grp=T)
K.cylx(.42, .3, (32.35, 0, GZ), 'dark', 12, 0, grp=T)
K.box((2.0, .5, .6), (12.4, 2.6, 17.9), mat='dark', bev=.05, grp=T)           # coax MG
K.cylx(.13, 2.2, (14.3, 2.6, 17.9), 'dark', 6, 0, grp=T)
# commander cupola + MG, gunner sight, loader hatch
cx, cy = -3.8, -3.4
K.cyl(2.35, 2.2, 1.6, (cx, cy, 19.0), mat='gun', segs=24, bev=.18, grp=T)
for k in range(6):
    a = k * math.pi / 3 + .3
    K.box((.5, .7, .55), (cx + math.cos(a) * 2.2, cy + math.sin(a) * 2.2, 19.3), (0, 0, a), 'win', .05, grp=T)
K.cyl(1.85, 1.85, .45, (cx, cy, 20.0), mat='TEAM', segs=24, bev=.12, grp=T)
K.box((.8, 1.0, .6), (cx - 2.0, cy, 19.9), mat='steel', bev=.08, grp=T)
K.box((.4, .4, 1.4), (cx + 1.2, cy + 1.6, 20.7), mat='dark', bev=0, grp=T)
K.box((2.4, .5, .65), (cx + 2.1, cy + 1.6, 21.4), mat='dark', bev=.05, grp=T)
K.cylx(.14, 3.0, (cx + 4.6, cy + 1.6, 21.5), 'dark', 6, 0, grp=T)
K.box((.9, .7, .8), (cx + 1.5, cy + 2.2, 21.0), mat='olive' if False else 'gun', bev=.06, grp=T)
K.box((2.4, 2.1, 1.7), (4.2, 3.7, 19.05), mat='gun', bev=.22, grp=T)
K.box((.12, 1.5, .85), (5.45, 3.7, 19.2), mat='win', bev=0, grp=T)
K.box((1.1, 1.8, .4), (4.0, 3.7, 20.0), mat='gun', bev=.1, grp=T)
K.cyl(1.55, 1.5, .42, (-3.2, 3.6, 18.4), mat='gun', segs=20, bev=.1, grp=T)
# smoke dischargers
for s in (-1, 1):
    K.box((3.2, 1.2, .9), (6.0, s * 6.6, 16.6), mat='gun', bev=.1, grp=T)
    for i in range(4):
        K.cyl(.36, .36, 1.5, (4.9 + i * .75, s * 7.0, 17.3), (s * R(-30), R(35), 0), 'dark', 10, 0, grp=T)
# side stowage bins, bustle rack, antennas
for s in (-1, 1):
    K.box((6.4, 1.3, 2.7), (-4.6, s * 8.3, 14.7), mat='gun', bev=.22, grp=T)
    K.box((6.6, .3, .4), (-4.6, s * 9.0, 16.0), mat='steel', bev=0, grp=T)
K.box((3.6, 11.0, 2.4), (-11.4, 0, 15.0), mat='gun', bev=.25, grp=T)
rk = [(-9.4, -6.6, 18.6), (-13.4, -6.0, 18.6), (-13.4, 6.0, 18.6), (-9.4, 6.6, 18.6)]
K.tube(rk, .17, 'steel', 8, grp=T)
for p in rk:
    K.cyl(.15, .15, 2.4, (p[0], p[1], 17.4), mat='steel', segs=6, bev=0, grp=T)
K.tube([(-13.4, -6.0, 17.0), (-13.4, 6.0, 17.0)], .15, 'steel', 8, grp=T)
K.cyly(1.0, 8.6, (-11.6, 0, 17.4), 'rust', 14, .1, grp=T)
K.box((1.6, 2.6, 1.3), (-11.2, 4.4, 16.9), mat='gun', bev=.12, grp=T)
for s in (-1, 1):
    K.cyl(.32, .4, .7, (-8.8, s * 5.4, 18.5), mat='dark', segs=8, bev=0, grp=T)
    K.cyl(.05, .09, 7, (-8.8, s * 5.4, 22.3), mat='dark', segs=5, bev=0, grp=T)

K.empty('muzzle', (32.6, 0, GZ), T)
objs = K.build({'body': (0, 0, 0), T: (-1, 0, 12.4)})
for o in objs.values(): box_uv(o, 22)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
print('TRIS', tris, {k: len(o.data.polygons) for k, o in objs.items()})

for o in objs.values(): ao_uv(o)
g = ground(300)
bake_ao({'body': objs['body']}, 1024, 6.0, 64, 'tank_v')
bake_ao({T: objs[T]}, 512, 6.0, 64, 'tank_v')
if '--preview' in sys.argv:
    preview(os.path.join(OUT, 'tank_v_preview.png'), (62, -48, 46), (2, 0, 9), lens=55)
bpy.data.objects.remove(g)
export(objs, 'tank_v')
print('done')
