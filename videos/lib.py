"""Tiny stop-motion paper-cutout engine: PIL frames at 10fps, jitter every frame, encode with ffmpeg."""
import math, random, subprocess, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1920, 1080, 10
SUP = "/System/Library/Fonts/Supplemental/"
HAND = SUP + "Bradley Hand Bold.ttf"
TYPE = SUP + "AmericanTypewriter.ttc"
CHALK = SUP + "Chalkduster.ttf"

PAPER = (243, 232, 208)
INK = (34, 30, 38)
PALETTE = dict(red=(224, 82, 60), blue=(70, 120, 200), yellow=(247, 201, 72),
               green=(96, 170, 110), pink=(236, 140, 170), teal=(60, 160, 160),
               ink=INK, white=(252, 249, 240), orange=(238, 134, 52), purple=(130, 96, 180))

_fonts = {}


def font(path, size):
    k = (path, size)
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(path, size)
    return _fonts[k]


def make_texture():
    rng = np.random.default_rng(7)
    n = rng.normal(0, 1, (H + 80, W + 80)).astype(np.float32)
    img = Image.fromarray(np.clip(128 + n * 40, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    coarse = Image.fromarray(np.clip(128 + rng.normal(0, 1, (30, 50)) * 40, 0, 255).astype(np.uint8)).resize(
        (W + 80, H + 80), Image.BICUBIC)
    a = (np.asarray(img, np.float32) - 128) * 0.07 + (np.asarray(coarse, np.float32) - 128) * 0.03
    return a


TEX = make_texture()


def background(rng, base=PAPER):
    """Paper with a 'boiling' texture: the grain shifts a few px each frame."""
    ox, oy = rng.randrange(0, 80), rng.randrange(0, 80)
    t = TEX[oy:oy + H, ox:ox + W, None]
    arr = np.clip(np.array(base, np.float32)[None, None, :] + t * 3.0, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB").convert("RGBA")


def torn_poly(w, h, seed, rough=5):
    r = random.Random(seed)
    pts = []
    step = 38
    for x in range(0, w, step):
        pts.append((x, r.uniform(0, rough)))
    for y in range(0, h, step):
        pts.append((w + r.uniform(-rough, 0), y))
    for x in range(w, 0, -step):
        pts.append((x, h + r.uniform(-rough, 0)))
    for y in range(h, 0, -step):
        pts.append((r.uniform(0, rough), y))
    return pts


def cutout(lines, size=64, fnt=HAND, color="yellow", ink=INK, pad=34, seed=1, minw=0, align="center", rough=5,
           line_gap=1.15):
    """A torn paper scrap with text. Returns an RGBA sprite (unrotated)."""
    f = font(fnt, size)
    lines = lines if isinstance(lines, (list, tuple)) else [lines]
    dummy = ImageDraw.Draw(Image.new("RGB", (4, 4)))
    ws = [dummy.textlength(l, font=f) for l in lines]
    lh = int(size * line_gap)
    w = int(max(max(ws), minw)) + pad * 2
    h = lh * len(lines) + pad * 2
    spr = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(spr)
    fill = PALETTE.get(color, color)
    d.polygon(torn_poly(w, h, seed, rough), fill=fill + (255,))
    for i, l in enumerate(lines):
        x = (w - ws[i]) / 2 if align == "center" else pad
        d.text((x, pad + i * lh - size * 0.05), l, font=f, fill=ink)
    return spr


def with_shadow(spr, off=8, blur=6, alpha=90):
    pad = blur * 3 + off
    out = Image.new("RGBA", (spr.width + pad * 2, spr.height + pad * 2), (0, 0, 0, 0))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
    sh.paste((40, 30, 20, alpha), (pad + off, pad + off), spr.split()[3])
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    out.alpha_composite(sh)
    out.alpha_composite(spr, (pad, pad))
    return out


def place(canvas, spr, cx, cy, angle=0.0, rng=None, jit=4, rot_jit=0.9, scale=1.0, shadow=True):
    """Paste sprite centred at (cx,cy) with per-frame hand-moved jitter."""
    if rng is not None:
        cx += rng.uniform(-jit, jit)
        cy += rng.uniform(-jit, jit)
        angle += rng.uniform(-rot_jit, rot_jit)
    s = with_shadow(spr) if shadow else spr
    if scale != 1.0:
        s = s.resize((max(1, int(s.width * scale)), max(1, int(s.height * scale))), Image.BICUBIC)
    s = s.rotate(angle, resample=Image.BICUBIC, expand=True)
    canvas.alpha_composite(s, (int(cx - s.width / 2), int(cy - s.height / 2)))


def text(canvas, s, x, y, size=60, fnt=HAND, fill=INK, rng=None, jit=2, anchor="mm"):
    if rng is not None:
        x += rng.uniform(-jit, jit)
        y += rng.uniform(-jit, jit)
    ImageDraw.Draw(canvas).text((x, y), s, font=font(fnt, size), fill=fill, anchor=anchor)


def rect_scrap(w, h, color, seed, rough=6):
    spr = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(spr).polygon(torn_poly(w, h, seed, rough), fill=PALETTE.get(color, color) + (255,))
    return spr


# ---- animation helpers (all quantised by the 10fps clock => stop-motion steps)
def clamp(x):
    return max(0.0, min(1.0, x))


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def on_twos(t, hold=2):
    """Quantise time to every `hold` frames -> chunky hand-moved steps."""
    f = int(t * FPS)
    return (f // hold) * hold / FPS


def pop(t, t0, dur=0.4):
    """Scale 0 -> overshoot -> 1 (easeOutBack): a sticker slapped onto the table."""
    if t < t0:
        return 0.0
    x = clamp((t - t0) / dur)
    c1 = 1.70158
    return 1 + (c1 + 1) * (x - 1) ** 3 + c1 * (x - 1) ** 2


# ---- rendering
_JOBS = []


def _frame(n):
    fn, t, dur, tmp = _JOBS[n]
    rng = random.Random(n * 100003)
    canvas = background(rng, fn.__dict__.get("bg", PAPER))
    fn(canvas, t, rng, dur)
    canvas.convert("RGB").save(tmp / f"f{n:05d}.png", compress_level=1)


def render(scenes, out_path, tmp_dir):
    """scenes: list of (duration_s, fn(canvas, t_local, rng, duration)). Frames render in parallel (fork)."""
    import multiprocessing as mp
    tmp = pathlib.Path(tmp_dir)
    tmp.mkdir(parents=True, exist_ok=True)
    for p in tmp.glob("*.png"):
        p.unlink()
    _JOBS.clear()
    for dur, fn in scenes:
        for i in range(int(round(dur * FPS))):
            _JOBS.append((fn, i / FPS, dur, tmp))
    with mp.get_context("fork").Pool() as pool:
        pool.map(_frame, range(len(_JOBS)), chunksize=4)
    n = len(_JOBS)
    out = pathlib.Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(tmp / "f%05d.png"),
                    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS),
                    "-movflags", "+faststart", str(out)], check=True)
    print(f"{out}  {n} frames  {n / FPS:.1f}s")
    return n


def bg(color):
    def deco(fn):
        fn.bg = PALETTE.get(color, color)
        return fn
    return deco
