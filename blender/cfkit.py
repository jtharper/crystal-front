"""Crystal Front Blender kit: fast bmesh part builder, bevel/normals, UVs, AO bake, glTF export.
Units: 1 Blender unit = 1 game unit. Blender +X = game forward (+x), Blender -Y = game +z (front of buildings), Z up."""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix, Euler

R = math.radians
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')

# preview colours for each game material name (the game swaps in its own textured materials by name)
PAL = {
    'gun': ((.10, .115, .12), .55, .45, 0), 'steel': ((.36, .40, .38), .65, .38, 0), 'dark': ((.035, .04, .042), .3, .7, 0),
    'plate2': ((.17, .2, .19), .4, .55, 0), 'concrete': ((.42, .42, .39), 0, .92, 0), 'haz': ((.85, .62, .08), .2, .55, 0),
    'win': ((.12, .25, .38), .1, .2, .6), 'lamp': ((1, .93, .75), 0, .5, 4), 'door': ((.02, .022, .025), .3, .6, 0),
    'orange': ((1, .45, .12), 0, .5, 2), 'yellow': ((.6, .42, .08), .2, .5, 0), 'crane': ((.88, .62, .05), .3, .42, 0),
    'rust': ((.32, .17, .1), .3, .9, 0), 'ceram': ((.42, .48, .46), .2, .38, 0), 'pad': ((.47, .47, .44), .05, .85, 0),
    'rubber': ((.025, .025, .025), 0, .85, 0), 'brass': ((.6, .45, .15), .8, .35, 0),
    'TEAM': ((.08, .22, .6), .45, .5, 0), 'TEAMLT': ((.2, .5, 1), .3, .45, 0), 'GLOW': ((.55, .8, 1), 0, .4, 5),
    'WALL': ((.2, .23, .22), .4, .55, 0), 'TOWER': ((.5, .5, .47), 0, .92, 0), 'EMBLEM': ((.9, .9, .9), 0, .5, 0),
}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'NONE'


def material(name):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    col, met, rough, em = PAL.get(name, ((.5, .5, .5), 0, .6, 0))
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Metallic'].default_value = met
    b.inputs['Roughness'].default_value = rough
    if em:
        b.inputs['Emission Color'].default_value = (*col, 1)
        b.inputs['Emission Strength'].default_value = em
    return m


def M(loc=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1)):
    return Matrix.LocRotScale(Vector(loc), Euler(rot, 'XYZ'), Vector(scl))


class Kit:
    """Accumulates geometry per (group, material, bevel) in bmeshes; build() turns them into bevelled objects."""

    def __init__(self):
        self.bms = {}
        self.empties = []

    def bm(self, grp, mat, bev, smooth):
        k = (grp, mat, round(bev, 3), smooth)
        if k not in self.bms: self.bms[k] = bmesh.new()
        return self.bms[k]

    # --- primitives (all take an optional parent matrix P for building sub-assemblies) ---
    def box(self, size, loc, rot=(0, 0, 0), mat='gun', bev=.25, grp='body', P=None):
        b = self.bm(grp, mat, bev, False)
        m = (P or Matrix()) @ M(loc, rot, size)
        bmesh.ops.create_cube(b, size=1.0, matrix=m)

    def cyl(self, r1, r2, h, loc, rot=(0, 0, 0), mat='gun', segs=24, bev=.12, grp='body', P=None, cap=True, smooth=True):
        b = self.bm(grp, mat, bev, smooth)
        m = (P or Matrix()) @ M(loc, rot)
        bmesh.ops.create_cone(b, cap_ends=cap, cap_tris=False, segments=segs, radius1=r1, radius2=r2, depth=h, matrix=m)

    def cylx(self, r, h, loc, mat='gun', segs=20, bev=.1, grp='body', P=None, r2=None):
        self.cyl(r, r if r2 is None else r2, h, loc, (0, R(90), 0), mat, segs, bev, grp, P)

    def cyly(self, r, h, loc, mat='gun', segs=20, bev=.1, grp='body', P=None, r2=None):
        self.cyl(r, r if r2 is None else r2, h, loc, (R(90), 0, 0), mat, segs, bev, grp, P)

    def sphere(self, r, loc, mat='steel', segs=16, grp='body', P=None, scl=(1, 1, 1)):
        b = self.bm(grp, mat, 0, True)
        m = (P or Matrix()) @ M(loc, (0, 0, 0), scl)
        bmesh.ops.create_uvsphere(b, u_segments=segs, v_segments=max(6, segs // 2), radius=r, matrix=m)

    def prism(self, pts, depth, loc=(0, 0, 0), rot=(0, 0, 0), mat='gun', bev=.25, grp='body', P=None):
        """polygon pts [(x,z)] in the XZ plane, extruded along Y (centred)."""
        b = self.bm(grp, mat, bev, False)
        m = (P or Matrix()) @ M(loc, rot)
        a = [b.verts.new(m @ Vector((x, -depth / 2, z))) for x, z in pts]
        c = [b.verts.new(m @ Vector((x, depth / 2, z))) for x, z in pts]
        n = len(pts)
        fs = [b.faces.new(a[::-1]), b.faces.new(c)]
        for i in range(n):
            j = (i + 1) % n
            fs.append(b.faces.new((a[i], a[j], c[j], c[i])))
        bmesh.ops.recalc_face_normals(b, faces=fs)

    def hull(self, loops, loc=(0, 0, 0), rot=(0, 0, 0), mat='gun', bev=.25, grp='body', P=None):
        """convex hull of point loops [(x,y,z),...] - faceted armour shapes"""
        b = bmesh.new()
        for lp in loops:
            for p in lp: b.verts.new(p)
        r = bmesh.ops.convex_hull(b, input=b.verts[:])
        bmesh.ops.delete(b, geom=[g for g in r['geom_interior']] + [g for g in r['geom_unused']], context='VERTS')
        bmesh.ops.dissolve_limit(b, angle_limit=R(1), verts=b.verts[:], edges=b.edges[:])
        b.transform((P or Matrix()) @ M(loc, rot))
        self._merge(b, grp, mat, bev, False)

    def lathe(self, prof, segs, loc=(0, 0, 0), rot=(0, 0, 0), mat='concrete', bev=0, grp='body', P=None, close=False, smooth=True, phase=0):
        """profile [(r,z)] spun around Z"""
        b = bmesh.new()
        rings = []
        for i in range(segs):
            a = phase + 2 * math.pi * i / segs
            rings.append([b.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in prof])
        n = len(prof)
        for i in range(segs):
            A, B = rings[i], rings[(i + 1) % segs]
            for j in range(n - 1 if not close else n):
                k = (j + 1) % n
                if A[j].co == A[k].co: continue
                b.faces.new((A[j], B[j], B[k], A[k]))
        bmesh.ops.remove_doubles(b, verts=b.verts[:], dist=1e-4)
        bmesh.ops.recalc_face_normals(b, faces=b.faces[:])
        b.transform((P or Matrix()) @ M(loc, rot))
        self._merge(b, grp, mat, bev, smooth)

    def tube(self, pts, r, mat='steel', segs=10, grp='body', P=None):
        """swept circle along a polyline (pipes)"""
        b = bmesh.new()
        pts = [Vector(p) for p in pts]
        rings = []
        for i, p in enumerate(pts):
            t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            up = Vector((0, 0, 1)) if abs(t.z) < .9 else Vector((1, 0, 0))
            u = t.cross(up).normalized(); v = t.cross(u).normalized()
            rings.append([b.verts.new(p + (u * math.cos(2 * math.pi * k / segs) + v * math.sin(2 * math.pi * k / segs)) * r) for k in range(segs)])
        for i in range(len(rings) - 1):
            for k in range(segs):
                q = (k + 1) % segs
                b.faces.new((rings[i][k], rings[i][q], rings[i + 1][q], rings[i + 1][k]))
        b.faces.new(rings[0][::-1]); b.faces.new(rings[-1])
        bmesh.ops.recalc_face_normals(b, faces=b.faces[:])
        b.transform(P or Matrix())
        self._merge(b, grp, mat, 0, True)

    def _merge(self, src, grp, mat, bev, smooth):
        me = bpy.data.meshes.new('_tmp'); src.to_mesh(me); src.free()
        dst = self.bm(grp, mat, bev, smooth); dst.from_mesh(me); bpy.data.meshes.remove(me)

    def empty(self, name, loc, grp='body'):
        self.empties.append((name, Vector(loc), grp))

    # --- turn accumulated geometry into finished, joined objects ---
    def build(self, pivots=None):
        pivots = pivots or {}
        objs = {}
        for (grp, mat, bev, smooth), b in self.bms.items():
            me = bpy.data.meshes.new(f'{grp}_{mat}')
            b.to_mesh(me); b.free()
            o = bpy.data.objects.new(me.name, me)
            bpy.context.scene.collection.objects.link(o)
            me.materials.append(material(mat))
            for p in me.polygons: p.use_smooth = smooth or bev > 0
            if bev > 0:
                md = o.modifiers.new('Bevel', 'BEVEL'); md.width = bev; md.segments = 1 if bev < .16 else 2
                md.limit_method = 'ANGLE'; md.angle_limit = R(32); md.harden_normals = True; md.use_clamp_overlap = True
            elif smooth:
                md = o.modifiers.new('Smooth', 'WEIGHTED_NORMAL'); md.keep_sharp = True
            objs.setdefault(grp, []).append(o)
        out = {}
        dg = bpy.context.evaluated_depsgraph_get()
        for grp, lst in objs.items():
            # apply modifiers then join
            for o in lst:
                ev = o.evaluated_get(dg)
                me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
                o.modifiers.clear(); old = o.data; o.data = me; bpy.data.meshes.remove(old)
            bpy.ops.object.select_all(action='DESELECT')
            for o in lst: o.select_set(True)
            bpy.context.view_layer.objects.active = lst[0]
            if len(lst) > 1: bpy.ops.object.join()
            o = bpy.context.view_layer.objects.active
            o.name = grp; o.data.name = grp
            pv = Vector(pivots.get(grp, (0, 0, 0)))
            o.data.transform(Matrix.Translation(-pv)); o.location = pv
            out[grp] = o
        for name, loc, grp in self.empties:
            e = bpy.data.objects.new(name, None); e.empty_display_size = 1.5
            bpy.context.scene.collection.objects.link(e)
            par = out.get(grp)
            if par: e.parent = par; e.location = loc - par.location
            else: e.location = loc
        return out


def box_uv(o, scale=22.0):
    """tiling UVs for the game's repeating panel/concrete textures (1 uv unit = scale units)"""
    me = o.data
    uv = me.uv_layers.get('UVMap') or me.uv_layers.new(name='UVMap')
    b = bmesh.new(); b.from_mesh(me)
    lay = b.loops.layers.uv.get('UVMap')
    for f in b.faces:
        n = f.normal; ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            c = l.vert.co + o.location
            u, v = (c.y, c.z) if ax == 0 else (c.x, c.z) if ax == 1 else (c.x, c.y)
            l[lay].uv = (u / scale, v / scale)
    b.to_mesh(me); b.free()


def ao_uv(o, margin=.004):
    me = o.data
    if 'AO' not in me.uv_layers: me.uv_layers.new(name='AO')
    me.uv_layers.active = me.uv_layers['AO']
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=R(60), island_margin=margin, area_weight=0, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=margin, rotate=True)
    bpy.ops.object.mode_set(mode='OBJECT')


def ground(size=400):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    g = bpy.context.active_object; g.name = '_ground'; g.data.materials.append(material('concrete'))
    return g


def bake_ao(objs, res, dist, samples=96, name='m'):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
    if not sc.world: sc.world = bpy.data.worlds.new('W')
    sc.world.light_settings.distance = dist
    paths = {}
    for gname, o in objs.items():
        img = bpy.data.images.new(f'{name}_{gname}_ao', res, res)
        img.generated_color = (1, 1, 1, 1)
        nodes = []
        for slot in o.material_slots:
            nt = slot.material.node_tree
            n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; nt.nodes.active = n; nodes.append((nt, n))
        o.data.uv_layers.active = o.data.uv_layers['AO']
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        sc.render.bake.margin = 6
        bpy.ops.object.bake(type='AO', use_clear=True)
        for nt, n in nodes: nt.nodes.remove(n)
        os.makedirs(OUT, exist_ok=True)
        p = os.path.join(OUT, f'{name}_{gname}_ao.png')
        img.filepath_raw = p; img.file_format = 'PNG'; img.save()
        paths[gname] = p
        o.data.uv_layers.active = o.data.uv_layers['UVMap']
    return paths


def export(objs, name):
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if not o.name.startswith('_'): o.select_set(True)
    for o in objs.values(): o.data.uv_layers['UVMap'].active_render = True
    p = os.path.join(OUT, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=p, export_format='GLB', use_selection=True, export_apply=True,
                              export_texcoords=True, export_normals=True, export_materials='EXPORT',
                              export_yup=True, export_extras=False)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, name + '.blend'))
    import subprocess, sys as _s
    subprocess.run([_s.executable, os.path.join(os.path.dirname(OUT), 'tools', 'glb2json.py'), p])
    return p


def preview(path, cam_loc, target, res=(900, 640), samples=48, sun_rot=(R(50), R(10), R(-35)), lens=50, team=None):
    """quick Cycles studio render for checking the model"""
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'AgX'
    w = sc.world or bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (.55, .62, .72, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .7
    if 'Sun' not in bpy.data.objects:
        l = bpy.data.lights.new('Sun', 'SUN'); l.energy = 4.2; l.angle = R(4)
        so = bpy.data.objects.new('Sun', l); sc.collection.objects.link(so); so.rotation_euler = sun_rot
    if 'Cam' not in bpy.data.objects:
        c = bpy.data.cameras.new('Cam'); co = bpy.data.objects.new('Cam', c); sc.collection.objects.link(co); sc.camera = co
    co = bpy.data.objects['Cam']; co.data.lens = lens; co.location = cam_loc
    d = Vector(target) - Vector(cam_loc); co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)


# ---------------- running gear shared by all vehicles ----------------
def belt_path(circles, step):
    """convex belt (closed, CCW in XZ) around circles [(x,z,r)], resampled every `step` units -> [((x,z),t,n)]"""
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


def tracks(K, yc, WX, WZ, WR, SPR, IDL, TW, link=1.08, grp='body'):
    """one side of a tracked running gear: link belt, double road wheels, toothed sprocket (rear), idler (front)"""
    circ = [(x, WZ, WR + .32) for x in WX] + [(SPR[0], SPR[1], SPR[2] + .32), (IDL[0], IDL[1], IDL[2] + .32)]
    for (px, pz), t, n in belt_path(circ, link):
        th = math.atan2(-t[1], t[0])
        K.box((link * .89, TW, .42), (px, yc, pz), (0, th, 0), 'dark', 0, grp=grp)
        K.box((link * .31, TW - .8, .26), (px + n[0] * .3, yc, pz + n[1] * .3), (0, th, 0), 'gun', 0, grp=grp)
    off = TW / 2 - 1.95
    for x in WX:
        for dy in (-off, off):
            K.cyly(WR, TW * .31, (x, yc + dy, WZ), 'rubber', 20, .15, grp=grp)
            K.cyly(WR * .74, TW * .34, (x, yc + dy, WZ), 'gun', 16, 0, grp=grp)
        K.cyly(WR * .36, TW + .6, (x, yc, WZ), 'steel', 10, 0, grp=grp)
    for (cx, cz, r), teeth in ((SPR, True), (IDL, False)):
        for dy in (-off * .92, off * .92):
            K.cyly(r, 1.4, (cx, yc + dy, cz), 'gun', 18, .12, grp=grp)
            if teeth:
                for k in range(11):
                    a = 2 * math.pi * k / 11
                    K.box((.75, 1.3, .7), (cx + math.cos(a) * (r + .2), yc + dy, cz + math.sin(a) * (r + .2)), (0, -a, 0), 'gun', 0, grp=grp)
        K.cyly(r * .45, TW + .4, (cx, yc, cz), 'steel', 14, .1, grp=grp)
        K.cyly(r * .25, TW + .9, (cx, yc, cz), 'dark', 10, .05, grp=grp)


def tyre(K, x, y, z, r, w, hub='steel', grp='body', lugs=14):
    """off-road tyre: rubber carcass with tread lugs, dished wheel, hub cap and bolts (axis along Y)"""
    K.cyly(r, w, (x, y, z), 'rubber', 22, min(.6, r * .16), grp=grp)
    for k in range(lugs):
        a = 2 * math.pi * k / lugs
        for side in (-1, 1):
            K.box((r * .3, w * .42, .4), (x + math.cos(a) * (r + .05), y + side * w * .24, z + math.sin(a) * (r + .05)),
                  (0, -a + side * .25, 0), 'rubber', 0, grp=grp)
    s = 1 if y >= 0 else -1
    K.cyly(r * .62, w + .2, (x, y, z), hub, 18, .12, grp=grp)
    K.cyly(r * .28, w + .7, (x, y, z), 'gun', 12, .08, grp=grp)
    for k in range(6):
        a = k * math.pi / 3
        K.cyly(.18, w + .5, (x + math.cos(a) * r * .42, y, z + math.sin(a) * r * .42), 'dark', 6, 0, grp=grp)


def ring_pts(cx, cy, r, z, n=32):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n), z) for i in range(n + 1)]


def finish(K, name, pivots, res=(1024, 512), cam=(62, -48, 46), tgt=(2, 0, 9), lens=55, preview_on=True):
    """build, UV, bake AO per part, preview render, export"""
    objs = K.build(pivots)
    for o in objs.values(): box_uv(o, 22)
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
    print('TRIS', name, tris, {k: len(o.data.polygons) for k, o in objs.items()})
    for o in objs.values(): ao_uv(o)
    g = ground(300)
    for k, o in objs.items():
        bake_ao({k: o}, res[0] if k == 'body' else res[1], 6.0, 64, name)
    if preview_on:
        preview(os.path.join(OUT, name + '_preview.png'), cam, tgt, lens=lens)
    bpy.data.objects.remove(g)
    export(objs, name)
