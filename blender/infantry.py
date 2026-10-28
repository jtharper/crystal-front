"""Infantry for all three factions (original designs).
Run: python3 infantry.py <faction> <role> [--nopreview]   faction: v s h   role: rifle rocket gren sniper eng (+ rift for h)
       python3 infantry.py all
Rig (matches the game's animation): 'legL' / 'legR' pivot at the hips and swing; 'gun' sits at the origin and recoils
along -X. The soldier faces +X, weapon on the right side (-Y), about 17 units tall."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cfkit import *

PAL.update({'olive': ((.25, .28, .16), 0, .85, 0), 'skin': ((.62, .45, .34), 0, .7, 0), 'visor': ((.1, .25, .3), .6, .15, .3),
            'canopy': ((.2, .3, .35), .3, .2, 0), 'gold': ((.7, .55, .2), .9, .3, 0), 'sand': ((.55, .47, .32), 0, .95, 0),
            'spike': ((.55, .58, .56), .85, .25, 0), 'crys': ((.7, .36, .95), 0, .25, 1.6)})
TEAMC = {'v': ((.08, .22, .6), .45, .5, 0), 's': ((.55, .07, .05), .45, .5, 0), 'h': ((.05, .42, .38), .45, .45, 0)}
GLOWC = {'v': ((.55, .8, 1), 0, .4, 5), 's': ((1, .4, .3), 0, .4, 5), 'h': ((.4, 1, .9), 0, .4, 5)}

HIP = 6.2


def palette(f, role):
    """armour plate, under-suit, accent, boots, helmet"""
    P = {'v': dict(plate='TEAM', suit='olive', acc='steel', boot='dark', helm='olive', pad='steel'),
         's': dict(plate='gun', suit='dark', acc='TEAM', boot='gun', helm='dark', pad='TEAM'),
         'h': dict(plate='ceram', suit='gun', acc='TEAM', boot='gun', helm='ceram', pad='gold')}[f].copy()
    if f == 'v' and role == 'eng': P.update(plate='ceram', suit='ceram', acc='TEAM', helm='ceram', pad='TEAM')
    if f == 'v' and role == 'rocket': P.update(plate='ceram', suit='TEAM', helm='TEAM', pad='TEAM')
    if f == 'v' and role == 'sniper': P.update(plate='olive', suit='sand', helm='sand', pad='sand')
    if f == 's' and role == 'eng': P.update(plate='ceram', suit='TEAM', helm='gun', pad='TEAM')
    if f == 's' and role == 'gren': P.update(plate='TEAM', suit='dark', pad='gun')
    if f == 'h' and role == 'eng': P.update(plate='TEAM', suit='ceram', pad='ceram')
    if f == 'h' and role == 'rocket': P.update(plate='gold', suit='gun', pad='TEAM')
    if f == 'h' and role == 'sniper': P.update(plate='dark', suit='dark', pad='ceram', helm='dark')
    return P


def legs(K, f, P):
    for side, name in ((1, 'legL'), (-1, 'legR')):
        y = side * 1.5
        K.cyl(1.15, 1.0, 3.2, (0, y, HIP - 1.5), mat=P['suit'], segs=10, bev=.08, grp=name)          # thigh
        K.box((1.4, 2.2, 2.4), (.35, y, HIP - 1.3), mat=P['plate'], bev=.25, grp=name)               # thigh plate
        K.cyl(.95, .85, 2.6, (.1, y, HIP - 4.1), mat=P['suit'], segs=10, bev=.06, grp=name)          # shin
        K.box((1.0, 1.9, 1.7), (.85, y, HIP - 3.1), mat=P['pad'], bev=.3, grp=name)                  # knee pad
        K.box((1.2, 1.7, 2.2), (.55, y, HIP - 4.5), mat=P['plate'] if f != 'v' else P['suit'], bev=.2, grp=name)
        K.box((3.2, 2.0, 1.3), (.55, y, .65), mat=P['boot'], bev=.35, grp=name)                       # boot
        K.box((1.0, 2.1, .4), (1.9, y, .25), mat='dark', bev=.1, grp=name)
        if f == 's':
            K.cyl(.35, .05, 1.2, (1.4, y, HIP - 3.1), (0, R(90), 0), 'spike', 6, 0, grp=name)


def torso(K, f, role, P):
    K.box((2.6, 4.2, 1.6), (0, 0, 6.9), mat=P['suit'], bev=.3)                     # hips
    K.box((2.9, 4.4, .6), (0, 0, 7.8), mat='dark', bev=.1)                          # belt
    for y in (-1.6, -.5, .6):
        K.box((.8, .9, 1.0), (1.4, y, 7.5), mat=P['acc'] if f == 's' else 'gun', bev=.15)   # pouches
    K.box((2.8, 3.9, 2.0), (0, 0, 8.9), mat=P['suit'], bev=.4)                      # abdomen
    ch = []
    for sy in (-1, 1):
        ch += [(2.1, sy * 2.2, 9.6), (1.9, sy * 2.6, 12.4), (-1.9, sy * 2.6, 12.4), (-2.0, sy * 2.2, 9.6), (1.0, sy * 1.6, 13.0), (-1.4, sy * 1.6, 13.0)]
    K.hull([ch], mat=P['plate'], bev=.35)                                           # chest plate
    if f == 'v':
        K.box((.3, 3.0, 1.6), (2.15, 0, 11.0), mat='dark', bev=.05)                  # webbing
        for y in (-1.2, 0, 1.2): K.box((.6, .9, 1.1), (2.3, y, 10.0), mat='olive', bev=.12)
    if f == 's':
        for sy in (-1, 1):                                                          # greatcoat skirt flaps
            K.box((3.6, .5, 3.6), (-.2, sy * 2.2, 6.2), (sy * R(-10), 0, 0), P['suit'], .15)
        K.box((.4, 3.4, 3.6), (-1.7, 0, 6.2), (0, R(10), 0), P['suit'], .15)
        K.box((.25, 2.2, .9), (2.25, 0, 12.1), mat='TEAM', bev=.05)
    if f == 'h':
        K.box((.25, 2.6, .4), (2.2, 0, 11.6), mat='GLOW', bev=0)
        for y in (-1.5, 1.5): K.box((.3, .6, 2.2), (2.15, y, 10.4), mat='gold', bev=.05)
    # shoulder pads
    for sy in (-1, 1):
        if f == 'h':
            K.sphere(1.7, (0, sy * 3.2, 12.0), P['pad'], 12, scl=(1.15, .95, .8))
        else:
            K.hull([[(x, sy * w, z) for (x, w, z) in ((1.4, 2.4, 12.8), (-1.4, 2.4, 12.8), (1.6, 4.3, 11.6), (-1.6, 4.3, 11.6), (1.2, 4.2, 10.6), (-1.2, 4.2, 10.6))]],
                   mat=P['pad'], bev=.3)
        if f == 's':
            for dx in (-.6, .6):
                K.cyl(.38, .04, 1.6, (dx, sy * 3.6, 13.1), (sy * R(-25), 0, 0), 'spike', 6, 0)
    K.cyl(.75, .85, 1.0, (0, 0, 13.3), mat='skin' if f == 'v' else P['suit'], segs=10, bev=.05)   # neck


def arm(K, sh, el, hd, mat, glove='dark'):
    K.tube([sh, el], .62, mat, 8); K.tube([el, hd], .55, mat, 8)
    K.sphere(.68, el, mat, 8)
    K.sphere(.62, hd, glove, 8)


def arms(K, role, P):
    m = P['suit']
    if role == 'rocket':
        arm(K, (0, -3.2, 11.8), (1.4, -3.6, 10.5), (2.8, -3.3, 12.6), m)
        arm(K, (0, 3.2, 11.8), (1.6, 2.7, 10.3), (3.9, -1.5, 12.9), m)
    elif role == 'eng':
        arm(K, (0, -3.2, 11.8), (.9, -3.4, 9.5), (2.8, -1.9, 9.6), m)
        arm(K, (0, 3.2, 11.8), (.3, 3.5, 9.3), (.4, 3.6, 7.2), m)
    else:
        arm(K, (0, -3.2, 11.8), (.8, -3.3, 9.4), (2.7, -1.7, 9.7), m)
        arm(K, (0, 3.2, 11.8), (1.8, 2.5, 10.5), (4.8, -.9, 10.3), m)


def head(K, f, role, P):
    face = lambda: K.sphere(1.55, (.3, 0, 14.6), 'skin', 12)
    if f == 'v':
        if role == 'eng':
            K.sphere(2.15, (0, 0, 14.9), P['helm'], 14)
            K.sphere(1.7, (.95, 0, 14.9), 'visor', 12, scl=(.7, 1.1, .95))
            K.box((1.0, 2.6, .5), (-.4, 0, 16.9), mat='TEAM', bev=.1)
            K.cyl(.12, .06, 4.0, (-1.4, 1.2, 17.6), mat='dark', segs=5, bev=0)
        elif role == 'sniper':
            face()
            K.cyl(3.3, 3.3, .25, (0, 0, 16.0), mat='sand', segs=16, bev=.05)          # boonie hat
            K.cyl(1.7, 1.95, 1.6, (0, 0, 16.8), mat='sand', segs=14, bev=.1)
            K.box((.5, .8, .6), (1.6, .7, 14.9), mat='dark', bev=.1)                     # scope-eye cup
        else:
            face()
            K.sphere(2.05, (-.15, 0, 15.5), P['helm'], 16, scl=(1.1, 1.06, .72))
            K.lathe([(2.3, 15.2), (2.3, 15.5), (2.1, 15.5), (2.1, 15.2)], 20, (-.15, 0, 0), mat=P['helm'], close=True)
            K.box((.4, 3.0, .6), (1.5, 0, 16.0), mat='dark', bev=.1)                      # goggles pushed up on the helmet
            for y in (-.7, .7): K.cylx(.5, .4, (1.8, y, 16.1), 'canopy', 10, .05)
            if role == 'gren': K.box((.6, 3.6, 1.3), (1.55, 0, 14.6), mat='dark', bev=.15)  # face guard
    elif f == 's':
        if role == 'rocket':
            K.cyl(1.75, 1.95, 5.0, (0, 0, 15.6), mat='dark', segs=14, bev=.15)          # sealed tank helmet
            K.sphere(1.75, (0, 0, 18.1), 'dark', 14, scl=(1, 1, .6))
            for z in (15.2, 16.4):
                for y in (-.6, .6): K.sphere(.3, (1.85, y, z), 'GLOW', 8)
        elif role == 'eng':
            face()
            K.sphere(1.8, (0, 0, 15.4), 'gun', 14, scl=(1, 1, .7))
            K.cyl(2.3, 2.3, .25, (.4, 0, 15.4), mat='gun', segs=16, bev=.05)
            K.box((.6, 2.4, .7), (1.5, 0, 14.4), mat='dark', bev=.15)                     # respirator
        else:
            K.sphere(2.05, (0, 0, 14.9), 'dark', 14, scl=(1.05, 1.0, 1.1))               # gas-mask hood
            for y in (-.7, .7): K.cylx(.5, .4, (1.85, y, 15.2), 'GLOW', 10, .05)        # glowing lenses
            K.cylx(.7, 1.6, (2.3, 0, 13.9), 'gun', 10, .1)                                # filter snout
            for y in (-1, 1): K.cyl(.5, .55, 1.4, (2.0, y * 1.25, 13.6), (y * R(-60), 0, 0), 'gun', 8, .05)
            K.sphere(2.2, (-.1, 0, 15.6), P['helm'] if role != 'sniper' else 'gun', 14, scl=(1.05, 1.05, .55))   # steel cap
            if role == 'sniper': K.box((1.2, 4.6, .2), (0, 0, 16.4), mat='TEAM', bev=0)
    else:
        if role == 'eng':
            face()
            K.sphere(1.9, (0, 0, 15.3), P['plate'], 14, scl=(1, 1, .75))
            K.box((.5, 2.2, .6), (0, 0, 17.0), mat='dark', bev=.1)
            K.box((.25, 2.6, .5), (1.6, 0, 15.2), mat='GLOW', bev=0)
        else:
            K.sphere(2.05, (0, 0, 14.9), P['helm'] if role != 'sniper' else 'dark', 16, scl=(1.12, 1.0, 1.05))
            K.box((.3, 2.8, .5), (2.15, 0, 15.0), mat='GLOW', bev=0)                       # visor slit
            K.sphere(1.2, (-.3, 0, 16.4), 'TEAM' if role == 'rocket' else 'gold', 12, scl=(1.3, .9, .5))   # crest
            if role == 'sniper':
                K.sphere(.55, (2.2, .55, 15.2), 'GLOW', 8)
                K.cyl(.08, .1, 4.0, (-1, 1, 17.6), (R(-17), 0, 0), 'steel', 4, 0)


def pack(K, f, role, P):
    if role == 'eng':
        K.box((2.2, 4.0, 5.0), (-3.0, 0, 10.6), mat='TEAM' if f == 'v' else P['plate'], bev=.3)
        K.box((.2, 2.4, 3.2), (-4.15, 0, 10.6), mat='steel', bev=0)
        K.cyl(.12, .06, 6.0, (-3.4, -1.2, 15.6), mat='dark', segs=5, bev=0)
        K.box((1.6, 1.2, 3.0), (-1.4, 3.2, 7.8), mat='gun', bev=.15)                      # tool roll
        K.box((2.4, 2.2, 1.8), (.8, 3.7, 5.6), mat='yellow' if f != 'h' else 'ceram', bev=.2)   # toolbox in hand
        K.box((.3, .6, 1.0), (.8, 3.7, 6.9), mat='dark', bev=0)
    elif role == 'rocket':
        for y in (-2.3, 2.3):
            K.box((2.1, 2.4, 5.6), (-3.3, y, 11.4), mat=P['plate'], bev=.3)
            K.cyl(.8, 1.0, 1.0, (-3.3, y, 8.3), mat='dark', segs=10, bev=.05)
            K.cyl(.75, .1, 1.4, (-3.3, y, 14.9), mat='orange' if f != 'h' else 'crys', segs=8, bev=0)
    elif role == 'sniper':
        cm = {'v': 'sand', 's': 'dark', 'h': 'gun'}[f]
        K.box((.5, 5.8, 8.4), (-2.4, 0, 8.8), (0, R(-6), 0), cm, .1)                      # cloak / ghillie
        if f == 'v':
            for i in range(10):
                K.box((.4, 1.2, 1.6), (-2.6, (i % 5 - 2) * 1.2, 5.6 + (i // 5) * 3 + (i % 2) * .7), (R((i % 3 - 1) * 20), 0, 0), 'olive', .05)
        if f == 'h': K.hull([[(-2.8, 0, 13.0), (-2.8, 0, 10.6), (-2.8 - .8, .8, 11.8), (-2.8 + .8, -.8, 11.8), (-2.8, .8, 11.8), (-2.8, -.8, 11.8)]], mat='crys', bev=0)
    else:
        K.box((1.8, 3.6, 4.2), (-2.8, 0, 10.4), mat='olive' if f == 'v' else 'dark' if f == 's' else 'ceram', bev=.3)
        if f == 'v': K.cyly(.8, 3.4, (-2.9, 0, 12.8), 'olive', 10, .1)                      # bedroll
        if f == 'h': K.hull([[(-3.0, 0, 12.8), (-3.0, 0, 10.0), (-3.8, .9, 11.4), (-2.2, -.9, 11.4), (-3.0, .9, 11.4), (-3.0, -.9, 11.4)]], mat='crys', bev=0)
        if f == 's': K.cyl(.6, .7, 3.6, (-3.4, -1.3, 13.2), mat='rust', segs=8, bev=.05)   # canister
    if role == 'gren':
        for i in range(5):                                                                  # grenade bandolier
            K.sphere(.55, (2.05, -1.6 + i * .8, 12.4 - i * .75), 'olive' if f == 'v' else 'TEAM' if f == 's' else 'GLOW', 8)


def weapon(K, f, role, P):
    G = 'gun'; y = -1.2
    if role == 'rifle' or role == 'rift':
        K.box((4.6, .9, 1.4), (2.6, y, 10.0), mat='gun', bev=.15, grp=G)                  # receiver
        K.box((2.0, .7, 1.6), (.0, y, 9.6), (0, R(8), 0), 'gun' if f != 'v' else 'olive', .1, grp=G)   # stock
        K.box((.7, .6, 1.6), (2.0, y, 8.9), (0, R(-15), 0), 'dark', .05, grp=G)            # magazine
        K.cylx(.32 if f != 'h' else .45, 5.0, (7.4, y, 10.2), 'dark' if f != 'h' else 'ceram', 8, 0, grp=G)
        K.box((2.6, .8, .9), (5.6, y, 10.0), mat='gun' if f != 'v' else 'TEAM', bev=.1, grp=G)   # handguard
        K.box((1.6, .5, .6), (3.0, y, 10.9), mat='dark', bev=.05, grp=G)                  # sight
        if f == 'h':
            for x in (6.4, 8.4): K.cylx(.65, .3, (x, y, 10.2), 'GLOW', 10, 0, grp=G)
        if f == 's': K.cylx(.55, 1.0, (10.2, y, 10.2), 'gun', 6, .05, grp=G)
    elif role == 'sniper':
        L = {'v': 15.0, 's': 22.0, 'h': 14.0}[f]
        K.box((5.2, .8, 1.3), (2.2, y, 10.0), mat='gun' if f != 'v' else 'olive', bev=.15, grp=G)
        K.cylx(.28 if f != 's' else .34, L, (4.4 + L / 2, y, 10.2), 'dark' if f != 'h' else 'ceram', 8, 0, grp=G)
        K.cylx(.45, 4.0, (3.6, y, 11.3), 'dark', 10, .05, grp=G)                          # scope
        K.cylx(.55, .3, (5.5, y, 11.3), 'canopy' if f != 'h' else 'GLOW', 10, 0, grp=G)
        K.cylx(.55, 1.2, (4.4 + L, y, 10.2), 'gun', 8, .05, grp=G)                         # muzzle brake
        for s in (-1, 1): K.box((.15, .15, 2.0), (6.4, y + s * .4, 9.2), (s * R(25), 0, 0), 'steel', 0, grp=G)   # bipod
        if f == 'h':
            for x in (8.0, 11.0, 14.0): K.cylx(.5, .3, (x, y, 10.2), 'GLOW', 10, 0, grp=G)
    elif role == 'gren':
        if f == 'v':
            K.cylx(1.25, 5.5, (6.0, y, 10.0), 'gun', 12, .1, grp=G)
            K.cylx(2.0, 2.6, (2.6, y, 10.0), 'TEAM', 14, .15, grp=G)                      # revolving drum
            for i in range(6):
                a = i * math.pi / 3
                K.cylx(.35, 2.7, (2.6, y + math.cos(a) * 1.6, 10.0 + math.sin(a) * 1.6), 'dark', 6, 0, grp=G)
            K.box((2.6, 1.0, 1.4), (-.2, y, 9.2), mat='olive', bev=.15, grp=G)
        elif f == 's':
            K.cylx(1.5, 8.0, (5.4, y, 10.2), 'dark', 12, .1, grp=G)
            K.cylx(1.8, .8, (9.2, y, 10.2), 'TEAM', 12, .05, grp=G)
            K.box((2.4, 1.4, 2.6), (2.2, y, 8.6), mat='gun', bev=.2, grp=G)
            K.box((2.4, 1.0, 1.2), (-.4, y, 9.6), mat='gun', bev=.15, grp=G)
        else:
            K.box((6.0, 2.0, 2.4), (3.6, y, 9.9), mat='ceram', bev=.6, grp=G)
            K.lathe([(1.3, -.18), (1.3, .18), (1.0, .18), (1.0, -.18)], 16, (7.4, y, 9.9), (0, R(90), 0), 'GLOW', grp=G, close=True)
            K.sphere(1.0, (7.2, y, 9.9), 'GLOW', 10, grp=G)
            K.box((3.4, .8, .4), (3.0, y, 11.3), mat='TEAM', bev=.05, grp=G)
    elif role == 'rocket':
        ys, zs = -3.6, 14.0 if f != 'h' else 12.6
        if f == 'h':
            K.cylx(1.35, 9.0, (1.0, ys, zs), 'TEAM', 16, .2, grp=G)
            K.cyl(1.35, .1, 3.0, (7.0, ys, zs), (0, R(90), 0), 'crys', 6, 0, grp=G)
            for x in (-2, 1, 4): K.cylx(1.45, .4, (x, ys, zs), 'GLOW', 16, 0, grp=G)
        else:
            K.cylx(1.05 if f == 'v' else 1.2, 12.0, (1.5, ys, zs), 'gun' if f == 'v' else 'dark', 14, .1, grp=G)
            K.cylx(1.3 if f == 'v' else 1.45, 1.8, (7.2, ys, zs), 'TEAM' if f == 'v' else 'gun', 14, .1, grp=G)
            K.cyl(1.05, .15, 2.6, (8.9, ys, zs), (0, R(90), 0), 'orange', 8, 0, grp=G)
            K.box((2.0, 1.0, 1.8), (3.0, ys, zs - 1.6), mat='gun', bev=.15, grp=G)          # grip + sight box
            K.box((1.4, .5, .9), (1.0, ys - 1.3, zs + .4), mat='dark', bev=.1, grp=G)
            if f == 's':
                K.box((12.0, .3, .5), (1.5, ys + 1.25, zs), mat='TEAM', bev=0, grp=G)
    elif role == 'eng':
        K.box((4.6, .5, .7), (4.0, -1.9, 9.6), (0, R(-20), 0), 'steel', .05, grp=G)          # wrench in the right hand
        K.box((1.0, .6, 1.6), (6.2, -1.9, 10.4), (0, R(-20), 0), 'steel', .1, grp=G)


def build(f, role):
    PAL['TEAM'] = TEAMC[f]; PAL['GLOW'] = GLOWC[f]
    K = Kit(); P = palette(f, 'rifle' if role == 'rift' else role)
    legs(K, f, P); torso(K, f, role, P); arms(K, role, P); head(K, f, role, P); pack(K, f, role, P); weapon(K, f, role, P)
    if role == 'rift':                                                                 # rift walker: crystal halo and a crystal staff on the back
        K.lathe([(4.0, -.22), (4.0, .22), (3.6, .22), (3.6, -.22)], 32, (-3.6, 0, 13.0), (0, R(90), 0), 'GLOW', close=True)
        K.hull([[(-3.6, 0, 14.6), (-3.6, 0, 11.4), (-3.6 - 1.2, 1.2, 13), (-3.6 + 1.2, -1.2, 13), (-3.6, 1.2, 13), (-3.6, -1.2, 13)]], mat='crys', bev=0)
        K.cyl(.25, .25, 16.0, (1.2, 3.8, 8.0), mat='steel', segs=6, bev=0)
        K.hull([[(1.2, 3.8, 18.4), (1.2, 3.8, 15.0), (2.1, 3.8, 16.6), (.3, 3.8, 16.6), (1.2, 4.7, 16.6), (1.2, 2.9, 16.6)]], mat='crys', bev=0)
    return K


def export_inf(K, name, preview_on):
    objs = K.build({'body': (0, 0, 0), 'legL': (0, 1.5, HIP), 'legR': (0, -1.5, HIP), 'gun': (0, 0, 0)})
    for o in objs.values(): box_uv(o, 22)
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values())
    print('TRIS', name, tris)
    if preview_on:
        g = ground(120)
        preview(os.path.join(OUT, name + '_preview.png'), (22, -24, 16), (1.5, 0, 9), res=(420, 520), lens=55)
        bpy.data.objects.remove(g)
    export(objs, name)


ROLES = ['rifle', 'rocket', 'gren', 'sniper', 'eng']
if __name__ == '__main__':
    jobs = [(f, r) for f in 'vsh' for r in ROLES] + [('h', 'rift')] if sys.argv[1] == 'all' else [(sys.argv[1], sys.argv[2])]
    for f, r in jobs:
        reset()
        export_inf(build(f, r), f'inf_{r}_{f}', '--nopreview' not in sys.argv)
    print('done')
