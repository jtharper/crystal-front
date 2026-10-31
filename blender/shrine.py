"""Secret Shrine - original design (footprint 64 x 64: x +-32, y +-32, front = -y).
An octagonal dark-stone temple with bronze bands; a glowing golden spiral rises from a domed core; two glass tanks of
crystal fluid stand at the back corners, linked by brass pipes; carved steps at the front, braziers at the front corners.
Faction finishes are swapped in-game by material name: WALL, TOWER, TEAM, GLOW.  Run: python3 shrine.py [--preview]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

PAL['stone'] = ((.21, .2, .2), 0, .85, 0)
PAL['stone2'] = ((.32, .3, .28), 0, .9, 0)
PAL['bronze'] = ((.62, .42, .2), .85, .35, 0)
PAL['sgold'] = ((1.0, .78, .3), .6, .25, 1.4)
PAL['crys'] = ((.7, .36, .95), 0, .25, 1.6)
reset()
K = Kit()

# octagonal stepped plinth
K.cyl(30, 30, 2.2, (0, 0, 1.1), mat='stone2', segs=8, bev=.4)
K.cyl(26.5, 27.5, 3, (0, 0, 3.6), mat='stone', segs=8, bev=.4)
K.cyl(27.7, 27.7, .8, (0, 0, 5.2), mat='bronze', segs=8, bev=.15)
# front steps
for i in range(3):
    K.box((14, 3, 1.6), (0, -27.5 - i * 2.4, 4.4 - i * 1.6), mat='stone2', bev=.2)
# temple drum: dark stone with bronze bands and pilasters
K.cyl(20, 21, 10, (0, 0, 10.6), mat='stone', segs=8, bev=.5)
for z in (6.4, 15.2):
    K.cyl(21.3, 21.3, 1.2, (0, 0, z), mat='bronze', segs=8, bev=.15)
for k in range(8):
    a = k * math.pi / 4 + math.pi / 8
    c, s = math.cos(a), math.sin(a)
    K.box((2.4, 3.2, 11), (c * 20.6, s * 20.6, 10.8), rot=(0, 0, a), mat='stone2', bev=.3)
    K.box((.6, 2.2, 6), (c * 21.3, s * 21.3, 10.6), rot=(0, 0, a), mat='GLOW', bev=0)   # glowing runes
# arched front gate
K.box((9, 3, 9), (0, -20, 10), mat='dark', bev=.3)
K.lathe([(4.6, -1.6), (5.6, -1.6), (5.6, 1.6), (4.6, 1.6)], 20, loc=(0, -20.5, 14.2), rot=(R(90), 0, 0), mat='bronze', close=True)
# dome + crown
prof = [(0, 0), (16.5, 0)]
for i in range(1, 9):
    a = math.pi / 2 * i / 8
    prof.append((16.5 * math.cos(a), 9 * math.sin(a)))
K.lathe(prof, 32, loc=(0, 0, 15.6), mat='TOWER')
K.cyl(17, 17, 1.2, (0, 0, 16), mat='TEAM', segs=32, bev=.2)
K.cyl(5.4, 6.2, 3, (0, 0, 25.6), mat='bronze', segs=16, bev=.3)
# the golden spiral: a tapering coil rising from the crown
pts = []
for i in range(120):
    t = i / 119
    a = t * 3.2 * 2 * math.pi
    r = 7.5 * (1 - t) + 1.2
    pts.append((math.cos(a) * r, math.sin(a) * r, 27 + t * 22))
K.tube(pts, 1.25, 'sgold', 10)
K.cyl(.8, .8, 24, (0, 0, 39), mat='bronze', segs=10, bev=0)
K.sphere(2.4, (0, 0, 51), 'GLOW', 16)
K.empty('orb', (0, 0, 51))
# crystal tanks at the back corners, brass pipes to the core
for s in (-1, 1):
    x, y = s * 20, 19
    K.cyl(5, 5.4, 2, (x, y, 6), mat='bronze', segs=16, bev=.3)
    K.cyl(4.2, 4.2, 14, (x, y, 14), mat='win', segs=18, bev=0)
    K.cyl(3.4, 3.4, 11, (x, y, 13.4), mat='crys', segs=14, bev=0)
    K.cyl(5, 4.4, 2.4, (x, y, 22), mat='bronze', segs=16, bev=.3)
    K.sphere(1.3, (x, y, 24.2), 'sgold', 10)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        K.cyl(.35, .35, 15, (x + math.cos(a) * 4.5, y + math.sin(a) * 4.5, 14), mat='bronze', segs=6, bev=0)
    K.tube([(x - s * 3, y - 2, 19), (s * 12, 12, 20), (s * 8, 6, 22)], .8, 'bronze', 10)
# braziers at the front corners
for s in (-1, 1):
    x, y = s * 19, -19
    K.cyl(1.6, 2.4, 6, (x, y, 8), mat='stone2', segs=8)
    K.cyl(3, 2, 2, (x, y, 12), mat='bronze', segs=12, bev=.2)
    K.sphere(1.6, (x, y, 13.2), 'GLOW', 10)

objs = K.build()
for o in objs.values(): box_uv(o, 24)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
print('TRIS', tris)
for o in objs.values(): ao_uv(o, .002)
g = ground(400)
bake_ao(objs, 2048, 9.0, 64, 'shrine')
if '--preview' in sys.argv:
    preview(os.path.join(OUT, 'shrine_preview.png'), (70, -95, 70), (0, 0, 16), lens=42)
bpy.data.objects.remove(g)
export(objs, 'shrine')
print('done')
