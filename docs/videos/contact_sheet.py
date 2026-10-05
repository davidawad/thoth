"""Extract frames from an MP4 and tile them into a contact sheet PNG (verification aid).
usage: contact_sheet.py video.mp4 out.png t1 t2 t3 ...   (seconds)"""
import subprocess, sys, tempfile, pathlib
from PIL import Image

video, out, *ts = sys.argv[1:]
tmp = pathlib.Path(tempfile.mkdtemp())
ims = []
for t in ts:
    p = tmp / f"{t}.png"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", t, "-i", video, "-frames:v", "1", str(p)], check=True)
    ims.append(Image.open(p).resize((800, 450)))
cols = 2
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (800 * cols, 450 * rows))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * 800, (i // cols) * 450))
sheet.save(out)
