"""Airfield - original design (footprint 96 x 96: x +-48, y +-48, front = -y).
Back left: an arched (barrel-roof) hangar with ribbed shell and a lit door. Back right: a slim control tower with a glazed
cab and a turning radar (group 'dish'). Front: two marked landing pads (left pad centre (-24,-24), right pad (24,-24))
where aircraft land and re-arm, with edge lights, a fuel bowser stand and a windsock.
Faction finishes are swapped in-game by material name: WALL, TOWER, TEAM, GLOW.  Run: python3 airfield.py [--preview]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

PAL['pad'] = ((.27, .28, .27), 0, .9, 0)
PAL['yellow'] = ((.85, .7, .15), 0, .6, 0)
PAL['white'] = ((.82, .82, .78), 0, .7, 0)
reset()
K = Kit()

# ================= apron =================
K.box((95, 95, .6), (0, 0, .3), mat='concrete', bev=.3)
K.box((93, 44, .1), (0, -24.5, .65), mat='pad', bev=0)
for i in range(15):                                      # front hazard sill
    K.box((3.6, 1.3, .1), (-44 + i * 6.3, -46.4, .72), (0, 0, R(30)), 'haz' if i % 2 else 'dark', 0)
# taxi line from the hangar to the pads
K.box((.8, 22, .06), (-24, 2, .72), mat='yellow', bev=0)
K.box((44, .8, .06), (0, -4, .72), mat='yellow', bev=0)

# ================= landing pads =================
for px in (-24, 24):
    py = -24
    K.cyl(17, 17, .25, (px, py, .78), mat='TOWER', segs=48, bev=0)
    K.lathe([(15.4, .92), (16.4, .92)], 48, (px, py, 0), mat='white', smooth=False)
    K.lathe([(10.0, .92), (11.0, .92)], 48, (px, py, 0), mat='TEAM', smooth=False)
    # pad mark: a team-colour chevron pointing out of the base, plus a bar
    for s in (-1, 1):
        K.box((1.4, 9.0, .1), (px + s * 2.9, py - 1.2, .98), (0, 0, s * R(-32)), 'white', 0)
    K.box((8.0, 1.4, .1), (px, py + 4.6, .98), mat='white', bev=0)
    for i in range(8):                                   # edge lights
        a = 2 * math.pi * i / 8 + math.pi / 8
        K.cyl(.55, .55, .5, (px + 16.9 * math.cos(a), py + 16.9 * math.sin(a), 1.0), mat='GLOW', segs=10, bev=0)
# fuel / re-arm stand between the pads
K.box((5, 9, 3.2), (0, -26, 2.2), mat='WALL', bev=.3)
K.box((5.4, 1.2, 1.0), (0, -26, 3.6), mat='TEAM', bev=.1)
K.cylx(1.5, 5, (0, -32.5, 2.4), mat='orange', segs=16)
for s in (-1, 1):
    K.tube([(s * 2.5, -24, 1.8), (s * 4.5, -24, 1.0), (s * 5.5, -21, .9)], .3, 'rubber', 8)
    K.box((2.4, 3, 2.2), (0, -26 + s * 7.5, 1.9), mat='gun', bev=.15)   # ammo crates
    K.box((2.7, .3, .5), (0, -26 + s * 7.5 - 1.45, 2.4), mat='haz', bev=0)

# ================= arched hangar (back left) =================
HX0, HX1, HY0, HY1, HR = -46, -6, 4, 46, 13.5            # span along x, depth along y, radius
HCX = (HX0 + HX1) / 2
K.box((HX1 - HX0 + 1, HY1 - HY0, 2.0), (HCX, (HY0 + HY1) / 2, 1.5), mat='WALL', bev=.2)        # plinth
arch = [(math.cos(math.pi * i / 20) * (HX1 - HX0) / 2, math.sin(math.pi * i / 20) * HR) for i in range(21)]
def shell(r_off, y0, y1, mat, bev=.15):
    pts = [(HCX + x * (1 + r_off / 20), z * (1 + r_off / HR) + 2.0) for x, z in arch]
    loops = []
    b = K.bm('body', mat, bev, True)
    lo = [b.verts.new((x, y0, z)) for x, z in pts]; hi = [b.verts.new((x, y1, z)) for x, z in pts]
    for i in range(len(pts) - 1):
        b.faces.new((lo[i], lo[i + 1], hi[i + 1], hi[i]))
    # back cap
    b.faces.new(hi[::-1] if True else hi)
    bmesh.ops.solidify(b, geom=b.faces[:], thickness=.6)
    bmesh.ops.recalc_face_normals(b, faces=b.faces[:])
shell(0, HY0 + 1, HY1, 'TOWER')
for i in range(7):                                       # roof ribs
    y = HY0 + 2 + i * (HY1 - HY0 - 3) / 6
    pts = [(HCX + x * 1.03, y, z * 1.06 + 2.0) for x, z in arch]
    K.tube(pts, .45, 'WALL', 8)
K.tube([(HCX + x * 1.035, HY0 + 1.6, z * 1.07 + 2.0) for x, z in arch], .7, 'TEAM', 10)   # front arch band
# front wall + big door (dark opening, lit sill)
K.box((HX1 - HX0 - 4, .8, 10), (HCX, HY0 + .4, 7), mat='dark', bev=.05)
for i in range(6):
    K.box((.4, .9, 10), (HCX - 15 + i * 6, HY0 + .2, 7), mat='gun', bev=0)
K.box((HX1 - HX0 - 4, 1.0, .5), (HCX, HY0, 2.3), mat='GLOW', bev=0)
K.box((HX1 - HX0 - 2, 1.4, 1.2), (HCX, HY0 + .3, 12.6), mat='gun', bev=.15)
K.box((10, .6, 3), (HCX, HY0 - .1, 14.6), mat='TEAM', bev=.1)                               # number board
for s in (-1, 1):
    K.box((1.2, .6, 1.8), (HCX + s * 2.4, HY0 - .45, 14.6), mat='white', bev=0)
K.empty('emblem', (HCX, HY0 - .5, 14.6))
# roof vents
for y in (16, 30):
    K.cyl(1.5, 1.5, 2, (HCX, y, HR + 2.6), mat='gun', segs=12)
    K.cyl(2.0, 2.0, .4, (HCX, y, HR + 3.8), mat='steel', segs=12)

# ================= control tower (back right) =================
TX, TY = 30, 28
K.box((26, 30, 2), (TX - 1, TY - 2, 1.5), mat='WALL', bev=.3)          # base building
K.box((18, 16, 9), (TX - 6, TY + 4, 6.5), mat='TOWER', bev=.3)
K.box((18.4, 16.4, 1.2), (TX - 6, TY + 4, 11.3), mat='TEAM', bev=.15)
for x in (-12, -6, 0):
    K.box((3.2, .4, 2.2), (TX + x, TY - 4.2, 7), mat='win', bev=0)
K.cyl(4.2, 3.4, 26, (TX + 6, TY - 4, 14), mat='TOWER', segs=20)       # shaft
K.lathe([(4.25, 10), (4.15, 12)], 20, (TX + 6, TY - 4, 0), mat='TEAM')
# glazed cab (wider at the top)
K.cyl(5.0, 5.0, 1.2, (TX + 6, TY - 4, 27.4), mat='WALL', segs=12)
K.cyl(5.0, 6.2, 5.2, (TX + 6, TY - 4, 30.6), mat='win', segs=12, bev=0)
for i in range(12):
    a = 2 * math.pi * i / 12
    K.box((.4, .4, 5.4), (TX + 6 + 5.6 * math.cos(a), TY - 4 + 5.6 * math.sin(a), 30.6), (0, R(-12) * 0, a), 'gun', 0)
K.cyl(6.8, 6.8, 1.0, (TX + 6, TY - 4, 33.6), mat='WALL', segs=12)
K.cyl(1.0, 1.0, 3.0, (TX + 6, TY - 4, 35.6), mat='steel', segs=10)
# radar (turns in game)
RZ = 37.2
K.box((10, 1.1, 2.4), (TX + 6, TY - 4, RZ + .6), mat='steel', bev=.15, grp='dish')
K.box((10.4, .3, 1.6), (TX + 6, TY - 4.6, RZ + .6), mat='gun', bev=0, grp='dish')
K.cyl(.8, .8, 1.2, (TX + 6, TY - 4, RZ - .4), mat='gun', segs=10, grp='dish')
K.sphere(.7, (TX + 6, TY - 4, 39.8), 'GLOW', 10)
K.cyl(.12, .12, 1.4, (TX + 6, TY - 4, 39), mat='steel', segs=6, bev=0)
# windsock
K.cyl(.25, .3, 14, (44, -8, 7.3), mat='steel', segs=8, bev=0)
K.cyl(1.3, .7, 6, (41, -8, 13.6), rot=(0, R(-80), 0), mat='orange', segs=12, bev=0)
K.lathe([(1.25, 1), (1.12, 2.2)], 12, (41, -8, 13.6), rot=(0, R(-80), 0), mat='white')
# perimeter lamp posts
for x, y in ((-46, -2), (46, -46), (-46, -46)):
    K.cyl(.3, .35, 8, (x + (1 if x < 0 else -1), y + 1, 4.6), mat='steel', segs=8, bev=0)
    K.box((1.2, 1.2, .8), (x + (1 if x < 0 else -1), y + 1, 8.9), mat='lamp', bev=.1)

objs = K.build({'dish': (TX + 6, TY - 4, RZ)})
for o in objs.values(): box_uv(o, 24)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
print('TRIS', tris)
for o in objs.values(): ao_uv(o, .002)
g = ground(400)
bake_ao(objs, 2048, 9.0, 64, 'airfield')
if '--preview' in sys.argv:
    preview(os.path.join(OUT, 'airfield_preview.png'), (95, -130, 95), (0, 0, 6), lens=40)
bpy.data.objects.remove(g)
export(objs, 'airfield')
print('done')
