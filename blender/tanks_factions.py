"""Iron Syndicate and Helix battle tanks ('tank'), original designs.
Run: python3 tanks_factions.py syn|helix [--nopreview]
Game coordinates: +X forward, Z up. Turret pivots match the code-built models."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *
import cfkit

PAL['spike'] = ((.55, .58, .56), .85, .25, 0)
PAL['crys'] = ((.7, .36, .95), 0, .25, 1.6)


def glacis(x0, z0, x1, z1):
    a = math.atan2(z1 - z0, x0 - x1)
    return (lambda f, h=0: (x0 + (x1 - x0) * f + math.sin(a) * h, z0 + (z1 - z0) * f + math.cos(a) * h)), a


def octa(K, x, y, z, r, sz=1.0, mat='crys', grp='body'):
    K.hull([[(x + r, y, z), (x - r, y, z), (x, y + r, z), (x, y - r, z), (x, y, z + r * sz), (x, y, z - r * sz)]], mat=mat, bev=0, grp=grp)


# =====================================================================
def build_syn():
    """Iron Syndicate 'Ravager': twin tracks a side, slab armour, spiked dozer blade, twin-gun turret with a rocket pod"""
    PAL['TEAM'] = ((.55, .07, .05), .45, .5, 0)
    K = Kit(); T = 'turret'
    WX = [-13.2, -7.9, -2.6, 2.6, 7.9, 13.2]
    for s in (-1, 1):
        tracks(K, s * 13.5, WX, 2.9, 2.2, (-16.6, 4.7, 2.0), (16.4, 4.4, 1.9), 5.8, link=1.1)
        # inner track is mostly hidden under the hull: coarser links, fewer wheels
        tracks(K, s * 7.5, [-12, -4, 4, 12], 2.9, 2.2, (-16.6, 4.7, 2.0), (16.4, 4.4, 1.9), 5.8, link=1.7)
    # lower hull between the inner tracks, upper hull over all four
    K.prism([(-17.2, 2.6), (14.6, 2.6), (18.8, 6.4), (18.8, 8.6), (-17.8, 8.6), (-18.4, 5.0)], 9.2, mat='gun', bev=.3)
    hl = []
    for sy in (-1, 1):
        hl += [(-18.4, sy * 17.0, 8.3), (16.6, sy * 17.0, 8.3), (19.8, sy * 15.2, 9.4), (13.4, sy * 12.4, 13.4),
               (-15.8, sy * 12.4, 13.4), (-18.9, sy * 15.6, 11.4)]
    K.hull([hl], mat='gun', bev=.35)
    # heavy riveted side skirts, slanted, in team colour
    for s in (-1, 1):
        for x0, x1 in ((-18.0, -9.4), (-9.2, -.6), (-.4, 8.2), (8.4, 17.6)):
            K.box((x1 - x0, .9, 5.2), ((x0 + x1) / 2, s * 17.5, 6.4), (s * R(-9), 0, 0), 'TEAM', .2)
            for bx in (x0 + .9, (x0 + x1) / 2, x1 - .9):
                for bz in (4.5, 8.2):
                    K.cyly(.32, .5, (bx, s * (17.95 + (bz - 6.4) * math.tan(R(9))), bz), "steel", 8, 0)
        K.box((17.0, .5, .6), (-1, s * 17.0, 9.2), mat='rust', bev=.05)            # rusted rail along the skirt top
        # angled front mud guards
        K.box((4.6, 11.6, .5), (18.4, s * 10.6, 8.9), (0, R(-18), 0), 'gun', .12)
    # sloped top plates with weld seams and armour bolts
    gl, ga = glacis(19.8, 9.4, 13.4, 13.4)
    for f in (.2, .55, .85):
        x, z = gl(f, .1); K.box((.35, 24.0, .2), (x, 0, z), (0, ga, 0), 'dark', 0)
    for y in (-9, -4.5, 0, 4.5, 9):
        x, z = gl(.4, .25); K.cyl(.45, .4, .5, (x, y, z), (0, ga, 0), 'steel', 6, 0)
    x, z = gl(.7, .3); K.box((2.6, 5.0, .6), (x, 4.0, z), (0, ga, 0), 'gun', .15)   # driver's hatch
    for dy in (-1.4, 0, 1.4):
        K.box((.5, .8, .55), (x + .9, 4.0 + dy, z + .4), (0, ga, 0), 'win', .05)
    # dozer blade with hazard chevrons and a row of ram spikes
    K.prism([(18.6, 1.4), (21.6, 1.4), (24.8, 8.2), (21.8, 8.2)], 31.0, mat='TEAM', bev=.25)
    K.prism([(21.3, 1.0), (22.2, 1.0), (25.4, 8.2), (24.5, 8.2)], 31.6, mat='gun', bev=.15)
    for y in range(-13, 15, 4):
        K.box((.25, 1.6, 6.6), (23.1, y, 4.8), (R(28), R(-25), 0), 'haz', 0)
    for y in (-13.5, -9, -4.5, 0, 4.5, 9, 13.5):
        K.cylx(1.0, 4.2, (26.6, y, 5.2), 'spike', 8, 0, r2=.05)
        K.cylx(1.15, .7, (24.9, y, 5.2), 'steel', 8, .05)
    for s in (-1, 1):   # hydraulic rams holding the blade
        K.tube([(15.5, s * 9.0, 9.0), (21.5, s * 9.0, 5.6)], .55, 'steel', 10)
        K.cyl(1.0, 1.0, 1.4, (15.5, s * 9.0, 9.0), (R(90), 0, 0), 'gun', 12, .1)
        K.cylx(.9, 1.2, (19.6, s * 12.4, 10.0), 'steel', 14, .08)
        K.cylx(.68, .2, (20.25, s * 12.4, 10.0), 'lamp', 14, 0)
        K.box((1.3, 3.0, .35), (19.9, s * 12.4, 10.9), mat='dark', bev=0)
    # engine deck: big grille, twin exhaust stacks, spare road wheel, fuel drums
    K.box((9.0, 12.0, .3), (-11.6, 0, 13.5), mat='dark', bev=0)
    for i in range(10):
        K.box((.35, 11.6, .35), (-15.6 + i * .9, 0, 13.7), mat='steel', bev=0)
    for s in (-1, 1):
        K.cyl(1.25, 1.45, 6.0, (-17.0, s * 7.0, 15.6), mat='rust', segs=14, bev=.1)
        K.cyl(1.55, 1.55, .6, (-17.0, s * 7.0, 18.4), mat='dark', segs=14, bev=.05)
        K.box((1.4, 1.6, 4.0), (-17.0, s * 7.0, 11.0), mat='gun', bev=.15)
        K.cyly(1.6, 2.2, (-14.0, s * 14.6, 13.5), 'rust', 14, .12)               # fuel drums on the sponsons
        for dy in (-.7, .7):
            K.cyly(1.68, .2, (-14.0, s * 14.6 + dy, 13.5), 'dark', 14, 0)
    K.cylx(2.4, 1.6, (-19.2, 0, 10.6), 'rubber', 18, .2)
    K.cylx(1.5, 1.8, (-19.2, 0, 10.6), 'gun', 14, .1)
    K.box((1.2, 30.0, .25), (-16.0, 0, 13.45), mat='TEAM', bev=0)
    # ---- turret: low faceted wedge, pivot (-1,0,14.4) ----
    TX, TZ = -1.0, 14.4
    K.cyl(8.6, 8.6, .9, (TX, 0, TZ - .2), mat='dark', segs=40, bev=.1, grp=T)
    tb = []
    for sy in (-1, 1):
        tb += [(TX + 12.6, sy * 4.2, TZ), (TX + 8.0, sy * 9.4, TZ), (TX - 10.0, sy * 9.6, TZ), (TX - 12.8, sy * 6.4, TZ),
               (TX + 9.0, sy * 3.6, TZ + 6.6), (TX + 5.6, sy * 7.8, TZ + 6.6), (TX - 8.6, sy * 8.0, TZ + 6.6), (TX - 11.2, sy * 5.2, TZ + 5.4)]
    K.hull([tb], mat='TEAM', bev=.4, grp=T)
    # dark armour cap and cheek plates
    cap = []
    for sy in (-1, 1):
        cap += [(TX + 7.4, sy * 3.2, TZ + 6.5), (TX + 4.6, sy * 6.8, TZ + 6.5), (TX - 7.6, sy * 7.0, TZ + 6.5),
                (TX + 5.4, sy * 2.6, TZ + 8.4), (TX + 3.0, sy * 5.6, TZ + 8.4), (TX - 6.4, sy * 5.8, TZ + 8.4)]
    K.hull([cap], mat='gun', bev=.3, grp=T)
    for s in (-1, 1):
        K.hull([[(TX + 13.4, s * 4.4, TZ + .4), (TX + 8.8, s * 9.9, TZ + .4), (TX + 7.0, s * 9.9, TZ + .4),
                 (TX + 10.0, s * 4.0, TZ + 5.8), (TX + 6.6, s * 8.4, TZ + 5.8)]], mat='gun', bev=.25, grp=T)
        for k in range(3):
            K.cyl(.38, .32, .4, (TX + 10.6 - k * 1.6, s * (5.6 + k * 1.3), TZ + 3.6), (0, R(-40), s * R(-40)), 'steel', 6, 0, grp=T)
    # twin guns in a box mantlet
    GZ = 18.1
    K.box((4.6, 10.6, 5.0), (TX + 13.2, 0, GZ - .2), mat='gun', bev=.45, grp=T)
    for y in (-3.0, 3.0):
        K.box((2.4, 3.2, 3.6), (TX + 16.2, y, GZ), mat='gun', bev=.3, grp=T)
        K.cylx(1.0, 6.0, (TX + 20.0, y, GZ), 'gun', 18, .1, grp=T)
        K.cylx(.82, 15.0, (TX + 30.5, y, GZ), 'steel', 16, .05, grp=T, r2=.76)
        K.cylx(1.45, 2.2, (TX + 24.0, y, GZ), 'gun', 18, .1, grp=T)
        for x in (TX + 19.0, TX + 27.5, TX + 35.0):
            K.cylx(.95, .3, (x, y, GZ), 'dark', 16, 0, grp=T)
        K.box((3.8, 2.4, 2.4), (TX + 39.6, y, GZ), mat='gun', bev=.25, grp=T)
        for dx in (-.9, .4):
            K.box((.6, 2.5, 1.3), (TX + 39.6 + dx, y, GZ), mat='dark', bev=0, grp=T)
        K.cylx(.4, .3, (TX + 41.55, y, GZ), 'dark', 10, 0, grp=T)
    # rocket pod on the left cheek, orange warheads
    K.box((9.0, 4.0, 4.6), (TX - 1.0, -11.6, TZ + 4.0), mat='gun', bev=.3, grp=T)
    K.box((9.2, 4.2, .5), (TX - 1.0, -11.6, TZ + 6.4), mat='TEAM', bev=.1, grp=T)
    for yy in (-12.6, -10.6):
        for zz in (TZ + 3.0, TZ + 5.0):
            K.cylx(.75, .6, (TX + 3.6, yy, zz), 'dark', 10, 0, grp=T)
            K.cylx(.62, 1.4, (TX + 4.2, yy, zz), 'orange', 10, 0, grp=T, r2=.1)
    K.box((3.0, 3.0, 1.6), (TX - 1.0, -9.6, TZ + 2.6), mat='gun', bev=.15, grp=T)
    # commander hatch, searchlight, spikes along the rear, antenna
    K.cyl(2.0, 1.9, 1.0, (TX - 2.0, 3.0, TZ + 8.9), mat='gun', segs=20, bev=.15, grp=T)
    K.cyl(1.6, 1.6, .4, (TX - 2.0, 3.0, TZ + 9.5), mat='TEAM', segs=20, bev=.1, grp=T)
    K.box((1.6, 1.4, 1.4), (TX + 4.2, 5.4, TZ + 9.0), mat='gun', bev=.15, grp=T)
    K.cylx(.55, .2, (TX + 5.05, 5.4, TZ + 9.0), 'lamp', 12, 0, grp=T)
    for y in (-6.4, -3.2, 0, 3.2, 6.4):
        K.cyl(.85, .05, 4.2, (TX - 12.8, y, TZ + 4.8), (0, R(-60), 0), 'spike', 6, 0, grp=T)
    for s in (-1, 1):
        K.cyl(.9, .05, 4.4, (TX - 8.0, s * 8.6, TZ + 7.8), (s * R(30), R(-30), 0), 'spike', 6, 0, grp=T)
    K.cyl(.3, .4, .7, (TX - 9.0, 6.0, TZ + 6.4), mat='dark', segs=8, bev=0, grp=T)
    K.cyl(.05, .1, 9, (TX - 9.0, 6.0, TZ + 11.0), mat='dark', segs=5, bev=0, grp=T)
    K.box((3.0, 8.0, 2.6), (TX - 12.6, 0, TZ + 2.0), mat='gun', bev=.25, grp=T)  # bustle box
    K.tube([(TX - 13.6, -4.2, TZ + 3.6), (TX - 14.6, -4.2, TZ + 1.2), (TX - 14.6, 4.2, TZ + 1.2), (TX - 13.6, 4.2, TZ + 3.6)], .18, 'rust', 8, grp=T)
    K.empty('muzzle', (TX + 41.7, 3.0, GZ), T)
    return K, {'body': (0, 0, 0), T: (TX, 0, TZ)}


# =====================================================================
def build_helix():
    """Helix 'Lancer': sculpted ceramic hull on four big exposed road wheels a side, long rail cannon with
    glowing charge coils, crystal reactor in a cradle behind the turret"""
    PAL['TEAM'] = ((.05, .42, .38), .45, .45, 0)
    PAL['GLOW'] = ((.4, 1, .9), 0, .4, 5)
    K = Kit(); T = 'turret'
    WX = [-11.4, -3.8, 3.8, 11.4]
    for s in (-1, 1):
        yc = s * 10.6
        # thin track around big road wheels
        tracks(K, yc, WX, 3.4, 3.1, (-15.8, 4.6, 2.0), (15.8, 4.6, 2.0), 6.4, link=1.0)
        # fender: smooth curved shell over the running gear, glow strip on its flank
        fp = [(-17.6, 7.8), (-16.8, 9.8), (-12, 10.6), (13, 10.6), (17.4, 9.6), (18.4, 7.6), (16.2, 8.0), (-15.6, 8.4)]
        K.prism(fp, 8.0, (0, yc, 0), mat='TEAM', bev=.45)
        K.box((24.0, .3, .5), (-.5, yc + s * 4.1, 9.0), mat='GLOW', bev=0)
        K.box((26.0, 4.8, .4), (-1.0, yc, 10.75), mat='ceram', bev=.12)
        for x in (-9, -3, 3, 9):
            K.box((.4, 5.0, .3), (x, yc, 10.95), mat='dark', bev=0)
        K.box((22.0, 7.4, 1.2), (-1.0, yc, 2.2), mat='gun', bev=.2)          # belly sponson between the wheels
    # central hull: smooth lozenge built from stacked loops
    loops = []
    for x, w, z0, z1 in ((-17.2, 4.5, 5.2, 10.6), (-15.0, 7.0, 4.4, 12.2), (-6, 7.2, 4.0, 13.4), (6, 7.0, 4.0, 13.2),
                         (13.0, 6.2, 4.4, 12.0), (17.4, 4.6, 5.0, 9.8), (19.6, 3.0, 6.2, 8.4)):
        loops.append([(x, sy * w, z) for sy in (-1, 1) for z in (z0, z1)])
    K.hull(loops, mat='TEAM', bev=.6)
    # ceramic armour plates on the deck and nose
    K.hull([[(x, sy * w, z) for sy in (-1, 1) for (x, w, z) in ((-12, 6.4, 13.25), (10, 6.2, 13.1), (14.6, 5.4, 12.0), (-14.2, 5.6, 12.4))]
            + [(x, sy * (w - .6), z + .45) for sy in (-1, 1) for (x, w, z) in ((-11.5, 6.4, 13.25), (9.6, 6.2, 13.1))]],
           mat='ceram', bev=.25)
    gl, ga = glacis(19.0, 8.6, 13.0, 12.0)
    K.hull([[(*gl(f)[:1], sy * w, gl(f)[1] + .15) for f, w in ((.05, 3.2), (.95, 5.6)) for sy in (-1, 1)]
            + [(gl(f, .4)[0], sy * (w - .5), gl(f, .4)[1] + .15) for f, w in ((.15, 3.0), (.85, 5.2)) for sy in (-1, 1)]], mat='ceram', bev=.15)
    for y in (-2.6, 0, 2.6):
        K.sphere(.85, (19.4, y, 7.6), mat='orange', segs=12)
    K.box((.5, 9.0, 1.0), (19.2, 0, 9.4), (0, R(-34), 0), 'dark', 0)
    # rear: heat sink fins and twin thruster vents
    for i in range(7):
        K.box((.3, 10.0, 2.2), (-13.6 - i * .55, 0, 12.6 - i * .35), mat='steel', bev=0)
    for s in (-1, 1):
        K.cylx(1.6, 1.4, (-17.6, s * 3.6, 8.2), 'gun', 18, .15)
        K.cylx(1.15, .3, (-18.35, s * 3.6, 8.2), 'GLOW', 18, 0)
    # ---- turret: teardrop shell, pivot (-1.5,0,14) ----
    TX, TZ = -1.5, 14.0
    K.cyl(7.6, 7.6, .8, (TX, 0, TZ - .1), mat='dark', segs=40, bev=.1, grp=T)
    rings = []
    for z, sc in ((TZ, 1.0), (TZ + 3.4, .97), (TZ + 6.2, .78), (TZ + 7.0, .55)):
        pts = []
        for i in range(28):
            a = 2 * math.pi * i / 28
            rx = 10.4 if math.cos(a) > 0 else 10.8
            pts.append((TX + math.cos(a) * rx * sc, math.sin(a) * 7.4 * sc * (1 - .25 * max(0, math.cos(a)) ** 3), z))
        rings.append(pts)
    K.hull(rings, mat='TEAM', bev=.5, grp=T)
    # ceramic cap plate and side sensor blisters
    rc = []
    for z, sc in ((TZ + 6.25, .74), (TZ + 7.15, .5)):
        for i in range(20):
            a = 2 * math.pi * i / 20
            rc.append((TX - 1 + math.cos(a) * 9.4 * sc, math.sin(a) * 6.6 * sc, z))
    K.hull([rc], mat='ceram', bev=.2, grp=T)
    for s in (-1, 1):
        K.sphere(1.3, (TX + 4.6, s * 6.5, TZ + 4.4), mat='gun', segs=14, scl=(1.6, 1, .8), grp=T)
        K.sphere(.7, (TX + 6.4, s * 6.6, TZ + 4.5), mat='win', segs=12, grp=T)
    # rail cannon: housing, twin rails, glowing coils, muzzle block
    GZ = 17.6
    K.box((7.0, 5.6, 4.6), (TX + 11.4, 0, GZ - .1), mat='gun', bev=.6, grp=T)
    K.box((2.4, 4.2, 3.6), (TX + 15.2, 0, GZ), mat='TEAM', bev=.3, grp=T)
    for s in (-1, 1):
        K.box((30.0, .9, 1.7), (TX + 31.4, s * 1.25, GZ), mat='steel', bev=.15, grp=T)
        K.box((30.0, .3, .6), (TX + 31.4, s * 1.75, GZ), mat='dark', bev=0, grp=T)
    K.box((30.0, 1.6, .5), (TX + 31.4, 0, GZ - .7), mat='gun', bev=.1, grp=T)
    for x in (TX + 20, TX + 25.5, TX + 31, TX + 36.5):
        K.cylx(1.75, .9, (x, 0, GZ), 'GLOW', 20, 0, grp=T)
        K.cylx(2.0, .4, (x - .65, 0, GZ), 'gun', 20, .05, grp=T)
        K.cylx(2.0, .4, (x + .65, 0, GZ), 'gun', 20, .05, grp=T)
    K.box((5.2, 4.6, 3.6), (TX + 47.8, 0, GZ), mat='gun', bev=.5, grp=T)
    K.box((5.4, 1.4, 1.2), (TX + 48.0, 0, GZ), mat='dark', bev=0, grp=T)
    K.cylx(.9, .3, (TX + 50.45, 0, GZ), 'GLOW', 14, 0, grp=T)
    # crystal reactor in a cradle at the back of the turret
    for s in (-1, 1):
        K.box((5.0, .7, 4.6), (TX - 10.8, s * 2.8, TZ + 4.6), mat='gun', bev=.2, grp=T)
        K.box((1.2, .5, 3.4), (TX - 12.6, s * 2.8, TZ + 5.4), mat='GLOW', bev=0, grp=T)
    octa(K, TX - 10.8, 0, TZ + 6.2, 2.7, 1.9, grp=T)
    octa(K, TX - 12.8, 1.6, TZ + 4.6, 1.5, 1.7, grp=T)
    octa(K, TX - 9.4, -2.0, TZ + 4.2, 1.2, 1.6, grp=T)
    K.cyl(2.8, 2.4, .8, (TX - 10.8, 0, TZ + 2.0), mat='gun', segs=16, bev=.1, grp=T)
    # sensor mast + lamp
    K.box((3.2, 2.2, 1.6), (TX + 1.6, 3.6, TZ + 7.6), mat='gun', bev=.25, grp=T)
    K.sphere(.55, (TX + 3.3, 3.6, TZ + 7.6), mat='lamp', segs=10, grp=T)
    K.cyl(.12, .06, 7, (TX - 6.0, -4.6, TZ + 9.2), mat='dark', segs=5, bev=0, grp=T)
    K.empty('muzzle', (TX + 50.6, 0, GZ), T)
    return K, {'body': (0, 0, 0), T: (TX, 0, TZ)}


if __name__ == '__main__':
    which = sys.argv[1]
    reset()
    K, piv = {'syn': build_syn, 'helix': build_helix}[which]()
    name = {'syn': 'tank_s', 'helix': 'tank_h'}[which]
    finish(K, name, piv, preview_on='--nopreview' not in sys.argv)
    print('done')
