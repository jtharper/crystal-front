"""Outpost Crawler + Forward Base - original designs.
crawler:  six-wheeled heavy truck carrying a folded base module: low armoured cab, boxy cargo pod with team stripes,
          folded radar dish and a whip antenna on the roof.  ~66 long, ~36 wide.  +X = forward.
outpost:  the deployed Forward Base (footprint 96 x 96: x +-48, y +-48, front = -y): an octagonal command hub on four
          hydraulic outrigger legs, a raised radar dish (group 'dish', turns in game), antenna mast, beacon, and a small
          vehicle apron in front.
Faction finish swapped in game by material name: WALL, TOWER, TEAM, TEAMLT, GLOW.
Run: python3 outpost.py [crawler|outpost] [--nopreview]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

PAL['WALL'] = ((.24, .27, .26), .45, .45, 0)
PAL['pad'] = ((.27, .28, .27), 0, .9, 0)
PAL['yellow'] = ((.85, .7, .15), 0, .6, 0)


def wheel(K, x, y, r=5.2, w=4.2, grp='body'):
    K.cyly(r, w, (x, y, r), mat='rubber', segs=22, grp=grp)
    K.cyly(r * .58, w + .3, (x, y, r), mat='gun', segs=16, grp=grp)
    K.cyly(r * .22, w + .7, (x, y, r), mat='steel', segs=10, grp=grp)
    for k in range(10):
        a = k * math.pi / 5
        K.box((1.1, w + .1, .7), (x + math.cos(a) * (r - .1), y, r + math.sin(a) * (r - .1)), rot=(0, -a, 0), mat='rubber', bev=.05, grp=grp)


def crawler():
    reset(); K = Kit()
    WX = (-21, 0, 21)
    for x in WX:
        for s in (-1, 1):
            wheel(K, x, s * 14.6, 5.6, 4.6)
            K.box((5, 2.4, 2.4), (x, s * 11, 6), mat='gun', bev=.2)          # suspension arm
    # fenders
    for s in (-1, 1):
        K.hull([[(-29, s * 12.4, 10.6), (29, s * 12.4, 10.6), (-29, s * 17.6, 10.6), (29, s * 17.6, 10.6)],
                [(-28, s * 12.4, 12.4), (28, s * 12.4, 12.4), (-28, s * 17, 12.2), (28, s * 17, 12.2)]], mat='WALL', bev=.3)
        K.box((52, .5, 1.0), (0, s * 17.4, 11.2), mat='TEAM', bev=.1)
        for x in (-10.5, 10.5):
            K.box((3.4, .6, 1.4), (x, s * 17.5, 9.4), mat='haz', bev=0)
    # chassis
    K.box((62, 22, 5), (0, 0, 9.5), mat='gun', bev=.6)
    # cab (front)
    K.hull([[(33, -11, 12), (33, 11, 12), (18, -11.5, 12), (18, 11.5, 12)],
            [(30, -10, 18.5), (30, 10, 18.5), (17.5, -11, 21), (17.5, 11, 21)]], mat='WALL', bev=.5)
    K.hull([[(31.3, -9, 16), (31.3, 9, 16), (30.2, -8.6, 18.4), (30.2, 8.6, 18.4)],
            [(30.6, -9, 15.6), (30.6, 9, 15.6), (29.6, -8.6, 18.0), (29.6, 8.6, 18.0)]], mat='win', bev=0)
    for s in (-1, 1):
        K.box((.4, 3.6, 2), (29, s * 10.6, 17.5), mat='win', bev=0)
        K.sphere(.75, (33.4, s * 8.5, 13.6), 'lamp', 10)
    K.box((3, 20, 2.2), (34, 0, 11.2), mat='gun', bev=.3)             # bumper
    K.box((2, 14, .9), (35.2, 0, 11.2), mat='haz', bev=0)
    K.box((14, 22.6, 1.0), (24, 0, 21.1), mat='TEAM', bev=.2)         # cab roof stripe
    # cargo pod (the folded base)
    K.box((40, 24, 14), (-8, 0, 19), mat='TOWER', bev=.7)
    K.box((40.6, 24.6, 2.0), (-8, 0, 22.5), mat='TEAM', bev=.2)
    K.box((40.4, 24.4, 1.0), (-8, 0, 12.6), mat='gun', bev=.1)
    for x in (-24, -14, -4, 6):
        for s in (-1, 1):
            K.box((.8, .5, 10), (x, s * 12.2, 18.6), mat='WALL', bev=.05)   # ribs
    for k in range(5):                                                     # rear chevrons
        K.box((.4, 3.2, 1.0), (-28.2, -6 + k * 3, 16), rot=(R(35), 0, 0), mat='haz', bev=0)
    K.box((1.0, 16, 8), (-28.3, 0, 19), mat='WALL', bev=.2)
    # roof: folded dish, sensor mast, antenna, light bar
    K.cyl(2.4, 2.4, 2, (-18, 0, 27), mat='gun', segs=14)
    K.lathe([(0, 0), (6.5, 1.2), (8.2, 2.6), (8.3, 2.9), (0, 1.3)], 24, loc=(-18, 0, 28), rot=(0, R(-70), 0), mat='steel', close=True)
    K.cyl(.4, .4, 4, (-16, 0, 30), rot=(0, R(-70), 0), mat='gun', segs=8)
    K.box((8, 5, 3), (2, -5, 27.5), mat='WALL', bev=.3)
    K.box((8.4, 5.4, .8), (2, -5, 29.2), mat='GLOW', bev=.1)
    K.cyl(.25, .15, 26, (-26, 9, 39), mat='steel', segs=6, bev=0)
    K.sphere(.45, (-26, 9, 52), 'GLOW', 8)
    K.box((3, 10, 1.2), (16, 0, 22.2), mat='gun', bev=.2)
    for y in (-3.5, 0, 3.5):
        K.box((1.6, 2.2, .8), (16.6, y, 23), mat='lamp', bev=.05)
    # side tool boxes + ladder
    for s in (-1, 1):
        K.box((14, 2.2, 5), (-12, s * 13.3, 15.6), mat='WALL', bev=.3)
    for z in (14, 17, 20, 23):
        K.box((.3, 3, .3), (-28.6, 8, z), mat='steel', bev=0)
    K.empty('emblem', (-8, 0, 23.6))
    finish(K, 'crawler', {}, res=(1024, 256), cam=(78, -70, 52), tgt=(0, 0, 12), lens=50, preview_on='--nopreview' not in sys.argv)


def outpost():
    reset(); K = Kit()
    # ground plate: octagonal pad + apron
    K.cyl(40, 40, .6, (0, 0, .3), mat='concrete', segs=8, bev=.2)
    K.lathe([(37.5, .62), (39.6, .62)], 8, mat='haz', smooth=False)
    K.box((26, 16, .5), (0, -36, .35), mat='pad', bev=.1)
    for i in range(5):
        K.box((5.4, 1.0, .08), (-10 + i * 5, -43, .64), rot=(0, 0, R(30)), mat='yellow', bev=0)
    # four hydraulic outrigger legs with pads
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        c, s = math.cos(a), math.sin(a)
        K.cyl(5.5, 5.8, 1.4, (c * 30, s * 30, 1.0), mat='gun', segs=12)
        K.tube([(c * 30, s * 30, 1.6), (c * 26, s * 26, 9), (c * 18, s * 18, 13)], 1.6, 'WALL', 12)
        K.tube([(c * 29, s * 29, 1.6), (c * 24, s * 24, 6.5)], 1.0, 'steel', 10)
        K.box((4, 4, 2), (c * 30, s * 30, 2.6), rot=(0, 0, a), mat='haz', bev=.1)
    # hub: octagonal two-tier body
    K.cyl(22, 22, 3, (0, 0, 9), mat='gun', segs=8, bev=.4)
    K.cyl(20, 18, 10, (0, 0, 15.5), mat='TOWER', segs=8, bev=.5)
    K.cyl(20.4, 20.4, 1.6, (0, 0, 13), mat='TEAM', segs=8, bev=.2)
    K.cyl(15, 12, 6, (0, 0, 23.5), mat='WALL', segs=8, bev=.5)
    K.cyl(15.3, 15.3, 1, (0, 0, 21), mat='TEAMLT', segs=8, bev=.1)
    for k in range(8):                                                     # windows
        a = k * math.pi / 4 + math.pi / 8
        K.box((.6, 6, 2.2), (math.cos(a) * 18.6, math.sin(a) * 18.6, 17), rot=(0, R(6), a), mat='win', bev=0)
    # front door + ramp
    K.box((10, 3, 8), (0, -18.5, 14), mat='dark', bev=.2)
    K.box((11, 1, 1), (0, -20, 18.6), mat='GLOW', bev=0)
    K.hull([[(-6, -19, 0), (6, -19, 0), (-6, -19, 10), (6, -19, 10)], [(-6, -31, .6), (6, -31, .6), (-6, -31, 1.6), (6, -31, 1.6)]], mat='gun', bev=.1)
    # side modules
    for s in (-1, 1):
        K.box((10, 14, 7), (s * 22, 6, 14), mat='WALL', bev=.4)
        K.box((10.4, 14.4, 1), (s * 22, 6, 17.8), mat='TEAM', bev=.1)
        K.cyl(1.4, 1.4, 4, (s * 22, 10, 19.5), mat='steel', segs=10)
    # radar mast + dish (turns in game)
    K.cyl(2.6, 3.0, 12, (0, 0, 32), mat='gun', segs=12)
    DZ = 38.5
    K.lathe([(0, 0), (6.5, 1.3), (8.6, 3.0), (8.7, 3.4), (0, 1.5)], 28, loc=(1.5, 0, DZ + 4), rot=(0, R(-62), 0), mat='steel', close=True, grp='dish')
    K.cyl(.45, .45, 6, (4.5, 0, DZ + 5.5), rot=(0, R(-62), 0), mat='gun', segs=8, grp='dish')
    K.sphere(.9, (7.2, 0, DZ + 7), 'GLOW', 10, grp='dish')
    K.box((4, 3, 3), (-2, 0, DZ + 1.5), mat='WALL', bev=.3, grp='dish')
    # antenna + beacon
    K.cyl(.35, .2, 30, (-8, 8, 41), mat='steel', segs=6, bev=0)
    K.sphere(.7, (-8, 8, 56.2), 'GLOW', 10)
    K.cyl(1.4, 1.4, 1.6, (8, -8, 27.5), mat='gun', segs=10)
    K.sphere(1.3, (8, -8, 29.2), 'GLOW', 12)
    # perimeter lamps
    for k in range(4):
        a = k * math.pi / 2
        x, y = math.cos(a) * 36, math.sin(a) * 36
        K.cyl(.3, .35, 7, (x, y, 3.8), mat='steel', segs=8, bev=0)
        K.box((1.2, 1.2, .8), (x, y, 7.6), mat='lamp', bev=.1)
    K.empty('emblem', (0, 0, 26.6))
    objs = K.build({'dish': (0, 0, DZ)})
    for o in objs.values(): box_uv(o, 24)
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
    print('TRIS', tris)
    for o in objs.values(): ao_uv(o, .002)
    g = ground(400)
    bake_ao(objs, 2048, 9.0, 64, 'outpost')
    if '--nopreview' not in sys.argv:
        preview(os.path.join(OUT, 'outpost_preview.png'), (95, -130, 95), (0, 0, 10), lens=40)
    bpy.data.objects.remove(g)
    export(objs, 'outpost')


if __name__ == '__main__':
    what = [a for a in sys.argv[1:] if not a.startswith('--')] or ['crawler', 'outpost']
    for w in what: {'crawler': crawler, 'outpost': outpost}[w]()
    print('done')
