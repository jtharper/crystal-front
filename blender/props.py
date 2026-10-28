"""Neutral battlefield scenery (original designs). Run: python3 props.py <name>|all [--nopreview]
  ruin_house  ruined farmhouse: brick walls with window holes, collapsed roof, chimney, rubble, beams
  water_tower riveted tank on braced legs with ladder
  pillbox     hexagonal concrete bunker, gun slits, sandbag ring, ammo crates
  traps       anti-tank hedgehogs and a row of dragon's teeth
  fuel_depot  two horizontal fuel tanks on saddles, pipework, pump shed
  wreck_tank  burnt-out tank, turret blown off beside it, thrown track
  wreck_truck burnt-out cargo truck, missing wheels
  pole        telegraph pole with crossarm and insulators
All sized for one map tile (32 units); +X forward, Z up."""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

PAL.update({'brick': ((.42, .24, .17), 0, .9, 0), 'char': ((.06, .055, .05), .1, .95, 0), 'sand': ((.55, .47, .32), 0, .95, 0),
            'plate': ((.16, .18, .17), .2, .8, 0), 'wood': ((.33, .22, .13), 0, .85, 0)})
WOOD = 'rust'   # the game has no wood material; rust reads as weathered timber


def sandbag_ring(K, cx, cy, r0, r1, z0, rows, gap=None):
    for row in range(rows):
        r = r0 + (r1 - r0) * row / max(1, rows - 1)
        n = int(2 * math.pi * r / 2.6)
        for i in range(n):
            a = 2 * math.pi * (i + (.5 if row % 2 else 0)) / n
            if gap and abs(((a - gap[0] + math.pi) % (2 * math.pi)) - math.pi) < gap[1]: continue
            K.box((2.5, 1.5, 1.0), (cx + r * math.cos(a), cy + r * math.sin(a), z0 + .5 + row * .95), (0, 0, a + math.pi / 2), 'sand', .4)


def ruin_house():
    K = Kit(); rnd = random.Random(3)
    W, D, H = 24.0, 16.0, 11.0
    K.box((W + 1.4, D + 1.4, .8), (0, 0, .4), mat='concrete', bev=.1)
    # walls: built from blocks so window and door holes stay open; the right end has fallen in
    def wall(x0, y0, x1, y1, holes, top):
        L = math.hypot(x1 - x0, y1 - y0); a = math.atan2(y1 - y0, x1 - x0)
        cs = [0.0]
        for h0, h1, z0, z1 in holes: cs += [h0, h1]
        cs.append(L); cs = sorted(set(cs))
        for i in range(len(cs) - 1):
            s0, s1 = cs[i], cs[i + 1]; mid = (s0 + s1) / 2
            hole = next((h for h in holes if h[0] <= mid <= h[1]), None)
            tz = top(mid)
            spans = [(.8, tz)] if not hole else [(.8, hole[2]), (hole[3], tz)]
            for z0, z1 in spans:
                if z1 - z0 < .3: continue
                px, py = x0 + math.cos(a) * mid, y0 + math.sin(a) * mid
                K.box((s1 - s0, 1.0, z1 - z0), (px, py, (z0 + z1) / 2), (0, 0, a), 'brick', .12)
    full = lambda s: H
    broken = lambda L: (lambda s: max(2.0, H - max(0, s - L * .45) * .9 + math.sin(s * 2.1) * .7))
    wall(-W / 2, -D / 2, W / 2, -D / 2, [(3, 6, 3.6, 7.2), (9, 12.5, .8, 7.6), (16, 19, 3.6, 7.2)], broken(W))
    wall(W / 2, D / 2, -W / 2, D / 2, [(5, 8, 3.6, 7.2), (14, 17, 3.6, 7.2)], lambda s: max(2.5, H - max(0, (W - s) - W * .5) * .8))
    wall(-W / 2, D / 2, -W / 2, -D / 2, [(6, 9, 3.6, 7.2)], lambda s: H + 4.5 * (1 - abs(s - D / 2) / (D / 2)))   # gable end
    wall(W / 2, -D / 2, W / 2, -2, [], lambda s: max(1.5, 3.5 - s * .2))
    # brick quoins and window sills
    for x in (-W / 2, W / 2):
        for y in (-D / 2, D / 2):
            K.box((1.4, 1.4, 3.0), (x, y, 2.3), mat='concrete', bev=.1)
    # half the roof still up at the gable end, slumped rafters over the rest
    ra = math.atan2(4.5, D / 2)
    for s in (-1, 1):
        K.box((10.0, D / 2 / math.cos(ra) + 1.2, .5), (-W / 2 + 5.0, s * D / 4, H + 2.25), (s * ra, 0, 0), 'plate', .08)
        for i in range(6):
            K.box((.4, D / 2 / math.cos(ra), .4), (-W / 2 + 1 + i * 2.6, s * D / 4, H + 1.9), (s * ra, 0, 0), WOOD, 0)
    K.box((10.4, .6, .6), (-W / 2 + 5.0, 0, H + 4.5), mat=WOOD, bev=0)
    for i in range(5):
        x = -W / 2 + 12 + i * 2.4
        K.box((.45, D / 2 / math.cos(ra), .45), (x, -D / 4, H - 1.5 - i * 1.5), (-ra * .6, R(10 + i * 8), 0), WOOD, 0)
    # chimney
    K.box((2.4, 2.4, 9.0), (-W / 2 + 2.0, D / 2 - 2.0, H + 3.5), mat='brick', bev=.12)
    K.box((2.8, 2.8, .6), (-W / 2 + 2.0, D / 2 - 2.0, H + 8.2), mat='concrete', bev=.08)
    # rubble heaps, fallen beams, scattered tiles
    for i in range(46):
        x = W * .1 + rnd.uniform(0, W * .45); y = rnd.uniform(-D * .45, D * .45)
        z = .8 + rnd.uniform(0, 2.4) * (1 - abs(y) / D)
        s = rnd.uniform(.8, 2.2)
        K.box((s, s * rnd.uniform(.5, 1.0), s * .7), (x, y, z), (rnd.random(), rnd.random(), rnd.random() * 3), 'brick' if i % 3 else 'concrete', .1)
    for i in range(8):
        K.box((rnd.uniform(5, 9), .5, .5), (rnd.uniform(-4, 10), rnd.uniform(-6, 6), rnd.uniform(1.4, 3)), (rnd.uniform(-.3, .3), rnd.uniform(-.5, .5), rnd.random() * 3), WOOD, 0)
    for i in range(14):
        K.box((1.6, 1.0, .2), (rnd.uniform(-W / 2 - 3, W / 2 + 3), rnd.uniform(-D / 2 - 4, D / 2 + 4), .45), (rnd.random() * .3, 0, rnd.random() * 3), 'plate', 0)
    # broken fence along the front
    for i in range(9):
        if i in (3, 6): continue
        x = -14 + i * 3.2
        K.box((.5, .5, 3.4 - (i % 3) * .5), (x, -D / 2 - 5.5, 1.7), (0, rnd.uniform(-.15, .15), 0), WOOD, 0)
    for z in (1.4, 2.7):
        K.box((9.0, .3, .45), (-9.4, -D / 2 - 5.5, z), mat=WOOD, bev=0)
        K.box((5.6, .3, .45), (3.0, -D / 2 - 5.5, z - .3), (0, R(6), 0), WOOD, 0)
    return K, dict(cam=(46, -50, 38), tgt=(0, 0, 5))


def water_tower():
    K = Kit()
    LZ, TR, TH = 22.0, 7.0, 9.0
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        b = (math.cos(a) * 9.5, math.sin(a) * 9.5, 0); t = (math.cos(a) * 5.4, math.sin(a) * 5.4, LZ)
        K.tube([b, t], .55, 'steel', 8)
        K.box((2.4, 2.4, 1.4), (b[0], b[1], .7), mat='concrete', bev=.12)
    for z0, z1 in ((1.5, 9.0), (9.0, 16.0), (16.0, LZ - .5)):
        for k in range(4):
            a0, a1 = math.pi / 4 + k * math.pi / 2, math.pi / 4 + (k + 1) * math.pi / 2
            r0, r1 = 9.5 - (9.5 - 5.4) * z0 / LZ, 9.5 - (9.5 - 5.4) * z1 / LZ
            p = [(math.cos(a0) * r0, math.sin(a0) * r0, z0), (math.cos(a1) * r1, math.sin(a1) * r1, z1)]
            q = [(math.cos(a1) * r0, math.sin(a1) * r0, z0), (math.cos(a0) * r1, math.sin(a0) * r1, z1)]
            K.tube(p, .16, 'steel', 6); K.tube(q, .16, 'steel', 6)
            K.tube([(math.cos(a0) * r1, math.sin(a0) * r1, z1), (math.cos(a1) * r1, math.sin(a1) * r1, z1)], .22, 'steel', 6)
    K.cyl(TR + .4, TR + .4, .8, (0, 0, LZ + .4), mat='gun', segs=32, bev=.1)
    K.cyl(TR, TR, TH, (0, 0, LZ + .8 + TH / 2), mat='rust', segs=32, bev=.15)
    for z in (LZ + 3.0, LZ + 6.0):
        K.lathe([(TR + .08, z - .2), (TR + .08, z + .2)], 32, mat='dark')
    K.cyl(TR + .3, .6, 3.6, (0, 0, LZ + .8 + TH + 1.8), mat='rust', segs=32, bev=.1)
    K.cyl(.7, .4, 1.4, (0, 0, LZ + TH + 4.4), mat='steel', segs=10, bev=.05)
    K.tube(ring_pts(0, 0, TR + 1.2, LZ + 1.6, 40), .12, 'steel', 6)
    for i in range(16):
        a = 2 * math.pi * i / 16
        K.box((.15, .15, 1.6), (math.cos(a) * (TR + 1.2), math.sin(a) * (TR + 1.2), LZ + .8), mat='steel', bev=0)
    K.box((2.8, 2.8, .25), (0, 0, LZ + .9), mat='gun', bev=0)
    for z in range(1, int(LZ + TH), 1):                                   # ladder up a leg and the tank
        r = 9.5 - (9.5 - 5.4) * min(z, LZ) / LZ if z <= LZ else TR + .5
        K.box((.15, 1.4, .15), (r * .707 + .3, -r * .707 - .3, z), (0, 0, R(45)), 'steel', 0)
    K.tube([(0, 0, LZ), (0, 0, 2.0), (3.0, 0, .8)], .45, 'dark', 8)        # down pipe
    return K, dict(cam=(42, -46, 40), tgt=(0, 0, 15))


def pillbox():
    K = Kit(); rnd = random.Random(5)
    R0, H = 7.0, 4.6
    pts = [(R0 * math.cos(a), R0 * math.sin(a)) for a in [R(30 + 60 * i) for i in range(6)]]
    K.prism([(0, 0), (R0 + .6, 0), (R0, H), (0, H)], 1, mat='concrete') if False else None
    K.cyl(R0 + .6, R0, H, (0, 0, H / 2), mat='concrete', segs=6, bev=.25)
    K.cyl(R0 + .3, R0 - .6, 1.2, (0, 0, H + .6), mat='concrete', segs=6, bev=.25)
    for i in range(6):                                                    # gun slits
        a = R(60 * i)
        if i == 3: continue
        K.box((.6, 3.4, .7), ((R0 + .05) * math.cos(a), (R0 + .05) * math.sin(a), 2.9), (0, 0, a), 'dark', 0)
    K.box((2.6, .6, 3.2), (-R0 - .1, 0, 1.6), (0, 0, R(90)), 'door', 0)
    K.cyl(1.0, 1.0, .5, (0, 0, H + 1.4), mat='gun', segs=10, bev=.08)
    K.cylx(.2, 4.0, (2.2, 0, H + 1.4), 'dark', 6, 0)
    sandbag_ring(K, 0, 0, 10.0, 10.0, 0, 3, gap=(math.pi, .32))
    for i in range(4):
        K.box((2.2, 1.4, 1.2), (-11.5 + rnd.uniform(-1, 1), -4 + i * 2.6, .6 + (i % 2) * 1.2), (0, 0, rnd.uniform(-.3, .3)), 'plate', .1)
    for i in range(3):
        K.cyl(.9, .9, 2.4, (9.0 + i * 1.0, 9.0 - i * 2.0, 1.2), mat='rust', segs=12, bev=.08)
    for i in range(5):                                                     # barbed-wire pickets
        a = R(-60 + i * 30)
        K.box((.2, .2, 2.6), (13.5 * math.cos(a), 13.5 * math.sin(a), 1.3), mat='steel', bev=0)
    K.tube([(13.5 * math.cos(R(-60 + i * 7.5)), 13.5 * math.sin(R(-60 + i * 7.5)), 2.0 + .3 * math.sin(i)) for i in range(17)], .08, 'steel', 4)
    return K, dict(cam=(36, -38, 30), tgt=(0, 0, 2))


def traps():
    K = Kit(); rnd = random.Random(9)
    def hedgehog(x, y, rot, s=1.0):
        for ax in ((1, 0, 0), (0, 1, 0), (0, 0, 1)):
            r = (R(45) * ax[1], R(45) * ax[0], rot + R(45) * ax[2])
            K.box((6.0 * s, .6 * s, .6 * s), (x, y, 2.0 * s), r, 'rust', .05)
    for i, (x, y) in enumerate(((-9, -6), (-3, -8), (4, -6.5), (10, -8), (-6, 6), (2, 7.5), (9, 5))):
        hedgehog(x + rnd.uniform(-.8, .8), y + rnd.uniform(-.8, .8), rnd.random() * 3, rnd.uniform(.9, 1.1))
    for i in range(7):                                                    # dragon's teeth
        x = -12 + i * 4.0
        K.hull([[(x - 1.4, -1.4, 0), (x + 1.4, -1.4, 0), (x - 1.4, 1.4, 0), (x + 1.4, 1.4, 0), (x - .5, -.5, 3.6), (x + .5, -.5, 3.6), (x - .5, .5, 3.6), (x + .5, .5, 3.6)]],
               loc=(0, rnd.uniform(-.4, .4), 0), mat='concrete', bev=.15)
    return K, dict(cam=(34, -36, 26), tgt=(0, 0, 1))


def fuel_depot():
    K = Kit()
    for y in (-5.0, 5.0):
        K.cylx(4.0, 20.0, (0, y, 5.0), 'rust', 28, .2)
        for x in (-10.1, 10.1):
            K.sphere(4.0, (x, y, 5.0), 'rust', 20, scl=(.35, 1, 1))
        for x in (-6, 0, 6):
            K.lathe([(4.08, -.3), (4.08, .3)], 28, (x, y, 5.0), (0, R(90), 0), 'dark')
        for x in (-7, 7):
            K.box((1.6, 7.0, 3.0), (x, y, 1.5), mat='concrete', bev=.12)
        K.cyl(.6, .6, 1.4, (2.0, y, 9.4), mat='steel', segs=10, bev=.05)
    K.tube([(10.5, -5.0, 3.2), (13.5, -5.0, 3.2), (13.5, 5.0, 3.2), (10.5, 5.0, 3.2)], .45, 'steel', 8)
    K.tube([(13.5, 0, 3.2), (13.5, 0, 1.0), (13.5, 9.0, 1.0)], .45, 'steel', 8)
    K.box((4.0, 4.0, 4.4), (12.0, 10.5, 2.2), mat='plate', bev=.15)
    K.box((4.6, 4.6, .4), (12.0, 10.5, 4.6), mat='rust', bev=.05)
    K.box((.25, 2.6, 2.6), (14.1, 10.5, 2.0), mat='door', bev=0)
    K.box((24.0, .5, .6), (0, -10.5, 1.5), mat='haz', bev=0)
    for x in range(-12, 13, 4):
        K.box((.3, .3, 3.0), (x, -10.5, 1.5), mat='steel', bev=0)
    return K, dict(cam=(40, -44, 32), tgt=(1, 0, 3))


def wreck_tank():
    K = Kit(); rnd = random.Random(11)
    WX = [-9.2, -4.6, 0, 4.6, 9.2]
    for s in (-1, 1):
        if s > 0:
            tracks(K, s * 8.6, WX, 2.6, 2.2, (-12.4, 4.2, 1.9), (12.4, 4.0, 1.8), 5.6, link=1.3)
        else:
            for x in WX:
                K.cyly(2.2, 2.0, (x, s * 8.6, 2.6), 'char', 16, .1)
            for i in range(14):                                                 # thrown track lying behind
                K.box((1.4, 5.4, .4), (-13.0 - i * .9 * math.cos(.3), s * (10.5 + i * .6), .3), (0, 0, .3), 'dark', 0)
    K.prism([(-12.6, 2.4), (10.8, 2.4), (13.8, 5.4), (13.8, 7.0), (-12.8, 7.0), (-13.2, 3.8)], 12.0, mat='char', bev=.3)
    hl = []
    for sy in (-1, 1):
        hl += [(-13.0, sy * 11.0, 6.8), (13.2, sy * 11.0, 6.8), (15.2, sy * 10.0, 7.4), (9.0, sy * 10.0, 9.6), (-11.6, sy * 10.0, 9.6)]
    K.hull([hl], mat='char', bev=.35)
    K.cyl(5.6, 5.6, .6, (0, 0, 9.7), mat='dark', segs=24, bev=.05)            # empty turret ring
    for i in range(10):                                                       # blackened skirts, some missing
        if i in (2, 6): continue
        x = -12 + i * 2.6
        K.box((2.4, .5, 3.4), (x, -11.4, 5.4), (rnd.uniform(-.25, .25), 0, 0), 'rust', .06)
    # turret blown off, resting upside-down-ish beside the hull, barrel bent
    tp = M((-4.0, 15.0, 4.6), (R(160), R(15), R(40)))
    K.hull([[(x, sy * w, z) for sy in (-1, 1) for (x, w, z) in ((7, 3, 0), (-8, 6, 0), (5, 2.6, 4.2), (-7, 5, 4.2), (8.4, 1.6, 2))]], mat='char', bev=.3, P=tp)
    K.tube([tp @ Vector((8, 0, 2)), tp @ Vector((14, 0, 2.4)), tp @ Vector((19, 1.5, 4.5))], .7, 'rust', 10)
    for i in range(20):                                                       # debris and scorched plates
        K.box((rnd.uniform(.8, 2.4), rnd.uniform(.6, 1.8), .3), (rnd.uniform(-16, 16), rnd.uniform(-15, 15), .3), (rnd.random() * .4, rnd.random() * .4, rnd.random() * 3), rnd.choice(['char', 'rust', 'dark']), .04)
    return K, dict(cam=(44, -48, 34), tgt=(0, 2, 3))


def wreck_truck():
    K = Kit(); rnd = random.Random(13)
    K.box((22.0, 6.0, 1.2), (0, 0, 2.4), mat='char', bev=.12)
    for x, y, ok in ((-8, -4, 1), (-8, 4, 0), (-3, -4, 1), (-3, 4, 1), (7.5, -4, 0), (7.5, 4, 1)):
        if ok: K.cyly(2.0, 1.6, (x, y, 2.0 if ok else 1.2), 'dark', 14, .12)
        K.cyly(.9, 1.8, (x, y, 2.0), 'char', 10, .05)
    cab = []
    for sy in (-1, 1):
        cab += [(4.0, sy * 3.6, 3.0), (10.4, sy * 3.6, 3.0), (11.0, sy * 3.4, 5.6), (8.6, sy * 3.2, 9.4), (4.0, sy * 3.4, 9.4)]
    K.hull([cab], mat='char', bev=.25)
    K.box((.3, 5.4, 2.6), (9.9, 0, 7.6), (0, R(-30), 0), 'dark', 0)          # glassless windscreen hole
    K.box((2.0, 6.6, 1.4), (11.6, 0, 3.6), mat='rust', bev=.15)
    K.box((14.0, 7.2, .5), (-4.0, 0, 3.4), (R(3), R(4), 0), 'rust', .06)       # sagging bed
    for s in (-1, 1):
        K.box((14.0, .4, 2.4), (-4.0, s * 3.5, 4.8), (rnd.uniform(-.2, .2), 0, 0), 'rust', .05)
    for i in range(5):
        K.box((.35, 7.0, .35), (-10 + i * 3.0, 0, 7.4 - (i % 2) * 1.6), (rnd.uniform(-.3, .3), rnd.uniform(-.5, .5), 0), 'dark', 0)
    for i in range(12):
        K.box((rnd.uniform(.6, 1.8), rnd.uniform(.5, 1.4), .3), (rnd.uniform(-14, 14), rnd.uniform(-9, 9), .3), (0, 0, rnd.random() * 3), rnd.choice(['char', 'rust']), .03)
    return K, dict(cam=(34, -38, 26), tgt=(0, 0, 3))


def pole():
    K = Kit()
    K.cyl(.55, .4, 22.0, (0, 0, 11.0), mat='rust', segs=10, bev=.05)
    K.box((.5, 7.0, .6), (0, 0, 20.4), mat='rust', bev=.05)
    for y in (-3.0, -1.5, 1.5, 3.0):
        K.cyl(.22, .22, .4, (0, y, 20.9), mat='steel', segs=6, bev=0)
        K.cyl(.32, .2, .7, (0, y, 21.4), mat='ceram', segs=10, bev=0)
    K.tube([(0, 0, 18.0), (0, 1.6, 20.2)], .1, 'steel', 6)
    K.box((.3, .3, 1.4), (0, 0, 2.4), mat='steel', bev=0)
    return K, dict(cam=(16, -18, 20), tgt=(0, 0, 11))


ALL = [ruin_house, water_tower, pillbox, traps, fuel_depot, wreck_tank, wreck_truck, pole]
if __name__ == '__main__':
    names = [f.__name__ for f in ALL] if sys.argv[1] == 'all' else [sys.argv[1]]
    for n in names:
        reset()
        K, cam = {f.__name__: f for f in ALL}[n]()
        finish(K, 'p_' + n, {'body': (0, 0, 0)}, res=(512, 512), preview_on='--nopreview' not in sys.argv, lens=45, **cam)
    print('done')
