"""Aircraft - original designs.
gunship: VTOL gunship - rounded pod fuselage, glass canopy, stub wings carrying two ducted lift fans (rotors spin in game),
         rotary chin cannon, rocket pods, tail boom with twin end-plate fins, landing skids.  ~42 long.
bomber:  delta-wing jet bomber - long fuselage, canards, twin canted tails, twin exhausts, two bombs on wing pylons
         (group 'bombs', hidden in game once dropped), landing gear (group 'gear', retracted in flight).  ~54 long.
Faction finish swapped in game by material name: WALL (hull), TEAM / TEAMLT (team colour), GLOW (lights).
Run: python3 aircraft.py [gunship|bomber] [--nopreview]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

PAL['WALL'] = ((.24, .27, .26), .45, .45, 0)


def gunship():
    reset(); K = Kit(); Z = 8.0
    sq = M((0, 0, Z), (0, 0, 0), (1, .9, .8))
    # fuselage pod (spun profile along +x, squashed)
    prof = [(0, -13), (1.7, -12.4), (3.1, -9), (4.7, -4), (5.5, 1), (5.3, 6), (4.3, 10), (2.7, 13.4), (.9, 15.5), (0, 16)]
    K.lathe(prof, 28, rot=(0, R(90), 0), mat='WALL', P=sq)
    # team-colour belly band and nose
    K.lathe([(5.62, -1), (5.62, 4.5)], 28, rot=(0, R(90), 0), mat='TEAM', P=sq, smooth=True)
    K.lathe([(2.75, 13.2), (1.0, 15.4), (0, 15.9)], 28, rot=(0, R(90), 0), mat='TEAM', P=sq)
    # canopy + frame
    K.sphere(1, (7.6, 0, Z + 2.3), 'win', 24, scl=(6.4, 3.3, 2.9))
    for x in (4.2, 7.4, 10.4):
        K.box((.45, 6.9, .45), (x, 0, Z + 2.6 + (.6 if x == 7.4 else 0)), mat='gun', bev=.1)
    K.box((8.6, .45, .45), (7.4, 0, Z + 5.3), mat='gun', bev=.1)
    # engine hump + intakes behind the canopy
    K.hull([[(-1, -2.6, Z + 3.4), (-1, 2.6, Z + 3.4), (-9, -2, Z + 3), (-9, 2, Z + 3)],
            [(-2, -1.8, Z + 6), (-2, 1.8, Z + 6), (-8, -1.4, Z + 5.4), (-8, 1.4, Z + 5.4)]], mat='WALL', bev=.4)
    for s in (-1, 1):
        K.cylx(1.0, 1.6, (-1.6, s * 2.2, Z + 5), mat='dark', segs=14)
    K.cylx(1.2, 1.4, (-9.4, 0, Z + 4.5), mat='gun', segs=14)
    # stub wings to the fan ducts
    K.hull([[(3, -4, Z + .3), (3, 4, Z + .3), (-5, -4, Z + .3), (-5, 4, Z + .3)],
            [(1.5, -14, Z + 1.2), (1.5, 14, Z + 1.2), (-3.5, -14, Z + 1.2), (-3.5, 14, Z + 1.2)],
            [(2.5, -4, Z + 1.6), (2.5, 4, Z + 1.6), (-4.5, -4, Z + 1.6), (-4.5, 4, Z + 1.6)]], mat='WALL', bev=.3)
    FX, FY, FZ, FR = -1.0, 16.5, Z + 1.6, 6.4
    pivots = {}
    for s, nm in ((-1, 'rotorL'), (1, 'rotorR')):
        cy = s * FY
        # duct ring (vertical axis), team band, stator struts
        K.lathe([(FR, -2.4), (FR + 1.3, -2.6), (FR + 1.9, -1), (FR + 1.9, 1.4), (FR + 1.2, 2.6), (FR, 2.3)], 36, loc=(FX, cy, FZ), mat='WALL', close=True)
        K.lathe([(FR + 1.95, -.4), (FR + 1.95, .9)], 36, loc=(FX, cy, FZ), mat='TEAM')
        K.lathe([(FR - .1, -2.2), (FR - .1, 2.1)], 36, loc=(FX, cy, FZ), mat='dark')
        for a in (0, 90):
            K.box((2 * FR, .45, .5), (FX, cy, FZ - 1.4), rot=(0, 0, R(a + 45)), mat='gun', bev=.08)
        K.cyl(1.3, 1.3, 1.6, (FX, cy, FZ - 1.4), mat='gun', segs=16)
        # rotor (spins about the vertical axis)
        K.cyl(1.2, .9, 1.4, (FX, cy, FZ + .2), mat='steel', segs=16, grp=nm)
        for b in range(6):
            a = b * math.pi / 3
            K.box((5.0, 1.3, .22), (FX + math.cos(a) * 3.3, cy + math.sin(a) * 3.3, FZ + .2), rot=(R(18), 0, a), mat='steel', bev=.05, grp=nm)
        pivots[nm] = (FX, cy, FZ)
        # nav light on the outer duct lip
        K.sphere(.5, (FX, cy + s * (FR + 2.0), FZ + .4), 'GLOW' if s > 0 else 'lamp', 10)
        # rocket pod under the stub wing
        K.cylx(1.5, 7.5, (2.5, s * 8.8, Z - 1.2), mat='gun', segs=16)
        K.cylx(1.2, .4, (6.4, s * 8.8, Z - 1.2), mat='dark', segs=16)
        for k in range(4):
            a = k * math.pi / 2 + math.pi / 4
            K.cylx(.32, .5, (6.6, s * 8.8 + math.cos(a) * .65, Z - 1.2 + math.sin(a) * .65), mat='orange', segs=8, bev=0)
        K.box((3, .6, 1.4), (2.2, s * 8.8, Z - .1), mat='gun', bev=.1)
        # skids
        K.tube([(-8, s * 4.6, .5), (8.5, s * 4.6, .5), (10, s * 4.6, 1.6)], .45, 'gun', 10)
        for x in (-4.5, 5):
            K.tube([(x, s * 4.6, .5), (x, s * 3.2, Z - 3.5)], .38, 'gun', 8)
    # tail boom + stabiliser + twin end-plate fins
    K.tube([(-11, 0, Z + .6), (-27, 0, Z + 2.2)], 1.35, 'WALL', 16)
    K.box((3, 13, .55), (-26, 0, Z + 2.5), mat='WALL', bev=.15)
    for s in (-1, 1):
        K.prism([(-28.6, Z + .6), (-24.4, Z + .6), (-25.6, Z + 7.2), (-28.2, Z + 7.8)], .6, loc=(0, s * 6.6, 0), mat='TEAM', bev=.12)
        K.sphere(.35, (-28.4, s * 6.9, Z + 7.6), 'GLOW', 8)
    # rotary chin cannon
    K.sphere(2.1, (12.4, 0, Z - 3.1), 'gun', 16)
    K.cylx(1.15, 3, (15.2, 0, Z - 3.4), mat='dark', segs=14)
    for k in range(6):
        a = k * math.pi / 3
        K.cylx(.3, 6.5, (19.4, math.cos(a) * .7, Z - 3.4 + math.sin(a) * .7), mat='steel', segs=8, bev=0)
    K.cylx(1.1, .5, (22.4, 0, Z - 3.4), mat='gun', segs=14)
    K.empty('muzzle', (23, 0, Z - 3.4))
    K.empty('emblem', (-2, -5.2, Z + 1.4))
    K.empty('shadow', (0, 0, 0))
    finish(K, 'gunship', pivots, res=(1024, 256), cam=(58, -52, 40), tgt=(-2, 0, 6), lens=50, preview_on='--nopreview' not in sys.argv)


def bomber():
    reset(); K = Kit(); Z = 7.0
    sq = M((0, 0, Z), (0, 0, 0), (1, .95, .78))
    prof = [(0, -25.5), (1.9, -24.8), (3.3, -19), (3.9, -7), (3.7, 8), (2.9, 16), (1.6, 22.5), (.35, 27.2), (0, 27.6)]
    K.lathe(prof, 28, rot=(0, R(90), 0), mat='WALL', P=sq)
    K.lathe([(1.65, 22.3), (.4, 27), (0, 27.5)], 28, rot=(0, R(90), 0), mat='TEAM', P=sq)
    # canopy
    K.sphere(1, (15.6, 0, Z + 2.3), 'win', 24, scl=(7.2, 2.4, 2.3))
    K.box((9, .4, .4), (15.4, 0, Z + 4.45), mat='gun', bev=.1)
    # intakes
    for s in (-1, 1):
        K.hull([[(9, s * 3, Z - 1.6), (9, s * 5.2, Z - 1.6), (9, s * 3, Z + 1.4), (9, s * 5.2, Z + 1.2)],
                [(-10, s * 2.8, Z - 1.8), (-10, s * 4.6, Z - 1.6), (-10, s * 2.8, Z + 1.4), (-10, s * 4.6, Z + 1.2)]], mat='WALL', bev=.25)
        K.box((.5, 1.7, 2.4), (9.2, s * 4.1, Z - .2), mat='dark', bev=.05)
    # delta wing (one hull through the fuselage)
    def wing(t):
        return [(9, -3.6, Z + t), (9, 3.6, Z + t), (-21.5, -3.6, Z + t), (-21.5, 3.6, Z + t),
                (-15.5, -24, Z + t * .3), (-15.5, 24, Z + t * .3), (-21, -24, Z + t * .3), (-21, 24, Z + t * .3)]
    K.hull([wing(.75), wing(-.65)], mat='WALL', bev=.2)
    for s in (-1, 1):
        # team wing tips + leading-edge stripe
        K.hull([[(-15.2, s * 22, Z + .45), (-21.2, s * 22, Z + .45), (-15.4, s * 24.3, Z + .35), (-21.2, s * 24.3, Z + .35)],
                [(-15.2, s * 22, Z - .3), (-21.2, s * 22, Z - .3), (-15.4, s * 24.3, Z - .25), (-21.2, s * 24.3, Z - .25)]], mat='TEAM', bev=.08)
        K.sphere(.45, (-18, s * 24.5, Z + .1), 'GLOW' if s > 0 else 'lamp', 10)
        # canards
        K.hull([[(18, s * 3, Z + .9), (12.5, s * 3, Z + .9), (13.5, s * 8.5, Z + .7), (12, s * 8.5, Z + .7)],
                [(18, s * 3, Z + .4), (12.5, s * 3, Z + .4), (13.5, s * 8.5, Z + .45), (12, s * 8.5, Z + .45)]], mat='TEAM', bev=.06)
        # twin canted tails
        K.hull([[(-14, s * 3.4, Z + 2.2), (-25, s * 3.4, Z + 2.2), (-14, s * 3.9, Z + 2.2), (-25, s * 3.9, Z + 2.2)],
                [(-21.5, s * 6.4, Z + 12.5), (-25.6, s * 6.4, Z + 12.5), (-21.5, s * 6.8, Z + 12.5), (-25.6, s * 6.8, Z + 12.5)]], mat='TEAM', bev=.1)
        K.sphere(.3, (-25.2, s * 6.8, Z + 12.4), 'GLOW', 8)
        # exhaust
        K.cylx(1.95, 3.2, (-25.2, s * 1.95, Z), mat='gun', segs=18, r2=1.7)
        K.cylx(1.4, .5, (-26.7, s * 1.95, Z), mat='orange', segs=18, bev=0)
        K.cylx(.8, .4, (-26.9, s * 1.95, Z), mat='GLOW', segs=12, bev=0)
        # wing pylon + bomb
        K.box((5, .7, 1.6), (-6, s * 10, Z - 1.1), mat='gun', bev=.1)
        K.cylx(1.35, 8.5, (-6, s * 10, Z - 2.9), mat='dark', segs=16, grp='bombs')
        K.cylx(1.35, 2.2, (-.7, s * 10, Z - 2.9), mat='dark', segs=16, r2=.2, grp='bombs')
        K.cylx(.4, 2.2, (-11.2, s * 10, Z - 2.9), mat='dark', segs=10, r2=1.0, grp='bombs')
        K.box((1.8, 3.6, .2), (-11.4, s * 10, Z - 2.9), mat='haz', bev=0, grp='bombs')
        K.box((1.8, .2, 3.6), (-11.4, s * 10, Z - 2.9), mat='haz', bev=0, grp='bombs')
        K.box((1.2, .2, .2), (-2.2, s * 10, Z - 1.5), mat='haz', bev=0, grp='bombs')
        # main gear
        K.cyl(.45, .45, Z - 1.7, (-7, s * 5.2, (Z - 1.7) / 2 + 1.5), mat='steel', segs=10, grp='gear')
        K.cyly(1.5, 1.2, (-7, s * 5.2, 1.5), mat='rubber', segs=16, grp='gear')
    # nose gear
    K.cyl(.38, .38, Z - 2, (17, 0, (Z - 2) / 2 + 1.3), mat='steel', segs=10, grp='gear')
    K.cyly(1.25, 1.0, (17, 0, 1.25), mat='rubber', segs=16, grp='gear')
    # spine + belly details
    K.box((14, 1.2, .8), (-4, 0, Z + 3.1), mat='TEAMLT', bev=.2)
    K.box((10, 3.2, .6), (-2, 0, Z - 3), mat='gun', bev=.2)
    K.empty('emblem', (-13, -13, Z + .9))
    K.empty('bombL', (-6, -10, Z - 2.9))
    K.empty('bombR', (-6, 10, Z - 2.9))
    finish(K, 'bomber', {'bombs': (-6, 0, Z - 2.9), 'gear': (0, 0, 0)}, res=(1024, 256), cam=(70, -66, 52), tgt=(-2, 0, 4), lens=50, preview_on='--nopreview' not in sys.argv)


if __name__ == '__main__':
    what = [a for a in sys.argv[1:] if not a.startswith('--')] or ['gunship', 'bomber']
    for w in what: {'gunship': gunship, 'bomber': bomber}[w]()
    print('done')
