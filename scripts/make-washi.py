# 歴史ch（切り絵）の和紙テクスチャを作る。毎フレームのSVGノイズ生成は描画が崩れる原因になるため、画像にして貼る
#   public/jimmu/washi_bg.jpg     台紙（色むら＋繊維）不透明
#   public/jimmu/washi_fibers.png 画面の一番上に重ねる繊維（半透明）
import numpy as np
from PIL import Image, ImageFilter

W, H = 1080, 1920
rng = np.random.default_rng(7)

def blur_noise(scale, sigma):
    n = rng.random((H // scale + 2, W // scale + 2)).astype(np.float32)
    img = Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(sigma))
    return np.asarray(img).astype(np.float32) / 255.0

def fibers(count, length, alpha):
    layer = Image.new("L", (W, H), 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(layer)
    for _ in range(count):
        x, y = rng.random() * W, rng.random() * H
        ang = rng.normal(np.pi / 2, 0.5)  # 縦方向の繊維が多め
        L = length * (0.4 + rng.random())
        pts = []
        for k in range(6):
            t = k / 5
            pts.append((x + np.cos(ang) * L * t + rng.normal(0, 2), y + np.sin(ang) * L * t + rng.normal(0, 2)))
        d.line(pts, fill=int(alpha * (0.4 + rng.random() * 0.6)), width=1)
    return np.asarray(layer.filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255.0

base = np.array([0xE6, 0xDA, 0xC0], np.float32)
blot = blur_noise(40, 30) - 0.5
grain = rng.normal(0, 1, (H, W)).astype(np.float32)
img = base[None, None, :] + blot[..., None] * np.array([26, 24, 20]) + grain[..., None] * 3.0
fib = fibers(5000, 60, 255)
img = img - fib[..., None] * np.array([28, 32, 38]) * 0.6 + fibers(2500, 40, 255)[..., None] * 18
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save("public/jimmu/washi_bg.jpg", quality=92)

# 上に重ねる繊維：白っぽい繊維と茶色い繊維
light = fibers(3500, 50, 255)
dark = fibers(2000, 45, 255)
rgba = np.zeros((H, W, 4), np.float32)
rgba[..., :3] = np.where(light[..., None] >= dark[..., None], [250, 244, 230], [110, 85, 55])
rgba[..., 3] = np.clip(np.maximum(light * 0.55, dark * 0.35) * 255, 0, 255)
Image.fromarray(rgba.astype(np.uint8), "RGBA").save("public/jimmu/washi_fibers.png", optimize=True)
print("ok")
