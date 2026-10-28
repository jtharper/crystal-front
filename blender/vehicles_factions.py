"""Iron Syndicate and Helix vehicles (original designs).
Run: python3 vehicles_factions.py <key> [--nopreview]
  keys: htank_s mlrs_s buggy_s arty_s harv_s stank_s  htank_h mlrs_h buggy_h arty_h harv_h
Game coordinates: +X forward, Z up. Turret pivots match the code-built models.
Empties: 'muzzle' (+L/R), 'emblem' (body) or 'emblemT' (turret top), 'bin' for harvesters."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *
from mathutils import Vector

PAL['spike'] = ((.55, .58, .56), .85, .25, 0)
PAL['crys'] = ((.7, .36, .95), 0, .25, 1.6)
SYN_TEAM = ((.55, .07, .05), .45, .5, 0)
HEL_TEAM = ((.05, .42, .38), .45, .45, 0)


# ---------------- shared helpers ----------------
def glacis(x0, z0, x1, z1):
    a = math.atan2(z1 - z0, x0 - x1)
    return (lambda f, h=0: (x0 + (x1 - x0) * f + math.sin(a) * h, z0 + (z1 - z0) * f + math.cos(a) * h)), a


def octa(K, x, y, z, r, sz=1.0, mat='crys', grp='body'):
    K.hull([[(x + r, y, z), (x - r, y, z), (x, y + r, z), (x, y - r, z), (x, y, z + r * sz), (x, y, z - r * sz)]], mat=mat, bev=0, grp=grp)


def spike(K, base, d, L, r, grp='body', mat='spike', segs=6):
    """cone from base pointing along d"""
    d = Vector(d).normalized(); b = Vector(base)
    rot = d.to_track_quat('Z', 'Y').to_euler()
    K.cyl(r, .04, L, tuple(b + d * L / 2), tuple(rot), mat, segs, 0, grp)


def strut(K, a, b, r, mat='steel', grp='body'):
    K.tube([a, b], r, mat, 8, grp=grp)


def smoke(K, x, y, z, s, grp):
    K.box((3.0, 1.2, .9), (x, y, z), mat='gun', bev=.1, grp=grp)
    for i in range(4):
        K.cyl(.34, .34, 1.4, (x - 1.1 + i * .72, y + s * .4, z + .7), (s * R(-30), R(35), 0), 'dark', 10, 0, grp=grp)


def bolts(K, x0, x1, y, z, n, axis='y', grp='body'):
    for i in range(n):
        x = x0 + (x1 - x0) * i / max(1, n - 1)
        if axis == 'y': K.cyly(.3, .5, (x, y, z), 'steel', 6, 0, grp=grp)
        else: K.cyl(.3, .3, .4, (x, y, z), mat='steel', segs=6, bev=0, grp=grp)


def hopper(K, wall='gun', trim='TEAM', ribs='steel'):
    """standard open ore hopper; the game fills it with the crystal load (bin x=-5.6, floor ~12.6)"""
    HX0, HX1, HY = -14.6, 3.4, 7.6
    K.box((HX1 - HX0, 2 * HY, .6), ((HX0 + HX1) / 2, 0, 11.9), mat='dark', bev=0)
    for s in (-1, 1):
        K.box((HX1 - HX0, .9, 6.6), ((HX0 + HX1) / 2, s * HY, 15.0), mat=wall, bev=.2)
        K.box((HX1 - HX0 + .4, 1.1, 1.0), ((HX0 + HX1) / 2, s * HY, 17.8), mat=trim, bev=.12)
        for i in range(5): K.box((.6, .5, 6.4), (HX0 + 1.5 + i * (HX1 - HX0 - 3) / 4, s * (HY + .55), 14.9), mat=ribs, bev=0)
    for x in (HX0, HX1):
        K.box((.9, 2 * HY + .9, 6.6), (x, 0, 15.0), mat=wall, bev=.2)
    K.box((1.0, 2 * HY + 1.3, 1.0), (HX0, 0, 17.8), mat=trim, bev=.12)
    K.empty('bin', (-5.6, 0, 12.6))


def syn_skirts(K, x0, x1, y, z, h, n, tilt=9):
    """riveted, slanted team-colour armour skirts in n panels on both sides"""
    w = (x1 - x0) / n
    for s in (-1, 1):
        for i in range(n):
            a, b = x0 + i * w + .1, x0 + (i + 1) * w - .1
            K.box((b - a, .9, h), ((a + b) / 2, s * y, z), (s * R(-tilt), 0, 0), 'TEAM', .2)
            for bx in (a + .9, (a + b) / 2, b - .9):
                for bz in (z - h / 2 + .7, z + h / 2 - .7):
                    K.cyly(.32, .5, (bx, s * (y + .45 + (bz - z) * math.tan(R(tilt))), bz), 'steel', 8, 0)


def hel_running(K, yc, L, WX, WR, WZ=None, TW=6.4, link=1.0):
    """Helix running gear: thin track round big exposed wheels, sculpted fender with a glow strip and ceramic top"""
    WZ = WZ or WR + .3
    s = 1 if yc > 0 else -1
    h = L / 2
    tracks(K, yc, WX, WZ, WR, (-h + 1.6, WZ + 1.2, 2.0), (h - 1.6, WZ + 1.2, 2.0), TW, link=link)
    top = WZ + WR + 3.3
    fp = [(-h - 1.4, top - 2.8), (-h - .6, top - .8), (-h + 4, top), (h - 4, top), (h + .4, top - 1.0), (h + 1.4, top - 3.0), (h - 1, top - 2.6), (-h + 2, top - 2.2)]
    K.prism(fp, TW + 1.6, (0, yc, 0), mat='TEAM', bev=.45)
    K.box((L * .72, .3, .5), (-.5, yc + s * (TW / 2 + .85), top - 1.6), mat='GLOW', bev=0)
    K.box((L * .8, TW - 1.6, .4), (-1.0, yc, top + .15), mat='ceram', bev=.12)
    for x in [(-L * .3) + i * (L * .6 / 3) for i in range(4)]:
        K.box((.4, TW - 1.4, .3), (x, yc, top + .35), mat='dark', bev=0)
    return top


def hel_hull(K, x0, x1, w, z0, z1, mat='TEAM', bev=.6):
    """smooth lozenge hull from stacked loops"""
    L = x1 - x0
    prof = [(0, .62, .3, .72), (.08, .94, .15, .9), (.35, 1, .0, 1), (.7, .98, .0, .98), (.9, .86, .1, .88), (1, .64, .35, .62)]
    loops = []
    for f, ww, zb, zt in prof:
        x = x0 + L * f
        loops.append([(x, sy * w * ww, z) for sy in (-1, 1) for z in (z0 + (z1 - z0) * zb * .5, z0 + (z1 - z0) * zt)])
    K.hull(loops, mat=mat, bev=bev)


def team(pal):
    PAL['TEAM'] = pal


# =====================================================================
# IRON SYNDICATE
# =====================================================================
def htank_s():
    """Juggernaut: four tracks, slab hull, wide spiked dozer, huge twin-gun turret with rocket pod and exhaust"""
    team(SYN_TEAM); K = Kit(); T = 'turret'
    for s in (-1, 1):
        tracks(K, s * 15.4, [-17, -11.3, -5.7, 0, 5.7, 11.3, 17], 3.0, 2.4, (-20.6, 5.0, 2.2), (20.4, 4.7, 2.0), 6.4, link=1.15)
        tracks(K, s * 8.6, [-15, -5, 5, 15], 3.0, 2.4, (-20.6, 5.0, 2.2), (20.4, 4.7, 2.0), 6.2, link=1.8)
    K.prism([(-21.2, 2.6), (18.2, 2.6), (22.8, 6.8), (22.8, 9.6), (-21.8, 9.6), (-22.4, 5.2)], 11.0, mat='gun', bev=.3)
    hl = []
    for sy in (-1, 1):
        hl += [(-22.4, sy * 19.6, 9.2), (20.4, sy * 19.6, 9.2), (24.0, sy * 17.6, 10.6), (16.6, sy * 15.0, 15.8),
               (-19.4, sy * 15.0, 15.8), (-22.8, sy * 18.2, 13.4)]
    K.hull([hl], mat='gun', bev=.4)
    syn_skirts(K, -22.2, 21.4, 20.1, 7.0, 5.8, 5)
    for s in (-1, 1):
        K.box((20.0, .5, .6), (-1, s * 19.6, 10.1), mat='rust', bev=.05)
        K.box((5.0, 13.0, .5), (22.2, s * 12.4, 10.1), (0, R(-18), 0), 'gun', .12)
        K.cylx(1.0, 1.2, (23.4, s * 14.6, 11.4), 'steel', 14, .08)
        K.cylx(.76, .2, (24.05, s * 14.6, 11.4), 'lamp', 14, 0)
        K.cyly(1.9, 2.6, (-17.4, s * 17.2, 15.9), 'rust', 14, .12)
        for dy in (-.8, .8): K.cyly(1.98, .2, (-17.4, s * 17.2 + dy, 15.9), 'dark', 14, 0)
    gl, ga = glacis(24.0, 10.6, 16.6, 15.8)
    for f in (.2, .5, .8):
        x, z = gl(f, .1); K.box((.35, 29.0, .2), (x, 0, z), (0, ga, 0), 'dark', 0)
    for y in (-12, -6, 0, 6, 12):
        x, z = gl(.35, .25); K.cyl(.5, .45, .5, (x, y, z), (0, ga, 0), 'steel', 6, 0)
    # dozer
    K.prism([(21.2, 1.2), (24.8, 1.2), (28.6, 9.0), (25.0, 9.0)], 38.0, mat='TEAM', bev=.3)
    K.prism([(24.5, .8), (25.5, .8), (29.2, 9.0), (28.2, 9.0)], 38.6, mat='gun', bev=.15)
    for y in range(-17, 18, 4):
        K.box((.25, 1.8, 7.6), (26.8, y, 5.0), (R(25), R(-25), 0), 'haz', 0)
    for y in (-16.5, -11, -5.5, 0, 5.5, 11, 16.5):
        spike(K, (28.6, y, 5.6), (1, 0, .05), 5.0, 1.15)
        K.cylx(1.3, .8, (28.6, y, 5.6), 'steel', 8, .05)
    for s in (-1, 1):
        K.tube([(17.6, s * 11.0, 10.4), (24.6, s * 11.0, 6.0)], .65, 'steel', 10)
        K.cyl(1.2, 1.2, 1.6, (17.6, s * 11.0, 10.4), (R(90), 0, 0), 'gun', 12, .1)
    # engine deck
    K.box((11.0, 15.0, .3), (-14.6, 0, 15.9), mat='dark', bev=0)
    for i in range(12): K.box((.35, 14.6, .35), (-19.6 + i * .9, 0, 16.1), mat='steel', bev=0)
    for s in (-1, 1):
        K.cyl(1.5, 1.7, 7.0, (-20.8, s * 8.0, 18.8), mat='rust', segs=14, bev=.1)
        K.cyl(1.85, 1.85, .7, (-20.8, s * 8.0, 22.1), mat='dark', segs=14, bev=.05)
    K.box((1.4, 36.0, .25), (-19.6, 0, 15.85), mat='TEAM', bev=0)
    # ---- turret pivot (-2,0,16) ----
    TX, TZ = -2.0, 16.0
    K.cyl(10.5, 10.5, 1.0, (TX, 0, TZ - .2), mat='dark', segs=40, bev=.1, grp=T)
    tb = []
    for sy in (-1, 1):
        tb += [(TX + 15.6, sy * 5.4, TZ), (TX + 10.0, sy * 11.6, TZ), (TX - 12.6, sy * 11.8, TZ), (TX - 15.6, sy * 7.8, TZ),
               (TX + 11.4, sy * 4.6, TZ + 8.4), (TX + 7.2, sy * 9.6, TZ + 8.4), (TX - 10.8, sy * 9.8, TZ + 8.4), (TX - 13.8, sy * 6.4, TZ + 7.0)]
    K.hull([tb], mat='TEAM', bev=.45, grp=T)
    cap = []
    for sy in (-1, 1):
        cap += [(TX + 9.2, sy * 4.0, TZ + 8.3), (TX + 6.0, sy * 8.4, TZ + 8.3), (TX - 9.6, sy * 8.6, TZ + 8.3),
                (TX + 7.0, sy * 3.2, TZ + 10.4), (TX + 4.0, sy * 7.0, TZ + 10.4), (TX - 8.0, sy * 7.2, TZ + 10.4)]
    K.hull([cap], mat='gun', bev=.3, grp=T)
    GZ = TZ + 4.4
    K.box((5.4, 14.0, 6.0), (TX + 16.4, 0, GZ - .2), mat='gun', bev=.5, grp=T)
    for y in (-4.2, 4.2):
        K.box((3.0, 3.8, 4.2), (TX + 20.0, y, GZ), mat='gun', bev=.3, grp=T)
        K.cylx(1.3, 7.0, (TX + 24.6, y, GZ), 'gun', 18, .1, grp=T)
        K.cylx(1.05, 19.0, (TX + 37.4, y, GZ), 'steel', 16, .05, grp=T, r2=.98)
        K.cylx(1.85, 2.6, (TX + 29.6, y, GZ), 'gun', 18, .1, grp=T)
        for x in (TX + 23.0, TX + 33.5, TX + 42.0): K.cylx(1.2, .35, (x, y, GZ), 'dark', 16, 0, grp=T)
        K.box((4.6, 3.0, 3.0), (TX + 48.6, y, GZ), mat='gun', bev=.3, grp=T)
        for dx in (-1.1, .5): K.box((.7, 3.1, 1.6), (TX + 48.6 + dx, y, GZ), mat='dark', bev=0, grp=T)
        K.cylx(.5, .3, (TX + 51.0, y, GZ), 'dark', 10, 0, grp=T)
    K.box((10.0, 4.6, 5.4), (TX - 2.0, -14.0, TZ + 5.0), mat='gun', bev=.3, grp=T)
    K.box((10.2, 4.8, .5), (TX - 2.0, -14.0, TZ + 7.9), mat='TEAM', bev=.1, grp=T)
    for yy in (-15.2, -12.8):
        for zz in (TZ + 3.8, TZ + 6.2):
            K.cylx(.85, .6, (TX + 3.1, yy, zz), 'dark', 10, 0, grp=T)
            K.cylx(.7, 1.6, (TX + 3.8, yy, zz), 'orange', 10, 0, grp=T, r2=.1)
    K.cyl(1.7, 2.0, 9.0, (TX - 11.0, 6.0, TZ + 12.0), mat='dark', segs=12, bev=.1, grp=T)
    K.cyl(2.0, 2.0, .7, (TX - 11.0, 6.0, TZ + 16.5), mat='orange', segs=12, bev=.05, grp=T)
    K.cyl(2.2, 2.0, 1.2, (TX - 2.5, -3.2, TZ + 11.0), mat='gun', segs=20, bev=.15, grp=T)
    for y in (-8, -4, 0, 4, 8):
        spike(K, (TX - 14.6, y, TZ + 5.0), (-1, 0, .55), 5.0, 1.0, grp=T)
    for s in (-1, 1):
        spike(K, (TX - 9.0, s * 9.4, TZ + 8.6), (-.4, s * .6, .7), 5.0, 1.0, grp=T)
        spike(K, (TX - 3.0, s * 9.8, TZ + 8.6), (0, s * .6, .8), 4.6, .95, grp=T)
    K.empty('muzzleL', (TX + 51.2, -4.2, GZ), T); K.empty('muzzleR', (TX + 51.2, 4.2, GZ), T)
    K.empty('emblemT', (TX - 1.0, 3.6, TZ + 10.45), T)
    return K, 'htank_s', {'body': (0, 0, 0), T: (TX, 0, TZ)}, dict(cam=(100, -78, 70), tgt=(8, 0, 10))


def mlrs_s():
    """Hellstorm: half-track with spiked armoured cab and a tall eight-tube rocket rack"""
    team(SYN_TEAM); K = Kit(); T = 'turret'
    for s in (-1, 1):
        tracks(K, s * 8.8, [-13, -6.5, 0], 3.0, 2.4, (-16.4, 4.6, 2.0), (3.4, 4.4, 2.0), 6.6, link=1.1)
        tyre(K, 12.0, s * 8.8, 3.9, 3.9, 4.4)
        arc = [(math.cos(R(a)) * 5.1, math.sin(R(a)) * 5.1) for a in range(0, 181, 15)] + [(math.cos(R(a)) * 4.6, math.sin(R(a)) * 4.6) for a in range(180, -1, -15)]
        K.prism(arc, 4.8, (12.0, s * 8.8, 3.9), mat='gun', bev=.08)
        K.box((21.0, 7.4, .6), (-6.6, s * 8.8, 8.5), mat='gun', bev=.15)
        K.box((20.0, .8, 3.0), (-6.6, s * 12.6, 7.0), (s * R(-8), 0, 0), 'TEAM', .15)
        bolts(K, -15.5, 2.5, s * 13.1, 7.0, 6)
    K.prism([(-17.6, 3.0), (14.6, 3.0), (17.8, 5.8), (17.0, 9.4), (-16.4, 9.4), (-18.2, 6.0)], 13.4, mat='gun', bev=.3)
    cab = []
    for sy in (-1, 1):
        cab += [(6.4, sy * 6.8, 9.2), (16.0, sy * 6.8, 9.2), (18.4, sy * 6.0, 11.4), (14.6, sy * 5.6, 17.6), (6.4, sy * 6.0, 17.6)]
    K.hull([cab], mat='TEAM', bev=.3)
    gl, ga = glacis(18.4, 11.4, 14.6, 17.6)
    x, z = gl(.55, .05); K.box((2.0, 9.4, .2), (x, 0, z), (0, ga, 0), 'win', 0)
    for k in range(5):
        x, z = gl(.55, .25); K.box((.35, .35, 2.4), (x, -3.6 + k * 1.8, z), (0, ga, 0), 'dark', 0)
    K.box((6.6, 11.0, .5), (10.0, 0, 17.8), mat='gun', bev=.12)
    for s in (-1, 1):
        spike(K, (8.0, s * 4.6, 17.9), (-.4, s * .5, .8), 4.6, .9)
        K.cylx(.6, .4, (18.3, s * 4.8, 10.6), 'lamp', 12, 0)
    for y in (-5, -2.5, 0, 2.5, 5):
        spike(K, (18.6, y, 7.2), (1, 0, 0), 3.8, .8)
    K.box((1.6, 13.4, 2.6), (18.0, 0, 6.4), mat='rust', bev=.2)
    K.cyl(1.0, 1.2, 9.0, (2.8, -6.0, 13.6), mat='rust', segs=12, bev=.1)
    K.cyl(1.3, 1.3, .5, (2.8, -6.0, 18.2), mat='dark', segs=12, bev=.05)
    K.empty('emblem', (-14.0, 0, 9.45))
    # ---- launcher pivot (-7,0,10.6) ----
    TX, TZ = -7.0, 10.6
    K.cyl(4.4, 4.8, 2.0, (TX, 0, TZ + 1.0), mat='gun', segs=8, bev=.15, grp=T)
    K.box((4.4, 9.4, 5.0), (TX, 0, TZ + 4.4), mat='TEAM', bev=.25, grp=T)
    PL = M((TX, 0, TZ + 7.6), (0, R(-29), 0))
    K.box((17.0, 11.6, 6.8), (0, 0, 0), mat='TEAM', bev=.4, grp=T, P=PL)
    K.box((15.0, 12.0, .7), (0, 0, 3.6), mat='gun', bev=.12, grp=T, P=PL)
    for i in range(2):
        for j in range(4):
            y, z = -4.2 + j * 2.8, -1.5 + i * 3.0
            K.cylx(1.2, 16.0, (1.0, y, z), 'dark', 10, .05, grp=T, P=PL)
            K.cylx(.85, 1.0, (9.2, y, z), 'orange', 10, 0, grp=T, P=PL, r2=.2)
    for s in (-1, 1):
        K.box((14.0, .3, .5), (0, s * 6.0, -1.2), mat='haz', bev=0, grp=T, P=PL)
        spike(K, (-7.0, s * 4.6, 3.6), (-.6, s * .3, .7), 3.6, .75, grp=T)
    K.empty('muzzle', (TX + 8.4 * math.cos(R(29)) - .5, 1.4, TZ + 7.6 + 8.4 * math.sin(R(29))), T)
    return K, 'mlrs_s', {'body': (0, 0, 0), T: (TX, 0, TZ)}, dict(cam=(66, -52, 46), tgt=(1, 0, 9))


def buggy_s():
    """Marauder: armoured four-wheel raider, spiked ram, cage cockpit, heavy MG on the roof"""
    team(SYN_TEAM); K = Kit(); T = 'turret'
    for x in (-8.2, 8.2):
        for s in (-1, 1):
            tyre(K, x, s * 8.6, 4.2, 4.4, 4.6, hub='gun', lugs=12)
            strut(K, (x, s * 6.4, 4.2), (x * .6, s * 3.6, 7.2), .45, 'dark')
            strut(K, (x, s * 6.4, 4.2), (x * .7, s * 3.2, 4.0), .45, 'dark')
            K.tube([(x - .6, s * 6.0, 4.6), (x * .75, s * 4.2, 8.8)], .5, 'rust', 8)
    K.prism([(-11.4, 3.2), (9.0, 3.2), (12.6, 5.6), (11.6, 7.8), (4.0, 8.6), (.6, 12.6), (-6.6, 13.0), (-10.6, 10.4), (-11.8, 7.0)], 10.4, mat='TEAM', bev=.25)
    K.box((22.0, 7.6, 1.8), (0, 0, 3.4), mat='gun', bev=.15)
    for s in (-1, 1):
        K.box((5.0, .3, 2.6), (-2.6, s * 5.25, 11.0), mat='win', bev=0)
        bolts(K, -10.0, 8.0, s * 5.4, 6.4, 6)
        K.box((16.0, .5, .5), (-1.0, s * 5.5, 8.4), mat='rust', bev=0)
        K.tube([(-9.0, s * 5.4, 10.6), (-12.8, s * 5.4, 10.6)], .5, 'dark', 8)
    gl, ga = glacis(4.0, 8.6, .6, 12.6)
    x, z = gl(.5, .05); K.box((2.6, 8.4, .2), (x, 0, z), (0, ga, 0), 'win', 0)
    for k in range(4):
        x, z = gl(.5, .25); K.box((.3, .3, 3.0), (x, -2.4 + k * 1.6, z), (0, ga, 0), 'dark', 0)
    K.box((2.2, 8.4, 4.2), (13.0, 0, 6.4), mat='gun', bev=.2)
    for i in range(5): K.box((.3, .5, 3.2), (14.15, -3.2 + i * 1.6, 6.4), mat='steel', bev=0)
    K.box((1.6, 12.4, 1.6), (14.4, 0, 4.0), mat='dark', bev=.1)
    for y in (-4.5, -1.5, 1.5, 4.5): spike(K, (15.0, y, 4.0), (1, 0, 0), 3.0, .7)
    for s in (-1, 1): K.cylx(.62, .4, (14.0, s * 3.6, 9.0), 'lamp', 12, 0)
    for s in (-1, 1): spike(K, (-6.0, s * 4.8, 13.0), (-.4, s * .4, .8), 3.4, .7)
    K.empty('emblem', (7.6, 0, 8.5))
    # ---- MG mount pivot (-3,0,14.4) ----
    TX, TZ = -3.0, 14.4
    K.cyl(2.3, 2.5, 1.0, (TX, 0, TZ + .2), mat='gun', segs=16, bev=.1, grp=T)
    K.box((4.6, 2.4, 2.4), (TX + .8, 0, TZ + 2.1), mat='gun', bev=.25, grp=T)
    K.cylx(.42, 10.0, (TX + 8.0, 0, TZ + 2.3), 'steel', 10, .03, grp=T)
    K.cylx(.75, 3.2, (TX + 5.0, 0, TZ + 2.3), 'dark', 12, .05, grp=T)
    K.cylx(.62, 1.8, (TX + 12.6, 0, TZ + 2.3), 'dark', 10, .05, grp=T)
    K.box((.6, 4.8, 3.2), (TX + 3.4, 0, TZ + 2.8), mat='TEAM', bev=.12, grp=T)
    K.box((2.0, 1.8, 1.6), (TX - .4, -2.3, TZ + 1.8), mat='rust', bev=.1, grp=T)
    K.empty('muzzle', (TX + 13.6, 0, TZ + 2.3), T)
    return K, 'buggy_s', {'body': (0, 0, 0), T: (TX, 0, TZ)}, dict(cam=(48, -38, 34), tgt=(1, 0, 6))


def arty_s():
    """Hellfire Howitzer: chamfered tracked hull, octagonal turret, huge elevated barrel, ammo racks and spikes"""
    team(SYN_TEAM); K = Kit(); T = 'turret'
    for s in (-1, 1):
        tracks(K, s * 12.2, [-16, -10.7, -5.3, 0, 5.3, 10.7, 16], 3.0, 2.5, (-19.6, 4.8, 2.1), (19.6, 4.6, 2.0), 7.4, link=1.15)
    K.prism([(-19.6, 2.6), (16.0, 2.6), (20.8, 6.6), (20.8, 9.0), (-20.0, 9.0), (-20.6, 5.0)], 14.8, mat='gun', bev=.3)
    hl = []
    for sy in (-1, 1):
        hl += [(-20.6, sy * 16.4, 8.6), (19.6, sy * 16.4, 8.6), (22.4, sy * 14.6, 9.8), (15.0, sy * 12.4, 13.4), (-18.0, sy * 12.4, 13.4), (-21.0, sy * 15.2, 11.6)]
    K.hull([hl], mat='gun', bev=.35)
    syn_skirts(K, -20.4, 19.8, 16.9, 6.6, 5.0, 4)
    for s in (-1, 1):
        K.box((4.8, 10.0, .5), (20.6, s * 11.4, 9.2), (0, R(-18), 0), 'gun', .12)
        K.cylx(.9, 1.0, (22.0, s * 12.2, 10.6), 'steel', 14, .08); K.cylx(.68, .2, (22.55, s * 12.2, 10.6), 'lamp', 14, 0)
        for i in range(4):     # shell racks on the sponsons
            K.cyly(1.0, 3.0, (-17.0 + i * 2.3, s * 14.6, 14.4), 'brass', 10, .05)
        K.box((10.0, 3.6, 1.0), (-13.6, s * 14.6, 13.2), mat='rust', bev=.1)
    for s in (-1, 1):
        spike(K, (-18.0, s * 7.0, 13.4), (-.6, s * .2, .8), 5.0, 1.0)
        K.cyl(1.2, 1.4, 6.0, (-19.4, s * 10.4, 15.8), mat='rust', segs=12, bev=.1)
    K.box((2.4, 28.0, 1.4), (-22.0, 0, 6.0), (0, R(-50), 0), 'gun', .15)
    for y in range(-12, 13, 4): K.box((.25, 1.6, 2.0), (-22.6, y, 6.4), (R(30), R(-50), 0), 'haz', 0)
    # ---- turret pivot (0,0,13) ----
    TX, TZ = 0.0, 13.0
    K.cyl(8.6, 8.6, .9, (TX, 0, TZ + .5), mat='dark', segs=8, bev=.1, grp=T)
    rings = []
    for z, r in ((TZ + .8, 9.6), (TZ + 6.4, 8.8), (TZ + 9.4, 6.6)):
        rings.append([(TX + math.cos(a) * r * (1.15 if math.cos(a) < 0 else 1), math.sin(a) * r, z) for a in [R(22.5 + 45 * k) for k in range(8)]])
    K.hull(rings, mat='TEAM', bev=.4, grp=T)
    K.box((8.0, 9.0, .5), (TX - 2.0, 0, TZ + 9.6), mat='gun', bev=.12, grp=T)
    for s in (-1, 1):
        K.box((6.0, 1.2, 3.2), (TX - 4.0, s * 9.2, TZ + 4.4), mat='gun', bev=.2, grp=T)
        spike(K, (TX - 8.0, s * 6.4, TZ + 8.6), (-.5, s * .4, .8), 4.4, .9, grp=T)
    K.cyl(1.8, 1.7, 1.0, (TX - 5.0, 3.6, TZ + 10.2), mat='gun', segs=16, bev=.12, grp=T)
    PB = M((TX + 4.0, 0, TZ + 4.5), (0, R(-20), 0))
    K.box((7.6, 7.0, 6.0), (1.0, 0, 0), mat='gun', bev=.45, grp=T, P=PB)
    for zz in (2.6, -2.4): K.cylx(.85, 11.0, (8.0, 0, zz), 'steel', 12, .05, grp=T, P=PB)
    K.cylx(1.8, 7.0, (7.5, 0, 0), 'gun', 16, .1, grp=T, P=PB)
    K.cylx(1.25, 20.0, (20.0, 0, 0), 'steel', 16, .05, grp=T, P=PB, r2=1.15)
    for xx in (12.0, 17.0, 24.0): K.cylx(1.45, .6, (xx, 0, 0), 'dark', 8, 0, grp=T, P=PB)
    K.cylx(2.2, 4.0, (31.0, 0, 0), 'gun', 8, .15, grp=T, P=PB)
    for k in range(4):
        K.box((2.6, .5, .9), (31.2, 0, 0), (R(45 * k), 0, 0), 'dark', 0, grp=T, P=PB)
    K.empty('muzzle', (TX + 4.0 + 33.0 * math.cos(R(20)), 0, TZ + 4.5 + 33.0 * math.sin(R(20))), T)
    K.empty('emblemT', (TX - 2.0, -2.6, TZ + 9.9), T)
    return K, 'arty_s', {'body': (0, 0, 0), T: (TX, 0, TZ)}, dict(cam=(80, -64, 56), tgt=(6, 0, 11))


def harv_s():
    """Reaper: tracked hauler with a spiked crusher roller, armoured cab, rusted hopper, exhaust stack"""
    team(SYN_TEAM); K = Kit()
    for s in (-1, 1):
        tracks(K, s * 12.0, [-12, -6, 0, 6, 12], 3.3, 2.6, (-15.8, 4.8, 2.2), (15.8, 4.6, 2.1), 7.4, link=1.15)
    K.prism([(-16.2, 2.8), (13.0, 2.8), (16.6, 6.4), (16.6, 9.4), (-16.6, 9.4), (-17.0, 4.6)], 15.0, mat='gun', bev=.3)
    K.box((32.0, 31.0, 2.6), (-.4, 0, 10.4), mat='gun', bev=.3)
    syn_skirts(K, -16.4, 14.0, 16.0, 7.4, 4.4, 3)
    # crusher roller with spike rings, armoured guard
    K.cyly(3.4, 23.0, (19.8, 0, 4.6), 'rust', 16, .15)
    for k in range(8):
        a = 2 * math.pi * k / 8
        for j in range(6):
            y = -9.4 + j * 3.6 + (1.8 if k % 2 else 0)
            if abs(y) > 10.6: continue
            spike(K, (19.8 + math.cos(a) * 3.2, y, 4.6 + math.sin(a) * 3.2), (math.cos(a), 0, math.sin(a)), 2.2, .55)
    hood = [(math.cos(R(a)) * 6.4, math.sin(R(a)) * 6.4) for a in range(60, 181, 12)] + [(math.cos(R(a)) * 5.7, math.sin(R(a)) * 5.7) for a in range(180, 59, -12)]
    K.prism(hood, 24.0, (19.8, 0, 4.6), mat='TEAM', bev=.1)
    for s in (-1, 1):
        K.box((6.4, 1.4, 4.0), (17.0, s * 12.2, 5.4), mat='gun', bev=.2)
        spike(K, (17.0, s * 13.0, 7.4), (.3, s * .5, .8), 3.4, .8)
    K.box((1.0, 24.0, 1.2), (14.6, 0, 9.9), mat='haz', bev=.05)
    PC = M((10.0, 5.6, 11.6), (0, R(28), 0))
    K.box((17.0, 4.2, 1.2), (0, 0, 0), mat='gun', bev=.15, P=PC)
    for i in range(9): K.cyly(.4, 4.0, (-7.6 + i * 1.9, 0, .7), 'rust', 8, 0, P=PC)
    for s in (-1, 1): K.box((17.0, .3, 1.4), (0, s * 2.15, .9), mat='TEAM', bev=0, P=PC)
    cab = []
    for sy in (-1, 1):
        y0 = -6.0 + sy * 4.6
        cab += [(4.0, y0, 11.6), (14.6, y0, 11.6), (15.8, y0 * .97, 14.4), (12.6, y0 * .95, 20.4), (4.0, y0 * .95, 20.4)]
    K.hull([cab], mat='TEAM', bev=.3)
    K.box((.25, 8.0, 2.0), (14.6, -6.0, 16.6), (0, R(-27), 0), 'win', 0)
    for k in range(5): K.box((.35, .35, 3.0), (14.9, -9.0 + k * 1.5, 16.9), (0, R(-27), 0), 'dark', 0)
    K.box((8.4, 8.0, .5), (8.4, -6.0, 20.6), mat='gun', bev=.12)
    for s in (-1, 1): spike(K, (6.0, -6.0 + s * 3.6, 20.8), (-.4, s * .4, .8), 3.6, .8)
    K.cylx(.6, .4, (16.0, -9.6, 13.6), 'lamp', 12, 0); K.cylx(.6, .4, (16.0, -2.4, 13.6), 'lamp', 12, 0)
    hopper(K, wall='gun', trim='TEAM', ribs='rust')
    K.cyl(1.6, 2.0, 12.0, (-1.0, 11.4, 17.0), mat='rust', segs=14, bev=.1)
    K.cyl(1.9, 1.9, .6, (-1.0, 11.4, 23.1), mat='orange', segs=14, bev=.05)
    for s in (-1, 1): K.cylx(.5, .2, (-17.4, s * 9.0, 9.0), 'orange', 10, 0)
    K.box((1.2, 20.0, 1.6), (-17.2, 0, 8.4), mat='rust', bev=.12)
    K.empty('emblem', (8.4, -6.0, 20.9))
    return K, 'harv_s', {'body': (0, 0, 0)}, dict(cam=(66, -54, 48), tgt=(1, 0, 9))


def stank_s():
    """Phantom: low faceted stealth tank, dark radar-absorbent plates, thin glow seams, twin slim guns"""
    team(SYN_TEAM); K = Kit(); T = 'turret'
    for s in (-1, 1):
        tracks(K, s * 10.6, [-11.4, -5.7, 0, 5.7, 11.4], 2.9, 2.3, (-15.0, 4.4, 2.0), (15.4, 4.2, 1.9), 7.6, link=1.1)
        sk = [(-17.6, 5.0), (-16.2, 9.6), (15.0, 9.6), (19.4, 6.6), (16.0, 4.6), (-15.0, 4.6)]
        K.prism(sk, 1.0, (0, s * 14.6, 0), mat='dark', bev=.15)
        K.box((26.0, .3, .3), (-1.0, s * 15.15, 8.2), mat='GLOW', bev=0)
    K.prism([(-16.4, 2.8), (14.0, 2.8), (20.6, 6.2), (19.6, 8.0), (-17.4, 8.0), (-17.8, 5.0)], 13.0, mat='dark', bev=.2)
    hl = []
    for sy in (-1, 1):
        hl += [(-17.6, sy * 14.8, 9.2), (15.4, sy * 14.8, 9.2), (21.0, sy * 9.6, 8.0), (9.8, sy * 9.6, 13.0), (-13.0, sy * 10.4, 13.2), (-18.0, sy * 12.6, 11.4)]
    K.hull([hl], mat='gun', bev=.2)
    gl, ga = glacis(21.0, 8.0, 9.8, 13.0)
    K.hull([[(gl(f)[0], sy * w, gl(f)[1] + .12) for f, w in ((.08, 8.8), (.92, 8.8)) for sy in (-1, 1)] +
            [(gl(f, .35)[0], sy * w, gl(f, .35)[1] + .12) for f, w in ((.14, 7.6), (.86, 7.6)) for sy in (-1, 1)]], mat='TEAM', bev=.1)
    for s in (-1, 1):
        K.box((14.0, .3, .3), (13.2, s * 9.4, 10.6), (0, R(-24), 0), 'GLOW', 0)
        K.box((4.0, 4.4, .4), (-14.4, s * 4.6, 13.2), mat='dark', bev=0)
        for i in range(5): K.box((.25, 4.0, .3), (-16.0 + i * .8, s * 4.6, 13.45), mat='gun', bev=0)
        K.box((3.0, 2.6, 1.0), (-18.4, s * 6.0, 9.6), mat='dark', bev=.1)
    for x in (-10, -4, 2): K.box((.3, 20.0, .2), (x, 0, 13.25), mat='dark', bev=0)
    # ---- turret pivot (-2,0,13.4) ----
    TX, TZ = -2.0, 13.4
    K.cyl(7.4, 7.4, .7, (TX, 0, TZ - .1), mat='dark', segs=6, bev=.05, grp=T)
    tb = []
    for sy in (-1, 1):
        tb += [(TX + 11.4, sy * 2.6, TZ), (TX + 6.4, sy * 7.6, TZ), (TX - 8.6, sy * 7.8, TZ), (TX - 11.0, sy * 4.4, TZ),
               (TX + 6.4, sy * 2.0, TZ + 4.6), (TX + 3.0, sy * 5.4, TZ + 4.6), (TX - 6.4, sy * 5.6, TZ + 4.6), (TX - 8.6, sy * 3.0, TZ + 4.2)]
    K.hull([tb], mat='gun', bev=.2, grp=T)
    plate = [(x, sy * w, z) for sy in (-1, 1) for (x, w) in ((TX + 9.0, 3.1), (TX + 5.6, 6.6), (TX - 7.4, 6.8)) for z in (TZ + 2.4, TZ + 2.9)]
    K.hull([plate], mat='TEAM', bev=.05, grp=T)
    for y in (-1.6, 1.6):
        K.cylx(.9, 4.0, (TX + 12.0, y, TZ + 2.6), 'gun', 14, .08, grp=T)
        K.cylx(.62, 14.0, (TX + 20.0, y, TZ + 2.6), 'steel', 12, .03, grp=T, r2=.58)
        K.cylx(.95, 2.2, (TX + 27.0, y, TZ + 2.6), 'dark', 6, .05, grp=T)
    K.box((3.0, 6.0, 2.8), (TX + 9.6, 0, TZ + 2.4), mat='dark', bev=.25, grp=T)
    K.sphere(.6, (TX + 7.6, 0, TZ + 4.6), mat='GLOW', segs=10, grp=T)
    K.box((2.4, 1.6, .6), (TX - 5.4, 3.4, TZ + 4.9), mat='dark', bev=.08, grp=T)
    K.cyl(.05, .08, 4.0, (TX - 7.0, -3.6, TZ + 6.6), mat='dark', segs=5, bev=0, grp=T)
    K.empty('muzzle', (TX + 28.1, 1.6, TZ + 2.6), T)
    K.empty('emblemT', (TX - 2.0, -1.6, TZ + 4.65), T)
    return K, 'stank_s', {'body': (0, 0, 0), T: (TX, 0, TZ)}, dict(cam=(66, -52, 44), tgt=(3, 0, 7))


# =====================================================================
# HELIX
# =====================================================================
def htank_h():
    """Monolith: long sculpted hull on exposed wheels, twin rail cannons with charge coils, tall crystal reactor"""
    team(HEL_TEAM); K = Kit(); T = 'turret'
    for s in (-1, 1):
        hel_running(K, s * 13.6, 42, [-16.5, -8.2, 0, 8.2, 16.5], 3.4, TW=7.4, link=1.05)
        K.box((30.0, 9.0, 1.4), (-1, s * 13.6, 2.4), mat='gun', bev=.2)
    hel_hull(K, -22.4, 24.6, 10.2, 4.4, 15.6)
    K.hull([[(x, sy * w, z) for sy in (-1, 1) for (x, w, z) in ((-16, 8.6, 15.5), (13, 8.4, 15.3), (19, 6.8, 13.8), (-19.6, 6.8, 14.4))]
            + [(x, sy * (w - .7), z + .5) for sy in (-1, 1) for (x, w, z) in ((-15.4, 8.6, 15.5), (12.4, 8.4, 15.3))]], mat='ceram', bev=.25)
    for y in (-5.0, -1.7, 1.7, 5.0): K.sphere(1.0, (24.4, y, 8.6), mat='orange', segs=12)
    K.box((.6, 13.0, 1.2), (24.0, 0, 10.8), (0, R(-34), 0), 'dark', 0)
    for i in range(8): K.box((.3, 13.0, 2.4), (-18.0 - i * .55, 0, 14.4 - i * .4), mat='steel', bev=0)
    for s in (-1, 1):
        K.cylx(1.9, 1.4, (-22.4, s * 4.6, 9.6), 'gun', 18, .15)
        K.cylx(1.4, .3, (-23.2, s * 4.6, 9.6), 'GLOW', 18, 0)
    # ---- turret pivot (-3,0,16.2) ----
    TX, TZ = -3.0, 16.2
    K.cyl(10.0, 10.0, .9, (TX, 0, TZ - .1), mat='dark', segs=40, bev=.1, grp=T)
    rings = []
    for z, sc in ((TZ, 1.0), (TZ + 4.4, .97), (TZ + 7.6, .78), (TZ + 8.6, .55)):
        rings.append([(TX + math.cos(a) * (13.4 if math.cos(a) > 0 else 14.0) * sc, math.sin(a) * 9.8 * sc * (1 - .2 * max(0, math.cos(a)) ** 3), z)
                      for a in [2 * math.pi * i / 32 for i in range(32)]])
    K.hull(rings, mat='TEAM', bev=.5, grp=T)
    rc = []
    for z, sc in ((TZ + 7.65, .74), (TZ + 8.7, .5)):
        rc += [(TX - 1.5 + math.cos(a) * 12.0 * sc, math.sin(a) * 8.6 * sc, z) for a in [2 * math.pi * i / 24 for i in range(24)]]
    K.hull([rc], mat='ceram', bev=.2, grp=T)
    GZ = TZ + 4.2
    for y in (-3.8, 3.8):
        K.box((7.0, 4.6, 5.0), (TX + 15.0, y, GZ), mat='gun', bev=.55, grp=T)
        for sy in (-1, 1): K.box((32.0, .9, 1.8), (TX + 34.0, y + sy * 1.2, GZ), mat='steel', bev=.15, grp=T)
        K.box((32.0, 1.4, .5), (TX + 34.0, y, GZ - .75), mat='gun', bev=.1, grp=T)
        for x in (TX + 22, TX + 28, TX + 34, TX + 40):
            K.cylx(1.85, .9, (x, y, GZ), 'GLOW', 20, 0, grp=T)
            for dx in (-.65, .65): K.cylx(2.1, .4, (x + dx, y, GZ), 'gun', 20, .05, grp=T)
        K.box((5.4, 4.2, 3.6), (TX + 51.6, y, GZ), mat='gun', bev=.5, grp=T)
        K.box((5.6, 1.2, 1.2), (TX + 51.8, y, GZ), mat='dark', bev=0, grp=T)
        K.cylx(.8, .3, (TX + 54.35, y, GZ), 'GLOW', 12, 0, grp=T)
    K.box((5.0, 12.0, 4.0), (TX + 13.4, 0, GZ - .4), mat='TEAM', bev=.5, grp=T)
    # tall crystal reactor in a four-post cage
    RX = TX - 11.0
    K.cyl(3.6, 4.0, 3.0, (RX, 0, TZ + 9.0), mat='gun', segs=16, bev=.15, grp=T)
    K.cyl(3.0, 3.0, .5, (RX, 0, TZ + 10.6), mat='GLOW', segs=16, bev=0, grp=T)
    octa(K, RX, 0, TZ + 15.0, 3.2, 1.8, grp=T)
    for a in range(4):
        x, y = RX + math.cos(a * math.pi / 2 + R(45)) * 3.2, math.sin(a * math.pi / 2 + R(45)) * 3.2
        K.cyl(.3, .3, 9.0, (x, y, TZ + 14.6), mat='steel', segs=6, bev=0, grp=T)
    K.cyl(3.6, 3.6, .4, (RX, 0, TZ + 19.2), mat='gun', segs=16, bev=.05, grp=T)
    K.box((4.0, 2.4, 1.8), (TX + 4.0, 5.4, TZ + 8.4), mat='gun', bev=.25, grp=T)
    K.sphere(.65, (TX + 6.1, 5.4, TZ + 8.4), mat='lamp', segs=10, grp=T)
    K.empty('muzzleL', (TX + 54.5, -3.8, GZ), T); K.empty('muzzleR', (TX + 54.5, 3.8, GZ), T)
    K.empty('emblemT', (TX + 1.5, -3.4, TZ + 8.75), T)
    return K, 'htank_h', {'body': (0, 0, 0), T: (TX, 0, TZ)}, dict(cam=(105, -82, 74), tgt=(10, 0, 11))


def mlrs_h():
    """Lance Battery: low sculpted hull on exposed wheels, tilting pod of six crystal-tipped lances"""
    team(HEL_TEAM); K = Kit(); T = 'turret'
    for s in (-1, 1):
        hel_running(K, s * 10.2, 30, [-10.5, -3.5, 3.5, 10.5], 3.0, TW=6.4)
        K.box((22.0, 7.6, 1.2), (-1, s * 10.2, 2.2), mat='gun', bev=.2)
    hel_hull(K, -16.6, 18.4, 7.6, 4.0, 12.4)
    for y in (-3, 3): K.sphere(.95, (18.2, y, 7.6), mat='orange', segs=12)
    K.box((10.0, 9.0, .5), (8.6, 0, 12.3), mat='ceram', bev=.15)
    K.empty('emblem', (8.6, 0, 12.6))
    for i in range(6): K.box((.3, 9.0, 2.0), (-12.0 - i * .55, 0, 11.6 - i * .4), mat='steel', bev=0)
    # ---- launcher pivot (-3,0,12.6) ----
    TX, TZ = -3.0, 12.6
    K.cyl(4.8, 5.2, 1.8, (TX, 0, TZ + .9), mat='gun', segs=24, bev=.15, grp=T)
    K.lathe([(5.0, TZ + 1.7), (5.0, TZ + 2.1), (4.6, TZ + 2.1), (4.6, TZ + 1.7)], 24, (TX, 0, 0), mat='GLOW', close=True)
    PL = M((TX, 0, TZ + 2.0), (0, R(-16), 0))
    pod = []
    for x, w, z0, z1 in ((-9.0, 4.2, 0, 5.6), (-7.0, 5.4, 0, 6.2), (6.0, 5.4, 0, 6.0), (9.6, 4.2, .4, 3.4)):
        pod += [(x, sy * w, z) for sy in (-1, 1) for z in (z0, z1)]
    K.hull([pod], mat='TEAM', bev=.5, grp=T, P=PL)
    for i in range(3):
        for y in (-2.8, 2.8):
            x = -4.5 + i * 4.4
            PLL = PL @ M((x, y, 6.0), (0, R(16), 0))
            K.cyl(1.05, 1.15, 7.4, (0, 0, 3.6), mat='ceram', segs=12, bev=.08, grp=T, P=PLL)
            K.cyl(1.05, .05, 2.8, (0, 0, 8.7), mat='crys', segs=6, bev=0, grp=T, P=PLL)
            for zz in (1.6, 4.8): K.cyl(1.2, 1.2, .5, (0, 0, zz), mat='GLOW', segs=12, bev=0, grp=T, P=PLL)
    octa(K, 0, 0, 0, 1.5, 1.6, grp=T, mat='crys') if False else None
    K.empty('muzzle', (TX + 0.0, 2.8, TZ + 14.0), T)
    return K, 'mlrs_h', {'body': (0, 0, 0), T: (TX, 0, TZ)}, dict(cam=(62, -50, 44), tgt=(1, 0, 9))


def buggy_h():
    """Hornet: open dune buggy, glowing coil struts, roll cage, crystal power cell, twin rocket pods"""
    team(HEL_TEAM); K = Kit(); T = 'turret'
    for x in (-8.2, 8.2):
        for s in (-1, 1):
            tyre(K, x, s * 8.2, 3.6, 3.6, 3.6, hub='ceram', lugs=12)
            a, b = (x, s * 6.6, 3.6), (x * .82, s * 4.4, 8.8)
            strut(K, a, b, .36, 'steel')
            for i in range(5):
                f = .2 + i * .14
                p = tuple(a[k] + (b[k] - a[k]) * f for k in range(3))
                K.cyl(.85, .85, .35, p, tuple(Vector((b[0] - a[0], b[1] - a[1], b[2] - a[2])).normalized().to_track_quat('Z', 'Y').to_euler()), 'GLOW', 10, 0)
            strut(K, (x, s * 6.6, 3.4), (x * .9, s * 3.6, 3.6), .3, 'gun')
    K.box((22.0, 8.4, 1.6), (0, 0, 5.0), mat='gun', bev=.2)
    nose = []
    for x, w, z0, z1 in ((2.0, 4.6, 5.6, 10.2), (8.0, 4.4, 5.6, 9.8), (12.4, 3.2, 5.8, 8.0), (14.0, 2.2, 6.2, 7.2)):
        nose += [(x, sy * w, z) for sy in (-1, 1) for z in (z0, z1)]
    K.hull([nose], mat='TEAM', bev=.5)
    K.box((9.6, 8.6, 3.6), (-6.4, 0, 7.6), mat='TEAM', bev=.5)
    for i in range(5): K.box((.4, 7.4, .3), (-10.0 + i * 1.6, 0, 9.5), mat='dark', bev=0)
    K.box((3.0, 7.0, .3), (8.0, 0, 9.95), mat='ceram', bev=.05)
    K.empty('emblem', (8.0, 0, 10.15))
    for s in (-1, 1):
        K.tube([(7.0, s * 4.2, 6.4), (1.0, s * 4.0, 12.4), (-9.0, s * 4.0, 12.4), (-11.0, s * 4.2, 7.4)], .35, 'steel', 8)
        K.box((9.0, .2, 4.0), (-2.0, s * 4.3, 7.6), mat='dark', bev=0)
        K.sphere(.6, (1.2, s * 3.0, 13.2), mat='lamp', segs=10)
        K.cylx(.55, .3, (14.0, s * 1.4, 7.2), 'GLOW', 10, 0)
    K.tube([(1.0, -4.0, 12.4), (1.0, 4.0, 12.4)], .35, 'steel', 8)
    K.tube([(-9.0, -4.0, 12.4), (-9.0, 4.0, 12.4)], .35, 'steel', 8)
    K.box((2.4, 3.2, 2.0), (-11.4, 0, 8.6), mat='gun', bev=.2)
    octa(K, -11.6, 0, 11.0, 1.3, 1.6)
    # ---- rocket pods pivot (-4,0,13.2) ----
    TX, TZ = -4.0, 13.2
    K.box((4.0, 4.0, 1.4), (TX, 0, TZ + .7), mat='gun', bev=.2, grp=T)
    for y in (-2.5, 2.5):
        K.box((9.0, 4.2, 3.6), (TX + 1.0, y, TZ + 3.4), mat='TEAM', bev=.5, grp=T)
        K.box((.8, 4.4, 3.8), (TX, y, TZ + 3.4), mat='GLOW', bev=.05, grp=T)
        for yy in (-.9, .9):
            for zz in (-1.1, 0, 1.1):
                K.cylx(.42, .4, (TX + 5.6, y + zz, TZ + 3.4 + yy), 'dark', 8, 0, grp=T)
    K.empty('muzzle', (TX + 5.8, 2.5, TZ + 3.4), T)
    return K, 'buggy_h', {'body': (0, 0, 0), T: (TX, 0, TZ)}, dict(cam=(46, -36, 32), tgt=(1, 0, 6))


def arty_h():
    """Prism Artillery: tracked sculpted hull, smooth turret, long ceramic barrel with charge rings and a crystal prism"""
    team(HEL_TEAM); K = Kit(); T = 'turret'
    for s in (-1, 1):
        hel_running(K, s * 11.8, 38, [-14.4, -4.8, 4.8, 14.4], 3.3, TW=7.0)
        K.box((28.0, 8.4, 1.4), (-1, s * 11.8, 2.4), mat='gun', bev=.2)
    hel_hull(K, -19.6, 20.6, 8.6, 4.0, 13.4, mat='gun')
    K.hull([[(x, sy * w, z) for sy in (-1, 1) for (x, w, z) in ((-15, 7.4, 13.3), (13, 7.2, 13.1), (17, 6.0, 12.0), (-18, 6.0, 12.4))]
            + [(x, sy * (w - .6), z + .45) for sy in (-1, 1) for (x, w, z) in ((-14.4, 7.4, 13.3), (12.4, 7.2, 13.1))]], mat='TEAM', bev=.25)
    for y in (-3, 3): K.sphere(.95, (20.4, y, 7.4), mat='orange', segs=12)
    for s in (-1, 1): K.box((4.0, 2.2, 1.0), (-20.4, s * 9.0, 3.4), (0, R(-30), 0), 'steel', .1)
    # ---- turret pivot (0,0,13) ----
    TX, TZ = 0.0, 13.0
    K.cyl(8.0, 8.0, .8, (TX, 0, TZ + .5), mat='dark', segs=32, bev=.1, grp=T)
    rings = []
    for z, sc in ((TZ + .8, 1.0), (TZ + 4.6, .95), (TZ + 7.6, .7), (TZ + 8.4, .45)):
        rings.append([(TX + math.cos(a) * (9.6 if math.cos(a) > 0 else 11.0) * sc, math.sin(a) * 8.4 * sc, z) for a in [2 * math.pi * i / 28 for i in range(28)]])
    K.hull(rings, mat='TEAM', bev=.5, grp=T)
    K.lathe([(8.2, TZ + 3.0), (8.2, TZ + 3.5), (7.9, TZ + 3.5), (7.9, TZ + 3.0)], 32, (TX, 0, 0), mat='GLOW', close=True, grp=T)
    rc = [(TX - 1.6 + math.cos(a) * 5.0, math.sin(a) * 4.0, z) for z in (TZ + 7.7, TZ + 8.6) for a in [2 * math.pi * i / 20 for i in range(20)]]
    K.hull([rc], mat='ceram', bev=.15, grp=T)
    for s in (-1, 1):
        octa(K, TX - 8.6, s * 4.4, TZ + 6.6, 1.4, 1.7, grp=T)
    PB = M((TX + 4.0, 0, TZ + 4.5), (0, R(-20), 0))
    K.box((7.0, 6.4, 5.6), (1.0, 0, 0), mat='gun', bev=.6, grp=T, P=PB)
    K.cylx(1.5, 24.0, (16.0, 0, 0), 'ceram', 20, .08, grp=T, P=PB, r2=1.3)
    for xx in (9.0, 14.0, 19.0, 24.0):
        K.cylx(2.0, .8, (xx, 0, 0), 'GLOW', 20, 0, grp=T, P=PB)
        for dx in (-.6, .6): K.cylx(2.2, .35, (xx + dx, 0, 0), 'gun', 20, .05, grp=T, P=PB)
    K.cylx(2.4, 2.0, (28.6, 0, 0), 'gun', 20, .2, grp=T, P=PB)
    octa(K, 0, 0, 0, 0, 0, grp=T) if False else None
    K.cyl(2.2, .1, 4.4, (31.6, 0, 0), (0, R(90), 0), 'crys', 6, 0, grp=T, P=PB)
    K.empty('muzzle', (TX + 4.0 + 33.8 * math.cos(R(20)), 0, TZ + 4.5 + 33.8 * math.sin(R(20))), T)
    K.empty('emblemT', (TX - 1.6, 0, TZ + 8.65), T)
    return K, 'arty_h', {'body': (0, 0, 0), T: (TX, 0, TZ)}, dict(cam=(80, -64, 56), tgt=(6, 0, 11))


def harv_h():
    """Gleaner: sculpted tracked hauler, glowing intake drum with crystal blades, smooth cab, ceramic hopper"""
    team(HEL_TEAM); K = Kit()
    for s in (-1, 1):
        hel_running(K, s * 12.2, 32, [-11.2, -3.7, 3.7, 11.2], 3.2, TW=7.0)
        K.box((24.0, 8.4, 1.4), (-1, s * 12.2, 2.4), mat='gun', bev=.2)
    K.prism([(-16.2, 3.0), (13.0, 3.0), (16.6, 6.4), (16.6, 9.4), (-16.6, 9.4), (-17.0, 4.6)], 16.0, mat='gun', bev=.35)
    K.box((31.0, 30.0, 2.4), (-.6, 0, 10.6), mat='TEAM', bev=.6)
    # intake drum
    K.cyly(3.4, 22.0, (19.6, 0, 4.8), 'gun', 20, .15)
    for j in range(5): K.cyly(3.6, .5, (19.6, -8.8 + j * 4.4, 4.8), 'GLOW', 20, 0)
    for k in range(6):
        a = 2 * math.pi * k / 6
        for j in range(4):
            y = -6.6 + j * 4.4
            K.hull([[(19.6 + math.cos(a) * r, y + dy, 4.8 + math.sin(a) * r) for r in (3.2, 4.6) for dy in (-.9, .9)] +
                    [(19.6 + math.cos(a + .25) * 3.6, y, 4.8 + math.sin(a + .25) * 3.6)]], mat='crys', bev=0)
    hood = [(math.cos(R(a)) * 6.0, math.sin(R(a)) * 6.0) for a in range(50, 186, 9)] + [(math.cos(R(a)) * 5.3, math.sin(R(a)) * 5.3) for a in range(185, 49, -9)]
    K.prism(hood, 23.0, (19.6, 0, 4.8), mat='TEAM', bev=.25)
    for s in (-1, 1):
        K.box((6.0, 1.4, 3.6), (17.0, s * 12.0, 5.4), mat='ceram', bev=.4)
        K.cyly(1.3, 1.6, (19.6, s * 12.2, 4.8), 'GLOW', 14, 0)
    # cab
    cab = []
    for x, w, z0, z1 in ((4.0, 4.4, 11.6, 20.0), (11.0, 4.4, 11.6, 19.6), (14.6, 3.8, 11.6, 16.8), (15.8, 3.0, 11.6, 13.6)):
        cab += [(x, -6.0 + sy * w, z) for sy in (-1, 1) for z in (z0, z1)]
    K.hull([cab], mat='TEAM', bev=.6)
    K.box((.25, 7.0, 2.8), (14.4, -6.0, 16.2), (0, R(-40), 0), 'win', 0)
    K.box((7.0, 6.4, .4), (7.8, -6.0, 20.1), mat='ceram', bev=.12)
    K.empty('emblem', (7.8, -6.0, 20.35))
    for y in (-8.6, -3.4): K.sphere(.55, (15.4, y, 13.4), mat='lamp', segs=10)
    # conveyor: glowing lift beam into the hopper
    PC = M((10.0, 5.6, 11.6), (0, R(28), 0))
    K.box((17.0, 4.2, 1.0), (0, 0, 0), mat='ceram', bev=.3, P=PC)
    K.box((16.0, 2.8, .3), (0, 0, .6), mat='GLOW', bev=0, P=PC)
    hopper(K, wall='ceram', trim='TEAM', ribs='gun')
    for s in (-1, 1):
        K.box((14.0, .3, .5), (-5.6, s * 8.15, 16.0), mat='GLOW', bev=0)
        octa(K, -16.6, s * 6.6, 13.4, 1.2, 1.6)
    K.cyl(1.6, 1.9, 8.0, (-1.0, 11.4, 15.0), mat='ceram', segs=16, bev=.2)
    K.cyl(1.4, 1.4, .5, (-1.0, 11.4, 19.1), mat='GLOW', segs=16, bev=0)
    return K, 'harv_h', {'body': (0, 0, 0)}, dict(cam=(66, -54, 48), tgt=(1, 0, 9))


BUILD = {f.__name__: f for f in (htank_s, mlrs_s, buggy_s, arty_s, harv_s, stank_s, htank_h, mlrs_h, buggy_h, arty_h, harv_h)}

if __name__ == '__main__':
    reset()
    K, name, piv, cam = BUILD[sys.argv[1]]()
    res = (1024, 512) if 'turret' in piv else (1024, 512)
    finish(K, name, piv, res=res, preview_on='--nopreview' not in sys.argv, **cam)
    print('done')
