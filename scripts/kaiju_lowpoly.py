#!/usr/bin/env python3
"""オリジナル怪獣 v2 のローポリ（Python 版・numpy + PIL のみ）

Remotion/Three.js 版（src/kaiju/ModelV2.tsx）と同じ形をコードだけで描くターンテーブル。
公式キャラクターの模倣ではない、オリジナルの様式化デザイン。
  - 炭色の皮膚、骨白色の背びれ（中央＋左右の3列・互い違い）、白い爪、黄色い目、赤い口内
  - 太もも→足首へ先細りの脚、腰が太く肩へ絞る胴、節ごとに細くなる尾、前に伸びた吻

使い方:
  python3 scripts/kaiju_lowpoly.py            # 10秒のターンテーブル → out/kaiju_py/kaiju_lowpoly.mp4
  STILL=1 python3 scripts/kaiju_lowpoly.py    # 4方向の静止画だけ → out/kaiju_py/still_*.png
  SECONDS=6 python3 scripts/kaiju_lowpoly.py  # 尺を変える
"""
import math
import os
import shutil
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30
OUT = os.path.join("out", "kaiju_py")
os.makedirs(OUT, exist_ok=True)

LIGHT = np.array([-0.55, 0.7, 0.75])
LIGHT = LIGHT / np.linalg.norm(LIGHT)

# ---------------- 色（v2 と同じ） ----------------
SKIN = (82, 84, 86)
SKIN_D = (60, 62, 64)
BELLY = (110, 112, 106)
FIN = (198, 202, 192)
FIN_D = (164, 168, 158)
EYE = (255, 196, 48)
TEETH = (236, 238, 232)
MOUTH = (122, 36, 32)


def find_font():
    for p in [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf",
        "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    ]:
        if os.path.exists(p):
            return p
    return None


FONT = find_font()

# ---------------- 形状の部品 ----------------
FACES = []  # (頂点リスト[np.array], 色, 発光するか)


def rot(v, rx=0.0, ry=0.0, rz=0.0):
    x, y, z = v
    if rz:
        c, s = math.cos(rz), math.sin(rz)
        x, y = x * c - y * s, x * s + y * c
    if rx:
        c, s = math.cos(rx), math.sin(rx)
        y, z = y * c - z * s, y * s + z * c
    if ry:
        c, s = math.cos(ry), math.sin(ry)
        x, z = x * c + z * s, -x * s + z * c
    return np.array([x, y, z], float)


def add_face(verts, col, glow=False):
    FACES.append(([np.array(v, float) for v in verts], np.array(col, float), glow))


def taper(p, s, col, axis="y", neg=(1, 1), pos=(1, 1), shift=0.0, rz=0.0):
    """テーパー付きの箱（Three.js 版の T と同じ）。axis 方向の負側/正側の断面を neg/pos 倍に絞る"""
    pts = []
    for sx in (-0.5, 0.5):
        for sy in (-0.5, 0.5):
            for sz in (-0.5, 0.5):
                x, y, z = sx, sy, sz
                if axis == "y":
                    f = pos if y > 0 else neg
                    x *= f[0]
                    z *= f[1]
                    if y > 0:
                        x += shift
                else:
                    f = pos if x > 0 else neg
                    y *= f[0]
                    z *= f[1]
                    if x > 0:
                        y += shift
                v = rot(np.array([x * s[0], y * s[1], z * s[2]]), rz=rz) + np.array(p, float)
                pts.append(v)
    # 頂点の並び: index = ix*4 + iy*2 + iz
    q = lambda a, b, c, d: [pts[a], pts[b], pts[c], pts[d]]
    for face in (q(4, 6, 7, 5), q(0, 1, 3, 2), q(2, 3, 7, 6), q(0, 4, 5, 1), q(1, 5, 7, 3), q(0, 2, 6, 4)):
        add_face(face, col)


def spike(a, b, r, col, n=6):
    """a から b へ細くなる円錐（爪・角・尾の先）"""
    a = np.array(a, float)
    b = np.array(b, float)
    d = (b - a) / np.linalg.norm(b - a)
    ref = np.array([0.0, 1.0, 0.0]) if abs(d[1]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = np.cross(d, ref)
    u /= np.linalg.norm(u)
    w = np.cross(d, u)
    ring = [a + (u * math.cos(2 * math.pi * i / n) + w * math.sin(2 * math.pi * i / n)) * r for i in range(n)]
    for i in range(n):
        add_face([ring[i], ring[(i + 1) % n], b], col)
    add_face(ring[::-1], col)


# 背びれの形（ギザギザの炎形）。x=幅方向, y=高さ方向（0〜1）
FIN_SHAPE = [(-0.5, 0), (0.5, 0), (0.38, 0.32), (0.46, 0.4), (0.22, 0.58), (0.3, 0.66),
             (0.04, 1.0), (-0.12, 0.72), (-0.26, 0.78), (-0.3, 0.5), (-0.46, 0.42)]


def fin(base, h, w, lean, out=0.0, col=FIN, t=0.2):
    """背びれ1枚：形を押し出した板。lean=後ろへの傾き, out=左右への開き"""
    base = np.array(base, float)
    front, back = [], []
    for (x, y) in FIN_SHAPE:
        for zz, lst in ((t / 2, front), (-t / 2, back)):
            v = rot(np.array([x * w, y * h, zz]), rx=out, rz=lean) + base
            lst.append(v)
    add_face(front, col, glow=True)
    add_face(back[::-1], col, glow=True)
    n = len(FIN_SHAPE)
    for i in range(n):
        j = (i + 1) % n
        add_face([front[i], back[i], back[j], front[j]], col, glow=True)


# ---------------- モデル（ModelV2.tsx と同じ寸法） ----------------
BACK_FINS = [(-0.25, 10.45, 1.5, 0.95, 0.55), (-0.95, 10.15, 2.3, 1.25, 0.8), (-1.4, 9.35, 3.0, 1.5, 1.0),
             (-1.5, 8.35, 3.25, 1.6, 1.12), (-1.42, 7.35, 2.9, 1.5, 1.15), (-1.6, 6.45, 2.3, 1.25, 1.05)]
TAIL = [(-2.75, 5.5, 3.3, 2.4, 3.0, 2.0), (-5.15, 4.95, 2.9, 1.9, 2.3, 1.6), (-7.25, 4.5, 2.5, 1.45, 1.7, 1.25),
        (-9.05, 4.18, 2.1, 1.08, 1.2, 0.9), (-10.55, 3.98, 1.7, 0.78, 0.8, 0.6)]


def build():
    FACES.clear()
    # 脚：太ももが太く、足元へ細く。足裏は平ら
    for s in (1, -1):
        z = s * 1.15
        taper((-0.15, 4.85, z + s * 0.08), (2.75, 2.5, 2.5), SKIN, neg=(0.72, 0.76), pos=(0.92, 0.95))
        taper((0.12, 3.5, z), (2.0, 0.75, 1.9), SKIN_D, neg=(0.88, 0.9), pos=(0.95, 0.95))
        taper((0.08, 2.05, z), (1.9, 2.55, 1.8), SKIN, neg=(0.66, 0.7), shift=-0.05)
        taper((0.35, 0.38, z), (3.2, 0.76, 1.8), SKIN_D, pos=(0.66, 0.8), shift=-0.1)
        taper((-0.75, 0.36, z), (0.9, 0.72, 1.5), SKIN_D, axis="x", neg=(0.7, 0.8))
        for tz in (-0.55, 0.0, 0.55):
            spike((1.75, 0.3, z + tz), (2.95, 0.12, z + tz * 1.18), 0.26, TEETH)
    # 胴：腰が太く肩へ絞る
    taper((-0.25, 6.0, 0), (3.0, 1.45, 3.75), SKIN_D, neg=(0.85, 0.9))
    taper((-0.05, 7.15, 0), (2.9, 1.8, 3.5), SKIN, pos=(0.95, 0.95))
    taper((1.12, 7.1, 0), (0.6, 1.6, 2.6), BELLY, neg=(0.9, 0.85), shift=0.08)
    taper((0.15, 8.7, 0), (3.2, 2.4, 3.9), SKIN, pos=(0.8, 0.78), shift=0.04)
    taper((1.38, 8.6, 0), (0.6, 2.1, 3.0), BELLY, pos=(0.85, 0.7), shift=-0.2)
    taper((0.2, 9.95, 0), (2.4, 0.55, 3.0), SKIN_D, pos=(0.72, 0.66))
    # 背びれ：中央列＋左右列（互い違い）
    for (x, y, h, w, lean) in BACK_FINS:
        fin((x + 0.15, y, 0), h, w, lean, t=0.24)
    for i in range(len(BACK_FINS) - 1):
        x, y, h, w, lean = BACK_FINS[i]
        x2, y2, h2, w2, lean2 = BACK_FINS[i + 1]
        for s in (-1, 1):
            fin(((x + x2) / 2 + 0.2, (y + y2) / 2, s * 0.66), (h + h2) / 2 * 0.72, (w + w2) / 2 * 0.72,
                (lean + lean2) / 2, out=s * 0.32, col=FIN_D, t=0.18)
    # 尾：節ごとに次の節の太さへ絞る
    for i, (tx, ty, sx, sy, sz, fs) in enumerate(TAIL):
        nxt = TAIL[i + 1] if i + 1 < len(TAIL) else None
        ny = min(1, (nxt[3] / sy) * 1.08) if nxt else 0.6
        nz = min(1, (nxt[4] / sz) * 1.08) if nxt else 0.6
        taper((tx, ty, 0), (sx + 0.25, sy, sz), SKIN, axis="x", neg=(ny, nz), shift=0.04)
        top = ty + sy / 2
        for j, k in enumerate((0.22, -0.28)):
            fin((tx + sx * k, top - 0.12 - k * 0.15, 0), fs * (0.88 if j else 1), fs * 0.62, 0.42, t=0.22)
        for s in (-1, 1):
            fin((tx - sx * 0.02, top - 0.2, s * sz * 0.22), fs * 0.7, fs * 0.48, 0.42, out=s * 0.3, col=FIN_D, t=0.18)
    spike((-11.3, 3.98, 0), (-12.6, 4.1, 0), 0.34, SKIN)
    # 腕
    for s in (1, -1):
        z = s * 2.3
        taper((0.25, 9.45, z), (2.0, 1.5, 1.45), SKIN, neg=(0.75, 0.85), pos=(0.85, 0.9))
        taper((0.25, 8.2, z), (1.3, 1.75, 1.3), SKIN, neg=(0.75, 0.78))
        taper((0.25, 7.25, z), (1.0, 0.6, 1.0), SKIN_D, neg=(0.85, 0.85))
        taper((0.34, 6.05, z + s * 0.06), (1.5, 1.9, 1.5), SKIN, neg=(0.68, 0.72), shift=-0.04)
        taper((0.4, 4.9, z + s * 0.06), (1.1, 0.65, 1.15), SKIN_D, neg=(0.8, 0.85))
        for tz in (-0.38, -0.13, 0.13, 0.38):
            spike((0.72, 4.62, z + s * 0.06 + tz), (1.14, 4.02, z + s * 0.06 + tz * 1.25), 0.16, TEETH)
    # 頭：吻が前に出て、下顎とつながる
    taper((0.45, 10.25, 0), (1.7, 1.15, 1.75), SKIN_D, pos=(0.82, 0.85), shift=0.08)
    taper((1.25, 10.95, 0), (1.9, 1.3, 1.7), SKIN, axis="x", neg=(0.85, 0.92), pos=(0.78, 0.85), shift=-0.08)
    taper((1.55, 11.62, 0), (1.5, 0.36, 1.6), SKIN_D, axis="x", neg=(0.8, 0.9), pos=(0.6, 0.85), shift=-0.28)
    fin((0.6, 11.55, 0), 0.7, 0.55, 0.5, col=FIN_D, t=0.18)
    for s in (-1, 1):
        taper((1.98, 11.08, s * 0.8), (0.55, 0.2, 0.08), EYE, axis="x", pos=(0.7, 1), shift=-0.15)
        spike((0.5, 11.15, s * 0.78), (0.1, 11.42, s * 1.0), 0.2, SKIN_D)
    taper((2.6, 10.72, 0), (2.0, 0.72, 1.35), SKIN, axis="x", pos=(0.72, 0.7), shift=-0.1)
    taper((3.55, 10.76, 0), (0.4, 0.42, 0.9), SKIN_D, axis="x", pos=(0.7, 0.7), shift=-0.05)
    # 少し開いた口
    jaw = -0.22
    taper((2.45, 10.32, 0), (1.9, 0.3, 1.0), MOUTH, axis="x", pos=(0.75, 0.8))
    for k, tx in enumerate((2.05, 2.5, 2.92, 3.3)):
        for s in (-1, 1):
            taper((tx, 10.32, s * (0.42 - k * 0.04)), (0.16, 0.26, 0.16), TEETH, neg=(0.4, 0.4))
    pivot = np.array([1.45, 10.2, 0.0])

    def jaw_part(p, s, col, **kw):
        q = rot(np.array(p, float) - pivot, rz=jaw) + pivot
        taper(tuple(q), s, col, rz=jaw, **kw)

    jaw_part((1.4, 10.05, 0), (0.9, 0.6, 1.4), SKIN_D, axis="x", pos=(0.85, 0.9))
    jaw_part((2.42, 10.13, 0), (1.8, 0.12, 0.95), MOUTH, axis="x", pos=(0.7, 0.75))
    jaw_part((2.4, 9.96, 0), (2.05, 0.42, 1.15), SKIN_D, axis="x", pos=(0.6, 0.7), shift=0.08)


build()

# ---------------- 描画 ----------------
CENTER = np.array([-2.5, 6.0, 0.0])
SCALE = 58.0
TILT = 0.2


def make_bg():
    bg = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(bg)
    top, bot = np.array([13, 18, 32], float), np.array([8, 11, 20], float)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=tuple((top + (bot - top) * (y / H)).astype(int)))
    spot = Image.new("L", (W, H), 0)
    ImageDraw.Draw(spot).ellipse([60, 520, 1020, 1480], fill=70)
    return Image.composite(Image.new("RGB", (W, H), (52, 64, 90)), bg, spot.point(lambda v: v // 3))


BG = make_bg()


def view(v, th):
    return rot(rot(v - CENTER, ry=th), rx=TILT)


def proj(v):
    persp = 1.0 / (1.0 - v[2] * 0.0065)
    return (540 + v[0] * SCALE * persp, 1060 - v[1] * SCALE * persp)


def render(th, title=True):
    img = BG.copy()
    d = ImageDraw.Draw(img, "RGBA")
    # 地面の影（光の向きに沿って足元へ投影した楕円）
    sx, _ = proj(view(np.array([-3.0, 0.0, 0.0]), th))
    _, sy = proj(view(np.array([0.0, 0.0, 0.0]), th))
    d.ellipse([sx - 380, sy - 40, sx + 380, sy + 50], fill=(0, 0, 0, 110))
    faces = []
    for verts, col, glow in FACES:
        rv = [view(v, th) for v in verts]
        n = np.cross(rv[1] - rv[0], rv[2] - rv[0])
        ln = np.linalg.norm(n)
        if ln < 1e-9:
            continue
        n /= ln
        # 裏向きの面は飛ばす（背びれの板は両面）
        if n[2] < 0 and not glow:
            continue
        shade = 0.42 + 0.58 * max(0.0, float(np.dot(n if n[2] >= 0 else -n, LIGHT)))
        c = tuple(int(min(255, ch * shade)) for ch in col)
        faces.append((float(np.mean([v[2] for v in rv])), [proj(v) for v in rv], c))
    faces.sort(key=lambda e: e[0])
    for _, pts, c in faces:
        d.polygon(pts, fill=c, outline=c)
    if title and FONT:
        d.text((540, 120), "オリジナル怪獣  ローポリ", font=ImageFont.truetype(FONT, 58), fill=(240, 243, 248), anchor="ma")
        d.text((540, 205), "Python（numpy + PIL）だけで描画", font=ImageFont.truetype(FONT, 32), fill=(198, 164, 90), anchor="ma")
    return img


if __name__ == "__main__":
    if os.environ.get("STILL"):
        for name, th in (("front", -math.pi / 2), ("three_quarter", -1.0), ("side", 0.0), ("back", math.pi - 1.0)):
            render(th).save(os.path.join(OUT, f"still_{name}.png"))
        print("静止画を書き出しました:", OUT)
    else:
        secs = float(os.environ.get("SECONDS", "10"))
        frames = int(secs * FPS)
        fdir = os.path.join(OUT, "frames")
        os.makedirs(fdir, exist_ok=True)
        for i in range(frames):
            t = i / frames
            th = -1.0 + 2 * math.pi * (t * t * (3 - 2 * t))  # なめらかに1回転
            render(th).save(os.path.join(fdir, f"f{i:04d}.png"))
            if i % 60 == 0:
                print(f"frame {i}/{frames}", flush=True)
        mp4 = os.path.join(OUT, "kaiju_lowpoly.mp4")
        if shutil.which("ffmpeg"):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", os.path.join(fdir, "f%04d.png"),
                            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", mp4], check=True)
            print("動画を書き出しました:", mp4)
        else:
            print("ffmpeg が無いので連番PNGのみ:", fdir)
