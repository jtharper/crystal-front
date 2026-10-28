"""Refinery - original design, ONE connected building on the ground (footprint 96 x 64: x +-48, y +-32, front = -y).
Left: a drive-in harvester bay sized for the harvesters (clear width ~37, depth ~44, gantry clearance 26) ending in an
intake hopper. Centre: processing hall with twin stacks. Right: open crystal vat at the front, storage silo at the back.
Faction finishes are swapped in-game by material name: WALL, TOWER, TEAM, GLOW.  Run: python3 refinery.py [--preview]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

PAL['crys'] = ((.7, .36, .95), 0, .25, 1.6)
PAL['pool'] = ((.45, .2, .65), .1, .15, .8)
reset()
K = Kit()


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


def octa(x, y, z, r, sz=1.7):
    K.hull([[(x + r, y, z), (x - r, y, z), (x, y + r, z), (x, y - r, z), (x, y, z + r * sz), (x, y, z - r * sz)]], mat='crys', bev=0)


# ================= harvester bay (x -47.6..-8.4, open to the front) =================
BX0, BX1, BY0, BY1 = -47.6, -8.4, -32.0, 12.4          # outer extents; inner clear width ~37.6
BCX = (BX0 + BX1) / 2                                    # -28 = dock axis
K.box((BX1 - BX0, BY1 - BY0, .3), (BCX, (BY0 + BY1) / 2, .15), mat='pad', bev=.05)
for i in range(6):                                       # lead-in chevrons
    y = -29 + i * 6.5
    for s in (-1, 1):
        K.box((6.0, 1.0, .06), (BCX + s * 2.6, y, .33), (0, 0, s * R(-35)), 'yellow', 0)
for s in (-1, 1):                                        # guide lines
    K.box((.5, 40.0, .06), (BCX + s * 17.0, -11.0, .33), mat='yellow', bev=0)
for i in range(13):                                      # hazard sill at the entrance
    K.box((2.9, 1.2, .1), (BX0 + 1.5 + i * 3.0, BY0 + .6, .34), (0, 0, R(30)), 'haz' if i % 2 else 'dark', 0)
# side walls with team fascia, buttresses and wall lights
for x in (BX0 + .7, BX1 - .7):
    K.box((1.4, BY1 - BY0 - 6, 9.0), (x, (BY0 + 6 + BY1) / 2, 4.5), mat='WALL', bev=.2)
    K.box((1.8, BY1 - BY0 - 6, 1.2), (x, (BY0 + 6 + BY1) / 2, 8.6), mat='TEAM', bev=.12)
    K.box((2.0, BY1 - BY0 - 5.6, .5), (x, (BY0 + 6 + BY1) / 2, 9.35), mat='gun', bev=.08)
    sgn = 1 if x > BCX else -1
    for y in (-20, -9, 2):
        K.box((2.6, 1.6, 9.0), (x + sgn * 1.2, y, 4.5), mat='gun', bev=.15)       # outside buttresses
        K.box((.5, 1.6, .7), (x - sgn * .9, y, 6.6), mat='lamp', bev=0)             # inside wall lights
    K.box((.3, 30.0, .6), (x - sgn * .85, -10.0, 3.0), mat='haz', bev=0)            # bump strip
# entrance gantry: two towers + crossbeam with hazard stripes, clearance 26
GY = BY0 + 3.0
for x in (BX0 + 1.6, BX1 - 1.6):
    K.box((3.2, 3.6, 28.0), (x, GY, 14.0), mat='WALL', bev=.3)
    K.box((3.6, 4.0, 1.2), (x, GY, 1.0), mat='gun', bev=.15)
    K.box((3.4, 3.8, 1.0), (x, GY, 18.0), mat='TEAM', bev=.12)
K.box((BX1 - BX0, 3.0, 3.2), (BCX, GY, 28.4), mat='gun', bev=.3)
for i in range(12):
    K.box((1.6, .2, 3.4), (BX0 + 2.8 + i * 3.1, GY - 1.55, 28.4), (0, R(35), 0), 'haz' if i % 2 else 'dark', 0)
K.box((BX1 - BX0 - 3, 2.0, 1.0), (BCX, GY, 26.4), mat='steel', bev=.1)
for x in (BCX - 10, BCX, BCX + 10):
    K.box((1.6, 1.0, .7), (x, GY - .4, 25.6), mat='gun', bev=.08)
    K.box((1.2, .7, .1), (x, GY - .4, 25.2), mat='lamp', bev=0)
K.box((1.2, 1.2, .8), (BCX - 4, GY - 1.7, 28.4), mat='GLOW', bev=.1)                # dock signal lights
K.box((1.2, 1.2, .8), (BCX + 4, GY - 1.7, 28.4), mat='GLOW', bev=.1)
# intake block at the back of the bay: sloped receiving hopper, grate, intake hood
IY0, IY1 = BY1, 22.0
K.box((BX1 - BX0, IY1 - IY0, 14.0), (BCX, (IY0 + IY1) / 2, 7.0), mat='WALL', bev=.3)
K.box((BX1 - BX0 + .6, IY1 - IY0 + .6, 1.4), (BCX, (IY0 + IY1) / 2, 13.4), mat='TEAM', bev=.15)
K.box((BX1 - BX0 + 1.0, IY1 - IY0 + 1.0, .5), (BCX, (IY0 + IY1) / 2, 14.3), mat='gun', bev=.1)
# receiving hopper (open funnel the harvester tips into), its glowing grate and crystals
hp = [(BCX - 15, BY1 - 5.5, 9.0), (BCX + 15, BY1 - 5.5, 9.0), (BCX - 15, BY1 + .2, 9.0), (BCX + 15, BY1 + .2, 9.0),
      (BCX - 11, BY1 - 1.2, 3.0), (BCX + 11, BY1 - 1.2, 3.0), (BCX - 11, BY1 + .2, 3.0), (BCX + 11, BY1 + .2, 3.0)]
K.hull([hp], mat='gun', bev=.25)
K.box((22.0, .4, 5.0), (BCX, BY1 - 1.5, 6.4), (R(-48), 0, 0), 'GLOW', 0)
for i in range(10):
    K.box((.35, .6, 6.4), (BCX - 10 + i * 2.2, BY1 - 1.7, 6.4), (R(-48), 0, 0), 'steel', 0)
for x, z, r in ((-34, 8.8, 1.3), (-30, 9.2, 1.0), (-24, 8.9, 1.2), (-21, 9.1, .9)):
    octa(x, BY1 - 3.4, z, r)
K.box((32.0, 1.0, 1.2), (BCX, BY1 - 5.9, 9.4), mat='haz', bev=.05)
for s in (-1, 1):
    K.box((1.4, 2.4, 9.0), (BCX + s * 15.6, BY1 - 1.0, 4.5), mat='gun', bev=.15)
# intake hood above the hopper
K.hull([[(BCX + s * 16, y, z) for s in (-1, 1) for (y, z) in ((BY1 - 7.5, 19.0), (BY1 - 7.5, 17.6), (BY1, 21.0), (BY1, 15.0))]], mat='TEAM', bev=.3)
K.box((30.0, .4, 1.0), (BCX, BY1 - 7.7, 18.2), mat='lamp', bev=0)

# ================= processing hall (centre) =================
HX0, HX1, HY0, HY1, HZ = -8.4, 21.0, -6.0, 31.0, 16.0
HCX, HCY = (HX0 + HX1) / 2, (HY0 + HY1) / 2
block(rrect(HX1 - HX0, HY1 - HY0, 3), 0, HZ, 'WALL', .35, HCX, HCY)
block(rrect(HX1 - HX0 + .6, HY1 - HY0 + .6, 3.3), HZ - 1.6, 1.6, 'TEAM', .15, HCX, HCY)
block(rrect(HX1 - HX0 + 1.0, HY1 - HY0 + 1.0, 3.5), HZ - .1, .6, 'gun', .12, HCX, HCY)
block(rrect(HX1 - HX0 + .5, HY1 - HY0 + .5, 3.25), 0, 1.0, 'gun', .1, HCX, HCY)
for i in range(6):
    x = HX0 + 3 + i * (HX1 - HX0 - 6) / 5
    K.box((1.0, .7, HZ - 1.8), (x, HY0 - .25, (HZ - 1.8) / 2), mat='gun', bev=.1)
K.box((HX1 - HX0 - 6, .3, 1.8), (HCX, HY0 - .2, 11.2), mat='win', bev=0)              # control gallery glazing
for i in range(10):
    K.box((.3, .5, 1.9), (HX0 + 3 + i * (HX1 - HX0 - 6) / 9, HY0 - .4, 11.2), mat='steel', bev=0)
for y0, y1 in ((2, 10), (14, 26)):
    K.box((.3, y1 - y0, 1.6), (HX1 + .2, (y0 + y1) / 2, 11.2), mat='win', bev=0)
# loading door + canopy on the front
K.box((9.0, .4, 8.0), (HCX, HY0 - .25, 4.0), mat='door', bev=0)
for z in range(1, 9):
    K.box((8.6, .2, .16), (HCX, HY0 - .5, z * .9), mat='steel', bev=0)
K.box((12.0, 4.0, .6), (HCX, HY0 - 2.0, 8.6), mat='TEAM', bev=.15)
for s in (-1, 1):
    K.box((.8, .8, 8.2), (HCX + s * 5.0, HY0 - .55, 4.1), mat='haz', bev=.05)
# twin process stacks rising from the roof
for i, x in enumerate((1.0, 11.0)):
    y = 22.0
    K.cyl(3.0, 3.4, 4.0, (x, y, HZ + 2.0), mat='WALL', segs=24, bev=.15)
    K.cyl(2.4, 2.7, 24.0, (x, y, HZ + 14.0), mat='steel', segs=22, bev=.1)
    for z in (HZ + 10, HZ + 20):
        K.cyl(2.6, 2.6, 2.6, (x, y, z), mat='TEAM', segs=22, bev=.08)
    K.cyl(2.75, 2.75, .8, (x, y, HZ + 26.0), mat='dark', segs=22, bev=.05)
    K.empty('steam%d' % (i + 1), (x, y, HZ + 27.5))
K.tube([(1.0, 19.2, HZ + 17), (11.0, 19.2, HZ + 17)], .3, 'steel', 8)
# roof equipment
for x, y in ((-3, 3), (15, 3), (15, 10)):
    K.box((4.0, 3.0, 2.0), (x, y, HZ + 1.0), mat='steel', bev=.12)
    K.cyl(1.0, 1.0, .3, (x - .6, y, HZ + 2.15), mat='dark', segs=14, bev=0)
K.empty('emblem1', (6.0, 4.0, HZ + .5))

# conveyor gallery: intake block -> hall roof (enclosed, glazed slit)
PC = M(((BX1 + HX0) / 2 + 1.0, 17.0, 17.4), (0, R(-14), 0))
K.box((14.0, 4.6, 3.6), (0, 0, 0), mat='WALL', bev=.25, P=PC)
K.box((14.2, .3, .8), (0, -2.35, .4), mat='win', bev=0, P=PC)
K.box((14.4, 5.0, .5), (0, 0, 2.0), mat='TEAM', bev=.1, P=PC)

# glowing crystal transfer line: hall front -> vat
for dz, r in ((5.0, 1.15),):
    pts = [(HX1 - 1, -2.0, dz), (HX1 + 6, -2.0, dz), (HX1 + 9, -6.0, dz)]
    K.tube(pts, r + .35, 'steel', 14)
    K.tube([(HX1 + 1.5, -2.0, dz), (HX1 + 5.0, -2.0, dz)], r + .45, 'GLOW', 14)
for x in (HX1 + 2, HX1 + 6):
    K.box((.5, .5, 5.0), (x, -2.0, 2.5), mat='gun', bev=0)

# ================= crystal vat (front right) =================
VX, VY, VR, VH = 33.0, -15.5, 13.6, 8.0
K.lathe([(0, 0), (VR + 1.0, 0), (VR + 1.0, .8), (VR, 1.4), (VR, VH), (VR + .9, VH), (VR + .9, VH + .9), (VR - 1.0, VH + .9), (VR - 1.0, 2.0), (0, 2.0)], 56, (VX, VY, 0), mat='WALL', close=False)
K.lathe([(VR + .08, 2.4), (VR + .08, 4.0)], 56, (VX, VY, 0), mat='haz')
K.lathe([(VR + .08, 5.2), (VR + .08, 6.2)], 56, (VX, VY, 0), mat='TEAM')
K.cyl(VR - 1.0, VR - 1.0, .3, (VX, VY, VH - 1.2), mat='pool', segs=48, bev=0)
K.lathe([(VR - 1.1, VH - .95), (VR - 1.1, VH - .65), (VR - 2.2, VH - .65), (VR - 2.2, VH - .95)], 48, (VX, VY, 0), mat='GLOW', close=True, smooth=False)
for i, (a, d, r) in enumerate(((0, 3, 1.6), (1.2, 7, 1.3), (2.4, 5, 1.8), (3.5, 8.5, 1.1), (4.6, 4, 1.4), (5.6, 8, 1.2), (.6, 9.5, .9))):
    octa(VX + math.cos(a) * d, VY + math.sin(a) * d, VH - .6, r)
for i in range(16):
    a = 2 * math.pi * i / 16
    K.box((1.4, 1.2, VH), (VX + (VR + .5) * math.cos(a), VY + (VR + .5) * math.sin(a), VH / 2), (0, 0, a), 'gun', .15)
K.tube(ring_pts(VX, VY, VR + 1.6, VH + 1.6, 48), .12, 'steel', 6)
for i in range(24):
    a = 2 * math.pi * i / 24
    K.box((.18, .18, 1.6), (VX + (VR + 1.6) * math.cos(a), VY + (VR + 1.6) * math.sin(a), VH + .8), mat='steel', bev=0)
# stirring bridge across the vat
K.box((2.0, 2 * VR + 2, .8), (VX, VY, VH + 2.4), (0, 0, R(30)), 'gun', .15)
K.cyl(1.6, 1.6, 3.0, (VX, VY, VH + 1.8), mat='steel', segs=16, bev=.1)
K.cyl(.5, .5, 5.0, (VX, VY, VH - .4), mat='steel', segs=10, bev=0)
K.empty('vat', (VX, VY, VH + .9))

# ================= storage silo (back right) =================
SX, SY, SR, SH = 34.0, 18.5, 9.4, 20.0
prof = [(0, 0), (SR, 0), (SR, SH)]
for i in range(1, 9):
    a = math.pi / 2 * i / 8; prof.append((SR * math.cos(a), SH + 4.0 * math.sin(a)))
K.lathe(prof, 48, (SX, SY, 0), mat='TOWER')
for z0, z1, m in ((.0, 1.2, 'gun'), (7.0, 8.4, 'TEAM'), (14.0, 15.4, 'TEAM')):
    K.lathe([(SR + .1, z0), (SR + .1, z1)], 48, (SX, SY, 0), mat=m)
for i in range(12):
    a = 2 * math.pi * i / 12 + .2
    K.box((.8, .8, SH), (SX + (SR + .25) * math.cos(a), SY + (SR + .25) * math.sin(a), SH / 2), (0, 0, a), 'WALL', .1)
K.lathe([(SR + .9, SH + .3), (SR + .9, SH + .7)], 48, (SX, SY, 0), mat='steel')
K.cyl(1.4, 1.6, 1.6, (SX, SY, SH + 4.6), mat='steel', segs=16, bev=.1)
K.sphere(.8, (SX, SY, SH + 5.6), 'GLOW', 12)
K.empty('silo', (SX, SY, SH + 4.0))
# ladder + feed pipe from hall to silo
K.tube([(HX1 + .3, 22.0, 12.0), (SX - SR - .2, 22.0, 12.0)], .9, 'steel', 12)
K.tube([(HX1 + .3, 15.0, 6.0), (SX - SR + .4, 15.0, 6.0)], .7, 'steel', 12)
for z in range(1, 20, 1):
    K.box((1.6, .2, .2), (SX - 2.0, SY - SR - .7, z), mat='steel', bev=0)
for s in (-1, 1):
    K.box((.2, .2, SH), (SX - 2.0 + s * .8, SY - SR - .7, SH / 2), mat='steel', bev=0)
# lamp posts at the vat side
for x, y in ((45.5, -30.5), (20.5, -30.5)):
    K.cyl(.28, .35, 9, (x, y, 4.5), mat='steel', segs=8, bev=0)
    K.box((2.4, .35, .35), (x + (-1 if x > 30 else 1), y, 9), mat='steel', bev=0)
    K.box((1.3, .9, .5), (x + (-2 if x > 30 else 2), y, 8.75), mat='gun', bev=.08)
    K.box((1.0, .6, .1), (x + (-2 if x > 30 else 2), y, 8.45), mat='lamp', bev=0)

objs = K.build()
for o in objs.values(): box_uv(o, 24)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
print('TRIS', tris)
for o in objs.values(): ao_uv(o, .002)
g = ground(400)
bake_ao(objs, 2048, 9.0, 64, 'refinery')
if '--preview' in sys.argv:
    # a parked harvester (not exported) to check the bay fits it
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, 'harv_v.glb'))
    for o in set(bpy.data.objects) - before:
        if o.parent is None: o.location = (-28.0, -12.0, 0); o.rotation_mode = 'XYZ'; o.rotation_euler = (0, 0, R(90))
    preview(os.path.join(OUT, 'refinery_preview.png'), (60, -110, 80), (-4, -4, 8), lens=40)
    preview(os.path.join(OUT, 'refinery_preview2.png'), (-95, -75, 55), (-20, -4, 8), lens=40)
    for o in set(bpy.data.objects) - before: bpy.data.objects.remove(o, do_unlink=True)
bpy.data.objects.remove(g)
export(objs, 'refinery')
print('done')
