"""Vanguard vehicles (original designs): heavy tank, missile carrier, buggy, artillery, harvester.
Run: python3 vehicles_vanguard.py htank|mlrs|buggy|arty|harv [--nopreview]
Coordinates match the game: +X forward, Z up, turret pivots as in the code-built models."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *


def glacis(x0, z0, x1, z1):
    """point on a sloped plate from (x0,z0) to (x1,z1) at fraction f, lifted h along its normal"""
    a = math.atan2(z1 - z0, x0 - x1)
    return (lambda f, h=0: (x0 + (x1 - x0) * f + math.sin(a) * h, z0 + (z1 - z0) * f + math.cos(a) * h)), a


def smoke(K, x, y, z, s, grp):
    K.box((3.0, 1.2, .9), (x, y, z), mat='gun', bev=.1, grp=grp)
    for i in range(4):
        K.cyl(.34, .34, 1.4, (x - 1.1 + i * .72, y + s * .4, z + .7), (s * R(-30), R(35), 0), 'dark', 10, 0, grp=grp)


def cupola(K, cx, cy, z, grp, mg=True):
    K.cyl(2.3, 2.15, 1.6, (cx, cy, z + .8), mat='gun', segs=24, bev=.18, grp=grp)
    for k in range(6):
        a = k * math.pi / 3 + .3
        K.box((.5, .7, .55), (cx + math.cos(a) * 2.15, cy + math.sin(a) * 2.15, z + 1.1), (0, 0, a), 'win', .05, grp=grp)
    K.cyl(1.8, 1.8, .45, (cx, cy, z + 1.8), mat='TEAM', segs=24, bev=.12, grp=grp)
    if mg:
        K.box((.4, .4, 1.4), (cx + 1.2, cy + 1.5, z + 2.5), mat='dark', bev=0, grp=grp)
        K.box((2.4, .5, .65), (cx + 2.1, cy + 1.5, z + 3.2), mat='dark', bev=.05, grp=grp)
        K.cylx(.14, 3.0, (cx + 4.6, cy + 1.5, z + 3.3), 'dark', 6, 0, grp=grp)


def gun_barrel(K, x0, y, z, L, r, grp, brake=True):
    """main gun from the mantlet face at x0 forward: sleeve, fume extractor, bands, muzzle brake"""
    K.cylx(r * 1.2, 5.0, (x0 + 2.5, y, z), 'gun', 20, .1, grp=grp)
    K.cylx(r, L - 5, (x0 + 5 + (L - 5) / 2, y, z), 'gun', 18, .05, grp=grp, r2=r * .92)
    fx = x0 + 5 + (L - 5) * .3
    K.cylx(r * 1.1, .8, (fx - 1.6, y, z), 'gun', 18, .06, grp=grp, r2=r * 1.65)
    K.cylx(r * 1.65, 2.4, (fx, y, z), 'gun', 20, .1, grp=grp)
    K.cylx(r * 1.65, .8, (fx + 1.6, y, z), 'gun', 18, .06, grp=grp, r2=r * 1.1)
    for f in (.12, .62, .82):
        K.cylx(r * 1.08, .28, (x0 + 5 + (L - 5) * f, y, z), 'dark', 16, 0, grp=grp)
    if brake:
        K.box((2.8, r * 2.6, r * 2.2), (x0 + L + .6, y, z), mat='gun', bev=.25, grp=grp)
        for dx in (-.5, .6):
            K.box((.55, r * 2.7, r * 1.2), (x0 + L + .6 + dx, y, z), mat='dark', bev=0, grp=grp)
        K.cylx(r * .5, .3, (x0 + L + 2.05, y, z), 'dark', 12, 0, grp=grp)


# =====================================================================
def build_htank():
    """Citadel heavy tank: wide six-wheel tracks, thick slab hull, big turret with twin guns and a roof missile pod"""
    K = Kit(); T = 'turret'
    WX = [-16, -9.6, -3.2, 3.2, 9.6, 16]
    for s in (-1, 1):
        tracks(K, s * 14.0, WX, 3.8, 2.9, (-20.4, 5.8, 2.5), (20.6, 5.4, 2.3), 10.0)
    K.prism([(-20.6, 3.6), (18, 3.6), (22.6, 7.6), (22.8, 10.4), (-21.2, 10.4), (-21.6, 5.4)], 17.0, mat='gun', bev=.4)
    hl = []
    for sy in (-1, 1):
        hl += [(-21.6, sy * 19.4, 10.2), (22.0, sy * 19.4, 10.2), (24.6, sy * 18.0, 11.0), (24.4, sy * 17.6, 11.8),
               (15.0, sy * 18.4, 15.2), (-19.6, sy * 18.4, 15.2), (-22.0, sy * 19.2, 13.6)]
    K.hull([hl], mat='plate2', bev=.5)
    for s in (-1, 1):
        for x0, x1 in ((-21.4, -13.4), (-13.2, -5.2), (-5.0, 3.0), (3.2, 11.2), (11.4, 19.8)):
            K.box((x1 - x0, .8, 5.0), ((x0 + x1) / 2, s * 19.8, 8.0), mat='TEAM', bev=.22)
            for bx in (x0 + 1, (x0 + x1) / 2, x1 - 1):
                K.cyly(.26, .3, (bx, s * 20.25, 9.9), 'steel', 8, 0)
        K.box((5.2, 10.8, .5), (22.0, s * 14.0, 10.0), (0, R(-14), 0), 'gun', .12)
        K.box((.4, 9.6, 2.6), (-22.2, s * 14.0, 8.0), mat='rubber', bev=.05)
    gl, ga = glacis(24.4, 11.8, 15.0, 15.2)
    for f in (.3, .52):
        for y in (-13.0, -11.6, 11.6, 13.0):
            x, z = gl(f, .25); K.box((1.1, 1.25, .4), (x, y, z), (0, ga, 0), 'dark', .06)
    x, z = gl(.1, .05); K.box((1.2, 36.0, .22), (x, 0, z), (0, ga, 0), 'TEAM', 0)
    x, z = gl(.8, .2); K.cyl(1.7, 1.6, .5, (x, 4.2, z), (0, ga, 0), 'gun', 20, .12)
    for dy in (-1.2, 0, 1.2):
        x, z = gl(.6, .35); K.box((.5, .85, .55), (x, 4.2 + dy, z), (0, ga, 0), 'win', .05)
    for s in (-1, 1):
        K.cylx(.85, 1.0, (23.6, s * 15.6, 11.6), 'steel', 14, .08)
        K.cylx(.66, .2, (24.2, s * 15.6, 11.6), 'lamp', 14, 0)
        K.box((1.4, 1.2, 1.0), (23.4, s * 9.0, 8.4), mat='steel', bev=.12)
        K.box((1.2, 1.2, 1.0), (-22.3, s * 9.0, 8.2), mat='steel', bev=.12)
        # engine deck grilles, exhausts
        K.box((9.6, 5.2, .25), (-14.4, s * 14.4, 15.25), mat='dark', bev=0)
        for i in range(11):
            K.box((.34, 4.9, .3), (-18.8 + i * .88, s * 14.4, 15.45), mat='steel', bev=0)
        K.box((1.4, 3.8, 2.2), (-22.6, s * 12.6, 12.6), mat='dark', bev=.15)
        for i in range(4):
            K.box((.2, 3.4, .25), (-23.35, s * 12.6, 11.8 + i * .5), mat='steel', bev=0)
    K.box((1.6, 36.0, .2), (-19.4, 0, 15.3), mat='TEAM', bev=0)
    K.box((1.8, 8.0, 2.2), (-22.0, 0, 13.6), mat='gun', bev=.2)
    K.cylx(.22, 10, (4, -17.0, 15.45), 'rust', 6, 0); K.box((1.6, 1.0, .3), (10.2, -17.0, 15.45), mat='steel', bev=0)
    # ---- turret ----
    K.cyl(9.0, 9.0, .9, (-3, 0, 15.6), mat='dark', segs=40, bev=.1, grp=T)
    tb = []
    for sy in (-1, 1):
        tb += [(13.0, sy * 7.6, 15.8), (9.0, sy * 10.6, 15.8), (-8.0, sy * 11.0, 15.8), (-14.0, sy * 10.0, 15.8), (-15.6, sy * 5.0, 15.8),
               (10.6, sy * 6.4, 22.4), (7.0, sy * 9.4, 22.4), (-8.0, sy * 9.8, 22.4), (-13.0, sy * 8.8, 22.4), (-14.6, sy * 4.4, 22.4)]
    K.hull([tb], mat='TEAM', bev=.45, grp=T)
    for s in (-1, 1):
        K.hull([[(15.6, s * 8.0, 16.2), (10.4, s * 7.8, 16.0), (9.4, s * 11.6, 16.0), (10.4, s * 11.5, 16.0),
                 (14.0, s * 8.0, 21.2), (10.2, s * 7.8, 21.6), (9.0, s * 10.6, 21.6)]], mat='plate2', bev=.3, grp=T)
        K.box((4.4, 4.2, 5.2), (14.8, s * 4.3, 19.4), mat='gun', bev=.4, grp=T)
        gun_barrel(K, 16.8, s * 4.3, 19.6, 19.0, .9, T)
        smoke(K, 6.4, s * 11.0, 19.0, s, T)
        K.box((7.2, 1.4, 3.0), (-5.2, s * 11.5, 18.0), mat='gun', bev=.22, grp=T)
        K.box((7.4, .3, .4), (-5.2, s * 12.25, 19.5), mat='steel', bev=0, grp=T)
        K.cyl(.32, .4, .7, (-12.0, s * 7.2, 22.7), mat='dark', segs=8, bev=0, grp=T)
        K.cyl(.05, .09, 8, (-12.0, s * 7.2, 27.0), mat='dark', segs=5, bev=0, grp=T)
    K.box((3.6, 13.2, 3.2), (13.4, 0, 19.2), mat='gun', bev=.35, grp=T)            # gun cradle between the barrels
    # roof missile pod (left rear) and commander's cupola (right)
    K.box((8.4, 6.2, 4.2), (-7.0, -5.0, 24.4), mat='gun', bev=.3, grp=T)
    K.box((8.0, 6.4, .5), (-7.0, -5.0, 26.6), mat='TEAM', bev=.1, grp=T)
    for i in range(2):
        for j in range(3):
            K.cylx(.7, .3, (-2.7, -6.8 + j * 1.8, 23.6 + i * 1.7), 'orange', 12, 0, grp=T)
    K.box((1.0, 4.0, 1.2), (-7.0, -5.0, 22.8), mat='steel', bev=.08, grp=T)
    cupola(K, -3.0, 5.2, 22.4, T)
    K.box((2.6, 2.2, 1.8), (5.0, 5.8, 23.2), mat='gun', bev=.22, grp=T)
    K.box((.12, 1.6, .9), (6.35, 5.8, 23.3), mat='win', bev=0, grp=T)
    K.box((3.8, 15.0, 2.6), (-16.4, 0, 18.4), mat='gun', bev=.25, grp=T)          # bustle + rack
    rk = [(-14.6, -8.4, 22.6), (-18.6, -7.6, 22.6), (-18.6, 7.6, 22.6), (-14.6, 8.4, 22.6)]
    K.tube(rk, .18, 'steel', 8, grp=T)
    for p in rk: K.cyl(.15, .15, 2.4, (p[0], p[1], 21.4), mat='steel', segs=6, bev=0, grp=T)
    K.cyly(1.1, 11.0, (-16.8, 0, 21.4), 'rust', 14, .1, grp=T)
    for s in (-1, 1): K.empty('muzzle' + ('L' if s < 0 else 'R'), (37.6, s * 4.3, 19.6), T)
    finish(K, 'htank_v', {'body': (0, 0, 0), T: (-3, 0, 15.2)}, cam=(78, -60, 58), tgt=(2, 0, 11))


# =====================================================================
def build_mlrs():
    """Javelin missile carrier: six-wheel armoured truck, angled cab, box launcher on a slewing mount"""
    K = Kit(); T = 'turret'
    for x in (-12.5, -3.5, 11.5):
        for s in (-1, 1):
            tyre(K, x, s * 8.8, 3.7, 3.7, 3.6)
    K.box((33, 9.0, 2.6), (0, 0, 4.8), mat='gun', bev=.25)
    for x in (-12.5, -3.5, 11.5):          # axles + suspension arms
        K.cyly(.6, 14.0, (x, 0, 3.7), 'steel', 10, 0)
        for s in (-1, 1):
            K.box((2.2, 3.0, .8), (x, s * 4.9, 4.3), (R(s * 8), 0, 0), 'dark', .08)
    # fenders over every wheel
    for x in (-12.5, -3.5, 11.5):
        for s in (-1, 1):
            arc = [(math.cos(R(a)) * 4.7, math.sin(R(a)) * 4.7) for a in range(0, 181, 15)] + \
                  [(math.cos(R(a)) * 4.3, math.sin(R(a)) * 4.3) for a in range(180, -1, -15)]
            K.prism(arc, 4.2, (x, s * 8.8, 3.7), mat='TEAM', bev=.08)
    # cab
    cab = []
    for sy in (-1, 1):
        cab += [(7.6, sy * 6.8, 6.0), (18.6, sy * 6.8, 6.0), (20.2, sy * 6.0, 6.6), (20.0, sy * 6.0, 9.4),
                (14.2, sy * 5.8, 14.2), (7.6, sy * 6.2, 14.2)]
    K.hull([cab], mat='TEAM', bev=.35)
    gl, ga = glacis(19.8, 9.4, 14.2, 14.2)
    x, z = gl(.55, .05); K.box((3.4, 10.0, .2), (x, 0, z), (0, ga - R(90) + R(90), 0), 'win', 0)
    for s in (-1, 1):
        K.box((4.0, .2, 2.2), (11.0, s * 6.6, 11.6), mat='win', bev=0)
        K.box((.5, .4, 1.4), (14.8, s * 7.4, 11.4), mat='dark', bev=.05)            # mirrors
        K.cylx(.7, .5, (20.3, s * 4.4, 8.0), 'lamp', 12, 0)
    K.box((1.4, 13.6, 2.4), (21.0, 0, 5.8), mat='gun', bev=.2)                       # bumper
    for k in range(6):
        K.box((.3, .4, 2.0), (20.5, -3.0 + k * 1.2, 8.0), mat='dark', bev=0)
    K.box((4.4, 9.0, .5), (10.0, 0, 14.4), mat='gun', bev=.12)                        # cab roof plate
    K.box((1.2, 3.6, .6), (9.2, 0, 15.0), mat='GLOW', bev=0)
    # rear deck + armoured sides
    K.box((21.5, 13.6, 2.6), (-5.6, 0, 7.4), mat='plate2', bev=.3)
    for s in (-1, 1):
        K.box((20.0, 1.4, 1.8), (-5.6, s * 6.4, 9.4), mat='TEAM', bev=.15)
        K.box((5.0, 1.4, 2.6), (-12.0, s * 7.6, 7.2), mat='gun', bev=.15)            # stowage bins
    K.box((1.2, 12.0, 1.6), (-16.6, 0, 8.6), mat='gun', bev=.12)
    for s in (-1, 1): K.cylx(.5, .2, (-17.3, s * 5.6, 8.6), 'orange', 10, 0)
    # ---- launcher on a slewing ring ----
    K.cyl(4.2, 4.6, 1.6, (-5, 0, 10.0), mat='gun', segs=24, bev=.15, grp=T)
    for s in (-1, 1):
        K.box((2.6, 1.4, 5.0), (-5, s * 6.3, 12.0), mat='gun', bev=.12, grp=T)
    PL = M((-5, 0, 14.6), (0, R(-17), 0))
    K.box((19.0, 12.0, 7.4), (-1, 0, 0), mat='TEAM', bev=.35, grp=T, P=PL)
    K.box((19.4, 12.4, 1.0), (-1, 0, 4.0), mat='gun', bev=.12, grp=T, P=PL)
    K.box((.4, 11.0, 6.6), (8.55, 0, 0), mat='dark', bev=0, grp=T, P=PL)
    for i in range(2):
        for j in range(4):
            K.cylx(1.15, .6, (8.8, -4.2 + j * 2.8, -1.7 + i * 3.4), 'dark', 14, 0, grp=T, P=PL)
            K.cylx(.95, .9, (9.2, -4.2 + j * 2.8, -1.7 + i * 3.4), 'orange', 14, .05, grp=T, P=PL, r2=.2)
    for s in (-1, 1):
        K.box((16.0, .3, .5), (-1, s * 6.1, -1.4), mat='yellow', bev=0, grp=T, P=PL)
        K.box((3.0, .4, 1.4), (-6.5, s * 6.2, 1.6), mat='steel', bev=.06, grp=T, P=PL)
    K.empty('muzzle', (2, 3, 22), T)
    finish(K, 'mlrs_v', {'body': (0, 0, 0), T: (-5, 0, 9.2)}, cam=(62, -50, 42), tgt=(1, 0, 8))


# =====================================================================
def build_buggy():
    """Pathfinder rover: fast four-wheel scout, wedge tub, bubble canopy, roll cage, rear twin-MG mount"""
    K = Kit(); T = 'turret'
    for x in (-8.2, 8.2):
        for s in (-1, 1):
            tyre(K, x, s * 8.4, 3.9, 3.9, 4.0, hub='TEAM')
    K.prism([(-11, 3.0), (10, 3.0), (15.2, 4.6), (14.0, 6.4), (1, 9.2), (-9, 9.6), (-11.6, 6.8)], 10.6, mat='TEAM', bev=.4)
    K.box((22, 8.0, 1.6), (0, 0, 3.4), mat='gun', bev=.15)
    for x in (-8.2, 8.2):          # double wishbones + coilover
        for s in (-1, 1):
            for z in (3.0, 5.2):
                K.tube([(x - 1.2, s * 4.4, z), (x, s * 6.6, 3.9 + (z - 4) * .3), (x + 1.2, s * 4.4, z)], .22, 'steel', 6)
            K.tube([(x, s * 6.4, 4.2), (x - .8 * (1 if x > 0 else -1), s * 4.8, 8.6)], .4, 'TEAM', 8)
            arc = [(math.cos(R(a)) * 5.0, math.sin(R(a)) * 5.0) for a in range(-10, 191, 20)] + \
                  [(math.cos(R(a)) * 4.6, math.sin(R(a)) * 4.6) for a in range(190, -11, -20)]
            K.prism(arc, 4.4, (x, s * 8.4, 3.9), mat='gun', bev=.06)
    # canopy + frame, roll cage
    K.sphere(3.1, (3.6, 0, 9.0), 'win', 20, scl=(1.55, 1.05, .8))
    K.tube(ring_pts(3.6, 0, 3.15, 9.0, 24), .22, 'gun', 6)
    for s in (-1, 1):
        K.tube([(-2.5, s * 4.6, 9.4), (-3.0, s * 4.0, 13.2), (-6.5, s * 4.0, 13.2), (-8.6, s * 4.6, 9.6)], .3, 'steel', 8)
        K.cylx(.6, .4, (15.0, s * 3.4, 6.0), 'lamp', 12, 0)
        K.box((5.0, .4, .5), (-5.0, s * 5.4, 9.9), mat='dark', bev=0)
    K.tube([(-3.0, -4.0, 13.2), (-3.0, 4.0, 13.2)], .3, 'steel', 8)
    K.tube([(15.8, -4.8, 4.0), (16.4, -3.0, 6.4), (16.4, 3.0, 6.4), (15.8, 4.8, 4.0)], .3, 'steel', 8)      # bull bar
    # rear engine + spare tyre + exhausts
    K.box((4.4, 8.0, 3.6), (-10.4, 0, 8.0), mat='gun', bev=.25)
    for i in range(5): K.box((.3, 7.0, .25), (-12.4 + i * 1.0, 0, 9.9), mat='steel', bev=0)
    tyre(K, -13.6, 0, 7.4, 2.4, 2.2, lugs=10) if False else None
    K.cylx(2.6, 1.8, (-13.4, 0, 7.6), 'rubber', 20, .3); K.cylx(1.4, 2.0, (-13.4, 0, 7.6), 'steel', 14, .1)
    for s in (-1, 1): K.cylx(.45, 3.0, (-12.0, s * 3.4, 5.0), 'dark', 10, 0)
    # ---- twin MG mount ----
    K.cyl(2.4, 2.6, 1.0, (-5, 0, 10.9), mat='gun', segs=18, bev=.1, grp=T)
    K.box((4.6, 3.0, 2.2), (-4.0, 0, 13.0), mat='gun', bev=.2, grp=T)
    K.box((.5, 5.6, 3.6), (-1.6, 0, 13.6), mat='TEAM', bev=.12, grp=T)
    for s in (-1, 1):
        K.box((3.6, .9, 1.0), (-2.2, s * 1.0, 13.6), mat='dark', bev=.06, grp=T)
        K.cylx(.24, 8.6, (4.6, s * 1.0, 13.6), 'dark', 8, 0, grp=T)
        K.cylx(.42, 1.6, (8.2, s * 1.0, 13.6), 'gun', 10, .05, grp=T)
    K.box((1.8, 1.4, 1.4), (-5.4, 2.2, 12.6), mat='olive' if False else 'gun', bev=.08, grp=T)
    K.empty('muzzle', (9.2, 0, 13.6), T)
    finish(K, 'buggy_v', {'body': (0, 0, 0), T: (-5, 0, 10.4)}, res=(1024, 256), cam=(46, -36, 32), tgt=(1, 0, 6))


# =====================================================================
def build_arty():
    """Longbow self-propelled gun: tracked chassis, big boxy turret, very long elevated barrel"""
    K = Kit(); T = 'turret'
    WX = [-15, -9, -3, 3, 9, 15]
    for s in (-1, 1):
        tracks(K, s * 12.0, WX, 3.3, 2.6, (-18.8, 5.0, 2.2), (18.8, 4.6, 2.0), 7.4)
    K.prism([(-19.0, 3.0), (16.0, 3.0), (20.2, 6.6), (20.2, 8.8), (-19.6, 8.8), (-19.8, 4.6)], 15.0, mat='gun', bev=.35)
    hl = []
    for sy in (-1, 1):
        hl += [(-19.8, sy * 16.0, 8.6), (19.8, sy * 16.0, 8.6), (22.0, sy * 15.0, 9.4), (14.0, sy * 15.0, 13.0), (-18.0, sy * 15.0, 13.0), (-20.2, sy * 15.8, 11.4)]
    K.hull([hl], mat='plate2', bev=.45)
    for s in (-1, 1):
        for x0, x1 in ((-19.0, -10.4), (-10.2, -1.6), (-1.4, 7.2), (7.4, 17.4)):
            K.box((x1 - x0, .7, 4.0), ((x0 + x1) / 2, s * 16.3, 7.0), mat='TEAM', bev=.2)
        K.box((4.4, 8.0, .45), (19.6, s * 12.0, 8.2), (0, R(-14), 0), 'gun', .12)
        K.cylx(.75, .9, (21.2, s * 12.6, 10.2), 'steel', 14, .08); K.cylx(.58, .2, (21.7, s * 12.6, 10.2), 'lamp', 14, 0)
        K.box((6.0, 3.4, 2.2), (-12.0, s * 13.0, 14.1), mat='gun', bev=.2)            # ammo lockers
    gl, ga = glacis(22.0, 9.4, 14.0, 13.0)
    x, z = gl(.12, .05); K.box((1.2, 30.0, .22), (x, 0, z), (0, ga, 0), 'TEAM', 0)
    # travel lock + folded recoil spade at the rear
    K.box((2.0, 26.0, 1.2), (-21.0, 0, 6.0), (0, R(-50), 0), 'gun', .15)
    for s in (-1, 1): K.box((3.2, 1.0, 1.0), (-19.6, s * 11.0, 7.4), (0, R(-30), 0), 'steel', .08)
    # ---- turret ----
    K.cyl(8.0, 8.0, .8, (0, 0, 13.4), mat='dark', segs=40, bev=.1, grp=T)
    tb = []
    for sy in (-1, 1):
        tb += [(9.6, sy * 7.6, 13.6), (-10.0, sy * 8.6, 13.6), (-13.4, sy * 6.6, 13.6),
               (6.6, sy * 6.8, 21.6), (-9.4, sy * 7.6, 21.6), (-12.6, sy * 5.8, 21.6)]
    K.hull([tb], mat='TEAM', bev=.45, grp=T)
    for s in (-1, 1):
        K.box((8.0, 1.2, 3.2), (-3.0, s * 8.6, 17.0), mat='gun', bev=.2, grp=T)
        K.box((.4, .4, 7.0), (-8.0, s * 8.3, 17.2), mat='steel', bev=0, grp=T)
        K.cyl(.05, .09, 9, (-10.5, s * 5.2, 26.2), mat='dark', segs=5, bev=0, grp=T)
    cupola(K, -5.0, -3.6, 21.6, T)
    K.cyl(1.5, 1.45, .4, (-4.4, 3.8, 21.8), mat='gun', segs=20, bev=.1, grp=T)
    for i in range(6):
        K.box((.25, 11.6, .25), (-12.0 + i * .9, 0, 21.9), mat='dark', bev=0, grp=T)
    PB = M((4.0, 0, 17.5), (0, R(-20), 0))                # elevated gun assembly
    K.box((7.0, 6.0, 5.0), (1.0, 0, 0), mat='gun', bev=.4, grp=T, P=PB)
    K.cylx(.75, 12.0, (7.5, 0, 2.2), 'steel', 14, .05, grp=T, P=PB)                      # recuperators
    K.cylx(.75, 12.0, (7.5, 0, -2.0), 'steel', 14, .05, grp=T, P=PB)
    K.cylx(1.5, 6.0, (6.5, 0, 0), 'gun', 20, .1, grp=T, P=PB)
    K.cylx(1.05, 20.0, (19.0, 0, 0), 'gun', 18, .05, grp=T, P=PB, r2=.95)
    K.cylx(1.15, .8, (13.0, 0, 0), 'gun', 18, .06, grp=T, P=PB, r2=1.75)
    K.cylx(1.75, 3.0, (14.9, 0, 0), 'gun', 20, .1, grp=T, P=PB)
    K.cylx(1.75, .8, (16.8, 0, 0), 'gun', 18, .06, grp=T, P=PB, r2=1.15)
    for xx in (11.0, 22.0, 26.0):
        K.cylx(1.12, .3, (xx, 0, 0), 'dark', 16, 0, grp=T, P=PB)
    K.box((3.6, 3.0, 2.6), (30.2, 0, 0), mat='gun', bev=.3, grp=T, P=PB)
    for dx in (-.8, .5): K.box((.6, 3.1, 1.3), (30.2 + dx, 0, 0), mat='dark', bev=0, grp=T, P=PB)
    K.empty('muzzle', (30, 0, 27), T)
    finish(K, 'arty_v', {'body': (0, 0, 0), T: (0, 0, 13)}, cam=(72, -58, 52), tgt=(4, 0, 12))


# =====================================================================
def build_harv():
    """Crystal harvester: tracked hauler, cutter drum + hood at the front, conveyor, cab, open ore hopper"""
    K = Kit()
    WX = [-12, -6, 0, 6, 12]
    for s in (-1, 1):
        tracks(K, s * 12.0, WX, 3.5, 2.8, (-15.8, 5.0, 2.3), (15.8, 4.6, 2.1), 7.4)
    K.prism([(-16.2, 3.0), (13.0, 3.0), (16.6, 6.4), (16.6, 9.4), (-16.6, 9.4), (-17.0, 4.6)], 15.0, mat='gun', bev=.35)
    K.box((32.0, 31.0, 2.6), (-.4, 0, 10.4), mat='plate2', bev=.35)
    for s in (-1, 1):
        for x0, x1 in ((-16.0, -6.6), (-6.4, 3.0), (3.2, 13.6)):
            K.box((x1 - x0, .7, 3.8), ((x0 + x1) / 2, s * 15.9, 7.6), mat='TEAM', bev=.2)
    # cutter drum + teeth, hood, side arms
    K.cyly(3.6, 22.0, (19.6, 0, 4.8), 'steel', 20, .15)
    for k in range(8):
        a = 2 * math.pi * k / 8
        for j in range(7):
            y = -9.0 + j * 3.0 + (1.5 if k % 2 else 0)
            if abs(y) > 10.4: continue
            K.cyl(.45, .05, 1.6, (19.6 + math.cos(a) * 3.9, y, 4.8 + math.sin(a) * 3.9), (0, R(90) - a, 0), 'spike' if False else 'steel', 6, 0)
    hood = [(math.cos(R(a)) * 5.4, math.sin(R(a)) * 5.4) for a in range(55, 186, 13)] + [(math.cos(R(a)) * 4.8, math.sin(R(a)) * 4.8) for a in range(185, 54, -13)]
    K.prism(hood, 23.0, (19.6, 0, 4.8), (0, 0, 0), 'TEAM', .1)
    for s in (-1, 1):
        K.box((6.0, 1.2, 3.6), (17.0, s * 11.8, 5.4), mat='gun', bev=.2)
        K.cyly(1.2, 1.4, (19.6, s * 12.0, 4.8), 'dark', 12, .05)
    K.box((1.0, 24.0, 1.2), (14.6, 0, 9.9), mat='haz', bev=.05)
    # conveyor from the drum up into the hopper (right side)
    PC = M((10.0, 5.6, 11.6), (0, R(28), 0))
    K.box((17.0, 4.2, 1.2), (0, 0, 0), mat='gun', bev=.15, P=PC)
    for i in range(9): K.cyly(.4, 4.0, (-7.6 + i * 1.9, 0, .7), 'steel', 8, 0, P=PC)
    for s in (-1, 1): K.box((17.0, .3, 1.4), (0, s * 2.15, .9), mat='TEAM', bev=0, P=PC)
    # cab (front left)
    cab = []
    for sy in (-1, 1):
        y0 = -6.0 + sy * 4.4
        cab += [(4.0, y0, 11.6), (14.4, y0, 11.6), (15.4, y0 * .98, 15.0), (13.0, y0 * .96, 20.0), (4.0, y0 * .96, 20.0)]
    K.hull([cab], mat='TEAM', bev=.35)
    K.box((.25, 8.0, 3.0), (14.6, -6.0, 17.0), (0, R(-25), 0), 'win', 0)
    for s in (-1, 1): K.box((5.6, .25, 2.4), (9.4, -6.0 + s * 4.3, 17.2), mat='win', bev=0)
    K.box((8.0, 7.6, .5), (8.6, -6.0, 20.3), mat='gun', bev=.12)
    for y in (-8.4, -3.6): K.box((.8, .8, .6), (12.0, y, 20.8), mat='GLOW', bev=0)
    K.cylx(.6, .4, (15.8, -9.4, 14.0), 'lamp', 12, 0); K.cylx(.6, .4, (15.8, -2.6, 14.0), 'lamp', 12, 0)
    # ore hopper (open top; the crystal load is added by the game)
    HX0, HX1, HY = -14.6, 3.4, 7.6
    K.box((HX1 - HX0, 2 * HY, .6), ((HX0 + HX1) / 2, 0, 11.9), mat='dark', bev=0)
    for s in (-1, 1):
        K.box((HX1 - HX0, .9, 6.6), ((HX0 + HX1) / 2, s * HY, 15.0), mat='gun', bev=.2)
        K.box((HX1 - HX0 + .4, 1.1, 1.0), ((HX0 + HX1) / 2, s * HY, 17.8), mat='TEAM', bev=.12)
        for i in range(5): K.box((.6, .5, 6.4), (HX0 + 1.5 + i * (HX1 - HX0 - 3) / 4, s * (HY + .55), 14.9), mat='steel', bev=0)
    for x in (HX0, HX1):
        K.box((.9, 2 * HY + .9, 6.6), (x, 0, 15.0), mat='gun', bev=.2)
    K.box((1.0, 2 * HY + 1.3, 1.0), (HX0, 0, 17.8), mat='TEAM', bev=.12)
    # exhaust stack + rear details
    K.cyl(1.4, 1.6, 12.0, (-1.0, 11.4, 17.0), mat='dark', segs=16, bev=.1)
    K.cyl(1.7, 1.7, .5, (-1.0, 11.4, 23.0), mat='orange', segs=16, bev=.05)
    for s in (-1, 1): K.cylx(.5, .2, (-17.4, s * 9.0, 9.0), 'orange', 10, 0)
    K.box((1.2, 20.0, 1.6), (-17.2, 0, 8.4), mat='gun', bev=.12)
    K.empty('bin', (-5.6, 0, 12.6))
    finish(K, 'harv_v', {'body': (0, 0, 0)}, cam=(66, -54, 48), tgt=(1, 0, 9))


reset()
{'htank': build_htank, 'mlrs': build_mlrs, 'buggy': build_buggy, 'arty': build_arty, 'harv': build_harv}[sys.argv[1]]()
print('done')
